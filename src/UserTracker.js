import { memo } from 'react';
import { Marker } from "react-leaflet";

export const UserLocationMap = memo(function UserLocationMap({ userPos, onMarkerFocus }) {
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
