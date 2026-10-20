import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { createMercFromDef } from './mercFactory';
import { useMercStore } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const gear: Item = { id: 'old', baseId: 'items/base/helm-cap', rarity: 'magic',
  level: 1, identified: true, equipped: true, equipSlot: 'head',
  affixes: [{ affixId: 'saved', values: new Map([['statMods.life', 7]]) }] };
const candidate: Item = { ...gear, id: 'candidate', equipped: false };
const { equipSlot: _slot, ...fields } = gear;
const returned: Item = { ...fields, equipped: false };
let mercId: string;

function seed(count: number) {
  const backpack = [candidate, ...Array.from({ length: count - 1 }, (_, i) => ({ ...candidate, id: `F${String(i)}` }))];
  useInventoryStore.setState({ backpack, stash: [{ ...candidate, id: 'stashed' }], currencies: { wishstone: 7 } });
  useMercStore.setState({ mercEquipment: { [mercId]: { head: gear } } });
  return backpack;
}

function attempt(action: () => unknown) {
  const inventory = useInventoryStore.getState();
  const merc = useMercStore.getState();
  const player = usePlayerStore.getState();
  const contents = structuredClone({ backpack: inventory.backpack, equipment: merc.mercEquipment });
  const inventoryPublications = vi.fn();
  const mercPublications = vi.fn();
  const stopInventory = useInventoryStore.subscribe(inventoryPublications);
  const stopMerc = useMercStore.subscribe(mercPublications);
  try { return { result: action(), inventory, merc, player, contents, inventoryPublications, mercPublications }; }
  finally { stopInventory(); stopMerc(); }
}

function unchanged(outcome: ReturnType<typeof attempt>, reason: string) {
  expect(useInventoryStore.getState() === outcome.inventory).toBe(true);
  expect(useMercStore.getState() === outcome.merc).toBe(true);
  expect(usePlayerStore.getState()).toBe(outcome.player);
  expect({ backpack: outcome.inventory.backpack, equipment: outcome.merc.mercEquipment }).toEqual(outcome.contents);
  expect(outcome.inventoryPublications).not.toHaveBeenCalled();
  expect(outcome.mercPublications).not.toHaveBeenCalled();
  expect(outcome.result).toEqual({ ok: false, reason });
}

beforeEach(() => {
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
  const def = loadMercPool().pool.find(entry => entry.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing authored merc');
  const merc = createMercFromDef(def);
  mercId = merc.id;
  useMercStore.getState().addMerc(merc);
});

describe('manual mercenary equipment capacity', () => {
  it.each([100, 101, 500])('refuses unequip at backpack %i without changing either domain', count => {
    seed(count);
    unchanged(attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head')), 'backpack_full');
    unchanged(attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head')), 'backpack_full');
  });

  it('unequips at99 to100 exactly once after making room, retaining complete Maps and unrelated state', () => {
    const backpack = seed(100);
    const originalGear = structuredClone(gear);
    useInventoryStore.getState().discardItem('F0');
    const before = useInventoryStore.getState();
    const outcome = attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head'));
    expect(outcome.result).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).toEqual([candidate, ...backpack.slice(2), returned]);
    expect(useInventoryStore.getState().backpack.at(-1)?.affixes).toBe(gear.affixes);
    expect(useMercStore.getState().getMercEquipment(mercId)).toEqual({ head: null });
    expect(useInventoryStore.getState().stash).toBe(before.stash);
    expect(useInventoryStore.getState().currencies).toBe(before.currencies);
    expect(useMercStore.getState().ownedMercs).toBe(outcome.merc.ownedMercs);
    expect(useMercStore.getState().mercProgress).toBe(outcome.merc.mercProgress);
    expect(usePlayerStore.getState()).toBe(outcome.player);
    expect(outcome.inventoryPublications).toHaveBeenCalledTimes(1);
    expect(outcome.mercPublications).toHaveBeenCalledTimes(1);
    expect(gear).toEqual(originalGear);
    unchanged(attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head')), 'not_found');
  });

  it.each([99, 100, 101, 500])('permits a complete nongrowing swap at%i', count => {
    const backpack = seed(count);
    const outcome = attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', candidate));
    expect(outcome.result).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).toEqual([...backpack.slice(1), returned]);
    expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...candidate, equipped: true, equipSlot: 'head' });
    expect(outcome.inventoryPublications).toHaveBeenCalledTimes(1);
    expect(outcome.mercPublications).toHaveBeenCalledTimes(1);
  });

  it.each([99, 100, 101, 500])('permits an overflow-reducing empty-slot equip at%i', count => {
    const backpack = seed(count);
    useMercStore.setState({ mercEquipment: { [mercId]: {} } });
    expect(useMercStore.getState().equipOnMerc(mercId, 'head', candidate)).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).toEqual(backpack.slice(1));
    expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...candidate, equipped: true, equipSlot: 'head' });
  });

  it('keeps owner/empty-slot/source/base refusal precedence when full', () => {
    seed(101);
    unchanged(attempt(() => useMercStore.getState().unequipFromMerc('unowned', 'head')), 'merc_not_owned');
    unchanged(attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'boots')), 'not_found');
    unchanged(attempt(() => useMercStore.getState().equipOnMerc('unowned', 'head', candidate)), 'merc_not_owned');
    unchanged(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', { ...candidate, id: 'missing' })), 'not_in_backpack');
    unchanged(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'boots', candidate)), 'incompatible_slot');
  });
});
