/** Constructed native-Hell catalog/persistence coverage; no earned acquisition or balance claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { materialEconomy } from '@/data/loaders/materials';
import { loadItemBases } from '@/data/loaders/loot';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { matchRuneword, recipeFromData } from '@/engine/loot/runeword';
import { rollCurrencyDrops } from '@/engine/loot/orbs-and-currency';
import { socketBonusPackages } from '@/engine/items/socket-contents';
import { decodeSave } from '@/engine/save/validate';
import type { Rng } from '@/engine/rng';
import type { SaveCurrent } from '@/engine/types/save';
import type { Item } from '@/engine/types/items';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { useInventoryStore, useMapStore, usePlayerStore, useCombatStore, useMercStore } from './index';
import { abortSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, snapshotStores, flushSave, hydrateFromSave, useHydrationStore } from './persistence';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';

let disk: SaveCurrent | null = null;
vi.mock('./save-adapter', () => ({
  saveSave: (save: SaveCurrent) => { disk = structuredClone(save); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk && decodeSave(disk)),
  hasSave: () => Promise.resolve(disk !== null),
  deleteSave: () => { disk = null; return Promise.resolve(); }
}));
const stores = [useInventoryStore, useMapStore, usePlayerStore, useCombatStore, useMercStore] as const;
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  stores.forEach(store => { store.getState().reset(); });
}
beforeEach(() => {
  reset(); disk = null;
  usePlayerStore.getState().setPlayer(createMockPlayer('Constructed catalog crafter', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  const proof = campaignEvidence();
  useMapStore.setState({ questProgress: proof.questProgress, questReceipts: proof.questReceipts,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ questItems: proof.questItems });
  expect(selectReplayProfile('hell')).toBe('ok');
});
afterEach(reset);

function scripted(values: readonly number[]) {
  let draws = 0;
  const next = () => {
    const value = values[draws++];
    if (value === undefined) throw new Error('Unexpected extra RNG draw');
    return value;
  };
  const rng: Rng = { next, chance: probability => next() < probability,
    nextInt: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: () => { throw new Error('Unexpected RNG pick'); }, fork: () => { throw new Error('Unexpected RNG fork'); } };
  return { rng, draws: () => draws };
}

const total = materialEconomy.runeWeights.reduce((sum, weight) => sum + weight, 0);
const intervals = materialEconomy.runeOrder.map((id, index) => {
  const lower = materialEconomy.runeWeights.slice(0, index).reduce((sum, weight) => sum + weight, 0);
  const width = materialEconomy.runeWeights[index];
  if (width === undefined || width <= 0) throw new Error('Missing positive rune interval');
  // Interior probes avoid claiming that a rounded floating-point quotient is an exact mathematical boundary.
  return { id, probes: [(lower + .001) / total, (lower + width / 2) / total, (lower + width - .001) / total] };
});
describe('all33 production Hell rune intervals', () => {
  it('covers exactly33 authored identities with positive weights', () => {
    expect(intervals).toHaveLength(33);
    expect(new Set(intervals.map(row => row.id)).size).toBe(33);
    expect(materialEconomy.runeWeights).toHaveLength(33);
  });
  it.each(intervals)('$id is reachable throughout its interval with exactly the original three draws', ({ id, probes }) => {
    for (const unit of probes) {
      const source = scripted([unit, 0, .5]);
      const result = rollCurrencyDrops(82, 'boss', 5, useMapStore.getState().selectedDifficulty, 0, source.rng);
      expect(result.runes).toBe(1); expect(result.gems).toBe(1);
      expect(result.materials[id]).toBe(1);
      expect(Object.keys(result.materials).filter(key => key.startsWith('runes/'))).toEqual([id]);
      expect(source.draws()).toBe(3);
    }
  });
});

describe('all35 native Hell runewords', () => {
  it('covers the complete authored word catalog', () => { expect(socketRunewords).toHaveLength(35); });
  it.each(socketRunewords)('$id preserves ordered insertion, exact debit, effects and native Save/Continue', async word => {
    const recipe = recipeFromData(word);
    const base = [...loadItemBases().values()].find(candidate => (candidate.maxSockets ?? 0) >= word.sockets &&
      matchRuneword({ baseType: candidate.type, slot: candidate.slot,
        ...(candidate.weaponType ? { weaponType: candidate.weaponType } : {}),
        sockets: word.sockets, runes: word.runes, isWhiteBase: true }, [recipe]) === word.id);
    if (!base) throw new Error(`Missing compatible authored base for ${word.id}`);
    const item: Item = { id: 'constructed-' + word.id, baseId: base.id, rarity: 'normal',
      level: 1, ilvl: 99, identified: true, equipped: false, socketCapacity: word.sockets };
    const materials: Record<string, number> = {};
    for (const rune of word.runes) materials[rune] = (materials[rune] ?? 0) + 1;
    useInventoryStore.setState({ backpack: [item], materials, currencies: { 'rune-shard': 17 } });
    let last: ReturnType<typeof prepareLiveMaterialAction> | undefined;
    for (const [index, rune] of word.runes.entries()) {
      const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: [item.id], materialId: rune });
      const before = useInventoryStore.getState();
      expect(previewLiveMaterialAction(request).replay).toBe(false);
      expect(useInventoryStore.getState()).toBe(before);
      expect(executeLiveMaterialAction(request).replay).toBe(false);
      expect(useInventoryStore.getState().backpack[0]?.socketContents)
        .toEqual(word.runes.slice(0, index + 1).map(id => ({ kind: 'rune', id })));
      expect(useInventoryStore.getState().materialActionOrdinal).toBe(index + 1);
      last = request;
    }
    const completed = useInventoryStore.getState().backpack[0];
    if (!completed || !last) throw new Error('Missing completed live word');
    expect(completed).toMatchObject({ id: item.id, baseId: base.id, rarity: 'runeword', runewordId: word.id });
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 17 });
    expect(socketBonusPackages(completed, base).filter(effect => effect === word.stats)).toHaveLength(1);
    expect(Object.keys(word.stats).length).toBeGreaterThan(0);
    const beforeReplay = useInventoryStore.getState();
    expect(executeLiveMaterialAction(last).replay).toBe(true);
    expect(useInventoryStore.getState()).toBe(beforeReplay);
    const saved = snapshotStores();
    if (!saved) throw new Error('Missing native Hell snapshot');
    await flushSave(); stores.forEach(store => { store.getState().reset(); });
    expect(await hydrateFromSave()).toBe(true);
    const restored = snapshotStores();
    expect(restored?.version).toBe(32); expect(restored?.map.selectedDifficulty).toBe('hell');
    expect(restored?.map).toEqual(saved.map); expect(restored?.inventory).toEqual(saved.inventory);
    const restoredItem = useInventoryStore.getState().backpack[0];
    if (!restoredItem) throw new Error('Missing restored word');
    expect(socketBonusPackages(restoredItem, base)).toEqual(socketBonusPackages(completed, base));
    expect(executeLiveMaterialAction(last).replay).toBe(true);
  });
});
