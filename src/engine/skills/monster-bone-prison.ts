import rows from '../../data/skills/monsters.json';
import act1 from '../../data/monsters/act1.json';
import act2 from '../../data/monsters/act2.json';
import act3 from '../../data/monsters/act3.json';
import act4 from '../../data/monsters/act4.json';
import act5 from '../../data/monsters/act5.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

export const MONSTER_PRISON_STATUS_ID = 'monster-bone-prison';
const canonical = 'monster.bone_prison';
const validate = createSkillValidator<SkillDef>();

/** Identify the two native aliases without borrowing the player's learned trap. */
export function isMonsterBonePrisonId(id: string): boolean {
  return id === canonical || id === MONSTER_PRISON_STATUS_ID;
}

/** Validate and freeze JSON-owned direct damage and private trap duration. */
export function resolveMonsterBonePrison(input: readonly unknown[]) {
  const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === MONSTER_PRISON_STATUS_ID);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.damage || row.damage.min > row.damage.max ||
    row.damage.breakdown.arcane !== row.damage.max || row.statusEffect?.durationMs === undefined)
    throw new Error('Invalid authored monster Bone Prison');
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'arcane',
    base: Object.freeze([row.damage.min, row.damage.max] as const) });
  const skill: RegisteredSkill = Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
    cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
    effects: Object.freeze([effect]) });
  return Object.freeze({ durationMs: row.statusEffect.durationMs, skill, effect });
}

/** Exact source/effect identities authenticate only the ordinary landed native hit. */
export const MONSTER_BONE_PRISON = resolveMonsterBonePrison(rows);
const consumers = new Set([...act1, ...act2, ...act3, ...act4, ...act5].filter(row => row.skills.some(isMonsterBonePrisonId)).map(row => row.id));

/** Only original living catalog consumers can pay; converted originals retain personal identity. */
export function isMonsterBonePrisonSource(unit: CombatUnit): boolean {
  return unit.kind === 'monster' && unit.side === 'enemy' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.summonTemplateId === undefined &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) && unit.level >= MONSTER_BONE_PRISON.skill.minLevel &&
    consumers.has(unit.monsterArchetypeId ?? '');
}
