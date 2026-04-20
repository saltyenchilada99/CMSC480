import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

type MapFocusTarget = {
    type: 'campus' | 'user' | 'marker';
    center: [number, number];
    zoom?: number;
};

type MapViewportControllerProps = {
    focusTarget: MapFocusTarget;
    onResetFocus: () => void;
};

const POSITION_EPSILON = 0.00001;

export function MapViewportController({ focusTarget, onResetFocus }: MapViewportControllerProps) {
    const map = useMap();
    const latestFocusRef = useRef<MapFocusTarget>(focusTarget);
    const hasOpenPopupRef = useRef(false);
    const popupCleanupRef = useRef<null | (() => void)>(null);
    const resetTimeoutRef = useRef<number | null>(null);

    const clearPendingReset = () => {
        if (resetTimeoutRef.current !== null) {
            window.clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
    };

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
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const nextZoom = focusTarget.zoom ?? currentZoom;
        const [nextLat, nextLng] = focusTarget.center;
        const moved =
            Math.abs(currentCenter.lat - nextLat) > POSITION_EPSILON ||
            Math.abs(currentCenter.lng - nextLng) > POSITION_EPSILON;
        const zoomChanged = Math.abs(currentZoom - nextZoom) > 0.001;

        if (!moved && !zoomChanged) {
            return;
        }

        if (focusTarget.type === 'marker' && !zoomChanged) {
            return;
        }

        if (zoomChanged) {
            map.flyTo(focusTarget.center, nextZoom, {
                animate: true,
                duration: 0.55,
                easeLinearity: 0.2,
            });
            return;
        }

        map.panTo(focusTarget.center, {
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
            resetTimeoutRef.current = window.setTimeout(() => {
                resetTimeoutRef.current = null;

                if (!hasOpenPopupRef.current && latestFocusRef.current.type === 'marker') {
                    onResetFocus();
                }
            }, 120);
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
