import './App.css';
import { useContext, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import {Bus, BusContext} from './components/bus.tsx';
import { BusStop } from './components/busStop.tsx';
import { CampusLoopRoute } from './components/routes/campusLoopRoute.tsx';
import { DowntownLoopRoute } from './components/routes/downtownLoopRoute.tsx';
import { WalmartTripRoute } from './components/routes/walmartTripRoute.tsx';
import { Header } from './components/Header.js';
import { SubHeader } from './components/SubHeader.js';
import { Footer } from './components/Footer.js';
import { Academic } from './components/Academic.tsx';
import { Dorm } from './components/dorm.tsx';
import { Food } from './components/food.tsx';
import { UserLocationMap } from "./UserTracker";

// Fix Leaflet default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [showBuses, setShowBuses] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeVisibility, setRouteVisibility] = useState({
    campus: true,
    downtown: true,
    walmart: true,
  });
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [userPos] = useState(null);
  const { buses, connectionStatus } = useContext(BusContext);
  const [showAcademics, setShowAcademics] = useState(false);
  const [showDorms, setShowDorms] = useState(false);
  const bloomsburgBounds = [
    [40.9850, -76.5050], // Southwest corner of Bloomsburg
    [41.0300, -76.4300]  // Northeast corner of Bloomsburg
  ];
  const [showFood, setShowFood] = useState(false);
  const [foodVisibility, setFoodVisibility] = useState({
    'F-1': true, 'F-2': true, 'F-3': true, 'F-4': true, 'F-5': true, 'F-6': true,
  });

  return (
    <div className="app-container">
      <Header connectionStatus={connectionStatus} buses={buses} />
      <div id="body">
        {/* Floating layer panel overlaid on the map */}
        <SubHeader
          onBusesToggle={setShowBuses}
          onStopsToggle={setShowStops}
          onRoutesToggle={setShowRoutes}
          onRouteOptionsToggle={setRouteVisibility}
          onUserToggle={setShowUserLocation}
          onAcademicsToggle={setShowAcademics}
          onDormsToggle={setShowDorms}
          onFoodToggle={setShowFood}
          onFoodOptionsToggle={setFoodVisibility}
        />
        <MapContainer
            center={[41.012, -76.448]}
            zoom={15.25}
            minZoom={14}
            maxZoom={18}
            maxBounds={bloomsburgBounds}
            maxBoundsViscosity={1.0}
        >
          <TileLayer
            attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}"
            ext="jpg"
          />
          {showUserLocation && <UserLocationMap />}

          {showBuses && <Bus />}
          {showAcademics && <Academic />}
          {showDorms && <Dorm />}
          {showFood && <Food foodVisibility={foodVisibility} />}

          <CampusLoopRoute toggleRoutes={showRoutes && routeVisibility.campus} />
          <DowntownLoopRoute toggleRoutes={showRoutes && routeVisibility.downtown} />
          <WalmartTripRoute toggleRoutes={showRoutes && routeVisibility.walmart} />
          {showStops && <BusStop />}
        </MapContainer>
      </div>
      <Footer />
    </div>
  );
}

export default App;
