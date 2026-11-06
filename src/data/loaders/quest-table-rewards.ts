import Ajv2020 from 'ajv/dist/2020';
import profileJson from '../quest-rewards/act4-jamella-perfect-gem-v1.json';
import { compileAuthoredValidator } from '../authored-validators';
import { loadAwardPools } from './loot';
import { materialCatalog } from './materials';
import type { AwardDataPools, QuestTableRewardInput } from '@/engine/loot/award';
import type { TreasureClass } from '@/engine/loot/drop-roller';

/** Versioned quest-only table authority; ordinary treasure classes stay separate. */
export interface QuestTableRewardProfile {
  readonly version: 1;
  readonly input: Readonly<QuestTableRewardInput>;
  readonly table: Readonly<TreasureClass>;
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = compileAuthoredValidator<QuestTableRewardProfile>(ajv, 'questTable');
let cached: QuestTableRewardProfile | undefined;

/** Load the closed reviewed profile, deeply frozen before any reward is selected. */
export function loadJamellaQuestRewardProfile(): Readonly<QuestTableRewardProfile> {
  if (cached) return cached;
  const profile: unknown = profileJson;
  if (!validate(profile)) {
    throw new Error(`Invalid quest table profile: ${ajv.errorsText(validate.errors)}`);
  }
  if (profile.table.picks.some(pick => pick.itemId === undefined || materialCatalog.get(pick.itemId)?.kind !== 'gem')) {
    throw new Error('Invalid quest table profile: unknown concrete gem');
  }
  cached = Object.freeze({ version: 1,
    input: Object.freeze({ ...profile.input }),
    table: Object.freeze({ ...profile.table,
      picks: Object.freeze(profile.table.picks.map(pick => Object.freeze({ ...pick }))) })
  });
  return cached;
}

// Freezing a Map does not disable set/delete/clear. Keep the writable backing
// map private and expose only its ReadonlyMap operations, including forEach's map.
function readonlyMap<K, V>(source: ReadonlyMap<K, V>): ReadonlyMap<K, V> {
  const backing = new Map(source);
  const view: ReadonlyMap<K, V> = Object.freeze({
    get size() { return backing.size; },
    get: (key: K) => backing.get(key),
    has: (key: K) => backing.has(key),
    keys: () => backing.keys(),
    values: () => backing.values(),
    entries: () => backing.entries(),
    [Symbol.iterator]: () => backing[Symbol.iterator](),
    forEach: (callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown) => {
      backing.forEach((value, key) => { callback.call(thisArg, value, key, view); });
    }
  });
  return view;
}

/** Inject only the immutable quest table into normal award pools for this call. */
export function loadJamellaQuestAwardPools(): AwardDataPools {
  const profile = loadJamellaQuestRewardProfile();
  const pools = loadAwardPools();
  const tables = new Map(pools.treasureClasses);
  tables.set(profile.input.tableId, profile.table);
  return Object.freeze({ ...pools, treasureClasses: readonlyMap(tables) });
}
