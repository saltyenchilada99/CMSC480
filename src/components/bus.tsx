import { createContext, memo, useContext, useEffect, useRef, useState} from 'react';
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

export const Bus = memo(function Bus({
  buses: busesProp,
  onMarkerFocus,
}: {
  buses?: Array<{ id: string; lat: number; lng: number; name?: string; status?: string; speed?: number; heading?: number; address?: string; driver?: string; lastUpdated?: string }>;
  onMarkerFocus?: (center: [number, number], type?: 'marker' | 'user', zoom?: number) => void;
}) {
  const busContext = useContext(BusContext);
  const { buses: busesFromContext } = busContext || { buses: [] };
  const buses = busesProp ?? busesFromContext;

  return (
        buses.map((bus: { id: string; lat: number; lng: number; name?: string; status?: string; speed?: number; heading?: number; address?: string; driver?: string; lastUpdated?: string }) => {
          let iconAddress = "";
          const h = bus.heading ?? 0;
          if (h >= 315 || h < 45) iconAddress = "busIconNorth";
          else if (h >= 45 && h < 135) iconAddress = "busIconEast";
          else if (h >= 135 && h < 225) iconAddress = "busIconSouth";
          else iconAddress = "busIconWest";
          
          return (
          <Marker
            key={bus.id}
            position={[bus.lat, bus.lng]}
            icon={GetBusIcon(iconAddress)}
            bubblingMouseEvents={false}
            zIndexOffset={1000}
            eventHandlers={{
              click: () => onMarkerFocus?.([bus.lat, bus.lng], 'marker'),
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
                    <span className="info-popup-card__data-value">{bus.heading ?? 'N/A'}°</span>
                  </div>
                  <div className="info-popup-card__data-item">
                    <span className="info-popup-card__data-label">Updated</span>
                    <span className="info-popup-card__data-value">{bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>
                {bus.address && <p className="info-popup-card__supporting">Address: {bus.address}</p>}
                {bus.driver && <p className="info-popup-card__supporting">Driver: {bus.driver}</p>}
              </div>
            </Popup>
          </Marker>
          );
        })
  );
});
