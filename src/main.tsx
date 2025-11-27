import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAnalytics } from './services/analytics';
import './index.css';

// Initialize analytics before rendering
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
