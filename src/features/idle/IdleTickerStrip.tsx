/**
 * IdleTickerStrip — slim ticker rendered at the bottom of /map (Bug
 * #19). Mobile-first: ≤44px row, no horizontal scroll @ 360×640.
 */
import { useTranslation } from 'react-i18next';
import { useIdleTicker, useIdleTickerStore, DEFAULT_TICK_SECONDS } from './useIdleTicker';

export function IdleTickerStrip(): JSX.Element {
  useIdleTicker(DEFAULT_TICK_SECONDS);
  const { t } = useTranslation('common');
  const reward = useIdleTickerStore((s) => s.lastReward);
  const lastKillName = useIdleTickerStore((s) => s.lastKillName);
  const tickSeconds = useIdleTickerStore((s) => s.tickSeconds);
  const tickCount = useIdleTickerStore((s) => s.tickCount);

  const summary = tickCount === 0
    ? t('idleTicker.idle')
    : t('idleTicker.summary', {
        seconds: tickSeconds,
        xp: reward.xp,
        drops: reward.runeShards
      });

  return (
    <div
      data-testid="idle-ticker"
      className="sticky bottom-0 left-0 right-0 z-30
                 max-h-[44px] min-h-[36px]
                 px-3 py-1 flex items-center justify-between gap-2
                 text-xs text-d2-white/80
                 bg-d2-panel/90 backdrop-blur border-t border-d2-border
                 truncate"
      role="status"
      aria-live="polite"
    >
      <span className="truncate">{summary}</span>
      {lastKillName && (
        <span className="truncate text-d2-gold/80 shrink-0">
          {t('idleTicker.lastKill', { name: lastKillName })}
        </span>
      )}
    </div>
  );
}
