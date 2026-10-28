/**
 * Intended destination: src/stores/hell-live-materials.test.ts.
 * Constructed source graphs/materials only; no earned-acquisition or pacing claim.
 * Uses present live APIs so the predecessor gives behavioral failures.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { materialEconomy } from '@/data/loaders/materials';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { THRONE_PROOF } from '@/engine/map/act5-admission';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { abortSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from './persistence';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';

vi.mock('./save-adapter', async importOriginal => ({
  ...await importOriginal<typeof import('./save-adapter')>(), saveSave: vi.fn(() => Promise.resolve())
}));
const stores = [useInventoryStore, useMapStore, usePlayerStore, useCombatStore, useMercStore] as const;
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function qualified(nightmare = false): void {
  const proof = campaignEvidence();
  useMapStore.setState({ questProgress: proof.questProgress, questReceipts: proof.questReceipts,
    questDifficulties: nightmare ? { 'difficulty/nightmare': true } : {},
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ questItems: proof.questItems });
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Constructed Hell crafter', 'sorceress'));
  useInventoryStore.setState({ materials: { 'runes/el': 3 } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('source-backed live Hell crafting', () => {
  it('executes all32 guarded Hell fusion transitions at exact3:1 cost, once per prepared request', () => {
    qualified();
    expect(useMapStore.getState().questDifficulties).toEqual({});
    expect(selectReplayProfile('hell')).toBe('ok');
    expect(useMapStore.getState().selectedDifficulty).toBe('hell');
    expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
    const order = materialEconomy.runeOrder;
    expect(order).toHaveLength(33);
    for (let index = 0; index < order.length - 1; index++) {
      const input = order[index], output = order[index + 1];
      if (!input || !output) throw new Error('Missing authored fusion interval');
      useInventoryStore.setState({ materials: { [input]: 3 } });
      const request = prepareLiveMaterialAction({ recipeId: `recipes/rune-fusion/${input.slice(6)}` });
      const before = useInventoryStore.getState();
      expect(previewLiveMaterialAction(request)).toMatchObject({ replay: false,
        result: { materials: { [output]: 1 }, currencies: {} } });
      expect(useInventoryStore.getState()).toBe(before);
      expect(executeLiveMaterialAction(request).replay).toBe(false);
      expect(useInventoryStore.getState().materials).toEqual({ [output]: 1 });
      expect(useInventoryStore.getState().materialActionOrdinal).toBe(index + 1);
      const published = useInventoryStore.getState();
      expect(executeLiveMaterialAction(request).replay).toBe(true);
      expect(useInventoryStore.getState()).toBe(published);
    }
    const saved = snapshotStores();
    if (!saved) throw new Error('Missing constructed save');
    expect(saved.version).toBe(24);
    expect(decodeSave(toJsonSafe(saved)).inventory).toEqual(saved.inventory);
    expect(saved.inventory.materials).toEqual({ 'runes/zod': 1 });
  });

  it.each(['normal', 'nightmare'] as const)('retains the Um output cap in actual %s', profile => {
    qualified(true); expect(selectReplayProfile(profile)).toBe('ok');
    useInventoryStore.setState({ materials: { 'runes/pul': 3 } });
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/pul' });
    expect(executeLiveMaterialAction(request).result.materials).toEqual({ 'runes/um': 1 });
    useInventoryStore.setState({ materials: { 'runes/um': 3 } });
    const before = useInventoryStore.getState();
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/um' })).toThrow();
    expect(useInventoryStore.getState()).toBe(before);
  });

  it.each(['no-proof', 'missing-throne', 'loose-claimed-flags'])(
    'refuses a forged Hell preference at live preparation: %s', fault => {
      if (fault !== 'no-proof') qualified();
      if (fault === 'missing-throne') useMapStore.setState(state => {
        const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, THRONE_PROOF);
        return { questReceipts: receipts };
      });
      if (fault === 'loose-claimed-flags') useMapStore.setState({ questReceipts: {} });
      useMapStore.setState({ selectedDifficulty: 'hell' });
      const before = useInventoryStore.getState(), map = useMapStore.getState();
      expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' })).toThrow();
      expect(useInventoryStore.getState()).toBe(before); expect(useMapStore.getState()).toBe(map);
    });

  it.each(['preview', 'execute'] as const)('rechecks lost Hell authority during %s without consuming inventory', operation => {
    qualified(); expect(selectReplayProfile('hell')).toBe('ok');
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    useMapStore.setState({ questReceipts: {} });
    const before = useInventoryStore.getState();
    expect(() => operation === 'preview' ? previewLiveMaterialAction(request) : executeLiveMaterialAction(request)).toThrow();
    expect(useInventoryStore.getState()).toBe(before);
  });

  it.each(['preview', 'execute'] as const)('refuses a retained otherwise-eligible request after profile change during %s', operation => {
    qualified(true); expect(selectReplayProfile('normal')).toBe('ok');
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    expect(selectReplayProfile('nightmare')).toBe('ok');
    const before = useInventoryStore.getState();
    expect(() => operation === 'preview' ? previewLiveMaterialAction(request) : executeLiveMaterialAction(request)).toThrow();
    expect(useInventoryStore.getState()).toBe(before);
    const fresh = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    expect(executeLiveMaterialAction(fresh).result.materials).toEqual({ 'runes/eld': 1 });
  });
});
