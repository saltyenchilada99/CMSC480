import React, { useState } from 'react';
import '../styles/SubHeader.css';
import busIcon from './bus_icon.png';
import busStopIcon from './bus_stop_icon.png';
import academicIcon from './academic_icon.png';
import dormIcon from './dorm_icon.png';
import foodIcon from './food_icon.svg';
import recreationIcon from './recreation_icon.svg';

const DEFAULT_OVERLAYS = {
  buses: true,
  stops: true,
  routes: true,
  user: true,
  academics: false,
  recreation: false,
  dorms: false,
  food: false,
};

export const DEFAULT_BUS_STATUS_OPTIONS = {
  active: true,
  idle: true,
  stopped: true,
};

const BUS_STATUS_LABELS = {
  active: 'Active (Moving)',
  idle: 'Idle',
  stopped: 'Stopped',
};

const BUS_STATUS_COLORS = {
  active: '#2e7d32',
  idle: '#f9a825',
  stopped: '#c62828',
};

const DEFAULT_ROUTE_OPTIONS = {
  campus: true,
  downtown: true,
  walmart: true,
};

const ROUTE_COLORS = {
  campus: '#B8860B',
  downtown: '#6D0026',
  walmart: '#0057B8',
};

const ROUTE_LABELS = {
  campus: 'Campus Loop',
  downtown: 'Downtown Loop',
  walmart: 'Walmart Trip',
};

export const DEFAULT_FOOD_OPTIONS = {
  'F-1': true, // Scranton Commons
  'F-2': true, // Kehr Union
  'F-3': true, // Soltz Hall
  'F-4': true, // Andruss Library
  'F-5': true, // Monty's
  'F-6': true, // Warren SSC
};

const FOOD_LABELS = {
  'F-1': 'Scranton Commons',
  'F-2': 'Kehr Union Building',
  'F-3': 'Soltz Hall Dining',
  'F-4': 'Andruss Library',
  'F-5': "Monty's",
  'F-6': 'Warren SSC',
};

const FOOD_DOT_COLOR = '#c0392b';

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

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track" />
    </label>
  );
}

export function SubHeader({ buses = [], connectionStatus = 'Offline', onBusesToggle, onStopsToggle, onRoutesToggle, onRouteOptionsToggle, onCenterMap, onUserToggle, onAcademicsToggle, onRecreationToggle, onDormsToggle, onFoodToggle, onFoodOptionsToggle, onBusStatusOptionsToggle, onTrackingModeChange }) {
  const [overlays, setOverlays] = useState(DEFAULT_OVERLAYS);
  const [routeOptions, setRouteOptions] = useState(DEFAULT_ROUTE_OPTIONS);
  const [foodOptions, setFoodOptions] = useState(DEFAULT_FOOD_OPTIONS);
  const [busStatusOptions, setBusStatusOptions] = useState(DEFAULT_BUS_STATUS_OPTIONS);
  const [trackingMode, setTrackingMode] = useState('fluid');
  const [activeTab, setActiveTab] = useState('layers');
  const [busesExpanded, setBusesExpanded] = useState(false);
  const [routesExpanded, setRoutesExpanded] = useState(false);
  const [foodExpanded, setFoodExpanded] = useState(false);

  const syncMainRouteToggle = (nextOptions) => {
    const anyEnabled = Object.values(nextOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.routes === anyEnabled) return prev;
      if (onRoutesToggle) onRoutesToggle(anyEnabled);
      return { ...prev, routes: anyEnabled };
    });
  };

  const syncMainFoodToggle = (nextOptions) => {
    const anyEnabled = Object.values(nextOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.food === anyEnabled) return prev;
      if (onFoodToggle) onFoodToggle(anyEnabled);
      return { ...prev, food: anyEnabled };
    });
  };

  const syncMainBusesToggle = (nextOptions) => {
    const anyEnabled = Object.values(nextOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.buses === anyEnabled) return prev;
      if (onBusesToggle) onBusesToggle(anyEnabled);
      return { ...prev, buses: anyEnabled };
    });
  };

  const handleToggle = (key) => {
    const next = { ...overlays, [key]: !overlays[key] };
    setOverlays(next);

    if (key === 'buses' && onBusesToggle) onBusesToggle(next.buses);
    if (key === 'buses') {
      const nextBusStatusOptions = Object.fromEntries(
        Object.keys(DEFAULT_BUS_STATUS_OPTIONS).map(k => [k, next.buses])
      );
      setBusStatusOptions(nextBusStatusOptions);
      if (onBusStatusOptionsToggle) onBusStatusOptionsToggle(nextBusStatusOptions);
      if (!next.buses) setBusesExpanded(false);
    }
    if (key === 'stops' && onStopsToggle) onStopsToggle(next.stops);
    if (key === 'user' && onUserToggle) onUserToggle(next.user);
    if (key === 'academics' && onAcademicsToggle) onAcademicsToggle(next.academics);
    if (key === 'recreation' && onRecreationToggle) onRecreationToggle(next.recreation);
    if (key === 'dorms' && onDormsToggle) onDormsToggle(next.dorms);
    if (key === 'routes') {
      if (onRoutesToggle) onRoutesToggle(next.routes);
      const nextRouteOptions = { campus: next.routes, downtown: next.routes, walmart: next.routes };
      setRouteOptions(nextRouteOptions);
      if (onRouteOptionsToggle) onRouteOptionsToggle(nextRouteOptions);
      if (!next.routes) setRoutesExpanded(false);
    }
    if (key === 'food') {
      if (onFoodToggle) onFoodToggle(next.food);
      const nextFoodOptions = Object.fromEntries(Object.keys(DEFAULT_FOOD_OPTIONS).map(k => [k, next.food]));
      setFoodOptions(nextFoodOptions);
      if (onFoodOptionsToggle) onFoodOptionsToggle(nextFoodOptions);
      if (!next.food) setFoodExpanded(false);
    }
  };

  const handleRouteOptionToggle = (routeKey) => {
    const next = { ...routeOptions, [routeKey]: !routeOptions[routeKey] };
    setRouteOptions(next);
    if (onRouteOptionsToggle) onRouteOptionsToggle(next);
    syncMainRouteToggle(next);
  };

  const handleFoodOptionToggle = (foodKey) => {
    const next = { ...foodOptions, [foodKey]: !foodOptions[foodKey] };
    setFoodOptions(next);
    if (onFoodOptionsToggle) onFoodOptionsToggle(next);
    syncMainFoodToggle(next);
  };

  const handleBusStatusOptionToggle = (statusKey) => {
    const next = { ...busStatusOptions, [statusKey]: !busStatusOptions[statusKey] };
    setBusStatusOptions(next);
    if (onBusStatusOptionsToggle) onBusStatusOptionsToggle(next);
    syncMainBusesToggle(next);
  };

  const handleReset = () => {
    setOverlays(DEFAULT_OVERLAYS);
    setRouteOptions(DEFAULT_ROUTE_OPTIONS);
    setFoodOptions(DEFAULT_FOOD_OPTIONS);
    setBusStatusOptions(DEFAULT_BUS_STATUS_OPTIONS);
    setTrackingMode('fluid');
    setBusesExpanded(false);
    setRoutesExpanded(false);
    setFoodExpanded(false);
    if (onBusesToggle) onBusesToggle(DEFAULT_OVERLAYS.buses);
    if (onStopsToggle) onStopsToggle(DEFAULT_OVERLAYS.stops);
    if (onRoutesToggle) onRoutesToggle(DEFAULT_OVERLAYS.routes);
    if (onRouteOptionsToggle) onRouteOptionsToggle(DEFAULT_ROUTE_OPTIONS);
    if (onUserToggle) onUserToggle(DEFAULT_OVERLAYS.user);
    if (onAcademicsToggle) onAcademicsToggle(DEFAULT_OVERLAYS.academics);
    if (onRecreationToggle) onRecreationToggle(DEFAULT_OVERLAYS.recreation);
    if (onDormsToggle) onDormsToggle(DEFAULT_OVERLAYS.dorms);
    if (onFoodToggle) onFoodToggle(DEFAULT_OVERLAYS.food);
    if (onFoodOptionsToggle) onFoodOptionsToggle(DEFAULT_FOOD_OPTIONS);
    if (onBusStatusOptionsToggle) onBusStatusOptionsToggle(DEFAULT_BUS_STATUS_OPTIONS);
    if (onTrackingModeChange) onTrackingModeChange('fluid');
  };

  const handleTrackingModeChange = (mode) => {
    setTrackingMode(mode);
    if (onTrackingModeChange) onTrackingModeChange(mode);
  };

  const getStatusCategory = (status) => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (normalized === 'moving' || normalized === 'move' || normalized === 'active') return 'active';
    if (normalized === 'idle' || normalized === 'idling') return 'idle';
    return 'stopped';
  };

  const visibleBusCount = buses.filter((bus) => busStatusOptions[getStatusCategory(bus.status)]).length;

  const layers = [
    { key: 'stops',     img: busStopIcon,  label: 'Bus Stops' },
    { key: 'routes',    icon: '🛣️',        label: 'Routes',  expandable: 'routes' },
    { key: 'academics', img: academicIcon, label: 'Academic Buildings' },
    { key: 'recreation', img: recreationIcon, label: 'Recreation + Athletics' },
    { key: 'dorms',     img: dormIcon,     label: 'Dorms' },
    { key: 'food',      img: foodIcon,     label: 'Dining' },
    { key: 'user',      label: 'My Location' },
  ];

  return (
    <div className="map-layer-panel">
      <div className="map-layer-panel-header">
        <span>Map Layers</span>
        <span style={{ fontSize: '1rem', opacity: 0.5 }}>⊞</span>
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
              <strong>{visibleBusCount}/{buses.length} shown</strong>
            </div>

            <div className="route-suboptions bus-status-options">
              {Object.keys(DEFAULT_BUS_STATUS_OPTIONS).map((statusKey) => (
                <label key={statusKey} className="route-suboption" onClick={(e) => e.stopPropagation()}>
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

            <div className="tracking-mode-group">
              <span className="tracking-mode-label">Tracking Mode</span>
              <div className="tracking-mode-buttons">
                <button
                  type="button"
                  className={`tracking-mode-btn ${trackingMode === 'fluid' ? 'active' : ''}`}
                  aria-pressed={trackingMode === 'fluid'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackingModeChange('fluid');
                  }}
                >
                  Fluid
                </button>
                <button
                  type="button"
                  className={`tracking-mode-btn ${trackingMode === 'ping' ? 'active' : ''}`}
                  aria-pressed={trackingMode === 'ping'}
                  onClick={(e) => {
                    e.stopPropagation();
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

            <div className="bus-list-panel">
              <div className="bus-list-panel__header">
                <span>Live Bus List</span>
                <span>{buses.length}</span>
              </div>
              {buses.length === 0 ? (
                <div className="bus-list-empty">No bus data available</div>
              ) : (
                buses.map((bus, index) => {
                  const statusCategory = getStatusCategory(bus.status);
                  const isShown = overlays.buses && busStatusOptions[statusCategory];
                  const label = bus.name || bus.id || `Bus ${index + 1}`;

                  return (
                    <div
                      key={bus.id || index}
                      className={`bus-list-row ${isShown ? '' : 'bus-list-row--muted'}`}
                    >
                      <span className="bus-list-row__main">
                        <span className="bus-list-row__name">{label}</span>
                        <span className="bus-list-row__meta">
                          {bus.speed ?? 'N/A'} mph · {bus.heading ?? 'N/A'}°
                        </span>
                      </span>
                      <span className={`bus-list-row__status bus-list-row__status--${statusCategory}`}>
                        {statusCategory === 'active' ? 'Active' : statusCategory === 'idle' ? 'Idle' : 'Stopped'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'layers' && layers.map(({ key, icon, img, label, expandable }) => {
          const isExpanded = expandable === 'buses'
            ? busesExpanded
            : expandable === 'routes'
              ? routesExpanded
              : expandable === 'food'
                ? foodExpanded
                : false;
          const setExpanded = expandable === 'buses'
            ? setBusesExpanded
            : expandable === 'routes'
              ? setRoutesExpanded
              : setFoodExpanded;
          const isUserLayer = key === 'user';

          if (isUserLayer) {
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
            <React.Fragment key={key}>
              <div
                className="layer-item"
                onClick={() => {
                  handleToggle(key);
                  if (expandable && !overlays[key]) setExpanded(false);
                }}
              >
                <div className="layer-item-left">
                  {img
                    ? <img src={img} alt={label} className="layer-item-icon-img" />
                    : <span className="layer-item-icon">{icon}</span>
                  }
                  <span className="layer-item-label">{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {expandable && overlays[key] && (
                    <span
                      style={{ fontSize: '0.7rem', color: '#6e1020', cursor: 'pointer', padding: '2px 4px', userSelect: 'none' }}
                      onClick={(e) => { e.stopPropagation(); setExpanded(p => !p); }}
                    >
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  )}
                  <Toggle checked={overlays[key]} onChange={() => handleToggle(key)} />
                </div>
              </div>

              {expandable === 'routes' && isExpanded && overlays[key] && (
                <div className="route-suboptions">
                  {Object.keys(DEFAULT_ROUTE_OPTIONS).map((routeKey) => (
                    <label key={routeKey} className="route-suboption" onClick={(e) => e.stopPropagation()}>
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

              {expandable === 'buses' && isExpanded && overlays[key] && (
                <div className="route-suboptions">
                  {Object.keys(DEFAULT_BUS_STATUS_OPTIONS).map((statusKey) => (
                    <label key={statusKey} className="route-suboption" onClick={(e) => e.stopPropagation()}>
                      <span className="route-dot" style={{ background: BUS_STATUS_COLORS[statusKey] }} />
                      <span className="route-suboption-label">{BUS_STATUS_LABELS[statusKey]}</span>
                      <input
                        type="checkbox"
                        checked={busStatusOptions[statusKey]}
                        onChange={() => handleBusStatusOptionToggle(statusKey)}
                      />
                    </label>
                  ))}

                  <div className="tracking-mode-group">
                    <span className="tracking-mode-label">Tracking Mode</span>
                    <div className="tracking-mode-buttons">
                      <button
                        type="button"
                        className={`tracking-mode-btn ${trackingMode === 'fluid' ? 'active' : ''}`}
                        aria-pressed={trackingMode === 'fluid'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackingModeChange('fluid');
                        }}
                      >
                        Fluid
                      </button>
                      <button
                        type="button"
                        className={`tracking-mode-btn ${trackingMode === 'ping' ? 'active' : ''}`}
                        aria-pressed={trackingMode === 'ping'}
                        onClick={(e) => {
                          e.stopPropagation();
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

              {expandable === 'food' && isExpanded && overlays[key] && (
                <div className="route-suboptions">
                  {Object.keys(DEFAULT_FOOD_OPTIONS).map((foodKey) => (
                    <label key={foodKey} className="route-suboption" onClick={(e) => e.stopPropagation()}>
                      <span className="route-dot" style={{ background: FOOD_DOT_COLOR }} />
                      <span className="route-suboption-label">{FOOD_LABELS[foodKey]}</span>
                      <input
                        type="checkbox"
                        checked={foodOptions[foodKey]}
                        onChange={() => handleFoodOptionToggle(foodKey)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

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
        <button className="panel-reset-btn" onClick={handleReset}>
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
