import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/fire-golem.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import skills from '../../data/skills/necromancer.json';
import type { DerivedStats } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { RegisteredSkill } from './effects';
import { registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

/** Exact authored and canonical Fire Golem aliases. */
export const FIRE_GOLEM_IDS = ['skills-necromancer-fire-golem', 'necromancer.fire_golem'] as const;
interface FireGolemDefinition {
  readonly id: 'summons/fire-golem';
  readonly bodyStats: Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
  readonly attack: { readonly damageType: 'fire'; readonly dotPctOfDamage: number };
}
const validate = compileAuthoredValidator<FireGolemDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'fireGolem');

/** Validate and copy authored stats/tuning without freezing caller data or supplying defaults. */
export function resolveFireGolemDefinition(input: unknown): FireGolemDefinition {
  if (!validate(input)) throw new Error('Invalid authored Fire Golem definition');
  return Object.freeze({ id: input.id,
    bodyStats: Object.freeze({ ...input.bodyStats,
      resistances: Object.freeze({ ...input.bodyStats.resistances }) }),
    attack: Object.freeze({ ...input.attack }) });
}
/** Immutable base stats and ordinary attack tuning; magical mitigation remains shared. */
export const FIRE_GOLEM_DEFINITION = resolveFireGolemDefinition(authored);
const validateSkill = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
const matches = skills.filter(row => row.id === FIRE_GOLEM_IDS[0]), source = matches[0];
if (matches.length !== 1 || !validateSkill(source)) throw new Error('Invalid authored Fire Golem source');
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
export function qualifyFireGolem(owner: CombatUnit, skill: RegisteredSkill, rank: number): boolean {
  const allocated = FIRE_GOLEM_IDS.map(id => owner.skillLevels?.[id]).find(n => typeof n === 'number' && n > 0);
  return owner.id.length > 0 && owner.side === 'player' && inferKind(owner) === 'hero' &&
    owner.summon !== true && owner.ownerId === undefined && owner.summonOwnerId === undefined &&
    Number.isFinite(owner.life) && owner.life > 0 && Number.isInteger(owner.level) &&
    owner.level >= requiredLevel && Number.isInteger(rank) && rank >= 1 && rank <= maxRank &&
    owner.fireGolemRank === rank && allocated === rank &&
    owner.skillOrder.some(id => FIRE_GOLEM_IDS.some(alias => alias === id)) && same(skill, expected);
}

/** Fresh complete unchanged base stats for both runtime bodies and pure skill previews. */
export function fireGolemBodyStats(): DerivedStats {
  const stats = FIRE_GOLEM_DEFINITION.bodyStats;
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}
