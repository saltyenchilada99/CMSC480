import './App.css';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { BusStop } from './components/busStop.tsx';
import { Route } from './components/route.tsx';
import { Header } from './components/Header.js';
import { SubHeader } from './components/SubHeader.js';
import { Footer } from './components/Footer.js';

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
  const [showUserLocation, setShowUserLocation] = useState(true);
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

  return (
      <div className="app-container">
        <Header connectionStatus={connectionStatus} buses={buses} />
        <SubHeader onUserToggle={setShowUserLocation} />
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
            {buses.map((bus) => (
                <Marker key={bus.id} position={[bus.lat, bus.lng]}>
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

            <Route />
            <BusStop />
          </MapContainer>
        </div>
        <Footer />
      </div>
  );
}

export default App;
