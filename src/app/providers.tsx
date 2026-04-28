import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-d2-bg text-d2-gold">
            <div className="text-xl font-serif">Loading...</div>
          </div>
        }
      >
        {children}
      </Suspense>
    </I18nextProvider>
  );
}
