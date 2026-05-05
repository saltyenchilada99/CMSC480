/**
 * Opens a marker popup after a search/focus action.
 *
 * React state can request a popup before Leaflet finishes panning or zooming.
 * This hook waits until the map is near the target, then opens the popup with a
 * timeout fallback so repeated searches stay reliable.
 */

import { useEffect, type RefObject } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import type { MapPoint } from '../types/frontend';

type UseSelectedMarkerPopupArgs = {
  markerRef: RefObject<L.Marker | null>;
  markerKey: string;
  markerPosition: MapPoint;
  selectedMarkerKey?: string | null;
  selectedMarkerRequestId?: number;
  selectedMarkerZoom?: number;
};

const MARKER_READY_DISTANCE_PIXELS = 32;
const OPEN_AFTER_MOVE_DELAY_MS = 80;
const FALLBACK_OPEN_DELAY_MS = 760;

/** Attach to a marker component that should react to `selectedMarker` changes. */
export function useSelectedMarkerPopup({
  markerRef,
  markerKey,
  markerPosition,
  selectedMarkerKey,
  selectedMarkerRequestId,
  selectedMarkerZoom,
}: UseSelectedMarkerPopupArgs) {
  const map = useMap();

  useEffect(() => {
    if (!selectedMarkerKey || selectedMarkerKey !== markerKey) {
      return undefined;
    }

    let openDelayId: number | null = null;
    let fallbackId: number | null = null;
    let didOpen = false;

    const clearOpenDelay = () => {
      if (openDelayId !== null) {
        window.clearTimeout(openDelayId);
        openDelayId = null;
      }
    };

    const openPopup = () => {
      if (didOpen) return;

      didOpen = true;
      clearOpenDelay();
      openDelayId = window.setTimeout(() => {
        markerRef.current?.openPopup();
      }, OPEN_AFTER_MOVE_DELAY_MS);
    };

    const targetZoom = selectedMarkerZoom ?? map.getZoom();
    const centerDistance = map
      .project(map.getCenter(), targetZoom)
      .distanceTo(map.project(L.latLng(markerPosition), targetZoom));
    const zoomReady = Math.abs(map.getZoom() - targetZoom) < 0.05;
    const centerReady = centerDistance <= MARKER_READY_DISTANCE_PIXELS;

    if (zoomReady && centerReady) {
      openPopup();
    } else {
      map.once('moveend', openPopup);
      fallbackId = window.setTimeout(openPopup, FALLBACK_OPEN_DELAY_MS);
    }

    return () => {
      map.off('moveend', openPopup);
      clearOpenDelay();

      if (fallbackId !== null) {
        window.clearTimeout(fallbackId);
      }
    };
  }, [
    map,
    markerKey,
    markerPosition,
    markerRef,
    selectedMarkerKey,
    selectedMarkerRequestId,
    selectedMarkerZoom,
  ]);
}
