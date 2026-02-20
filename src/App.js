import './App.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <div><header>hello?</header>
    <MapContainer center={[41.012, -76.448]} zoom={15.5}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    </MapContainer></div>
  );
}

export default App;
