import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from './Header';

jest.mock('./busStop', () => ({
  busStopLibrary: [{
    key: 'BS-3',
    name: 'Nelson Field House',
    lat: 41.01525,
    long: 76.44961,
  }],
}));

jest.mock('./Recreation', () => ({
  recreationLocations: [{
    key: 'R-2',
    name: 'Nelson Field House',
    lat: 41.015947864274736,
    long: 76.45051750435273,
  }],
}));

jest.mock('./Academic', () => ({
  academicBuildings: [],
}));

jest.mock('./dorm', () => ({
  dormLocations: [],
}));

jest.mock('./food', () => ({
  foodLocations: [],
}));

test('deduplicates duplicate campus search results and focuses the selected pin', () => {
  const onMarkerFocus = jest.fn();

  render(<Header onMarkerFocus={onMarkerFocus} />);

  const searchInput = screen.getByRole('searchbox');
  fireEvent.focus(searchInput);
  fireEvent.change(searchInput, { target: { value: 'Nelson Field House' } });

  expect(screen.getAllByText('Nelson Field House')).toHaveLength(1);
  expect(screen.getByText('Recreation + Transit stop')).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByText('Nelson Field House'));

  expect(onMarkerFocus).toHaveBeenCalledWith(
    [41.015947864274736, -76.45051750435273],
    'marker',
    18,
    'R-2'
  );
});
