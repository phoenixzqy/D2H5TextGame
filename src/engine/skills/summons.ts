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
import type { SummonStatScaling } from './effects';
import { scaleSummonStats } from './scaling';

/** Stable per-owner counter for summon ids. */
const counters = new Map<string, number>();

/** Reset the per-owner counter (used by tests). */
export function resetSummonCounters(): void {
  counters.clear();
}

export interface BuildSummonOptions {
  readonly skillLevel?: number;
  readonly statScaling?: SummonStatScaling | undefined;
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
  summonId: string,
  options: BuildSummonOptions = {}
): CombatUnit | undefined {
  const factory = FACTORIES.get(summonId);
  if (!factory) return undefined;
  const unit = factory(owner);
  const stats = scaleSummonStats(unit.stats, options.statScaling, options.skillLevel ?? 1);
  // Ensure owner-derived fields are correct regardless of factory return.
  return {
    ...unit,
    stats,
    life: stats.lifeMax,
    mana: stats.manaMax,
    side: owner.side,
    summonOwnerId: owner.id,
    summonTemplateId: summonId,
    summon: true,
    kind: 'summon'
  };
}

/** Resolve a summon template's stats without allocating a runtime summon id. */
export function getSummonStats(
  summonId: string,
  options: BuildSummonOptions = {}
): DerivedStats | undefined {
  const base = baseStatsForSummon(summonId);
  return base ? scaleSummonStats(base, options.statScaling, options.skillLevel ?? 1) : undefined;
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

function baseStatsForSummon(summonId: string): DerivedStats | undefined {
  switch (summonId) {
    case 'skeleton':
      return skeletonStats();
    case 'clay_golem':
      return {
        ...baseSummonStats(),
        life: 220,
        lifeMax: 220,
        attack: 24,
        defense: 34,
        attackSpeed: 55,
        physDodge: 0.02,
        magicDodge: 0.02,
        resistances: { ...ZERO_RES, physical: 10 }
      };
    case 'blood_golem':
      return {
        ...baseSummonStats(),
        life: 180,
        lifeMax: 180,
        attack: 34,
        defense: 24,
        attackSpeed: 70,
        resistances: { ...ZERO_RES, poison: 20 }
      };
    case 'iron_golem':
      return {
        ...baseSummonStats(),
        life: 260,
        lifeMax: 260,
        attack: 36,
        defense: 48,
        attackSpeed: 60,
        resistances: { ...ZERO_RES, physical: 20, lightning: 20 }
      };
    case 'fire_golem':
      return {
        ...baseSummonStats(),
        life: 240,
        lifeMax: 240,
        attack: 42,
        defense: 36,
        attackSpeed: 65,
        resistances: { ...ZERO_RES, fire: 50 }
      };
    case 'skeletal_mage':
      return {
        ...baseSummonStats(),
        life: 88,
        lifeMax: 88,
        attack: 30,
        defense: 10,
        magicDodge: 0.08,
        resistances: { ...ZERO_RES, fire: 10, cold: 10, lightning: 10, poison: 10 }
      };
    case 'revived':
      return {
        ...baseSummonStats(),
        life: 150,
        lifeMax: 150,
        attack: 28,
        defense: 18,
        attackSpeed: 65
      };
    case 'valkyrie':
      return { ...baseSummonStats(), life: 200, lifeMax: 200, attack: 40, defense: 20 };
    case 'raven':
      return { ...baseSummonStats(), life: 45, lifeMax: 45, attack: 18, attackSpeed: 95, physDodge: 0.15 };
    case 'spirit_wolf':
      return { ...baseSummonStats(), life: 80, lifeMax: 80, attack: 20, attackSpeed: 85, physDodge: 0.1 };
    case 'dire_wolf':
      return { ...baseSummonStats(), life: 100, lifeMax: 100, attack: 25, attackSpeed: 90 };
    case 'grizzly':
      return { ...baseSummonStats(), life: 260, lifeMax: 260, attack: 45, defense: 35, attackSpeed: 55 };
    case 'poison_creeper':
      return { ...baseSummonStats(), life: 90, lifeMax: 90, attack: 16, defense: 18, resistances: { ...ZERO_RES, poison: 35 } };
    case 'carrion_vine':
      return { ...baseSummonStats(), life: 110, lifeMax: 110, attack: 12, defense: 22, resistances: { ...ZERO_RES, poison: 25 } };
    case 'solar_creeper':
      return { ...baseSummonStats(), life: 120, lifeMax: 120, attack: 12, defense: 24, magicDodge: 0.08, resistances: { ...ZERO_RES, fire: 20, lightning: 20 } };
    case 'shadow_warrior':
      return { ...baseSummonStats(), life: 150, lifeMax: 150, attack: 32, defense: 24, attackSpeed: 80, physDodge: 0.1, magicDodge: 0.1 };
    case 'shadow_master':
      return { ...baseSummonStats(), life: 210, lifeMax: 210, attack: 40, defense: 32, attackSpeed: 85, physDodge: 0.12, magicDodge: 0.12, resistances: { ...ZERO_RES, fire: 10, cold: 10, lightning: 10, poison: 10, arcane: 10 } };
    case 'minion':
      return { ...baseSummonStats(), life: 40, lifeMax: 40, attack: 10 };
    default:
      return undefined;
  }
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

function summonUnitFromTemplate(
  owner: CombatUnit,
  summonId: string,
  name: string,
  skillOrder: readonly string[] = []
): CombatUnit {
  const stats = baseStatsForSummon(summonId);
  if (!stats) {
    throw new Error(`No summon template registered for ${summonId}`);
  }
  return summonUnit(owner, summonId, name, stats, skillOrder);
}

registerSummon('skeleton', (owner) => summonUnitFromTemplate(owner, 'skeleton', 'Skeleton Warrior'));
registerSummon('clay_golem', (owner) => summonUnitFromTemplate(owner, 'clay_golem', 'Clay Golem'));
registerSummon('blood_golem', (owner) => summonUnitFromTemplate(owner, 'blood_golem', 'Blood Golem'));
registerSummon('iron_golem', (owner) => summonUnitFromTemplate(owner, 'iron_golem', 'Iron Golem'));
registerSummon('fire_golem', (owner) => summonUnitFromTemplate(owner, 'fire_golem', 'Fire Golem'));
registerSummon('skeletal_mage', (owner) => summonUnitFromTemplate(owner, 'skeletal_mage', 'Skeletal Mage'));
registerSummon('revived', (owner) => summonUnitFromTemplate(owner, 'revived', 'Revived Minion'));
registerSummon('valkyrie', (owner) => summonUnitFromTemplate(owner, 'valkyrie', 'Valkyrie'));
registerSummon('raven', (owner) => summonUnitFromTemplate(owner, 'raven', 'Raven'));
registerSummon('spirit_wolf', (owner) => summonUnitFromTemplate(owner, 'spirit_wolf', 'Spirit Wolf'));
registerSummon('dire_wolf', (owner) => summonUnitFromTemplate(owner, 'dire_wolf', 'Dire Wolf'));
registerSummon('grizzly', (owner) => summonUnitFromTemplate(owner, 'grizzly', 'Grizzly'));
registerSummon('poison_creeper', (owner) => summonUnitFromTemplate(owner, 'poison_creeper', 'Poison Creeper'));
registerSummon('carrion_vine', (owner) => summonUnitFromTemplate(owner, 'carrion_vine', 'Carrion Vine'));
registerSummon('solar_creeper', (owner) => summonUnitFromTemplate(owner, 'solar_creeper', 'Solar Creeper'));
registerSummon('shadow_warrior', (owner) => summonUnitFromTemplate(owner, 'shadow_warrior', 'Shadow Warrior'));
registerSummon('shadow_master', (owner) => summonUnitFromTemplate(owner, 'shadow_master', 'Shadow Master'));

registerSummon('minion', (owner) => summonUnitFromTemplate(owner, 'minion', 'Minion'));
