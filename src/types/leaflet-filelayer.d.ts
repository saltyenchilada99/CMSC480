declare module "leaflet-filelayer" {
    export default function fileLayer(
        root: Window,
        leaflet: typeof import("leaflet"),
        toGeoJSON: unknown
    ): typeof import("leaflet");
}

declare module "togeojson";
