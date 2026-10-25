import skills from '../../data/skills/paladin.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { integrateManaRecoveryWithContributionBetween } from '../combat/mana-recovery';
import { projectPlayerClassActives } from './player-class-actives';
import { createSkillValidator } from './skill-validator';

export const HOLY_SHIELD_IDS = ['skills-paladin-holy-shield', 'paladin.holy_shield'] as const;
const markerIds: readonly string[] = [...HOLY_SHIELD_IDS, 'holy-shield'];
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Independently copied authored paid defense, without persistent stat modifications. */
export function resolveHolyShieldDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === HOLY_SHIELD_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Holy Shield');
  const absorbPerRank = row.scaling?.passiveStatsPerLevel?.shieldAbsorbPct;
  const defensePerRank = row.scaling?.passiveStatsPerLevel?.defensePct;
  if (absorbPerRank === undefined || defensePerRank === undefined || row.cost.mana === undefined ||
    absorbPerRank * row.maxLevel >= 1) throw new Error('Invalid Holy Shield tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    absorbPerRank, defensePerRank, manaCost: row.cost.mana, cooldown: row.cooldown,
    costPerRank: row.scaling?.costPerLevel ?? 0,
    cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0 });
}
export const HOLY_SHIELD_DEFINITION = resolveHolyShieldDefinition(skills);

/** Reuse ordinary native class-active ownership, including every transitive prerequisite. */
export function composeHolyShieldRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [HOLY_SHIELD_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[HOLY_SHIELD_IDS[1]] ?? 0 : 0;
}

/** Explicit living original hero authority; a combo entry alone never establishes rank. */
export function holyShieldRank(unit: CombatUnit): number {
  const rank = unit.holyShieldRank, d = HOLY_SHIELD_DEFINITION;
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) && unit.level >= d.requiredLevel &&
    typeof rank === 'number' && Number.isInteger(rank) && rank > 0 && rank <= d.maxRank ? rank : 0;
}

/** Exact reviewed paid effect; contradictory registry overrides are refused before payment. */
export function matchesHolyShield(skill: RegisteredSkill): boolean {
  const d = HOLY_SHIELD_DEFINITION, effect = skill.effects[0];
  return skill.id === HOLY_SHIELD_IDS[1] && skill.archetype === 'paladin' && skill.trigger === 'active' &&
    skill.target === 'self' && skill.isBuff === true && skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel && skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'buff' && effect.id === 'holy-shield' &&
    effect.duration === -1 && effect.holyShield === true &&
    Object.keys(effect).every(key => ['kind', 'id', 'duration', 'holyShield'].includes(key));
}

function validPaid(value: CombatUnit['holyShield'] | null, unit: CombatUnit): value is NonNullable<CombatUnit['holyShield']> {
  return value !== undefined && value !== null && !Array.isArray(value) && Object.keys(value).length === 2 &&
    Object.hasOwn(value, 'sourceHeroId') && Object.hasOwn(value, 'rank') && value.sourceHeroId === unit.id &&
    Number.isInteger(value.rank) && value.rank > 0 && value.rank <= HOLY_SHIELD_DEFINITION.maxRank;
}

/** Only a real source-bound paid payload activates defense; markers are presentation only. */
export function activeHolyShield(unit: CombatUnit): number {
  return holyShieldRank(unit) > 0 && validPaid(unit.holyShield, unit) &&
    unit.holyShield.rank === unit.holyShieldRank && unit.activeBuffIds.includes('holy-shield')
    ? unit.holyShield.rank : 0;
}

/** Capture immutable potency only after the caller commits its ordinary paid cast. */
export function payHolyShield(unit: CombatUnit): CombatUnit {
  const rank = holyShieldRank(unit);
  if (rank === 0) throw new Error('Cannot pay an ineligible Holy Shield');
  return { ...unit, holyShield: Object.freeze({ sourceHeroId: unit.id, rank }),
    activeBuffIds: [...unit.activeBuffIds.filter(id => !markerIds.includes(id)), 'holy-shield'] };
}

/** Copy paid carry and refresh only at a native wave boundary, preserving absolute resources. */
export function refreshHolyShieldState(unit: CombatUnit): CombatUnit {
  const rank = holyShieldRank(unit);
  if (rank > 0 && validPaid(unit.holyShield, unit) && unit.activeBuffIds.includes('holy-shield')) {
    return payHolyShield(unit);
  }
  if (unit.holyShield === undefined && !unit.activeBuffIds.some(id => markerIds.includes(id))) return unit;
  const { holyShield, ...unpaid } = unit;
  void holyShield;
  return { ...unpaid, activeBuffIds: unit.activeBuffIds.filter(id => !markerIds.includes(id)) };
}

/** Fractional ordinary Defense bonus; the damage pipeline applies this over fresh base stats. */
export function holyShieldDefense(unit: CombatUnit): number {
  return activeHolyShield(unit) * HOLY_SHIELD_DEFINITION.defensePerRank;
}

/** Exact decimal cumulative quota; periodic callers subtract the value at their preceding boundary. */
export function holyShieldQuota(unit: CombatUnit, damage: number): number {
  const rank = activeHolyShield(unit);
  return rank > 0 && Number.isFinite(damage) && damage > 0
    ? integrateManaRecoveryWithContributionBetween(0,
      { sourceBaselinePerSecond: damage, factors: [HOLY_SHIELD_DEFINITION.absorbPerRank, rank] }, 0, 1000).wholeGranted : 0;
}

/** Share the same reduction for direct/periodic settlement and lethal-time prediction. */
export function absorbHolyShield(unit: CombatUnit, damage: number, previousDamage = 0) {
  if (!Number.isFinite(damage) || damage <= 0 || !Number.isFinite(previousDamage) || previousDamage < 0)
    return { damage, absorbed: 0 };
  const absorbed = holyShieldQuota(unit, previousDamage + damage) - holyShieldQuota(unit, previousDamage);
  return { damage: damage - absorbed, absorbed };
}

/** A sufficient execution packet even when a trusted snapshot also carries other personal shields. */
export function holyShieldLethalBound(unit: CombatUnit, unshielded: number): number {
  return Math.ceil(unshielded / (1 - activeHolyShield(unit) * HOLY_SHIELD_DEFINITION.absorbPerRank));
}
