/**
 * Summon templates.
 *
 * Maps a `summonId` (referenced by {@link import('./effects').SummonEffect})
 * onto a factory that produces a fresh {@link CombatUnit} for the spawned
 * minion. The factory receives the *owner* unit so it can inherit level/side.
 *
 * Native Druid/Necromancer body tuning is loaded from validated JSON.
 *
 * @module engine/skills/summons
 */

import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { CombatUnit } from '../combat/types';
import type { DerivedStats } from '../types/attributes';
import type { SummonStatScaling } from './effects';
import { scaleSummonStats } from './scaling';
import { buildMonsterUnit } from '../combat/monster-factory';
import type { MonsterDef } from '../types/monsters';
import type { Rng } from '../rng';
import { SPIRIT_OF_BARBS_DEFINITION } from './spirit-of-barbs';
import { getDruidSummonStats } from './druid-summon-definition';
import { fireGolemBodyStats } from './fire-golem';
import { bloodGolemBodyStats } from './blood-golem';
import { getNecromancerSummonStats } from './necromancer-summon-definition';
import { getAmazonSummonStats } from './amazon-summon-definition';
import { getAssassinSummonStats } from './assassin-summon-definition';

/** @deprecated Templates are pure; battles now own their summon identity. */
export function resetSummonCounters(): void {
  // Compatibility only: there is no process-wide identity state to reset.
}

export interface BuildSummonOptions {
  readonly skillLevel?: number;
  readonly statScaling?: SummonStatScaling | undefined;
  readonly monsterDef?: MonsterDef | undefined;
  readonly rng?: Rng | undefined;
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

/**
 * Build a {@link CombatUnit} for a registered summon template.
 *
 * Returns `undefined` if no template is registered for `summonId`.
 * The template ID is provisional. Callers own unique runtime registration IDs.
 */
export function buildSummon(
  owner: CombatUnit,
  summonId: string,
  options: BuildSummonOptions = {}
): CombatUnit | undefined {
  const factory = FACTORIES.get(summonId);
  const unit = options.monsterDef
    ? options.rng ? buildMonsterUnit({ def: options.monsterDef, level: owner.level, tier: 'trash', rng: options.rng }) : undefined
    : factory?.(owner);
  if (!unit) return undefined;
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
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
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

function baseStatsForSummon(summonId: string): DerivedStats | undefined {
  const amazon = getAmazonSummonStats(summonId);
  if (amazon) return amazon;
  const assassin = getAssassinSummonStats(summonId);
  if (assassin) return assassin;
  const druid = getDruidSummonStats(summonId);
  if (druid) return druid;
  const necromancer = getNecromancerSummonStats(summonId);
  if (necromancer) return necromancer;
  switch (summonId) {
    case 'blood_golem':
      return bloodGolemBodyStats();
    case 'fire_golem':
      return fireGolemBodyStats();
    case 'spirit_of_barbs': {
      const { life, attack, defense } = SPIRIT_OF_BARBS_DEFINITION.stats;
      return { ...baseSummonStats(), life, lifeMax: life, attack, defense };
    }
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
    id: `${owner.id}-summon-${summonId}`,
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
registerSummon('spirit_of_barbs', (owner) => summonUnitFromTemplate(owner, 'spirit_of_barbs', 'Spirit of Barbs'));
registerSummon('spirit_wolf', (owner) => summonUnitFromTemplate(owner, 'spirit_wolf', 'Spirit Wolf'));
registerSummon('dire_wolf', (owner) => summonUnitFromTemplate(owner, 'dire_wolf', 'Dire Wolf'));
registerSummon('grizzly', (owner) => summonUnitFromTemplate(owner, 'grizzly', 'Grizzly'));
registerSummon('poison_creeper', (owner) => summonUnitFromTemplate(owner, 'poison_creeper', 'Poison Creeper'));
registerSummon('carrion_vine', (owner) => summonUnitFromTemplate(owner, 'carrion_vine', 'Carrion Vine'));
registerSummon('solar_creeper', (owner) => summonUnitFromTemplate(owner, 'solar_creeper', 'Solar Creeper'));
registerSummon('shadow_warrior', (owner) => summonUnitFromTemplate(owner, 'shadow_warrior', 'Shadow Warrior'));
registerSummon('shadow_master', (owner) => summonUnitFromTemplate(owner, 'shadow_master', 'Shadow Master'));

registerSummon('minion', (owner) => summonUnitFromTemplate(owner, 'minion', 'Minion'));
