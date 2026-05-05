/**
 * verizonConnectApi.ts
 * Verizon Connect (Fleetmatics REVEAL) API client for the Bloomsburg BusTracker app.
 *
 * Covers:
 *  - Token auth (tokens expire after ~20 minutes; auto-refreshed)
 *  - GET vehicle list
 *  - GET single vehicle location
 *  - GET all vehicle locations (polls the full fleet)
 *  - GPS Webhook receiver (Express handler to accept push data)
 *
 * ENV: replace the placeholder strings below or load from a .env file.
 *
 * Base URL pattern:  https://fim.api.us.fleetmatics.com
 *   /token              – Token Authorization API
 *   /rad/v1/vehicles    – Real-time Aggregated Data (RAD) – location & status
 *   /cmd/v1/vehicles    – Customer Meta Data (CMD) – vehicle list / details
 */

import 'dotenv/config';
import type {Request, RequestHandler, Response} from "express";

// ---------------------------------------------------------------------------
// Config – populate via .env in production
// ---------------------------------------------------------------------------
const CONFIG = {
    username:  process.env.VZC_USERNAME  ?? "YOUR_USERNAME",
    password:  process.env.VZC_PASSWORD  ?? "YOUR_PASSWORD",
    appId:     process.env.VZC_APP_ID    ?? "YOUR_APP_ID",   // e.g. "companyname-p-us-xxxxx"
    baseUrl:   "https://fim.api.us.fleetmatics.com",
    // Polling interval for the fallback poller (ms). 30 s is a safe starting point.
    pollIntervalMs: 30_000,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Address structure returned by the API */
export interface VehicleAddress {
    AddressLine1: string;
    AddressLine2: string;
    Locality: string;
    AdministrativeArea: string;
    PostalCode: string;
    Country: string;
}

/** Raw location payload returned by GET /rad/v1/vehicles/{num}/location */
export interface ApiVehicleLocation {
    Address: VehicleAddress;
    DeltaDistance: number;
    DeltaTime: number;
    DeviceTimeZoneOffset: number | null;
    DeviceTimeZoneUseDST: boolean;
    DisplayState: string;           // "Stop", "Moving", "Idle", etc.
    Direction: number;              // degrees 0-359
    Heading: string;                // "East", "North West", etc.
    DriverNumber: string | null;
    GeoFenceName: string | null;
    Latitude: number;
    Longitude: number;
    Speed: number;                  // mph
    UpdateUTC: string;              // ISO-8601 UTC
    IsPrivate: boolean;
}

/** Normalized vehicle location used throughout the application */
export interface VehicleLocation {
    VehicleNumber: string;
    VehicleName:   string;
    Latitude:      number;
    Longitude:     number;
    Heading:       number;          // degrees 0–359
    Speed:         number;          // mph
    Status:        VehicleStatus;
    LastUpdated:   string;          // ISO-8601 UTC
    Address?:      string;
    Driver?:       string;
    GeoFenceName?: string;
    RouteName?: string;
    IsSmoothed?: boolean;
    DisplayTimestamp?: string;
    RawLastUpdated?: string;
    DistanceToRouteMeters?: number;
}

/** Simplified vehicle status the Reveal API exposes */
export type VehicleStatus = "Moving" | "Stopped" | "Idle" | "NoData" | "Unknown";

const VEHICLE_STATUSES = new Set<VehicleStatus>(["Moving", "Stopped", "Idle", "NoData", "Unknown"]);

/** Lightweight vehicle record returned by GET /cmd/v1/vehicles */
export interface Vehicle {
    VehicleNumber: string;
    VehicleName:   string;
    Make?:         string;
    Model?:        string;
    Year?:         number;
    GroupId?:      string;
}

/** GPS webhook plot pushed by Verizon Connect to your endpoint */
export interface GpsWebhookPlot {
    VehicleNumber: string;
    VehicleName:   string;
    Latitude:      number;
    Longitude:     number;
    Heading:       number;
    Speed:         number;
    Status:        VehicleStatus;
    EventTime:     string;          // ISO-8601 UTC
}

// ---------------------------------------------------------------------------
// Token manager – handles fetch + auto-refresh
// ---------------------------------------------------------------------------

class TokenManager {
    private token:      string | null = null;
    private expiresAt:  number        = 0;           // epoch ms

    /** Returns a valid Bearer token, fetching a new one if needed. */
    async getToken(): Promise<string> {
        if (this.token && Date.now() < this.expiresAt) {
            return this.token;
        }
        return this.fetchNewToken();
    }

    private async fetchNewToken(): Promise<string> {
        const basic = Buffer
            .from(`${CONFIG.username}:${CONFIG.password}`)
            .toString("base64");

        const res = await fetch(`${CONFIG.baseUrl}/token`, {
            method:  "GET",
            headers: {
                Authorization: `Basic ${basic}`,
                Accept:        "text/plain",
            },
        });

        if (!res.ok) {
            throw new Error(`Token fetch failed: ${res.status} ${res.statusText}`);
        }

        this.token     = (await res.text()).trim();
        // Verizon Connect tokens expire after 20 minutes; refresh at 18 min
        this.expiresAt = Date.now() + 18 * 60 * 1000;
        return this.token;
    }
}

// Singleton used by all API functions
const tokenManager = new TokenManager();

// ---------------------------------------------------------------------------
// Internal helper – build the Atmosphere auth header required by all calls
// ---------------------------------------------------------------------------
async function authHeader(): Promise<string> {
    const token = await tokenManager.getToken();
    // Format required by Fleetmatics: "Atmosphere atmosphere_app_id=..., Bearer ..."
    return `Atmosphere atmosphere_app_id=${CONFIG.appId}, Bearer ${token}`;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the full list of vehicles in the REVEAL account.
 * Useful on startup to discover vehicle numbers for the bus fleet.
 *
 * GET /cmd/v1/vehicles
 */
export async function getVehicles(): Promise<Vehicle[]> {
    const res = await fetch(`${CONFIG.baseUrl}/cmd/v1/vehicles`, {
        headers: {
            Authorization: await authHeader(),
            Accept:        "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`getVehicles failed: ${res.status} ${res.statusText}`);
    }

    // The API returns either a root array or an object with a Vehicles key
    const data = await res.json() as Vehicle[] | { Vehicles?: Vehicle[] };
    return Array.isArray(data) ? data : (data.Vehicles ?? []);
}

/**
 * Fetch the current GPS location & status for a single vehicle.
 *
 * GET /rad/v1/vehicles/{vehicleNumber}/location
 */
export async function getVehicleLocation(
    vehicleNumber: string,
    vehicleName?: string
): Promise<VehicleLocation> {
    const url = `${CONFIG.baseUrl}/rad/v1/vehicles/${encodeURIComponent(vehicleNumber)}/location`;

    const res = await fetch(url, {
        headers: {
            Authorization: await authHeader(),
            Accept:        "application/json",
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
            `getVehicleLocation(${vehicleNumber}) failed: ${res.status} ${res.statusText}${errorText ? ` - ${errorText}` : ''}`
        );
    }

    const text = await res.text();
    if (!text || text.trim().length === 0) {
        throw new Error(
            `getVehicleLocation(${vehicleNumber}) returned empty response. Vehicle may not have recent GPS data.`
        );
    }

    try {
        const apiLocation = JSON.parse(text) as ApiVehicleLocation;

        // Normalize the API response to our VehicleLocation format
        return {
            VehicleNumber: vehicleNumber,
            VehicleName: vehicleName || vehicleNumber,
            Latitude: apiLocation.Latitude,
            Longitude: apiLocation.Longitude,
            Heading: apiLocation.Direction,
            Speed: apiLocation.Speed,
            Status: normalizeStatus(apiLocation.DisplayState),
            LastUpdated: apiLocation.UpdateUTC,
            Address: apiLocation.Address?.AddressLine1 || undefined,
            Driver: apiLocation.DriverNumber || undefined,
            GeoFenceName: apiLocation.GeoFenceName || undefined
        };
    } catch (err) {
        throw new Error(
            `getVehicleLocation(${vehicleNumber}) returned invalid JSON: ${text.substring(0, 100)}`
        );
    }
}

/**
 * Convert API DisplayState to our normalized VehicleStatus
 */
function normalizeStatus(displayState: string): VehicleStatus {
    const state = displayState.toLowerCase();
    if (state === 'moving' || state === 'move') return 'Moving';
    if (state === 'stop' || state === 'stopped') return 'Stopped';
    if (state === 'idle' || state === 'idling') return 'Idle';
    if (state === 'nodata' || state === 'no data') return 'NoData';
    return 'Unknown';
}

/** Runtime guard for webhook status values before they enter app state. */
function isVehicleStatus(value: unknown): value is VehicleStatus {
    return typeof value === 'string' && VEHICLE_STATUSES.has(value as VehicleStatus);
}

/**
 * Converts one raw webhook body item into a normalized plot.
 *
 * The webhook endpoint receives JSON from outside the React app, so it validates
 * and normalizes the fields the backend requires before updating live buses.
 */
function normalizeWebhookPlot(raw: unknown): GpsWebhookPlot | null {
    if (!raw || typeof raw !== 'object') return null;

    const plot = raw as Partial<GpsWebhookPlot>;
    const latitude = Number(plot.Latitude);
    const longitude = Number(plot.Longitude);

    if (!plot.VehicleNumber || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    const vehicleNumber = String(plot.VehicleNumber);
    const heading = Number(plot.Heading);
    const speed = Number(plot.Speed);

    return {
        VehicleNumber: vehicleNumber,
        VehicleName: plot.VehicleName ? String(plot.VehicleName) : vehicleNumber,
        Latitude: latitude,
        Longitude: longitude,
        Heading: Number.isFinite(heading) ? heading : 0,
        Speed: Number.isFinite(speed) ? speed : 0,
        Status: isVehicleStatus(plot.Status) ? plot.Status : "Unknown",
        EventTime: plot.EventTime ? String(plot.EventTime) : new Date().toISOString(),
    };
}

/**
 * Fetch the current location for every vehicle in the provided list in parallel.
 * Falls back gracefully – a single vehicle failure won't crash the whole poll.
 *
 * @param vehicles  Array of vehicle numbers or Vehicle objects (e.g. ["BUS01", "BUS02"])
 */
export async function getAllVehicleLocations(
    vehicles: string[] | Vehicle[]
): Promise<VehicleLocation[]> {
    const settled = await Promise.allSettled(
        vehicles.map((v) =>
            typeof v === "string"
                ? getVehicleLocation(v)
                : getVehicleLocation(v.VehicleNumber, v.VehicleName)
        )
    );

    const locations: VehicleLocation[] = [];
    for (const result of settled) {
        if (result.status === "fulfilled") {
            locations.push(result.value);
        } else {
            console.warn("[BusTracker] Location fetch skipped:", result.reason);
        }
    }
    return locations;
}

// ---------------------------------------------------------------------------
// Polling loop – use when the GPS Webhook is not yet approved / available
// ---------------------------------------------------------------------------

let _pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start polling Verizon Connect for bus positions on a fixed interval.
 *
 * @param vehicleNumbers  Which buses to track. Pass [] to auto-discover.
 * @param onUpdate        Callback invoked with the latest locations array.
 * @param intervalMs      Override the default poll interval.
 */
export async function startPolling(
    vehicleNumbers: string[],
    onUpdate: (locations: VehicleLocation[]) => void,
    intervalMs = CONFIG.pollIntervalMs
): Promise<void> {
    if (_pollTimer) {
        console.warn("[BusTracker] Polling already running.");
        return;
    }

    // Resolve vehicle list if not provided, keeping names
    let vehicles: Vehicle[] | string[] = vehicleNumbers;
    if (vehicleNumbers.length === 0) {
        vehicles = await getVehicles();
    }

    const poll = async () => {
        try {
            const locations = await getAllVehicleLocations(vehicles);
            onUpdate(locations);
        } catch (err) {
            console.error("[BusTracker] Poll error:", err);
        }
    };

    // Fire immediately, then on interval
    await poll();
    _pollTimer = setInterval(poll, intervalMs);
    console.log(`[BusTracker] Polling started every ${intervalMs / 1000}s`);
}

/** Stop the background polling loop. */
export function stopPolling(): void {
    if (_pollTimer) {
        clearInterval(_pollTimer);
        _pollTimer = null;
        console.log("[BusTracker] Polling stopped.");
    }
}

// ---------------------------------------------------------------------------
// GPS Webhook handler (Express)
//
// Verizon Connect pushes GPS plots to a URL you register in the FIM portal.
// Wire this into your Express app:
//
//   import express from "express";
//   import { gpsWebhookHandler } from "./verizonConnectApi";
//
//   const app = express();
//   app.use(express.json());
//   app.post("/webhooks/gps", gpsWebhookHandler((plots) => {
//     // broadcast to Leaflet clients via WebSocket, SSE, etc.
//   }));
// ---------------------------------------------------------------------------

/**
 * Factory that returns an Express POST handler for incoming GPS webhook plots.
 *
 * @param onPlots  Called with the array of parsed GPS plots on each push.
 */
export function gpsWebhookHandler(
    onPlots: (plots: GpsWebhookPlot[]) => void
): RequestHandler {
    return (req: Request, res: Response): void => {
        try {
            // The body can be a single plot object or an array.
            const raw = req.body;
            const plots = Array.isArray(raw) ? raw : [raw];
            const valid = plots
                .map(normalizeWebhookPlot)
                .filter((plot): plot is GpsWebhookPlot => plot !== null);

            if (valid.length === 0) {
                res.status(400).json({ error: "No valid GPS plots in payload." });
                return;
            }

            onPlots(valid);
            // Verizon Connect expects a 200 OK to confirm receipt
            res.status(200).json({ received: valid.length });
        } catch (err) {
            console.error("[BusTracker] Webhook parse error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
}

// ---------------------------------------------------------------------------
// Example usage (run with: npx ts-node verizonConnectApi.ts)
// ---------------------------------------------------------------------------

async function demo() {
    console.log("=== BusTracker – Verizon Connect API Demo ===\n");

    // 1. List all vehicles
    console.log("Fetching vehicle list...");
    const vehicles = await getVehicles();
    console.log(`Found ${vehicles.length} vehicle(s):`);
    vehicles.forEach((v) => console.log(`  [${v.VehicleNumber}] ${v.VehicleName}`));

    if (vehicles.length === 0) {
        console.warn("No vehicles found. Make sure Vehicle Numbers are set in REVEAL.");
        return;
    }

    // 2. Fetch location for first vehicle
    const first = vehicles[0];
    console.log(`\nFetching location for vehicle ${first.VehicleNumber}...`);
    const loc = await getVehicleLocation(first.VehicleNumber);
    console.log(
        `  ${loc.VehicleName}: ${loc.Latitude}, ${loc.Longitude} @ ${loc.Speed} mph — ${loc.Status}`
    );

    // 3. Fetch all locations in one pass
    console.log("\nFetching all vehicle locations...");
    const all = await getAllVehicleLocations(vehicles.map((v) => v.VehicleNumber));
    all.forEach((l) =>
        console.log(
            `  ${l.VehicleName.padEnd(12)} | ${l.Status.padEnd(8)} | ` +
            `${l.Latitude.toFixed(5)}, ${l.Longitude.toFixed(5)} | ${l.Speed} mph`
        )
    );

    // 4. Start a short polling demo (3 polls, then stop)
    console.log("\nStarting polling (3 updates, then stop)...");
    let count = 0;
    await startPolling(
        vehicles.map((v) => v.VehicleNumber),
        (locs) => {
            console.log(`  Poll #${++count}: ${locs.length} location(s) received.`);
            if (count >= 3) stopPolling();
        },
        10_000 // poll every 10 s for the demo
    );
}

// Only run demo when executed directly (not when imported as a module)
if (require.main === module) {
    demo().catch((err) => {
        console.error("Demo error:", err);
        process.exit(1);
    });
}
