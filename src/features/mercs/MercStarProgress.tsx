import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMercPool } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { Button } from '@/ui';
import { mercSignatureRank } from '@/engine/progression/merc-stars';

/** Explicit shard spending, with current ownership and busy checks enforced by the store. */
export function MercStarProgress({ mercId }: { readonly mercId: string }) {
  const { t } = useTranslation('mercs');
  const id = mercId.split('#')[0] ?? mercId;
  const stars = useMercStore(state => state.recruitmentProgress[id]?.stars ?? 0);
  const shards = useMercStore(state => state.recruitmentProgress[id]?.shards ?? 0);
  const upgrade = useMercStore(state => state.upgradeMercStar);
  const locked = useCombatStore(state => state.inCombat ||
    (state.subAreaRunId !== null && !state.runVictory && !state.runDefeat));
  const ready = useHydrationStore(state => state.status === 'ready');
  const rules = useMemo(() => loadMercPool().banner.shardConversion, []);
  const [refused, setRefused] = useState(false);
  const capped = stars >= rules.maxStars;
  const rank = mercSignatureRank(stars);
  const signatureBonus = Number(((rank - 1) * rules.starBonuses.signatureEffectPerRank * 100).toFixed(2));
  return <section className="d2-surface space-y-2 rounded border border-d2-border bg-black/25 p-3"
    aria-label={t('stars.title')} data-testid={`merc-stars-${id}`}>
    <div className="flex flex-wrap justify-between gap-2 text-sm" aria-live="polite">
      <span className="text-d2-gold">{t('stars.count', { stars, max: rules.maxStars })}</span>
      <span>{t('stars.shards', { shards, cost: rules.shardsPerStar })}</span>
    </div>
    <p className="text-sm text-d2-white/75" aria-live="polite">{t('stars.signatureRank', { rank })}</p>
    <p className="text-sm text-d2-white/75">{t('stars.signatureBonus', { percent: signatureBonus })}</p>
    <p className="text-sm text-d2-white/75">{t(capped ? 'stars.capped' : 'stars.bonus', {
      percent: rules.starBonuses.statMultiplierPerStar * 100
    })}</p>
    <Button className="min-h-[44px] w-full text-sm" variant="secondary"
      disabled={capped || shards < rules.shardsPerStar || locked || !ready}
      onClick={() => { setRefused(!upgrade(mercId)); }}>
      {t(capped ? 'stars.maxed' : 'stars.upgrade', { cost: rules.shardsPerStar })}
    </Button>
    {refused && <p role="alert" className="text-sm text-red-300">{t('stars.refused')}</p>}
  </section>;
}
