import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Header.css';
import { busStopLibrary } from './busStop';
import { dormLocations } from './dorm';
import { academicBuildings } from './Academic';
import { recreationLocations } from './Recreation';
import { foodLocations } from './food';
import type { LiveBus, MapPoint, MarkerFocusHandler } from '../types/frontend';

type HeaderProps = {
  buses?: LiveBus[];
  connectionStatus?: string;
  onMarkerFocus?: MarkerFocusHandler;
};

type SearchableCampusLocation = {
  key: string;
  name: string;
  lat: number;
  long: number;
  category: SearchCategory;
  categoryLabel: string;
  categorySummary: string;
  priority: number;
};

type SearchCategory = 'academic' | 'recreation' | 'housing' | 'dining' | 'transit';

const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  academic: 'Academic',
  recreation: 'Recreation',
  housing: 'Housing',
  dining: 'Dining',
  transit: 'Transit stop',
};

const SEARCH_CATEGORY_PRIORITY: Record<SearchCategory, number> = {
  academic: 0,
  recreation: 1,
  housing: 2,
  dining: 3,
  transit: 4,
};

function normalizeSearchName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toSearchItem(
  loc: { key: string; name: string; lat: number; long: number },
  category: SearchCategory
): SearchableCampusLocation {
  return {
    ...loc,
    category,
    categoryLabel: SEARCH_CATEGORY_LABELS[category],
    categorySummary: SEARCH_CATEGORY_LABELS[category],
    priority: SEARCH_CATEGORY_PRIORITY[category],
  };
}

function dedupeSearchItems(items: SearchableCampusLocation[]): SearchableCampusLocation[] {
  const byName = new Map<string, SearchableCampusLocation & { categories: Set<string> }>();

  for (const item of items) {
    const normalizedName = normalizeSearchName(item.name);
    const existing = byName.get(normalizedName);

    if (!existing) {
      byName.set(normalizedName, {
        ...item,
        categories: new Set([item.categoryLabel]),
      });
      continue;
    }

    existing.categories.add(item.categoryLabel);

    if (item.priority < existing.priority) {
      byName.set(normalizedName, {
        ...item,
        categories: existing.categories,
      });
    }
  }

  return Array.from(byName.values())
    .map(({ categories, ...item }) => ({
      ...item,
      categorySummary: Array.from(categories).join(' + '),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function Header({ onMarkerFocus }: HeaderProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const normalizedQuery = normalizeSearchName(query);
  const searchItems = useMemo(() => dedupeSearchItems([
    ...academicBuildings.map((loc) => toSearchItem(loc, 'academic')),
    ...recreationLocations.map((loc) => toSearchItem(loc, 'recreation')),
    ...dormLocations.map((loc) => toSearchItem(loc, 'housing')),
    ...foodLocations.map((loc) => toSearchItem(loc, 'dining')),
    ...busStopLibrary.map((loc) => toSearchItem(loc, 'transit')),
  ]), []);
  const allFilteredItems = searchItems.filter((loc) => (
    normalizedQuery.length === 0 ||
    normalizeSearchName(loc.name).includes(normalizedQuery)
  ));

  useEffect(() => {
    if (showScheduleModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => document.body.classList.remove('modal-open');
  }, [showScheduleModal]);

  function handleSelectLocation(loc: SearchableCampusLocation) {
    const position: MapPoint = [loc.lat, -loc.long];

    setQuery(loc.name);
    setShowDropdown(false);
    onMarkerFocus?.(position, 'marker', 18, loc.key);
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
              placeholder="Search campus..."
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
                      <span className="dropdown-item__name">{loc.name}</span>
                      <span className="dropdown-item__meta">{loc.categorySummary}</span>
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
