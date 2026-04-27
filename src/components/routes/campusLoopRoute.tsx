import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";

type LatLng = [number, number];

const stops: LatLng[] = [
    [41.008674, -76.445245], // Library
    [41.009118, -76.447059], // Mccormic
    [41.015415, -76.450112], // Nelson Field
    [41.014352, -76.446527], // Montgomery Place Apts
    [41.016437, -76.445937], // Mt Olympus Apts
    [41.018184, -76.44886], // Orange Lot
    [41.017498, -76.450388], // Stadium
    [41.017353, -76.453079], // JKA Apts
    [41.008674, -76.445245], // Back to Library (closes the loop)
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

                const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=polyline`;
                const res = await fetch(url);
                const json = await res.json();

                if (!json.routes || !json.routes[0]) return;

                // Decode polyline to get coordinates (more efficient than geojson)
                const osrmCoords: LatLng[] = polyline.toGeoJSON(json.routes[0].geometry).coordinates.map(
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
