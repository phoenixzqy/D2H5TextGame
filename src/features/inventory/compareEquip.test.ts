import { assert, beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  checkEligibility,
  compareEquip,
  isClearNetUpgrade,
  netEquipDelta,
  resolveAutoEquipSlot,
  slotCandidates,
  slotMatches,
  type PlayerLike,
  type CompareResult,
  type ComparableStatKey
} from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats, DerivedStats, Resistances } from '@/engine/types/attributes';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';

function mkItem(baseId: string, overrides: Partial<Item> = {}): Item {
  return {
    id: `inst-${baseId}-${Math.random().toString(36).slice(2, 8)}`,
    baseId,
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: false,
    ...overrides
  };
}

function mkPlayer(level: number, core: Partial<CoreStats> = {}): PlayerLike {
  const coreStats: CoreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20, ...core };
  return { level, coreStats, derivedStats: deriveStats(coreStats, level) };
}

describe('slotMatches', () => {
  it('rings are interchangeable between left and right slots', () => {
    expect(slotMatches('ring-left', 'ring-right')).toBe(true);
    expect(slotMatches('ring-right', 'ring-left')).toBe(true);
  });
  it('non-ring slots require exact match', () => {
    expect(slotMatches('head', 'head')).toBe(true);
    expect(slotMatches('head', 'chest')).toBe(false);
    expect(slotMatches(null, 'head')).toBe(false);
  });
});

describe('slotCandidates', () => {
  it('returns only items whose base maps to the requested slot', () => {
    const cap = mkItem('items/base/helm-cap');
    const armor = mkItem('items/base/armor-quilted');
    const out = slotCandidates([cap, armor], 'head');
    expect(out.map((i) => i.baseId)).toEqual(['items/base/helm-cap']);
  });
});

describe('resolveAutoEquipSlot', () => {
  it('uses the empty right ring slot before replacing the left ring', () => {
    const left = mkItem('items/base/ring');
    expect(resolveAutoEquipSlot('ring-left', { 'ring-left': left })).toBe('ring-right');
  });

  it('falls back to left ring when both ring slots are occupied', () => {
    const left = mkItem('items/base/ring');
    const right = mkItem('items/base/ring');
    expect(resolveAutoEquipSlot('ring-left', { 'ring-left': left, 'ring-right': right })).toBe('ring-left');
  });
});

describe('checkEligibility', () => {
  it('flags level requirement when player is too low', () => {
    const item = mkItem('items/base/helm-war-hat');
    const result = checkEligibility(item, mkPlayer(5));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContainEqual({ kind: 'level', required: 22, current: 5 });
  });

  it('passes when player meets reqLevel and no reqStats', () => {
    const item = mkItem('items/base/helm-cap');
    const result = checkEligibility(item, mkPlayer(1));
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('uses unique template reqLevel when it is higher than the base requirement', () => {
    const item = mkItem('items/base/wp1h-short-sword', {
      rarity: 'unique',
      uniqueId: 'items/unique/rixots-keen'
    });
    const result = checkEligibility(item, mkPlayer(1));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContainEqual({ kind: 'level', required: 2, current: 1 });
  });

  it('returns eligible when base is not found in catalog', () => {
    const item = mkItem('items/base/does-not-exist');
    const result = checkEligibility(item, mkPlayer(1));
    expect(result.eligible).toBe(true);
  });
});

describe('compareEquip', () => {
  const bases = loadItemBases();

  it('reports a positive defense delta when upgrading helm cap (7) → skull-cap (12)', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const skullCap = mkItem('items/base/helm-skull-cap');
    const equipped: Record<string, Item | null> = { head: cap };
    const result = compareEquip(player, skullCap, 'head', equipped, bases);
    expect(result.current?.baseId).toBe('items/base/helm-cap');
    expect(result.stats.defense.delta).toBe(5);
  });

  it('reports a negative defense delta when downgrading helm', () => {
    const player = mkPlayer(10);
    const skullCap = mkItem('items/base/helm-skull-cap');
    const cap = mkItem('items/base/helm-cap');
    const equipped: Record<string, Item | null> = { head: skullCap };
    const result = compareEquip(player, cap, 'head', equipped, bases);
    expect(result.stats.defense.delta).toBe(-5);
  });

  it('reports zero deltas for unaffected stats and includes resistances bag', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const skullCap = mkItem('items/base/helm-skull-cap');
    const equipped: Record<string, Item | null> = { head: cap };
    const result = compareEquip(player, skullCap, 'head', equipped, bases);
    expect(result.stats.lifeMax.delta).toBe(0);
    expect(result.stats.attack.delta).toBe(0);
    expect(result.resistances.fire.delta).toBe(0);
    expect(Object.keys(result.resistances)).toEqual(
      expect.arrayContaining(['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'])
    );
  });

  it('treats an empty slot as null current (deltas equal candidate values)', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const equipped: Record<string, Item | null> = {};
    const result = compareEquip(player, cap, 'head', equipped, bases);
    expect(result.current).toBeNull();
    expect(result.stats.defense.delta).toBe(7);
  });

  it('identifies clear net upgrades only when no compared stat regresses', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const skullCap = mkItem('items/base/helm-skull-cap');
    const equipped: Record<string, Item | null> = { head: cap };

    const upgrade = compareEquip(player, skullCap, 'head', equipped, bases);
    const downgrade = compareEquip(player, cap, 'head', { head: skullCap }, bases);

    expect(isClearNetUpgrade(upgrade)).toBe(true);
    expect(netEquipDelta(upgrade)).toBeGreaterThan(0);
    expect(isClearNetUpgrade(downgrade)).toBe(false);
  });
});


/** Predictions must match real canonical displacement, including authored metadata. */
describe('compareEquip canonical action parity', () => {
  const bases = loadItemBases();
  const bowId = 'items/base/weapon-bow-training';
  const swordId = 'items/base/wp1h-short-sword';
  const shieldId = 'items/base/sh-buckler';

  beforeEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Compare', 'sorceress'), id: 'compare-player' });
  });
  afterEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
  });

  function hero() {
    const value = usePlayerStore.getState().player;
    assert(value);
    return value;
  }
  function stableItem(id: string, baseId: string, attack?: number): Item {
    return { id, baseId, rarity: 'normal', level: 1, ilvl: 1, identified: true,
      equipped: false, ...(attack === undefined ? {} : { baseRolls: { attack } }) };
  }
  function equip(item: Item) {
    useInventoryStore.getState().addItem(item);
    expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
  }
  function stateInputs() {
    const inventory = useInventoryStore.getState();
    return { player: hero(), equipped: inventory.equipped, backpack: inventory.backpack,
      stash: inventory.stash, currencies: inventory.currencies };
  }
  function expectParity(result: CompareResult, before: DerivedStats, after: DerivedStats) {
    for (const key of Object.keys(result.stats) as ComparableStatKey[]) {
      expect(result.stats[key], key).toEqual({ current: before[key], candidate: after[key], delta: after[key] - before[key] });
    }
    for (const key of Object.keys(result.resistances) as (keyof Resistances)[]) {
      expect(result.resistances[key], key).toEqual({ current: before.resistances[key],
        candidate: after.resistances[key], delta: after.resistances[key] - before.resistances[key] });
    }
  }
  function predictThenEquip(candidate: Item, slot: 'weapon' | 'offhand') {
    useInventoryStore.getState().addItem(candidate);
    const before = stateInputs();
    const snapshot = structuredClone(before);
    const candidateSnapshot = structuredClone(candidate);
    const baseSnapshot = structuredClone([...bases]);
    const result = compareEquip(before.player, candidate, slot, before.equipped, bases);
    const unchanged = stateInputs();
    expect(unchanged).toEqual(snapshot);
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(unchanged[key], key).toBe(before[key]);
    }
    expect(candidate).toEqual(candidateSnapshot);
    expect([...bases]).toEqual(baseSnapshot);
    // Real action runs before any prediction assertion: RED still proves actual outcome.
    expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: true });
    expect(before).toEqual(snapshot);
    expect(candidate).toEqual(candidateSnapshot);
    expect([...bases]).toEqual(baseSnapshot);
    return { result, before, after: hero(), inventory: useInventoryStore.getState() };
  }

  it('training13 displaces sword8 and shield6 in both prediction and actual equip', () => {
    const sword = stableItem('sword8', swordId, 8);
    const shield = stableItem('shield6', shieldId);
    const bow = stableItem('training13', bowId, 13);
    equip(sword);
    equip(shield);
    const { result, before, after, inventory } = predictThenEquip(bow, 'weapon');
    expect(inventory.equipped.weapon).toEqual({ ...bow, equipped: true });
    expect(inventory.equipped.offhand).toBeNull();
    expect(inventory.backpack).toEqual([sword, shield]);
    expect([before.player.derivedStats.attack, after.derivedStats.attack]).toEqual([30, 35]);
    expect([before.player.derivedStats.defense, after.derivedStats.defense]).toEqual([26, 20]);
    expect(result.current).toBe(before.equipped.weapon);
    expect(result.candidate).toBe(bow);
    expect(result.slot).toBe('weapon');
    expectParity(result, before.player.derivedStats, after.derivedStats);
    expect(result.stats.attack.delta).toBe(5);
    expect(result.stats.defense.delta).toBe(-6);
    expect(netEquipDelta(result)).toBe(-1);
    expect(isClearNetUpgrade(result)).toBe(false);
  });

  it('shield6 displaces training13 in both prediction and actual equip', () => {
    const bow = stableItem('training13', bowId, 13);
    const shield = stableItem('shield6', shieldId);
    equip(bow);
    const { result, before, after, inventory } = predictThenEquip(shield, 'offhand');
    expect(inventory.equipped.weapon).toBeNull();
    expect(inventory.equipped.offhand).toEqual({ ...shield, equipped: true });
    expect(inventory.backpack).toEqual([bow]);
    expect([before.player.derivedStats.attack, after.derivedStats.attack]).toEqual([35, 22]);
    expect([before.player.derivedStats.defense, after.derivedStats.defense]).toEqual([20, 26]);
    expect(result.current).toBeNull();
    expect(result.candidate).toBe(shield);
    expect(result.slot).toBe('offhand');
    expectParity(result, before.player.derivedStats, after.derivedStats);
    expect(result.stats.attack.delta).toBe(-13);
    expect(result.stats.defense.delta).toBe(6);
    expect(netEquipDelta(result)).toBe(-7);
    expect(isClearNetUpgrade(result)).toBe(false);
  });

  it('one-handed sword4 to sword8 retains shield and reports a real clear upgrade', () => {
    const weak = stableItem('sword4', swordId, 4);
    const sword = stableItem('sword8', swordId, 8);
    const shield = stableItem('shield6', shieldId);
    equip(weak);
    equip(shield);
    const { result, before, after, inventory } = predictThenEquip(sword, 'weapon');
    expect(inventory.equipped.weapon).toEqual({ ...sword, equipped: true });
    expect(inventory.equipped.offhand).toBe(before.equipped.offhand);
    expect(inventory.backpack).toEqual([weak]);
    expect([before.player.derivedStats.attack, after.derivedStats.attack]).toEqual([26, 30]);
    expect([before.player.derivedStats.defense, after.derivedStats.defense]).toEqual([26, 26]);
    expectParity(result, before.player.derivedStats, after.derivedStats);
    expect(netEquipDelta(result)).toBe(4);
    expect(isClearNetUpgrade(result)).toBe(true);
  });

  it.each(['wp2h-two-handed-sword', 'weapon-bow', 'weapon-crossbow', 'weapon-polearm'])(
    'retains actual catalog legacy ID displacement for %s in both directions', (id) => {
      const current = hero();
      usePlayerStore.getState().setPlayer({ ...current, level: 20, derivedStats: deriveStats(current.coreStats, 20) });
      const weapon = stableItem('legacy-weapon', `items/base/${id}`);
      const shield = stableItem('shield6', shieldId);
      equip(shield);
      const incoming = predictThenEquip(weapon, 'weapon');
      expect(incoming.inventory.equipped.offhand).toBeNull();
      expect(incoming.inventory.backpack).toEqual([shield]);
      expectParity(incoming.result, incoming.before.player.derivedStats, incoming.after.derivedStats);
      const beforeShield = stateInputs();
      const shieldCandidate = beforeShield.backpack[0];
      assert(shieldCandidate);
      const prediction = compareEquip(beforeShield.player, shieldCandidate, 'offhand', beforeShield.equipped, bases);
      expect(useInventoryStore.getState().equipItem(shieldCandidate)).toEqual({ ok: true });
      expect(useInventoryStore.getState().equipped.weapon).toBeNull();
      expect(useInventoryStore.getState().equipped.offhand).toEqual({ ...shield, equipped: true });
      expect(useInventoryStore.getState().backpack).toEqual([weapon]);
      expectParity(prediction, beforeShield.player.derivedStats, hero().derivedStats);
    }
  );
});
