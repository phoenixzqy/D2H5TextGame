import Ajv2020 from 'ajv/dist/2020';
import rows from '../../data/skills/monsters.json';
import monsters from '../../data/monsters/act5.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { MonsterDef } from '../types/monsters';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validateSkill = createSkillValidator<SkillDef>();
const validateMonster = compileAuthoredValidator<MonsterDef>(new Ajv2020({ strict: true, allErrors: true }), 'monsters');

function exact(input: readonly unknown[], id: string): unknown {
  const found = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
  if (found.length !== 1) throw new Error(`Expected exactly one authored ${id}`);
  return found[0];
}
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Validate and independently freeze Baal's ordinary-action tentacle batch. */
export function resolveBaalTentacles(input: readonly unknown[], creatures: readonly unknown[]): RegisteredSkill {
  const row = exact(input, 'monster-tentacles');
  if (!validateSkill(row) || !row.monsterSummon || !row.summonId) throw new Error('Invalid authored Baal Tentacles');
  const batch = row.monsterSummon, monster = exact(creatures, batch.archetypeId);
  if (!validateMonster(monster)) throw new Error('Invalid authored Baal tentacle body');
  return freeze({ id: 'monster.tentacles', archetype: 'monster', trigger: 'active', target: 'summon',
    cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
    effects: [{ kind: 'summon', summonId: row.summonId, count: batch.count, maxCount: batch.maxCount,
      refundOnDeath: batch.refundOnDeath, monsterDef: structuredClone(monster) }] } satisfies RegisteredSkill);
}

/** Five living trash bodies; existing battle registration owns identity and scheduling. */
export const BAAL_TENTACLES = resolveBaalTentacles(rows, monsters);
