import { createContext, memo, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GetBusIcon } from './busMarkers';
import type { LiveBus, MarkerFocusHandler } from '../types/frontend';

type BusContextValue = {
  buses: LiveBus[];
  connectionStatus: string;
};

type BusProviderProps = {
  children: ReactNode;
};

type LocationUpdateMessage = {
  type: 'location_update';
  buses: LiveBus[];
};

function isLocationUpdateMessage(data: unknown): data is LocationUpdateMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === 'location_update' &&
    Array.isArray((data as { buses?: unknown }).buses)
  );
}

export const BusContext = createContext<BusContextValue | null>(null);

export function BusProvider({ children }: BusProviderProps) {
  const WS_URL = 'ws://localhost:3001';
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
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
          const data: unknown = JSON.parse(event.data);
          if (isLocationUpdateMessage(data)) {
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
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <BusContext.Provider value={{ buses, connectionStatus }}>
      {children}
    </BusContext.Provider>
  );
}

type BusProps = {
  buses?: LiveBus[];
  onMarkerFocus?: MarkerFocusHandler;
};

function getBusIconAddress(heading: LiveBus['heading']): string {
  const h = Number(heading ?? 0);

  if (h >= 315 || h < 45) return 'busIconNorth';
  if (h >= 45 && h < 135) return 'busIconEast';
  if (h >= 135 && h < 225) return 'busIconSouth';
  return 'busIconWest';
}

export const Bus = memo(function Bus({
  buses: busesProp,
  onMarkerFocus,
}: BusProps) {
  const busContext = useContext(BusContext);
  const { buses: busesFromContext } = busContext || { buses: [] };
  const buses = busesProp ?? busesFromContext;

  return (
    <>
      {buses.map((bus) => {
          const lat = Number(bus.lat);
          const lng = Number(bus.lng);
          const iconAddress = getBusIconAddress(bus.heading);
          
          return (
          <Marker
            key={bus.id}
            position={[lat, lng]}
            icon={GetBusIcon(iconAddress)}
            bubblingMouseEvents={false}
            zIndexOffset={1000}
            eventHandlers={{
              click: () => onMarkerFocus?.([lat, lng], 'marker'),
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
        })}
    </>
  );
});
