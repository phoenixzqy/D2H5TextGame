import { loadCountedQuestItems, type CountedQuestKey, type CountedQuestMetadata } from '@/data/loaders/counted-quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { loadJamellaQuestRewardProfile } from '@/data/loaders/quest-table-rewards';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { sameCainData } from './cainPublication';

/** Refuse accessors before snapshotting or comparing an observable participant. */
export function assertCountedData(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') throw new Error('Unsupported counted participant');
    return;
  }
  if (seen.has(value)) throw new Error('Cyclic counted participant');
  seen.add(value);
  if (value instanceof Map) {
    if (Object.getPrototypeOf(value) !== Map.prototype || Reflect.ownKeys(value).length !== 0) throw new Error('Invalid counted Map');
    for (const [key, entry] of value) { assertCountedData(key, seen); assertCountedData(entry, seen); }
  } else {
    const array = Array.isArray(value), prototype: unknown = Object.getPrototypeOf(value);
    if (!array && prototype !== Object.prototype && prototype !== null) throw new Error('Invalid counted object');
    for (const key of Reflect.ownKeys(value)) {
      const field = Object.getOwnPropertyDescriptor(value, key);
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || !field || !Object.hasOwn(field, 'value') || field.enumerable !== true) throw new Error('Invalid counted descriptor');
      assertCountedData(field.value, seen);
    }
  }
  seen.delete(value);
}

/** Deep backups are made only after descriptor-safe inspection. */
export function snapshotCountedData<T>(value: T): T { assertCountedData(value); return structuredClone(value); }

/** Replace owned keys without invoking descriptors injected during an observable publication. */
export function replaceCountedDataKeys<T>(current: Readonly<Record<string, T>>, values: Readonly<Record<string, NoInfer<T>>>, keys: readonly string[]): Record<string, T> {
  const descriptors = Object.getOwnPropertyDescriptors(current);
  for (const key of keys) {
    Reflect.deleteProperty(descriptors, key);
    const field = Object.getOwnPropertyDescriptor(values, key);
    if (field) {
      if (!Object.hasOwn(field, 'value') || field.enumerable !== true) throw new Error('Invalid counted replacement');
      const replacementValue: unknown = field.value as unknown;
      Object.defineProperty(descriptors, key, { value: { value: replacementValue, enumerable: true, configurable: true, writable: true }, enumerable: true, configurable: true, writable: true });
    }
  }
  return Object.defineProperties({}, descriptors) as Record<string, T>;
}

/** Compare data without executing an injected getter. */
export function sameCountedData(left: unknown, right: unknown): boolean {
  try { assertCountedData(left); assertCountedData(right); return sameCainData(left, right); } catch { return false; }
}

/** Exact immutable metadata lookup; no inferred suffix or item-name authority. */
export function countedQuestDefinition(key: CountedQuestKey): CountedQuestMetadata | undefined {
  return loadCountedQuestItems().find(row => row.key === key);
}

/** Reviewed complete bags, used only to reject live authored reward drift. */
export function countedQuestRewards(key: CountedQuestKey) {
  switch (key) {
    case 'gheed': return { xp: 1000, gemShards: 1, wishstones: 10 };
    case 'alkor': return { xp: 4500, statPoints: 5, wishstones: 10 };
    case 'jade': return { xp: 3500, runeShards: 1000, wishstones: 10 };
    case 'jamella': return { xp: 7000, lootTable: loadJamellaQuestRewardProfile().input, wishstones: 10 };
    case 'malah': return { xp: 9000, stat: { vitality: 10 }, wishstones: 10 };
  }
}

/** Canonical JSON is checked before any runtime reward/objective property reads. */
export function captureCountedQuestAuthority(key: CountedQuestKey) {
  const definition = countedQuestDefinition(key);
  if (!definition) throw new Error('Unknown counted quest');
  const quests = snapshotCountedData(loadQuests());
  const matches = quests.filter(row => row.id === definition.quest), quest = matches[0];
  const objective = quest?.objectives[0];
  if (matches.length !== 1 || !quest || quest.type !== 'side' || quest.actId !== definition.actId || quest.giver !== definition.npc
    || quest.objectives.length !== 1 || !objective || objective.id !== definition.objective || objective.type !== definition.objectiveType
    || objective.itemId !== definition.itemId || objective.areaId !== definition.areaId || objective.count !== definition.sources.length
    || definition.key === 'jade' && objective.npcId !== definition.npc
    || quest.prerequisites !== undefined || quest.objectiveStages !== undefined || quest.unlocks !== undefined
    || !sameCountedData(quest.rewards, countedQuestRewards(key))) throw new Error('Counted quest authority changed');
  const profile = key === 'jamella' ? loadJamellaQuestRewardProfile() : undefined;
  if (profile && (profile.input.tableId !== 'loot/side-jamella-perfect-gem'
    || profile.input.ilvl !== 51 || profile.input.picks !== 1)) throw new Error('Jamella profile changed');
  return { definition, quest, profile };
}

/** Recheck pinned immutable profile and every authored participating definition. */
export function sameCountedQuestAuthority(before: ReturnType<typeof captureCountedQuestAuthority>): boolean {
  try {
    const now = captureCountedQuestAuthority(before.definition.key);
    return sameCountedData(now.definition, before.definition) && now.profile === before.profile && sameCountedData(now.quest, before.quest);
  } catch { return false; }
}

/** The family graph is validated before accessing even an already-claimed row. */
export function validateLiveCountedQuestGraphs(): void {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  assertCountedData(map.questProgress); assertCountedData(items); assertCountedData(map.questReceipts);
  // The full live ledger check also loads and validates the current counted graph.
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
}
