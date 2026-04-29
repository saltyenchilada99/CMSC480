import './App.css';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { Bus, BusContext } from './components/bus.tsx';
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
import { UserLocationMap } from "./UserTracker";
import { DEFAULT_BUS_STATUS_OPTIONS } from './components/SubHeader';
import { MapViewportController } from './components/MapViewportController.tsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const USER_ZOOM = 16;
const CAMPUS_CENTER = [41.012, -76.448];
const CAMPUS_ZOOM = USER_ZOOM;

function buildBaseFocus(userPosition, showUserLocation) {
  if (showUserLocation && userPosition) {
    return {
      type: 'user',
      center: userPosition,
      zoom: USER_ZOOM,
    };
  }

  return {
    type: 'campus',
    center: CAMPUS_CENTER,
    zoom: CAMPUS_ZOOM,
  };
}

function App() {
  const mapRef = useRef(null);
  const [showBuses, setShowBuses] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeVisibility, setRouteVisibility] = useState({
    campus: true,
    downtown: true,
    walmart: true,
  });
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [userPosition, setUserPosition] = useState(null);
  const { buses, connectionStatus } = useContext(BusContext);
  const [showAcademics, setShowAcademics] = useState(false);
  const [showRecreation, setShowRecreation] = useState(false);
  const [showDorms, setShowDorms] = useState(false);
  const [focusTarget, setFocusTarget] = useState({
    type: 'campus',
    center: CAMPUS_CENTER,
    zoom: CAMPUS_ZOOM,
  });
  const hasAutoCenteredOnUser = useRef(false);
  const centerOnUserWhenAvailable = useRef(false);
  const bloomsburgBounds = [
    [40.9850, -76.5050],
    [41.0300, -76.4300]
  ];
  const [showFood, setShowFood] = useState(false);
  const [busStatusVisibility, setBusStatusVisibility] = useState(DEFAULT_BUS_STATUS_OPTIONS);
  const [trackingMode, setTrackingMode] = useState('fluid');
  const [foodVisibility, setFoodVisibility] = useState({
    'F-1': true, 'F-2': true, 'F-3': true, 'F-4': true, 'F-5': true, 'F-6': true,
  });
  const [zoom, setZoom] = useState(16);

  const getStatusCategory = (status) => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (normalized === 'moving' || normalized === 'move' || normalized === 'active') return 'active';
    if (normalized === 'idle' || normalized === 'idling') return 'idle';
    if (normalized === 'stopped' || normalized === 'stop') return 'stopped';
    if (normalized === 'nodata' || normalized === 'no data') return 'stopped';
    return 'stopped';
  };

  const filteredBuses = buses.filter((bus) => {
    const category = getStatusCategory(bus.status);
    return !!busStatusVisibility[category];
  });

  const displayBuses = filteredBuses.map((bus) => {
    const lat = trackingMode === 'ping'
      ? (bus.pingLat ?? bus.lat)
      : (bus.fluidLat ?? bus.lat);
    const lng = trackingMode === 'ping'
      ? (bus.pingLng ?? bus.lng)
      : (bus.fluidLng ?? bus.lng);

    return {
      ...bus,
      lat,
      lng,
    };
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (showUserLocation && userPosition && (!hasAutoCenteredOnUser.current || centerOnUserWhenAvailable.current)) {
      hasAutoCenteredOnUser.current = true;
      centerOnUserWhenAvailable.current = false;
      setFocusTarget(buildBaseFocus(userPosition, true));
    }
  }, [showUserLocation, userPosition]);

  const handleUserToggle = useCallback((nextShowUserLocation) => {
    setShowUserLocation(nextShowUserLocation);

    if (!nextShowUserLocation) {
      centerOnUserWhenAvailable.current = false;
      return;
    }

    if (userPosition) {
      hasAutoCenteredOnUser.current = true;
      centerOnUserWhenAvailable.current = false;
      setFocusTarget(buildBaseFocus(userPosition, true));
      return;
    }

    centerOnUserWhenAvailable.current = true;
  }, [userPosition]);

  const handleResetFocus = useCallback(() => {
    setFocusTarget(buildBaseFocus(userPosition, showUserLocation));
  }, [userPosition, showUserLocation]);

  const handleMarkerFocus = useCallback((center, type = 'marker', zoom) => {
    setFocusTarget({
      type,
      center,
      ...(typeof zoom === 'number' ? { zoom } : {}),
    });
  }, []);


  return (
    <div className="app-container">
      <Header connectionStatus={connectionStatus} buses={buses} onMarkerFocus={handleMarkerFocus} />
      <div id="body">
        <SubHeader
          onBusesToggle={setShowBuses}
          onStopsToggle={setShowStops}
          onRoutesToggle={setShowRoutes}
          onRouteOptionsToggle={setRouteVisibility}
          onCenterMap={handleResetFocus}
          onUserToggle={handleUserToggle}
          onAcademicsToggle={setShowAcademics}
          onRecreationToggle={setShowRecreation}
          onDormsToggle={setShowDorms}
          onFoodToggle={setShowFood}
          onFoodOptionsToggle={setFoodVisibility}
          onBusStatusOptionsToggle={setBusStatusVisibility}
          onTrackingModeChange={setTrackingMode}
        />
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={CAMPUS_ZOOM}
          minZoom={14}
          maxZoom={18}
          maxBounds={bloomsburgBounds}
          maxBoundsViscosity={1.0}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
          onZoomEnd={() => {
            setZoom(mapRef.current.getZoom());
            console.log(zoom);
          }}
        >
          <MapViewportController
            focusTarget={focusTarget}
            onResetFocus={handleResetFocus}
          />
          <TileLayer
            attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}"
            ext="jpg"
          />
          {showUserLocation && <UserLocationMap userPos={userPosition} onMarkerFocus={handleMarkerFocus} />}

          {showBuses && <Bus buses={displayBuses} onMarkerFocus={handleMarkerFocus} />}
          {showAcademics && <Academic onMarkerFocus={handleMarkerFocus} />}
          {showRecreation && <Recreation onMarkerFocus={handleMarkerFocus} />}
          {showDorms && <Dorm onMarkerFocus={handleMarkerFocus} />}
          {showFood && <Food foodVisibility={foodVisibility} onMarkerFocus={handleMarkerFocus} />}

          <CampusLoopRoute toggleRoutes={showRoutes && routeVisibility.campus} />
          <DowntownLoopRoute toggleRoutes={showRoutes && routeVisibility.downtown} />
          <WalmartTripRoute toggleRoutes={showRoutes && routeVisibility.walmart} />
          {showStops && <BusStop onMarkerFocus={handleMarkerFocus} />}
        </MapContainer>
      </div>
      <Footer />
    </div>
  );
}

export default App;
