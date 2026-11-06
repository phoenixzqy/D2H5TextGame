import Ajv2020 from 'ajv/dist/2020';
import chill from '../../data/combat/chill.json';
import { compileAuthoredValidator } from '../../data/authored-validators';

/** Authored multiplier for the attack-speed stat of every actively chilled unit. */
export interface ChillDefinition {
  readonly id: 'combat/chill';
  readonly attackSpeedMultiplier: number;
}

const validate = compileAuthoredValidator<ChillDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'chill');

/** Validate and copy configuration without retaining or freezing caller data. */
export function resolveChillDefinition(source: unknown): ChillDefinition {
  if (!validate(source)) throw new Error('Invalid combat Chill definition');
  return Object.freeze({ id: source.id, attackSpeedMultiplier: source.attackSpeedMultiplier });
}

/** JSON-derived coefficient; scheduling integration is a separate child. */
export const CHILL_DEFINITION = resolveChillDefinition(chill);
