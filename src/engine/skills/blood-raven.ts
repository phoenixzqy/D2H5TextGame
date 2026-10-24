import { createSkillValidator } from './skill-validator';
import Ajv2020 from 'ajv/dist/2020';
import skills from '../../data/skills/monsters.json';
import monsters from '../../data/monsters/act1.json';
import monsterSchema from '../../data/schema/monster.schema.json';
import type { SkillDef } from '../types/skills';
import type { MonsterDef } from '../types/monsters';
import type { RegisteredSkill } from './effects';

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validSkill = createSkillValidator<SkillDef>();
const validMonster = ajv.compile<MonsterDef>(monsterSchema);

function exact(rows: readonly unknown[], id: string): unknown {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
  if (matches.length !== 1) throw new Error(`Expected exactly one authored ${id}`);
  return matches[0];
}
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Validate and independently freeze only Blood Raven's dedicated authored actions. */
export function resolveBloodRavenSkills(rows: readonly unknown[], monsterRows: readonly unknown[]): readonly RegisteredSkill[] {
  const raise = exact(rows, 'monster-blood-raven-raise-dead');
  const fire = exact(rows, 'monster-blood-raven-fire-arrow');
  if (!validSkill(raise) || !validSkill(fire)) throw new Error('Invalid authored Blood Raven skill');
  const summon = raise.monsterSummon;
  const damage = fire.damage;
  const status = fire.statusEffect;
  if (!summon || !raise.summonId || summon.count > summon.maxCount || !damage ||
      damage.min > damage.max || !status || raise.cost.mana !== 0 || fire.cost.mana !== 0) {
    throw new Error('Invalid authored Blood Raven action metadata');
  }
  const monster = exact(monsterRows, summon.archetypeId);
  if (!validMonster(monster)) throw new Error('Invalid authored raised monster');
  const common = { archetype: 'monster', trigger: 'active' as const, manaCost: 0 };
  return freeze([
    { ...common, id: raise.id, target: 'summon', cooldown: raise.cooldown, minLevel: raise.minLevel,
      effects: [{ kind: 'summon', summonId: raise.summonId, maxCount: summon.maxCount,
        count: summon.count, refundOnDeath: summon.refundOnDeath, monsterDef: structuredClone(monster) }] },
    { ...common, id: fire.id, target: 'single-enemy', cooldown: fire.cooldown, minLevel: fire.minLevel,
      effects: [{ kind: 'damage', damageType: 'fire', base: [damage.min, damage.max],
        applyStatus: { id: 'burn', ...status } }] }
  ] satisfies RegisteredSkill[]);
}

/** Dedicated immutable actions; shared monster placeholders retain their prior behavior. */
export const BLOOD_RAVEN_SKILLS = resolveBloodRavenSkills(skills, monsters);
