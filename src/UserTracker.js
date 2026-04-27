import { memo } from 'react';
import { Marker, CircleMarker } from "react-leaflet";
import { GetUserIcon } from './components/busMarkers.tsx';
import './components/UserTracker.css';

export const UserLocationMap = memo(function UserLocationMap({ userPos, onMarkerFocus }) {
    if (!userPos) return null;
    const userIcon = GetUserIcon('userIcon');

    return (
        <>
            <CircleMarker
                center={userPos}
                radius={14}
                bubblingMouseEvents={false}
                className="user-location-halo"
                pathOptions={{
                    color: "rgba(255, 215, 0, 0.4)",
                    fillColor: "rgba(255, 215, 0, 0.4)",
                    fillOpacity: 0.3
                }}
            />

            <Marker
                position={userPos}
                icon={userIcon}
                bubblingMouseEvents={false}
                eventHandlers={{
                    click: () => onMarkerFocus?.(userPos, 'user'),
                }}
            />
        </>
    );
});
