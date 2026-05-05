/**
 * Movement-based bus icon selection.
 *
 * Provider heading can be stale or inconsistent with delayed fluid playback, so
 * live markers choose their north/east/south/west artwork from actual position
 * changes. The provider heading is only used for the first frame before enough
 * movement exists to calculate a bearing.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { GetBusIcon } from './busMarkers';
import type { LiveBus, MapPoint } from '../types/frontend';

type BusDirectionIconName = 'busIconNorth' | 'busIconEast' | 'busIconSouth' | 'busIconWest';

const EARTH_RADIUS_METERS = 6_371_000;
const MIN_DIRECTION_UPDATE_METERS = 2.5;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(from: MapPoint, to: MapPoint): number {
  const dLat = toRadians(to[0] - from[0]);
  const dLng = toRadians(to[1] - from[1]);
  const lat1 = toRadians(from[0]);
  const lat2 = toRadians(to[0]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function getBearingDegrees(from: MapPoint, to: MapPoint): number {
  const lat1 = toRadians(from[0]);
  const lat2 = toRadians(to[0]);
  const dLng = toRadians(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getIconNameFromBearing(bearing: number): BusDirectionIconName {
  const normalized = ((bearing % 360) + 360) % 360;
  if (normalized >= 315 || normalized < 45) return 'busIconNorth';
  if (normalized >= 45 && normalized < 135) return 'busIconEast';
  if (normalized >= 135 && normalized < 225) return 'busIconSouth';
  return 'busIconWest';
}

/** Return a safe initial bearing before position deltas are available. */
function getFallbackBearing(heading: LiveBus['heading']): number {
  const bearing = Number(heading);
  return Number.isFinite(bearing) ? bearing : 0;
}

/** Pick a Leaflet icon using real map movement, not user-visible speed/heading. */
export function useBusMovementIcon(position: MapPoint, fallbackHeading: LiveBus['heading']) {
  const lastDirectionPositionRef = useRef<MapPoint | null>(null);
  const [iconName, setIconName] = useState<BusDirectionIconName>(() => (
    getIconNameFromBearing(getFallbackBearing(fallbackHeading))
  ));

  useEffect(() => {
    if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) {
      return;
    }

    const previousPosition = lastDirectionPositionRef.current;
    if (!previousPosition) {
      lastDirectionPositionRef.current = position;
      return;
    }

    const distanceMeters = getDistanceMeters(previousPosition, position);
    if (distanceMeters < MIN_DIRECTION_UPDATE_METERS) {
      return;
    }

    const nextIconName = getIconNameFromBearing(getBearingDegrees(previousPosition, position));
    setIconName((currentIconName) => (
      currentIconName === nextIconName ? currentIconName : nextIconName
    ));
    lastDirectionPositionRef.current = position;
  }, [position]);

  return useMemo(() => GetBusIcon(iconName), [iconName]);
}
