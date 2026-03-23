export interface LatLng {
    lat: number;
    lng: number;
}

export interface RouteProjection {
    distanceToRouteMeters: number;
    progressMeters: number;
    snappedPoint: LatLng;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
    return (value * Math.PI) / 180;
}

/**
 * Distance between two GPS coordinates using the haversine formula.
 */
function haversineMeters(a: LatLng, b: LatLng): number {
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);

    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Lightweight local XY projection for short-distance campus calculations.
 */
function toLocalXYMeters(origin: LatLng, point: LatLng): { x: number; y: number } {
    const dLat = toRadians(point.lat - origin.lat);
    const dLng = toRadians(point.lng - origin.lng);
    const meanLat = toRadians((origin.lat + point.lat) / 2);

    const y = dLat * EARTH_RADIUS_METERS;
    const x = dLng * EARTH_RADIUS_METERS * Math.cos(meanLat);
    return { x, y };
}

function fromLocalXYMeters(origin: LatLng, local: { x: number; y: number }): LatLng {
    const lat = origin.lat + (local.y / EARTH_RADIUS_METERS) * (180 / Math.PI);
    const lng = origin.lng + (local.x / (EARTH_RADIUS_METERS * Math.cos(toRadians(origin.lat)))) * (180 / Math.PI);
    return { lat, lng };
}

export class BusRoute {
    readonly name: string;
    readonly boundaryMeters: number;

    private readonly path: LatLng[];
    private readonly cumulativeMeters: number[];
    private readonly totalMeters: number;

    constructor(name: string, path: LatLng[], boundaryMeters = 120) {
        if (!Array.isArray(path) || path.length < 2) {
            throw new Error(`Route ${name} must contain at least 2 points.`);
        }

        this.name = name;
        this.path = path;
        this.boundaryMeters = boundaryMeters;

        this.cumulativeMeters = [0];
        for (let i = 1; i < path.length; i += 1) {
            const prev = path[i - 1];
            const current = path[i];
            const segmentLen = haversineMeters(prev, current);
            this.cumulativeMeters.push(this.cumulativeMeters[i - 1] + segmentLen);
        }

        this.totalMeters = this.cumulativeMeters[this.cumulativeMeters.length - 1];
    }

    getTotalMeters(): number {
        return this.totalMeters;
    }

    contains(point: LatLng): boolean {
        const projection = this.project(point);
        return projection.distanceToRouteMeters <= this.boundaryMeters;
    }

    project(point: LatLng): RouteProjection {
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestProgress = 0;
        let bestPoint = this.path[0];

        for (let i = 1; i < this.path.length; i += 1) {
            const a = this.path[i - 1];
            const b = this.path[i];

            const segmentProjection = this.projectPointToSegment(point, a, b);
            const segmentLength = haversineMeters(a, b);
            const progress = this.cumulativeMeters[i - 1] + segmentLength * segmentProjection.t;

            if (segmentProjection.distanceMeters < bestDistance) {
                bestDistance = segmentProjection.distanceMeters;
                bestProgress = progress;
                bestPoint = segmentProjection.projected;
            }
        }

        return {
            distanceToRouteMeters: bestDistance,
            progressMeters: bestProgress,
            snappedPoint: bestPoint
        };
    }

    interpolateProgress(progressMeters: number): LatLng {
        if (this.totalMeters <= 0) {
            return this.path[0];
        }

        let normalized = progressMeters % this.totalMeters;
        if (normalized < 0) normalized += this.totalMeters;

        for (let i = 1; i < this.cumulativeMeters.length; i += 1) {
            const startProgress = this.cumulativeMeters[i - 1];
            const endProgress = this.cumulativeMeters[i];
            if (normalized <= endProgress) {
                const segmentLength = Math.max(endProgress - startProgress, 0.0001);
                const t = Math.max(0, Math.min(1, (normalized - startProgress) / segmentLength));
                const a = this.path[i - 1];
                const b = this.path[i];
                return {
                    lat: a.lat + (b.lat - a.lat) * t,
                    lng: a.lng + (b.lng - a.lng) * t
                };
            }
        }

        return this.path[this.path.length - 1];
    }

    private projectPointToSegment(point: LatLng, a: LatLng, b: LatLng): { projected: LatLng; t: number; distanceMeters: number } {
        const aLocal = { x: 0, y: 0 };
        const bLocal = toLocalXYMeters(a, b);
        const pLocal = toLocalXYMeters(a, point);

        const abX = bLocal.x - aLocal.x;
        const abY = bLocal.y - aLocal.y;
        const abLenSq = abX * abX + abY * abY;

        let t = 0;
        if (abLenSq > 0) {
            t = ((pLocal.x - aLocal.x) * abX + (pLocal.y - aLocal.y) * abY) / abLenSq;
            t = Math.max(0, Math.min(1, t));
        }

        const projectedLocal = {
            x: aLocal.x + abX * t,
            y: aLocal.y + abY * t
        };

        const projected = fromLocalXYMeters(a, projectedLocal);
        return {
            projected,
            t,
            distanceMeters: haversineMeters(point, projected)
        };
    }
}

export function findBestMatchingRoute(
    routes: BusRoute[],
    point: LatLng,
    requireBoundary = true
): {
    route: BusRoute | null;
    projection: RouteProjection | null;
} {
    let bestRoute: BusRoute | null = null;
    let bestProjection: RouteProjection | null = null;

    for (const route of routes) {
        const projection = route.project(point);
        if (!bestProjection || projection.distanceToRouteMeters < bestProjection.distanceToRouteMeters) {
            bestRoute = route;
            bestProjection = projection;
        }
    }

    if (!bestRoute || !bestProjection) {
        return { route: null, projection: null };
    }

    if (requireBoundary && bestProjection.distanceToRouteMeters > bestRoute.boundaryMeters) {
        return { route: null, projection: bestProjection };
    }

    return { route: bestRoute, projection: bestProjection };
}