import rows from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';
import { statusActiveAt } from '../combat/status';

export const SORCERESS_BUFF_IDS = ['teleport', 'enchant'] as const;
export type SorceressBuffId = typeof SORCERESS_BUFF_IDS[number];
const dataId = (id: SorceressBuffId) => 'skills-sorceress-' + id;
const canonical = (id: SorceressBuffId) => 'sorceress.' + id;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate and copy the exact JSON-owned timing, potency and payment primitives. */
export function resolveSorceressBuffDefinition(source: readonly unknown[], id: SorceressBuffId) {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === dataId(id));
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.timedBuff || row.cost.mana === undefined)
    throw new Error('Invalid authored Sorceress buff');
  const perRank = id === 'teleport' ? row.scaling?.passiveStatsPerLevel?.magicDodgePct
    : row.enchantOnPhysicalHit?.attackPctPerRank;
  if (perRank === undefined) throw new Error('Missing Sorceress buff potency');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    durationMs: row.timedBuff.durationMs, perRank, manaCost: row.cost.mana,
    cooldown: row.cooldown, costPerRank: row.scaling?.costPerLevel ?? 0,
    cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0 });
}
export const SORCERESS_BUFF_DEFINITIONS = Object.freeze({
  teleport: resolveSorceressBuffDefinition(rows, 'teleport'),
  enchant: resolveSorceressBuffDefinition(rows, 'enchant')
});
/** Only exact learned/native identities opt into these paid effects. */
export function sorceressBuffId(id: string): SorceressBuffId | undefined {
  return SORCERESS_BUFF_IDS.find(buff => id === dataId(buff) || id === canonical(buff));
}
/** Re-evaluate class, unlock, transitive prerequisites and exact learned aliases per wave. */
export function composeSorceressBuffRanks(player: Pick<Player, 'class' | 'level' | 'skillLevels'>) {
  const rank = (id: SorceressBuffId) => {
    const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
      skillOrder: [dataId(id)], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
    return projected.skillOrder.length === 1 ? projected.skillLevels?.[canonical(id)] ?? 0 : 0;
  };
  return Object.freeze({ teleport: rank('teleport'), enchant: rank('enchant') });
}
function personalHero(unit: CombatUnit, id: SorceressBuffId): boolean {
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) && unit.level >= SORCERESS_BUFF_DEFINITIONS[id].requiredLevel &&
    Number.isFinite(unit.life) && unit.life > 0;
}
/** No implicit rank-one, foreign actor, priority-only or marker authority. */
export function sorceressBuffRank(unit: CombatUnit, id: SorceressBuffId): number {
  const rank = unit.sorceressBuffRanks?.[id];
  return personalHero(unit, id) && typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= SORCERESS_BUFF_DEFINITIONS[id].maxRank ? rank : 0;
}
/** Match the complete opted-in registered body before payment. */
export function matchesSorceressBuff(skill: RegisteredSkill, id: SorceressBuffId): boolean {
  const d = SORCERESS_BUFF_DEFINITIONS[id], effect = skill.effects[0];
  return skill.id === canonical(id) && skill.archetype === 'sorceress' &&
    skill.trigger === 'active' && skill.target === 'self' && skill.isBuff === true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'buff' && Object.keys(effect).length === 4 &&
    effect.id === id && effect.sorceressBuff === id && effect.duration === d.durationMs / 1000;
}

/** Refuse nonfinite/overflowing Attack snapshots before any Enchant payment. */
export function canCaptureEnchantAttack(attack: number, rank: number): boolean {
  return Number.isFinite(attack) && attack >= 0 &&
    Number.isFinite(attack * rank * SORCERESS_BUFF_DEFINITIONS.enchant.perRank);
}
/** Capture immutable paid rank and, for Enchant, normal Attack exactly once. */
export function paySorceressBuff(id: SorceressBuffId, rank: number, attack = 0): NonNullable<ActiveStatus['sorceressBuff']> {
  if (!Number.isInteger(rank) || rank < 1 || rank > SORCERESS_BUFF_DEFINITIONS[id].maxRank ||
    (id === 'enchant' && !canCaptureEnchantAttack(attack, rank)))
    throw new Error('Invalid paid Sorceress buff');
  return Object.freeze({ rank, ...(id === 'enchant' ? { attack } : {}) });
}
function validStatus(unit: CombatUnit, status: ActiveStatus, id: SorceressBuffId): boolean {
  const p = status.sorceressBuff, d = SORCERESS_BUFF_DEFINITIONS[id];
  if (!p || typeof p !== 'object' || Array.isArray(p) ||
    Object.keys(p).length !== (id === 'enchant' ? 2 : 1) || !Object.hasOwn(p, 'rank') ||
    (id === 'enchant' && !Object.hasOwn(p, 'attack'))) return false;
  const start = status.appliedAtMs, end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return personalHero(unit, id) && status.id === id && status.sourceId === unit.id && status.stacks === 1 &&
    Number.isInteger(p.rank) && p.rank > 0 && p.rank <= d.maxRank &&
    (id !== 'enchant' || (typeof p.attack === 'number' && canCaptureEnchantAttack(p.attack, p.rank))) &&
    end > start && Math.abs(end - start - d.durationMs) <= tolerance;
}
/** Deep-copy validated paid payloads; malformed carried markers never confer power. */
export function copySorceressBuffStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some(s => s.sorceressBuff !== undefined)) return unit;
  return { ...unit, statuses: unit.statuses.map(status => {
    const payload = status.sorceressBuff;
    if (payload === undefined) return status;
    const { sorceressBuff: discarded, ...marker } = status; void discarded;
    const id = SORCERESS_BUFF_IDS.find(id => id === status.id);
    return id && validStatus(unit, status, id)
      ? { ...marker, sorceressBuff: paySorceressBuff(id, payload.rank, payload.attack) } : marker;
  }) };
}
/** Read one authenticated half-open paid state; duplicate markers never stack. */
export function activeSorceressBuff(unit: CombatUnit, id: SorceressBuffId, clock: number): ActiveStatus['sorceressBuff'] {
  if (!Number.isFinite(clock)) return undefined;
  return unit.statuses.find(s => statusActiveAt(s, clock) && validStatus(unit, s, id))?.sorceressBuff;
}
/** Effective magical dodge fraction or unrounded extra Fire base from the paid snapshot. */
export function sorceressBuffBonus(unit: CombatUnit, id: SorceressBuffId, clock: number): number {
  const paid = activeSorceressBuff(unit, id, clock);
  return paid ? paid.rank * SORCERESS_BUFF_DEFINITIONS[id].perRank * (id === 'enchant' ? paid.attack ?? 0 : 1) : 0;
}
