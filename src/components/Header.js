import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Header.css';
import { busStopLibrary } from './busStop.tsx';
import { dormLocations } from './dorm.tsx';
import { academicBuildings } from './Academic.tsx';
import { recreationLocations } from './Recreation.tsx';
import { foodLocations } from './food.tsx';

export function Header({ onMarkerFocus }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const normalizedQuery = query.toLowerCase().trim();
  const allFilteredItems = [
    ...busStopLibrary,
    ...dormLocations,
    ...academicBuildings,
    ...recreationLocations,
    ...foodLocations,
  ].filter((loc) => loc.name.toLowerCase().includes(normalizedQuery));

  React.useEffect(() => {
    if (showScheduleModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => document.body.classList.remove('modal-open');
  }, [showScheduleModal]);

  function handleSelectLocation(loc) {
    const position = [loc.lat, -loc.long];

    setQuery(loc.name);
    setShowDropdown(false);
    onMarkerFocus?.(position, 'marker', 18);
  }

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-title">
            <h1>Bloomsburg Campus Bus Tracker</h1>
          </div>

          <div
            className="search-container"
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setShowDropdown(false)}
          >
            <input
              type="search"
              className="search-input"
              placeholder="Search bus stops..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {showDropdown && (
              <ul className="search-dropdown">
                {allFilteredItems.length > 0 ? (
                  allFilteredItems.map((loc) => (
                    <li
                      key={loc.key}
                      className="dropdown-item"
                      onMouseDown={() => handleSelectLocation(loc)}
                    >
                      {loc.name}
                    </li>
                  ))
                ) : (
                  <li className="dropdown-item">No results found</li>
                )}
              </ul>
            )}
          </div>

          <nav className="header-nav">
            <button
              className="nav-button"
              onClick={() => setShowScheduleModal(true)}
            >
              Bus Schedule
            </button>
          </nav>
        </div>
      </header>

      {showScheduleModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bus Schedule</h2>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="schedule-section">
                <h3>Campus Loop</h3>
                <p><strong>Monday - Friday:</strong> 7:30 a.m. - midnight. Buses arrive approximately every 15 minutes</p>
                <p><strong>Saturday (New Hours):</strong> 11:30 a.m. - 6:30 p.m. Buses arrive approximately every 20 minutes. Last bus departs at 6:30 p.m. (NO SERVICE FROM 2:00 - 2:45 p.m. and 4:45 - 5:30 p.m.)</p>
                <p><strong>Sunday (New Hours):</strong> 11:30 a.m. - midnight. Buses arrive approximately every 20 minutes. Last bus departs at midnight (NO SERVICE FROM 2:00 - 2:45 p.m., 6:45 - 7:30 p.m., and 9:00 - 9:45 p.m.)</p>
              </div>

              <div className="schedule-section">
                <h3>Downtown Loop</h3>
                <p><strong>Route:</strong> McCormick / Fountain / Old School House Apartments / Glenn Avenue Apartments</p>
                <p><strong>Monday - Thursday:</strong> 7:30 a.m. - midnight. Departs McCormick at 7:30 a.m. and on the half hour and hour. Last bus departs at midnight (NO SERVICE AT 10:00 a.m.)</p>
                <p><strong>Friday - Scheduled Service:</strong> 7:30 a.m. - 4:30 p.m. Departs McCormick at 7:30 a.m. and on the half hour and hour. Last bus departs at 4:30 p.m. (NO SERVICE AT 10:00 a.m.)</p>
                <p><strong>Saturday &amp; Sunday:</strong> NO SERVICE</p>
              </div>

              <div className="schedule-section">
                <h3>Walmart Trip</h3>
                <p><strong>Days:</strong> Tuesday, Thursday, and Friday nights</p>
                <p><strong>Pickup at Arts and Administration Building:</strong> 5 p.m., 6 p.m., and 7 p.m.</p>
                <p><strong>Depart from Walmart:</strong> 6:15 p.m., 7:15 p.m., 8:15 p.m.</p>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href="https://www.commonwealthu.edu/campus-life/bloomsburg/parking-and-transportation"
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                View Full Transportation Info
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
