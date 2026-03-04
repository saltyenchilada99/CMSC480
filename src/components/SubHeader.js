import React, { useState } from 'react';
import '../styles/SubHeader.css';

export function SubHeader({ onUserToggle }) {
  const [overlaysVisible, setOverlaysVisible] = useState({
    buses: true,
    stops: true,
    routes: true,
    user: true,
  });

  const handleToggle = (overlay) => {
    const newSettings = {
      ...overlaysVisible,
      [overlay]: !overlaysVisible[overlay],
    };
    setOverlaysVisible(newSettings);
    
    // Notify parent component if user toggle changed
    if (overlay === 'user' && onUserToggle) {
      onUserToggle(newSettings.user);
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
        </div>
      </div>
    </div>
  );
}
