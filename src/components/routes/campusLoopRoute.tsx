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
    [41.00880, -76.44506], // Back to A&A (closes the loop)
];

// This is a sort of bandaid solution to the bugged tracing through the A&A parking lot
const manualParkingLotPath: LatLng[] = [
    [41.00875, -76.44516],
    [41.00870, -76.44517],
    [41.00815, -76.44477],
    [41.00808, -76.44476],
    [41.00796, -76.44479],
    [41.00786, -76.44471],
    [41.00800, -76.44440],
];

export function CampusLoopRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

    useEffect(() => {
        async function fetchRoute() {
            try {
                const coordString = stops
                    .map(([lat, lng]) => `${lng},${lat}`)
                    .join(";");

                const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const json = await res.json();

                if (!json.routes || !json.routes[0]) return;

                const osrmCoords: LatLng[] = json.routes[0].geometry.coordinates.map(
                    ([lng, lat]: [number, number]) => [lat, lng]
                );

                // Insert manual path right after the first stop
                const merged = [
                    stops[6],                 // A&A
                    ...manualParkingLotPath,  // your custom loop
                    ...osrmCoords.slice(1),   // rest of OSRM route
                ];

                setRouteCoords(merged);
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
                    pathOptions={{ color: "#B8860B", weight: 4, opacity: 0.6 }}
                />
            )}
        </>
    );
}
