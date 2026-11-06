import { useEffect } from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { useStealthMode } from './useStealthMode';
import { initPersistence, useMetaStore } from '@/stores';
import { OfflineReturnToast } from '@/features/idle/OfflineReturnToast';

// Project Pages serves static files without browser-history route fallback.
const Router = import.meta.env.VITE_GITHUB_PAGES === 'true' ? HashRouter : BrowserRouter;

function App() {
  useStealthMode();

  useEffect(() => {
    void initPersistence();
  }, []);

  return (
    <Providers>
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
        <OfflineReturnToast />
        <StealthIndicator />
      </Router>
    </Providers>
  );
}

function StealthIndicator() {
  const { t } = useTranslation('settings');
  const stealthOn = useMetaStore((s) => s.settings.stealthMode);
  return stealthOn ? (
    <span data-testid="stealth-indicator" aria-hidden="true" className="stealth-indicator">
      {t('stealthMode')}
    </span>
  ) : null;
}

export default App;
