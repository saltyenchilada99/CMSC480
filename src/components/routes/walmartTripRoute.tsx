import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";

type LatLng = [number, number];

const stops: LatLng[] = [
    [41.00864, -76.44540], // Arts & Administration Building
    [41.00872, -76.48541], // Wal‑Mart
];

export function WalmartTripRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

    useEffect(() => {
        async function fetchRoute() {
            try {
                const coordString = stops
                    .map(([lat, lng]) => `${lng},${lat}`)
                    .join(";");
                // URL below MUST be on single line
                const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=polyline`;
                const res = await fetch(url);
                const json = await res.json();

                if (!json.routes || !json.routes[0]) return;

                // Decode polyline to get coordinates (more efficient than geojson)
                const coords: LatLng[] = polyline.toGeoJSON(json.routes[0].geometry).coordinates.map(
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
                    pathOptions={{ color: "#0057B8", weight: 4, opacity: 0.6 }}
                />
            )}
        </>
    );
}
