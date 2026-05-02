/**
 * Summon templates.
 *
 * Maps a `summonId` (referenced by {@link import('./effects').SummonEffect})
 * onto a factory that produces a fresh {@link CombatUnit} for the spawned
 * minion. The factory receives the *owner* unit so it can inherit level/side.
 *
 * Engine-side defaults; production tuning may be loaded from JSON later.
 *
 * @module engine/skills/summons
 */

import type { CombatUnit } from '../combat/types';
import type { DerivedStats } from '../types/attributes';

/** Stable per-owner counter for summon ids. */
const counters = new Map<string, number>();

/** Reset the per-owner counter (used by tests). */
export function resetSummonCounters(): void {
  counters.clear();
}

/** Factory: build a fresh summon for `owner`. */
export type SummonFactory = (owner: CombatUnit) => CombatUnit;

const FACTORIES = new Map<string, SummonFactory>();

/** Register or replace a summon template. */
export function registerSummon(id: string, factory: SummonFactory): void {
  FACTORIES.set(id, factory);
}

/** Look up a summon factory by id. */
export function getSummon(id: string): SummonFactory | undefined {
  return FACTORIES.get(id);
}

function nextSummonId(ownerId: string, summonId: string): string {
  const key = `${ownerId}:${summonId}`;
  const n = (counters.get(key) ?? 0) + 1;
  counters.set(key, n);
  return `${ownerId}-summon-${summonId}-${String(n)}`;
}

/**
 * Build a {@link CombatUnit} for a registered summon template.
 *
 * Returns `undefined` if no template is registered for `summonId`.
 */
export function buildSummon(
  owner: CombatUnit,
  summonId: string
): CombatUnit | undefined {
  const factory = FACTORIES.get(summonId);
  if (!factory) return undefined;
  const unit = factory(owner);
  // Ensure owner-derived fields are correct regardless of factory return.
  return {
    ...unit,
    side: owner.side,
    summonOwnerId: owner.id,
    summonTemplateId: summonId,
    summon: true,
    kind: 'summon'
  };
}

// ---------------------------------------------------------------------------
// Default templates
// ---------------------------------------------------------------------------

const ZERO_RES = {
  fire: 0,
  cold: 0,
  lightning: 0,
  poison: 0,
  arcane: 0,
  physical: 0
};

function baseSummonStats(): DerivedStats {
  return {
    life: 80,
    lifeMax: 80,
    mana: 0,
    manaMax: 0,
    attack: 20,
    defense: 10,
    attackSpeed: 70,
    critChance: 0.05,
    critDamage: 1.5,
    physDodge: 0.05,
    magicDodge: 0.05,
    magicFind: 0,
    goldFind: 0,
    resistances: { ...ZERO_RES }
  };
}

function skeletonStats(): DerivedStats {
  return {
    ...baseSummonStats(),
    life: 112,
    lifeMax: 112,
    attack: 25,
    defense: 14
  };
}

function summonUnit(
  owner: CombatUnit,
  summonId: string,
  name: string,
  stats: DerivedStats,
  skillOrder: readonly string[] = []
): CombatUnit {
  return {
    id: nextSummonId(owner.id, summonId),
    name,
    side: owner.side,
    level: owner.level,
    tier: 'trash',
    stats,
    life: stats.lifeMax,
    mana: stats.manaMax,
    statuses: [],
    cooldowns: {},
    skillOrder,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    summon: true,
    kind: 'summon',
    summonOwnerId: owner.id,
    summonTemplateId: summonId
  };
}

registerSummon('skeleton', (owner) => ({
  id: nextSummonId(owner.id, 'skeleton'),
  name: 'Skeleton Warrior',
  side: owner.side,
  level: owner.level,
  tier: 'trash',
  stats: skeletonStats(),
  life: 112,
  mana: 0,
  statuses: [],
  cooldowns: {},
  skillOrder: [],
  activeBuffIds: [],
  enraged: false,
  summonedAdds: false,
  summon: true,
  kind: 'summon',
  summonOwnerId: owner.id
}));

registerSummon('clay_golem', (owner) =>
  summonUnit(owner, 'clay_golem', 'Clay Golem', {
    ...baseSummonStats(),
    life: 220,
    lifeMax: 220,
    attack: 24,
    defense: 34,
    attackSpeed: 55,
    physDodge: 0.02,
    magicDodge: 0.02,
    resistances: { ...ZERO_RES, physical: 10 }
  })
);

registerSummon('blood_golem', (owner) =>
  summonUnit(owner, 'blood_golem', 'Blood Golem', {
    ...baseSummonStats(),
    life: 180,
    lifeMax: 180,
    attack: 34,
    defense: 24,
    attackSpeed: 70,
    resistances: { ...ZERO_RES, poison: 20 }
  })
);

registerSummon('iron_golem', (owner) =>
  summonUnit(owner, 'iron_golem', 'Iron Golem', {
    ...baseSummonStats(),
    life: 260,
    lifeMax: 260,
    attack: 36,
    defense: 48,
    attackSpeed: 60,
    resistances: { ...ZERO_RES, physical: 20, lightning: 20 }
  })
);

registerSummon('fire_golem', (owner) =>
  summonUnit(owner, 'fire_golem', 'Fire Golem', {
    ...baseSummonStats(),
    life: 240,
    lifeMax: 240,
    attack: 42,
    defense: 36,
    attackSpeed: 65,
    resistances: { ...ZERO_RES, fire: 50 }
  })
);

// Placeholder templates for skills that already reference these ids — they
// keep the engine from silently dropping the summon when those skills fire.
registerSummon('valkyrie', (owner) => ({
  id: nextSummonId(owner.id, 'valkyrie'),
  name: 'Valkyrie',
  side: owner.side,
  level: owner.level,
  tier: 'trash',
  stats: { ...baseSummonStats(), life: 200, lifeMax: 200, attack: 40, defense: 20 },
  life: 200,
  mana: 0,
  statuses: [],
  cooldowns: {},
  skillOrder: [],
  activeBuffIds: [],
  enraged: false,
  summonedAdds: false,
  summon: true,
  kind: 'summon',
  summonOwnerId: owner.id
}));

registerSummon('dire_wolf', (owner) => ({
  id: nextSummonId(owner.id, 'dire_wolf'),
  name: 'Dire Wolf',
  side: owner.side,
  level: owner.level,
  tier: 'trash',
  stats: { ...baseSummonStats(), life: 100, lifeMax: 100, attack: 25, attackSpeed: 90 },
  life: 100,
  mana: 0,
  statuses: [],
  cooldowns: {},
  skillOrder: [],
  activeBuffIds: [],
  enraged: false,
  summonedAdds: false,
  summon: true,
  kind: 'summon',
  summonOwnerId: owner.id
}));

registerSummon('minion', (owner) => ({
  id: nextSummonId(owner.id, 'minion'),
  name: 'Minion',
  side: owner.side,
  level: owner.level,
  tier: 'trash',
  stats: { ...baseSummonStats(), life: 40, lifeMax: 40, attack: 10 },
  life: 40,
  mana: 0,
  statuses: [],
  cooldowns: {},
  skillOrder: [],
  activeBuffIds: [],
  enraged: false,
  summonedAdds: false,
  summon: true,
  kind: 'summon',
  summonOwnerId: owner.id
}));
