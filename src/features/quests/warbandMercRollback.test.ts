import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { captureWarbandMercParticipants, restoreWarbandMercParticipants } from './warbandMercRollback';

const selected = 'mercs/act5-barbarian-recruit#selected', other = 'mercs/act5-barbarian-recruit#other';
const inv = () => useInventoryStore.getState(), mercs = () => useMercStore.getState();
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing rollback fixture'); return value; }
function gear(id: string): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'magic', level: 1,
    identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'saved-map', values: new Map([['statMods.life', 7]]) }] };
}
function recruit(id: string) {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-recruit');
  if (!definition) throw new Error('Missing fixture recruit');
  const merc = { ...createMercFromDef(definition), id };
  return { ...merc, derivedStats: { ...merc.derivedStats, life: 3, mana: 2 } };
}
function originalSelected() { return mercs().ownedMercs.find(merc => merc.id === selected); }
function restore(snapshot: ReturnType<typeof captureWarbandMercParticipants>) { restoreWarbandMercParticipants(snapshot); }
beforeEach(() => {
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useMapStore.getState().reset(); usePlayerStore.getState().reset();
  const blade = { ...gear('selected-blade'), equipped: true, equipSlot: 'weapon' as const };
  const chosen = { ...recruit(selected), equipment: [blade] };
  useMercStore.setState({ ownedMercs: [recruit(other), chosen], fieldedMercId: other,
    mercEquipment: { [selected]: { weapon: blade }, [other]: {} },
    mercProgress: { [selected]: { experience: 123, experienceToNextLevel: 777 }, [other]: { experience: 9, experienceToNextLevel: 888 } } });
  useInventoryStore.setState({ backpack: [gear('backpack-first'), gear('backpack-last')] });
  const hero = { ...createMockPlayer('Rollback', 'sorceress'), equipment: [] };
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: deriveEquippedPlayerStats(hero, hero.level, {}) });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); });

describe('scoped Warband mercenary and physical gear rollback', () => {
  it('deeply restores roster positions, same-ID replacements, bare resources, affix Maps and exact XP', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    const before = structuredClone({ ownedMercs: mercs().ownedMercs, mercEquipment: mercs().mercEquipment, mercProgress: mercs().mercProgress });
    const chosen = originalSelected(); if (!chosen) throw new Error('Missing selected merc');
    Object.assign(chosen, { level: 99 }); Object.assign(chosen.derivedStats, { life: 99 });
    const affix = required(mercs().mercEquipment[selected]?.weapon?.affixes?.[0]);
    if (!('values' in affix) || !(affix.values instanceof Map)) throw new Error('Missing legacy Map fixture');
    affix.values.set('statMods.life', 999);
    useMercStore.setState({ ownedMercs: [recruit('new-unrelated'), recruit(selected), recruit(selected)] });
    restore(snapshot);
    expect(mercs().ownedMercs.slice(0, 2)).toEqual(before.ownedMercs);
    expect(mercs().ownedMercs[2]?.id).toBe('new-unrelated');
    expect(mercs().mercEquipment).toEqual(before.mercEquipment);
    expect(mercs().mercProgress).toEqual(before.mercProgress);
    expect(mercs().fieldedMercId).toBe(other);
  });
  it.each(['backpack', 'stash', 'other-merc', 'hero', 'legacy-quarantine', 'socket-quarantine'] as const)(
    'reclaims originally selected gear from %s without duplicate ownership', destination => {
      const snapshot = captureWarbandMercParticipants([selected, other]);
      const before = structuredClone(mercs().mercEquipment[selected]);
      const blade = mercs().mercEquipment[selected]?.weapon; if (!blade) throw new Error('Missing selected blade');
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(merc => merc.id === selected ? { ...merc, equipment: [] } : merc),
        mercEquipment: { ...state.mercEquipment, [selected]: {} } }));
      if (destination === 'backpack') useInventoryStore.setState(state => ({ backpack: [...state.backpack, blade] }));
      if (destination === 'stash') useInventoryStore.setState({ stash: [blade] });
      if (destination === 'other-merc') useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, [other]: { weapon: blade } } }));
      if (destination === 'hero') {
        useInventoryStore.setState({ equipped: { weapon: blade } });
        usePlayerStore.setState(state => state.player ? { player: { ...state.player, equipment: [blade] } } : state);
      }
      if (destination === 'legacy-quarantine') useInventoryStore.setState({ legacyGearQuarantine: [{ item: blade, origin: { container: 'backpack', index: 0 } }] });
      if (destination === 'socket-quarantine') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: blade, origin: { container: 'backpack', index: 0 } }] });
      restore(snapshot);
      expect(mercs().mercEquipment[selected]).toEqual(before);
      expect(mercs().mercEquipment[other]).toEqual({});
      expect(inv().backpack.map(item => item.id)).toEqual(['backpack-first', 'backpack-last']);
      expect(inv().stash).toEqual([]); expect(inv().equipped).toEqual({});
      expect(inv().legacyGearQuarantine).toEqual([]); expect(inv().socketQuarantine).toEqual([]);
      expect(usePlayerStore.getState().player?.equipment).toEqual([]);
    });
  it('returns newly equipped backpack gear to its exact preimage position and payload', () => {
    const added = gear('incoming');
    useInventoryStore.setState(state => ({ backpack: [required(state.backpack[0]), added, required(state.backpack[1])] }));
    const snapshot = captureWarbandMercParticipants([selected, other]), before = structuredClone(inv().backpack);
    expect(mercs().equipOnMerc(selected, 'weapon', added)).toEqual({ ok: true });
    restore(snapshot);
    expect(inv().backpack).toEqual(before);
    expect(mercs().mercEquipment[selected]?.weapon?.id).toBe('selected-blade');
  });
  it('removes the retained instance even if a callback mutates its ID', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    const chosen = originalSelected(); if (!chosen) throw new Error('Missing selected merc');
    Reflect.set(chosen, 'id', 'mutated-participant-id');
    restore(snapshot);
    expect(mercs().ownedMercs.map(merc => merc.id)).toEqual([other, selected]);
    expect(mercs().ownedMercs[1]?.derivedStats.life).toBe(3);
  });
  it('preserves independent merc state when a retained participant is renamed to its existing ID', () => {
    const independentId = 'independent-colliding-merc';
    const oldCap: Item = { ...gear('original-independent-cap'), equipped: true, equipSlot: 'head' };
    const newCap: Item = { ...gear('updated-independent-cap'), equipped: true, equipSlot: 'head' };
    const independent = { ...recruit(independentId), equipment: [oldCap] };
    useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs, independent],
      mercEquipment: { ...state.mercEquipment, [independentId]: { head: oldCap } },
      mercProgress: { ...state.mercProgress, [independentId]: { experience: 1, experienceToNextLevel: 999 } } }));
    const chosen = required(originalSelected()), blade = required(mercs().mercEquipment[selected]?.weapon);
    const snapshot = captureWarbandMercParticipants([selected, other]);
    Reflect.set(chosen, 'id', independentId);
    useMercStore.setState(state => ({
      ownedMercs: state.ownedMercs.map(merc => merc === independent ? { ...merc, level: 8, equipment: [newCap, blade] } : merc),
      mercEquipment: { ...state.mercEquipment, [selected]: {}, [independentId]: { head: newCap, weapon: blade } },
      mercProgress: { ...state.mercProgress, [independentId]: { experience: 777, experienceToNextLevel: 888 } }
    }));
    restore(snapshot);
    expect(mercs().ownedMercs.map(merc => merc.id)).toEqual([other, selected, independentId]);
    expect(mercs().ownedMercs[2]).toEqual({ ...independent, level: 8, equipment: [newCap] });
    expect(mercs().mercEquipment[independentId]).toEqual({ head: newCap });
    expect(mercs().mercProgress[independentId]).toEqual({ experience: 777, experienceToNextLevel: 888 });
    expect(mercs().mercEquipment[selected]?.weapon).toEqual(blade);
    expect(inv().backpack.map(item => item.id)).toEqual(['backpack-first', 'backpack-last']);
  });
  it.each(['participant', 'stash'] as const)('restores a retained gear ID mutation in %s without inventing a second unknown item', destination => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    const blade = mercs().mercEquipment[selected]?.weapon; if (!blade) throw new Error('Missing selected blade');
    Reflect.set(blade, 'id', 'mutated-selected-blade-id');
    if (destination === 'stash') {
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(merc => merc.id === selected ? { ...merc, equipment: [] } : merc),
        mercEquipment: { ...state.mercEquipment, [selected]: {} } }));
      useInventoryStore.setState({ stash: [blade] });
    }
    restore(snapshot);
    expect(mercs().mercEquipment[selected]?.weapon?.id).toBe('selected-blade');
    expect(inv().backpack.map(item => item.id)).toEqual(['backpack-first', 'backpack-last']);
    expect(inv().stash).toEqual([]);
  });
  it.each(['participant', 'stash'] as const)('preserves unrelated gear writes when retained %s gear is renamed to its existing ID', destination => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    const blade = required(mercs().mercEquipment[selected]?.weapon);
    const unrelated = { ...required(inv().backpack[0]), level: 37, identified: false };
    Reflect.set(blade, 'id', unrelated.id);
    useInventoryStore.setState(state => ({ backpack: [unrelated, ...state.backpack.slice(1)] }));
    if (destination === 'stash') {
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(merc => merc.id === selected ? { ...merc, equipment: [] } : merc),
        mercEquipment: { ...state.mercEquipment, [selected]: {} } }));
      useInventoryStore.setState({ stash: [blade] });
    }
    restore(snapshot);
    expect(inv().backpack).toEqual([unrelated, required(snapshot.inventory.backpack[1])]);
    expect(inv().stash).toEqual([]);
    expect(mercs().mercEquipment[selected]?.weapon?.id).toBe('selected-blade');
    expect(originalSelected()?.equipment.map(item => item.id)).toEqual(['selected-blade']);
  });
  it('preserves independent merc XP, roster additions, inventory moves and currencies', () => {
    const snapshot = captureWarbandMercParticipants([selected]);
    useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs, recruit('new-unrelated')],
      mercProgress: { ...state.mercProgress, [other]: { experience: 777, experienceToNextLevel: 888 } } }));
    const moved = required(inv().backpack[0]);
    useInventoryStore.setState(state => ({ backpack: state.backpack.slice(1), stash: [moved], currencies: { gems: 8 } }));
    restore(snapshot);
    expect(mercs().mercProgress[other]?.experience).toBe(777);
    expect(mercs().ownedMercs.at(-1)?.id).toBe('new-unrelated');
    expect(inv().stash).toEqual([moved]); expect(inv().currencies).toEqual({ gems: 8 });
    expect(inv().backpack.map(item => item.id)).toEqual(['backpack-last']);
  });
  it.each(['before', 'after'] as const)('preserves removal of an unrelated original merc %s the participant', position => {
    const chosen = originalSelected(); if (!chosen) throw new Error('Missing selected merc');
    const preceding = recruit('unrelated-preceding'), following = recruit('unrelated-following');
    useMercStore.setState({ ownedMercs: position === 'before' ? [preceding, chosen] : [chosen, following], fieldedMercId: selected });
    const snapshot = captureWarbandMercParticipants([selected]);
    mercs().removeMerc(position === 'before' ? preceding.id : following.id);
    restore(snapshot);
    expect(mercs().ownedMercs.map(merc => merc.id)).toEqual([selected]);
  });
  it('keeps independently equipped hero gear and recovers its conflicting original source to backpack', () => {
    const capA: Item = { ...gear('original-hero-cap'), baseId: 'items/base/helm-cap', equipped: true, equipSlot: 'head', baseRolls: { defense: 5 } };
    const capB: Item = { ...gear('independent-hero-cap'), baseId: 'items/base/helm-cap', baseRolls: { defense: 9 } };
    useInventoryStore.setState(state => ({ equipped: { head: capA }, backpack: [...state.backpack, capB] }));
    const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing fixture hero');
    usePlayerStore.setState({ player: { ...hero, derivedStats: deriveEquippedPlayerStats(hero, hero.level, inv().equipped) } });
    const snapshot = captureWarbandMercParticipants([selected, other]);
    useInventoryStore.setState({ equipped: {} });
    useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, [selected]: { ...state.mercEquipment[selected], head: capA } } }));
    expect(inv().equipItem(capB)).toEqual({ ok: true });
    restore(snapshot);
    expect(inv().equipped.head?.id).toBe(capB.id);
    const recovered = inv().backpack.filter(item => item.id === capA.id);
    expect(recovered).toHaveLength(1); expect(required(recovered[0]).equipped).toBe(false); expect(recovered[0]).not.toHaveProperty('equipSlot');
    expect(inv().backpack.some(item => item.id === capB.id)).toBe(false);
    const restored = usePlayerStore.getState().player;
    expect(restored?.derivedStats).toEqual(deriveEquippedPlayerStats(hero, hero.level, inv().equipped,
      useMapStore.getState().questProgress, inv().questItems, useMapStore.getState().questReceipts));
  });
  it('removes a newly created participant and its new maps while retaining unrelated additions', () => {
    const fresh = 'mercs/act5-barbarian-recruit#fresh', snapshot = captureWarbandMercParticipants([fresh, other]);
    mercs().addMerc(recruit(fresh)); mercs().addMerc(recruit('new-unrelated')); mercs().setFieldedMerc(fresh);
    restore(snapshot);
    expect(mercs().ownedMercs.some(merc => merc.id === fresh)).toBe(false);
    expect(Object.hasOwn(mercs().mercEquipment, fresh)).toBe(false);
    expect(Object.hasOwn(mercs().mercProgress, fresh)).toBe(false);
    expect(mercs().ownedMercs.some(merc => merc.id === 'new-unrelated')).toBe(true);
    expect(mercs().fieldedMercId).toBe(other);
  });
  it('removes fresh retained map aliases after callbacks rename and remove the instance', () => {
    const freshId = 'mercs/act5-barbarian-recruit#fresh', alias = 'renamed-fresh-recruit';
    const fresh = recruit(freshId), snapshot = captureWarbandMercParticipants([freshId, other], fresh);
    mercs().addMerc(fresh);
    Reflect.set(fresh, 'id', alias);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.filter(merc => merc !== fresh), fieldedMercId: alias,
      mercEquipment: { ...state.mercEquipment, [alias]: {} },
      mercProgress: { ...state.mercProgress, [alias]: { experience: 88, experienceToNextLevel: 99 } } }));
    restore(snapshot);
    expect(mercs().ownedMercs.map(merc => merc.id)).toEqual([other, selected]);
    for (const id of [freshId, alias]) {
      expect(Object.hasOwn(mercs().mercEquipment, id)).toBe(false);
      expect(Object.hasOwn(mercs().mercProgress, id)).toBe(false);
    }
    expect(mercs().fieldedMercId).toBe(other);
  });
  it('keeps independent nonparticipant equipment and mirrors while recovering their conflicting source gear', () => {
    const independentId = 'independent-merc';
    const originalCap: Item = { ...gear('original-independent-cap'), equipped: true, equipSlot: 'head' };
    const replacementCap: Item = { ...gear('replacement-independent-cap'), equipped: true, equipSlot: 'head' };
    const independent = { ...recruit(independentId), equipment: [originalCap] };
    useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs, independent],
      mercEquipment: { ...state.mercEquipment, [independentId]: { head: originalCap } } }));
    const snapshot = captureWarbandMercParticipants([selected, other]);
    useMercStore.setState(state => ({
      ownedMercs: state.ownedMercs.map(merc => merc.id === independentId ? { ...merc, equipment: [replacementCap], level: 8 } : merc),
      mercEquipment: { ...state.mercEquipment, [independentId]: { head: replacementCap },
        [selected]: { ...state.mercEquipment[selected], head: originalCap } },
      mercProgress: { ...state.mercProgress, [independentId]: { experience: 777, experienceToNextLevel: 888 } }
    }));
    restore(snapshot);
    expect(mercs().mercEquipment[independentId]).toEqual({ head: replacementCap });
    expect(mercs().ownedMercs.find(merc => merc.id === independentId)).toEqual({ ...independent, equipment: [replacementCap], level: 8 });
    expect(mercs().mercProgress[independentId]).toEqual({ experience: 777, experienceToNextLevel: 888 });
    expect(mercs().mercEquipment[selected]?.head).toBeUndefined();
    const recovered = inv().backpack.filter(item => item.id === originalCap.id);
    expect(recovered).toHaveLength(1);
    expect(required(recovered[0]).equipped).toBe(false);
    expect(recovered[0]).not.toHaveProperty('equipSlot');
  });
  it('preserves unknown callback gear once as unequipped backpack recovery overflow', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    const unknown = { ...gear('unknown-callback-item'), equipped: true, equipSlot: 'head' as const };
    useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, [selected]: { ...state.mercEquipment[selected], head: unknown } } }));
    useInventoryStore.setState(state => ({ backpack: [...state.backpack, ...Array.from({ length: 100 }, (_, i) => gear(`overflow-${String(i)}`))] }));
    restore(snapshot);
    const recovered = inv().backpack.filter(item => item.id === unknown.id);
    expect(recovered).toHaveLength(1); expect(required(recovered[0]).equipped).toBe(false);
    expect(recovered[0]).not.toHaveProperty('equipSlot');
    expect(mercs().mercEquipment[selected]?.head).toBeUndefined();
    expect(inv().backpack).toHaveLength(103);
  });
  it('recovers unknown gear from a retained participant after callbacks remove its roster row and maps', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]), chosen = required(originalSelected());
    const unknown: Item = { ...gear('removed-participant-callback-item'), equipped: true, equipSlot: 'head' };
    Object.assign(chosen, { equipment: [...chosen.equipment, unknown] });
    mercs().removeMerc(selected);
    restore(snapshot);
    expect(mercs().ownedMercs).toEqual(snapshot.ownedMercs);
    expect(mercs().mercEquipment).toEqual(snapshot.mercEquipment);
    expect(mercs().mercProgress).toEqual(snapshot.mercProgress);
    const recovered = inv().backpack.filter(item => item.id === unknown.id);
    expect(recovered).toEqual([gear(unknown.id)]);
    expect(recovered[0]).not.toHaveProperty('equipSlot');
    expect(inv().backpack.map(item => item.id)).toEqual(['backpack-first', 'backpack-last', unknown.id]);
  });
  it('preserves independent hero equipment and recomputes its cache without changing hero progression', () => {
    const cap: Item = { ...gear('independent-cap'), baseId: 'items/base/helm-cap', baseRolls: { defense: 5 } };
    useInventoryStore.setState(state => ({ backpack: [...state.backpack, cap] }));
    const hero = structuredClone(usePlayerStore.getState().player);
    if (!hero) throw new Error('Missing fixture hero');
    const snapshot = captureWarbandMercParticipants([selected, other]);
    expect(inv().equipItem(cap)).toEqual({ ok: true });
    restore(snapshot);
    expect(inv().equipped.head?.id).toBe(cap.id);
    expect(usePlayerStore.getState().player).toEqual({ ...hero, derivedStats: deriveEquippedPlayerStats(hero, hero.level,
      inv().equipped, useMapStore.getState().questProgress, inv().questItems, useMapStore.getState().questReceipts) });
    expect(usePlayerStore.getState().player?.derivedStats.lifeMax).toBe(hero.derivedStats.lifeMax + 7);
  });
  it('preserves valid independent hero XP and point spending during restoration while repairing affected gear', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]), before = required(usePlayerStore.getState().player);
    const blade = required(mercs().mercEquipment[selected]?.weapon);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(merc => merc.id === selected ? { ...merc, equipment: [] } : merc),
      mercEquipment: { ...state.mercEquipment, [selected]: {} } }));
    useInventoryStore.setState({ equipped: { weapon: blade } });
    usePlayerStore.setState({ player: { ...before, equipment: [blade],
      derivedStats: deriveEquippedPlayerStats(before, before.level, inv().equipped) } });
    const witness: { player: ReturnType<typeof usePlayerStore.getState>['player'] } = { player: null };
    stops.push(useInventoryStore.subscribe(() => {
      const gain = usePlayerStore.getState().gainExperience(before.experienceToNextLevel + 1);
      expect(gain.levelsGained).toBeGreaterThan(0);
      usePlayerStore.getState().allocateStatPoint('vitality');
      witness.player = structuredClone(usePlayerStore.getState().player);
    }));
    restore(snapshot);
    const independent = required(witness.player);
    expect(independent.coreStats.vitality).toBe(before.coreStats.vitality + 1);
    expect(usePlayerStore.getState().player).toEqual({ ...independent, equipment: [],
      derivedStats: deriveEquippedPlayerStats(independent, independent.level, inv().equipped,
        useMapStore.getState().questProgress, inv().questItems, useMapStore.getState().questReceipts) });
    expect(inv().equipped).toEqual({});
    expect(mercs().mercEquipment[selected]?.weapon?.id).toBe('selected-blade');
  });
  it('verifies restoration after callbacks and reports a silent participant mutation explicitly', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    stops.push(usePlayerStore.subscribe(() => { const chosen = originalSelected(); if (chosen) Object.assign(chosen, { level: 99 }); }));
    expect(() => { restore(snapshot); }).toThrow(AggregateError);
  });
  it('attempts remaining domains and reports a restoration observer exception explicitly', () => {
    const snapshot = captureWarbandMercParticipants([selected, other]);
    mercs().setFieldedMerc(selected);
    stops.push(useInventoryStore.subscribe(() => { throw new Error('restoration observer fault'); }));
    expect(() => { restore(snapshot); }).toThrow(AggregateError);
    expect(mercs().fieldedMercId).toBe(other);
  });
});
