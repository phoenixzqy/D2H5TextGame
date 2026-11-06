import { useEffect } from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { useStealthMode } from './useStealthMode';
import { CharacterHud } from '@/ui';
import { initPersistence, useMetaStore } from '@/stores';

// Pages serves static files without a fallback for browser history routes.
const Router = import.meta.env.VITE_GITHUB_PAGES === 'true' ? HashRouter : BrowserRouter;

function App() {
  useStealthMode();
  const stealthOn = useMetaStore((s) => s.settings.stealthMode);
  const markClosed = useMetaStore((s) => s.markClosed);

  useEffect(() => {
    void initPersistence();
  }, []);

  // Bug #20 — record when the page is hidden so the offline-bonus
  // window can be computed on return without depending on save
  // timestamps.
  useEffect(() => {
    const handler = (): void => {
      if (document.visibilityState === 'hidden') markClosed();
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('pagehide', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('pagehide', handler);
    };
  }, [markClosed]);

  return (
    <Providers>
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
        <CharacterHud />
        {stealthOn && (
          <span
            data-testid="stealth-indicator"
            aria-hidden="true"
            className="sr-only"
          >
            stealth
          </span>
        )}
      </Router>
    </Providers>
  );
}

export default App;
