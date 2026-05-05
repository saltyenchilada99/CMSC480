import { render, screen } from '@testing-library/react';

type ChildrenProps = {
  children?: import('react').ReactNode;
};

jest.mock('leaflet', () => ({
  divIcon: jest.fn((options) => ({ options })),
  icon: jest.fn((options) => ({ options })),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

jest.mock('react-leaflet', () => {
  const React = require('react') as typeof import('react');
  const map = {
    getZoom: jest.fn(() => 15),
    hasLayer: jest.fn(() => false),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  };

  return {
    MapContainer: ({ children }: ChildrenProps) => React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => null,
    LayerGroup: ({ children }: ChildrenProps) => React.createElement('div', null, children),
    useMap: () => map,
    useMapEvents: () => map,
  };
});

jest.mock('./components/bus', () => {
  const React = require('react') as typeof import('react');

  return {
    Bus: () => null,
    BusContext: React.createContext({
      buses: [],
      connectionStatus: 'connected',
    }),
  };
});

jest.mock('./components/busStop', () => ({
  BusStop: () => null,
  busStopLibrary: [],
}));

jest.mock('./components/routes/campusLoopRoute', () => ({
  CampusLoopRoute: () => null,
}));

jest.mock('./components/routes/downtownLoopRoute', () => ({
  DowntownLoopRoute: () => null,
}));

jest.mock('./components/routes/walmartTripRoute', () => ({
  WalmartTripRoute: () => null,
}));

jest.mock('./components/Academic', () => ({
  Academic: () => null,
  academicBuildings: [],
}));

jest.mock('./components/Recreation', () => ({
  Recreation: () => null,
  recreationLocations: [],
}));

jest.mock('./components/dorm', () => ({
  Dorm: () => null,
  dormLocations: [],
}));

jest.mock('./components/food', () => ({
  Food: () => null,
  foodLocations: [],
}));

jest.mock('./UserTracker', () => ({
  UserLocationMap: () => null,
}));

jest.mock('./components/MapViewportController', () => ({
  MapViewportController: () => null,
}));

import App from './App';

test('renders the map layer controls', () => {
  render(<App />);
  expect(screen.getByText(/map layers/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /center map/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /disable my location/i })).toBeInTheDocument();
});
