import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestItemEntry } from '@/engine/types/save';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import countedDocument from '@/data/quests/counted-items.json';
import * as countedGraph from '@/engine/map/counted-quest';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { countedQuestCounters, allCountedQuestCounters } from './countedQuestActions';
import * as contract from './countedQuestContract';

const definitions = loadCountedQuestItems();
function mixedLedger() {
  const ledger: Record<string, QuestItemEntry> = {}, map = useMapStore.getState();
  for (const definition of definitions) {
    const consumed = definition.key === 'jade' || definition.key === 'jamella';
    const sources = consumed ? definition.sources : definition.sources.slice(0, 2);
    map.questProgress[definition.quest] = { id: definition.quest,
      status: consumed ? 'completed' : 'inProgress', rewardClaimed: definition.key === 'jamella',
      objectives: { [definition.objective]: consumed } };
    for (const source of sources) ledger[source] = {
      itemId: definition.itemId, state: consumed ? 'consumed' : 'owned' };
  }
  useInventoryStore.setState({ questItems: ledger });
}
function zeroCounts() {
  return definitions.map(definition => ({ definition,
    counts: { held: 0, consumed: 0, recovered: 0, total: definition.sources.length } }));
}

beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset();
});
afterEach(() => { vi.restoreAllMocks(); });

describe('counted counter batch', () => {
  it('checks the complete counted graph once per live read, including after in-place changes', () => {
    mixedLedger();
    const validation = vi.spyOn(countedGraph, 'validateCountedQuestGraphs');
    expect(() => { contract.validateLiveCountedQuestGraphs(); }).not.toThrow();
    expect(validation).toHaveBeenCalledTimes(1);
    const source = definitions[0]?.sources[0];
    if (!source) throw new Error('Missing fixture');
    const entry = useInventoryStore.getState().questItems[source];
    if (!entry) throw new Error('Missing source');
    Object.defineProperty(entry, 'state', { value: 'consumed' });
    expect(() => { contract.validateLiveCountedQuestGraphs(); }).toThrow();
    expect(validation).toHaveBeenCalledTimes(2);
  });

  it('rechecks authored definitions on the next live read and permits repair', () => {
    mixedLedger();
    expect(() => { contract.validateLiveCountedQuestGraphs(); }).not.toThrow();
    const placement = countedDocument.items[0]?.placements[0];
    if (!placement) throw new Error('Missing authored fixture');
    const source = placement.source;
    try {
      placement.source = 'invalid-source';
      expect(() => { contract.validateLiveCountedQuestGraphs(); }).toThrow();
    } finally { placement.source = source; }
    expect(() => { contract.validateLiveCountedQuestGraphs(); }).not.toThrow();
  });

  it('retains the full non-counted quest ledger check', () => {
    mixedLedger();
    useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
      'quests/act2-radaments-lair#reward:questItem': { itemId: 'items/book_of_skill', state: 'owned' } } }));
    expect(() => { contract.validateLiveCountedQuestGraphs(); }).toThrow();
    expect(allCountedQuestCounters()).toEqual(zeroCounts());
  });

  it('reads all five actual families under one complete validation without granting or consuming anything', () => {
    mixedLedger();
    const before = structuredClone({ ledger: useInventoryStore.getState().questItems,
      progress: useMapStore.getState().questProgress, receipts: useMapStore.getState().questReceipts });
    const validation = vi.spyOn(contract, 'validateLiveCountedQuestGraphs');
    const result = allCountedQuestCounters();
    expect(validation).toHaveBeenCalledTimes(1);
    expect(result).toEqual(definitions.map(definition => ({ definition, counts:
      definition.key === 'jade' || definition.key === 'jamella'
        ? { held: 0, consumed: definition.sources.length, recovered: definition.sources.length, total: definition.sources.length }
        : { held: 2, consumed: 0, recovered: 2, total: definition.sources.length } })));
    expect(result.map(row => row.counts)).toEqual(definitions.map(definition => countedQuestCounters(definition.key)));
    expect({ ledger: useInventoryStore.getState().questItems,
      progress: useMapStore.getState().questProgress, receipts: useMapStore.getState().questReceipts }).toEqual(before);
  });

  it('keeps source-free legacy history inert', () => {
    for (const definition of definitions) useMapStore.getState().questProgress[definition.quest] = {
      id: definition.quest, status: 'completed', rewardClaimed: true, objectives: { [definition.objective]: true } };
    expect(allCountedQuestCounters()).toEqual(zeroCounts());
  });

  it('revalidates in-place changes and recovers after repair without a stale successful projection', () => {
    mixedLedger();
    const ledger = useInventoryStore.getState().questItems;
    const definition = definitions.find(row => row.key === 'alkor');
    if (!definition?.sources[0]) throw new Error('Missing fixture');
    expect(allCountedQuestCounters().find(row => row.definition.key === 'alkor')?.counts.held).toBe(2);
    const entry = ledger[definition.sources[0]];
    if (!entry) throw new Error('Missing source');
    Object.defineProperty(entry, 'state', { value: 'consumed' });
    expect(allCountedQuestCounters()).toEqual(zeroCounts());
    Object.defineProperty(entry, 'state', { value: 'owned' });
    expect(useInventoryStore.getState().questItems).toBe(ledger);
    expect(allCountedQuestCounters().find(row => row.definition.key === 'alkor')?.counts.held).toBe(2);
  });

  it.each(['items', 'progress', 'receipts'] as const)('rejects %s accessors without reading them', domain => {
    mixedLedger(); let reads = 0;
    const target = domain === 'items' ? useInventoryStore.getState().questItems
      : domain === 'progress' ? useMapStore.getState().questProgress : useMapStore.getState().questReceipts;
    Object.defineProperty(target, 'injected', { configurable: true, enumerable: true, get: () => { reads++; return true; } });
    expect(allCountedQuestCounters()).toEqual(zeroCounts());
    expect(reads).toBe(0);
  });
});
