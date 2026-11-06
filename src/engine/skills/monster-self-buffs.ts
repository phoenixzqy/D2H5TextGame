import rows from '../../data/skills/monsters.json';
import act1 from '../../data/monsters/act1.json';
import act2 from '../../data/monsters/act2.json';
import act3 from '../../data/monsters/act3.json';
import act4 from '../../data/monsters/act4.json';
import act5 from '../../data/monsters/act5.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

export const MONSTER_SELF_BUFF_IDS = Object.freeze(['enrage', 'shout', 'teleport', 'thorns-aura'] as const);
export type MonsterSelfBuffId = typeof MONSTER_SELF_BUFF_IDS[number];
const validate = createSkillValidator<SkillDef>();
const authoredId = (id: MonsterSelfBuffId) => 'monster-' + id;
const canonicalId = (id: MonsterSelfBuffId) => 'monster.' + id.replaceAll('-', '_');

/** Identify only the four exact native/authored identities, also used for presentation. */
export function monsterSelfBuffId(id: string): MonsterSelfBuffId | undefined {
  return MONSTER_SELF_BUFF_IDS.find(key => id === authoredId(key) || id === canonicalId(key));
}

/** Validate and copy finite self-buff tuning and its immutable native action. */
export function resolveMonsterSelfBuffs(input: readonly unknown[]) {
  return Object.freeze(MONSTER_SELF_BUFF_IDS.map(id => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authoredId(id));
    const row = matches[0];
    if (matches.length !== 1 || !validate(row) || !row.monsterSelfBuff)
      throw new Error(`Invalid authored monster ${id}`);
    const definition = Object.freeze({ id, durationMs: row.monsterSelfBuff.durationMs,
      percent: row.monsterSelfBuff.percent, minLevel: row.minLevel });
    const skill: RegisteredSkill = Object.freeze({ id: canonicalId(id), archetype: 'monster',
      trigger: 'active', target: row.target, cooldown: row.cooldown, manaCost: row.cost.mana ?? 0,
      minLevel: row.minLevel, isBuff: true,
      effects: Object.freeze([Object.freeze({ kind: 'buff' as const, id: authoredId(id), duration: definition.durationMs / 1000 })]) });
    return Object.freeze({ definition, skill });
  }));
}

/** Copied JSON authority; private combat windows capture the percent again at actual cast. */
export const MONSTER_SELF_BUFFS = resolveMonsterSelfBuffs(rows);
const consumers = new Map([...act1, ...act2, ...act3, ...act4, ...act5].map(row =>
  [row.id, new Set(row.skills.flatMap(skill => monsterSelfBuffId(skill) ?? []))] as const));

/** Only an original living enemy monster of a real catalog consumer can pay for this buff. */
export function isMonsterSelfBuffSource(unit: CombatUnit, id: MonsterSelfBuffId): boolean {
  const definition = MONSTER_SELF_BUFFS.find(entry => entry.definition.id === id)?.definition;
  return definition !== undefined && unit.kind === 'monster' && unit.side === 'enemy' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= definition.minLevel &&
    consumers.get(unit.monsterArchetypeId ?? '')?.has(id) === true;
}

/** A replaced or cloned registered body cannot borrow native private-window authority. */
export function matchesMonsterSelfBuff(skill: RegisteredSkill, id: MonsterSelfBuffId): boolean {
  return MONSTER_SELF_BUFFS.some(entry => entry.definition.id === id && entry.skill === skill);
}
