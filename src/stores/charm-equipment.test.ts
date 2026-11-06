import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as loot from '@/data/loaders/loot';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { compareEquip } from '@/features/inventory/compareEquip';
import { aggregateEquipmentMods, aggregateCanonicalEquipmentMods } from '@/engine/progression/equipment-mods';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import type { Item, ItemBase, UniqueItemDef } from '@/engine/types/items';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { createMercFromDef } from './mercFactory';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { BACKPACK_CAPACITY } from './inventoryCapacity';

const charmBase: ItemBase = { id: 'items/base/small-charm', name: 'items.base.small-charm',
  type: 'charm', slot: 'charm', reqLevel: 1, maxSockets: 0, metal: false, canHaveAffixes: false };
const unique: UniqueItemDef = { id: 'items/unique/ormus-charm', baseId: charmBase.id,
  name: 'items.unique.ormus-charm.name', reqLevel: 1, stats: { statMods: { life: 20, mana: 10 } } };
const bases = loot.loadItemBases(), uniques = loot.loadUniques().filter(row => row.id !== unique.id);
function item(id = 'charm', fields: Partial<Item> = {}): Item {
  return { id, baseId: charmBase.id, rarity: 'unique', uniqueId: unique.id,
    level: 32, ilvl: 32, socketCapacity: 0, identified: true, equipped: false, ...fields };
}
function ordinary(id: string, fields: Partial<Item>): Item {
  const { uniqueId: _unique, ...value } = item(id, fields);
  return value;
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing fixture hero');
  return value;
}
function merc() {
  const def = loadMercPool().pool[0];
  if (!def) throw new Error('Missing authored merc');
  const value = createMercFromDef(def);
  useMercStore.getState().addMerc(value);
  return value;
}
beforeEach(() => {
  vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...bases, [charmBase.id, charmBase]]));
  vi.spyOn(loot, 'loadUniques').mockReturnValue([...uniques, unique]);
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useMapStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Charm tester', 'sorceress'));
  usePlayerStore.getState().recomputeDerived({});
});
afterEach(() => {
  useInventoryStore.getState().reset(); useMercStore.getState().reset();
  usePlayerStore.getState().reset(); useMapStore.getState().reset(); vi.restoreAllMocks();
});

describe('hero-only canonical charm composition', () => {
  it('filters the entire inactive item package before aggregation and leaves historical composition unchanged', () => {
    const charm = item(), cap = ordinary('cap', { baseId: 'items/base/helm-cap',
      affixes: [{ affixId: 'life', values: new Map([['statMods.life', 7]]) }] });
    expect(aggregateEquipmentMods({ charm, head: charm, arbitrary: charm })).toEqual({ life: 20, mana: 10 });
    expect(aggregateEquipmentMods({ charm: cap })).toEqual({});
    expect(aggregateEquipmentMods({ arbitrary: cap, head: cap }).life).toBe(14);
    expect(aggregateCanonicalEquipmentMods({ head: charm }, { uniques: [unique] })).toEqual({ life: 20, mana: 10 });
  });
  it('ignores inventory and actor mirrors and exposes the same comparison and native capacities', () => {
    const charm = item(), before = player().derivedStats;
    useInventoryStore.setState({ backpack: [charm], stash: [item('stashed')] });
    usePlayerStore.setState({ player: { ...player(), equipment: [item('mirror')] } });
    expect(playerToCombatUnit(player()).stats.lifeMax).toBe(before.lifeMax);
    const comparison = compareEquip(player(), charm, 'charm', {});
    expect([comparison.stats.lifeMax.delta, comparison.stats.manaMax.delta]).toEqual([20, 10]);
    expect(useInventoryStore.getState().equipItem({ ...charm, baseId: 'fake' })).toEqual({ ok: true });
    const unit = playerToCombatUnit(player());
    expect([unit.stats.lifeMax, unit.stats.manaMax]).toEqual([before.lifeMax + 20, before.manaMax + 10]);
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    expect(player().derivedStats.lifeMax).toBe(before.lifeMax + 20);
  });
  it('keeps merc stats/resources bare even for corrupt reserved-key and other-slot copies', () => {
    const owned = merc(), before = structuredClone(owned), charm = item();
    const cap = ordinary('cap', { baseId: 'items/base/helm-cap', baseRolls: { defense: 6 } });
    expect(deriveEquippedMercStats(owned, { charm: cap, head: charm, legacy: charm })).toEqual(owned.derivedStats);
    expect(mercToCombatUnit(owned, undefined, { charm, head: charm }).stats).toEqual(owned.derivedStats);
    expect(owned).toEqual(before);
  });
});

describe('charm ownership transactions', () => {
  it.each(['backpack', 'stash', 'hero', 'merc', 'orphan'] as const)('refuses duplicate charm ownership in %s without publication', where => {
    const charm = item(); useInventoryStore.setState({ backpack: [charm] });
    if (where === 'backpack') useInventoryStore.setState({ backpack: [charm, charm] });
    if (where === 'stash') useInventoryStore.setState({ stash: [charm] });
    if (where === 'hero') useInventoryStore.setState({ equipped: { legacy: charm } });
    if (where === 'merc' || where === 'orphan') {
      const id = where === 'merc' ? merc().id : 'orphan';
      useMercStore.setState({ mercEquipment: { [id]: { head: charm } } });
    }
    const before = useInventoryStore.getState(), hero = player();
    expect(before.equipItem(charm)).toEqual({ ok: false, reason: 'no_slot' });
    expect(useInventoryStore.getState()).toBe(before); expect(player()).toBe(hero);
  });
  it('rejects duplicate ingress without publishing and accepts distinct charms', () => {
    const charm = item(); useInventoryStore.getState().addItem(charm);
    const before = useInventoryStore.getState();
    expect(() => { before.addItem({ ...charm }); }).toThrow();
    expect(useInventoryStore.getState()).toBe(before);
    before.addItem(item('different'), true);
    expect(useInventoryStore.getState().stash.map(row => row.id)).toEqual(['different']);
  });
  it('rejects an impostor automatic target using the same rule as an explicit target', () => {
    const impostor = { ...charmBase, type: 'jewelry' as const };
    vi.mocked(loot.loadItemBases).mockReturnValue(new Map([...bases, [charmBase.id, impostor]]));
    const charm = item(); useInventoryStore.setState({ backpack: [charm] });
    const before = useInventoryStore.getState();
    expect(before.equipItem(charm)).toEqual({ ok: false, reason: 'no_slot' });
    expect(before.equipItem(charm, 'charm')).toEqual({ ok: false, reason: 'no_slot' });
    expect(useInventoryStore.getState()).toBe(before);
  });
  it('refuses merc charm equip and noncharm reserved-slot equip atomically', () => {
    const owned = merc(), charm = item(), cap = ordinary('cap', { baseId: 'items/base/helm-cap' });
    useInventoryStore.setState({ backpack: [charm, cap] });
    const before = useInventoryStore.getState(), mercBefore = useMercStore.getState();
    expect(mercBefore.equipOnMerc(owned.id, 'charm', charm)).toEqual({ ok: false, reason: 'incompatible_slot' });
    expect(mercBefore.equipOnMerc(owned.id, 'head', charm)).toEqual({ ok: false, reason: 'incompatible_slot' });
    expect(mercBefore.equipOnMerc(owned.id, 'charm', cap)).toEqual({ ok: false, reason: 'incompatible_slot' });
    expect(useInventoryStore.getState()).toBe(before); expect(useMercStore.getState()).toBe(mercBefore);
  });
  it.each(['low', 'full', 'zero'] as const)('preserves %s current pools on equip/replacement and clamps removal', state => {
    const base = player().derivedStats, life = state === 'low' ? 7 : state === 'zero' ? 0 : base.lifeMax;
    const mana = state === 'low' ? 3 : state === 'zero' ? 0 : base.manaMax;
    usePlayerStore.setState({ player: { ...player(), derivedStats: { ...base, life, mana } } });
    const first = item(), second = item('replacement'); useInventoryStore.setState({ backpack: [first, second] });
    expect(useInventoryStore.getState().equipItem(first)).toEqual({ ok: true });
    expect(player().derivedStats).toMatchObject({ life, mana, lifeMax: base.lifeMax + 20, manaMax: base.manaMax + 10 });
    expect(useInventoryStore.getState().equipItem(second)).toEqual({ ok: true });
    expect(player().derivedStats).toMatchObject({ life, mana });
    expect(useInventoryStore.getState().backpack).toEqual([{ ...first, equipped: false }]);
    // Controlled filled capacity checks removal's clamp, separately from equip's no-heal rule.
    if (state === 'full') usePlayerStore.setState({ player: { ...player(), derivedStats: {
      ...player().derivedStats, life: base.lifeMax + 20, mana: base.manaMax + 10 } } });
    expect(useInventoryStore.getState().unequipItem('charm')).toEqual({ ok: true });
    expect(player().derivedStats).toMatchObject({ lifeMax: base.lifeMax, manaMax: base.manaMax,
      life: state === 'full' ? base.lifeMax : life, mana: state === 'full' ? base.manaMax : mana });
    expect(useInventoryStore.getState().backpack).toEqual([{ ...first, equipped: false }, { ...second, equipped: false }]);
  });
  it('allows full and overflow swaps but refuses an overflowing removal without losing either owner', () => {
    const first = item('old'), second = item('new');
    for (const length of [BACKPACK_CAPACITY, BACKPACK_CAPACITY + 1]) {
      useInventoryStore.setState({ backpack: [second, ...Array.from({ length: length - 1 }, (_, i) => item(`bag-${String(i)}`))],
        equipped: { charm: first } });
      expect(useInventoryStore.getState().equipItem(second)).toEqual({ ok: true });
      const before = useInventoryStore.getState();
      expect(before.backpack).toHaveLength(length);
      expect(before.backpack.at(-1)).toEqual({ ...first, equipped: false });
      expect(before.unequipItem('charm')).toEqual({ ok: false, reason: 'backpack_full' });
      expect(useInventoryStore.getState()).toBe(before);
    }
  });
});
