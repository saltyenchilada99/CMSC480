import './App.css';
import { useContext, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import {Bus, BusContext} from './components/bus.tsx';
import { BusStop } from './components/busStop.tsx';
import { Route } from './components/route.tsx';
import { Header } from './components/Header.js';
import { SubHeader } from './components/SubHeader.js';
import { Footer } from './components/Footer.js';
import { Academic } from './components/Academic.tsx';
import { Dorm } from './components/dorm.tsx';

// Fix Leaflet default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const WS_URL = 'ws://localhost:3001';

function App() {
  const [showBuses, setShowBuses] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const { buses, connectionStatus } = useContext(BusContext);
  const [showAcademics, setShowAcademics] = useState(false);
  const [showDorms, setShowDorms] = useState(false);

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
  return (
      <div className="app-container">
        <Header connectionStatus={connectionStatus} buses={buses} />
        <SubHeader
          onBusesToggle={setShowBuses}
          onStopsToggle={setShowStops}
          onRoutesToggle={setShowRoutes}
          onUserToggle={setShowUserLocation}
          onAcademicsToggle={setShowAcademics}
          onDormsToggle={setShowDorms}
        />
        <div id='body'>
          <MapContainer center={[41.012, -76.448]} zoom={15.25}>
            <TileLayer
                attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}"
                ext="jpg"
            />
            {userPos && showUserLocation && (
                <Marker position={userPos}>
                  <Popup>You are here</Popup>
                </Marker>
            )}
            {showBuses && <Bus />}

            <Route toggleRoutes={showRoutes} />
            {showAcademics && <Academic />}
            {showDorms && <Dorm />}
            {showStops && <BusStop />}
          </MapContainer>
        </div>
        <Footer />
      </div>
  );
}


export default App;
