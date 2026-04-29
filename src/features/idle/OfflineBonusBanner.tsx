/**
 * OfflineBonusBanner — surfaces the current offline-bonus window on
 * the home/town screens (Bug #20).
 *
 * Renders nothing when no bonus window is active.
 */
import { useTranslation } from 'react-i18next';
import { Panel } from '@/ui';
import { useOfflineBonus } from './useOfflineBonus';

function formatMinutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}

/** Slim chip variant for HUD use. */
export function OfflineBonusChip(): JSX.Element | null {
  const { t } = useTranslation('common');
  const bonus = useOfflineBonus();
  if (!bonus.active) return null;
  const pct = Math.round(bonus.peakPct * 100);
  return (
    <span
      data-testid="offline-bonus-chip"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded
                 bg-d2-gold/15 border border-d2-gold/40 text-d2-gold text-xs
                 min-h-[28px]"
      aria-label={t('offlineBonus.chipLabel', {
        pct,
        minutes: formatMinutes(bonus.remainingSeconds),
        defaultValue: `+${String(pct)}% XP for ${String(formatMinutes(bonus.remainingSeconds))} min`
      })}
    >
      ⏳ +{pct}% · {formatMinutes(bonus.remainingSeconds)}m
    </span>
  );
}

/** Full banner for /home. */
export function OfflineBonusBanner(): JSX.Element | null {
  const { t } = useTranslation('common');
  const bonus = useOfflineBonus();
  if (!bonus.active) return null;
  const pct = Math.round(bonus.peakPct * 100);
  const minutes = formatMinutes(bonus.remainingSeconds);
  return (
    <Panel
      className="border-d2-gold/60 bg-d2-gold/10"
      data-testid="offline-bonus-banner"
    >
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        <div className="text-d2-gold font-serif text-base">
          ⏳ {t('offlineBonus.title', {
            pct,
            defaultValue: `+${String(pct)}% XP boost`
          })}
        </div>
        <div className="text-d2-white/80 text-sm">
          {t('offlineBonus.remaining', {
            minutes,
            defaultValue: `next ${String(minutes)} min`
          })}
        </div>
      </div>
    </Panel>
  );
}
