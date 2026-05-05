import './App.css';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusContext } from './components/bus';
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
import { useBusMovementIcon } from './components/useBusMovementIcon';
import type {
  BusStatusCategory,
  BusStatusVisibility,
  LiveBus,
  MapFocusTarget,
  MapPoint,
  MarkerFocusHandler,
  RouteVisibility,
  SelectedMarker,
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
const EMPTY_BUSES: LiveBus[] = [];
const BLOOMSBURG_BOUNDS: [MapPoint, MapPoint] = [
  [40.9700, -76.5250],
  [41.0450, -76.4050],
];

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
  const lat = Number(bus.lat);
  const lng = Number(bus.lng);
  const position = useMemo<MapPoint>(() => [lat, lng], [lat, lng]);
  const busIcon = useBusMovementIcon(position, bus.heading);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return (
    <Marker
      key={bus.id}
      position={position}
      icon={busIcon}
      bubblingMouseEvents={false}
      zIndexOffset={1000}
      eventHandlers={{
        click: () => onMarkerFocus?.(position, 'marker'),
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
            {bus.routeName && (
              <div className="info-popup-card__data-item">
                <span className="info-popup-card__data-label">Route</span>
                <span className="info-popup-card__data-value">{bus.routeName}</span>
              </div>
            )}
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
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('fluid');
  const [zoom, setZoom] = useState(CAMPUS_ZOOM);
  const [userPos, setUserPos] = useState<MapPoint | null>(null);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget>({
    type: 'campus',
    center: CAMPUS_CENTER,
    zoom: CAMPUS_ZOOM,
  });
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>({
    key: null,
    requestId: 0,
  });
  const mapRef = useRef<L.Map | null>(null);
  const markerRequestIdRef = useRef(0);
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
    setSelectedMarker((prev) => ({
      key: null,
      requestId: prev.requestId,
    }));

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

  const handleMarkerFocus = useCallback<MarkerFocusHandler>((center, type = 'marker', targetZoom, markerKey) => {
    const nextCenter: MapPoint = [Number(center[0]), Number(center[1])];
    if (!Number.isFinite(nextCenter[0]) || !Number.isFinite(nextCenter[1])) {
      return;
    }

    const nextRequestId = markerKey ? markerRequestIdRef.current + 1 : markerRequestIdRef.current;
    if (markerKey) {
      markerRequestIdRef.current = nextRequestId;
      if (markerKey.startsWith('BS-')) {
        setShowStops(true);
      }
      setSelectedMarker({
        key: markerKey,
        requestId: nextRequestId,
        zoom: targetZoom,
      });
    } else if (type !== 'marker') {
      setSelectedMarker((prev) => ({
        key: null,
        requestId: prev.requestId,
      }));
    }

    setFocusTarget({
      type,
      center: nextCenter,
      zoom: targetZoom,
      markerKey,
      requestId: nextRequestId,
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
          <Academic onMarkerFocus={handleMarkerFocus} selectedMarker={selectedMarker} zoom={zoom} />
          <Recreation onMarkerFocus={handleMarkerFocus} selectedMarker={selectedMarker} zoom={zoom} />
          <Dorm onMarkerFocus={handleMarkerFocus} selectedMarker={selectedMarker} zoom={zoom} />
          <Food foodVisibility={foodVisibility} onMarkerFocus={handleMarkerFocus} selectedMarker={selectedMarker} zoom={zoom} />
          {showStops && <BusStop onMarkerFocus={handleMarkerFocus} selectedMarker={selectedMarker} zoom={zoom} />}
        </MapContainer>
      </div>
      <Footer />
    </div>
  );
}

export default App;
