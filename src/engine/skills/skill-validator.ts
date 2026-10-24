import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import schema from '../../data/schema/skill.schema.json';

const ajv = new Ajv2020({ strict: true, allErrors: true });

/**
 * Reuse compiled skill-schema code while preserving each resolver's source type.
 * Ajv caches by schema identity; validation still runs on every supplied row.
 * As with Ajv normally, `errors` describes the most recent synchronous call.
 */
export function createSkillValidator<T>(): ValidateFunction<T> {
  return ajv.compile<T>(schema);
}
