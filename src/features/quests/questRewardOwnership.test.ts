import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(), deleteSave: vi.fn() }));
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore, useMercStore, usePlayerStore, useMapStore } from '@/stores';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { captureQuestRewardOwnership } from './questRewardOwnership';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';

const item = (id: string, equipped = false): Item => ({ id, baseId: 'items/base/amu-obsidian', rarity: 'normal',
  level: 1, identified: true, affixes: [], equipped, ...(equipped ? { equipSlot: 'amulet' as const } : {}) });
const inv = () => useInventoryStore.getState(), mercs = () => useMercStore.getState();
const stops: (() => void)[] = [];
beforeEach(() => {
  __resetPersistenceForTests(); [useInventoryStore, useMercStore, usePlayerStore, useMapStore].forEach(store => { store.getState().reset(); });
  const player = createMockPlayer('Ownership journal', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, equipment: [] });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); __resetPersistenceForTests(); });

describe('created quest reward physical ownership journal', () => {
  it.each(['backpack', 'stash', 'hero', 'orphan', 'legacy', 'socket', 'mirror'] as const)('removes its renamed reference from %s, preserving independent collisions and metadata', destination => {
    const independent = item('collision'), reward = item('reward');
    useInventoryStore.setState({ backpack: [independent] });
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose); ownership.preflight();
    Object.assign(reward, { id: 'collision', baseId: 'items/base/helm-cap' });
    if (destination === 'backpack') useInventoryStore.setState({ backpack: [independent, reward] });
    if (destination === 'stash') useInventoryStore.setState({ stash: [reward] });
    if (destination === 'hero') useInventoryStore.setState({ equipped: { amulet: reward } });
    if (destination === 'orphan') useMercStore.setState({ mercEquipment: { orphan: { amulet: reward } } });
    if (destination === 'legacy') useInventoryStore.setState({ legacyGearQuarantine: [{ item: reward, origin: { container: 'stash', index: 42 } }] });
    if (destination === 'socket') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: reward, origin: { container: 'stash', index: 7 } }] });
    if (destination === 'mirror') usePlayerStore.setState(state => ({ player: state.player && { ...state.player, equipment: [reward] } }));
    ownership.restore();
    expect(inv().backpack).toEqual([independent]); expect(inv().stash).toEqual([]);
    expect(inv().equipped).toEqual({}); expect(inv().legacyGearQuarantine).toEqual([]); expect(inv().socketQuarantine).toEqual([]);
    expect(Object.values(mercs().mercEquipment).flatMap(Object.values).filter(Boolean)).toEqual([]);
    expect(usePlayerStore.getState().player?.equipment).toEqual([]);
  });
  it.each(['hero', 'orphan'] as const)('recovers displaced %s gear once when a nested observer removes the reward and fills its old slot independently', destination => {
    const original = { ...item('original', true), affixes: [{ affixId: 'legacy', values: new Map([['life', 13]]) }] };
    const independent = item('independent', true), reward = item('reward');
    if (destination === 'hero') useInventoryStore.setState({ equipped: { amulet: original } });
    else useMercStore.setState({ mercEquipment: { orphan: { amulet: original } } });
    let nested = false;
    const fill = () => {
      if (nested) return;
      const current = destination === 'hero' ? inv().equipped.amulet : mercs().mercEquipment.orphan?.amulet;
      if (current?.id !== reward.id) return; nested = true;
      if (destination === 'hero') useInventoryStore.setState({ equipped: { amulet: independent } });
      else useMercStore.setState({ mercEquipment: { orphan: { amulet: independent } } });
    };
    // Register the fault before the journal: nested notifications must still expose the displaced slot.
    stops.push(destination === 'hero' ? useInventoryStore.subscribe(fill) : useMercStore.subscribe(fill));
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    const { equipSlot: _slot, ...unequippedOriginal } = original;
    useInventoryStore.setState({ backpack: [{ ...unequippedOriginal, equipped: false }] });
    if (destination === 'hero') useInventoryStore.setState({ equipped: { amulet: { ...reward, equipped: true, equipSlot: 'amulet' } } });
    else useMercStore.setState({ mercEquipment: { orphan: { amulet: { ...reward, equipped: true, equipSlot: 'amulet' } } } });
    ownership.restore();
    expect(destination === 'hero' ? inv().equipped.amulet : mercs().mercEquipment.orphan?.amulet).toEqual(independent);
    expect(inv().backpack).toEqual([{ ...unequippedOriginal, equipped: false }]);
    expect(inv().backpack[0]?.affixes?.[0]).toEqual({ affixId: 'legacy', values: new Map([['life', 13]]) });
  });
  it('restores a displaced slot and removes observed clones after movement, rename and later deletion', () => {
    const original = item('original', true), reward = item('reward');
    useInventoryStore.setState({ equipped: { amulet: original } });
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    const clone = { ...reward, equipped: true, equipSlot: 'amulet' as const };
    useInventoryStore.setState({ equipped: { amulet: clone }, backpack: [{ ...original, equipped: false }] });
    Object.assign(clone, { id: 'renamed', uniqueId: 'unrelated' });
    useInventoryStore.setState({ equipped: {}, stash: [clone] });
    useInventoryStore.setState({ stash: [{ ...clone }] });
    ownership.restore();
    expect(inv().equipped).toEqual({ amulet: original }); expect(inv().backpack).toEqual([]); expect(inv().stash).toEqual([]);
  });
  it('preflights collisions in quarantine and actor mirrors before any publication', () => {
    const reward = item('reward');
    useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: { ...reward }, origin: { container: 'stash', index: 0 } }] });
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    expect(() => { ownership.preflight(); }).toThrow('already owned');
  });
  it('attempts every physical restoration domain and exposes a restore-write failure', () => {
    const reward = item('reward'), ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    useInventoryStore.setState({ backpack: [reward] });
    const setInventory = vi.spyOn(useInventoryStore, 'setState').mockImplementation(() => { throw new Error('restore write'); });
    const setMercs = vi.spyOn(useMercStore, 'setState');
    expect(() => { ownership.restore(); }).toThrow(AggregateError); expect(setMercs).toHaveBeenCalled();
    setInventory.mockRestore();
  });
});

describe('restoration callbacks and colliding cloned lineage', () => {
  it.each(['raw', 'real'] as const)('preserves independent %s compensation XP cache semantics', mode => {
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing hero');
    usePlayerStore.setState({ player: { ...hero, derivedStats: { ...hero.derivedStats, defense: 999 } } });
    const reward = item('reward'), ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    useInventoryStore.setState({ equipped: { amulet: reward } });
    let fired = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (fired || state.equipped.amulet === reward) return;
      fired = true;
      if (mode === 'real') usePlayerStore.getState().gainExperience(1);
      else usePlayerStore.getState().addXP(1);
    }));
    ownership.restore();
    const after = usePlayerStore.getState().player;
    if (!after) throw new Error('Missing restored hero');
    expect(fired).toBe(true); expect(after.experience).toBe(hero.experience + 1);
    const canonical = deriveEquippedPlayerStats(after, after.level, inv().equipped);
    expect(after.derivedStats.defense).toBe(mode === 'real' ? canonical.defense : 999);
  });
  it('preserves an unrelated item inserted by a merc restoration observer before inventory restoration', () => {
    const reward = item('reward'), independent = item('independent');
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    useInventoryStore.setState({ backpack: [reward] }); let inserted = false;
    stops.push(useMercStore.subscribe(() => { if (!inserted) { inserted = true; inv().addItem(independent); } }));
    ownership.restore(); expect(inv().backpack).toEqual([independent]);
  });
  it('removes a nested payload-sharing reward clone renamed onto an independent ID without annexing the independent item', () => {
    const independent = item('collision'), reward = item('reward');
    useInventoryStore.setState({ backpack: [independent] });
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    useInventoryStore.setState({ stash: [reward] }); Object.assign(reward, { id: 'collision' });
    useInventoryStore.setState({ stash: [reward] });
    useInventoryStore.setState({ stash: [], equipped: { amulet: { ...reward, equipped: true, equipSlot: 'amulet' } } });
    ownership.restore(); expect(inv().backpack).toEqual([independent]); expect(inv().equipped).toEqual({});
  });
  it('preserves a newly inserted independent original-ID collision before the reward is ever published', () => {
    const reward = item('reward'), independent = { ...item('reward'), baseId: 'items/base/helm-cap' };
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    inv().addItem(independent); expect(() => { ownership.preflight(); }).toThrow();
    ownership.restore(); expect(inv().backpack).toEqual([independent]);
  });
  it('exposes an unidentifiable deep-cloned colliding payload instead of deleting independent collision owners', () => {
    const independent = item('collision'), reward = item('reward');
    useInventoryStore.setState({ backpack: [independent] });
    const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
    useInventoryStore.setState({ stash: [reward] }); Object.assign(reward, { id: 'collision' });
    useInventoryStore.setState({ stash: [reward] });
    useInventoryStore.setState({ stash: [structuredClone(reward)] });
    expect(() => { ownership.restore(); }).toThrow(AggregateError); expect(inv().backpack).toEqual([independent]);
  });
});

it('keeps initially captured independent mirror clones when a reward later collides with their ID', () => {
  const independent = item('collision'), reward = item('reward');
  useInventoryStore.setState({ backpack: [independent] });
  usePlayerStore.setState(state => ({ player: state.player && { ...state.player, equipment: [{ ...independent }] } }));
  const beforeMirror = usePlayerStore.getState().player?.equipment;
  const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
  useInventoryStore.setState({ stash: [reward] }); Object.assign(reward, { id: 'collision' }); useInventoryStore.setState({ stash: [reward] });
  useInventoryStore.setState({ stash: [] }); ownership.restore();
  expect(inv().backpack).toEqual([independent]); expect(usePlayerStore.getState().player?.equipment).toBe(beforeMirror);
});
it('recovers displaced hero gear into overflow when the actual hero departs, without rebuilding a foreign actor', () => {
  const original = item('original', true), reward = item('reward');
  useInventoryStore.setState({ equipped: { amulet: original } });
  const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
  useInventoryStore.setState({ equipped: { amulet: { ...reward, equipped: true, equipSlot: 'amulet' } }, backpack: [{ ...original, equipped: false }] });
  const foreign = structuredClone({ ...createMockPlayer('Foreign', 'sorceress'), id: usePlayerStore.getState().player?.id ?? 'foreign', equipment: [] });
  usePlayerStore.setState({ player: foreign }); ownership.restore();
  expect(usePlayerStore.getState().player).toBe(foreign); expect(inv().equipped).toEqual({ amulet: null });
  expect(inv().backpack).toEqual([{ ...original, equipped: false, equipSlot: undefined }]);
});
it('reports mutation of restored pre-existing item data instead of accepting a shallow restoration', () => {
  const original = item('original', true), reward = item('reward');
  useInventoryStore.setState({ equipped: { amulet: original } });
  const ownership = captureQuestRewardOwnership(reward); stops.push(ownership.dispose);
  useInventoryStore.setState({ equipped: { amulet: { ...reward, equipped: true, equipSlot: 'amulet' } }, backpack: [{ ...original, equipped: false }] });
  let mutated = false;
  stops.push(useInventoryStore.subscribe(state => {
    if (!mutated && state.equipped.amulet?.id === original.id) { mutated = true; Object.assign(state.equipped.amulet, { baseId: 'items/base/helm-cap' }); }
  }));
  expect(() => { ownership.restore(); }).toThrow(AggregateError);
});
