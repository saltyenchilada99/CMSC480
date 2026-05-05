import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BusProvider } from './components/bus';

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
