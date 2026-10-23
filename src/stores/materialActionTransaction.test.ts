import { describe, expect, it, vi } from 'vitest';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { prepareMaterialAction, type MaterialActionContext, type MaterialActionInventory } from '@/engine/crafting/material-actions';
import { runMaterialActionTransaction, type MaterialActionPort } from './materialActionTransaction';
import { assertWaveSnapshotAllowed, beginWaveTransition, endWaveTransition, reserveWaveRestore, beginQuestTransaction, deferWaveSaveIfBusy } from './waveTransitionGuard';

const context: MaterialActionContext = { characterId: 'hero', highestUnlockedAct: 1, difficulty: 'normal',
  backpackCapacity: 100, stashCapacity: 500, bases: loadItemBases(), affixes: loadAffixPool(),
  reservedItemIds: new Set(), otherOwnedItemIds: new Set() };
function fixture(overrides: Partial<MaterialActionInventory> = {}) {
  let state: MaterialActionInventory = { backpack: [], stash: [], quarantine: [], materials: { 'runes/el': 3 },
    currencies: { 'rune-shard': 10 }, materialActionOrdinal: 0, ...overrides };
  const before = structuredClone(state);
  const released = vi.fn();
  const port: MaterialActionPort = { hydrationReady: () => true, read: () => ({ inventory: state, context }),
    publish: next => { state = next; }, restore: snapshot => { state = snapshot; }, onReleased: released };
  return { port, before, state: () => state, released };
}

describe('shared material publication transaction', () => {
  it('owns the lock before reading authoritative state and releases it before save notification', () => {
    const f = fixture(), read = f.port.read;
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    f.port.read = () => {
      expect(() => beginWaveTransition(true)).toThrow('materialBusy');
      expect(() => reserveWaveRestore()).toThrow('materialBusy');
      return read();
    };
    f.port.onReleased = () => { assertWaveSnapshotAllowed(); };
    expect(runMaterialActionTransaction(f.port, request).replay).toBe(false);
  });
  it('publishes one complete state and returns exact latest replay without any setter', () => {
    const f = fixture();
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    const publish = vi.spyOn(f.port, 'publish'), restore = vi.spyOn(f.port, 'restore');
    expect(runMaterialActionTransaction(f.port, request).replay).toBe(false);
    const committed = structuredClone(f.state());
    expect(committed.materials).toEqual({ 'runes/eld': 1 }); expect(committed.materialActionOrdinal).toBe(1);
    expect(runMaterialActionTransaction(f.port, request).replay).toBe(true);
    expect(f.state()).toEqual(committed); expect(publish).toHaveBeenCalledTimes(1); expect(restore).not.toHaveBeenCalled();
    expect(f.released).toHaveBeenCalledWith(false);
  });
  it.each(['materials', 'currencies', 'backpack', 'ordinal', 'receipt'])('rolls back a mutate-then-throw %s write while holding every interlock', point => {
    const f = fixture();
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    const restore = f.port.restore;
    f.port.publish = next => {
      if (!next.latestMaterialAction) throw new Error('Missing publication receipt');
      const partial: MaterialActionInventory = { ...f.before,
        ...(point === 'materials' ? { materials: next.materials } : {}),
        ...(point === 'currencies' ? { currencies: { ...next.currencies, 'rune-shard': 0 } } : {}),
        ...(point === 'backpack' ? { backpack: next.backpack } : {}),
        ...(point === 'ordinal' ? { materialActionOrdinal: next.materialActionOrdinal } : {}),
        ...(point === 'receipt' ? { latestMaterialAction: next.latestMaterialAction } : {}) };
      restore(partial);
      expect(() => runMaterialActionTransaction(f.port, request)).toThrow('materialBusy');
      expect(() => beginWaveTransition(true)).toThrow('materialBusy');
      expect(() => reserveWaveRestore()).toThrow('materialBusy');
      expect(() => beginQuestTransaction()).toThrow('materialBusy');
      expect(() => { assertWaveSnapshotAllowed(); }).toThrow('materialBusy');
      expect(deferWaveSaveIfBusy()).toBe(true);
      throw new Error(`publication-${point}`);
    };
    f.port.restore = snapshot => {
      expect(() => runMaterialActionTransaction(f.port, request)).toThrow('materialBusy');
      expect(() => reserveWaveRestore()).toThrow('materialBusy');
      restore(snapshot);
    };
    expect(() => runMaterialActionTransaction(f.port, request)).toThrow(`publication-${point}`);
    expect(f.state()).toEqual(f.before); expect(f.released).toHaveBeenCalledWith(true);
    expect(() => { assertWaveSnapshotAllowed(); }).not.toThrow();
  });
  it('retains both publication and rollback errors in observable aggregate evidence and releases ownership', () => {
    const f = fixture(), first = new Error('publish'), second = new Error('restore');
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    f.port.publish = () => { throw first; };
    f.port.restore = () => {
      expect(() => beginWaveTransition(true)).toThrow('materialBusy'); throw second;
    };
    let thrown: unknown;
    try { runMaterialActionTransaction(f.port, request); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(AggregateError); expect((thrown as AggregateError).errors).toEqual([first, second]);
    expect(() => { assertWaveSnapshotAllowed(); }).not.toThrow();
  });
  it('restores transformed gear and nested legacy Maps after an in-place observer mutation throws', () => {
    const item = { id: 'target', baseId: 'items/base/armor-quilted', rarity: 'normal' as const,
      level: 1, socketCapacity: 2, identified: true, equipped: false,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }],
      socketContents: [{ kind: 'rune' as const, id: 'runes/el' }] };
    const f = fixture({ backpack: [item], materials: { 'runes/hel': 1, 'gems/skull/flawed': 1 },
      currencies: { 'rune-shard': 100 } });
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/socket-clear', itemIds: [item.id] });
    f.port.publish = next => {
      Object.assign(item, next.backpack[0]);
      item.affixes[0]?.values.set('statMods.mana', 999);
      expect(f.state()).not.toEqual(f.before);
      throw new Error('nested publication');
    };
    expect(() => runMaterialActionTransaction(f.port, request)).toThrow('nested publication');
    expect(f.state()).toEqual(f.before);
    expect(f.state().backpack[0]?.affixes).toEqual([{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }]);
  });
  it('preserves the action failure when its post-release save notification also throws', () => {
    const f = fixture(), publishError = new Error('publish'), wakeError = new Error('save wake');
    const request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    f.port.publish = () => { throw publishError; };
    f.port.onReleased = () => { assertWaveSnapshotAllowed(); throw wakeError; };
    let thrown: unknown;
    try { runMaterialActionTransaction(f.port, request); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(AggregateError);
    expect((thrown as AggregateError).errors).toEqual([publishError, wakeError]);
    expect(f.state()).toEqual(f.before);
  });
  it('refuses wave/hydration and preflight errors without publication or rollback attempts', () => {
    const f = fixture(), request = prepareMaterialAction(f.state(), context, { recipeId: 'recipes/rune-fusion/el' });
    const publish = vi.spyOn(f.port, 'publish'), restore = vi.spyOn(f.port, 'restore');
    const wave = beginWaveTransition(true);
    try { expect(() => runMaterialActionTransaction(f.port, request)).toThrow('waveBusy'); }
    finally { endWaveTransition(wave); }
    f.port.hydrationReady = () => false;
    expect(() => runMaterialActionTransaction(f.port, request)).toThrow('hydrationNotReady');
    f.port.hydrationReady = () => true;
    expect(() => runMaterialActionTransaction(f.port, { ...request, requestHash: 'b'.repeat(64) })).toThrow();
    expect(publish).not.toHaveBeenCalled(); expect(restore).not.toHaveBeenCalled(); expect(f.state()).toEqual(f.before);
  });
});
