import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/combat/damage-delivery.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import act1 from '../../data/monsters/act1.json';
import act2 from '../../data/monsters/act2.json';
import act3 from '../../data/monsters/act3.json';
import act4 from '../../data/monsters/act4.json';
import act5 from '../../data/monsters/act5.json';
import type { WeaponType } from '../types/items';
import type { MonsterDef } from '../types/monsters';

/** Delivery of a whole native strike, independently of its elemental components. */
export type DamageDelivery = 'melee' | 'primary-melee' | 'ranged' | 'spell';
/** Ordinary body/weapon delivery; none is reserved for bound nonattacking bodies. */
export type BasicAttackDelivery = Exclude<DamageDelivery, 'primary-melee'> | 'none';

interface DamageDeliveryDefinition {
  readonly id: 'combat/damage-delivery';
  readonly skills: Readonly<Record<string, DamageDelivery>>;
  readonly weapons: Readonly<Record<WeaponType, 'melee' | 'ranged'>>;
  readonly summons: Readonly<Record<string, BasicAttackDelivery>>;
  readonly monsterBasics: Readonly<Record<string, Exclude<BasicAttackDelivery, 'none'>>>;
}
const validate = compileAuthoredValidator<DamageDeliveryDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'damageDelivery');
const monsterBaselines = new Map([...act1, ...act2, ...act3, ...act4, ...act5]
  .map(row => [row.id, structuredClone(row)] as const));

/** Validate and copy authored delivery without freezing or retaining caller-owned records. */
export function resolveDamageDeliveryDefinition(input: unknown): DamageDeliveryDefinition {
  if (!validate(input)) throw new Error('Invalid authored damage delivery');
  if (Object.keys(input.monsterBasics).length !== monsterBaselines.size ||
    [...monsterBaselines.keys()].some(id => !Object.hasOwn(input.monsterBasics, id)))
    throw new Error('Expected exact authored monster basic delivery coverage');
  return Object.freeze({ id: input.id,
    skills: Object.freeze({ ...input.skills }), weapons: Object.freeze({ ...input.weapons }),
    summons: Object.freeze({ ...input.summons }), monsterBasics: Object.freeze({ ...input.monsterBasics }) });
}

/** Immutable authored decisions; unknown sources have no entry. */
export const DAMAGE_DELIVERY_DEFINITION = resolveDamageDeliveryDefinition(authored);

/** Compare complete plain source semantics, including nested arrays and optional own fields. */
export function sameDeliverySource(actual: unknown, baseline: unknown): boolean {
  if (actual === baseline) return true;
  if (typeof actual !== 'object' || actual === null || typeof baseline !== 'object' || baseline === null ||
    Array.isArray(actual) !== Array.isArray(baseline)) return false;
  if (Array.isArray(actual) && Array.isArray(baseline) && actual.length !== baseline.length) return false;
  const a = actual as Record<string, unknown>, b = baseline as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length &&
    Object.keys(b).every(key => Object.hasOwn(a, key) && sameDeliverySource(a[key], b[key]));
}

/** Custom/changed same-ID definitions cannot borrow bundled monster basic provenance. */
export function nativeMonsterBasicDelivery(def: MonsterDef): BasicAttackDelivery | undefined {
  const baseline = monsterBaselines.get(def.id);
  return baseline && sameDeliverySource(def, baseline)
    ? DAMAGE_DELIVERY_DEFINITION.monsterBasics[def.id] : undefined;
}
