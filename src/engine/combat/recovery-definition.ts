import Ajv2020 from 'ajv/dist/2020';
import recovery from '../../data/combat/recovery.json';
import schema from '../../data/schema/recovery.schema.json';

/** Authored hero recovery baseline; applying it to combat is a separate step. */
export interface RecoveryDefinition {
  readonly id: 'combat/recovery';
  readonly heroManaPerEffectiveEnergyPerSecond: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<RecoveryDefinition>(schema);

/** Validate and copy a recovery config without retaining or freezing caller data. */
export function resolveRecoveryDefinition(source: unknown): RecoveryDefinition {
  if (!validate(source)) throw new Error('Invalid combat recovery definition');
  return Object.freeze({
    id: source.id,
    heroManaPerEffectiveEnergyPerSecond: source.heroManaPerEffectiveEnergyPerSecond
  });
}

/** Single JSON-derived baseline; no combat resource changes occur on import. */
export const RECOVERY_DEFINITION = resolveRecoveryDefinition(recovery);
