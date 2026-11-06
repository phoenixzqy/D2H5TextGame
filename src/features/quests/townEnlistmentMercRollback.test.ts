import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { captureTownEnlistmentMercParticipant } from './townEnlistmentMercRollback';

// This observer fault mutates the actual retained actor rather than replacing it.
type WritableWitness<T> = { -readonly [Key in keyof T]: T[Key] };

const mercs = () => useMercStore.getState(), inv = () => useInventoryStore.getState();
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing family physical fixture'); return value; }
function gear(id: string): Item { return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'magic', level: 1, identified: true,
  equipped: false, affixes: [{ affixId: 'legacy-map', values: new Map([['statMods.life', 7]]) }] }; }
function recruit(suffix: string) {
  const merc = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act2-blessed-aim')), suffix);
  Object.assign(merc.derivedStats, { life: 3, mana: 2 }); return merc;
}
function chosen() { return required(mercs().ownedMercs.find(row => row.id.endsWith('#chosen'))); }
function other() { return required(mercs().ownedMercs.find(row => row.id.endsWith('#other'))); }
beforeEach(() => {
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useMapStore.getState().reset(); usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Physical family', 'sorceress'), equipment: [] });
  const blade = { ...gear('original-blade'), equipped: true, equipSlot: 'weapon' as const }, selected = { ...recruit('chosen'), equipment: [blade] }, another = recruit('other');
  useMercStore.setState({ ownedMercs: [another, selected], fieldedMercId: another.id,
    mercEquipment: { [another.id]: {}, [selected.id]: { weapon: blade } },
    mercProgress: { [another.id]: { experience: 9, experienceToNextLevel: 888 }, [selected.id]: { experience: 123, experienceToNextLevel: 777 } } });
  useInventoryStore.setState({ backpack: [gear('bag-first'), gear('bag-last')] });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); });

describe('family actual participant physical rollback', () => {
  it('restores a surviving selected actor and exact Map gear/progress without healing', () => {
    const selected = chosen(), before = structuredClone(selected), beforeGear = structuredClone(mercs().mercEquipment[selected.id]);
    const journal = captureTownEnlistmentMercParticipant(selected, false);
    Object.assign(selected, { level: 99 }); (selected.derivedStats as WritableWitness<typeof selected.derivedStats>).life = 1;
    const affix = required(required(mercs().mercEquipment[selected.id]?.weapon).affixes?.[0]);
    if (!('values' in affix) || !(affix.values instanceof Map)) throw new Error('Expected legacy Map');
    affix.values.set('statMods.life', 999); required(mercs().mercProgress[selected.id]).experience = 999;
    journal.restore();
    expect(chosen()).toEqual({ ...before, derivedStats: { ...before.derivedStats, life: 1 } });
    expect(mercs().mercEquipment[selected.id]).toEqual(beforeGear); expect(mercs().mercProgress[selected.id]?.experience).toBe(123);
  });
  it.each(['stash', 'hero', 'other-merc', 'orphan-map', 'legacy', 'socket'] as const)('conserves participant gear moved to %s once', destination => {
    const selected = chosen(), blade = required(mercs().mercEquipment[selected.id]?.weapon), before = structuredClone(blade);
    const journal = captureTownEnlistmentMercParticipant(selected, false);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row === selected ? { ...row, equipment: [] } : row),
      mercEquipment: { ...state.mercEquipment, [selected.id]: {} } }));
    if (destination === 'stash') useInventoryStore.setState({ stash: [blade] });
    if (destination === 'hero') {
      useInventoryStore.setState({ equipped: { weapon: blade } }); usePlayerStore.setState(state => state.player ? { player: { ...state.player, equipment: [blade] } } : state);
    }
    if (destination === 'other-merc' || destination === 'orphan-map') useMercStore.setState(state => ({ mercEquipment: {
      ...state.mercEquipment, [destination === 'other-merc' ? other().id : 'orphan']: { weapon: blade }
    } }));
    if (destination === 'legacy') useInventoryStore.setState({ legacyGearQuarantine: [{ item: blade, origin: { container: 'backpack', index: 0 } }] });
    if (destination === 'socket') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: blade, origin: { container: 'backpack', index: 0 } }] });
    journal.restore();
    expect(mercs().mercEquipment[selected.id]?.weapon).toEqual(before); expect(chosen().equipment).toEqual([before]);
    expect(inv().stash).toEqual([]); expect(inv().equipped).toEqual({}); expect(inv().legacyGearQuarantine).toEqual([]); expect(inv().socketQuarantine).toEqual([]);
    expect(mercs().mercEquipment[other().id]).toEqual({}); expect(mercs().mercEquipment.orphan ?? {}).toEqual({});
    expect(usePlayerStore.getState().player?.equipment).toEqual([]);
  });
  it('preserves independent retained dismissal, fielding and progression and recovers its gear without resurrection', () => {
    const selected = chosen(), another = other(), journal = captureTownEnlistmentMercParticipant(selected, false);
    journal.beginFieldPublication(selected.id); mercs().setFieldedMerc(selected.id);
    mercs().removeMerc(selected.id); required(mercs().mercProgress[another.id]).experience = 111;
    journal.restore();
    expect(mercs().ownedMercs).toEqual([another]); expect(mercs().fieldedMercId).toBeNull();
    expect(Object.hasOwn(mercs().mercEquipment, selected.id)).toBe(false); expect(Object.hasOwn(mercs().mercProgress, selected.id)).toBe(false);
    expect(mercs().mercProgress[another.id]?.experience).toBe(111);
    expect(inv().backpack.filter(item => item.id === 'original-blade')).toHaveLength(1);
    expect(inv().backpack.at(-1)?.equipped).toBe(false);
  });
  it('preserves an independent away/back fielding transition instead of rewinding to the old merc', () => {
    const selected = chosen(), journal = captureTownEnlistmentMercParticipant(selected, false);
    journal.beginFieldPublication(selected.id); mercs().setFieldedMerc(selected.id);
    mercs().setFieldedMerc(null); mercs().setFieldedMerc(selected.id); journal.restore();
    expect(mercs().fieldedMercId).toBe(selected.id);
  });
  it('preserves a fresh foreign same-ID replacement of a retained participant', () => {
    const selected = chosen(), replacement = { ...structuredClone(selected), equipment: [] }, journal = captureTownEnlistmentMercParticipant(selected, false);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row === selected ? replacement : row) }));
    journal.restore(); expect(mercs().ownedMercs[1]).toBe(replacement);
  });
  it('restores a surviving selected map presence and collapses duplicate rows of that actual actor', () => {
    const selected = chosen(), another = other(), journal = captureTownEnlistmentMercParticipant(selected, false);
    useMercStore.setState({ ownedMercs: [selected, another, selected], mercEquipment: { [another.id]: {} } });
    journal.restore();
    expect(mercs().ownedMercs.map(row => row.id)).toEqual([another.id, selected.id]);
    expect(mercs().mercEquipment[selected.id]?.weapon?.id).toBe('original-blade');
    expect(chosen().equipment).toEqual([mercs().mercEquipment[selected.id]?.weapon]);
  });
  it('removes a renamed failed fresh actor and recovers gear attached to its removed reference once', () => {
    const fresh = recruit('fresh'), journal = captureTownEnlistmentMercParticipant(fresh, true), unknown = gear('unknown-attached');
    mercs().addMerc(fresh); journal.beginFieldPublication(fresh.id); mercs().setFieldedMerc(fresh.id);
    Object.assign(fresh, { equipment: [unknown], id: 'renamed-created' });
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.filter(row => row !== fresh) }));
    journal.restore(); expect(mercs().ownedMercs.some(row => row === fresh)).toBe(false);
    expect(Object.hasOwn(mercs().mercProgress, 'mercs/act2-blessed-aim#fresh')).toBe(false);
    expect(inv().backpack.filter(item => item.id === unknown.id)).toHaveLength(1); expect(inv().backpack.at(-1)).toEqual(unknown);
  });
  it('keeps additions made by restoration observers and attempts every domain after errors', () => {
    const selected = chosen(), journal = captureTownEnlistmentMercParticipant(selected, false), independent = gear('restore-subscriber-item');
    let fired = false; stops.push(useMercStore.subscribe(() => { if (!fired) { fired = true; useInventoryStore.setState(state => ({ backpack: [...state.backpack, independent] })); } }));
    const real = useMercStore.setState; vi.spyOn(useMercStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('restoration observer'); });
    expect(() => { journal.restore(); }).toThrow(AggregateError); expect(inv().backpack).toContain(independent);
    expect(mercs().mercEquipment[selected.id]?.weapon?.affixes?.[0]).toEqual(required(selected.equipment[0]).affixes?.[0]);
  });
});
