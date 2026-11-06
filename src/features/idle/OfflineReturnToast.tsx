import { useTranslation } from 'react-i18next';
import { useHydrationStore } from '@/stores/hydrationStore';

/** Dismissible launch receipt; rendering/remounting never reconciles a bonus. */
export function OfflineReturnToast() {
  const { t, i18n } = useTranslation();
  const notice = useHydrationStore(state => state.offlineReturn);
  const ready = useHydrationStore(state => state.status === 'ready');
  const dismiss = useHydrationStore(state => state.dismissOfflineReturn);
  const windowSeconds = notice ? Math.ceil(notice.windowSeconds) : 0;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-testid="offline-return-live-region"
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))]
                 z-50 flex justify-center px-3"
    >
      {ready && notice && (
        <div
          data-testid="offline-return-toast"
          className="d2-surface flex w-full max-w-md items-start gap-2 rounded border border-d2-gold
                     bg-d2-panel p-3 text-d2-white shadow-lg"
        >
          <div className="min-w-0 flex-1 break-words">
            <p className="font-semibold text-d2-gold">{t('idle.returnToast.title')}</p>
            <p className="text-sm">
              {t('idle.returnToast.body', {
                hours: Math.floor(notice.awayMs / 3_600_000),
                minutes: Math.floor(notice.awayMs / 60_000) % 60,
                pct: new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 2 })
                  .format(notice.bonusPct * 100),
                windowMinutes: Math.floor(windowSeconds / 60),
                windowSeconds: windowSeconds % 60
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('close')}
            className="d2-control pointer-events-auto min-h-[44px] min-w-[44px] shrink-0 rounded
                       text-xl text-d2-gold focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-d2-gold"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
