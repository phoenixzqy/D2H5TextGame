import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import * as loot from '@/data/loaders/loot';
import type { Item } from '@/engine/types/items';
import { createMercFromDef } from './mercFactory';
import { useMercStore } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const helm = 'items/base/helm-cap';
const sword = 'items/base/wp1h-short-sword';
let mercId: string;

function item(id: string, baseId = helm, fields: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false, ...fields };
}

function attempt(action: () => unknown) {
  const merc = useMercStore.getState();
  const inventory = useInventoryStore.getState();
  const player = usePlayerStore.getState();
  const contents = structuredClone({ backpack: inventory.backpack, stash: inventory.stash,
    equipment: merc.mercEquipment, owned: merc.ownedMercs, progress: merc.mercProgress });
  const mercPublications = vi.fn();
  const inventoryPublications = vi.fn();
  const stopMerc = useMercStore.subscribe(mercPublications);
  const stopInventory = useInventoryStore.subscribe(inventoryPublications);
  try { return { result: action(), merc, inventory, player, contents, mercPublications, inventoryPublications }; }
  finally { stopMerc(); stopInventory(); }
}

function expectRefusal(outcome: ReturnType<typeof attempt>, reason: string) {
  expect(useMercStore.getState()).toBe(outcome.merc);
  expect(useInventoryStore.getState()).toBe(outcome.inventory);
  expect(usePlayerStore.getState()).toBe(outcome.player);
  expect(outcome.mercPublications).not.toHaveBeenCalled();
  expect(outcome.inventoryPublications).not.toHaveBeenCalled();
  expect({ backpack: outcome.inventory.backpack, stash: outcome.inventory.stash,
    equipment: outcome.merc.mercEquipment, owned: outcome.merc.ownedMercs, progress: outcome.merc.mercProgress }).toEqual(outcome.contents);
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
  useInventoryStore.setState({ stash: [item('stashed')], currencies: { wishstone: 7 } });
});
afterEach(() => { vi.restoreAllMocks(); });

describe('mercenary equipment authoritative transfers', () => {
  it('refuses the actual stored runeword below its required level despite a forged plain caller', () => {
    const stored = item('steel', sword, { rarity: 'runeword', runewordId: 'runewords/steel', socketCapacity: 2,
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] });
    useInventoryStore.setState({ backpack: [stored] });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'weapon', item(stored.id, sword))), 'requirements_not_met');
    const merc = useMercStore.getState().ownedMercs[0];
    if (!merc) throw new Error('Missing mercenary fixture');
    useMercStore.setState({ ownedMercs: [{ ...merc, level: 13, derivedStats: { ...merc.derivedStats, life: 7, mana: 3 } }] });
    const baseline = useMercStore.getState().ownedMercs;
    expect(useMercStore.getState().equipOnMerc(mercId, 'weapon', stored)).toEqual({ ok: true });
    expect(useMercStore.getState().ownedMercs).toBe(baseline);
    expect(useInventoryStore.getState().backpack).toEqual([]);
  });
  it('checks core requirements against the mercenary rather than the hero or item bonuses', () => {
    const bases = loot.loadItemBases(), base = bases.get(helm);
    if (!base) throw new Error('Missing helm fixture');
    vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...bases, [helm, { ...base, reqStats: { strength: 80 } }]]));
    const merc = useMercStore.getState().ownedMercs[0];
    if (!merc) throw new Error('Missing mercenary fixture');
    useMercStore.setState({ ownedMercs: [{ ...merc, level: 99, coreStats: { ...merc.coreStats, strength: 79 } }] });
    const stored = item('strength-helm', helm, { affixes: [{ affixId: 'requirements-fixture', values: new Map([['coreStats.strength', 100]]) }] });
    useInventoryStore.setState({ backpack: [stored] });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', stored)), 'requirements_not_met');
    useMercStore.setState({ ownedMercs: [{ ...merc, level: 99, coreStats: { ...merc.coreStats, strength: 80 } }] });
    expect(useMercStore.getState().equipOnMerc(mercId, 'head', stored)).toEqual({ ok: true });
  });
  it('equips the complete stored item despite forged caller fields, consuming its source once', () => {
    const values = new Map([['coreStats.vitality', 5]]);
    const stored = item('selected', helm, { rarity: 'rare', ilvl: 7, identified: false,
      affixes: [{ affixId: 'saved-affix', values }], baseRolls: { defense: 11 }, socketContents: [] });
    const retained = item('retained');
    useInventoryStore.setState({ backpack: [retained, stored] });
    const original = structuredClone(stored);
    const outcome = attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head',
      item(stored.id, 'invalid-caller-base', { level: 99, equipSlot: 'boots' })));
    const equipped = useMercStore.getState().getMercEquipment(mercId).head;
    expect(equipped).toEqual({ ...stored, equipped: true, equipSlot: 'head' });
    expect(equipped?.affixes).toBe(stored.affixes);
    expect(useInventoryStore.getState().backpack).toEqual([retained]);
    expect(stored).toEqual(original);
    expect(outcome.result).toEqual({ ok: true });
  });

  it('refuses a missing current backpack source without publishing or inventing gear', () => {
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', item('absent'))), 'not_in_backpack');
  });

  it('refuses an unknown owner before a missing source or invalid base', () => {
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc('absent-merc', 'head', item('absent', 'invalid'))), 'merc_not_owned');
  });

  it('never creates orphan equipment for an unowned merc with a valid backpack source', () => {
    const source = item('valid-source');
    useInventoryStore.setState({ backpack: [source] });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc('absent-merc', 'head', source)), 'merc_not_owned');
  });

  it('validates the current stored slot rather than a stale compatible caller payload', () => {
    const stored = item('selected', sword);
    useInventoryStore.setState({ backpack: [stored] });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', item(stored.id))), 'incompatible_slot');
  });

  it('refuses an unknown stored base even if the caller supplies a valid base', () => {
    const stored = item('selected', 'invalid-stored-base');
    useInventoryStore.setState({ backpack: [stored] });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', item(stored.id))), 'incompatible_slot');
  });

  it('checks a missing source before caller slot compatibility and refuses a repeated equip', () => {
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', item('absent', 'invalid'))), 'not_in_backpack');
    const source = item('once');
    useInventoryStore.setState({ backpack: [source] });
    expect(useMercStore.getState().equipOnMerc(mercId, 'head', source)).toEqual({ ok: true });
    expectRefusal(attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', source)), 'not_in_backpack');
  });

  it.each(['ring-left', 'ring-right'] as const)('retains ring interchangeability in %s', slot => {
    const ring = item('ring', 'items/base/ring-iron');
    useInventoryStore.setState({ backpack: [ring] });
    expect(useMercStore.getState().equipOnMerc(mercId, slot, ring)).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useMercStore.getState().getMercEquipment(mercId)[slot]).toEqual({ ...ring, equipped: true, equipSlot: slot });
  });

  it('removes only the first backpack index, preserves same-ID stash items and normalizes displacement', () => {
    const source = item('duplicate', helm, { identified: false });
    const duplicate = item('duplicate', sword, { level: 7 });
    const stashed = item('duplicate', helm, { ilvl: 11 });
    const old = item('old', helm, { equipped: true, equipSlot: 'head', affixes: [
      { affixId: 'old-affix', values: new Map([['statMods.life', 7]]) }
    ] });
    useInventoryStore.setState({ backpack: [source, duplicate], stash: [stashed] });
    useMercStore.setState({ mercEquipment: { [mercId]: { head: old } } });
    const outcome = attempt(() => useMercStore.getState().equipOnMerc(mercId, 'head', source));
    const { equipSlot: _slot, ...returned } = old;
    expect(useInventoryStore.getState().backpack).toEqual([duplicate, { ...returned, equipped: false }]);
    expect(useInventoryStore.getState().stash).toBe(outcome.inventory.stash);
    expect(useInventoryStore.getState().currencies).toBe(outcome.inventory.currencies);
    expect(useMercStore.getState().ownedMercs).toBe(outcome.merc.ownedMercs);
    expect(useMercStore.getState().mercProgress).toBe(outcome.merc.mercProgress);
    expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...source, equipped: true, equipSlot: 'head' });
    expect(usePlayerStore.getState()).toBe(outcome.player);
    expect(outcome.mercPublications).toHaveBeenCalledTimes(1);
    expect(outcome.inventoryPublications).toHaveBeenCalledTimes(1);
    expect(outcome.result).toEqual({ ok: true });
    expect(old.equipped).toBe(true);
    expect(old.equipSlot).toBe('head');
  });

  it('returns a complete equipped item once, removes equipSlot and refuses a repeated unequip', () => {
    const old = item('old', helm, { equipped: true, equipSlot: 'head', affixes: [
      { affixId: 'old-affix', values: new Map([['statMods.life', 7]]) }
    ] });
    const retained = item('retained');
    useInventoryStore.setState({ backpack: [retained] });
    useMercStore.setState({ mercEquipment: { [mercId]: { head: old } } });
    const outcome = attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head'));
    const { equipSlot: _slot, ...returned } = old;
    expect(useInventoryStore.getState().backpack).toEqual([retained, { ...returned, equipped: false }]);
    expect(useInventoryStore.getState().backpack[1]?.affixes).toBe(old.affixes);
    expect(useMercStore.getState().getMercEquipment(mercId).head).toBeNull();
    expect(outcome.result).toEqual({ ok: true });
    expect(outcome.mercPublications).toHaveBeenCalledTimes(1);
    expect(outcome.inventoryPublications).toHaveBeenCalledTimes(1);
    expectRefusal(attempt(() => useMercStore.getState().unequipFromMerc(mercId, 'head')), 'not_found');
  });

  it('preserves orphaned legacy gear when its owner is absent', () => {
    const orphan = item('orphan', helm, { equipped: true });
    useMercStore.setState({ mercEquipment: { absent: { head: orphan } } });
    expectRefusal(attempt(() => useMercStore.getState().unequipFromMerc('absent', 'head')), 'merc_not_owned');
  });
});
