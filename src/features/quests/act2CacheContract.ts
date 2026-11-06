import mainDocument from '@/data/quests/main.json';
import sideDocument from '@/data/quests/side.json';
import itemDocument from '@/data/quests/items.json';
import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { ACT2_CACHES, ACT2_CACHE_DOMAINS, validateAct2CacheGraphs, type Act2CacheKey } from '@/engine/map/act2-cache-quests';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { assertCountedData, sameCountedData, snapshotCountedData } from './countedQuestContract';

function onlyKeys(value: object, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) &&
    Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}

/** Descriptor-safe complete authored authority, never caller-configurable rewards. */
export function captureAct2CacheAuthority(key: Act2CacheKey) {
  const tuple = ACT2_CACHES[key];
  // Inspect raw participating documents BEFORE Ajv/loader property reads.
  assertCountedData(mainDocument); assertCountedData(sideDocument); assertCountedData(itemDocument);
  const quests = snapshotCountedData(loadQuests());
  const items = snapshotCountedData(loadQuestItems());
  const matches = quests.filter(row => row.id === tuple.quest), itemMatches = items.filter(row => row.id === tuple.itemId);
  const quest = matches[0], item = itemMatches[0], objective = quest?.objectives[0];
  if (matches.length !== 1 || itemMatches.length !== 1 || !quest || !item ||
    !onlyKeys(quest, ['id', 'name', 'type', 'actId', 'giver', 'description', 'objectives', 'rewards'], ['order']) ||
    quest.type !== 'side' || quest.actId !== tuple.actId || quest.giver !== tuple.npc || quest.objectives.length !== 1 ||
    !objective || !onlyKeys(objective, ['id', 'type', 'description', 'itemId', 'areaId', 'targetId']) ||
    objective.id !== tuple.objective || objective.type !== 'fetch' || objective.itemId !== tuple.itemId ||
    objective.areaId !== tuple.areaId || objective.targetId !== tuple.targetId ||
    !sameCountedData(quest.rewards, { xp: tuple.xp, itemDrop: { uniqueId: tuple.uniqueId, ilvl: tuple.ilvl }, wishstones: 10 }) ||
    !onlyKeys(item, ['id', 'kind', 'sourceQuestId', 'sourceObjectiveId', 'nameKey', 'descKey']) ||
    item.kind !== 'tool' || item.sourceQuestId !== tuple.quest || item.sourceObjectiveId !== tuple.objective ||
    questItemSource(item) !== tuple.source || typeof item.nameKey !== 'string' || !item.nameKey ||
    typeof item.descKey !== 'string' || !item.descKey ||
    quest.order !== undefined && (!Number.isSafeInteger(quest.order) || quest.order < 0)) {
    throw new Error('Cache exact authored authority changed');
  }
  return { key, tuple, quest, item };
}

/** Pin both the exact reward/source definitions and every loaded participating field. */
export function sameAct2CacheAuthority(before: ReturnType<typeof captureAct2CacheAuthority>): boolean {
  try { return sameCountedData(captureAct2CacheAuthority(before.key), before); }
  catch { return false; }
}

/** Root-owned successor admission must be installed before this draft is activated. */
export function validateLiveAct2CacheGraphs(): void {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  validateAct2CacheGraphs(map.questProgress, items, ACT2_CACHE_DOMAINS);
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
}
