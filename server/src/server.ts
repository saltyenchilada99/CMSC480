/**
 * server.ts
 * Express server for the Bloomsburg Campus Bussing App
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
    startPolling,
    stopPolling,
    gpsWebhookHandler,
    VehicleLocation,
    GpsWebhookPlot
} from './VZConnectAPICalls';
import { BusRoute, LatLng } from './BusRoute';
import { FluidTrackingEngine } from './FluidTracking';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const USE_POLLING = process.env.USE_POLLING !== 'false';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '30000', 10);
const DEFAULT_INTERPOLATION_WINDOW_MS = USE_POLLING ? POLL_INTERVAL_MS : 30_000;
const INTERPOLATION_WINDOW_MS = parseInt(
    process.env.FLUID_INTERPOLATION_WINDOW_MS ?? process.env.FLUID_DELAY_MS ?? `${DEFAULT_INTERPOLATION_WINDOW_MS}`,
    10
);
const FLUID_BROADCAST_INTERVAL_MS = parseInt(process.env.FLUID_BROADCAST_INTERVAL_MS ?? '250', 10);
const ROUTE_CAPTURE_DISTANCE_METERS = parseInt(process.env.ROUTE_CAPTURE_DISTANCE_METERS ?? '225', 10);
const ROUTE_RELEASE_DISTANCE_METERS = parseInt(process.env.ROUTE_RELEASE_DISTANCE_METERS ?? '325', 10);

type StopCoord = [number, number];

interface RouteSeed {
    name: string;
    stops: StopCoord[];
    boundaryMeters: number;
    isLoop: boolean;
}

const ROUTE_SEEDS: RouteSeed[] = [
    {
        name: 'Campus Loop',
        boundaryMeters: 175,
        isLoop: true,
        stops: [
            [41.00864, -76.44540],
            [41.01434, -76.44654],
            [41.01640, -76.44624],
            [41.01740, -76.45308],
            [41.01525, -76.44961],
            [41.01751, -76.45038],
            [41.00864, -76.44540]
        ]
    },
    {
        name: 'Downtown Loop',
        boundaryMeters: 175,
        isLoop: true,
        stops: [
            [41.00880, -76.44723],
            [41.00268, -76.45811],
            [41.00422, -76.45687],
            [41.00370, -76.45697],
            [41.00752, -76.45689],
            [41.00880, -76.44723]
        ]
    },
    {
        name: 'Walmart Trip',
        boundaryMeters: 175,
        isLoop: false,
        stops: [
            [41.00864, -76.44540],
            [41.00872, -76.48541]
        ]
    }
];

function stopCoordsToPath(stops: StopCoord[]): LatLng[] {
    return stops.map(([lat, lng]) => ({ lat, lng }));
}

async function fetchOsrmPath(stops: StopCoord[]): Promise<LatLng[] | null> {
    if (stops.length < 2) return null;
    const coordString = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`OSRM route fetch failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json() as { routes?: Array<{ geometry?: { coordinates?: [number, number][] } }> };
    const coords = json.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) {
        return null;
    }

    return coords.map(([lng, lat]) => ({ lat, lng }));
}

async function buildRoutes(): Promise<BusRoute[]> {
    const built: BusRoute[] = [];

    for (const seed of ROUTE_SEEDS) {
        let path: LatLng[];
        try {
            const osrmPath = await fetchOsrmPath(seed.stops);
            path = osrmPath && osrmPath.length >= 2 ? osrmPath : stopCoordsToPath(seed.stops);
        } catch (err) {
            console.warn(`[Routes] Falling back to stop-line path for ${seed.name}:`, err);
            path = stopCoordsToPath(seed.stops);
        }

        built.push(new BusRoute(seed.name, path, seed.boundaryMeters, seed.isLoop));
    }

    return built;
}

let latestRawLocations: VehicleLocation[] = [];
let latestDisplayLocations: VehicleLocation[] = [];
let broadcastTimer: ReturnType<typeof setInterval> | null = null;
let routes: BusRoute[] = [];
let fluidTracking: FluidTrackingEngine | null = null;

const wsClients = new Set<WebSocket>();

function mapLocationForClient(loc: VehicleLocation) {
    return {
        id: loc.VehicleNumber,
        name: loc.VehicleName,
        lat: loc.Latitude,
        lng: loc.Longitude,
        heading: loc.Heading,
        speed: loc.Speed,
        status: loc.Status,
        lastUpdated: loc.LastUpdated,
        rawLastUpdated: loc.RawLastUpdated,
        displayTimestamp: loc.DisplayTimestamp,
        isSmoothed: loc.IsSmoothed ?? false,
        routeName: loc.RouteName,
        distanceToRouteMeters: loc.DistanceToRouteMeters,
        address: loc.Address,
        driver: loc.Driver
    };
}

function broadcastLocations(locations: VehicleLocation[]): void {
    const message = JSON.stringify({
        type: 'location_update',
        timestamp: new Date().toISOString(),
        delayedByMs: INTERPOLATION_WINDOW_MS,
        buses: locations.map(mapLocationForClient)
    });

    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function updateLocations(locations: VehicleLocation[]): void {
    latestRawLocations = locations;
    if (!fluidTracking) return;
    fluidTracking.ingestLocations(locations);
    latestDisplayLocations = fluidTracking.getDisplayLocations();
    broadcastLocations(latestDisplayLocations);
    console.log(`[Server] Ingested ${locations.length} raw bus location(s), broadcast ${latestDisplayLocations.length} smoothed location(s)`);
}

function handleWebhookPlots(plots: GpsWebhookPlot[]): void {
    const locations: VehicleLocation[] = plots.map(plot => ({
        VehicleNumber: plot.VehicleNumber,
        VehicleName: plot.VehicleName,
        Latitude: plot.Latitude,
        Longitude: plot.Longitude,
        Heading: plot.Heading,
        Speed: plot.Speed,
        Status: plot.Status,
        LastUpdated: plot.EventTime
    }));

    updateLocations(locations);
}

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.static('public'));

app.get('/api/buses', (_req: Request, res: Response) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        delayedByMs: INTERPOLATION_WINDOW_MS,
        interpolationWindowMs: INTERPOLATION_WINDOW_MS,
        count: latestDisplayLocations.length,
        rawCount: latestRawLocations.length,
        buses: latestDisplayLocations.map(mapLocationForClient)
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'running',
        mode: USE_POLLING ? 'polling' : 'webhook',
        busCount: latestDisplayLocations.length,
        rawBusCount: latestRawLocations.length,
        smoothingDelayMs: INTERPOLATION_WINDOW_MS,
        smoothingBroadcastMs: FLUID_BROADCAST_INTERVAL_MS,
        routeCaptureDistanceMeters: ROUTE_CAPTURE_DISTANCE_METERS,
        routeReleaseDistanceMeters: ROUTE_RELEASE_DISTANCE_METERS,
        pollIntervalMs: POLL_INTERVAL_MS,
        routeCount: routes.length,
        wsClients: wsClients.size,
        timestamp: new Date().toISOString()
    });
});

app.post('/webhooks/gps', gpsWebhookHandler(handleWebhookPlots));

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket) => {
    wsClients.add(ws);

    if (latestDisplayLocations.length > 0) {
        ws.send(JSON.stringify({
            type: 'location_update',
            timestamp: new Date().toISOString(),
            delayedByMs: INTERPOLATION_WINDOW_MS,
            interpolationWindowMs: INTERPOLATION_WINDOW_MS,
            buses: latestDisplayLocations.map(mapLocationForClient)
        }));
    }

    ws.on('close', () => wsClients.delete(ws));
    ws.on('error', () => wsClients.delete(ws));
});

async function startServer() {
    try {
        console.log('=== Bloomsburg Campus Bus Tracker Server ===\n');

        // Bind HTTP server first so we don't start polling/background timers
        // when the port is already occupied (EADDRINUSE).
        await new Promise<void>((resolve, reject) => {
            const onError = (err: Error) => {
                httpServer.off('listening', onListening);
                reject(err);
            };
            const onListening = () => {
                httpServer.off('error', onError);
                resolve();
            };

            httpServer.once('error', onError);
            httpServer.once('listening', onListening);
            httpServer.listen(PORT);
        });

        console.log(`[Server] Running on http://localhost:${PORT}`);
        console.log(`[Server] REST API: http://localhost:${PORT}/api/buses`);
        console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
        console.log(`[Smoothing] Interpolation window: ${INTERPOLATION_WINDOW_MS}ms, broadcast: ${FLUID_BROADCAST_INTERVAL_MS}ms`);
        console.log(`[Smoothing] Route capture/release: ${ROUTE_CAPTURE_DISTANCE_METERS}m / ${ROUTE_RELEASE_DISTANCE_METERS}m`);

        routes = await buildRoutes();
        fluidTracking = new FluidTrackingEngine(routes, {
            interpolationWindowMs: INTERPOLATION_WINDOW_MS,
            routeCaptureDistanceMeters: ROUTE_CAPTURE_DISTANCE_METERS,
            routeReleaseDistanceMeters: ROUTE_RELEASE_DISTANCE_METERS
        });
        console.log(`[Routes] Loaded ${routes.length} routes for route-lock smoothing`);

        if (USE_POLLING) {
            console.log(`[Polling] Starting with interval: ${POLL_INTERVAL_MS / 1000}s`);
            await startPolling([], updateLocations, POLL_INTERVAL_MS);
        } else {
            console.log('[Webhook] Waiting for GPS webhook push notifications');
        }

        broadcastTimer = setInterval(() => {
            if (!fluidTracking) return;
            latestDisplayLocations = fluidTracking.getDisplayLocations();
            broadcastLocations(latestDisplayLocations);
        }, FLUID_BROADCAST_INTERVAL_MS);
    } catch (error) {
        console.error('[Server] Startup error:', error);
        stopPolling();
        if (broadcastTimer) {
            clearInterval(broadcastTimer);
            broadcastTimer = null;
        }
        process.exit(1);
    }
}

function shutdown() {
    stopPolling();
    if (broadcastTimer) {
        clearInterval(broadcastTimer);
        broadcastTimer = null;
    }
    httpServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

void startServer();
