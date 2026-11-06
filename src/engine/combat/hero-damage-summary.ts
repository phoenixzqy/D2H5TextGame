import type { BattleEvent } from './combat';
import { inferKind, type CombatUnit } from './types';

const DAMAGE_BUCKETS = ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns', 'true', 'other', 'dot'] as const;
type DamageBucket = typeof DAMAGE_BUCKETS[number];

/** Recorded post-defense amounts, which can include overkill and self-damage. */
export interface HeroDamageSummary {
  readonly byType: readonly { readonly type: DamageBucket; readonly amount: number }[];
  readonly total: number;
}

/**
 * Summarize one completed wave's recording for its player-side hero only.
 * Missing hero or terminal event means unavailable, rather than zero damage.
 * Paid prevention is excluded; pooled periodic carry/provenance is never split
 * into inferred typed HP shares. Amounts are not clamped to current hero life.
 */
export function summarizeHeroDamage(events: readonly BattleEvent[], team: readonly CombatUnit[]): HeroDamageSummary | null {
  const hero = team.find(unit => unit.side === 'player' && inferKind(unit) === 'hero');
  if (!hero || events.at(-1)?.kind !== 'end') return null;
  const amounts = new Map<DamageBucket, number>();
  for (const event of events) {
    if ((event.kind !== 'damage' && event.kind !== 'dot') || event.target !== hero.id ||
      !Number.isFinite(event.amount) || event.amount <= 0 || event.kind === 'damage' && event.dodged) continue;
    const type: DamageBucket = event.kind === 'dot' ? 'dot'
      : DAMAGE_BUCKETS.find(bucket => bucket !== 'dot' && bucket !== 'other' && bucket === event.damageType) ?? 'other';
    amounts.set(type, (amounts.get(type) ?? 0) + event.amount);
  }
  const byType = DAMAGE_BUCKETS.flatMap(type => {
    const amount = amounts.get(type);
    return amount === undefined ? [] : [{ type, amount }];
  });
  return { byType, total: byType.reduce((sum, row) => sum + row.amount, 0) };
}
