import Ajv2020 from 'ajv/dist/2020';
import { compileAuthoredValidator } from '../authored-validators';
import data from '../vendors/anya-uniques-v1.json';

export type AnyaTradeEntryId = 'frostburn-gauntlet' | 'waterwalk';
/** Closed, fixed-price lifetime trade; selection never allocates an item. */
export interface AnyaUniqueEntry {
  readonly id: AnyaTradeEntryId;
  readonly uniqueId: 'items/unique/frostburn-gauntlet' | 'items/unique/waterwalk';
  readonly ilvl: 66;
  readonly stock: 1;
  readonly costs: { readonly materials: { readonly 'materials/scrap': 40 };
    readonly currencies: { readonly 'rune-shard': 2000 } };
}
export interface AnyaUniqueCatalog {
  readonly id: 'vendors/anya_uniques';
  readonly version: 1;
  readonly entries: readonly AnyaUniqueEntry[];
}
const validate = compileAuthoredValidator<AnyaUniqueCatalog>(new Ajv2020({ strict: true, allErrors: true }), 'anya');
function jsonData(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  seen.add(value);
  const array = Array.isArray(value), prototype: unknown = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every(key => {
    if (array && key === 'length') return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value') && jsonData(descriptor.value, seen);
  });
}
/** Validate own JSON descriptors before Ajv, then pin exact ordered output identities. */
export function validateAnyaUniqueCatalog(value: unknown): AnyaUniqueCatalog {
  if (!jsonData(value) || !validate(value) || value.entries.some((entry, index) =>
    entry.id !== (index === 0 ? 'frostburn-gauntlet' : 'waterwalk') || entry.uniqueId !== `items/unique/${entry.id}`)) {
    throw new Error('Invalid Anya unique catalog');
  }
  return value;
}
/** The authored catalog remains identity-stable for stale-selection checks. */
export function loadAnyaUniqueCatalog(): AnyaUniqueCatalog { return validateAnyaUniqueCatalog(data); }
