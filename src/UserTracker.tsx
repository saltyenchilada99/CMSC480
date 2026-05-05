import { memo } from 'react';
import { Marker } from 'react-leaflet';
import type { MapPoint, MarkerFocusHandler } from './types/frontend';

/**
 * Lightweight user-location marker.
 *
 * The browser geolocation watcher in App owns the actual GPS subscription;
 * this component only renders the marker and reports clicks back to the shared
 * camera-focus handler.
 */
type UserLocationMapProps = {
  userPos: MapPoint | null;
  onMarkerFocus?: MarkerFocusHandler;
};

/** Renders the user's current location when permission and coordinates exist. */
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
