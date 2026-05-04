import './App.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { GetBusIcon } from './components/busMarkers.tsx';
import { BusStop } from './components/busStop.tsx';
import { CampusLoopRoute } from './components/routes/campusLoopRoute.tsx';
import { DowntownLoopRoute } from './components/routes/downtownLoopRoute.tsx';
import { WalmartTripRoute } from './components/routes/walmartTripRoute.tsx';
import { Header } from './components/Header.js';
import { SubHeader } from './components/SubHeader.js';
import { Footer } from './components/Footer.js';
import { Academic } from './components/Academic.tsx';
import { Recreation } from './components/Recreation.tsx';
import { Dorm } from './components/dorm.tsx';
import { Food } from './components/food.tsx';
import { DEFAULT_BUS_STATUS_OPTIONS, DEFAULT_FOOD_OPTIONS } from './components/SubHeader.js';

// Component to expose map instance to window for route components
function MapExporter({ onMapReady }) {
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

// Fix Leaflet default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const WS_URL = 'ws://localhost:3001';
const DEFAULT_ROUTE_VISIBILITY = {
  campus: true,
  downtown: true,
  walmart: true,
};
const CAMPUS_CENTER = [41.012, -76.448];
const CAMPUS_ZOOM = 15.25;
const BUS_MARKER_ANIMATION_MS = 240;

function getBusIconName(heading) {
  const normalizedHeading = ((Number(heading) || 0) % 360 + 360) % 360;
  if (normalizedHeading >= 315 || normalizedHeading < 45) return 'busIconNorth';
  if (normalizedHeading >= 45 && normalizedHeading < 135) return 'busIconEast';
  if (normalizedHeading >= 135 && normalizedHeading < 225) return 'busIconSouth';
  return 'busIconWest';
}

function getDisplayBus(bus, trackingMode) {
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

function DynamicBusMarker({ bus }) {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef([bus.lat, bus.lng]);
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
    const animate = (now) => {
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
    >
      <Popup autoPan={false}>
        <strong>{bus.name || bus.id}</strong><br />
        Status: {bus.status}<br />
        Speed: {bus.speed} mph<br />
        Heading: {bus.heading}°<br />
        {bus.address && <>Address: {bus.address}<br /></>}
        {bus.driver && <>Driver: {bus.driver}<br /></>}
        Updated: {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : 'N/A'}
      </Popup>
    </Marker>
  );
}

function App() {
  const [buses, setBuses] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [showBuses, setShowBuses] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeVisibility, setRouteVisibility] = useState(DEFAULT_ROUTE_VISIBILITY);
  const [showAcademics, setShowAcademics] = useState(false);
  const [showRecreation, setShowRecreation] = useState(false);
  const [showDorms, setShowDorms] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [foodVisibility, setFoodVisibility] = useState(DEFAULT_FOOD_OPTIONS);
  const [busStatusVisibility, setBusStatusVisibility] = useState(DEFAULT_BUS_STATUS_OPTIONS);
  const [trackingMode, setTrackingMode] = useState('ping');
  const wsRef = useRef(null);
  const mapRef = useRef(null);
  const [userPos, setUserPos] = useState(null);

  const areBusesEqual = useCallback((prev, next) => {
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i += 1) {
      const a = prev[i];
      const b = next[i];
      if (
        a.id !== b.id ||
        a.lat !== b.lat ||
        a.lng !== b.lng ||
        a.fluidLat !== b.fluidLat ||
        a.fluidLng !== b.fluidLng ||
        a.pingLat !== b.pingLat ||
        a.pingLng !== b.pingLng ||
        a.pingHeading !== b.pingHeading ||
        a.pingSpeed !== b.pingSpeed ||
        a.pingStatus !== b.pingStatus ||
        a.pingLastUpdated !== b.pingLastUpdated ||
        a.fluidHeading !== b.fluidHeading ||
        a.fluidSpeed !== b.fluidSpeed ||
        a.fluidStatus !== b.fluidStatus ||
        a.fluidLastUpdated !== b.fluidLastUpdated ||
        a.name !== b.name ||
        a.status !== b.status ||
        a.speed !== b.speed ||
        a.heading !== b.heading ||
        a.address !== b.address ||
        a.driver !== b.driver ||
        a.lastUpdated !== b.lastUpdated ||
        a.rawLastUpdated !== b.rawLastUpdated ||
        a.displayTimestamp !== b.displayTimestamp ||
        a.isSmoothed !== b.isSmoothed ||
        a.routeName !== b.routeName ||
        a.distanceToRouteMeters !== b.distanceToRouteMeters
      ) {
        return false;
      }
    }
    return true;
  }, []);

  const updateBuses = useCallback((incoming) => {
    if (!Array.isArray(incoming)) return;

    setBuses((prev) => (areBusesEqual(prev, incoming) ? prev : incoming));
  }, [areBusesEqual]);

  useEffect(() => {
    if (!navigator.geolocation || !showUserLocation) return undefined;

    let lastPos = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
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
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('Live');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'location_update') {
            updateBuses(data.buses);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('Reconnecting...');
        setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        setConnectionStatus('Error');
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [updateBuses]);

  useEffect(() => {
    const handlePopupWheel = (e) => {
      const target = e.target;
      if (target?.closest?.('.leaflet-popup-content-wrapper')) {
        e.preventDefault();
        e.stopPropagation();

        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer && mapContainer._leaflet_map) {
          const map = mapContainer._leaflet_map;
          const zoomDelta = e.deltaY > 0 ? -1 : 1;
          map.zoomBy(zoomDelta);
        }
      }
    };

    const handlePinchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handlePopupWheel, true);
    document.addEventListener('touchmove', handlePinchZoom, { passive: false });
    return () => {
      document.removeEventListener('wheel', handlePopupWheel, true);
      document.removeEventListener('touchmove', handlePinchZoom);
    };
  }, []);

  /**
   * Toggle states for map layers. These control whether the corresponding components are rendered on the map.
   * - toggleBus: Show/hide bus markers
   * - toggleStops: Show/hide bus stop markers
   * - toggleRoutes: Show/hide bus routes
   * - toggleUser: Show/hide user's current location marker
   * Each toggle is implemented as a checkbox in the UI, allowing users to customize their map view.
   * The state variables are passed down as props to the respective components to conditionally render them.
   * This approach keeps the map interactive and allows users to focus on the information they find most relevant.
   */
  const getStatusCategory = useCallback((status) => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (normalized === 'moving' || normalized === 'move' || normalized === 'active') return 'active';
    if (normalized === 'idle' || normalized === 'idling') return 'idle';
    return 'stopped';
  }, []);

  const visibleBuses = useMemo(() => buses.filter((bus) => {
    const displayBus = getDisplayBus(bus, trackingMode);
    const category = getStatusCategory(displayBus.status);
    return !!busStatusVisibility[category];
  }).map((bus) => getDisplayBus(bus, trackingMode)), [buses, busStatusVisibility, getStatusCategory, trackingMode]);

  const panelBuses = useMemo(() => (
    buses.map((bus) => getDisplayBus(bus, trackingMode))
  ), [buses, trackingMode]);

  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleCenterMap = useCallback(() => {
    mapRef.current?.flyTo(CAMPUS_CENTER, CAMPUS_ZOOM, {
      animate: true,
      duration: 0.5,
    });
  }, []);

  const busMarkers = useMemo(() => visibleBuses.map((bus) => (
    <DynamicBusMarker
      key={bus.id}
      bus={bus}
    />
  )), [visibleBuses]);

  const userMarker = useMemo(() => {
    if (!userPos || !showUserLocation) return null;
    return (
      <Marker position={userPos}>
        <Popup autoPan={false}>You are here</Popup>
      </Marker>
    );
  }, [userPos, showUserLocation]);

  return (
      <div className="app-container">
        <Header connectionStatus={connectionStatus} buses={buses} />
        <div id='body'>
          <SubHeader
            buses={panelBuses}
            connectionStatus={connectionStatus}
            onBusesToggle={setShowBuses}
            onStopsToggle={setShowStops}
            onUserToggle={setShowUserLocation}
            onRoutesToggle={setShowRoutes}
            onRouteOptionsToggle={setRouteVisibility}
            onCenterMap={handleCenterMap}
            onAcademicsToggle={setShowAcademics}
            onRecreationToggle={setShowRecreation}
            onDormsToggle={setShowDorms}
            onFoodToggle={setShowFood}
            onFoodOptionsToggle={setFoodVisibility}
            onBusStatusOptionsToggle={setBusStatusVisibility}
            onTrackingModeChange={setTrackingMode}
          />
          <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM}>
            <MapExporter onMapReady={handleMapReady} />
            <TileLayer
                attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}"
                ext="jpg"
            />
            {userMarker}
            {showBuses && busMarkers}

            <CampusLoopRoute toggleRoutes={showRoutes && routeVisibility.campus} />
            <DowntownLoopRoute toggleRoutes={showRoutes && routeVisibility.downtown} />
            <WalmartTripRoute toggleRoutes={showRoutes && routeVisibility.walmart} />
            {showAcademics && <Academic />}
            {showRecreation && <Recreation />}
            {showDorms && <Dorm />}
            {showFood && <Food foodVisibility={foodVisibility} />}
            {showStops && <BusStop />}
          </MapContainer>
        </div>
        <Footer />
      </div>
  );
}


export default App;
