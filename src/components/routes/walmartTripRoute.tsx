import { FileLayerRoute } from './FileLayerRoute';

/** Walmart Trip route overlay, loaded from the static GeoJSON asset. */
export function WalmartTripRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    return (
        <FileLayerRoute
            toggleRoutes={toggleRoutes}
            filename="walmart-trip.geojson"
            color="#0057B8"
            routeUrl="/routes/walmart-trip.geojson"
        />
    );
}
