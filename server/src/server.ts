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
const ADAPTIVE_DELAY_BUFFER_MS = parseInt(process.env.ADAPTIVE_DELAY_BUFFER_MS ?? '2000', 10);
const STOPPED_HIDE_DELAY_MS = 1 * 60 * 1000;

const CAMPUS_LOOP_PATH: LatLng[] = [
    { lat: 41.008689, lng: -76.445122 },
    { lat: 41.008084, lng: -76.444735 },
    { lat: 41.007901, lng: -76.444650 },
    { lat: 41.008005, lng: -76.444397 },
    { lat: 41.008775, lng: -76.445007 },
    { lat: 41.009446, lng: -76.443637 },
    { lat: 41.011016, lng: -76.443591 },
    { lat: 41.011372, lng: -76.443490 },
    { lat: 41.011920, lng: -76.443957 },
    { lat: 41.012142, lng: -76.444221 },
    { lat: 41.013202, lng: -76.445012 },
    { lat: 41.013899, lng: -76.445576 },
    { lat: 41.014359, lng: -76.446306 },
    { lat: 41.014700, lng: -76.447179 },
    { lat: 41.014972, lng: -76.448083 },
    { lat: 41.015161, lng: -76.449434 },
    { lat: 41.015346, lng: -76.450629 },
    { lat: 41.015541, lng: -76.451177 },
    { lat: 41.015944, lng: -76.451604 },
    { lat: 41.016433, lng: -76.451834 },
    { lat: 41.017172, lng: -76.451873 },
    { lat: 41.017635, lng: -76.450044 },
    { lat: 41.018164, lng: -76.449194 },
    { lat: 41.018244, lng: -76.448670 },
    { lat: 41.018197, lng: -76.447292 },
    { lat: 41.017802, lng: -76.446596 },
    { lat: 41.017401, lng: -76.446298 },
    { lat: 41.016826, lng: -76.446095 },
    { lat: 41.016325, lng: -76.446204 },
    { lat: 41.016003, lng: -76.446476 },
    { lat: 41.015622, lng: -76.447125 },
    { lat: 41.015390, lng: -76.447695 },
    { lat: 41.015073, lng: -76.448066 },
    { lat: 41.014972, lng: -76.448083 },
    { lat: 41.014700, lng: -76.447179 },
    { lat: 41.014359, lng: -76.446306 },
    { lat: 41.013899, lng: -76.445576 },
    { lat: 41.013202, lng: -76.445012 },
    { lat: 41.012142, lng: -76.444221 },
    { lat: 41.011920, lng: -76.443957 },
    { lat: 41.011372, lng: -76.443490 },
    { lat: 41.011016, lng: -76.443591 },
    { lat: 41.009446, lng: -76.443637 },
    { lat: 41.008775, lng: -76.445007 },
    { lat: 41.008748, lng: -76.445143 },
    { lat: 41.008689, lng: -76.445122 }
];

let latestRawLocations: VehicleLocation[] = [];
let latestDisplayLocations: VehicleLocation[] = [];
let broadcastTimer: ReturnType<typeof setInterval> | null = null;
let routes: BusRoute[] = [];
let fluidTracking: FluidTrackingEngine | null = null;

const wsClients = new Set<WebSocket>();
const stoppedSinceMsByVehicle = new Map<string, number>();

function isStoppedStatus(status: unknown): boolean {
    const normalizedStatus = String(status ?? '').trim().toLowerCase();
    if (normalizedStatus.includes('idle')) {
        return false;
    }
    return normalizedStatus.includes('stopped');
}

function getVisibleLocations(locations: VehicleLocation[]): VehicleLocation[] {
    const nowMs = Date.now();
    const activeVehicleIds = new Set<string>();

    const visible = locations.filter(loc => {
        const vehicleId = String(loc.VehicleNumber ?? '');
        if (!vehicleId) {
            return !isStoppedStatus(loc.Status);
        }

        activeVehicleIds.add(vehicleId);

        if (!isStoppedStatus(loc.Status)) {
            stoppedSinceMsByVehicle.delete(vehicleId);
            return true;
        }

        const firstStoppedMs = stoppedSinceMsByVehicle.get(vehicleId) ?? nowMs;
        if (!stoppedSinceMsByVehicle.has(vehicleId)) {
            stoppedSinceMsByVehicle.set(vehicleId, firstStoppedMs);
        }

        return (nowMs - firstStoppedMs) < STOPPED_HIDE_DELAY_MS;
    });

    for (const vehicleId of stoppedSinceMsByVehicle.keys()) {
        if (!activeVehicleIds.has(vehicleId)) {
            stoppedSinceMsByVehicle.delete(vehicleId);
        }
    }

    return visible;
}

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
    const visibleLocations = getVisibleLocations(locations);
    const message = JSON.stringify({
        type: 'location_update',
        timestamp: new Date().toISOString(),
        delayedByMs: FLUID_DELAY_MS,
        buses: visibleLocations.map(mapLocationForClient)
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
    const visibleLocations = getVisibleLocations(latestDisplayLocations);
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        delayedByMs: FLUID_DELAY_MS,
        count: visibleLocations.length,
        rawCount: latestRawLocations.length,
        buses: visibleLocations.map(mapLocationForClient)
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
        const visibleLocations = getVisibleLocations(latestDisplayLocations);
        ws.send(JSON.stringify({
            type: 'location_update',
            timestamp: new Date().toISOString(),
            delayedByMs: FLUID_DELAY_MS,
            buses: visibleLocations.map(mapLocationForClient)
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
