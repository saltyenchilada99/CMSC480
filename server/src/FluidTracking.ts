import { BusRoute, findBestMatchingRoute, LatLng } from './BusRoute';
import { VehicleLocation } from './VZConnectAPICalls';

/**
 * Server-side fluid tracking engine.
 *
 * Verizon Connect updates arrive in bursts rather than animation frames. This
 * engine keeps a short history per bus, chooses an adaptive playback delay based
 * on the actual update cadence, and returns interpolated display locations for
 * the WebSocket broadcaster.
 */

/** Internal timestamped sample used for interpolation and route locking. */
interface BusSample {
    timestampMs: number;
    receivedAtMs: number;
    location: VehicleLocation;
    displayStatus: VehicleLocation['Status'];
    routeName?: string;
    routeProgressMeters?: number;
    snappedPoint?: LatLng;
    distanceToRouteMeters?: number;
}

/** Tuning options for smoothing, sample retention, and route lock behavior. */
export interface FluidTrackingOptions {
    /** Fallback delay used before enough samples exist to learn update cadence. */
    delayMs?: number;
    /** Maximum sample age retained per bus. */
    maxSampleAgeMs?: number;
    /** Allowed provider clock skew before a sample is treated as current time. */
    maxFutureSkewMs?: number;
    /** Distance from a route where a bus can first lock to that route. */
    routeCaptureDistanceMeters?: number;
    /** Distance from a route where an already-locked bus is released. */
    routeReleaseDistanceMeters?: number;
    /** Extra buffer added to the latest update interval for smoother playback. */
    adaptiveDelayBufferMs?: number;
    /** Lower bound for adaptive smoothing delay. */
    minAdaptiveDelayMs?: number;
    /** Upper bound for adaptive smoothing delay. */
    maxAdaptiveDelayMs?: number;
}

/** Last good emitted point, used to avoid disappearing markers during gaps. */
type LastDisplayLocation = {
    location: VehicleLocation;
    emittedAtMs: number;
};

const MIN_MOVING_SAMPLE_DISTANCE_METERS = 6;

/**
 * Maintains per-bus histories and produces route-aware display locations.
 */
export class FluidTrackingEngine {
    private readonly routes: BusRoute[];
    private readonly routeByName: Map<string, BusRoute>;
    private readonly delayMs: number;
    private readonly maxSampleAgeMs: number;
    private readonly maxFutureSkewMs: number;
    private readonly routeCaptureDistanceMeters: number;
    private readonly routeReleaseDistanceMeters: number;
    private readonly adaptiveDelayBufferMs: number;
    private readonly minAdaptiveDelayMs: number;
    private readonly maxAdaptiveDelayMs: number;
    private readonly historyByBus = new Map<string, BusSample[]>();
    private readonly lastDisplayByBus = new Map<string, LastDisplayLocation>();

    /** Creates an engine with route definitions and smoothing options. */
    constructor(routes: BusRoute[], options: FluidTrackingOptions = {}) {
        this.routes = routes;
        // Route lookup is hot during interpolation; cache by name once.
        this.routeByName = new Map(routes.map(route => [route.name, route]));
        this.delayMs = options.delayMs ?? 30_000;
        this.maxSampleAgeMs = options.maxSampleAgeMs ?? 10 * 60 * 1000;
        this.maxFutureSkewMs = options.maxFutureSkewMs ?? 60_000;
        this.routeCaptureDistanceMeters = options.routeCaptureDistanceMeters ?? 225;
        this.routeReleaseDistanceMeters = options.routeReleaseDistanceMeters ?? 325;
        this.adaptiveDelayBufferMs = options.adaptiveDelayBufferMs ?? 2_000;
        this.minAdaptiveDelayMs = Math.max(0, options.minAdaptiveDelayMs ?? 5_000);
        this.maxAdaptiveDelayMs = Math.max(
            this.minAdaptiveDelayMs,
            options.maxAdaptiveDelayMs ?? Math.max(this.delayMs * 4, 120_000)
        );
    }

    /** Adds the newest raw GPS locations to each bus history. */
    ingestLocations(locations: VehicleLocation[]): void {
        const now = Date.now();
        for (const location of locations) {
            const id = location.VehicleNumber;
            if (!id) continue;
            if (!this.isValidLocation(location)) continue;

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

            // Keep interpolation time tied to server ingest cadence (when samples
            // actually arrive), while still preserving provider time on payloads.
            // This avoids long pauses followed by rapid jumps when provider
            // LastUpdated timestamps are stale, malformed, or bursty.
            const receivedAtMs = now;
            timestamp = Math.max(receivedAtMs, lastTs + 1);

            const previous = existing.length > 0 ? existing[existing.length - 1] : undefined;
            const previousRouteName = previous?.routeName;
            const point = { lat: location.Latitude, lng: location.Longitude };
            const stickyRoute = previousRouteName ? this.routeByName.get(previousRouteName) : undefined;
            const stickyProjection = stickyRoute?.project(point);
            const nearest = findBestMatchingRoute(this.routes, point, false);

            let routeName: string | undefined;
            let routeProgressMeters: number | undefined;
            let snappedPoint: LatLng | undefined;
            let distanceToRouteMeters: number | undefined;

            if (
                stickyRoute &&
                stickyProjection &&
                stickyProjection.distanceToRouteMeters <= Math.max(stickyRoute.boundaryMeters, this.routeReleaseDistanceMeters)
            ) {
                routeName = stickyRoute.name;
                routeProgressMeters = stickyProjection.progressMeters;
                snappedPoint = stickyProjection.snappedPoint;
                distanceToRouteMeters = stickyProjection.distanceToRouteMeters;
            } else if (nearest.route && nearest.projection) {
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
                const stickyOnSameRoute = previousRouteName === nearest.route.name && distance <= releaseDistance;

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
                displayStatus: location.Status,
                routeName,
                routeProgressMeters,
                snappedPoint,
                distanceToRouteMeters
            };
            sample.displayStatus = this.getDisplayStatus(location.Status, previous, sample);

            const dupIndex = existing.findIndex(item => item.timestampMs === sample.timestampMs);
            if (dupIndex >= 0) {
                existing[dupIndex] = sample;
            } else {
                // Internal timestamps are monotonic per bus, so append keeps order.
                existing.push(sample);
            }

            // Trim old history in-place to reduce allocations in the ingest hot path.
            const minAllowedTs = now - this.maxSampleAgeMs;
            let firstValidIndex = 0;
            while (firstValidIndex < existing.length && existing[firstValidIndex].timestampMs < minAllowedTs) {
                firstValidIndex += 1;
            }
            if (firstValidIndex > 0) {
                existing.splice(0, firstValidIndex);
            }

            this.historyByBus.set(id, existing);
        }
    }

    /**
     * Parses provider timestamps defensively.
     *
     * Verizon payloads may include timezone-qualified ISO strings or local-looking
     * timestamps, so this chooses the interpretation nearest the server clock.
     */
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

    /** Returns the current smoothed bus locations for REST/WebSocket clients. */
    getDisplayLocations(nowMs = Date.now()): VehicleLocation[] {
        const smoothed: VehicleLocation[] = [];

        this.historyByBus.forEach((samples, busId) => {
            if (samples.length === 0) return;

            this.pruneExpiredSamples(samples, nowMs);
            if (samples.length === 0) {
                this.historyByBus.delete(busId);
                this.lastDisplayByBus.delete(busId);
                return;
            }

            const effectiveDelay = this.computeEffectiveDelayMs(samples);
            const targetTs = nowMs - effectiveDelay;

            const pair = this.findBracketSamples(samples, targetTs);
            if (!pair) {
                const fallback = this.getRecentDisplayFallback(busId, nowMs);
                if (fallback) smoothed.push(fallback);
                return;
            }

            const { prev, next } = pair;
            let displayLocation: VehicleLocation;

            if (prev.timestampMs === next.timestampMs) {
                displayLocation = this.sampleToDisplayLocation(prev, prev.timestampMs, prev);
            } else {
                const segmentDurationMs = Math.max(next.timestampMs - prev.timestampMs, 1);
                const ratio = Math.max(0, Math.min(1, (targetTs - prev.timestampMs) / segmentDurationMs));
                displayLocation = this.interpolateSamples(prev, next, ratio, targetTs);
            }

            if (this.isValidLocation(displayLocation)) {
                this.lastDisplayByBus.set(busId, { location: displayLocation, emittedAtMs: nowMs });
                smoothed.push(displayLocation);
                return;
            }

            const fallback = this.getRecentDisplayFallback(busId, nowMs);
            if (fallback) smoothed.push(fallback);
        });

        return smoothed;
    }

    /** Locates the two samples surrounding the target playback timestamp. */
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

    /** Interpolates between two samples, preferring route progress when possible. */
    private interpolateSamples(prev: BusSample, next: BusSample, ratio: number, displayTs: number): VehicleLocation {
        const routeMatch = this.getRouteInterpolationMatch(prev, next);
        let latitude = prev.location.Latitude + (next.location.Latitude - prev.location.Latitude) * ratio;
        let longitude = prev.location.Longitude + (next.location.Longitude - prev.location.Longitude) * ratio;
        let distanceToRouteMeters: number | undefined;
        let routeName: string | undefined;

        if (routeMatch) {
            routeName = routeMatch.route.name;
            const total = routeMatch.route.getTotalMeters();
            const delta = this.resolveRouteDeltaMeters(
                routeMatch.prevProgressMeters,
                routeMatch.nextProgressMeters,
                total
            );
            const progress = routeMatch.prevProgressMeters + delta * ratio;
            const snapped = routeMatch.route.interpolateProgress(progress);
            latitude = snapped.lat;
            longitude = snapped.lng;

            const bestMatch = findBestMatchingRoute([routeMatch.route], snapped, false);
            distanceToRouteMeters = bestMatch.projection?.distanceToRouteMeters;
        }

        const heading = this.interpolateAngle(prev.location.Heading, next.location.Heading, ratio);
        const speed = prev.location.Speed + (next.location.Speed - prev.location.Speed) * ratio;
        const status = this.getDisplayStatus(next.location.Status, prev, next);

        return {
            ...next.location,
            Latitude: latitude,
            Longitude: longitude,
            Heading: heading,
            Speed: Number(speed.toFixed(1)),
            Status: status,
            LastUpdated: new Date(displayTs).toISOString(),
            RawLastUpdated: next.location.LastUpdated,
            RouteName: routeName ?? next.routeName ?? prev.routeName,
            IsSmoothed: true,
            DisplayTimestamp: new Date(displayTs).toISOString(),
            DistanceToRouteMeters: distanceToRouteMeters
        };
    }

    /** Chooses a shared route for route-locked interpolation between samples. */
    private getRouteInterpolationMatch(
        prev: BusSample,
        next: BusSample
    ): {
        route: BusRoute;
        prevProgressMeters: number;
        nextProgressMeters: number;
    } | null {
        const candidateNames = [prev.routeName, next.routeName]
            .filter((routeName): routeName is string => typeof routeName === 'string');
        const uniqueCandidateNames = Array.from(new Set(candidateNames));

        for (const routeName of uniqueCandidateNames) {
            const route = this.routeByName.get(routeName);
            if (!route) continue;

            const prevProjection = this.getSampleProjectionOnRoute(prev, route);
            const nextProjection = this.getSampleProjectionOnRoute(next, route);

            if (!prevProjection || !nextProjection) continue;

            return {
                route,
                prevProgressMeters: prevProjection.progressMeters,
                nextProgressMeters: nextProjection.progressMeters
            };
        }

        return null;
    }

    /** Returns a sample's progress on the route, re-projecting if cached data is stale. */
    private getSampleProjectionOnRoute(
        sample: BusSample,
        route: BusRoute
    ): { progressMeters: number; distanceToRouteMeters: number } | null {
        if (
            sample.routeName === route.name &&
            sample.routeProgressMeters != null &&
            sample.distanceToRouteMeters != null &&
            sample.distanceToRouteMeters <= this.routeReleaseDistanceMeters
        ) {
            return {
                progressMeters: sample.routeProgressMeters,
                distanceToRouteMeters: sample.distanceToRouteMeters
            };
        }

        const projection = route.project({
            lat: sample.location.Latitude,
            lng: sample.location.Longitude
        });

        if (projection.distanceToRouteMeters > Math.max(route.boundaryMeters, this.routeReleaseDistanceMeters)) {
            return null;
        }

        return {
            progressMeters: projection.progressMeters,
            distanceToRouteMeters: projection.distanceToRouteMeters
        };
    }

    /** Converts one sample into a client-facing location without interpolation. */
    private sampleToDisplayLocation(sample: BusSample, displayTs: number, source: BusSample): VehicleLocation {
        return {
            ...sample.location,
            Latitude: sample.routeName ? (sample.snappedPoint?.lat ?? sample.location.Latitude) : sample.location.Latitude,
            Longitude: sample.routeName ? (sample.snappedPoint?.lng ?? sample.location.Longitude) : sample.location.Longitude,
            Status: sample.displayStatus,
            LastUpdated: new Date(displayTs).toISOString(),
            RawLastUpdated: source.location.LastUpdated,
            RouteName: sample.routeName,
            IsSmoothed: true,
            DisplayTimestamp: new Date(displayTs).toISOString(),
            DistanceToRouteMeters: sample.distanceToRouteMeters
        };
    }

    /** Computes the shortest signed route-progress delta, including loop wraparound. */
    private resolveRouteDeltaMeters(
        start: number,
        end: number,
        totalMeters: number
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

        return delta;
    }

    /** Uses the latest observed ingest interval as the smoothing window. */
    private computeEffectiveDelayMs(samples: BusSample[]): number {
        const intervals: number[] = [];
        for (let i = 1; i < samples.length; i += 1) {
            const diff = samples[i].receivedAtMs - samples[i - 1].receivedAtMs;
            if (diff > 0 && diff <= this.maxSampleAgeMs) {
                intervals.push(diff);
            }
        }

        if (intervals.length === 0) {
            return this.clampDelayMs(this.delayMs);
        }

        const latestIntervalMs = intervals[intervals.length - 1];
        return this.clampDelayMs(latestIntervalMs + this.adaptiveDelayBufferMs);
    }

    /** Interpolates headings through the shortest angular path. */
    private interpolateAngle(startDeg: number, endDeg: number, ratio: number): number {
        const a = ((startDeg % 360) + 360) % 360;
        const b = ((endDeg % 360) + 360) % 360;
        let delta = b - a;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return (a + delta * ratio + 360) % 360;
    }

    /** Keeps adaptive delays inside configured bounds. */
    private clampDelayMs(value: number): number {
        if (!Number.isFinite(value)) {
            return this.minAdaptiveDelayMs;
        }

        return Math.max(this.minAdaptiveDelayMs, Math.min(this.maxAdaptiveDelayMs, value));
    }

    /** Marks a bus as Moving when its GPS samples show meaningful movement. */
    private getDisplayStatus(
        providerStatus: VehicleLocation['Status'],
        previous: BusSample | undefined,
        current: BusSample
    ): VehicleLocation['Status'] {
        if (!previous) {
            return providerStatus;
        }

        const elapsedMs = current.receivedAtMs - previous.receivedAtMs;
        if (elapsedMs <= 0 || elapsedMs > this.maxSampleAgeMs) {
            return providerStatus;
        }

        const movementMeters = this.getSampleMovementMeters(previous, current);
        if (movementMeters >= MIN_MOVING_SAMPLE_DISTANCE_METERS) {
            return 'Moving';
        }

        return providerStatus;
    }

    /** Measures sample-to-sample movement, preferring route progress when locked. */
    private getSampleMovementMeters(previous: BusSample, current: BusSample): number {
        if (
            previous.routeName &&
            current.routeName &&
            previous.routeName === current.routeName &&
            previous.routeProgressMeters != null &&
            current.routeProgressMeters != null
        ) {
            const route = this.routeByName.get(current.routeName);
            const total = route?.getTotalMeters() ?? 0;
            return Math.abs(this.resolveRouteDeltaMeters(
                previous.routeProgressMeters,
                current.routeProgressMeters,
                total
            ));
        }

        return this.distanceMeters(
            { lat: previous.location.Latitude, lng: previous.location.Longitude },
            { lat: current.location.Latitude, lng: current.location.Longitude }
        );
    }

    /** Haversine distance helper for movement checks outside route lock. */
    private distanceMeters(a: LatLng, b: LatLng): number {
        const earthRadiusMeters = 6_371_000;
        const toRadians = (value: number) => (value * Math.PI) / 180;
        const dLat = toRadians(b.lat - a.lat);
        const dLng = toRadians(b.lng - a.lng);
        const lat1 = toRadians(a.lat);
        const lat2 = toRadians(b.lat);
        const h =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
    }

    /** Removes old samples so histories stay bounded over long server runs. */
    private pruneExpiredSamples(samples: BusSample[], nowMs: number): void {
        const minAllowedTs = nowMs - this.maxSampleAgeMs;
        let firstValidIndex = 0;
        while (firstValidIndex < samples.length && samples[firstValidIndex].timestampMs < minAllowedTs) {
            firstValidIndex += 1;
        }
        if (firstValidIndex > 0) {
            samples.splice(0, firstValidIndex);
        }
    }

    /** Returns the last good point briefly when interpolation cannot emit one. */
    private getRecentDisplayFallback(busId: string, nowMs: number): VehicleLocation | null {
        const fallback = this.lastDisplayByBus.get(busId);
        if (!fallback) return null;
        if (nowMs - fallback.emittedAtMs > this.maxSampleAgeMs) {
            this.lastDisplayByBus.delete(busId);
            return null;
        }

        return fallback.location;
    }

    /** Basic coordinate sanity check before exposing a location to clients. */
    private isValidLocation(location: VehicleLocation): boolean {
        return Number.isFinite(location.Latitude) && Number.isFinite(location.Longitude);
    }
}
