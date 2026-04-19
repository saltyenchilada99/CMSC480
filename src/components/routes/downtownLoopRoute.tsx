import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

type LatLng = [number, number];

const stops: LatLng[] = [
    [41.00925, -76.44673], // McCormick Center
    [41.00268, -76.45811], // Fountain
    [41.00452, -76.45687], // Old School House Apartments (OSHA)
    [41.00688, -76.45747], // Glenn Avenue Apartments (GAA)
    [41.00925, -76.44673], // Back to McCormick Center (Closes Loop)
];

export function DowntownLoopRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

    useEffect(() => {
        async function fetchRoute() {
            try {
                const coordString = stops
                    .map(([lat, lng]) => `${lng},${lat}`)
                    .join(";");
                // URL below MUST be on single line
                const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;
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
                    pathOptions={{ color: "#6D0026", weight: 4, opacity: 0.6 }}
                />
            )}
        </>
    );
}
