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
      className="d2-plaque relative z-40 shrink-0 w-full border border-d2-gold p-3 text-d2-white text-sm"
    >
      <p>{t('storageFailure')}</p>
      <div className="flex flex-wrap gap-3 mt-2">
        <button
          type="button"
          className="d2-control px-3 min-h-[44px]"
          onClick={() => {
            void flushSave()?.catch(() => undefined);
          }}
        >
          {t('saveNow')}
        </button>
        <Link to="/settings" className="d2-control px-3 inline-flex items-center min-h-[44px]">
          {t('exportSave')}
        </Link>
      </div>
    </div>
  );
}
