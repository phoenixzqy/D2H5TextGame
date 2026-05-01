import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/index.css';
import '@/i18n'; // Initialize i18n

/**
 * Boot sequence.
 *
 * The test bridge (`window.__GAME__`) is gated behind a *build-time* conditional
 * over `import.meta.env.{DEV,MODE,VITE_E2E}`. Vite statically replaces those
 * tokens, so in a production build (no `VITE_E2E`) the entire `if` body —
 * including the `import('./test-bridge')` call — is dead-code-eliminated and
 * the bridge module never enters the graph. See
 * `docs/perf/test-bridge-tree-shake.md` and
 * `scripts/check-test-bridge-shaken.mjs` for the regression guard.
 */
async function bootstrap(): Promise<void> {
  if (
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_E2E === 'true'
  ) {
    const { installTestBridge } = await import('./test-bridge');
    installTestBridge();
  }

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
}

void bootstrap();
