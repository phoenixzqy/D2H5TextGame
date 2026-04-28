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

  useEffect(() => {
    void initPersistence();
  }, []);

  return (
    <Providers>
      <BrowserRouter>
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
