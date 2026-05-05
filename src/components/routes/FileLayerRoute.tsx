import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import fileLayer from "leaflet-filelayer";
import * as toGeoJSON from "togeojson";

type FileLayerRouteProps = {
    toggleRoutes?: boolean;
    filename: string;
    color: string;
    routeUrl: string;
};

let didInitializeFileLayer = false;

function initializeFileLayerPlugin() {
    if (didInitializeFileLayer || typeof window === "undefined") return;

    fileLayer(window, L, toGeoJSON);
    didInitializeFileLayer = true;
}

export function FileLayerRoute({
    toggleRoutes = false,
    filename,
    color,
    routeUrl,
}: FileLayerRouteProps) {
    const map = useMap();
    const layerRef = useRef<L.Layer | null>(null);

    useEffect(() => {
        initializeFileLayerPlugin();

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        if (!toggleRoutes) return undefined;

        const controller = new AbortController();
        const loader = L.FileLayer.fileLoader(map, {
            addToMap: false,
            layerOptions: {
                style: {
                    color,
                    weight: 4,
                    opacity: 0.6,
                },
            },
        });

        const handleLoaded = (event: { layer: L.Layer }) => {
            if (controller.signal.aborted) return;

            layerRef.current = event.layer;
            event.layer.addTo(map);
        };

        const handleError = (event: { error: Error }) => {
            console.error(`Failed to load route file ${filename}`, event.error);
        };

        loader.on("data:loaded", handleLoaded);
        loader.on("data:error", handleError);

        fetch(routeUrl, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then((data) => {
                if (!controller.signal.aborted) {
                    loader.loadData(data, filename, "geojson");
                }
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    console.error(`Failed to fetch route file ${filename}`, error);
                }
            });

        return () => {
            controller.abort();
            loader.off("data:loaded", handleLoaded);
            loader.off("data:error", handleError);

            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [color, filename, map, routeUrl, toggleRoutes]);

    return null;
}
