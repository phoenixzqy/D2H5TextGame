import skills from '../../data/skills/sorceress.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { integrateManaRecoveryWithContributionBetween } from '../combat/mana-recovery';
import { createSkillValidator } from './skill-validator';

export const ENERGY_SHIELD_IDS = ['skills-sorceress-energy-shield', 'sorceress.energy_shield'] as const;
interface AllocationRequirement {
  readonly ids: readonly string[];
  readonly requiredLevel: number;
  readonly maxRank: number;
}
/** Copied authored tuning and the complete learned prerequisite chain. */
export interface EnergyShieldDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly absorbPerRank: number;
  readonly manaRegenPerRank: number;
  readonly prerequisites: readonly AllocationRequirement[];
}
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number; readonly prerequisites?: readonly string[] }>();

/** Reject contradictory data and copy all authority independently of the mutable catalog. */
export function resolveEnergyShieldDefinition(rows: readonly unknown[]): EnergyShieldDefinition {
  const read = (id: string) => {
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    const row = matches[0];
    if (matches.length !== 1 || !validate(row) || !Number.isInteger(row.requiredLevel) || row.requiredLevel < 1) throw new Error('Invalid authored Energy Shield dependency: ' + id);
    return row;
  };
  const row = read(ENERGY_SHIELD_IDS[0]);
  const absorbPerRank = row.scaling?.passiveStatsPerLevel?.shieldAbsorbPct;
  const manaRegenPerRank = row.scaling?.passiveStatsPerLevel?.manaRegenPct;
  if (absorbPerRank === undefined || manaRegenPerRank === undefined || absorbPerRank * row.maxLevel > 1) {
    throw new Error('Invalid Energy Shield tuning');
  }
  const prerequisites: AllocationRequirement[] = [];
  const visited = new Set<string>();
  const visit = (id: string, ancestors: readonly string[]) => {
    if (ancestors.includes(id) || !id.startsWith('skills-sorceress-')) throw new Error('Invalid Energy Shield prerequisite chain');
    if (visited.has(id)) return;
    const dependency = read(id);
    visited.add(id);
    prerequisites.push(Object.freeze({ ids: Object.freeze([id,
      'sorceress.' + id.slice('skills-sorceress-'.length).replaceAll('-', '_')]),
      requiredLevel: dependency.requiredLevel, maxRank: dependency.maxLevel }));
    for (const parent of dependency.prerequisites ?? []) visit(parent, [...ancestors, id]);
  };
  for (const id of row.prerequisites ?? []) visit(id, [row.id]);
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    absorbPerRank, manaRegenPerRank, prerequisites: Object.freeze(prerequisites) });
}
export const ENERGY_SHIELD_DEFINITION = resolveEnergyShieldDefinition(skills);

function allocatedRank(ids: readonly string[], maxRank: number, levels?: Readonly<Record<string, number>>): number {
  let rank = 0;
  for (const id of ids) {
    const value = levels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) rank = Math.max(rank, Math.min(maxRank, value));
  }
  return rank;
}

/** Exact positive integral allocated aliases, MAX once, for current/next UI values. */
export function resolveEnergyShieldRank(levels?: Readonly<Record<string, number>>): number {
  return allocatedRank(ENERGY_SHIELD_IDS, ENERGY_SHIELD_DEFINITION.maxRank, levels);
}

/** Native automatic personal power; persisted allocations alone cannot bypass class or prerequisites. */
export function composeEnergyShield(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): {
  readonly rank: number; readonly manaRegenBonus: number;
} {
  const d = ENERGY_SHIELD_DEFINITION;
  const eligible = player.class === 'sorceress' && Number.isInteger(player.level) && player.level >= d.requiredLevel &&
    d.prerequisites.every(p => player.level >= p.requiredLevel && allocatedRank(p.ids, p.maxRank, player.skillLevels) > 0);
  const rank = eligible ? resolveEnergyShieldRank(player.skillLevels) : 0;
  return { rank, manaRegenBonus: rank * d.manaRegenPerRank };
}

/** Only an explicit living player hero may spend this native wave-local projection. */
export function energyShieldRank(unit: CombatUnit): number {
  const rank = unit.energyShieldRank;
  return unit.side === 'player' && unit.kind === 'hero' && !(unit.summon ?? false) &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= ENERGY_SHIELD_DEFINITION.requiredLevel && typeof rank === 'number' &&
    Number.isInteger(rank) && rank > 0 && rank <= ENERGY_SHIELD_DEFINITION.maxRank ? rank : 0;
}

/** Available whole MP only; fractional recovery carry remains owned by the recovery integrator. */
export function availableEnergyShieldMana(unit: CombatUnit): number {
  return energyShieldRank(unit) > 0 && Number.isFinite(unit.mana) && Number.isFinite(unit.stats.manaMax)
    ? Math.floor(Math.max(0, Math.min(unit.mana, unit.stats.manaMax))) : 0;
}

/** Exact decimal damage × authored fraction × rank, using the shared decimal integrator for one second. */
function quota(damage: number, rank: number): number {
  return integrateManaRecoveryWithContributionBetween(0,
    { sourceBaselinePerSecond: damage, factors: [ENERGY_SHIELD_DEFINITION.absorbPerRank, rank] }, 0, 1000).wholeGranted;
}

/** Divert already-mitigated damage. Periodic callers supply cumulative prior damage to preserve partitioning. */
export function divertEnergyShield(unit: CombatUnit, damage: number, previousPeriodicDamage = 0): {
  readonly unit: CombatUnit; readonly damage: number; readonly manaSpent: number;
} {
  const available = availableEnergyShieldMana(unit);
  if (available === 0 || !Number.isFinite(damage) || damage <= 0 ||
    !Number.isFinite(previousPeriodicDamage) || previousPeriodicDamage < 0) return { unit, damage, manaSpent: 0 };
  const rank = energyShieldRank(unit);
  const wanted = quota(previousPeriodicDamage + damage, rank) - quota(previousPeriodicDamage, rank);
  const manaSpent = Math.min(damage, available, wanted);
  return manaSpent > 0 ? { unit: { ...unit, mana: unit.mana - manaSpent }, damage: damage - manaSpent, manaSpent }
    : { unit, damage, manaSpent: 0 };
}
