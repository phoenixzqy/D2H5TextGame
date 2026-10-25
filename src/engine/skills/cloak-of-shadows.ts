import skills from '../../data/skills/assassin.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { CombatUnit, ActiveStatus } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';
import { statusActiveAt } from '../combat/status';

/** Exact learned identities; duplicate aliases never add ranks. */
export const CLOAK_OF_SHADOWS_IDS = ['skills-assassin-cloak-of-shadows', 'assassin.cloak_of_shadows'] as const;
const markerId = 'cloak-of-shadows';
type PaidCloak = NonNullable<ActiveStatus['cloakOfShadows']>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate the authored row and capture immutable tuning, independent of mutable UI data. */
export function resolveCloakOfShadowsDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === CLOAK_OF_SHADOWS_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.timedBuff || !row.scaling?.passiveStatsPerLevel)
    throw new Error('Invalid authored Cloak of Shadows');
  const stats = row.scaling.passiveStatsPerLevel;
  if (stats.defensePct === undefined || stats.critChancePct === undefined || stats.magicDodgePct === undefined ||
    row.cost.mana === undefined) throw new Error('Missing Cloak tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    durationMs: row.timedBuff.durationMs, defensePerRank: stats.defensePct,
    critPerRank: stats.critChancePct, magicDodgePerRank: stats.magicDodgePct,
    manaCost: row.cost.mana, cooldown: row.cooldown,
    costPerRank: row.scaling.costPerLevel ?? 0, cooldownPerRank: row.scaling.cooldownPerLevel ?? 0 });
}
export const CLOAK_OF_SHADOWS_DEFINITION = resolveCloakOfShadowsDefinition(skills);

/** Fresh native class/rank/recursive-prerequisite authority from the shared class-active boundary. */
export function composeCloakOfShadowsRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [CLOAK_OF_SHADOWS_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[CLOAK_OF_SHADOWS_IDS[1]] ?? 0 : 0;
}
function personalHero(unit: CombatUnit): boolean {
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) && unit.level >= CLOAK_OF_SHADOWS_DEFINITION.requiredLevel &&
    Number.isFinite(unit.life) && unit.life > 0;
}
/** Only a living native personal hero can spend its captured allocation. */
export function cloakOfShadowsRank(unit: CombatUnit): number {
  const rank = unit.cloakOfShadowsRank;
  return personalHero(unit) && typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= CLOAK_OF_SHADOWS_DEFINITION.maxRank ? rank : 0;
}
/** Reject partial/contradictory registry overrides before MP or cooldown can change. */
export function matchesCloakOfShadows(skill: RegisteredSkill): boolean {
  const d = CLOAK_OF_SHADOWS_DEFINITION, buff = skill.effects[0], blind = skill.effects[1];
  return skill.id === CLOAK_OF_SHADOWS_IDS[1] && skill.archetype === 'assassin' &&
    skill.trigger === 'active' && skill.target === 'all-enemies' && skill.isBuff === true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 2 && buff?.kind === 'buff' && Object.keys(buff).length === 4 &&
    buff.id === markerId && buff.timedStatBuff === markerId && buff.duration === d.durationMs / 1000 &&
    blind?.kind === 'debuff' && Object.keys(blind).length === 3 &&
    blind.statusId === 'blind' && blind.durationMs === d.durationMs;
}
/** Frozen potency captured once after payment; base stats are never rewritten. */
export function paidCloakOfShadows(rank: number): PaidCloak {
  const d = CLOAK_OF_SHADOWS_DEFINITION;
  if (!Number.isInteger(rank) || rank < 1 || rank > d.maxRank) throw new Error('Invalid paid Cloak rank');
  return Object.freeze({ rank, defensePct: rank * d.defensePerRank,
    critChancePct: rank * d.critPerRank, magicDodgePct: rank * d.magicDodgePerRank });
}
function validCloakStatus(unit: CombatUnit, status: ActiveStatus): boolean {
  const payload: unknown = status.cloakOfShadows, d = CLOAK_OF_SHADOWS_DEFINITION;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).length !== 4 ||
    !['rank', 'defensePct', 'critChancePct', 'magicDodgePct'].every(key => Object.hasOwn(payload, key))) return false;
  const p = payload as Readonly<Record<string, unknown>>, start = status.appliedAtMs, end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return personalHero(unit) && status.id === markerId && status.sourceId === unit.id &&
    typeof p.rank === 'number' && Number.isInteger(p.rank) && p.rank > 0 && p.rank <= d.maxRank &&
    p.defensePct === p.rank * d.defensePerRank && p.critChancePct === p.rank * d.critPerRank &&
    p.magicDodgePct === p.rank * d.magicDodgePerRank && end > start &&
    Math.abs(end - start - d.durationMs) <= tolerance;
}
/** Sanitize/copy carried Cloak payloads without touching Burst or other ordinary statuses. */
export function copyCloakOfShadowsStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some(status => status.cloakOfShadows !== undefined)) return unit;
  return { ...unit, statuses: unit.statuses.map(status => {
    if (status.cloakOfShadows === undefined) return status;
    const { cloakOfShadows, ...marker } = status;
    return validCloakStatus(unit, status) ? { ...marker, cloakOfShadows: paidCloakOfShadows(cloakOfShadows.rank) } : marker;
  }) };
}
/** Read one active paid snapshot, with inclusive start and exclusive expiry; duplicate markers never stack. */
export function activeCloakOfShadows(unit: CombatUnit, clock: number): ActiveStatus['cloakOfShadows'] {
  if (!Number.isFinite(clock)) return undefined;
  return unit.statuses.find(status => statusActiveAt(status, clock) && validCloakStatus(unit, status))?.cloakOfShadows;
}
