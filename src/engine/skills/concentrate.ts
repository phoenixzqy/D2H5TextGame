import skills from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';
import { statusActiveAt } from '../combat/status';

export const CONCENTRATE_IDS = ['skills-barbarian-concentrate', 'barbarian.concentrate'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate and copy the authored paid attack/Defense contract before combat. */
export function resolveConcentrateDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === CONCENTRATE_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.timedBuff || !row.damage ||
    row.cost.mana === undefined || row.scaling?.damagePerLevel === undefined ||
    row.scaling.passiveStatsPerLevel?.defensePct === undefined)
    throw new Error('Invalid authored Concentrate');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    durationMs: row.timedBuff.durationMs, defensePerRank: row.scaling.passiveStatsPerLevel.defensePct,
    manaCost: row.cost.mana, cooldown: row.cooldown, min: row.damage.min, max: row.damage.max,
    damagePerRank: row.scaling.damagePerLevel });
}
export const CONCENTRATE_DEFINITION = resolveConcentrateDefinition(skills);

/** Capture native class/unlock/transitive prerequisite authority independently each wave. */
export function composeConcentrateRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [CONCENTRATE_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[CONCENTRATE_IDS[1]] ?? 0 : 0;
}
function personalHero(unit: CombatUnit): boolean {
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) && unit.level >= CONCENTRATE_DEFINITION.requiredLevel &&
    Number.isFinite(unit.life) && unit.life > 0;
}
/** Only a living personal hero can spend its independently captured native allocation. */
export function concentrateRank(unit: CombatUnit): number {
  const rank = unit.concentrateRank;
  return personalHero(unit) && typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= CONCENTRATE_DEFINITION.maxRank ? rank : 0;
}
/** Reject incomplete or modified registry contracts before payment. */
function exactPair(values: readonly number[] | undefined, left: number, right: number): boolean {
  return values?.length === 2 && values[0] === left && values[1] === right;
}

/** Reject incomplete or modified registry contracts before payment. */
export function matchesConcentrate(skill: RegisteredSkill): boolean {
  const d = CONCENTRATE_DEFINITION, buff = skill.effects[0], hit = skill.effects[1];
  return skill.id === CONCENTRATE_IDS[1] && skill.archetype === 'barbarian' &&
    skill.trigger === 'active' && skill.target === 'single-enemy' && skill.isBuff !== true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === undefined && skill.cooldownPerRank === undefined &&
    skill.effects.length === 2 && buff?.kind === 'buff' && Object.keys(buff).length === 4 &&
    buff.id === 'concentrate' && buff.timedStatBuff === 'concentrate' && buff.duration === d.durationMs / 1000 &&
    hit?.kind === 'damage' && Object.keys(hit).length === 5 && hit.damageType === 'physical' &&
    exactPair(hit.base, d.min, d.max) && exactPair(hit.perRank, d.damagePerRank, d.damagePerRank) &&
    hit.tags?.length === 1 && hit.tags[0] === 'physical';
}
/** Immutable potency captured at payment; base stats remain untouched. */
export function paidConcentrate(rank: number): NonNullable<ActiveStatus['concentrate']> {
  if (!Number.isInteger(rank) || rank < 1 || rank > CONCENTRATE_DEFINITION.maxRank)
    throw new Error('Invalid paid Concentrate rank');
  return Object.freeze({ rank, defensePct: rank * CONCENTRATE_DEFINITION.defensePerRank });
}
function validStatus(unit: CombatUnit, status: ActiveStatus): boolean {
  const payload: unknown = status.concentrate, d = CONCENTRATE_DEFINITION;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).length !== 2 || !Object.hasOwn(payload, 'rank') || !Object.hasOwn(payload, 'defensePct')) return false;
  const p = payload as Readonly<Record<string, unknown>>, start = status.appliedAtMs, end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return personalHero(unit) && status.id === 'concentrate' && status.sourceId === unit.id &&
    typeof p.rank === 'number' && Number.isInteger(p.rank) && p.rank > 0 && p.rank <= d.maxRank &&
    p.defensePct === p.rank * d.defensePerRank && end > start &&
    Math.abs(end - start - d.durationMs) <= tolerance;
}
/** Copy/sanitize source-bound carried potency without changing unrelated statuses. */
export function copyConcentrateStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some(status => status.concentrate !== undefined)) return unit;
  return { ...unit, statuses: unit.statuses.map(status => {
    if (status.concentrate === undefined) return status;
    const { concentrate, ...marker } = status;
    return validStatus(unit, status) ? { ...marker, concentrate: paidConcentrate(concentrate.rank) } : marker;
  }) };
}
/** One active paid stance; duplicate markers never stack and expiry is exclusive. */
export function activeConcentrate(unit: CombatUnit, clock: number): ActiveStatus['concentrate'] {
  if (!Number.isFinite(clock)) return undefined;
  return unit.statuses.find(status => statusActiveAt(status, clock) && validStatus(unit, status))?.concentrate;
}
