import { render, screen } from '@testing-library/react';

jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

jest.mock('react-leaflet', () => {
  const React = require('react');

  return {
    MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => null,
    useMapEvents: jest.fn(),
  };
});

jest.mock('./components/bus.tsx', () => {
  const React = require('react');

  return {
    Bus: () => null,
    BusContext: React.createContext({
      buses: [],
      connectionStatus: 'connected',
    }),
  };
});

jest.mock('./components/busStop.tsx', () => ({
  BusStop: () => null,
  busStopLibrary: [],
}));

jest.mock('./components/routes/campusLoopRoute.tsx', () => ({
  CampusLoopRoute: () => null,
}));

jest.mock('./components/routes/downtownLoopRoute.tsx', () => ({
  DowntownLoopRoute: () => null,
}));

jest.mock('./components/routes/walmartTripRoute.tsx', () => ({
  WalmartTripRoute: () => null,
}));

jest.mock('./components/Academic.tsx', () => ({
  Academic: () => null,
  academicBuildings: [],
}));

jest.mock('./components/Recreation.tsx', () => ({
  Recreation: () => null,
  recreationLocations: [],
}));

jest.mock('./components/dorm.tsx', () => ({
  Dorm: () => null,
  dormLocations: [],
}));

jest.mock('./components/food.tsx', () => ({
  Food: () => null,
  foodLocations: [],
}));

jest.mock('./UserTracker', () => ({
  UserLocationMap: () => null,
}));

jest.mock('./components/MapViewportController.tsx', () => ({
  MapViewportController: () => null,
}));

import App from './App';

test('renders the map layer controls', () => {
  render(<App />);
  expect(screen.getByText(/map layers/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /center map/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /disable my location/i })).toBeInTheDocument();
});
