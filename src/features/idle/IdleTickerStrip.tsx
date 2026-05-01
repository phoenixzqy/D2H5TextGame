/**
 * IdleTickerStrip — slim ticker rendered at the bottom of /map (Bug
 * #19). Mobile-first: ≤44px row, no horizontal scroll @ 360×640.
 *
 * Bug #4 — when an idle target is active, expose a one-tap "Stop"
 * control here as well so it's discoverable from anywhere on the
 * screen, not only on the row that started farming.
 */
import { useTranslation } from 'react-i18next';
import { useMetaStore } from '@/stores';

export function IdleTickerStrip(): JSX.Element {
  const { t } = useTranslation(['common', 'map']);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);
  const setIdleTarget = useMetaStore((s) => s.setIdleTarget);

  const summary = idleTarget ? t('idleTicker.active') : t('idleTicker.idle');

  return (
    <div
      data-testid="idle-ticker"
      className="sticky bottom-0 left-0 right-0 z-30
                 max-h-[44px] min-h-[44px]
                 px-3 py-1 flex items-center justify-between gap-2
                 text-xs text-d2-white/80
                 bg-d2-panel/90 backdrop-blur border-t border-d2-border
                 truncate"
      role="status"
      aria-live="polite"
      >
        <span className="truncate">{summary}</span>
      {idleTarget && (
        <button
          type="button"
          onClick={() => { setIdleTarget(undefined); }}
          className="shrink-0 inline-flex items-center justify-center
                     min-h-[36px] min-w-[44px] px-2
                     text-xs text-d2-white border border-d2-border rounded
                     bg-d2-panel hover:bg-d2-border/30
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
          aria-label={t('map:stopFarming')}
          data-testid="idle-ticker-stop"
        >
          ⏹ {t('map:stopFarming')}
        </button>
      )}
    </div>
  );
}
