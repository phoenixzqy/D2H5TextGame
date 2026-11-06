import Ajv2020 from 'ajv/dist/2020';
import mitigation from '../../data/combat/mitigation.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { MonsterTier } from './types';

/** JSON-authored independent flat magical mitigation defaults. */
export interface MitigationDefinition {
  readonly id: 'combat/mitigation';
  readonly friendlyBase: Readonly<Record<'player' | 'mercenary' | 'summon', number>>;
  readonly monster: {
    readonly base: number;
    readonly growthPerLevel: number;
    readonly tierMultipliers: Readonly<Record<MonsterTier, number>>;
  };
}

const validate = compileAuthoredValidator<MitigationDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'mitigation');

/** Validate and deeply copy the policy without freezing or retaining caller objects. */
export function resolveMitigationDefinition(source: unknown): MitigationDefinition {
  if (!validate(source)) throw new Error('Invalid combat mitigation definition');
  return Object.freeze({
    id: source.id,
    friendlyBase: Object.freeze({ ...source.friendlyBase }),
    monster: Object.freeze({
      base: source.monster.base,
      growthPerLevel: source.monster.growthPerLevel,
      tierMultipliers: Object.freeze({ ...source.monster.tierMultipliers })
    })
  });
}

/** One validated policy shared by stat constructors, combat and compatibility. */
export const MITIGATION_DEFINITION = resolveMitigationDefinition(mitigation);
