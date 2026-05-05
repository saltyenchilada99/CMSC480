export type MapPoint = [number, number];

export type MapFocusTarget = {
  type: 'campus' | 'marker' | 'user';
  center: MapPoint;
  zoom?: number;
  markerKey?: string;
  requestId?: number;
};

export type MarkerFocusHandler = (
  center: MapPoint,
  type?: 'marker' | 'user',
  zoom?: number,
  markerKey?: string
) => void;

export type SelectedMarker = {
  key: string | null;
  requestId: number;
  zoom?: number;
};

export type TrackingMode = 'fluid' | 'ping';

export type RouteKey = 'campus' | 'downtown' | 'walmart';
export type RouteVisibility = Record<RouteKey, boolean>;

export type BusStatusCategory = 'active' | 'idle' | 'stopped';
export type BusStatusVisibility = Record<BusStatusCategory, boolean>;

export type FoodKey = 'F-1' | 'F-2' | 'F-3' | 'F-4' | 'F-5' | 'F-6';
export type FoodVisibility = Record<FoodKey, boolean>;

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
