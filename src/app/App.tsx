import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { useStealthMode } from './useStealthMode';
import { CharacterHud } from '@/ui';
import { initPersistence, useMetaStore } from '@/stores';

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
      <BrowserRouter
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
      </BrowserRouter>
    </Providers>
  );
}

export default App;
