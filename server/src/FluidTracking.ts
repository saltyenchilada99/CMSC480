import { BusRoute, findBestMatchingRoute, LatLng } from './BusRoute';
import { VehicleLocation } from './VZConnectAPICalls';

interface BusSample {
    timestampMs: number;
    receivedAtMs: number;
    location: VehicleLocation;
    routeName?: string;
    routeProgressMeters?: number;
    snappedPoint?: LatLng;
    distanceToRouteMeters?: number;
}

export interface FluidTrackingOptions {
    delayMs?: number;
    maxSampleAgeMs?: number;
    maxFutureSkewMs?: number;
    routeCaptureDistanceMeters?: number;
    routeReleaseDistanceMeters?: number;
    adaptiveDelayBufferMs?: number;
    minInterpolationDurationMs?: number;
}

export class FluidTrackingEngine {
    private readonly routes: BusRoute[];
    private readonly delayMs: number;
    private readonly maxSampleAgeMs: number;
    private readonly maxFutureSkewMs: number;
    private readonly routeCaptureDistanceMeters: number;
    private readonly routeReleaseDistanceMeters: number;
    private readonly adaptiveDelayBufferMs: number;
    private readonly minInterpolationDurationMs: number;
    private readonly historyByBus = new Map<string, BusSample[]>();

    constructor(routes: BusRoute[], options: FluidTrackingOptions = {}) {
        this.routes = routes;
        this.delayMs = options.delayMs ?? 30_000;
        this.maxSampleAgeMs = options.maxSampleAgeMs ?? 10 * 60 * 1000;
        this.maxFutureSkewMs = options.maxFutureSkewMs ?? 60_000;
        this.routeCaptureDistanceMeters = options.routeCaptureDistanceMeters ?? 225;
        this.routeReleaseDistanceMeters = options.routeReleaseDistanceMeters ?? 325;
        this.adaptiveDelayBufferMs = options.adaptiveDelayBufferMs ?? 2_000;
        this.minInterpolationDurationMs = options.minInterpolationDurationMs ?? 30_000;
    }

    ingestLocations(locations: VehicleLocation[]): void {
        const now = Date.now();
        for (const location of locations) {
            const id = location.VehicleNumber;
            if (!id) continue;

            const parsedTs = this.parseProviderTimestamp(location.LastUpdated, now);
            const existing = this.historyByBus.get(id) ?? [];
            const lastTs = existing.length > 0 ? existing[existing.length - 1].timestampMs : 0;

            let timestamp = Number.isFinite(parsedTs) ? parsedTs : now;

            // Guard against provider timestamps that are ahead of our server clock
            // (timezone formatting issues, clock skew, etc). Future-dated samples
            // can make target playback time always "before first sample", which
            // visually freezes markers at the initial ping.
            if (timestamp > now + this.maxFutureSkewMs) {
                timestamp = now;
            }

            // Some providers can repeat stale/non-advancing source timestamps even when
            // new samples arrive. Ensure monotonic internal timestamps so interpolation
            // can still progress smoothly over time.
            // Keep interpolation time tied to server ingest cadence (when samples
            // actually arrive), while still preserving provider time on payloads.
            // This avoids long pauses followed by rapid jumps when provider
            // LastUpdated timestamps are stale, malformed, or bursty.
            const receivedAtMs = now;
            timestamp = Math.max(receivedAtMs, lastTs + 1);

            const point = { lat: location.Latitude, lng: location.Longitude };
            const nearest = findBestMatchingRoute(this.routes, point, false);

            const previous = existing.length > 0 ? existing[existing.length - 1] : undefined;
            const previousRouteName = previous?.routeName;

            let routeName: string | undefined;
            let routeProgressMeters: number | undefined;
            let snappedPoint: LatLng | undefined;
            let distanceToRouteMeters: number | undefined;

            if (nearest.route && nearest.projection) {
                const captureDistance = Math.max(
                    nearest.route.boundaryMeters,
                    this.routeCaptureDistanceMeters
                );
                const releaseDistance = Math.max(
                    captureDistance,
                    this.routeReleaseDistanceMeters
                );

                const distance = nearest.projection.distanceToRouteMeters;
                const inCapture = distance <= captureDistance;
                const stickyOnSameRoute =
                    previousRouteName === nearest.route.name && distance <= releaseDistance;

                if (inCapture || stickyOnSameRoute) {
                    routeName = nearest.route.name;
                    routeProgressMeters = nearest.projection.progressMeters;
                    snappedPoint = nearest.projection.snappedPoint;
                    distanceToRouteMeters = distance;
                }
            }

            const sample: BusSample = {
                timestampMs: timestamp,
                receivedAtMs,
                location,
                routeName,
                routeProgressMeters,
                snappedPoint,
                distanceToRouteMeters
            };

            const dupIndex = existing.findIndex(item => item.timestampMs === sample.timestampMs);
            if (dupIndex >= 0) {
                existing[dupIndex] = sample;
            } else {
                existing.push(sample);
            }

            existing.sort((a, b) => a.timestampMs - b.timestampMs);

            const minAllowedTs = now - this.maxSampleAgeMs;
            const pruned = existing.filter(item => item.timestampMs >= minAllowedTs);
            this.historyByBus.set(id, pruned);
        }
    }

    private parseProviderTimestamp(value: string, nowMs: number): number {
        if (!value) return NaN;

        const hasTimezone = /(?:Z|[+\-]\d{2}:?\d{2})$/i.test(value);
        if (hasTimezone) {
            return Date.parse(value);
        }

        // Some providers omit timezone in LastUpdated. Depending on feed/config,
        // that value may represent either local time or UTC. Parse both and pick
        // the one that best matches "now" so we avoid either future-dated freezes
        // or hours-old timestamps that pin the marker in place.
        const localTs = Date.parse(value);
        const utcTs = Date.parse(`${value}Z`);

        const localValid = Number.isFinite(localTs);
        const utcValid = Number.isFinite(utcTs);

        if (localValid && utcValid) {
            const localDelta = Math.abs(nowMs - localTs);
            const utcDelta = Math.abs(nowMs - utcTs);
            return localDelta <= utcDelta ? localTs : utcTs;
        }

        if (localValid) return localTs;
        if (utcValid) return utcTs;
        return NaN;
    }

    getDisplayLocations(nowMs = Date.now()): VehicleLocation[] {
        const smoothed: VehicleLocation[] = [];

        this.historyByBus.forEach((samples) => {
            if (samples.length === 0) return;

            const effectiveDelay = this.computeEffectiveDelayMs(samples);
            const targetTs = nowMs - effectiveDelay;

            const pair = this.findBracketSamples(samples, targetTs);
            if (!pair) return;

            const { prev, next } = pair;

            if (prev.timestampMs === next.timestampMs) {
                smoothed.push(this.sampleToDisplayLocation(prev, prev.timestampMs, prev));
                return;
            }

            const segmentDurationMs = Math.max(
                next.timestampMs - prev.timestampMs,
                this.minInterpolationDurationMs,
                1
            );

            const ratio = Math.max(0, Math.min(1, (targetTs - prev.timestampMs) / segmentDurationMs));

            smoothed.push(this.interpolateSamples(prev, next, ratio, targetTs));
        });

        return smoothed;
    }

    private findBracketSamples(samples: BusSample[], targetTs: number): { prev: BusSample; next: BusSample } | null {
        if (samples.length === 0) return null;
        if (samples.length === 1) return { prev: samples[0], next: samples[0] };

        let prev = samples[0];
        let next = samples[samples.length - 1];

        for (let i = 0; i < samples.length; i += 1) {
            const sample = samples[i];
            if (sample.timestampMs <= targetTs) {
                prev = sample;
            }
            if (sample.timestampMs >= targetTs) {
                next = sample;
                break;
            }
        }

        if (targetTs <= samples[0].timestampMs) {
            return { prev: samples[0], next: samples[0] };
        }

        if (targetTs >= samples[samples.length - 1].timestampMs) {
            const last = samples[samples.length - 1];
            return { prev: last, next: last };
        }

        return { prev, next };
    }

    private interpolateSamples(prev: BusSample, next: BusSample, ratio: number, displayTs: number): VehicleLocation {
        const sameRoute = prev.routeName && next.routeName && prev.routeName === next.routeName;
        let latitude = prev.location.Latitude + (next.location.Latitude - prev.location.Latitude) * ratio;
        let longitude = prev.location.Longitude + (next.location.Longitude - prev.location.Longitude) * ratio;
        let distanceToRouteMeters: number | undefined;

        if (
            sameRoute &&
            prev.routeProgressMeters != null &&
            next.routeProgressMeters != null &&
            prev.distanceToRouteMeters != null &&
            next.distanceToRouteMeters != null &&
            prev.distanceToRouteMeters <= this.routeReleaseDistanceMeters &&
            next.distanceToRouteMeters <= this.routeReleaseDistanceMeters
        ) {
            const route = this.routes.find(item => item.name === prev.routeName);
            if (route) {
                const total = route.getTotalMeters();
                const start = prev.routeProgressMeters;
                const end = next.routeProgressMeters;
                const elapsedMs = Math.max(1, next.timestampMs - prev.timestampMs);
                const delta = this.resolveRouteDeltaMeters(start, end, total, prev, next, elapsedMs);
                const progress = start + delta * ratio;
                const snapped = route.interpolateProgress(progress);
                latitude = snapped.lat;
                longitude = snapped.lng;

                const bestMatch = findBestMatchingRoute([route], snapped, false);
                distanceToRouteMeters = bestMatch.projection?.distanceToRouteMeters;
            }
        }

        const heading = this.interpolateAngle(prev.location.Heading, next.location.Heading, ratio);
        const speed = prev.location.Speed + (next.location.Speed - prev.location.Speed) * ratio;

        return {
            ...next.location,
            Latitude: latitude,
            Longitude: longitude,
            Heading: heading,
            Speed: Number(speed.toFixed(1)),
            LastUpdated: new Date(displayTs).toISOString(),
            RawLastUpdated: next.location.LastUpdated,
            RouteName: sameRoute ? prev.routeName : (next.routeName ?? prev.routeName),
            IsSmoothed: true,
            DisplayTimestamp: new Date(displayTs).toISOString(),
            DistanceToRouteMeters: distanceToRouteMeters
        };
    }

    private sampleToDisplayLocation(sample: BusSample, displayTs: number, source: BusSample): VehicleLocation {
        return {
            ...sample.location,
            Latitude: sample.routeName ? (sample.snappedPoint?.lat ?? sample.location.Latitude) : sample.location.Latitude,
            Longitude: sample.routeName ? (sample.snappedPoint?.lng ?? sample.location.Longitude) : sample.location.Longitude,
            LastUpdated: new Date(displayTs).toISOString(),
            RawLastUpdated: source.location.LastUpdated,
            RouteName: sample.routeName,
            IsSmoothed: true,
            DisplayTimestamp: new Date(displayTs).toISOString(),
            DistanceToRouteMeters: sample.distanceToRouteMeters
        };
    }

    private resolveRouteDeltaMeters(
        start: number,
        end: number,
        totalMeters: number,
        prev: BusSample,
        next: BusSample,
        elapsedMs: number
    ): number {
        if (totalMeters <= 0) {
            return end - start;
        }

        // Use the shortest signed movement around the loop instead of always
        // wrapping forward. This prevents "speed run then freeze" behavior when
        // route projection jitters across segment boundaries.
        let delta = end - start;
        if (delta > totalMeters / 2) {
            delta -= totalMeters;
        } else if (delta < -totalMeters / 2) {
            delta += totalMeters;
        }

        // Clamp movement to a physically plausible distance based on bus speed
        // over the sample interval, with a safety multiplier for noisy speed data.
        const avgMph = Math.max(0, (prev.location.Speed + next.location.Speed) / 2);
        const avgMetersPerSecond = avgMph * 0.44704;
        const intervalSeconds = elapsedMs / 1000;
        const plausibleMeters = Math.max(25, avgMetersPerSecond * intervalSeconds * 2.5);

        if (Math.abs(delta) > plausibleMeters) {
            delta = Math.sign(delta) * plausibleMeters;
        }

        return delta;
    }

    private computeEffectiveDelayMs(samples: BusSample[]): number {
        if (samples.length < 3) {
            return this.delayMs;
        }

        const intervals: number[] = [];
        for (let i = 1; i < samples.length; i += 1) {
            const diff = samples[i].receivedAtMs - samples[i - 1].receivedAtMs;
            if (diff > 0) {
                intervals.push(diff);
            }
        }

        if (intervals.length === 0) {
            return this.delayMs;
        }

        const sorted = [...intervals].sort((a, b) => a - b);
        const p90 = sorted[Math.floor((sorted.length - 1) * 0.9)];
        const recentMax = Math.max(...intervals.slice(-6));
        const adaptiveDelay = Math.max(p90, recentMax) + this.adaptiveDelayBufferMs;
        return Math.max(this.delayMs, adaptiveDelay);
    }

    private interpolateAngle(startDeg: number, endDeg: number, ratio: number): number {
        const a = ((startDeg % 360) + 360) % 360;
        const b = ((endDeg % 360) + 360) % 360;
        let delta = b - a;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return (a + delta * ratio + 360) % 360;
    }
}
