/// <reference types="react-scripts" />

import type L from 'leaflet';

/**
 * Test/debug escape hatch used by map components to expose the Leaflet instance
 * during local inspection.
 */
declare global {
  interface Window {
    __MAP__?: L.Map;
  }
}

export {};
