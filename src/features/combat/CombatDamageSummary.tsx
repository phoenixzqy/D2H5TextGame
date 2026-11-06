import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { summarizeHeroDamage } from '@/engine/combat/hero-damage-summary';

/** Explain recorded final-wave hero damage after terminal loss playback. */
export function CombatDamageSummary({ events, team }: {
  readonly events: readonly RecordedBattleEvent[];
  readonly team: readonly CombatUnit[];
}) {
  const { t, i18n } = useTranslation('combat');
  const summary = useMemo(() => summarizeHeroDamage(events, team), [events, team]);
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, { maximumFractionDigits: 2 });
  return (
    <section className="mb-3 min-w-0 break-words text-sm text-d2-white/90"
      aria-label={t('damageSummary.title')} data-testid="hero-damage-summary">
      <h3 className="d2-section-title mb-1 font-semibold text-d2-gold">{t('damageSummary.title')}</h3>
      {summary === null ? <p>{t('damageSummary.unavailable')}</p> : <>
        <p className="mb-2 leading-relaxed">{t('damageSummary.scope')}</p>
        {summary.byType.length === 0 ? <p>{t('damageSummary.empty')}</p> : (
          <dl className="max-w-md space-y-1">
            {summary.byType.map(row => (
              <div key={row.type} className="flex justify-between gap-4">
                <dt>{t(row.type === 'dot' ? 'damageSummary.dot' : row.type === 'other'
                  ? 'damageSummary.other' : `damageType.${row.type}`)}</dt>
                <dd className="shrink-0 tabular-nums">{formatter.format(row.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-d2-gold/30 pt-1 font-semibold">
              <dt>{t('damageSummary.total')}</dt>
              <dd className="shrink-0 tabular-nums">{formatter.format(summary.total)}</dd>
            </div>
          </dl>
        )}
      </>}
    </section>
  );
}
