import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';

const empty: CoreStats = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
type DraftAction = (deltas: CoreStats, expectedPlayer: Player) => string;

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing draft fixture');
  return current;
}

function arrange(extra: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('Draft allocation', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 4, statPoints: 5, equipment: [],
    derivedStats: { ...deriveStats(fresh.coreStats, 4), life: 11, mana: 7 }, ...extra });
  return player();
}

/** Promised new API: absence is explicit feature RED, without adding a runtime stub. */
function allocate(deltas: CoreStats, basis: Player): string {
  const state = usePlayerStore.getState() as unknown as { allocateStatPoints: DraftAction };
  expect(state.allocateStatPoints).toBeTypeOf('function');
  return state.allocateStatPoints(deltas, basis);
}

function attempt(deltas: CoreStats, basis: Player) {
  const before = usePlayerStore.getState();
  const inventory = useInventoryStore.getState();
  const payload = structuredClone({ player: before.player, backpack: inventory.backpack,
    equipped: inventory.equipped, stash: inventory.stash, currencies: inventory.currencies });
  const basisPayload = structuredClone(basis);
  const published: (Player | null)[] = [];
  const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
  try { return { result: allocate(deltas, basis), before, inventory, payload, basisPayload, published }; }
  finally { stop(); }
}

function refuse(deltas: CoreStats, basis: Player, result: string): void {
  const outcome = attempt(deltas, basis);
  expect(outcome.result).toBe(result);
  expect(usePlayerStore.getState()).toBe(outcome.before);
  expect(useInventoryStore.getState()).toBe(outcome.inventory);
  const inventory = useInventoryStore.getState();
  expect({ player: usePlayerStore.getState().player, backpack: inventory.backpack,
    equipped: inventory.equipped, stash: inventory.stash, currencies: inventory.currencies }).toEqual(outcome.payload);
  expect(basis).toEqual(outcome.basisPayload);
  expect(outcome.published).toEqual([]);
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
});
afterEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
});

describe('atomic cancellable attribute draft boundary', () => {
  it('commits mixed five-point allocation in one complete publication without healing', () => {
    const before = arrange();
    const deltas = Object.freeze({ ...empty, dexterity: 1, vitality: 2, energy: 2 });
    const outcome = attempt(deltas, before);
    const physDodge: unknown = expect.closeTo(0.102, 12);
    const expected = { ...before, statPoints: 0,
      coreStats: { strength: 10, dexterity: 26, vitality: 12, energy: 37 },
      derivedStats: { ...before.derivedStats, lifeMax: 148, manaMax: 117,
        attack: 29, attackSpeed: 126, physDodge } };
    expect(before).toEqual(outcome.basisPayload);
    expect(outcome.result).toBe('ok');
    expect(player()).toEqual(expected);
    expect(outcome.published).toEqual([expected]);
    expect(useInventoryStore.getState()).toBe(outcome.inventory);
    expect(deltas).toEqual({ strength: 0, dexterity: 1, vitality: 2, energy: 2 });
  });

  it('documents why a loop of compatibility actions cannot implement atomic Apply', () => {
    const before = arrange({ coreStats: { strength: 10, dexterity: 25, vitality: 500, energy: 35 } });
    const published: (Player | null)[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
    try {
      usePlayerStore.getState().allocateStatPoint('energy');
      usePlayerStore.getState().allocateStatPoint('vitality');
      usePlayerStore.getState().allocateStatPoint('dexterity');
    } finally { stop(); }
    expect(published).toHaveLength(2);
    expect(player().statPoints).toBe(3);
    expect(player().coreStats).toEqual({ ...before.coreStats, energy: 36, dexterity: 26 });
  });

  it('refuses no player before malformed deltas or stale reference checks', () => {
    refuse(null as unknown as CoreStats, createMockPlayer('Absent', 'sorceress'), 'no-player');
  });

  it('refuses equal-ID replacement before malformed deltas without rebasing', () => {
    const basis = arrange();
    usePlayerStore.getState().setPlayer({ ...basis, experience: 1 });
    refuse(null as unknown as CoreStats, basis, 'stale-player');
  });

  it.each([
    null, undefined, {}, { strength: 1 },
    { ...empty, energy: -1 }, { ...empty, energy: 0.5 },
    { ...empty, energy: NaN }, { ...empty, energy: Infinity },
    { ...empty, energy: '1' }, { ...empty, energy: Number.MAX_SAFE_INTEGER + 1 },
    { ...empty, energy: Number.MAX_SAFE_INTEGER, strength: Number.MAX_SAFE_INTEGER }
  ])('refuses malformed numeric fields or unsafe sum %# before budget/cap', deltas => {
    refuse(deltas as CoreStats, arrange({ statPoints: 0 }), 'invalid-deltas');
  });

  it('refuses inherited core fields instead of treating them as draft input', () => {
    const inherited: unknown = Object.create({ ...empty, energy: 1 });
    refuse(inherited as CoreStats, arrange(), 'invalid-deltas');
  });

  it('returns empty-draft before insufficient balance or untouched legacy caps', () => {
    const basis = arrange({ statPoints: 0,
      coreStats: { strength: 501, dexterity: 25, vitality: 10, energy: 35 } });
    refuse(empty, basis, 'empty-draft');
  });

  it('refuses the whole draft for insufficient points before a targeted cap violation', () => {
    const basis = arrange({ statPoints: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 500, energy: 35 } });
    refuse({ ...empty, vitality: 1, energy: 1 }, basis, 'insufficient-points');
  });

  it.each(['strength', 'dexterity', 'vitality', 'energy'] as const)(
    'refuses the whole mixed draft when %s exceeds its prospective cap', stat => {
      const baseline = arrange();
      const basis = arrange({ coreStats: { ...baseline.coreStats, [stat]: 499.5 } });
      const other = stat === 'energy' ? 'dexterity' : 'energy';
      refuse({ ...empty, [stat]: 1, [other]: 1 }, basis, 'stat-cap');
    }
  );

  it('keeps an untouched legacy overcap attribute without blocking a different attribute', () => {
    const basis = arrange({ coreStats: { strength: 501, dexterity: 25, vitality: 10, energy: 35 } });
    expect(allocate({ ...empty, vitality: 1 }, basis)).toBe('ok');
    expect(player()).toMatchObject({ statPoints: 4,
      coreStats: { strength: 501, dexterity: 25, vitality: 11, energy: 35 },
      derivedStats: { attack: 191, lifeMax: 146, life: 11, mana: 7 } });
  });

  it.each([0.5, 1.5])('requires whole points from fractional balance%s without rounding the remainder', points => {
    const basis = arrange({ statPoints: points });
    if (points < 1) refuse({ ...empty, energy: 1 }, basis, 'insufficient-points');
    else {
      expect(allocate({ ...empty, energy: 1 }, basis)).toBe('ok');
      expect(player()).toMatchObject({ statPoints: 0.5, coreStats: { energy: 36 }, derivedStats: { manaMax: 116 } });
      refuse({ ...empty, energy: 1 }, player(), 'insufficient-points');
    }
  });

  it('retains accepted fractional base stats below the prospective cap', () => {
    const basis = arrange({ coreStats: { strength: 10, dexterity: 25, vitality: 498.5, energy: 35 } });
    expect(allocate({ ...empty, vitality: 1 }, basis)).toBe('ok');
    expect(player()).toMatchObject({ coreStats: { vitality: 499.5 }, derivedStats: { lifeMax: 823, life: 11 } });
  });

  it('rejects reuse of a consumed basis without spending a second draft', () => {
    const basis = arrange();
    expect(allocate({ ...empty, energy: 1 }, basis)).toBe('ok');
    refuse({ ...empty, energy: 1 }, basis, 'stale-player');
  });

  it('clamps excessive current resources to the new caps without refilling depleted pools', () => {
    const baseline = arrange();
    const basis = arrange({ derivedStats: { ...baseline.derivedStats, life: 1_000, mana: 0 } });
    expect(allocate({ ...empty, vitality: 1, energy: 1 }, basis)).toBe('ok');
    expect(player().derivedStats).toMatchObject({ life: 146, lifeMax: 146, mana: 0, manaMax: 116 });
  });

  it('uses current gear once across repeated drafts and ignores stale legacy gear', () => {
    const baseline = arrange();
    const gear: Item = { id: 'draft-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
      level: 1, identified: true, equipped: false, baseRolls: { defense: 13 },
      affixes: [{ affixId: 'controlled-draft', values: new Map([
        ['coreStats.vitality', 5], ['coreStats.energy', 6], ['statMods.life', 25],
        ['statMods.mana', 17], ['statMods.magicFind', 37], ['resistances.fire', 15]
      ]) }] };
    usePlayerStore.getState().setPlayer({ ...baseline, equipment: [{ ...gear, id: 'legacy',
      affixes: [{ affixId: 'decoy', values: new Map([['statMods.magicFind', 999]]) }] }] });
    useInventoryStore.getState().addItem(gear);
    expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
    const basis = player();
    const inventory = useInventoryStore.getState();
    const contents = structuredClone(inventory.equipped);
    expect(allocate({ ...empty, vitality: 1, energy: 1 }, basis)).toBe('ok');
    expect(player()).toEqual({ ...basis, statPoints: 3,
      coreStats: { strength: 10, dexterity: 25, vitality: 11, energy: 36 },
      derivedStats: { ...basis.derivedStats, lifeMax: 181, manaMax: 142 } });
    expect(allocate({ ...empty, vitality: 1, energy: 1 }, player())).toBe('ok');
    expect(player()).toEqual({ ...basis, statPoints: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 12, energy: 37 },
      derivedStats: { ...basis.derivedStats, lifeMax: 183, manaMax: 143 } });
    expect(player().equipment).toBe(basis.equipment);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(inventory.equipped).toEqual(contents);
  });

  it('permits base499→500 despite gear crossing the effective cap', () => {
    const baseline = arrange({ coreStats: { strength: 10, dexterity: 25, vitality: 499, energy: 35 } });
    const gear: Item = { id: 'cap-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
      level: 1, identified: true, equipped: false, baseRolls: { defense: 13 },
      affixes: [{ affixId: 'controlled-cap', values: new Map([['coreStats.vitality', 5]]) }] };
    useInventoryStore.getState().addItem(gear);
    expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
    expect(allocate({ ...empty, vitality: 1 }, player())).toBe('ok');
    expect(player()).toMatchObject({ statPoints: 4, coreStats: { ...baseline.coreStats, vitality: 500 },
      derivedStats: { lifeMax: 824, life: 11, defense: 42 } });
  });
});
