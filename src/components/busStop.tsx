import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { GetBusStopIcon } from './busMarkers.tsx';

type RouteInfo = {
    name: string;
    color: string;
};

const ROUTES: Record<string, RouteInfo> = {
    campus: { name: "Campus Loop", color: "#B8860B" },
    downtown: { name: "Downtown Loop", color: "#6D0026" },
    walmart: { name: "Walmart Trip", color: "#0057B8" },
};

const STOP_ROUTES: Record<string, RouteInfo[]> = {
    'BS-1': [ROUTES.campus, ROUTES.walmart],
    'BS-2': [ROUTES.campus],
    'BS-3': [ROUTES.campus],
    'BS-4': [ROUTES.campus],
    'BS-5': [ROUTES.campus],
    'BS-6': [ROUTES.campus],
};

class busStop {
    name!: string;
    lat!: number;
    long!: number;
    img!: string;
    key!: string;
}

export const busStopLibrary: busStop[] = [{
    name: "library",
    lat: 41.00865,
    long: 76.44525,
    img: '',
    key: 'BS-1'
}, {
    name: "MPA",
    lat: 41.01429,
    long: 76.44654,
    img: '',
    key: 'BS-2'
}, {
    name: "Athletic Complex",
    lat: 41.01525,
    long: 76.44961,
    img: '',
    key: 'BS-3'
}, {
    name: "JKA",
    lat: 41.01735,
    long: 76.45308,
    img: '',
    key: 'BS-4'
}, {
    name: "Orange Lot",
    lat: 41.01820,
    long: 76.448865,
    img: '',
    key: 'BS-5'
}, {
    name: "MOA",
    lat: 41.01635,
    long: 76.44624,
    img: '',
    key: 'BS-6'
}];

export function BusStop() {
    const busStopIcon = GetBusStopIcon();

    return (
        busStopLibrary.map((busStop : busStop) => (
            <Marker
                key={`${busStop.key}`}
                position={[busStop.lat, -busStop.long]}
                icon={busStopIcon}
                zIndexOffset={500}
            >
                <Popup autoPan={false}>
                    <strong>{busStop.name}</strong>
                    <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Routes:</strong>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                            {(STOP_ROUTES[busStop.key] ?? []).map((route) => (
                                <span
                                    key={route.name}
                                    style={{
                                        backgroundColor: route.color,
                                        color: "#fff",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {route.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </Popup>
            </Marker>
        )));
}
