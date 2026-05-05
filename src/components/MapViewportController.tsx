/**
 * Centralized Leaflet camera controller.
 *
 * All marker/search focus requests flow through this component so map bounds,
 * popup centering, and reset behavior stay consistent across marker layers.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';
import type { MapFocusTarget } from '../types/frontend';

type MapViewportControllerProps = {
    focusTarget: MapFocusTarget;
    onResetFocus: () => void;
};

const POSITION_EPSILON_PIXELS = 1;

/** Runs inside `MapContainer` and performs imperative Leaflet camera work. */
export function MapViewportController({ focusTarget, onResetFocus }: MapViewportControllerProps) {
    const map = useMap();
    const latestFocusRef = useRef<MapFocusTarget>(focusTarget);
    const hasOpenPopupRef = useRef(false);
    const popupCleanupRef = useRef<null | (() => void)>(null);
    const resetTimeoutRef = useRef<number | null>(null);

    /** Cancel delayed reset work when another map interaction supersedes it. */
    const clearPendingReset = () => {
        if (resetTimeoutRef.current !== null) {
            window.clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
    };

    /** Pan just enough to keep the full popup visible inside the map viewport. */
    const centerPopupInView = (popupElement: HTMLElement) => {
        const mapElement = map.getContainer();

        if (!popupElement || !mapElement) {
            return;
        }

        const popupRect = popupElement.getBoundingClientRect();
        const mapRect = mapElement.getBoundingClientRect();
        const popupCenterX = popupRect.left + (popupRect.width / 2);
        const popupCenterY = popupRect.top + (popupRect.height / 2);
        const mapCenterX = mapRect.left + (mapRect.width / 2);
        const mapCenterY = mapRect.top + (mapRect.height / 2);
        const panX = Math.round(popupCenterX - mapCenterX);
        const panY = Math.round(popupCenterY - mapCenterY);

        if (Math.abs(panX) > 3 || Math.abs(panY) > 3) {
            map.stop();
            map.panBy([panX, panY], {
                animate: false,
            });
        }
    };

    useEffect(() => {
        latestFocusRef.current = focusTarget;
    }, [focusTarget]);

    useEffect(() => () => {
        clearPendingReset();
        popupCleanupRef.current?.();
    }, []);

    useEffect(() => {
        /** Clamp requested centers so maxBounds never cut off cards or markers. */
        const getBoundedCenter = (center: [number, number], zoom: number) => {
            const configuredMaxBounds = map.options.maxBounds;
            const desiredCenter = L.latLng(center);

            if (!configuredMaxBounds) {
                return desiredCenter;
            }

            const maxBounds = configuredMaxBounds instanceof L.LatLngBounds
                ? configuredMaxBounds
                : L.latLngBounds(configuredMaxBounds);

            const size = map.getSize();
            const southWestPoint = map.project(maxBounds.getSouthWest(), zoom);
            const northEastPoint = map.project(maxBounds.getNorthEast(), zoom);
            const minX = Math.min(southWestPoint.x, northEastPoint.x);
            const maxX = Math.max(southWestPoint.x, northEastPoint.x);
            const minY = Math.min(southWestPoint.y, northEastPoint.y);
            const maxY = Math.max(southWestPoint.y, northEastPoint.y);
            const halfWidth = size.x / 2;
            const halfHeight = size.y / 2;
            const desiredPoint = map.project(desiredCenter, zoom);
            const allowedMinX = minX + halfWidth;
            const allowedMaxX = maxX - halfWidth;
            const allowedMinY = minY + halfHeight;
            const allowedMaxY = maxY - halfHeight;

            const clampedX =
                allowedMinX > allowedMaxX
                    ? (minX + maxX) / 2
                    : Math.min(Math.max(desiredPoint.x, allowedMinX), allowedMaxX);
            const clampedY =
                allowedMinY > allowedMaxY
                    ? (minY + maxY) / 2
                    : Math.min(Math.max(desiredPoint.y, allowedMinY), allowedMaxY);

            return map.unproject(L.point(clampedX, clampedY), zoom);
        };

        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const nextZoom = focusTarget.zoom ?? currentZoom;
        const boundedCenter = getBoundedCenter(focusTarget.center, nextZoom);
        const moved =
            map.project(currentCenter, nextZoom).distanceTo(map.project(boundedCenter, nextZoom)) > POSITION_EPSILON_PIXELS;
        const zoomChanged = Math.abs(currentZoom - nextZoom) > 0.001;

        if (!moved && !zoomChanged) {
            return;
        }

        if (zoomChanged) {
            map.flyTo(boundedCenter, nextZoom, {
                animate: true,
                duration: 0.55,
                easeLinearity: 0.2,
            });
            return;
        }

        map.panTo(boundedCenter, {
            animate: true,
            duration: 0.35,
            easeLinearity: 0.2,
        });
    }, [focusTarget, map]);

    useMapEvents({
        popupopen(event) {
            hasOpenPopupRef.current = true;
            clearPendingReset();
            popupCleanupRef.current?.();

            const cleanupFns: Array<() => void> = [];
            /** Wait for Leaflet/React layout to settle before measuring the popup. */
            const scheduleAdjust = () => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        const popupElement = event.popup?.getElement();

                        if (popupElement) {
                            centerPopupInView(popupElement);
                        }
                    });
                });
            };

            scheduleAdjust();

            window.requestAnimationFrame(() => {
                const popupElement = event.popup?.getElement();

                if (!popupElement) {
                    return;
                }

                popupElement.querySelectorAll('img').forEach((image) => {
                    if (image.complete) {
                        return;
                    }

                    const handleImageReady = () => scheduleAdjust();
                    image.addEventListener('load', handleImageReady);
                    image.addEventListener('error', handleImageReady);
                    cleanupFns.push(() => {
                        image.removeEventListener('load', handleImageReady);
                        image.removeEventListener('error', handleImageReady);
                    });
                });
            });

            popupCleanupRef.current = () => {
                cleanupFns.forEach((cleanup) => cleanup());
                popupCleanupRef.current = null;
            };
        },
        popupclose() {
            hasOpenPopupRef.current = false;
            popupCleanupRef.current?.();
            clearPendingReset();
        },
        click(event) {
            const clickTarget = event.originalEvent?.target;

            if (clickTarget instanceof Element && clickTarget.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-control-container')) {
                return;
            }

            if (!hasOpenPopupRef.current && latestFocusRef.current.type === 'marker') {
                clearPendingReset();
                onResetFocus();
            }
        },
    });

    return null;
}
