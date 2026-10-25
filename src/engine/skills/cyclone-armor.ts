import skills from '../../data/skills/druid.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { integrateManaRecoveryWithContributionBetween } from '../combat/mana-recovery';
import { projectPlayerClassActives } from './player-class-actives';
import { createSkillValidator } from './skill-validator';

export const CYCLONE_ARMOR_IDS = ['skills-druid-cyclone-armor', 'druid.cyclone_armor'] as const;
const markerIds: readonly string[] = [...CYCLONE_ARMOR_IDS, 'cyclone-armor'];
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Independently copied authored paid defense, without persistent stat modifications. */
export function resolveCycloneArmorDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === CYCLONE_ARMOR_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Cyclone Armor');
  const absorbPerRank = row.scaling?.passiveStatsPerLevel?.shieldAbsorbPct;
  const resistPerRank = row.scaling?.passiveStatsPerLevel?.resistAllPct;
  if (absorbPerRank === undefined || resistPerRank === undefined || row.cost.mana === undefined ||
    absorbPerRank * row.maxLevel >= 1) throw new Error('Invalid Cyclone Armor tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    absorbPerRank, resistPerRank, manaCost: row.cost.mana, cooldown: row.cooldown,
    costPerRank: row.scaling?.costPerLevel ?? 0,
    cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0 });
}
export const CYCLONE_ARMOR_DEFINITION = resolveCycloneArmorDefinition(skills);

/** Reuse ordinary native class-active ownership, including every transitive prerequisite. */
export function composeCycloneArmorRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [CYCLONE_ARMOR_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[CYCLONE_ARMOR_IDS[1]] ?? 0 : 0;
}

/** Explicit living original hero authority; a combo entry alone never establishes rank. */
export function cycloneArmorRank(unit: CombatUnit): number {
  const rank = unit.cycloneArmorRank, d = CYCLONE_ARMOR_DEFINITION;
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) && unit.level >= d.requiredLevel &&
    typeof rank === 'number' && Number.isInteger(rank) && rank > 0 && rank <= d.maxRank ? rank : 0;
}

/** Exact reviewed paid effect; contradictory registry overrides are refused before payment. */
export function matchesCycloneArmor(skill: RegisteredSkill): boolean {
  const d = CYCLONE_ARMOR_DEFINITION, effect = skill.effects[0];
  return skill.id === CYCLONE_ARMOR_IDS[1] && skill.archetype === 'druid' && skill.trigger === 'active' &&
    skill.target === 'self' && skill.isBuff === true && skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel && skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'buff' && effect.id === 'cyclone-armor' &&
    effect.duration === -1 && effect.cycloneArmor === true;
}

function validPaid(value: CombatUnit['cycloneArmor'] | null, unit: CombatUnit): value is NonNullable<CombatUnit['cycloneArmor']> {
  return value !== undefined && value !== null && !Array.isArray(value) && Object.keys(value).length === 2 &&
    Object.hasOwn(value, 'sourceHeroId') && Object.hasOwn(value, 'rank') && value.sourceHeroId === unit.id &&
    Number.isInteger(value.rank) && value.rank > 0 && value.rank <= CYCLONE_ARMOR_DEFINITION.maxRank;
}

/** Only a real source-bound paid payload activates defense; markers are presentation only. */
export function activeCycloneArmor(unit: CombatUnit): number {
  return cycloneArmorRank(unit) > 0 && validPaid(unit.cycloneArmor, unit) &&
    unit.cycloneArmor.rank === unit.cycloneArmorRank && unit.activeBuffIds.includes('cyclone-armor')
    ? unit.cycloneArmor.rank : 0;
}

/** Capture immutable potency only after the caller commits its ordinary paid cast. */
export function payCycloneArmor(unit: CombatUnit): CombatUnit {
  const rank = cycloneArmorRank(unit);
  if (rank === 0) throw new Error('Cannot pay an ineligible Cyclone Armor');
  return { ...unit, cycloneArmor: Object.freeze({ sourceHeroId: unit.id, rank }),
    activeBuffIds: [...unit.activeBuffIds.filter(id => !markerIds.includes(id)), 'cyclone-armor'] };
}

/** Copy paid carry and refresh only at a native wave boundary, preserving absolute resources. */
export function refreshCycloneArmorState(unit: CombatUnit): CombatUnit {
  const rank = cycloneArmorRank(unit);
  if (rank > 0 && validPaid(unit.cycloneArmor, unit) && unit.activeBuffIds.includes('cyclone-armor')) {
    return payCycloneArmor(unit);
  }
  if (unit.cycloneArmor === undefined && !unit.activeBuffIds.some(id => markerIds.includes(id))) return unit;
  const { cycloneArmor, ...unpaid } = unit;
  void cycloneArmor;
  return { ...unpaid, activeBuffIds: unit.activeBuffIds.filter(id => !markerIds.includes(id)) };
}

/** Additional resistance points, read before ordinary penalties/clamps without mutating base stats. */
export function cycloneArmorResistance(unit: CombatUnit): number {
  return activeCycloneArmor(unit) * (CYCLONE_ARMOR_DEFINITION.resistPerRank * 100);
}

/** Exact decimal cumulative quota; periodic callers subtract the value at their preceding boundary. */
export function cycloneArmorQuota(unit: CombatUnit, damage: number): number {
  const rank = activeCycloneArmor(unit);
  return rank > 0 && Number.isFinite(damage) && damage > 0
    ? integrateManaRecoveryWithContributionBetween(0,
      { sourceBaselinePerSecond: damage, factors: [CYCLONE_ARMOR_DEFINITION.absorbPerRank, rank] }, 0, 1000).wholeGranted : 0;
}

/** Share the same reduction for direct/periodic settlement and lethal-time prediction. */
export function absorbCycloneArmor(unit: CombatUnit, damage: number, previousDamage = 0) {
  if (!Number.isFinite(damage) || damage <= 0 || !Number.isFinite(previousDamage) || previousDamage < 0)
    return { damage, absorbed: 0 };
  const absorbed = cycloneArmorQuota(unit, previousDamage + damage) - cycloneArmorQuota(unit, previousDamage);
  return { damage: damage - absorbed, absorbed };
}

/** A sufficient execution packet even when a trusted snapshot also carries other personal shields. */
export function cycloneArmorLethalBound(unit: CombatUnit, unshielded: number): number {
  return Math.ceil(unshielded / (1 - activeCycloneArmor(unit) * CYCLONE_ARMOR_DEFINITION.absorbPerRank));
}
