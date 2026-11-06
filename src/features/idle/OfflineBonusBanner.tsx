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

/** Decorative inline artwork keeps both bonus surfaces independent of emoji fonts. */
function BonusHourglass(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom"
    >
      <path d="M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4M9 6h6M9 18h6" />
    </svg>
  );
}

/** Current bonus strength on the shared 0–50% scale, not original duration. */
function BonusMeter({ currentPct, minutes }: { currentPct: number; minutes: number }): JSX.Element {
  const { t } = useTranslation('common');
  return (
    <span
      role="meter"
      aria-label={t('offlineBonus.meterLabel')}
      aria-valuemin={0}
      aria-valuemax={50}
      aria-valuenow={currentPct * 100}
      aria-valuetext={t('offlineBonus.chipLabel', { pct: Math.round(currentPct * 100), minutes })}
      className="block h-1 w-full overflow-hidden rounded bg-d2-gold/15"
    >
      <span className="block h-full bg-d2-gold" style={{ width: `${String(currentPct / 0.5 * 100)}%` }} />
    </span>
  );
}

/** Slim chip variant for HUD use. */
export function OfflineBonusChip(): JSX.Element | null {
  const { t } = useTranslation('common');
  const bonus = useOfflineBonus();
  if (!bonus.active) return null;
  const pct = Math.round(bonus.currentPct * 100);
  const minutes = formatMinutes(bonus.remainingSeconds);
  return (
    <span
      data-testid="offline-bonus-chip"
      className="d2-tag inline-flex flex-col justify-center gap-1 px-2 py-1 rounded
                 bg-d2-gold/15 border border-d2-gold/40 text-d2-gold text-xs
                 min-h-[28px] max-w-full"
      aria-label={t('offlineBonus.chipLabel', {
        pct,
        minutes
      })}
    >
      <span><BonusHourglass />{t('offlineBonus.chipText', { pct, minutes })}</span>
      <BonusMeter currentPct={bonus.currentPct} minutes={minutes} />
    </span>
  );
}

/** Full banner for /home. */
export function OfflineBonusBanner(): JSX.Element | null {
  const { t } = useTranslation('common');
  const bonus = useOfflineBonus();
  if (!bonus.active) return null;
  const pct = Math.round(bonus.currentPct * 100);
  const minutes = formatMinutes(bonus.remainingSeconds);
  return (
    <Panel
      className="border-d2-gold/60 bg-d2-gold/10"
      data-testid="offline-bonus-banner"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 min-h-[44px]">
        <div className="text-d2-gold font-serif text-base">
          <BonusHourglass />{t('offlineBonus.title', { pct })}
        </div>
        <div className="text-d2-white/80 text-sm">
          {t('offlineBonus.remaining', { minutes })}
        </div>
      </div>
      <BonusMeter currentPct={bonus.currentPct} minutes={minutes} />
    </Panel>
  );
}
