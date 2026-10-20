import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { flushSave, useSaveStatusStore } from '@/stores/persistence';

/** Persistent, accessible recovery feedback for background storage failures. */
export function SaveFailureNotice() {
  const { t } = useTranslation('settings');
  const error = useSaveStatusStore((s) => s.error);
  if (!error) return null;
  return (
    <div
      role="alert"
      className="relative z-40 shrink-0 w-full bg-d2-panel border border-d2-gold p-3 text-d2-white text-sm"
    >
      <p>{t('storageFailure')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          className="min-h-[44px] underline"
          onClick={() => {
            void flushSave()?.catch(() => undefined);
          }}
        >
          {t('saveNow')}
        </button>
        <Link to="/settings" className="inline-flex items-center min-h-[44px] underline">
          {t('exportSave')}
        </Link>
      </div>
    </div>
  );
}
