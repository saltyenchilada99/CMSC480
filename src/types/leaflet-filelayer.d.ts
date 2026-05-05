declare module "leaflet-filelayer" {
    import type * as Leaflet from "leaflet";

    export default function fileLayer(
        root: Window,
        leaflet: typeof Leaflet,
        toGeoJSON: unknown
    ): typeof Leaflet;
}

declare module "togeojson";

declare module "leaflet" {
    namespace FileLayer {
        function fileLoader(map: Leaflet.Map, options?: Record<string, unknown>): FileLoader;

        interface FileLoader extends Leaflet.Layer {
            loadData(data: string, name: string, ext?: string): void;
            on(type: string, fn: (...args: any[]) => void): this;
            off(type: string, fn: (...args: any[]) => void): this;
        }
    }
}
