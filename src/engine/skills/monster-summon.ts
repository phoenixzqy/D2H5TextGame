import Ajv2020 from 'ajv/dist/2020';
import rows from '../../data/skills/monsters.json';
import authored from '../../data/summons/monster.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { DerivedStats } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

type BodyStats = Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
/** Fixed monster minion body and startup action tuning; no owner or rank growth. */
export interface MonsterSummonDefinition {
  readonly id: 'summons/monster';
  readonly summonAdds: { readonly maxCount: number; readonly onStart: boolean };
  readonly templates: { readonly minion: BodyStats };
}
const validateDefinition = compileAuthoredValidator<MonsterSummonDefinition>(
  new Ajv2020({ strict: true, allErrors: true }), 'monsterSummons');
const validateSkill = createSkillValidator<SkillDef>();

/** Reject incomplete tuning and independently freeze the validated copy. */
export function resolveMonsterSummonDefinition(input: unknown): MonsterSummonDefinition {
  if (!validateDefinition(input)) throw new Error('Invalid authored monster summon definition');
  const body = input.templates.minion;
  return Object.freeze({ id: input.id, summonAdds: Object.freeze({ ...input.summonAdds }),
    templates: Object.freeze({ minion: Object.freeze({ ...body,
      resistances: Object.freeze({ ...body.resistances }) }) }) });
}
const definition = resolveMonsterSummonDefinition(authored);

/** Copy the legacy startup template action; ordinary monster batches remain separate. */
export function resolveMonsterSummonSkill(input: readonly unknown[], tuning: unknown): RegisteredSkill {
  const matches = input.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'monster-summon-adds');
  if (matches.length !== 1) throw new Error('Expected exactly one authored monster-summon-adds');
  const row = matches[0];
  if (!validateSkill(row) || !row.summonId) throw new Error('Invalid authored monster-summon-adds');
  const { summonAdds } = resolveMonsterSummonDefinition(tuning);
  return Object.freeze({ id: 'monster.summon_adds', archetype: 'monster', target: row.target,
    cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
    summonOnStart: summonAdds.onStart,
    effects: Object.freeze([Object.freeze({ kind: 'summon' as const,
      summonId: row.summonId, maxCount: summonAdds.maxCount })]) });
}

/** Fresh body stats shared by native factories and previews, with existing mitigation. */
export function getMonsterSummonStats(summonId: string): DerivedStats | undefined {
  if (summonId !== 'minion') return undefined;
  const stats = definition.templates.minion;
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}

/** One startup birth and later replacements up to the authored living cap. */
export const MONSTER_SUMMON_SKILL = resolveMonsterSummonSkill(rows, definition);
