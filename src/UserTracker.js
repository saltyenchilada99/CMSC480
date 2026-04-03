import { useEffect, useState, useCallback } from "react";
import { Marker, CircleMarker, Popup, useMap } from "react-leaflet";
import { GetUserIcon } from './components/busMarkers.tsx';
import './components/UserTracker.css';

function RecenterOnce({ position, onCentered }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(position, map.getZoom(), {
            animate: true,
            duration: 0.5
        });
        onCentered();
    }, [map, position, onCentered]);

    return null;
}

export function UserLocationMap() {
    const [userPos, setUserPos] = useState(null);
    const [hasCentered, setHasCentered] = useState(false);

    const handleCentered = useCallback(() => {
        setHasCentered(true);
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserPos([pos.coords.latitude, pos.coords.longitude]);
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    if (!userPos) return null;

    return (
        <>
            {!hasCentered && (
                <RecenterOnce position={userPos} onCentered={handleCentered} />
            )}

            <CircleMarker
                center={userPos}
                radius={14}
                className="user-location-halo"
                pathOptions={{
                    color: "rgba(255, 215, 0, 0.4)",   // BU gold, soft
                    fillColor: "rgba(255, 215, 0, 0.4)",
                    fillOpacity: 0.3
                }}
            />

            <Marker
                position={userPos}
                icon={GetUserIcon("userIcon")}
            >
                <Popup>
                    <div style={{ marginBottom: "4px" }}>
                    <strong>{"You are Here."}</strong>
                </div>
                </Popup>
            </Marker>
        </>
    );
}
