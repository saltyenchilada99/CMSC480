import React, { useState } from 'react';
import '../styles/SubHeader.css';

export function SubHeader({ onBusesToggle, onStopsToggle, onRoutesToggle, onUserToggle, onAcademicsToggle, onDormsToggle}) {
  const [overlaysVisible, setOverlaysVisible] = useState({
    buses: true,
    stops: true,
    routes: true,
    user: false,
    academics: false,
    dorms: false
  });

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
          <label className="control-item">
            <input
              type="checkbox"
              checked={overlaysVisible.routes}
              onChange={() => handleToggle('routes')}
            />
            <span>Routes</span>
          </label>
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
        </div>
      </div>
    </div>
  );
}
