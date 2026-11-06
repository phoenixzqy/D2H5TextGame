import Ajv2020 from 'ajv/dist/2020';
import data from '../../data/combat/plague.json';
import { compileAuthoredValidator } from '../../data/authored-validators';

/** Authored Poison death spread and the paid max-stack Plague combo. */
export interface PlagueDefinition {
  readonly id: 'combat/plague';
  readonly poisonStacksForEpidemic: number;
  readonly ordinarySpreadFraction: number;
  readonly epidemicSpreadFraction: number;
}

const validate = compileAuthoredValidator<PlagueDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'plague');

/** Validate and copy tuning; caller data stays mutable and cannot change the result. */
export function resolvePlagueDefinition(source: unknown): PlagueDefinition {
  if (!validate(source) || source.epidemicSpreadFraction < source.ordinarySpreadFraction) {
    throw new Error('Invalid combat Plague definition');
  }
  return Object.freeze({ id: source.id, poisonStacksForEpidemic: source.poisonStacksForEpidemic,
    ordinarySpreadFraction: source.ordinarySpreadFraction, epidemicSpreadFraction: source.epidemicSpreadFraction });
}

/** Immutable JSON-derived defaults; cast/death authority remains battle-local. */
export const PLAGUE_DEFINITION = resolvePlagueDefinition(data);
