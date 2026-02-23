/**
 * server.ts
 * Express server for the Bloomsburg Campus Bussing App
 *
 * Provides:
 *  - REST API endpoint to get current bus locations
 *  - WebSocket connection for real-time updates
 *  - GPS webhook receiver for Verizon Connect push notifications
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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const USE_POLLING = process.env.USE_POLLING !== 'false'; // Default to polling
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '30000', 10);

// ---------------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------------

// Store the latest bus locations in memory
let latestLocations: VehicleLocation[] = [];

// Track connected WebSocket clients
const wsClients = new Set<WebSocket>();

/**
 * Update the latest locations and broadcast to all connected clients
 */
function updateLocations(locations: VehicleLocation[]): void {
    latestLocations = locations;

    const message = JSON.stringify({
        type: 'location_update',
        timestamp: new Date().toISOString(),
        buses: locations.map(loc => ({
            id: loc.VehicleNumber,
            name: loc.VehicleName,
            lat: loc.Latitude,
            lng: loc.Longitude,
            heading: loc.Heading,
            speed: loc.Speed,
            status: loc.Status,
            lastUpdated: loc.LastUpdated,
            address: loc.Address,
            driver: loc.Driver
        }))
    });

    // Broadcast to all connected WebSocket clients
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`[Server] Broadcasted ${locations.length} bus location(s) to ${wsClients.size} client(s)`);
}

/**
 * Handle GPS webhook plots from Verizon Connect
 */
function handleWebhookPlots(plots: GpsWebhookPlot[]): void {
    console.log(`[Webhook] Received ${plots.length} GPS plot(s)`);

    // Convert webhook plots to VehicleLocation format
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

// ---------------------------------------------------------------------------
// Express App Setup
// ---------------------------------------------------------------------------

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// ---------------------------------------------------------------------------
// REST API Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/buses
 * Returns the current locations of all buses
 */
app.get('/api/buses', (_req: Request, res: Response) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: latestLocations.length,
        buses: latestLocations.map(loc => ({
            id: loc.VehicleNumber,
            name: loc.VehicleName,
            lat: loc.Latitude,
            lng: loc.Longitude,
            heading: loc.Heading,
            speed: loc.Speed,
            status: loc.Status,
            lastUpdated: loc.LastUpdated,
            address: loc.Address,
            driver: loc.Driver
        }))
    });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'running',
        mode: USE_POLLING ? 'polling' : 'webhook',
        busCount: latestLocations.length,
        wsClients: wsClients.size,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /webhooks/gps
 * Webhook endpoint for Verizon Connect GPS push notifications
 */
app.post('/webhooks/gps', gpsWebhookHandler(handleWebhookPlots));

// ---------------------------------------------------------------------------
// WebSocket Setup
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New client connected');
    wsClients.add(ws);

    // Send current locations immediately on connection
    if (latestLocations.length > 0) {
        ws.send(JSON.stringify({
            type: 'location_update',
            timestamp: new Date().toISOString(),
            buses: latestLocations.map(loc => ({
                id: loc.VehicleNumber,
                name: loc.VehicleName,
                lat: loc.Latitude,
                lng: loc.Longitude,
                heading: loc.Heading,
                speed: loc.Speed,
                status: loc.Status,
                lastUpdated: loc.LastUpdated,
                address: loc.Address,
                driver: loc.Driver
            }))
        }));
    }

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        wsClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        wsClients.delete(ws);
    });
});

// ---------------------------------------------------------------------------
// Server Startup
// ---------------------------------------------------------------------------

async function startServer() {
    try {
        console.log('=== Bloomsburg Campus Bus Tracker Server ===\n');

        // Start polling if enabled
        if (USE_POLLING) {
            console.log(`[Polling] Starting with interval: ${POLL_INTERVAL_MS / 1000}s`);
            await startPolling([], updateLocations, POLL_INTERVAL_MS);
        } else {
            console.log('[Webhook] Waiting for GPS webhook push notifications');
            console.log('[Webhook] Make sure to register this endpoint in Verizon Connect portal:');
            console.log(`[Webhook] https://your-domain.com/webhooks/gps`);
        }

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`\n[Server] Running on http://localhost:${PORT}`);
            console.log(`[Server] REST API: http://localhost:${PORT}/api/buses`);
            console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
            console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
            console.log(`[Server] Frontend: http://localhost:${PORT}/index.html`);
        });

    } catch (error) {
        console.error('[Server] Startup error:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    stopPolling();
    httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down gracefully...');
    stopPolling();
    httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
    });
});

// Start the server
void startServer();
