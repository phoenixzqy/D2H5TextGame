import { loadCountedQuestItems, resolveCountedQuestSource, type CountedQuestKey, type CountedQuestLookup, type CountedQuestMetadata } from '@/data/loaders/counted-quest-items';
import { countCountedQuestSources, type CountedQuestCounts } from '@/engine/map/counted-quest';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { captureCountedQuestAuthority, countedQuestDefinition, sameCountedQuestAuthority, validateLiveCountedQuestGraphs } from './countedQuestContract';
import { publishCountedQuestSourceChange } from './countedQuestPublication';
import { questActionPreflight, withQuestTransaction } from './questTransaction';

export type CountedActionRefusal = 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress'
  | 'wrong-difficulty' | 'wrong-location' | 'act-locked' | 'quest-not-tracked' | 'already-claimed' | 'invalid-state';
export type CountedSourceStatus = 'available' | 'owned' | 'consumed' | 'unknown-source' | CountedActionRefusal;
export type CountedSourceResult = 'ok' | 'already-recovered' | 'unknown-source' | CountedActionRefusal | 'grant-failed';
export type CountedJadeGiveStatus = 'available' | 'missing-items' | 'delivered' | CountedActionRefusal;
export type CountedJadeGiveResult = 'ok' | 'already-delivered' | 'missing-items' | CountedActionRefusal | 'grant-failed';
export type CountedQuestAreaSource = Readonly<CountedQuestLookup & { ordinal: number }>;
export type CountedQuestCounter = Readonly<{ definition: CountedQuestMetadata; counts: CountedQuestCounts }>;

/** Discover authored objects even when their explicit action is currently disabled. */
export function areaCountedQuestSources(areaId: string): readonly CountedQuestAreaSource[] {
  return loadCountedQuestItems().filter(definition => definition.areaId === areaId).flatMap(definition =>
    definition.placements.map((placement, index) => Object.freeze({ definition, placement, ordinal: index + 1 })));
}

/** Counters are projections of exact physical source identities, never saved fields. */
export function countedQuestCounters(key: CountedQuestKey): CountedQuestCounts {
  const definition = countedQuestDefinition(key);
  if (!definition) return { held: 0, consumed: 0, recovered: 0, total: 0 };
  try { validateLiveCountedQuestGraphs(); return countCountedQuestSources(useInventoryStore.getState().questItems, definition); }
  catch { return { held: 0, consumed: 0, recovered: 0, total: definition.sources.length }; }
}

/** Project every family under one complete live check; no validation is reused across reads. */
export function allCountedQuestCounters(): readonly CountedQuestCounter[] {
  const definitions = loadCountedQuestItems();
  try {
    validateLiveCountedQuestGraphs();
    const items = useInventoryStore.getState().questItems;
    return definitions.map(definition => ({ definition, counts: countCountedQuestSources(items, definition) }));
  } catch {
    return definitions.map(definition => ({ definition,
      counts: { held: 0, consumed: 0, recovered: 0, total: definition.sources.length } }));
  }
}

/** This context check is safe inside the existing quest lease. */
export function countedOrdinaryRefusal(): 'not-ready' | 'no-player' | 'combat-active' | null {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  return hasActiveSubAreaRun() || useCombatStore.getState().inCombat ? 'combat-active' : null;
}

function locationRefusal(definition: CountedQuestMetadata, give: boolean): CountedActionRefusal | null {
  const ordinary = countedOrdinaryRefusal(); if (ordinary) return ordinary;
  const map = useMapStore.getState(), act = Number(definition.actId.slice('acts/act'.length));
  if (map.selectedDifficulty !== 'normal') return 'wrong-difficulty';
  if (!map.isActUnlocked(act)) return 'act-locked';
  // Town navigation keeps the last explored area; Meshif's actual panel supplies the town context.
  if (map.currentAct !== act || !give && map.currentSubAreaId !== definition.areaId) return 'wrong-location';
  return null;
}

function trackingRefusal(definition: CountedQuestMetadata): CountedActionRefusal | null {
  const map = useMapStore.getState(), row = map.questProgress[definition.quest];
  if (!Object.hasOwn(map.questProgress, definition.quest) || !row || row.status !== 'inProgress' && row.status !== 'completed') return 'quest-not-tracked';
  if (row.id !== definition.quest || Object.keys(row.objectives).length !== 1 || typeof row.objectives[definition.objective] !== 'boolean'
    || row.objectives[definition.objective] !== (row.status === 'completed')) return 'invalid-state';
  return row.rewardClaimed === true ? 'already-claimed' : null;
}

function sourceStatus(source: string, leased: boolean): CountedSourceStatus {
  try {
    const found = resolveCountedQuestSource(source); if (!found) return 'unknown-source';
    validateLiveCountedQuestGraphs(); captureCountedQuestAuthority(found.definition.key);
    const items = useInventoryStore.getState().questItems;
    if (Object.hasOwn(items, source)) return items[source]?.state === 'consumed' ? 'consumed' : 'owned';
    if (!leased) { const refusal = questActionPreflight(); if (refusal) return refusal; }
    const refusal = locationRefusal(found.definition, false) ?? trackingRefusal(found.definition); if (refusal) return refusal;
    return 'available';
  } catch { return 'invalid-state'; }
}

/** Read-only availability, with exact localized refusal reasons for the object control. */
export function countedSourceStatus(source: string): CountedSourceStatus { return sourceStatus(source, false); }

/** Recover one literal source, completing collection only with the final physical item. */
export function recoverCountedQuestSource(source: string): CountedSourceResult {
  const preflight = questActionPreflight(); if (preflight) return preflight;
  return withQuestTransaction<CountedSourceResult>(() => {
    const status = sourceStatus(source, true);
    if (status === 'owned' || status === 'consumed') return 'already-recovered';
    if (status !== 'available') return status;
    const found = resolveCountedQuestSource(source); if (!found) return 'unknown-source';
    const definition = found.definition, authority = captureCountedQuestAuthority(definition.key);
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(), row = map.questProgress[definition.quest];
    if (!row) return 'quest-not-tracked';
    const items = { ...inventory.questItems, [source]: { itemId: definition.itemId, state: 'owned' as const } };
    const complete = definition.sink === 'claim' && countCountedQuestSources(items, definition).held === definition.sources.length;
    const next = complete ? { ...row, status: 'completed' as const, objectives: { [definition.objective]: true } } : { ...row };
    return publishCountedQuestSourceChange(definition, next, items,
      () => locationRefusal(definition, false) === null && sameCountedQuestAuthority(authority));
  });
}

function jadeStatus(leased: boolean): CountedJadeGiveStatus {
  try {
    const definition = countedQuestDefinition('jade'); if (!definition) return 'invalid-state';
    validateLiveCountedQuestGraphs(); captureCountedQuestAuthority('jade');
    const counts = countCountedQuestSources(useInventoryStore.getState().questItems, definition);
    if (counts.consumed === counts.total) return 'delivered';
    if (!leased) { const refusal = questActionPreflight(); if (refusal) return refusal; }
    const refusal = locationRefusal(definition, true) ?? trackingRefusal(definition); if (refusal) return refusal;
    return counts.held === counts.total ? 'available' : 'missing-items';
  } catch { return 'invalid-state'; }
}

/** Actual Meshif Give remains separate from the later whole-bag journal Claim. */
export function countedJadeGiveStatus(): CountedJadeGiveStatus { return jadeStatus(false); }

/** Consume all three exact Jade ingredients without paying any reward. */
export function giveCountedJade(): CountedJadeGiveResult {
  const preflight = questActionPreflight(); if (preflight) return preflight;
  return withQuestTransaction<CountedJadeGiveResult>(() => {
    const status = jadeStatus(true);
    if (status === 'delivered') return 'already-delivered';
    if (status !== 'available') return status;
    const definition = countedQuestDefinition('jade'); if (!definition) return 'invalid-state';
    const authority = captureCountedQuestAuthority('jade'), map = useMapStore.getState(), row = map.questProgress[definition.quest];
    if (!row) return 'quest-not-tracked';
    const items = { ...useInventoryStore.getState().questItems };
    for (const source of definition.sources) items[source] = { itemId: definition.itemId, state: 'consumed' };
    return publishCountedQuestSourceChange(definition,
      { ...row, status: 'completed', objectives: { [definition.objective]: true } }, items,
      () => locationRefusal(definition, true) === null && sameCountedQuestAuthority(authority));
  });
}
