import { FileLayerRoute } from './FileLayerRoute';

export function DowntownLoopRoute({ toggleRoutes = false }: { toggleRoutes?: boolean }) {
    return (
        <FileLayerRoute
            toggleRoutes={toggleRoutes}
            filename="downtown-loop.geojson"
            color="#6D0026"
            routeUrl="/routes/downtown-loop.geojson"
        />
    );
}
