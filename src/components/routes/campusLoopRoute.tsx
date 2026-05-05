import { FileLayerRoute } from './FileLayerRoute';

export function CampusLoopRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    return (
        <FileLayerRoute
            toggleRoutes={toggleRoutes}
            filename="campus-loop.geojson"
            color="#B8860B"
            routeUrl="/routes/campus-loop.geojson"
        />
    );
}
