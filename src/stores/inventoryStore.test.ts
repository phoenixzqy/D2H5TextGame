import { beforeEach, describe, expect, it } from 'vitest';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats, DerivedStats } from '@/engine/types/attributes';
import type { AffixRoll, Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const baseCoreStats: CoreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };

function makePlayer(): Player {
  return {
    id: 'p1',
    name: 'Tester',
    type: 'player',
    team: 'player',
    level: 1,
    coreStats: baseCoreStats,
    derivedStats: deriveStats(baseCoreStats, 1),
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    class: 'barbarian',
    experience: 0,
    experienceToNextLevel: 100,
    statPoints: 0,
    skillPoints: 0,
    equipment: []
  };
}

function item(id: string, baseId: string, affixes: AffixRoll[] = []): Item {
  return { id, baseId, rarity: 'magic', level: 1, identified: true, equipped: false, affixes };
}

function affix(values: readonly (readonly [string, number])[]): AffixRoll {
  return { affixId: 'affix-test', values: new Map(values) };
}

function addItems(...items: Item[]): void {
  for (const it of items) useInventoryStore.getState().addItem(it);
}

function playerDerived(): DerivedStats {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('missing test player');
  return player.derivedStats;
}

describe('useInventoryStore equipItem', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
    usePlayerStore.getState().setPlayer(makePlayer());
  });

  it('equips a helmet into the head slot and removes it from backpack', () => {
    const helm = item('helm-1', 'items/base/helm-cap');
    addItems(helm);

    expect(useInventoryStore.getState().equipItem(helm)).toEqual({ ok: true });

    const state = useInventoryStore.getState();
    expect(state.equipped.head?.id).toBe('helm-1');
    expect(state.backpack.map((i) => i.id)).not.toContain('helm-1');
  });

  it('swaps the previous item back to backpack when a slot is occupied', () => {
    const firstHelm = item('helm-1', 'items/base/helm-cap');
    const secondHelm = item('helm-2', 'items/base/helm-cap');
    addItems(firstHelm, secondHelm);

    expect(useInventoryStore.getState().equipItem(firstHelm)).toEqual({ ok: true });
    expect(useInventoryStore.getState().equipItem(secondHelm)).toEqual({ ok: true });

    const state = useInventoryStore.getState();
    expect(state.equipped.head?.id).toBe('helm-2');
    expect(state.backpack.map((i) => i.id)).toEqual(['helm-1']);
  });

  it('clears an equipped offhand back to backpack when equipping a two-handed weapon', () => {
    const shield = item('shield-1', 'items/base/sh-buckler');
    const twoHanded = item('weapon-2h', 'items/base/wp2h-two-handed-sword');
    addItems(shield, twoHanded);

    expect(useInventoryStore.getState().equipItem(shield)).toEqual({ ok: true });
    expect(useInventoryStore.getState().equipItem(twoHanded)).toEqual({ ok: true });

    const state = useInventoryStore.getState();
    expect(state.equipped.weapon?.id).toBe('weapon-2h');
    expect(state.equipped.offhand).toBeNull();
    expect(state.backpack.map((i) => i.id)).toEqual(['shield-1']);
  });

  it('routes rings to ring-left first and ring-right second', () => {
    const firstRing = item('ring-1', 'items/base/ring');
    const secondRing = item('ring-2', 'items/base/ring');
    addItems(firstRing, secondRing);

    expect(useInventoryStore.getState().equipItem(firstRing)).toEqual({ ok: true });
    expect(useInventoryStore.getState().equipItem(secondRing)).toEqual({ ok: true });

    const state = useInventoryStore.getState();
    expect(state.equipped['ring-left']?.id).toBe('ring-1');
    expect(state.equipped['ring-right']?.id).toBe('ring-2');
    expect(state.backpack).toEqual([]);
  });

  it('recomputes derived stats from equipment base stats and affix mods', () => {
    const helm = item('helm-1', 'items/base/helm-cap', [
      affix([
        ['coreStats.vitality', 5],
        ['statMods.life', 25],
        ['resistances.fire', 10]
      ])
    ]);
    addItems(helm);

    expect(useInventoryStore.getState().equipItem(helm)).toEqual({ ok: true });

    const expected = deriveStats(
      { ...baseCoreStats, vitality: baseCoreStats.vitality + 5 },
      1,
      { flatLife: 25, flatDefense: 7, resistances: { fire: 10, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } }
    );
    expect(playerDerived().lifeMax).toBe(expected.lifeMax);
    expect(playerDerived().defense).toBe(expected.defense);
    expect(playerDerived().resistances.fire).toBe(10);
  });

  it('returns no_slot for an unknown baseId without mutating state', () => {
    const unknown = item('unknown-1', 'items/base/not-real');
    addItems(unknown);
    const before = useInventoryStore.getState();

    expect(useInventoryStore.getState().equipItem(unknown)).toEqual({ ok: false, reason: 'no_slot' });

    const after = useInventoryStore.getState();
    expect(after.backpack).toEqual(before.backpack);
    expect(after.equipped).toEqual(before.equipped);
  });

  it('rejects a unique item when the player does not meet its template level requirement', () => {
    const uniqueSword: Item = {
      ...item('rixots', 'items/base/wp1h-short-sword'),
      rarity: 'unique',
      uniqueId: 'items/unique/rixots-keen'
    };
    addItems(uniqueSword);

    expect(useInventoryStore.getState().equipItem(uniqueSword)).toEqual({
      ok: false,
      reason: 'requirements_not_met'
    });

    const state = useInventoryStore.getState();
    expect(state.backpack.map((i) => i.id)).toEqual(['rixots']);
    expect(state.equipped.weapon).toBeUndefined();
  });
});

describe('useInventoryStore discard actions', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
    usePlayerStore.getState().setPlayer(makePlayer());
  });

  it('discardItem removes a backpack item permanently', () => {
    const helm = item('helm-1', 'items/base/helm-cap');
    addItems(helm);

    useInventoryStore.getState().discardItem('helm-1');

    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useInventoryStore.getState().stash).toEqual([]);
  });

  it('discardItem removes a stash item permanently', () => {
    const helm = item('helm-1', 'items/base/helm-cap');
    useInventoryStore.getState().addItem(helm, true);

    useInventoryStore.getState().discardItem('helm-1');

    expect(useInventoryStore.getState().stash).toEqual([]);
  });

  it('bulkDiscard removes every supplied id from both backpack and stash', () => {
    const a = item('a', 'items/base/helm-cap');
    const b = item('b', 'items/base/helm-cap');
    const c = item('c', 'items/base/helm-cap');
    addItems(a, b);
    useInventoryStore.getState().addItem(c, true);

    useInventoryStore.getState().bulkDiscard(['a', 'c']);

    const state = useInventoryStore.getState();
    expect(state.backpack.map((i) => i.id)).toEqual(['b']);
    expect(state.stash).toEqual([]);
  });

  it('bulkDiscard with an empty list is a no-op', () => {
    const a = item('a', 'items/base/helm-cap');
    addItems(a);
    useInventoryStore.getState().bulkDiscard([]);
    expect(useInventoryStore.getState().backpack.map((i) => i.id)).toEqual(['a']);
  });
});
