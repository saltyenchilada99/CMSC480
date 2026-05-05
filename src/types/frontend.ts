/**
 * Shared frontend domain types.
 *
 * These types describe data that crosses component boundaries. Keeping them in
 * one file makes the map, search, WebSocket provider, and control panel agree
 * on the same coordinate and bus payload shapes.
 */

/** Leaflet coordinate tuple in [latitude, longitude] order. */
export type MapPoint = [number, number];

/**
 * A camera target requested by search, marker clicks, user location, or reset.
 *
 * `requestId` intentionally changes even when a user selects the same marker
 * twice, allowing popup-opening effects to run for repeated selections.
 */
export type MapFocusTarget = {
  type: 'campus' | 'marker' | 'user';
  center: MapPoint;
  zoom?: number;
  markerKey?: string;
  requestId?: number;
};

/** Callback shared by marker layers so `App` can own all map camera changes. */
export type MarkerFocusHandler = (
  center: MapPoint,
  type?: 'marker' | 'user',
  zoom?: number,
  markerKey?: string
) => void;

/** The marker whose popup should be opened after a search/focus action. */
export type SelectedMarker = {
  key: string | null;
  requestId: number;
  zoom?: number;
};

/** `fluid` uses smoothed backend playback; `ping` shows the raw provider ping. */
export type TrackingMode = 'fluid' | 'ping';

export type RouteKey = 'campus' | 'downtown' | 'walmart';
export type RouteVisibility = Record<RouteKey, boolean>;

export type BusStatusCategory = 'active' | 'idle' | 'stopped';
export type BusStatusVisibility = Record<BusStatusCategory, boolean>;

export type FoodKey = 'F-1' | 'F-2' | 'F-3' | 'F-4' | 'F-5' | 'F-6';
export type FoodVisibility = Record<FoodKey, boolean>;

/**
 * Bus object sent by the backend and consumed by React.
 *
 * The backend includes both ping and fluid fields so the UI can switch tracking
 * modes without making another request. Several numeric values allow strings
 * because JSON payloads and test fixtures may pass through form-like values.
 */
export type LiveBus = {
  id: string;
  name?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  heading?: number | string | null;
  speed?: number | string | null;
  status?: string | null;
  lastUpdated?: string | null;
  address?: string | null;
  driver?: string | null;
  rawLastUpdated?: string | null;
  displayTimestamp?: string | null;
  isSmoothed?: boolean | null;
  routeName?: string | null;
  distanceToRouteMeters?: number | string | null;
  pingLat?: number | string | null;
  pingLng?: number | string | null;
  pingHeading?: number | string | null;
  pingSpeed?: number | string | null;
  pingStatus?: string | null;
  pingLastUpdated?: string | null;
  fluidLat?: number | string | null;
  fluidLng?: number | string | null;
  fluidHeading?: number | string | null;
  fluidSpeed?: number | string | null;
  fluidStatus?: string | null;
  fluidLastUpdated?: string | null;
};
