import { memo } from 'react';
import { Marker } from 'react-leaflet';
import type { MapPoint, MarkerFocusHandler } from './types/frontend';

type UserLocationMapProps = {
  userPos: MapPoint | null;
  onMarkerFocus?: MarkerFocusHandler;
};

export const UserLocationMap = memo(function UserLocationMap({ userPos, onMarkerFocus }: UserLocationMapProps) {
  if (!userPos) return null;

  return (
    <Marker
      position={userPos}
      bubblingMouseEvents={false}
      eventHandlers={{
        click: () => onMarkerFocus?.(userPos, 'user'),
      }}
    />
  );
});
