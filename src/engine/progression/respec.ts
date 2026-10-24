import { RESPEC_POLICY } from '@/data/loaders/respec';
import { loadClassStartingStats } from '@/data/loaders/classes';
import { canonicalSkillIdFromData, PLAYABLE_CLASS_SKILL_DATA } from '../skills/dataCatalog';
import type { Player } from '../types/entities';

export type RespecKind = 'stat' | 'skill';
export interface RespecsRemaining { readonly stat: number; readonly skill: number }
export type RespecPlan = { readonly kind: 'ok'; readonly player: Player & { readonly respecsRemaining: RespecsRemaining };
  readonly cost: number; readonly refund: number } | { readonly kind: 'no-allocations' | 'invalid-player' | 'insufficient-wishstones' };

/** Strict independent allowance reader; defaults only a truly absent trusted legacy field. */
export function readRespecsRemaining(player: object, allowMissing = false): RespecsRemaining {
  const descriptor = Object.getOwnPropertyDescriptor(player, 'respecsRemaining');
  if (!descriptor && !('respecsRemaining' in player) && allowMissing) {
    return { stat: RESPEC_POLICY.freeUses, skill: RESPEC_POLICY.freeUses };
  }
  if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new Error('Invalid save: respec counters');
  const value: unknown = descriptor.value;
  if (!value || typeof value !== 'object' || Reflect.ownKeys(value).length !== 2) throw new Error('Invalid save: respec counters');
  const counts = { stat: 0, skill: 0 };
  for (const key of ['stat', 'skill'] as const) {
    const field = Object.getOwnPropertyDescriptor(value, key);
    if (!field || !field.enumerable || !Object.hasOwn(field, 'value')) throw new Error('Invalid save: respec counter');
    const count: unknown = field.value;
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || count > RESPEC_POLICY.freeUses) {
      throw new Error('Invalid save: respec counter');
    }
    counts[key] = count;
  }
  return Object.freeze({ stat: counts.stat, skill: counts.skill });
}

/** Pure refund of actual investment; no currency debit, inferred grants, healing or RNG. */
export function planRespec(player: Player, kind: unknown, wishstones: number): RespecPlan {
  if (kind !== 'stat' && kind !== 'skill') return { kind: 'invalid-player' };
  let counters: RespecsRemaining;
  try { counters = readRespecsRemaining(player, true); } catch { return { kind: 'invalid-player' }; }
  if (!Number.isSafeInteger(wishstones) || wishstones < 0) return { kind: 'invalid-player' };
  let refund = 0;
  let next = player;
  if (kind === 'skill') {
    if (!Object.hasOwn(PLAYABLE_CLASS_SKILL_DATA, player.class)) return { kind: 'invalid-player' };
    const catalog = PLAYABLE_CLASS_SKILL_DATA[player.class as keyof typeof PLAYABLE_CLASS_SKILL_DATA];
    const ranks = new Map<string, number>();
    for (const [id, rank] of Object.entries(player.skillLevels ?? {})) {
      const canonical = canonicalSkillIdFromData(id), definition = catalog.find(row => canonicalSkillIdFromData(row.id) === canonical);
      if (!definition || !Number.isSafeInteger(rank) || rank < 0 || rank > definition.maxLevel) return { kind: 'invalid-player' };
      ranks.set(canonical, Math.max(ranks.get(canonical) ?? 0, rank));
    }
    refund = [...ranks.values()].reduce((sum, rank) => sum + rank, 0);
    const { selectedAuraId: _aura, ...withoutAura } = player;
    next = { ...withoutAura, skillLevels: {}, skills: [], comboOrder: [], skillPoints: player.skillPoints + refund };
  } else {
    try {
      const baseline = loadClassStartingStats(player.class);
      for (const key of ['strength', 'dexterity', 'vitality', 'energy'] as const) {
        const points = player.coreStats[key] - baseline[key];
        if (!Number.isSafeInteger(points) || points < 0) return { kind: 'invalid-player' };
        refund += points;
      }
      next = { ...player, coreStats: baseline, statPoints: player.statPoints + refund };
    } catch { return { kind: 'invalid-player' }; }
  }
  if (!Number.isSafeInteger(refund) || !Number.isSafeInteger(next.statPoints) || !Number.isSafeInteger(next.skillPoints)
    || next.statPoints < 0 || next.skillPoints < 0) return { kind: 'invalid-player' };
  if (refund === 0) return { kind: 'no-allocations' };
  const cost = counters[kind] > 0 ? 0 : RESPEC_POLICY.paidCost;
  if (wishstones < cost) return { kind: 'insufficient-wishstones' };
  return { kind: 'ok', refund, cost, player: { ...next,
    respecsRemaining: { ...counters, [kind]: Math.max(0, counters[kind] - 1) } } };
}
