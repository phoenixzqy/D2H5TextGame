import rows from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';

export const COLD_ARMOR_IDS = ['shiver-armor', 'chilling-armor'] as const;
export type ColdArmorId = typeof COLD_ARMOR_IDS[number];
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
const dataId = (id: ColdArmorId) => 'skills-sorceress-' + id;
const canonical = (id: ColdArmorId) => 'sorceress.' + id.replaceAll('-', '_');
const markers = (id: ColdArmorId) => [id, dataId(id), canonical(id)];

/** Validate and independently copy authored potency/payment; mutable catalog edits grant no power. */
export function resolveColdArmorDefinition(source: readonly unknown[], id: ColdArmorId) {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === dataId(id));
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Cold armor');
  const stats = row.scaling?.passiveStatsPerLevel, hit = row.armorRetaliation;
  if (!stats || !hit || hit.max < hit.min || row.cost.mana === undefined)
    throw new Error('Missing Cold armor tuning');
  return Object.freeze({ maxRank: row.maxLevel, requiredLevel: row.requiredLevel,
    defensePerRank: stats.defensePct ?? 0, coldPerRank: stats.coldDamagePct ?? 0,
    dodgePerRank: stats.magicDodgePct ?? 0, min: hit.min, max: hit.max, growth: hit.perRank,
    manaCost: row.cost.mana, cooldown: row.cooldown, costPerRank: row.scaling.costPerLevel ?? 0,
    cooldownPerRank: row.scaling.cooldownPerLevel ?? 0 });
}
export const COLD_ARMOR_DEFINITIONS = Object.freeze({
  'shiver-armor': resolveColdArmorDefinition(rows, 'shiver-armor'),
  'chilling-armor': resolveColdArmorDefinition(rows, 'chilling-armor')
});

/** Exact authored/canonical identity; a shared buff marker cannot opt another skill in. */
export function coldArmorId(id: string): ColdArmorId | undefined {
  return COLD_ARMOR_IDS.find(key => id === dataId(key) || id === canonical(key));
}

/** Native original-hero authority for both armors, including unselected learned allocations. */
export function composeColdArmorRanks(player: Pick<Player, 'class' | 'level' | 'skillLevels'>) {
  const rank = (id: ColdArmorId) => {
    const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
      skillOrder: [dataId(id)], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
    return projected.skillOrder.length === 1 ? projected.skillLevels?.[canonical(id)] ?? 0 : 0;
  };
  return Object.freeze({ 'shiver-armor': rank('shiver-armor'), 'chilling-armor': rank('chilling-armor') });
}

/** No active rank-one fallback; pure engine callers may supply exact allocated aliases. */
export function coldArmorRank(unit: CombatUnit, id: ColdArmorId): number {
  const d = COLD_ARMOR_DEFINITIONS[id];
  if (unit.side !== 'player' || unit.kind !== 'hero' || unit.summon === true ||
    unit.ownerId !== undefined || unit.summonOwnerId !== undefined || unit.level < d.requiredLevel) return 0;
  const values = unit.coldArmorRanks ? [unit.coldArmorRanks[id]] :
    [unit.skillLevels?.[dataId(id)], unit.skillLevels?.[canonical(id)]];
  return Math.max(0, ...values.map(value => typeof value === 'number' && Number.isInteger(value) &&
    value > 0 && value <= d.maxRank ? value : 0));
}

/** Refuse contradictory registry overrides before charging mana. */
export function matchesColdArmor(skill: RegisteredSkill, id: ColdArmorId): boolean {
  const d = COLD_ARMOR_DEFINITIONS[id], effect = skill.effects[0];
  return skill.id === canonical(id) && skill.archetype === 'sorceress' && skill.trigger === 'active' &&
    skill.target === 'self' && skill.isBuff === true && skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel && skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'buff' && effect.id === id &&
    effect.duration === -1 && effect.coldArmor === id;
}

/** Paid rank survives positive reallocation; markers or learning alone cannot establish payment. */
export function paidColdArmorRank(unit: CombatUnit, id: ColdArmorId): number {
  const paid = unit.coldArmors?.[id];
  return paid && paid.sourceId === unit.id && Number.isInteger(paid.rank) && paid.rank > 0 &&
    paid.rank <= COLD_ARMOR_DEFINITIONS[id].maxRank && unit.activeBuffIds.includes(id) ? paid.rank : 0;
}

/** Capture only after ordinary payment; immutable potency remains independent of base stats. */
export function payColdArmor(unit: CombatUnit, id: ColdArmorId, rank: number): CombatUnit {
  return { ...unit, coldArmors: Object.freeze({ ...unit.coldArmors,
    [id]: Object.freeze({ sourceId: unit.id, rank }) }),
    activeBuffIds: [...unit.activeBuffIds.filter(marker => !markers(id).includes(marker)), id] };
}

/** Strip only ineligible armor at a fresh native boundary; never refill resources or rewrite prior input. */
export function refreshColdArmorState(unit: CombatUnit): CombatUnit {
  let result = unit;
  for (const id of COLD_ARMOR_IDS) {
    if (coldArmorRank(result, id) > 0 && paidColdArmorRank(result, id) > 0) continue;
    if (result.coldArmors?.[id] === undefined && !result.activeBuffIds.some(marker => markers(id).includes(marker))) continue;
    const paid = { ...result.coldArmors };
    Reflect.deleteProperty(paid, id);
    const { coldArmors: _old, ...rest } = result;
    result = { ...rest, ...(Object.keys(paid).length > 0 ? { coldArmors: Object.freeze(paid) } : {}),
      activeBuffIds: result.activeBuffIds.filter(marker => !markers(id).includes(marker)) };
  }
  return result;
}

/** Additive Defense/Cold/dodge projections shared by the ordinary damage pipeline. */
export function coldArmorBonuses(unit: CombatUnit) {
  if (unit.coldArmors === undefined) return NO_COLD_ARMOR_BONUSES;
  const shiver = paidColdArmorRank(unit, 'shiver-armor'), chilling = paidColdArmorRank(unit, 'chilling-armor');
  return { defense: shiver * COLD_ARMOR_DEFINITIONS['shiver-armor'].defensePerRank +
      chilling * COLD_ARMOR_DEFINITIONS['chilling-armor'].defensePerRank,
    cold: shiver * COLD_ARMOR_DEFINITIONS['shiver-armor'].coldPerRank,
    dodge: chilling * COLD_ARMOR_DEFINITIONS['chilling-armor'].dodgePerRank };
}
const NO_COLD_ARMOR_BONUSES = Object.freeze({ defense: 0, cold: 0, dodge: 0 });

/** A normal Cold hit with canonical Freeze; the caller prevents reaction recursion. */
export function coldArmorCounterattack(id: ColdArmorId): DamageEffect {
  const d = COLD_ARMOR_DEFINITIONS[id];
  return { kind: 'damage', damageType: 'cold', base: [d.min, d.max], perRank: [d.growth, d.growth],
    applyStatus: { id: 'freeze' } };
}
