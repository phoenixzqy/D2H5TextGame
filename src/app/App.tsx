import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { useStealthMode } from './useStealthMode';
import { initPersistence, useMetaStore } from '@/stores';
import { OfflineReturnToast } from '@/features/idle/OfflineReturnToast';

function App() {
  useStealthMode();

  useEffect(() => {
    void initPersistence();
  }, []);

  return (
    <Providers>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
        <OfflineReturnToast />
        <StealthIndicator />
      </BrowserRouter>
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
