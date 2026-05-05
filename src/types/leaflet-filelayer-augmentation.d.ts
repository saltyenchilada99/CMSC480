import type * as Leaflet from "leaflet";

/**
 * Leaflet namespace augmentation for leaflet-filelayer.
 *
 * The route overlay components call L.FileLayer.fileLoader at runtime; these
 * declarations teach TypeScript about that plugin method.
 */
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

export {};
