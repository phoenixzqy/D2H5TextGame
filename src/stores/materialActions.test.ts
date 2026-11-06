import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { SaveCurrent } from '@/engine/types/save';
import { CURRENT_SAVE_VERSION } from '@/engine/types/save';
import { decodeSave } from '@/engine/save/validate';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useHydrationStore } from './hydrationStore';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { armIronGolemSelection, clearIronGolemSelection } from './ironGolemSelectionStore';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';
import { BACKPACK_CAPACITY } from './inventoryCapacity';
import { __resetPersistenceForTests, snapshotStores, exportCurrentSave, importIntoStores, flushSave, hydrateFromSave, initPersistence, stopAutoSave } from './persistence';

let disk: SaveCurrent | null = null;
vi.mock('./save-adapter', () => ({
  saveSave: (save: SaveCurrent) => { disk = structuredClone(save); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk && decodeSave(disk)), hasSave: () => Promise.resolve(disk !== null),
  deleteSave: () => { disk = null; return Promise.resolve(); }
}));
const blade = () => ({ id: 'blade', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
  level: 1, identified: true, equipped: false, socketCapacity: 2 });
beforeEach(() => {
  __resetPersistenceForTests(); disk = null;
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); useMapStore.getState().reset(); useMercStore.getState().reset();
  clearIronGolemSelection(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Craft', 'sorceress'));
  useInventoryStore.setState({ backpack: [blade()], materials: { 'runes/el': 3 } });
});

describe('live material actions', () => {
  it('stops actions and saves after unverifiable rollback until a complete saved state is restored', async () => {
    await flushSave(); const originalDisk = structuredClone(disk);
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    let damaged = false;
    const unsubscribe = useInventoryStore.subscribe(state => {
      if (state.materialActionOrdinal === 1 && !damaged) {
        damaged = true; useInventoryStore.setState({ materials: {} });
      }
      throw new Error(state.materialActionOrdinal === 1 ? 'publication observer' : 'restoration observer');
    });
    let failure: unknown;
    try { executeLiveMaterialAction(request); } catch (error) { failure = error; } finally { unsubscribe(); }
    expect(failure).toBeInstanceOf(AggregateError);
    expect(useHydrationStore.getState().status).toBe('error');
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' })).toThrow();
    expect(() => executeLiveMaterialAction(request)).toThrow();
    await expect(flushSave()).rejects.toThrow('recovery'); expect(disk).toEqual(originalDisk);
    expect(await hydrateFromSave()).toBe(true);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(executeLiveMaterialAction(request).replay).toBe(false);
  });
  it.each(['hydrate', 'initialize'] as const)('keeps damaged runtime blocked when %s finds no saved recovery state', async operation => {
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    const unsubscribe = useInventoryStore.subscribe(() => { throw new Error('publication and restoration observer'); });
    try { expect(() => executeLiveMaterialAction(request)).toThrow(AggregateError); } finally { unsubscribe(); }
    const damagedInventory = useInventoryStore.getState();
    try {
      if (operation === 'hydrate') expect(await hydrateFromSave()).toBe(false);
      else await initPersistence();
      expect(useHydrationStore.getState().status).toBe('error');
      expect(useHydrationStore.getState().error).toContain('recovery');
      expect(useInventoryStore.getState()).toBe(damagedInventory);
      expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' })).toThrow();
      expect(() => executeLiveMaterialAction(request)).toThrow();
      await expect(flushSave()).rejects.toThrow('recovery');
      expect(disk).toBeNull();
    } finally { stopAutoSave(); }
  });
  const recovery = () => ({ sourceVersion: 18 as const, origin: { container: 'equipped' as const, slot: 'chest' },
    item: { ...blade(), id: 'old-lore', baseId: 'items/base/armor-quilted', equipped: true,
      rarity: 'runeword' as const, runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'],
      baseRolls: { defense: 7 }, personalizedBy: { characterId: 'old-hero', name: 'Smith' } } });
  it('recovers the exact old item and known inserted rune counts once through native Save/Continue', async () => {
    const entry = recovery();
    useInventoryStore.setState({ socketQuarantine: [entry] });
    const before = structuredClone(entry);
    const request = prepareLiveMaterialAction({ recipeId: 'actions/recover-v18', itemIds: [entry.item.id] });
    const preview = previewLiveMaterialAction(request);
    expect(preview.result).toEqual({ itemId: entry.item.id, materials: { 'runes/ort': 1, 'runes/sol': 1 }, currencies: {} });
    expect(useInventoryStore.getState().socketQuarantine).toEqual([before]);
    expect(executeLiveMaterialAction(request).replay).toBe(false);
    const recovered = useInventoryStore.getState().backpack.find(item => item.id === entry.item.id);
    const { runes: _runes, runewordId: _word, ...preserved } = entry.item;
    expect(recovered).toEqual({ ...preserved, rarity: 'normal', equipped: false, socketContents: [] });
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 3, 'runes/ort': 1, 'runes/sol': 1 });
    expect(useInventoryStore.getState().socketQuarantine).toEqual([]);
    const saved = snapshotStores();
    await flushSave(); useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()?.inventory).toEqual(saved?.inventory);
    const inventory = useInventoryStore.getState();
    expect(executeLiveMaterialAction(request).replay).toBe(true);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(entry).toEqual(before);
  });
  it('rechecks recovery capacity after request preparation and preserves the complete quarantine entry on refusal', () => {
    const entry = recovery(); useInventoryStore.setState({ socketQuarantine: [entry] });
    const request = prepareLiveMaterialAction({ recipeId: 'actions/recover-v18', itemIds: [entry.item.id] });
    useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ({ ...blade(), id: `full-${String(index)}` })) });
    const before = useInventoryStore.getState();
    expect(() => previewLiveMaterialAction(request)).toThrow('No room');
    expect(() => executeLiveMaterialAction(request)).toThrow('No room');
    expect(useInventoryStore.getState()).toBe(before);
    expect(before.socketQuarantine).toEqual([entry]);
    expect(before.materialActionOrdinal).toBe(0); expect(before.latestMaterialAction).toBeNull();
  });
  it.each(['hero', 'merc', 'legacy-quarantine'] as const)('refuses a new %s authoritative owner collision after preparation', owner => {
    const request = prepareLiveMaterialAction({ recipeId: 'actions/salvage', itemIds: ['blade'] });
    if (owner === 'hero') useInventoryStore.setState({ equipped: { weapon: blade() } });
    else if (owner === 'merc') useMercStore.setState({ mercEquipment: { rogue: { weapon: blade() } } });
    else useInventoryStore.setState({ legacyGearQuarantine: [{ item: blade(), origin: { container: 'stash', index: 0 } }] });
    const before = useInventoryStore.getState(), mercs = useMercStore.getState();
    expect(() => previewLiveMaterialAction(request)).toThrow('Ineligible');
    expect(() => executeLiveMaterialAction(request)).toThrow('Ineligible');
    expect(useInventoryStore.getState()).toBe(before); expect(useMercStore.getState()).toBe(mercs);
  });
  it.each(['hero', 'merc'] as const)('uses authoritative ownership after %s equipped Save/Continue and unequip', async owner => {
    const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
    if (!definition) throw new Error('Missing starter Rogue');
    const merc = createMercFromDef(definition);
    useMercStore.getState().addMerc(merc);
    expect(owner === 'hero' ? useInventoryStore.getState().equipItem(blade())
      : useMercStore.getState().equipOnMerc(merc.id, 'weapon', blade())).toEqual({ ok: true });
    await flushSave();
    useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); useMercStore.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    const actor = owner === 'hero' ? usePlayerStore.getState().player : useMercStore.getState().ownedMercs[0];
    expect(actor?.equipment.map(item => item.id)).toEqual(['blade']);
    expect(owner === 'hero' ? useInventoryStore.getState().unequipItem('weapon')
      : useMercStore.getState().unequipFromMerc(merc.id, 'weapon')).toEqual({ ok: true });
    const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: ['blade'], materialId: 'runes/el' });
    expect(executeLiveMaterialAction(request).replay).toBe(false);
    expect(useInventoryStore.getState().backpack[0]?.socketContents).toEqual([{ kind: 'rune', id: 'runes/el' }]);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 2 });
  });
  it('inserts owned material, equips its actual effect and preserves native state through Save/Continue', async () => {
    expect(useInventoryStore.getState().equipItem(blade())).toEqual({ ok: true });
    const unmodifiedAttack = usePlayerStore.getState().player?.derivedStats.attack;
    expect(useInventoryStore.getState().unequipItem('weapon').ok).toBe(true);
    const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: ['blade'], materialId: 'runes/el' });
    expect(executeLiveMaterialAction(request).replay).toBe(false);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 2 });
    expect(useInventoryStore.getState().backpack[0]).toMatchObject({ socketContents: [{ kind: 'rune', id: 'runes/el' }] });
    expect(useInventoryStore.getState().equipItem(blade())).toEqual({ ok: true });
    expect(usePlayerStore.getState().player?.derivedStats.attack).toBe((unmodifiedAttack ?? 0) + 50);
    const saved = snapshotStores();
    expect(saved?.version).toBe(CURRENT_SAVE_VERSION);
    await flushSave(); useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()?.inventory).toEqual(saved?.inventory);
    expect(snapshotStores()?.player).toEqual(saved?.player);
    expect(executeLiveMaterialAction(request).replay).toBe(true);
  });
  it('replays fusion after spent inputs and clears the old receipt on reset and replacement import', async () => {
    const initial = exportCurrentSave(); if (!initial) throw new Error('Missing initial save');
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    executeLiveMaterialAction(request); expect(executeLiveMaterialAction(request).replay).toBe(true);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/eld': 1 });
    await importIntoStores(initial);
    expect(useInventoryStore.getState().latestMaterialAction).toBeNull();
    expect(snapshotStores()?.inventory).not.toHaveProperty('latestMaterialAction');
    executeLiveMaterialAction(prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' }));
    useInventoryStore.getState().reset();
    expect(useInventoryStore.getState().latestMaterialAction).toBeNull();
    expect(snapshotStores()?.inventory).not.toHaveProperty('latestMaterialAction');
  });
  it('uses unlocked act rather than selected location for rune fusion caps', () => {
    useMapStore.setState({ currentAct: 5 }); useInventoryStore.setState({ materials: { 'runes/ral': 3 } });
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/ral' })).toThrow();
  });
  it('refuses an explicitly armed Iron Golem target without changing any materials or item', () => {
    const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing hero');
    armIronGolemSelection(hero.id, 'blade', true);
    const before = snapshotStores();
    expect(() => prepareLiveMaterialAction({ recipeId: 'actions/salvage', itemIds: ['blade'] })).toThrow();
    expect(snapshotStores()?.inventory).toEqual(before?.inventory);
  });
  it('restores receipt absence and all consumed inputs after a write-then-throw observer', () => {
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/rune-fusion/el' });
    const before = snapshotStores(); let fired = false;
    const stop = useInventoryStore.subscribe(state => { if (state.materialActionOrdinal > 0 && !fired) { fired = true; throw new Error('publication'); } });
    try { expect(() => executeLiveMaterialAction(request)).toThrow('publication'); } finally { stop(); }
    expect(snapshotStores()?.inventory).toEqual(before?.inventory);
    expect(useInventoryStore.getState().latestMaterialAction).toBeNull();
    expect(executeLiveMaterialAction(request).replay).toBe(false);
  });
});
