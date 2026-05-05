/**
 * Live bus data provider and optional marker renderer.
 *
 * `BusProvider` is the single frontend WebSocket client. It receives smoothed
 * bus payloads from the backend and exposes them through React context so the
 * rest of the app does not need to know about socket connection details.
 */

import { createContext, memo, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useBusMovementIcon } from './useBusMovementIcon';
import type { LiveBus, MapPoint, MarkerFocusHandler } from '../types/frontend';

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

/** Opens the live WebSocket feed and stores the latest bus array in context. */
export function BusProvider({ children }: BusProviderProps) {
  const WS_URL = 'ws://localhost:3001';
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    /** Create a socket and recursively reconnect after unexpected closes. */
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

type LiveBusMarkerProps = {
  bus: LiveBus;
  onMarkerFocus?: MarkerFocusHandler;
};

function LiveBusMarker({ bus, onMarkerFocus }: LiveBusMarkerProps) {
  const lat = Number(bus.lat);
  const lng = Number(bus.lng);
  const position = useMemo<MapPoint>(() => [lat, lng], [lat, lng]);
  const busIcon = useBusMovementIcon(position, bus.heading);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return (
    <Marker
      position={position}
      icon={busIcon}
      bubblingMouseEvents={false}
      zIndexOffset={1000}
      eventHandlers={{
        click: () => onMarkerFocus?.(position, 'marker'),
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
            {bus.routeName && (
              <div className="info-popup-card__data-item">
                <span className="info-popup-card__data-label">Route</span>
                <span className="info-popup-card__data-value">{bus.routeName}</span>
              </div>
            )}
            <div className="info-popup-card__data-item">
              <span className="info-popup-card__data-label">Updated</span>
              <span className="info-popup-card__data-value">
                {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
          {bus.address && <p className="info-popup-card__supporting">Address: {bus.address}</p>}
          {bus.driver && <p className="info-popup-card__supporting">Driver: {bus.driver}</p>}
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Standalone bus marker layer.
 *
 * `App.tsx` currently renders its own live markers because it also controls
 * tracking modes and status filters. This component remains useful for tests
 * or future pages that only need to render the current bus context.
 */
export const Bus = memo(function Bus({
  buses: busesProp,
  onMarkerFocus,
}: BusProps) {
  const busContext = useContext(BusContext);
  const { buses: busesFromContext } = busContext || { buses: [] };
  const buses = busesProp ?? busesFromContext;

  return (
    <>
      {buses.map((bus) => (
        <LiveBusMarker key={bus.id} bus={bus} onMarkerFocus={onMarkerFocus} />
      ))}
    </>
  );
});
