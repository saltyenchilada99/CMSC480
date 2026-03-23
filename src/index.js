import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BusProvider } from './components/bus.tsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BusProvider>
    <App/>
  </BusProvider>
);
