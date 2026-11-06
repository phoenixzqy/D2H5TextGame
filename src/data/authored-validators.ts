import type Ajv2020 from 'ajv/dist/2020';
import type { ValidateFunction } from 'ajv';
import { authoredSchemas, authoredFirstErrorSchemas } from './authored-schemas';

/** Use the caller's original compiler on SSR; Vite precompiles browser validators. */
export function compileAuthoredValidator<T>(
  ajv: Ajv2020,
  name: keyof typeof authoredSchemas
): ValidateFunction<T> {
  return ajv.compile<T>(authoredSchemas[name]);
}

/** Preserve first-error caller options on SSR and in generated browser checks. */
export function compileFirstErrorAuthoredValidator<T>(
  ajv: Ajv2020,
  name: keyof typeof authoredFirstErrorSchemas
): ValidateFunction<T> {
  return ajv.compile<T>(authoredFirstErrorSchemas[name]);
}
