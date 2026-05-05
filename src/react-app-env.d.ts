/// <reference types="react-scripts" />

import type L from 'leaflet';

declare global {
  interface Window {
    __MAP__?: L.Map;
  }
}

export {};
