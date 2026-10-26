import authored from '../../data/skills/barbarian.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';

/** Exact learned identities; status markers and equipment grant no permission. */
export const BATTLE_COMMAND_IDS = ['skills-barbarian-battle-command', 'barbarian.battle_command'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate reviewed semantics and own immutable JSON tuning independently of the registry. */
export function resolveBattleCommandDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === BATTLE_COMMAND_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.skillRankBuff ||
    row.cost.mana === undefined || row.scaling?.costPerLevel === undefined ||
    row.scaling.cooldownPerLevel === undefined) throw new Error('Invalid authored Battle Command');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    manaCost: row.cost.mana, manaCostPerRank: row.scaling.costPerLevel,
    cooldown: row.cooldown, cooldownPerRank: row.scaling.cooldownPerLevel,
    buff: Object.freeze({ ...row.skillRankBuff }) });
}
/** JSON-owned duration and potency; no generic attack/Defense buff. */
export const BATTLE_COMMAND_DEFINITION = resolveBattleCommandDefinition(authored);

/** Independently project the complete native class/unlock/prerequisite chain. */
export function composeBattleCommandRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [BATTLE_COMMAND_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[BATTLE_COMMAND_IDS[1]] ?? 0 : 0;
}

/** Both order and registered identity must use the dedicated gate. */
export function isBattleCommandId(id: string): boolean { return BATTLE_COMMAND_IDS.some(alias => alias === id); }

/** Current native learned authority remains separate from any paid recipient bonus. */
export function battleCommandRank(unit: CombatUnit): number {
  const rank = unit.battleCommandRank;
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) && unit.level >= BATTLE_COMMAND_DEFINITION.requiredLevel &&
    Number.isFinite(unit.life) && unit.life > 0 && typeof rank === 'number' &&
    Number.isInteger(rank) && rank > 0 && rank <= BATTLE_COMMAND_DEFINITION.maxRank ? rank : 0;
}

/** Refuse added/replaced effects, startup casts or altered resource/target semantics. */
export function matchesBattleCommand(skill: RegisteredSkill): boolean {
  const d = BATTLE_COMMAND_DEFINITION, effect = skill.effects[0];
  return isBattleCommandId(skill.id) && skill.archetype === 'barbarian' && skill.trigger === 'active' &&
    skill.target === 'all-allies' && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.manaCostPerRank === d.manaCostPerRank &&
    skill.cooldown === d.cooldown && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.isBuff === undefined && skill.summonOnStart === undefined && skill.requires === undefined &&
    skill.aoeShape === undefined && skill.maxTargets === undefined && skill.effects.length === 1 &&
    effect?.kind === 'party-skill-ranks' && Object.keys(effect).length === 1;
}

/** Finite paid interval; an allocation cannot be normalized into a legal cast here. */
export function battleCommandDuration(rank: number): number {
  const d = BATTLE_COMMAND_DEFINITION;
  if (!Number.isInteger(rank) || rank < 1 || rank > d.maxRank) throw new Error('Invalid paid Battle Command rank');
  return d.buff.durationMs + d.buff.durationPerRankMs * (rank - 1);
}

/** Battle-owned binding created only by payment; never inferred from a unit marker. */
export interface BattleCommandGrant {
  readonly sourceId: string;
  readonly appliedAtMs: number;
  readonly expiresAtMs: number;
}

/** Half-open active interval, independent of whether the already-paid source survives. */
export function battleCommandBonus(unit: CombatUnit, clock: number,
  grants: ReadonlyMap<string, BattleCommandGrant>): number {
  const grant = grants.get(unit.id);
  return unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0 && grant &&
    clock >= grant.appliedAtMs && clock < grant.expiresAtMs ? BATTLE_COMMAND_DEFINITION.buff.bonusRanks : 0;
}
