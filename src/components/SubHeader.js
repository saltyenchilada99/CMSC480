import React, { useState } from 'react';
import '../styles/SubHeader.css';
import busIcon from './bus_icon.png';
import busStopIcon from './bus_stop_icon.png';
import academicIcon from './academic_icon.png';
import dormIcon from './dorm_icon.png';

const DEFAULT_OVERLAYS = {
  buses: true,
  stops: true,
  routes: true,
  user: true,
  academics: false,
  dorms: false,
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

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track" />
    </label>
  );
}

export function SubHeader({ onBusesToggle, onStopsToggle, onRoutesToggle, onRouteOptionsToggle, onUserToggle, onAcademicsToggle, onDormsToggle }) {
  const [overlays, setOverlays] = useState(DEFAULT_OVERLAYS);
  const [routeOptions, setRouteOptions] = useState(DEFAULT_ROUTE_OPTIONS);
  const [routesExpanded, setRoutesExpanded] = useState(false);

  const syncMainRouteToggle = (nextRouteOptions) => {
    const anyEnabled = Object.values(nextRouteOptions).some(Boolean);
    setOverlays((prev) => {
      if (prev.routes === anyEnabled) return prev;
      if (onRoutesToggle) onRoutesToggle(anyEnabled);
      return { ...prev, routes: anyEnabled };
    });
  };

  const handleToggle = (key) => {
    const next = { ...overlays, [key]: !overlays[key] };
    setOverlays(next);

    if (key === 'buses' && onBusesToggle) onBusesToggle(next.buses);
    if (key === 'stops' && onStopsToggle) onStopsToggle(next.stops);
    if (key === 'user' && onUserToggle) onUserToggle(next.user);
    if (key === 'academics' && onAcademicsToggle) onAcademicsToggle(next.academics);
    if (key === 'dorms' && onDormsToggle) onDormsToggle(next.dorms);
    if (key === 'routes') {
      if (onRoutesToggle) onRoutesToggle(next.routes);
      const nextRouteOptions = { campus: next.routes, downtown: next.routes, walmart: next.routes };
      setRouteOptions(nextRouteOptions);
      if (onRouteOptionsToggle) onRouteOptionsToggle(nextRouteOptions);
      if (!next.routes) setRoutesExpanded(false);
    }
  };

  const handleRouteOptionToggle = (routeKey) => {
    const next = { ...routeOptions, [routeKey]: !routeOptions[routeKey] };
    setRouteOptions(next);
    if (onRouteOptionsToggle) onRouteOptionsToggle(next);
    syncMainRouteToggle(next);
  };

  const handleReset = () => {
    setOverlays(DEFAULT_OVERLAYS);
    setRouteOptions(DEFAULT_ROUTE_OPTIONS);
    setRoutesExpanded(false);
    if (onBusesToggle) onBusesToggle(DEFAULT_OVERLAYS.buses);
    if (onStopsToggle) onStopsToggle(DEFAULT_OVERLAYS.stops);
    if (onRoutesToggle) onRoutesToggle(DEFAULT_OVERLAYS.routes);
    if (onRouteOptionsToggle) onRouteOptionsToggle(DEFAULT_ROUTE_OPTIONS);
    if (onUserToggle) onUserToggle(DEFAULT_OVERLAYS.user);
    if (onAcademicsToggle) onAcademicsToggle(DEFAULT_OVERLAYS.academics);
    if (onDormsToggle) onDormsToggle(DEFAULT_OVERLAYS.dorms);
  };

  const layers = [
    { key: 'buses',     img: busIcon,      label: 'Buses' },
    { key: 'stops',     img: busStopIcon,  label: 'Bus Stops' },
    { key: 'routes',    icon: '🛣️',        label: 'Routes', expandable: true },
    { key: 'academics', img: academicIcon, label: 'Academic Buildings' },
    { key: 'dorms',     img: dormIcon,     label: 'Dorms' },
    { key: 'user',      icon: '📍',        label: 'My Location' },
  ];

  return (
    <div className="map-layer-panel">
      <div className="map-layer-panel-header">
        <span>Map Layers</span>
        <span style={{ fontSize: '1rem', opacity: 0.5 }}>⊞</span>
      </div>
      <div className="map-layer-panel-body">
        {layers.map(({ key, icon, img, label, expandable }) => (
          <React.Fragment key={key}>
            <div
              className="layer-item"
              onClick={() => {
                handleToggle(key);
                if (expandable && !overlays[key]) setRoutesExpanded(false);
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
                    onClick={(e) => { e.stopPropagation(); setRoutesExpanded(p => !p); }}
                  >
                    {routesExpanded ? '▾' : '▸'}
                  </span>
                )}
                <Toggle checked={overlays[key]} onChange={() => handleToggle(key)} />
              </div>
            </div>

            {expandable && routesExpanded && overlays[key] && (
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
          </React.Fragment>
        ))}

        <div className="panel-divider" />
        <button className="panel-reset-btn" onClick={handleReset}>
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
