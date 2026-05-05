# Bloomsburg Campus Bus Tracker

Bloomsburg Campus Bus Tracker is a React and Leaflet web application for viewing Bloomsburg campus transportation in real time. The app combines live Verizon Connect vehicle data, route overlays, campus points of interest, user geolocation, and an interactive layer menu into one map-first experience for students, visitors, and campus operations.

The current app focuses on three transportation routes: Campus Loop, Downtown Loop, and Walmart Trip. It also includes searchable markers for bus stops, academic buildings, residence halls, recreation and athletics locations, and dining venues.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Project Review Notes](#project-review-notes)
- [Contribution Analysis](#contribution-analysis)
- [Troubleshooting](#troubleshooting)

## Features

- Live bus markers delivered over WebSocket from the local backend.
- Fluid tracking mode that smooths raw GPS updates between provider pings.
- Ping tracking mode for viewing raw live GPS positions.
- Direction-aware bus icons that rotate by heading category.
- Campus Loop, Downtown Loop, and Walmart Trip route overlays.
- Bus stop popups with stop descriptions, route chips, locations, and images.
- Search across bus stops, dorms, academic buildings, recreation locations, and dining.
- Layer controls for buses, bus statuses, stops, routes, and user location.
- Academic, recreation, dorm, and dining markers that appear at close campus zoom levels.
- Per-route subfilters.
- Browser geolocation marker with a center-map workflow.
- Bus schedule modal with route service details.
- Map viewport logic that recenters markers and popups without losing the campus bounds.

### Frontend

The frontend lives in `src/` and is now formalized as a TypeScript React app built with Create React App. `src/App.tsx` owns the main map state: overlay visibility, route visibility, bus status filters, tracking mode, zoom, user location, and focus targets. `react-leaflet` renders the map, markers, popups, and route overlays.

The root project includes `tsconfig.json`, a `typecheck` script, shared frontend types in `src/types/frontend.ts`, and CRA-compatible React/Leaflet type packages. The only JavaScript file intentionally left in `src/` is `src/setupProxy.js`, because Create React App expects that development proxy hook to be CommonJS.

Important frontend modules:

- `src/components/bus.tsx` - opens the WebSocket connection through `BusProvider` and renders live bus markers.
- `src/components/Header.tsx` - renders the title, bus schedule modal, live status badge, and search.
- `src/components/SubHeader.tsx` - renders the map layer panel, route filters, bus status filters, tracking mode selector, reset button, and center-map button.
- `src/components/MapViewportController.tsx` - handles map panning, focus targets, popup centering, and reset behavior.
- `src/components/busStop.tsx` - stores and renders the bus stop marker library.
- `src/components/Academic.tsx`, `dorm.tsx`, `Recreation.tsx`, and `food.tsx` - store and render campus point-of-interest layers.
- `src/components/routes/*.tsx` - load static GeoJSON route files from `public/routes/` and render the three route overlays.

### Backend

The backend lives in `server/` and is a TypeScript Express service. It polls Verizon Connect by default, can accept GPS webhook posts, normalizes vehicle data, smooths bus movement, and broadcasts updates to the React app.

Important backend modules:

- `server/src/server.ts` - Express app, REST endpoints, WebSocket server, polling startup, webhook route, health checks, and broadcast loop.
- `server/src/VZConnectAPICalls.ts` - Verizon Connect token handling, vehicle lookup, location lookup, polling, and webhook parsing.
- `server/src/FluidTracking.ts` - interpolation engine that smooths locations, handles stale timestamps, snaps to known route geometry, and avoids unrealistic jumps.
- `server/src/BusRoute.ts` - route projection, distance calculation, and route progress utilities.

## Tech Stack

- React 19
- Create React App / react-scripts
- TypeScript for the frontend and backend
- React Leaflet and Leaflet
- Express
- WebSocket / ws
- Verizon Connect / Fleetmatics Reveal API
- Static GeoJSON route overlays generated from route data
- Stadia Maps / OpenStreetMap tile attribution in the Leaflet tile layer

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Verizon Connect API credentials for live vehicle data
- Network access for map tiles
- Network access to OSRM only when regenerating static route GeoJSON files

### Install Dependencies

Install the React app dependencies from the project root:

```bash
npm install
```

Install the backend dependencies:

```bash
npm --prefix server install
```

### Configure the Backend

Create `server/.env` with local Verizon Connect credentials and server settings:

```bash
VZC_USERNAME=your_verizon_connect_username
VZC_PASSWORD=your_verizon_connect_password
VZC_APP_ID=your_verizon_connect_app_id

PORT=3001
USE_POLLING=true
POLL_INTERVAL_MS=30000
```

`server/.env` is ignored by git. Keep real credentials out of commits.

### Run the Full App

From the project root:

```bash
npm run dev
```

This starts both pieces together:

- React client: `http://localhost:3000`
- Backend API and WebSocket server: `http://localhost:3001`

The React app proxies `/api` requests to port `3001`, and `BusProvider` connects directly to `ws://localhost:3001`.

### Run Client and Server Separately

Terminal 1:

```bash
npm --prefix server run dev
```

Terminal 2:

```bash
npm start
```

The static map layers can render without live bus data, but the status badge will remain reconnecting until the backend WebSocket is available.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VZC_USERNAME` | `YOUR_USERNAME` fallback in code | Verizon Connect API username. |
| `VZC_PASSWORD` | `YOUR_PASSWORD` fallback in code | Verizon Connect API password. |
| `VZC_APP_ID` | `YOUR_APP_ID` fallback in code | Verizon Connect Atmosphere app id. |
| `PORT` | `3001` | Backend HTTP/WebSocket port. Keep this aligned with `src/setupProxy.js` and the WebSocket URL in `src/components/bus.tsx`. |
| `USE_POLLING` | `true` | Enables polling Verizon Connect. Set to `false` for webhook-only mode. |
| `POLL_INTERVAL_MS` | `30000` | Polling interval for vehicle locations. |
| `FLUID_INTERPOLATION_WINDOW_MS` | Same as poll interval when polling | Delay window used for smoothed playback. |
| `FLUID_BROADCAST_INTERVAL_MS` | `250` | WebSocket broadcast cadence for smoothed locations. |
| `ROUTE_CAPTURE_DISTANCE_METERS` | `225` | Distance threshold for snapping a bus to a route. |
| `ROUTE_RELEASE_DISTANCE_METERS` | `325` | Distance threshold for keeping a bus on a previously matched route. |
| `ADAPTIVE_DELAY_BUFFER_MS` | `2000` | Buffer used by the fluid tracking delay calculation. |

## Available Scripts

### Root Project

```bash
npm run dev
```

Runs the backend and React client together.

```bash
npm start
```

Runs only the React development server on `http://localhost:3000`.

```bash
npm test -- --watchAll=false
```

Runs the React test suite once.

```bash
npm run typecheck
```

Runs the frontend TypeScript compiler without emitting files.

```bash
npm run build
```

Builds the React app into `build/`.

```bash
npm run generate:routes
```

Regenerates the static GeoJSON route files in `public/routes/` using the OSRM public routing service.

### Backend

```bash
npm --prefix server run dev
```

Runs the TypeScript backend with `ts-node`.

```bash
npm --prefix server run build
```

Compiles the backend TypeScript into `server/dist/`.

```bash
npm --prefix server start
```

Runs the compiled backend from `server/dist/server.js`.

```bash
npm --prefix server run test-api
```

Runs the Verizon Connect API test utility in `server/src/test-api.ts`.

## API Reference

### `GET /api/health`

Returns server health, mode, smoothing configuration, route count, connected WebSocket clients, and bus counts.

### `GET /api/buses`

Returns the latest display locations after smoothing. Each bus object includes id, name, display coordinates, raw ping coordinates, heading, speed, status, timestamps, route metadata, address, and driver when available.

### `POST /webhooks/gps`

Accepts one GPS plot or an array of GPS plots from Verizon Connect webhook delivery. The server normalizes the payload and feeds it into the same location update path used by polling.

### `ws://localhost:3001`

Broadcasts `location_update` messages to connected clients. The React app listens for these messages in `BusProvider`.

## Project Structure

```text
.
|-- public/
|   |-- busStopImages/        # Stop photos used in bus stop popups
|   |-- routes/               # Static GeoJSON route overlays
|   `-- index.html
|-- resources/                # Presentation/data-flow assets and shared icons
|-- server/
|   |-- src/
|   |   |-- BusRoute.ts
|   |   |-- FluidTracking.ts
|   |   |-- VZConnectAPICalls.ts
|   |   |-- server.ts
|   |   `-- test-api.ts
|   |-- package.json
|   `-- tsconfig.json
|-- src/
|   |-- components/
|   |   |-- routes/
|   |   |-- Academic.tsx
|   |   |-- Header.tsx
|   |   |-- SubHeader.tsx
|   |   |-- bus.tsx
|   |   |-- busStop.tsx
|   |   |-- dorm.tsx
|   |   |-- food.tsx
|   |   `-- Recreation.tsx
|   |-- styles/
|   |-- types/
|   |   |-- frontend.ts
|   |   |-- leaflet-filelayer.d.ts
|   |   `-- leaflet-filelayer-augmentation.d.ts
|   |-- App.tsx
|   |-- App.test.tsx
|   |-- UserTracker.tsx
|   |-- index.tsx
|   |-- react-app-env.d.ts
|   |-- reportWebVitals.ts
|   |-- setupTests.ts
|   |-- setupProxy.js
|   `-- bus.ts
|-- package.json
|-- tsconfig.json
`-- README.md
```

## Project Review Notes

### What Works Well

- The app has a clear map-first experience and a useful campus transportation focus.
- The backend separates provider access, smoothing logic, route math, and server concerns into dedicated modules.
- The frontend has grown beyond a basic tracker into a broader campus navigation tool with several meaningful point-of-interest layers.
- The fluid tracking work addresses a real user-facing problem: provider pings are too sparse and jumpy to feel live on a map.
- Search, toggles, route filters, and tracking modes give users practical control without needing to understand the backend.

### Maintenance Notes

- The active frontend has been refactored to TypeScript. New React UI work should use `.tsx`, shared non-React frontend utilities should use `.ts`, and shared map/data shapes should live in `src/types/frontend.ts` when they are reused.
- `src/setupProxy.js` remains JavaScript by design because Create React App loads it as a CommonJS development-server hook.
- Route overlays and backend route-lock smoothing both load the static GeoJSON files in `public/routes/`, covering Campus Loop, Downtown Loop, and Walmart Trip. If those files are missing or invalid, the rest of the map can still render but route lines and route-locked smoothing may be unavailable.
- The app expects the local backend on port `3001`. The backend defaults to `3001`; if `PORT` is overridden, update `src/setupProxy.js` and the WebSocket URL in `src/components/bus.tsx` to match.

## Contribution Analysis

This summary is based on the git commit history through May 3, 2026. Non-merge commits were reviewed, and aliases are grouped where author metadata and commit patterns indicate the same contributor.

| Contributor | Commit-history signal | Significant contributions |
| --- | --- | --- |
| Matthew Weber / `saltyenchilada99` | Largest combined commit set across app setup, map UI, icons, filters, and final cleanup. | Bootstrapped the React/Leaflet app, activated the map, adjusted map sizing and skin, created early bus stop and toggle behavior, added custom bus and stop icons, modularized the bus marker component, added dorm and academic toggles/icons, built search across marker categories, implemented bus status visibility states, added collapsible layer menu behavior, refined directional bus icons and anchors, and fixed popup close styling. |
| Ethan Wight / `EthanWight` | Major backend integration and several large frontend feature commits. | Added the Verizon Connect backend foundation, proxy setup, and server package; added concurrent client/server development scripts; fixed backend compilation/startup issues; improved route colors and route labels; redesigned the map UI into a full-screen map with side-layer controls; added dining, academic, dorm, and recreation layers; improved user-location controls and map centering; created reusable popup/card and viewport behavior; expanded recreation data and coordinates. |
| Joey Boehme / `JoeyBoehme` / `BotLiquor` | Route, user tracking, visual asset, and resource commits. | Added initial user location tracking, introduced early bus route display, created the three visible route components, added bus stop images and descriptive stop content, adjusted CommonwealthU-style formatting, contributed user tracker assets and the data flow presentation resource, and made broad integration updates around route, marker, and UI behavior. |
| Jack Norfolk / `jsnorfolk` | Core live-tracking and smoothing work. | Added early bus and bus stop classes, built `BusRoute` and `FluidTracking` server modules, added moving/fluid bus movement, connected smoothing to the route system, reduced jumpy movement, added route selection/reset UI, introduced the user-facing fluid vs ping tracking mode, optimized the smoothing cadence, and fixed teleportation at route endpoints. |
| Micah Root / `micah3root` | UI shell, marker fixes, route fixes, and optimization commits. | Built the early header, footer, and subheader UI; added subheader button functionality; fixed merge and marker bugs; refined marker icon handling; added marker click radius and bus timer work; uploaded shared icon resources; optimized several map components; and fixed Campus Loop route behavior near the end of Sprint 5. |

## Troubleshooting

### The status badge says `Reconnecting...`

Make sure the backend is running on port `3001`, or that `src/setupProxy.js` and the WebSocket URL in `src/components/bus.tsx` match any custom backend port.

### The map loads but no live buses appear

Check `/api/health` and `/api/buses` on the backend. If the server is running but bus count is zero, verify Verizon Connect credentials, vehicle access, and polling logs.

### Route lines do not appear

The route components load static GeoJSON files from `public/routes/`. Confirm those files exist and are valid. To regenerate them, run `npm run generate:routes`; that command uses the public OSRM service and requires network access.

### My Location does not appear

Browser geolocation requires permission and usually works best on `localhost` or HTTPS. If permission is denied, the user marker layer will stay empty.

### Backend build fails

Run `npm --prefix server install`, then `npm --prefix server run build`. The backend is TypeScript with strict mode enabled, so type errors will stop the build.
