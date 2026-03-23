import { createContext, useContext, useEffect, useRef, useState} from 'react';
// Giving problems when including React in the list above for some reason
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import { GetBusIcon } from './busMarkers.tsx';

export const BusContext = createContext(null);

export function BusProvider({ children } : {children : React.ReactNode} ) {
  const WS_URL = 'ws://localhost:3001';
  const [buses, setBuses] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  // assigning type to the WebSocket reference to ensure type safety. Syntax error without it
  const wsRef = useRef<WebSocket | null>(null);
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

  // No given type but output is not affected
  return (
    <BusContext.Provider value={{ buses, connectionStatus}}>
      {children}
    </BusContext.Provider>
  );
}

export function Bus() {
  // No given type but output is not affected
  const { buses } = useContext(BusContext);

  return (
        buses.map((bus: { id: string; lat: number; lng: number; name?: string; status?: string; speed?: number; heading?: number; address?: string; driver?: string; lastUpdated?: string }) => (
          <Marker
            key={bus.id}
            position={[bus.lat, bus.lng]}
            icon={GetBusIcon("busIcon")}
          >
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
        ))
  );
}