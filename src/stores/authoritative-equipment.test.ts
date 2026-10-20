import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const realRecompute = usePlayerStore.getState().recomputeDerived;
const helmBase = 'items/base/helm-cap';
const oneHandedBase = 'items/base/wp1h-short-sword';
const twoHandedBase = 'items/base/wp2h-two-handed-sword';

function item(id: string, baseId = helmBase, fields: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false, ...fields };
}

function arrange(backpack: Item[], equipped: Record<string, Item | null> = {}): void {
  useInventoryStore.setState({
    backpack,
    equipped,
    stash: [item('stashed')],
    currencies: { rune: 3 }
  });
}

function attempt(requested: Item) {
  const recompute = vi.fn(realRecompute);
  usePlayerStore.setState({ recomputeDerived: recompute });
  const inventoryBefore = useInventoryStore.getState();
  const playerBefore = usePlayerStore.getState();
  const contentsBefore = structuredClone({
    backpack: inventoryBefore.backpack,
    equipped: inventoryBefore.equipped,
    requested
  });
  const publish = vi.fn();
  const unsubscribe = useInventoryStore.subscribe(publish);
  try {
    const result = inventoryBefore.equipItem(requested);
    return { result, inventoryBefore, playerBefore, contentsBefore, requested, publish, recompute };
  } finally {
    unsubscribe();
  }
}

function expectInputsUnchanged(outcome: ReturnType<typeof attempt>): void {
  expect(outcome.inventoryBefore.backpack).toEqual(outcome.contentsBefore.backpack);
  expect(outcome.inventoryBefore.equipped).toEqual(outcome.contentsBefore.equipped);
  expect(outcome.requested).toEqual(outcome.contentsBefore.requested);
}

function expectRefusal(outcome: ReturnType<typeof attempt>, reason: string): void {
  expect(outcome.result).toEqual({ ok: false, reason });
  const after = useInventoryStore.getState();
  expect(after).toBe(outcome.inventoryBefore);
  expect(after.backpack).toBe(outcome.inventoryBefore.backpack);
  expect(after.equipped).toBe(outcome.inventoryBefore.equipped);
  expect(after.stash).toBe(outcome.inventoryBefore.stash);
  expect(after.currencies).toBe(outcome.inventoryBefore.currencies);
  expect(usePlayerStore.getState()).toBe(outcome.playerBefore);
  expect(outcome.publish).not.toHaveBeenCalled();
  expect(outcome.recompute).not.toHaveBeenCalled();
  expectInputsUnchanged(outcome);
}

function expectSuccess(outcome: ReturnType<typeof attempt>, backpack: Item[]): void {
  expect(outcome.result).toEqual({ ok: true });
  const after = useInventoryStore.getState();
  expect(after.backpack).toEqual(backpack);
  expect(after.stash).toBe(outcome.inventoryBefore.stash);
  expect(after.currencies).toBe(outcome.inventoryBefore.currencies);
  expect(outcome.publish).toHaveBeenCalledTimes(1);
  expect(outcome.recompute).toHaveBeenCalledTimes(1);
  expect(outcome.recompute).toHaveBeenCalledWith(after.equipped);
  expectInputsUnchanged(outcome);
}

describe('equipment resolves the authoritative backpack item', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.setState({ recomputeDerived: realRecompute });
    usePlayerStore.getState().reset();
    usePlayerStore.getState().setPlayer(createMockPlayer('Equipment tester', 'barbarian'));
  });

  afterEach(() => {
    usePlayerStore.setState({ recomputeDerived: realRecompute });
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
  });

  it('rejects a missing source before inspecting an invalid caller base', () => {
    arrange([item('retained')]);

    expectRefusal(attempt(item('missing', 'items/base/not-real')), 'not_in_backpack');
  });

  it('rejects an unknown stored base even when the caller supplies a valid base', () => {
    const stored = item('source', 'items/base/not-real');
    arrange([stored]);

    expectRefusal(attempt({ ...stored, baseId: helmBase }), 'no_slot');
  });

  it('equips a valid stored base even when the caller supplies an unknown base', () => {
    const stored = item('source');
    const retained = item('retained');
    arrange([retained, stored]);

    const outcome = attempt({ ...stored, baseId: 'items/base/not-real' });

    expectSuccess(outcome, [retained]);
    expect(useInventoryStore.getState().equipped.head).toEqual({ ...stored, equipped: true });
  });

  it('uses the stored two-handed base to displace both weapon and offhand', () => {
    const stored = item('source', twoHandedBase);
    const weapon = item('old-weapon', oneHandedBase, { equipped: true });
    const shield = item('old-shield', 'items/base/sh-buckler', { equipped: true });
    const retained = item('retained');
    arrange([stored, retained], { weapon, offhand: shield });

    const outcome = attempt({ ...stored, baseId: oneHandedBase });

    expectSuccess(outcome, [retained, { ...weapon, equipped: false }, { ...shield, equipped: false }]);
    expect(useInventoryStore.getState().equipped).toEqual({
      weapon: { ...stored, equipped: true }, offhand: null
    });
  });

  it('uses the stored one-handed base to retain the offhand', () => {
    const stored = item('source', oneHandedBase);
    const weapon = item('old-weapon', oneHandedBase, { equipped: true });
    const shield = item('old-shield', 'items/base/sh-buckler', { equipped: true });
    arrange([stored], { weapon, offhand: shield });

    const outcome = attempt({ ...stored, baseId: twoHandedBase });

    expectSuccess(outcome, [{ ...weapon, equipped: false }]);
    expect(useInventoryStore.getState().equipped).toEqual({
      weapon: { ...stored, equipped: true }, offhand: shield
    });
    expect(useInventoryStore.getState().equipped.offhand).toBe(shield);
  });

  it('enforces the stored unique requirement despite a normal caller payload', () => {
    const stored = item('source', oneHandedBase, {
      rarity: 'unique', uniqueId: 'items/unique/rixots-keen'
    });
    arrange([stored]);

    expectRefusal(attempt(item(stored.id, oneHandedBase)), 'requirements_not_met');
  });

  it('equips an eligible stored normal item despite a high-requirement caller unique', () => {
    const stored = item('source', oneHandedBase);
    arrange([stored]);

    const outcome = attempt({ ...stored, rarity: 'unique', uniqueId: 'items/unique/rixots-keen' });

    expectSuccess(outcome, []);
    expect(useInventoryStore.getState().equipped.weapon).toEqual({ ...stored, equipped: true });
  });

  it('preserves stored fields and affix Maps and derives only their actual modifiers', () => {
    const values = new Map([
      ['coreStats.vitality', 5], ['statMods.life', 25], ['resistances.fire', 10]
    ]);
    const stored = item('source', helmBase, {
      rarity: 'rare', level: 3, ilvl: 7, identified: false,
      baseRolls: { defense: 11 }, generatedName: { prefix: 'actual-prefix' },
      affixes: [{ affixId: 'actual-affix', values }],
      runes: ['actual-rune'], statRolls: { 'statMods.life': 25 }
    });
    const retained = item('retained');
    arrange([stored, retained]);
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('missing fixture player');
    const expected = deriveStats({ ...player.coreStats, vitality: player.coreStats.vitality + 5 }, 1, {
      flatLife: 25, flatDefense: 11,
      resistances: { fire: 10, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    });

    const outcome = attempt(item(stored.id, helmBase, {
      rarity: 'magic', level: 99, ilvl: 99, identified: true, equipped: true,
      baseRolls: { defense: 999 }, generatedName: { suffix: 'invented-suffix' },
      affixes: [{ affixId: 'invented-affix', values: new Map([['statMods.life', 999]]) }],
      statRolls: { 'statMods.life': 999 }, equipSlot: 'boots'
    }));

    expectSuccess(outcome, [retained]);
    const equipped = useInventoryStore.getState().equipped.head;
    expect(equipped).toEqual({ ...stored, equipped: true });
    expect(equipped?.affixes).toBe(stored.affixes);
    const equippedAffix = equipped?.affixes?.[0];
    expect(equippedAffix && 'values' in equippedAffix && equippedAffix.values).toBe(values);
    const derived = usePlayerStore.getState().player?.derivedStats;
    expect(derived).toEqual({
      ...expected,
      life: Math.min(expected.lifeMax, player.derivedStats.life),
      mana: Math.min(expected.manaMax, player.derivedStats.mana)
    });
  });

  it('equips only the first matching stored item and retains another complete same-ID item', () => {
    const first = item('duplicate', helmBase, { ilvl: 3, identified: false });
    const second = item('duplicate', oneHandedBase, {
      rarity: 'magic', affixes: [{ affixId: 'retained-affix', values: new Map([['statMods.life', 8]]) }]
    });
    const retained = item('retained');
    arrange([retained, first, second]);

    const outcome = attempt(second);

    expectSuccess(outcome, [retained, second]);
    expect(useInventoryStore.getState().backpack[1]).toBe(second);
    expect(useInventoryStore.getState().equipped).toEqual({ head: { ...first, equipped: true } });
  });
});
