import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { deriveStats } from '@/engine/progression/stats';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from './inventoryStore';
import { createMercFromDef } from './mercFactory';
import { useMercStore } from './mercStore';
import { usePlayerStore } from './playerStore';
import {
  beginIronGolemDebit, beginWaveTransition, endIronGolemDebit, endWaveTransition,
  WaveGuardError
} from './waveTransitionGuard';

function item(id: string, equipped = false): Item {
  return { id, baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
    identified: true, equipped, ...(equipped ? { equipSlot: 'head' as const } : {}) };
}

function seed() {
  const pool = loadMercPool().pool;
  const def = pool[0];
  const hireDef = pool.find(entry => entry.id !== def?.id);
  if (!def || !hireDef) throw new Error('Authored mercenary controls missing');
  const geared = createMercFromDef(def, 'geared');
  const bare = createMercFromDef(def, 'bare');
  const freshMerc = createMercFromDef(def, 'new');
  const source = item('source');
  useInventoryStore.setState({ backpack: [item('sacrifice'), source, item('retained')],
    stash: [item('stashed')], equipped: { head: item('hero-head', true) }, currencies: { wishstone: 7 } });
  useMercStore.getState().addMerc(geared);
  useMercStore.getState().addMerc(bare);
  useMercStore.setState({ mercEquipment: { [geared.id]: { head: item('merc-head', true) }, [bare.id]: {} } });
  return { geared, bare, freshMerc, hireDef, source };
}

type Fixture = ReturnType<typeof seed>;
const actions: readonly { name: string; run: (fixture: Fixture) => unknown }[] = [
  { name: 'inventory add backpack', run: () => { useInventoryStore.getState().addItem(item('added')); } },
  { name: 'inventory add stash', run: () => { useInventoryStore.getState().addItem(item('added'), true); } },
  { name: 'inventory remove', run: () => { useInventoryStore.getState().removeItem('source'); } },
  { name: 'inventory discard', run: () => { useInventoryStore.getState().discardItem('source'); } },
  { name: 'inventory bulk discard', run: () => { useInventoryStore.getState().bulkDiscard(['source', 'stashed']); } },
  { name: 'inventory equip', run: f => useInventoryStore.getState().equipItem(f.source) },
  { name: 'inventory unequip', run: () => useInventoryStore.getState().unequipItem('head') },
  { name: 'inventory move to stash', run: () => useInventoryStore.getState().moveToStash('source') },
  { name: 'inventory move to backpack', run: () => useInventoryStore.getState().moveToBackpack('stashed') },
  { name: 'inventory reset', run: () => { useInventoryStore.getState().reset(); } },
  { name: 'merc add', run: f => { useMercStore.getState().addMerc(f.freshMerc); } },
  { name: 'merc hire', run: f => useMercStore.getState().hireMerc(f.hireDef) },
  { name: 'merc remove', run: f => { useMercStore.getState().removeMerc(f.geared.id); } },
  { name: 'merc dismiss', run: f => useMercStore.getState().dismissMerc(f.bare.id) },
  { name: 'merc equip', run: f => useMercStore.getState().equipOnMerc(f.geared.id, 'head', f.source) },
  { name: 'merc unequip', run: f => useMercStore.getState().unequipFromMerc(f.geared.id, 'head') },
  { name: 'merc reset', run: () => { useMercStore.getState().reset(); } }
];

function expectDebitRefusal(action: () => unknown): void {
  let failure: unknown;
  try { action(); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(WaveGuardError);
  expect(failure).toMatchObject({ code: 'itemDebitBusy' });
}

function ownership() {
  const inventory = useInventoryStore.getState();
  return { backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    mercEquipment: useMercStore.getState().mercEquipment };
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  useMercStore.getState().reset();
  usePlayerStore.getState().reset();
});

describe('supported ownership actions during an exact Iron debit', () => {
  it.each(actions)('refuses $name before any publication or ownership change', ({ run }) => {
    const fixture = seed();
    const inventory = useInventoryStore.getState();
    const merc = useMercStore.getState();
    const player = usePlayerStore.getState();
    const before = structuredClone(ownership());
    const notified = vi.fn();
    const stopInventory = useInventoryStore.subscribe(notified);
    const stopMerc = useMercStore.subscribe(notified);
    const stopPlayer = usePlayerStore.subscribe(notified);
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try {
      expectDebitRefusal(() => run(fixture));
      expect(useInventoryStore.getState()).toBe(inventory);
      expect(useMercStore.getState()).toBe(merc);
      expect(usePlayerStore.getState()).toBe(player);
      expect(ownership()).toEqual(before);
      expect(notified).not.toHaveBeenCalled();
    } finally {
      stopInventory(); stopMerc(); stopPlayer();
      endIronGolemDebit(lease);
      endWaveTransition(lease);
    }
  });

  it.each(actions)('allows real $name mutations while wave-owned but outside debit', ({ run }) => {
    const fixture = seed();
    const before = ownership();
    const lease = beginWaveTransition(true);
    try {
      run(fixture);
      const after = ownership();
      expect(Object.keys(before).some(key =>
        after[key as keyof typeof after] !== before[key as keyof typeof before])).toBe(true);
    } finally { endWaveTransition(lease); }
  });

  it.each(['hero', 'merc'] as const)('refuses %s equip before reading a caller item', target => {
    const fixture = seed();
    const requested = item('trap');
    const read = vi.fn(() => { throw new Error('caller item must not be read'); });
    Object.defineProperty(requested, 'id', { get: read });
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try {
      expectDebitRefusal(() => target === 'hero' ? useInventoryStore.getState().equipItem(requested)
        : useMercStore.getState().equipOnMerc(fixture.geared.id, 'head', requested));
      expect(read).not.toHaveBeenCalled();
    } finally { endIronGolemDebit(lease); endWaveTransition(lease); }
  });

  it.each([
    { target: 'inventory', caught: true }, { target: 'inventory', caught: false },
    { target: 'merc', caught: true }, { target: 'merc', caught: false }
  ])('preserves the sole installed backpack when $target observer refusal is caught=$caught', ({ target, caught }) => {
    const fixture = seed();
    const before = ownership();
    const expectedBackpack = before.backpack.filter(item => item.id !== 'sacrifice');
    const errors: unknown[] = [];
    const nested = () => target === 'inventory'
      ? useInventoryStore.getState().moveToStash('source')
      : useMercStore.getState().equipOnMerc(fixture.geared.id, 'head', fixture.source);
    let notifications = 0;
    const stop = useInventoryStore.subscribe(() => {
      notifications++;
      if (caught) {
        try { nested(); } catch (error) { errors.push(error); }
      } else nested();
    });
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try {
      const publish = () => { useInventoryStore.setState({ backpack: expectedBackpack }); };
      if (caught) {
        expect(publish).not.toThrow();
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(WaveGuardError);
        expect(errors[0]).toMatchObject({ code: 'itemDebitBusy' });
      } else expectDebitRefusal(publish);
      expect(notifications).toBe(1);
      const after = ownership();
      expect(after.backpack).toBe(expectedBackpack);
      expect(after.stash).toBe(before.stash);
      expect(after.equipped).toBe(before.equipped);
      expect(after.mercEquipment).toBe(before.mercEquipment);
    } finally { stop(); endIronGolemDebit(lease); endWaveTransition(lease); }
    expect(nested()).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).not.toBe(expectedBackpack);
  });

  it('keeps currency, read-only and merc progression/fielding actions available without changing ownership', () => {
    const fixture = seed();
    const before = ownership();
    const coreStats = { strength: 100, dexterity: 100, vitality: 100, energy: 100 };
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try {
      const inventory = useInventoryStore.getState();
      inventory.addCurrency('wishstone', 2);
      expect(inventory.spendCurrency('wishstone', 1)).toBe(true);
      expect(inventory.getCurrency('wishstone')).toBe(8);
      expect(inventory.eligibleForSlot('head', { level: 99, coreStats, derivedStats: deriveStats(coreStats, 99) }))
        .toContain(fixture.source);
      const merc = useMercStore.getState();
      expect(merc.hasEquippedItems(fixture.geared.id)).toBe(true);
      expect(merc.getMercEquipment(fixture.geared.id).head?.id).toBe('merc-head');
      merc.setFieldedMerc(fixture.bare.id);
      merc.upgradeMerc(fixture.bare.id);
      merc.addExperience(fixture.bare.id, 1);
      merc.shareExperienceWithFielded(2);
      expect(merc.getFieldedMerc()?.id).toBe(fixture.bare.id);
      expect(merc.getMercProgress(fixture.bare.id).experience).toBe(2);
      const after = ownership();
      for (const key of Object.keys(before) as (keyof typeof before)[]) expect(after[key]).toBe(before[key]);
    } finally { endIronGolemDebit(lease); endWaveTransition(lease); }
  });
});
