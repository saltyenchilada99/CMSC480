import './App.css';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusContext } from './components/bus';
import { GetBusIcon } from './components/busMarkers';
import { BusStop } from './components/busStop';
import { CampusLoopRoute } from './components/routes/campusLoopRoute';
import { DowntownLoopRoute } from './components/routes/downtownLoopRoute';
import { WalmartTripRoute } from './components/routes/walmartTripRoute';
import { Header } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { Footer } from './components/Footer';
import { Academic } from './components/Academic';
import { Recreation } from './components/Recreation';
import { Dorm } from './components/dorm';
import { Food } from './components/food';
import { UserLocationMap } from './UserTracker';
import { MapViewportController } from './components/MapViewportController';
import { DEFAULT_BUS_STATUS_OPTIONS, DEFAULT_FOOD_OPTIONS } from './components/SubHeader';
import type {
  BusStatusCategory,
  BusStatusVisibility,
  LiveBus,
  MapFocusTarget,
  MapPoint,
  MarkerFocusHandler,
  RouteVisibility,
  TrackingMode,
} from './types/frontend';

type MapExporterProps = {
  onMapReady?: (map: L.Map | null) => void;
};

function MapExporter({ onMapReady }: MapExporterProps) {
  const map = useMap();

  useEffect(() => {
    window.__MAP__ = map;
    onMapReady?.(map);

    return () => {
      delete window.__MAP__;
      onMapReady?.(null);
    };
  }, [map, onMapReady]);

  return null;
}

type ZoomListenerProps = {
  setZoom: (zoom: number) => void;
};

function ZoomListener({ setZoom }: ZoomListenerProps) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  return null;
}

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DEFAULT_ROUTE_VISIBILITY: RouteVisibility = {
  campus: true,
  downtown: true,
  walmart: true,
};

const CAMPUS_CENTER: MapPoint = [41.012, -76.448];
const CAMPUS_ZOOM = 15.25;
const BUS_MARKER_ANIMATION_MS = 240;
const EMPTY_BUSES: LiveBus[] = [];
const BLOOMSBURG_BOUNDS: [MapPoint, MapPoint] = [
  [40.9850, -76.5050],
  [41.0300, -76.4300],
];

function getBusIconName(heading: LiveBus['heading']): string {
  const normalizedHeading = ((Number(heading) || 0) % 360 + 360) % 360;
  if (normalizedHeading >= 315 || normalizedHeading < 45) return 'busIconNorth';
  if (normalizedHeading >= 45 && normalizedHeading < 135) return 'busIconEast';
  if (normalizedHeading >= 135 && normalizedHeading < 225) return 'busIconSouth';
  return 'busIconWest';
}

function getDisplayBus(bus: LiveBus, trackingMode: TrackingMode): LiveBus {
  if (trackingMode === 'ping') {
    return {
      ...bus,
      lat: bus.pingLat ?? bus.lat,
      lng: bus.pingLng ?? bus.lng,
      heading: bus.pingHeading ?? bus.heading,
      speed: bus.pingSpeed ?? bus.speed,
      status: bus.pingStatus ?? bus.status,
      lastUpdated: bus.pingLastUpdated ?? bus.rawLastUpdated ?? bus.lastUpdated,
    };
  }

  return {
    ...bus,
    lat: bus.fluidLat ?? bus.lat,
    lng: bus.fluidLng ?? bus.lng,
    heading: bus.fluidHeading ?? bus.heading,
    speed: bus.fluidSpeed ?? bus.speed,
    status: bus.fluidStatus ?? bus.status,
    lastUpdated: bus.fluidLastUpdated ?? bus.lastUpdated,
  };
}

type DynamicBusMarkerProps = {
  bus: LiveBus;
  onMarkerFocus?: MarkerFocusHandler;
};

function DynamicBusMarker({ bus, onMarkerFocus }: DynamicBusMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef<MapPoint>([Number(bus.lat), Number(bus.lng)]);
  const busIcon = useMemo(() => GetBusIcon(getBusIconName(bus.heading)), [bus.heading]);

  useEffect(() => () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    const nextLat = Number(bus.lat);
    const nextLng = Number(bus.lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return undefined;
    }

    if (!marker) {
      positionRef.current = [nextLat, nextLng];
      return undefined;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = marker.getLatLng();
    const startLat = start.lat;
    const startLng = start.lng;

    if (Math.abs(startLat - nextLat) < 0.000001 && Math.abs(startLng - nextLng) < 0.000001) {
      marker.setLatLng([nextLat, nextLng]);
      positionRef.current = [nextLat, nextLng];
      return undefined;
    }

    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / BUS_MARKER_ANIMATION_MS);
      marker.setLatLng([
        startLat + ((nextLat - startLat) * progress),
        startLng + ((nextLng - startLng) * progress),
      ]);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      positionRef.current = [nextLat, nextLng];
      animationRef.current = null;
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [bus.lat, bus.lng]);

  return (
    <Marker
      ref={markerRef}
      key={bus.id}
      position={positionRef.current}
      icon={busIcon}
      bubblingMouseEvents={false}
      zIndexOffset={1000}
      eventHandlers={{
        click: () => onMarkerFocus?.([Number(bus.lat), Number(bus.lng)], 'marker'),
      }}
    >
      <Popup className="campus-popup campus-popup--transit" minWidth={236} maxWidth={292} autoPan={false}>
        <div className="info-popup-card info-popup-card--transit">
          <span className="info-popup-card__eyebrow">Live bus</span>
          <h3 className="info-popup-card__title">{bus.name || bus.id}</h3>
          <div className="info-popup-card__data-grid">
            <div className="info-popup-card__data-item">
              <span className="info-popup-card__data-label">Status</span>
              <span className="info-popup-card__data-value">{bus.status || 'Unknown'}</span>
            </div>
            <div className="info-popup-card__data-item">
              <span className="info-popup-card__data-label">Speed</span>
              <span className="info-popup-card__data-value">{bus.speed ?? 'N/A'} mph</span>
            </div>
            <div className="info-popup-card__data-item">
              <span className="info-popup-card__data-label">Heading</span>
              <span className="info-popup-card__data-value">{bus.heading ?? 'N/A'} deg</span>
            </div>
            <div className="info-popup-card__data-item">
              <span className="info-popup-card__data-label">Updated</span>
              <span className="info-popup-card__data-value">
                {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
          {bus.address && <p className="info-popup-card__supporting">Address: {bus.address}</p>}
          {bus.driver && <p className="info-popup-card__supporting">Driver: {bus.driver}</p>}
        </div>
      </Popup>
    </Marker>
  );
}

function App() {
  const busContext = useContext(BusContext);
  const buses = busContext?.buses ?? EMPTY_BUSES;
  const connectionStatus = busContext?.connectionStatus || 'Connecting...';
  const [showBuses, setShowBuses] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeVisibility, setRouteVisibility] = useState<RouteVisibility>(DEFAULT_ROUTE_VISIBILITY);
  const [busStatusVisibility, setBusStatusVisibility] = useState<BusStatusVisibility>(DEFAULT_BUS_STATUS_OPTIONS);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('ping');
  const [zoom, setZoom] = useState(CAMPUS_ZOOM);
  const [userPos, setUserPos] = useState<MapPoint | null>(null);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget>({
    type: 'campus',
    center: CAMPUS_CENTER,
    zoom: CAMPUS_ZOOM,
  });
  const mapRef = useRef<L.Map | null>(null);
  const foodVisibility = DEFAULT_FOOD_OPTIONS;

  useEffect(() => {
    if (!navigator.geolocation || !showUserLocation) return undefined;

    let lastPos: MapPoint | null = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: MapPoint = [pos.coords.latitude, pos.coords.longitude];
        if (
          lastPos &&
          Math.abs(lastPos[0] - coords[0]) < 0.00005 &&
          Math.abs(lastPos[1] - coords[1]) < 0.00005
        ) {
          return;
        }

        lastPos = coords;
        setUserPos(coords);
      },
      (err) => console.error('Geolocation error:', err),
      {
        enableHighAccuracy: false,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [showUserLocation]);

  useEffect(() => {
    const handlePopupWheel = (event: WheelEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.leaflet-popup-content-wrapper')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePinchZoom = (event: TouchEvent) => {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', handlePopupWheel, true);
    document.addEventListener('touchmove', handlePinchZoom, { passive: false });

    return () => {
      document.removeEventListener('wheel', handlePopupWheel, true);
      document.removeEventListener('touchmove', handlePinchZoom);
    };
  }, []);

  const getStatusCategory = useCallback((status: LiveBus['status']): BusStatusCategory => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (normalized === 'moving' || normalized === 'move' || normalized === 'active') return 'active';
    if (normalized === 'idle' || normalized === 'idling') return 'idle';
    return 'stopped';
  }, []);

  const displayBuses = useMemo(() => (
    buses
      .map((bus) => getDisplayBus(bus, trackingMode))
      .filter((bus) => Number.isFinite(Number(bus.lat)) && Number.isFinite(Number(bus.lng)))
  ), [buses, trackingMode]);

  const visibleBuses = useMemo(() => (
    displayBuses.filter((bus) => {
      const category = getStatusCategory(bus.status);
      return busStatusVisibility[category];
    })
  ), [busStatusVisibility, displayBuses, getStatusCategory]);

  const handleMapReady = useCallback((map: L.Map | null) => {
    mapRef.current = map;
  }, []);

  const handleCenterMap = useCallback(() => {
    setFocusTarget({
      type: 'campus',
      center: CAMPUS_CENTER,
      zoom: CAMPUS_ZOOM,
    });

    mapRef.current?.flyTo(CAMPUS_CENTER, CAMPUS_ZOOM, {
      animate: true,
      duration: 0.5,
    });
  }, []);

  const handleMarkerFocus = useCallback<MarkerFocusHandler>((center, type = 'marker', targetZoom) => {
    const nextCenter: MapPoint = [Number(center[0]), Number(center[1])];
    if (!Number.isFinite(nextCenter[0]) || !Number.isFinite(nextCenter[1])) {
      return;
    }

    setFocusTarget({
      type,
      center: nextCenter,
      zoom: targetZoom,
    });
  }, []);

  const busMarkers = useMemo(() => visibleBuses.map((bus) => (
    <DynamicBusMarker
      key={bus.id}
      bus={bus}
      onMarkerFocus={handleMarkerFocus}
    />
  )), [handleMarkerFocus, visibleBuses]);

  return (
    <div className="app-container">
      <Header connectionStatus={connectionStatus} buses={buses} onMarkerFocus={handleMarkerFocus} />
      <div id="body">
        <SubHeader
          buses={displayBuses}
          connectionStatus={connectionStatus}
          onBusesToggle={setShowBuses}
          onStopsToggle={setShowStops}
          onUserToggle={setShowUserLocation}
          onRoutesToggle={setShowRoutes}
          onRouteOptionsToggle={setRouteVisibility}
          onCenterMap={handleCenterMap}
          onBusStatusOptionsToggle={setBusStatusVisibility}
          onTrackingModeChange={setTrackingMode}
        />
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={CAMPUS_ZOOM}
          minZoom={14}
          maxZoom={18}
          maxBounds={BLOOMSBURG_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          <MapExporter onMapReady={handleMapReady} />
          <ZoomListener setZoom={setZoom} />
          <MapViewportController focusTarget={focusTarget} onResetFocus={handleCenterMap} />
          <TileLayer
            attribution='&copy; CNES, Distribution Airbus DS, &copy; Airbus DS, &copy; PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank" rel="noopener noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg"
          />
          {showUserLocation && <UserLocationMap userPos={userPos} onMarkerFocus={handleMarkerFocus} />}
          {showBuses && busMarkers}
          <CampusLoopRoute toggleRoutes={showRoutes && routeVisibility.campus} />
          <DowntownLoopRoute toggleRoutes={showRoutes && routeVisibility.downtown} />
          <WalmartTripRoute toggleRoutes={showRoutes && routeVisibility.walmart} />
          <Academic onMarkerFocus={handleMarkerFocus} zoom={zoom} />
          <Recreation onMarkerFocus={handleMarkerFocus} zoom={zoom} />
          <Dorm onMarkerFocus={handleMarkerFocus} zoom={zoom} />
          <Food foodVisibility={foodVisibility} onMarkerFocus={handleMarkerFocus} zoom={zoom} />
          {showStops && <BusStop onMarkerFocus={handleMarkerFocus} zoom={zoom} />}
        </MapContainer>
      </div>
      <Footer />
    </div>
  );
}

export default App;
