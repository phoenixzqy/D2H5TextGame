import type Ajv from 'ajv';
import type { AnySchema, ValidateFunction } from 'ajv';

export type PrecompiledSaveSchema = 'current33' | 'frozen32' | 'ledger';

// Build-time capture of the exact assembled schemas; never a save-result cache.
export const precompiledSaveSchemas: Partial<Record<PrecompiledSaveSchema, AnySchema>> = {};

/** SSR retains the original compiler; Vite replaces only the browser factory. */
export function lazySaveValidator<T>(ajv: Ajv, schema: AnySchema,
  key?: PrecompiledSaveSchema): () => ValidateFunction<T> {
  if (key) precompiledSaveSchemas[key] = schema;
  let check: ValidateFunction<T> | undefined;
  return () => (check ??= ajv.compile<T>(schema));
}
