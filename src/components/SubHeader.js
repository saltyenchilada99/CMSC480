import React, { useState } from 'react';
import '../styles/SubHeader.css';

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

export function SubHeader({ onBusesToggle, onStopsToggle, onRoutesToggle, onRouteOptionsToggle, onUserToggle, onAcademicsToggle, onDormsToggle}) {
  const [overlaysVisible, setOverlaysVisible] = useState(DEFAULT_OVERLAYS);
  const [routeOptions, setRouteOptions] = useState(DEFAULT_ROUTE_OPTIONS);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);

  const syncMainRouteToggle = (nextRouteOptions) => {
    const anyEnabled = Object.values(nextRouteOptions).some(Boolean);

    setOverlaysVisible((prev) => {
      if (prev.routes === anyEnabled) {
        return prev;
      }

      if (onRoutesToggle) {
        onRoutesToggle(anyEnabled);
      }

      return {
        ...prev,
        routes: anyEnabled,
      };
    });
  };

  const handleToggle = (overlay) => {
    const newSettings = {
      ...overlaysVisible,
      [overlay]: !overlaysVisible[overlay],
    };
    setOverlaysVisible(newSettings);

    // Notify parent component when a toggle changes
    if (overlay === 'buses' && onBusesToggle) {
      onBusesToggle(newSettings.buses);
    }
    if (overlay === 'stops' && onStopsToggle) {
      onStopsToggle(newSettings.stops);
    }
    if (overlay === 'routes' && onRoutesToggle) {
      onRoutesToggle(newSettings.routes);

      const nextRouteOptions = {
        campus: newSettings.routes,
        downtown: newSettings.routes,
        walmart: newSettings.routes,
      };
      setRouteOptions(nextRouteOptions);

      if (onRouteOptionsToggle) {
        onRouteOptionsToggle(nextRouteOptions);
      }

      if (!newSettings.routes) {
        setShowRouteDropdown(false);
      }
    }
    if (overlay === 'user' && onUserToggle) {
      onUserToggle(newSettings.user);
    }
    if (overlay === 'academics' && onAcademicsToggle) {
      onAcademicsToggle(newSettings.academics);
    }
    if (overlay === 'dorms' && onDormsToggle) {
      onDormsToggle(newSettings.dorms);
    }
  };

  const handleRouteOptionToggle = (routeKey) => {
    const nextRouteOptions = {
      ...routeOptions,
      [routeKey]: !routeOptions[routeKey],
    };

    setRouteOptions(nextRouteOptions);

    if (onRouteOptionsToggle) {
      onRouteOptionsToggle(nextRouteOptions);
    }

    syncMainRouteToggle(nextRouteOptions);
  };

  const handleResetDefaults = () => {
    setOverlaysVisible(DEFAULT_OVERLAYS);
    setRouteOptions(DEFAULT_ROUTE_OPTIONS);
    setShowRouteDropdown(false);

    if (onBusesToggle) onBusesToggle(DEFAULT_OVERLAYS.buses);
    if (onStopsToggle) onStopsToggle(DEFAULT_OVERLAYS.stops);
    if (onRoutesToggle) onRoutesToggle(DEFAULT_OVERLAYS.routes);
    if (onRouteOptionsToggle) onRouteOptionsToggle(DEFAULT_ROUTE_OPTIONS);
    if (onUserToggle) onUserToggle(DEFAULT_OVERLAYS.user);
    if (onAcademicsToggle) onAcademicsToggle(DEFAULT_OVERLAYS.academics);
    if (onDormsToggle) onDormsToggle(DEFAULT_OVERLAYS.dorms);
  };

  return (
    <div className="sub-header">
      <div className="sub-header-content">
        <h3>Map Display Options</h3>
        
        <div className="overlay-controls">
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.buses}
              onChange={() => handleToggle('buses')}
            />
            <span>Buses</span>
          </label>
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.stops}
              onChange={() => handleToggle('stops')}
            />
            <span>Bus Stops</span>
          </label>
          <div className="route-control-wrapper">
            <label className="control-item">
              <input
                type="checkbox"
                checked={overlaysVisible.routes}
                onChange={() => handleToggle('routes')}
              />
              <span>Routes</span>
            </label>
            <button
              type="button"
              className="route-dropdown-toggle"
              aria-label="Toggle route options"
              onClick={() => setShowRouteDropdown((prev) => !prev)}
            >
              {showRouteDropdown ? '▾' : '▸'}
            </button>
          </div>
          {showRouteDropdown && (
            <div className="route-dropdown-menu">
              <label className="control-item route-option-item">
                <input
                  type="checkbox"
                  checked={routeOptions.campus}
                  onChange={() => handleRouteOptionToggle('campus')}
                />
                <span>Campus Loop</span>
              </label>
              <label className="control-item route-option-item">
                <input
                  type="checkbox"
                  checked={routeOptions.downtown}
                  onChange={() => handleRouteOptionToggle('downtown')}
                />
                <span>Downtown Loop</span>
              </label>
              <label className="control-item route-option-item">
                <input
                  type="checkbox"
                  checked={routeOptions.walmart}
                  onChange={() => handleRouteOptionToggle('walmart')}
                />
                <span>Walmart Trip</span>
              </label>
            </div>
          )}
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.user}
              onChange={() => handleToggle('user')}
            />
            <span>My Location</span>
          </label>
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.academics}
              onChange={() => handleToggle('academics')}
            />
            <span>Academics</span>
          </label>
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.dorms}
              onChange={() => handleToggle('dorms')}
            />
            <span>Dorms</span>
          </label>
          <button type="button" className="reset-settings-button" onClick={handleResetDefaults}>
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
