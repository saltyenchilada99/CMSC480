import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

type LatLng = [number, number];

const stops: LatLng[] = [
    [41.00870, -76.44525], // Library
    [41.01434, -76.44654], // MPA
    [41.01530, -76.44961], // Athletic Complex
    [41.01740, -76.45308], // JKA
    [41.01751, -76.45038], // Orange Lot
    [41.01640, -76.44624], // MOA
];

export function Route({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

    useEffect(() => {
        async function fetchRoute() {
            try {
                const coordString = stops
                    .map(([lat, lng]) => `${lng},${lat}`)
                    .join(";");
                // URL below MUST be on single line
                const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const json = await res.json();

                if (!json.routes || !json.routes[0]) return;

                const coords: LatLng[] = json.routes[0].geometry.coordinates.map(
                    ([lng, lat]: [number, number]) => [lat, lng]
                );

                setRouteCoords(coords);
            } catch (err) {
                console.error("Failed to fetch route", err);
            }
        }

        fetchRoute();
    }, []);

    if (!toggleRoutes) return null;

    return (
        <>
            {routeCoords.length > 0 && (
                <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: "yellow", weight: 4, opacity: 0.9 }}
                />
            )}
        </>
    );
}
