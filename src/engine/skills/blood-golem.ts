import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/blood-golem.json';
import schema from '../../data/schema/blood-golem.schema.json';
import skills from '../../data/skills/necromancer.json';
import type { DerivedStats } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { RegisteredSkill } from './effects';
import { registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

/** Exact authored and canonical Blood Golem aliases. */
export const BLOOD_GOLEM_IDS = ['skills-necromancer-blood-golem', 'necromancer.blood_golem'] as const;
interface BloodGolemDefinition {
  readonly id: 'summons/blood-golem';
  readonly bodyStats: Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
  readonly lifeLeechFraction: number;
}
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<BloodGolemDefinition>(schema);

/** Validate and copy authored stats/tuning without freezing caller data or supplying defaults. */
export function resolveBloodGolemDefinition(input: unknown): BloodGolemDefinition {
  if (!validate(input)) throw new Error('Invalid authored Blood Golem definition');
  return Object.freeze({ id: input.id,
    bodyStats: Object.freeze({ ...input.bodyStats,
      resistances: Object.freeze({ ...input.bodyStats.resistances }) }),
    lifeLeechFraction: input.lifeLeechFraction });
}
/** Immutable base stats and life-leech tuning; magical mitigation remains shared. */
export const BLOOD_GOLEM_DEFINITION = resolveBloodGolemDefinition(authored);
const validateSkill = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
const matches = skills.filter(row => row.id === BLOOD_GOLEM_IDS[0]), source = matches[0];
if (matches.length !== 1 || !validateSkill(source)) throw new Error('Invalid authored Blood Golem source');
const expected = registeredSkillFromJson({ ...source, trigger: 'active', target: 'summon' });
const requiredLevel = source.requiredLevel, maxRank = source.maxLevel;

function same(actual: unknown, reference: unknown): boolean {
  if (actual === reference) return true;
  if (typeof actual !== 'object' || actual === null || typeof reference !== 'object' ||
    reference === null || Array.isArray(actual) !== Array.isArray(reference)) return false;
  const a = actual as Record<string, unknown>, b = reference as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length &&
    Object.keys(b).every(key => Object.hasOwn(a, key) && same(a[key], b[key]));
}

/** Only the exact source semantics and a fresh legal native rank can empower a paid body. */
export function qualifyBloodGolem(owner: CombatUnit, skill: RegisteredSkill, rank: number): boolean {
  const allocated = BLOOD_GOLEM_IDS.map(id => owner.skillLevels?.[id]).find(n => typeof n === 'number' && n > 0);
  return owner.id.length > 0 && owner.side === 'player' && inferKind(owner) === 'hero' &&
    owner.summon !== true && owner.ownerId === undefined && owner.summonOwnerId === undefined &&
    Number.isFinite(owner.life) && owner.life > 0 && Number.isInteger(owner.level) &&
    owner.level >= requiredLevel && Number.isInteger(rank) && rank >= 1 && rank <= maxRank &&
    owner.bloodGolemRank === rank && allocated === rank &&
    owner.skillOrder.some(id => BLOOD_GOLEM_IDS.some(alias => alias === id)) && same(skill, expected);
}

/** Fresh complete unchanged base stats for both runtime bodies and pure skill previews. */
export function bloodGolemBodyStats(): DerivedStats {
  const stats = BLOOD_GOLEM_DEFINITION.bodyStats;
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}
