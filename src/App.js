import './App.css';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { BusStop } from './components/busStop.tsx';
import { Route } from './components/route.tsx';
import { GetBusIcon } from './components/busMarkers.tsx';

// Fix Leaflet default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const WS_URL = 'ws://localhost:3001';

function App() {
  const [buses, setBuses] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const wsRef = useRef(null);
  const [userPos, setUserPos] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
            setBuses(data.buses);
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
  const [toggleBus, setShowBuses] = useState(true);
  const [toggleStops, setShowStops] = useState(true);
  const [toggleRoutes, setRoutes] = useState(false);
  const [toggleUser, setUser] = useState(true);

  return (
    <div>
      <header className="app-header">
        <span>Bloomsburg Campus Bus Tracker</span>
        <span className={`status-badge ${connectionStatus === 'Live' ? 'live' : 'offline'}`}>
          {connectionStatus} {buses.length > 0 ? `· ${buses.length} bus${buses.length !== 1 ? 'es' : ''}` : ''}
        </span>
      </header>
      <div id='body'>
        <div id='toggle'>
          <div className='toggle-item'><input type="checkbox" id="busToggle" checked={toggleBus}
            onChange={(e) => setShowBuses(e.target.checked)}></input><label>Buses</label></div>
          <div className='toggle-item'><input type="checkbox" id="stops" checked={toggleStops}
            onChange={(e) => setShowStops(e.target.checked)}></input><label>Stops</label></div>
          <div className='toggle-item'><input type="checkbox" id="routes" checked={toggleRoutes}
            onChange={(e) => setRoutes(e.target.checked)}></input><label>Routes</label></div>
          <div className='toggle-item'><input type="checkbox" id="user" checked={toggleUser}
            onChange={(e) => setUser(e.target.checked)}></input><label>User</label></div>
        </div>
        <MapContainer center={[41.012, -76.448]} zoom={15.25}>
          <TileLayer
            attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}"
            ext="jpg"
          />
          {toggleUser && userPos && (
            <Marker position={userPos}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {toggleBus && buses.map((bus) => (
            <Marker key={bus.id} position={[bus.lat - 0.00005, bus.lng]} className="bus-marker" icon={GetBusIcon("busIcon")}>
              <Popup>
                <strong>{bus.name || bus.id}</strong><br />
                Status: {bus.status}<br />
                Speed: {bus.speed} mph<br />
                Heading: {bus.heading}°<br />
                {bus.address && <>Address: {bus.address}<br /></>}
                {bus.driver && <>Driver: {bus.driver}<br /></>}
                Updated: {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : 'N/A'}
              </Popup>
            </Marker>
          ))}

          /**
            * Conditional rendering of map layers based on toggle states.
           */
          {toggleRoutes && <Route />}
          {toggleStops && <BusStop />}
        </MapContainer>

      </div>
    </div>
  );
}


export default App;
