import { Fragment, useState, type ChangeEventHandler } from 'react';
import '../styles/SubHeader.css';
import busIcon from './bus_icon.png';
import busStopIcon from './bus_stop_icon.png';
import type {
  BusStatusCategory,
  BusStatusVisibility,
  FoodVisibility,
  LiveBus,
  RouteKey,
  RouteVisibility,
  TrackingMode,
} from '../types/frontend';

type OverlayKey = 'buses' | 'stops' | 'routes' | 'user';
type OverlayVisibility = Record<OverlayKey, boolean>;

type SubHeaderProps = {
  buses?: LiveBus[];
  connectionStatus?: string;
  onBusesToggle?: (visible: boolean) => void;
  onStopsToggle?: (visible: boolean) => void;
  onRoutesToggle?: (visible: boolean) => void;
  onRouteOptionsToggle?: (options: RouteVisibility) => void;
  onCenterMap?: () => void;
  onUserToggle?: (visible: boolean) => void;
  onBusStatusOptionsToggle?: (options: BusStatusVisibility) => void;
  onTrackingModeChange?: (mode: TrackingMode) => void;
};

const DEFAULT_OVERLAYS: OverlayVisibility = {
  buses: true,
  stops: true,
  routes: true,
  user: true,
};

const DEFAULT_TRACKING_MODE: TrackingMode = 'fluid';

export const DEFAULT_BUS_STATUS_OPTIONS: BusStatusVisibility = {
  active: true,
  idle: true,
  stopped: true,
};

const BUS_STATUS_KEYS = Object.keys(DEFAULT_BUS_STATUS_OPTIONS) as BusStatusCategory[];

const BUS_STATUS_LABELS: Record<BusStatusCategory, string> = {
  active: 'Active (Moving)',
  idle: 'Idle',
  stopped: 'Stopped',
};

const BUS_STATUS_COLORS: Record<BusStatusCategory, string> = {
  active: '#2e7d32',
  idle: '#f9a825',
  stopped: '#c62828',
};

const DEFAULT_ROUTE_OPTIONS: RouteVisibility = {
  campus: true,
  downtown: true,
  walmart: true,
};

const ROUTE_KEYS = Object.keys(DEFAULT_ROUTE_OPTIONS) as RouteKey[];

const ROUTE_COLORS: Record<RouteKey, string> = {
  campus: '#B8860B',
  downtown: '#6D0026',
  walmart: '#0057B8',
};

const ROUTE_LABELS: Record<RouteKey, string> = {
  campus: 'Campus Loop',
  downtown: 'Downtown Loop',
  walmart: 'Walmart Trip',
};

export const DEFAULT_FOOD_OPTIONS: FoodVisibility = {
  'F-1': true,
  'F-2': true,
  'F-3': true,
  'F-4': true,
  'F-5': true,
  'F-6': true,
};

function LocationButtonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-5.5-4-5.5-9.5a5.5 5.5 0 1 1 11 0C17.5 17 12 21 12 21Z" />
      <circle cx="12" cy="11.5" r="1.8" />
    </svg>
  );
}

function CenterMapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.75v3.25" />
      <path d="M12 18v3.25" />
      <path d="M2.75 12h3.25" />
      <path d="M18 12h3.25" />
      <circle cx="12" cy="12" r="8" opacity="0.55" />
    </svg>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-switch" onClick={(event) => event.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track" />
    </label>
  );
}

export function SubHeader({
  buses = [],
  connectionStatus = 'Offline',
  onBusesToggle,
  onStopsToggle,
  onRoutesToggle,
  onRouteOptionsToggle,
  onCenterMap,
  onUserToggle,
  onBusStatusOptionsToggle,
  onTrackingModeChange,
}: SubHeaderProps) {
  const [overlays, setOverlays] = useState(DEFAULT_OVERLAYS);
  const [routeOptions, setRouteOptions] = useState(DEFAULT_ROUTE_OPTIONS);
  const [busStatusOptions, setBusStatusOptions] = useState(DEFAULT_BUS_STATUS_OPTIONS);
  const [trackingMode, setTrackingMode] = useState(DEFAULT_TRACKING_MODE);
  const [activeTab, setActiveTab] = useState('layers');
  const [panelOpen, setPanelOpen] = useState(true);

  const syncMainBusesToggle = (nextOptions: BusStatusVisibility) => {
    const anyEnabled = Object.values(nextOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.buses === anyEnabled) return prev;
      onBusesToggle?.(anyEnabled);
      return { ...prev, buses: anyEnabled };
    });
  };

  const syncMainRoutesToggle = (nextOptions: RouteVisibility) => {
    const anyEnabled = Object.values(nextOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.routes === anyEnabled) return prev;
      onRoutesToggle?.(anyEnabled);
      return { ...prev, routes: anyEnabled };
    });
  };

  const handleToggle = (key: OverlayKey) => {
    const next = { ...overlays, [key]: !overlays[key] };
    setOverlays(next);

    if (key === 'buses') {
      onBusesToggle?.(next.buses);
      const nextBusStatusOptions = Object.fromEntries(
        BUS_STATUS_KEYS.map((statusKey) => [statusKey, next.buses])
      ) as BusStatusVisibility;
      setBusStatusOptions(nextBusStatusOptions);
      onBusStatusOptionsToggle?.(nextBusStatusOptions);
    }

    if (key === 'stops') onStopsToggle?.(next.stops);
    if (key === 'user') onUserToggle?.(next.user);

    if (key === 'routes') {
      onRoutesToggle?.(next.routes);
      const nextRouteOptions = Object.fromEntries(
        ROUTE_KEYS.map((routeKey) => [routeKey, next.routes])
      ) as RouteVisibility;
      setRouteOptions(nextRouteOptions);
      onRouteOptionsToggle?.(nextRouteOptions);
    }
  };

  const handleRouteOptionToggle = (routeKey: RouteKey) => {
    const next = { ...routeOptions, [routeKey]: !routeOptions[routeKey] };
    setRouteOptions(next);
    onRouteOptionsToggle?.(next);
    syncMainRoutesToggle(next);
  };

  const handleBusStatusOptionToggle = (statusKey: BusStatusCategory) => {
    const next = { ...busStatusOptions, [statusKey]: !busStatusOptions[statusKey] };
    setBusStatusOptions(next);
    onBusStatusOptionsToggle?.(next);
    syncMainBusesToggle(next);
  };

  const handleReset = () => {
    setOverlays((prev) => ({
      ...prev,
      stops: DEFAULT_OVERLAYS.stops,
      routes: DEFAULT_OVERLAYS.routes,
    }));
    setRouteOptions(DEFAULT_ROUTE_OPTIONS);
    onStopsToggle?.(DEFAULT_OVERLAYS.stops);
    onRoutesToggle?.(DEFAULT_OVERLAYS.routes);
    onRouteOptionsToggle?.(DEFAULT_ROUTE_OPTIONS);
  };

  const handleTrackingModeChange = (mode: TrackingMode) => {
    setTrackingMode(mode);
    onTrackingModeChange?.(mode);
  };

  const getStatusCategory = (status: LiveBus['status']): BusStatusCategory => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (normalized === 'moving' || normalized === 'move' || normalized === 'active') return 'active';
    if (normalized === 'idle' || normalized === 'idling') return 'idle';
    return 'stopped';
  };

  const getBusName = (bus: LiveBus, index: number) => bus.name || bus.id || `Bus ${index + 1}`;
  const getBusMeta = (bus: LiveBus) => {
    const routeName = bus.routeName?.trim();
    if (routeName) return routeName;

    if (bus.lastUpdated) {
      return `Updated ${new Date(bus.lastUpdated).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }

    return 'Live location';
  };
  const statusSortOrder: Record<BusStatusCategory, number> = { active: 0, idle: 1, stopped: 2 };
  const sortedBuses = buses
    .map((bus, index) => ({
      bus,
      index,
      statusCategory: getStatusCategory(bus.status),
      label: getBusName(bus, index),
    }))
    .sort((a, b) => (
      statusSortOrder[a.statusCategory] - statusSortOrder[b.statusCategory] ||
      a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
    ));

  const layers: Array<{ key: Exclude<OverlayKey, 'buses'>; img?: string; icon?: string; label: string }> = [
    { key: 'stops', img: busStopIcon, label: 'Bus Stops' },
    { key: 'routes', icon: 'R', label: 'Routes' },
    { key: 'user', label: 'My Location' },
  ];

  if (!panelOpen) {
    return (
      <button
        type="button"
        className="map-layer-panel-open"
        aria-label="Show map layer panel"
        onClick={() => setPanelOpen(true)}
      >
        Layers
      </button>
    );
  }

  return (
    <div className="map-layer-panel">
      <div className="map-layer-panel-header">
        <span>Map Layers</span>
        <button
          type="button"
          className="map-layer-panel-collapse"
          aria-label="Hide map layer panel"
          onClick={() => setPanelOpen(false)}
        >
          Hide
        </button>
      </div>

      <div className="map-layer-tabs" role="tablist" aria-label="Map panel views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'buses'}
          className={`map-layer-tab ${activeTab === 'buses' ? 'map-layer-tab--active' : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          Buses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'layers'}
          className={`map-layer-tab ${activeTab === 'layers' ? 'map-layer-tab--active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          Layers
        </button>
      </div>

      <div className="map-layer-panel-body">
        {activeTab === 'buses' && (
          <div className="bus-tab-panel">
            <div className="layer-item bus-tab-toggle" onClick={() => handleToggle('buses')}>
              <div className="layer-item-left">
                <img src={busIcon} alt="Buses" className="layer-item-icon-img" />
                <span className="layer-item-label">Show Buses</span>
              </div>
              <Toggle checked={overlays.buses} onChange={() => handleToggle('buses')} />
            </div>

            <div className="bus-tab-summary">
              <span className={`bus-tab-status-dot ${connectionStatus === 'Live' ? 'bus-tab-status-dot--live' : ''}`} />
              <span>{connectionStatus}</span>
              <strong>{sortedBuses.length}/{buses.length}</strong>
            </div>

            <div className="route-suboptions bus-status-options">
              {BUS_STATUS_KEYS.map((statusKey) => (
                <label key={statusKey} className="route-suboption" onClick={(event) => event.stopPropagation()}>
                  <span className="route-dot" style={{ background: BUS_STATUS_COLORS[statusKey] }} />
                  <span className="route-suboption-label">{BUS_STATUS_LABELS[statusKey]}</span>
                  <input
                    type="checkbox"
                    checked={busStatusOptions[statusKey]}
                    onChange={() => handleBusStatusOptionToggle(statusKey)}
                  />
                </label>
              ))}
            </div>

            <div className="bus-list-panel">
              <div className="bus-list-panel__header">
                <span>Live Bus List</span>
                <span>{sortedBuses.length}</span>
              </div>
              {sortedBuses.length === 0 ? (
                <div className="bus-list-empty">No live buses</div>
              ) : (
                sortedBuses.map(({ bus, index, statusCategory, label }) => {
                  const isShown = overlays.buses && busStatusOptions[statusCategory];

                  return (
                    <div
                      key={bus.id || index}
                      className={`bus-list-row ${isShown ? '' : 'bus-list-row--muted'}`}
                    >
                      <span className="bus-list-row__main">
                        <span className="bus-list-row__name">{label}</span>
                        <span className="bus-list-row__meta">{getBusMeta(bus)}</span>
                      </span>
                      <span className={`bus-list-row__status bus-list-row__status--${statusCategory}`}>
                        {statusCategory === 'active' ? 'Active' : statusCategory === 'idle' ? 'Idle' : 'Stopped'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="tracking-mode-group">
              <span className="tracking-mode-label">Tracking Mode</span>
              <div className="tracking-mode-buttons">
                <button
                  type="button"
                  className={`tracking-mode-btn ${trackingMode === 'fluid' ? 'active' : ''}`}
                  aria-pressed={trackingMode === 'fluid'}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTrackingModeChange('fluid');
                  }}
                >
                  Fluid
                </button>
                <button
                  type="button"
                  className={`tracking-mode-btn ${trackingMode === 'ping' ? 'active' : ''}`}
                  aria-pressed={trackingMode === 'ping'}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTrackingModeChange('ping');
                  }}
                >
                  Ping
                </button>
              </div>
              <div className="tracking-mode-current" role="status" aria-live="polite">
                Current: <strong>{trackingMode === 'fluid' ? 'Fluid' : 'Ping'}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layers' && layers.map(({ key, icon, img, label }) => {
          if (key === 'user') {
            return (
              <button
                key={key}
                type="button"
                className={`location-toggle-card ${overlays.user ? 'location-toggle-card--active' : ''}`}
                aria-pressed={overlays.user}
                aria-label={`${overlays.user ? 'Disable' : 'Enable'} my location`}
                onClick={() => handleToggle('user')}
              >
                <span className="location-toggle-card__content">
                  <span className="location-toggle-card__icon-shell">
                    <LocationButtonIcon />
                  </span>
                  <span className="location-toggle-card__copy">
                    <span className="location-toggle-card__title">{label}</span>
                    <span className="location-toggle-card__subtitle">
                      {overlays.user ? 'Showing your live position' : 'Hidden from the map'}
                    </span>
                  </span>
                </span>
                <span className="location-toggle-card__badge">
                  {overlays.user ? 'On' : 'Off'}
                </span>
              </button>
            );
          }

          return (
            <Fragment key={key}>
              <div className="layer-item" onClick={() => handleToggle(key)}>
                <div className="layer-item-left">
                  {img
                    ? <img src={img} alt={label} className="layer-item-icon-img" />
                    : <span className="layer-item-icon">{icon}</span>
                  }
                  <span className="layer-item-label">{label}</span>
                </div>
                <div className="layer-item-actions">
                  <Toggle checked={overlays[key]} onChange={() => handleToggle(key)} />
                </div>
              </div>

              {key === 'routes' && (
                <div className="route-suboptions">
                  {ROUTE_KEYS.map((routeKey) => (
                    <label key={routeKey} className="route-suboption" onClick={(event) => event.stopPropagation()}>
                      <span className="route-dot" style={{ background: ROUTE_COLORS[routeKey] }} />
                      <span className="route-suboption-label">{ROUTE_LABELS[routeKey]}</span>
                      <input
                        type="checkbox"
                        checked={routeOptions[routeKey]}
                        onChange={() => handleRouteOptionToggle(routeKey)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}

        {activeTab === 'layers' && (
          <>
            <div className="panel-divider" />
            <button
              type="button"
              className="panel-secondary-btn"
              onClick={onCenterMap}
            >
              <span className="panel-secondary-btn-icon">
                <CenterMapIcon />
              </span>
              <span>Center Map</span>
            </button>
            <button type="button" className="panel-reset-btn" onClick={handleReset}>
              Reset Layers
            </button>
          </>
        )}
      </div>
    </div>
  );
}
