import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BusProvider } from './components/bus';

/**
 * React application entrypoint.
 *
 * BusProvider is mounted at the root so every map/sidebar component can read
 * live WebSocket bus data without prop-drilling through unrelated components.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <BusProvider>
    <App />
  </BusProvider>
);
