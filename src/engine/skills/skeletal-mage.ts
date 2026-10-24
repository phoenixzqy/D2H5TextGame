import { createSkillValidator } from './skill-validator';
import necromancerSkills from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';

/** Direct basic-bolt type, drawn only from the authored Mage cycle. */
export type SkeletalMageElement = NonNullable<SkillDef['summonBasicAttackElements']>[number];

/** Copied authored tuning with lookup bound to its validated immutable cycle. */
export interface SkeletalMageDefinition {
  /** Maximum learned rank copied from the validated authored skill. */
  readonly maxRank: number;
  readonly elements: readonly SkeletalMageElement[];
  /** Resolve a fresh local batch index. Throws RangeError unless it is a nonnegative safe integer. */
  readonly elementAt: (freshIndex: number) => SkeletalMageElement;
}

type AuthoredMage = SkillDef & { readonly summon?: boolean };
const AUTHORED_ID = 'skills-necromancer-raise-skeletal-mage';
const validate = createSkillValidator<AuthoredMage>();

/**
 * Validate exactly one authored Mage and copy its cycle without retaining data or registry references.
 * Throws for absent, duplicate, malformed or unrelated source definitions; never supplies fallback tuning.
 */
export function resolveSkeletalMageDefinition(rows: readonly unknown[]): SkeletalMageDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === AUTHORED_ID);
  if (matches.length !== 1) throw new Error('Expected exactly one authored Skeletal Mage');
  const row = matches[0];
  if (!validate(row) || row.id !== AUTHORED_ID || row.trigger !== 'active' || row.target !== 'summon' ||
    row.summon !== true || row.summonId !== 'skeletal_mage' || !row.summonBasicAttackElements) {
    throw new Error('Invalid authored Skeletal Mage');
  }
  const elements = Object.freeze([...row.summonBasicAttackElements]);
  return Object.freeze({ maxRank: row.maxLevel, elements, elementAt: (freshIndex: number): SkeletalMageElement => {
    if (!Number.isSafeInteger(freshIndex) || freshIndex < 0) {
      throw new RangeError('Skeletal Mage fresh index must be a nonnegative safe integer');
    }
    const element = elements[freshIndex % elements.length];
    if (element === undefined) throw new Error('Invalid immutable Skeletal Mage cycle');
    return element;
  } });
}

/** Immutable JSON-derived default, independent of the mutable catalog and registry. */
export const SKELETAL_MAGE_DEFINITION = resolveSkeletalMageDefinition(necromancerSkills);
