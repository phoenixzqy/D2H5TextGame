import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/index.css';
import '@/i18n'; // Initialize i18n

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // vite-plugin-pwa will inject the service worker registration
    // This is handled automatically by the plugin
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
