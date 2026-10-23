import { isMaterialLedger } from '../loot/materials';
import type { CraftingBag } from '@/data/loaders/material-recipes';

/** One closed persisted outcome; exact latest retry never consumes its inputs again. */
export interface MaterialActionReceipt {
  readonly ordinal: number;
  readonly requestHash: string;
  readonly result: CraftingBag & { readonly itemId?: string };
}

/** Read an own enumerable data field without invoking imported accessors. */
export function actionData(value: object, key: string): unknown {
  const field = Object.getOwnPropertyDescriptor(value, key);
  if (!field) {
    if (key in value) throw new Error('Inherited material action field');
    return undefined;
  }
  if (!field.enumerable || !Object.hasOwn(field, 'value')) throw new Error('Invalid material action descriptor');
  return field.value as unknown;
}

function closedRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null)) return false;
  const keys = Reflect.ownKeys(value);
  return required.every(key => Object.hasOwn(value, key)) && keys.every(key => typeof key === 'string'
    && (required.includes(key) || optional.includes(key))
    && Object.getOwnPropertyDescriptor(value, key)?.enumerable
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
}

/** Closed positive output currency map; no wishstones or arbitrary historical keys. */
export function isCraftingCurrencies(value: unknown): value is CraftingBag['currencies'] {
  return closedRecord(value, [], ['rune-shard', 'gem-shard']) && Object.values(value).every(count =>
    typeof count === 'number' && Number.isSafeInteger(count) && count > 0);
}

/** Validate native latest receipt structure, exact output catalogs, safe counts and canonical hash. */
export function isMaterialActionReceipt(value: unknown): value is MaterialActionReceipt {
  if (!closedRecord(value, ['ordinal', 'requestHash', 'result'])) return false;
  const result = value.result;
  return typeof value.ordinal === 'number' && Number.isSafeInteger(value.ordinal) && value.ordinal > 0
    && typeof value.requestHash === 'string' && /^[a-f0-9]{64}$/.test(value.requestHash)
    && closedRecord(result, ['materials', 'currencies'], ['itemId'])
    && (!Object.hasOwn(result, 'itemId') || typeof result.itemId === 'string' && result.itemId.length > 0)
    && isMaterialLedger(result.materials) && isCraftingCurrencies(result.currencies);
}

/** Native ordinal0 iff receipt absent; positive ordinal requires one matching closed latest receipt. */
export function readMaterialActionState(inventory: object): { readonly ordinal: number; readonly receipt?: MaterialActionReceipt } {
  const ordinal = actionData(inventory, 'materialActionOrdinal');
  if (typeof ordinal !== 'number' || !Number.isSafeInteger(ordinal) || ordinal < 0) throw new Error('Invalid material action ordinal');
  const receipt = actionData(inventory, 'latestMaterialAction');
  if (ordinal === 0) {
    if ('latestMaterialAction' in inventory) throw new Error('Unexpected initial material action receipt');
    return { ordinal };
  }
  if (!isMaterialActionReceipt(receipt) || receipt.ordinal !== ordinal) throw new Error('Invalid latest material action receipt');
  return { ordinal, receipt };
}

/**
 * Canonical lossless preimage for native items and frozen recovery provenance.
 * Explicit type tags distinguish Maps, arrays and records; ordered arrays stay
 * ordered, record/Map keys are stable, and absent fields differ from undefined.
 * Reject hidden/accessor data and cycles without evaluating imported getters.
 */
export function canonicalActionValue(value: unknown): string {
  const ancestors = new Set<object>();
  const encode = (node: unknown): unknown => {
    if (node === undefined) return ['undefined'];
    if (node === null || typeof node === 'boolean' || typeof node === 'string') return node;
    if (typeof node === 'number') {
      if (!Number.isFinite(node)) throw new Error('Nonfinite action preimage');
      return Object.is(node, -0) ? ['number', '-0'] : node;
    }
    if (typeof node !== 'object' || ancestors.has(node)) throw new Error('Unsupported or cyclic action preimage');
    ancestors.add(node);
    try {
      if (node instanceof Map) {
        if (Object.getPrototypeOf(node) !== Map.prototype || Reflect.ownKeys(node).length) throw new Error('Invalid preimage Map');
        const entries = [...node.entries()] as [unknown, unknown][];
        if (entries.some(([key]) => typeof key !== 'string')) throw new Error('Invalid preimage Map key');
        return ['map', entries.map(([key, entry]) => [key, encode(entry)]).sort((a, b) => String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0)];
      }
      if (Array.isArray(node)) {
        if (Reflect.ownKeys(node).length !== node.length + 1) throw new Error('Invalid preimage array');
        return ['array', Array.from({ length: node.length }, (_, i) => {
          if (!Object.hasOwn(node, String(i))) throw new Error('Sparse preimage array');
          return encode(actionData(node, String(i)));
        })];
      }
      if (Object.getPrototypeOf(node) !== Object.prototype && Object.getPrototypeOf(node) !== null) throw new Error('Invalid preimage record');
      const keys = Reflect.ownKeys(node);
      if (keys.some(key => typeof key !== 'string')) throw new Error('Invalid preimage key');
      return ['object', (keys as string[]).sort().map(key => [key, encode(actionData(node, key))])];
    } finally {
      ancestors.delete(node);
    }
  };
  return JSON.stringify(encode(value));
}
