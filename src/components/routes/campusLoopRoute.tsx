import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

type LatLng = [number, number];

const stops: LatLng[] = [
    [41.00864, -76.44540], // Arts & Administration Building
    [41.01434, -76.44654], // Montgomery Place Apartments (MPA)
    [41.01640, -76.44624], // Mount Olympus Apartments (MOA)
    [41.01740, -76.45308], // Jessica Kozloff Apartments (JKA)
    [41.01525, -76.44961], // Nelson Field House
    [41.01751, -76.45038], // Orange Lot (Upper Campus Parking)
    [41.00864, -76.44540], // Back to A&A (closes the loop)
];

export function CampusLoopRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
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
                    pathOptions={{ color: "yellow", weight: 4, opacity: 0.6 }}
                />
            )}
        </>
    );
}
