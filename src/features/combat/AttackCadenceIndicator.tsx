import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatStore, usePlayerStore } from '@/stores';
import { indexHeroCadence, readHeroCadence } from '@/stores/combatCadence';

/** Actual scheduler cadence at the displayed battle position, independent of playback speed. */
export function AttackCadenceIndicator() {
  const { t, i18n } = useTranslation('combat');
  const heroId = usePlayerStore(state => state.player?.id);
  const playerTeam = useCombatStore(state => state.playerTeam);
  const events = useCombatStore(state => state.recordedEvents);
  const cursor = useCombatStore(state => state.eventCursor);
  const observations = useMemo(() => indexHeroCadence(events, heroId), [events, heroId]);
  const cadence = readHeroCadence(observations, cursor, playerTeam.find(unit => unit.id === heroId));
  if (!cadence) return null;
  const seconds = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 3 })
    .format(cadence.periodMs / 1000);
  const gear = cadence.equipmentAttackSpeedPct;
  const percent = gear === undefined ? undefined : new Intl.NumberFormat(i18n.resolvedLanguage,
    { style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }).format(gear);
  return (
    <div className="mb-2 flex items-start gap-2 text-xs leading-relaxed text-d2-white/80"
      data-testid="hero-attack-cadence">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" className="mt-0.5 h-4 w-4 shrink-0 text-d2-gold">
        <circle cx="12" cy="13" r="8" />
        <path d="M9 2h6m-3 3v3m0 5 3-3" />
      </svg>
      <div className="min-w-0 flex flex-wrap gap-x-3 gap-y-1">
        <span>{t('cadence.interval', { seconds })}</span>
        {percent !== undefined && <span>{t('cadence.gear', { percent })}</span>}
      </div>
    </div>
  );
}
