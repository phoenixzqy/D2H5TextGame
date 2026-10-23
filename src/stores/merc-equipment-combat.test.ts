import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import type { CombatUnit, GridPosition } from '@/engine/combat/types';
import type { Mercenary } from '@/engine/types/entities';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { runBattleRecorded } from '@/engine/combat/combat';
import * as combatEngine from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

const stores = [usePlayerStore, useCombatStore, useInventoryStore,
  useMercStore, useFormationStore, useMapStore] as const;
function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function arrange() {
  usePlayerStore.getState().setPlayer(createMockPlayer('MercGear', 'sorceress'));
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing canonical Inner Sight merc');
  const merc = createMercFromDef(def);
  useMercStore.getState().addMerc(merc);
  useMercStore.getState().setFieldedMerc(merc.id);
  useMercStore.getState().addExperience(merc.id, 2730);
  const grown = useMercStore.getState().getFieldedMerc();
  if (!grown) throw new Error('Missing owned merc');
  expect(grown.level).toBe(6);
  expect(grown.coreStats).toEqual({ strength: 15, dexterity: 31, vitality: 16, energy: 17 });
  expect(grown.derivedStats).toMatchObject({ lifeMax: 172, manaMax: 95,
    attack: 35, defense: 35, attackSpeed: 131 });
  return grown;
}
function startMerc() {
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1,
    runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  const unit = useCombatStore.getState().playerTeam.find(row => row.kind === 'merc');
  if (!unit) throw new Error('Missing recorded initial merc');
  return unit;
}
function item(id: string, baseId: string, baseRolls: NonNullable<Item['baseRolls']>): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true,
    equipped: false, affixes: [], baseRolls };
}

beforeEach(() => { reset(); resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('canonical merc equipment reaches fresh production combat', () => {
  it('retains the grown unequipped baseline without re-deriving current core', () => {
    const merc = arrange();
    expect(startMerc().stats).toEqual(merc.derivedStats);
  });

  it('uses persisted cap defense after the real backpack transfer', () => {
    const merc = arrange();
    const cap = item('merc-cap', 'items/base/helm-cap', { defense: 6 });
    useInventoryStore.getState().addItem(cap);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head', cap)).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).not.toContainEqual(cap);
    const before = structuredClone(useMercStore.getState().ownedMercs);
    expect(startMerc().stats.defense).toBe(41);
    expect(useMercStore.getState().ownedMercs).toEqual(before);
  });

  it('uses persisted sword attack after the real backpack transfer', () => {
    const merc = arrange();
    const sword = item('merc-sword', 'items/base/wp1h-short-sword', { attack: 7 });
    useInventoryStore.getState().addItem(sword);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'weapon', sword)).toEqual({ ok: true });
    expect(startMerc().stats.attack).toBe(42);
    expect(useMercStore.getState().getFieldedMerc()).toBe(merc);
  });
});

// Existing function can satisfy this intended trailing-input API before the fix;
// old runtime ignores the argument, giving genuine state-based RED assertions.
const adapt: (merc: Mercenary, position?: GridPosition,
  equipment?: Readonly<Record<string, Item | null>>) => CombatUnit = mercToCombatUnit;

describe('equipment authority and next fresh-run boundaries', () => {
  it('ignores hero/other-merc/legacy gear and stale requested fields', () => {
    const merc = arrange();
    const cap = item('real-cap', 'items/base/helm-cap', { defense: 6 });
    const other = { ...merc, id: 'other-merc' };
    useMercStore.getState().addMerc(other);
    const decoy = item('decoy-cap', 'items/base/helm-cap', { defense: 999 });
    useInventoryStore.setState({ equipped: { head: decoy } });
    useMercStore.setState({ ownedMercs: [{ ...merc, equipment: [decoy] }, other],
      mercEquipment: { [other.id]: { head: decoy } } });
    useInventoryStore.getState().addItem(cap);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head',
      { ...cap, baseRolls: { defense: 999 } })).toEqual({ ok: true });
    const before = structuredClone({ owned: useMercStore.getState().ownedMercs,
      maps: useMercStore.getState().mercEquipment,
      progress: useMercStore.getState().mercProgress,
      hero: usePlayerStore.getState().player });
    const unit = startMerc();
    expect(unit.stats.defense).toBe(41);
    expect(unit.stats.attack).toBe(35);
    expect({ owned: useMercStore.getState().ownedMercs,
      maps: useMercStore.getState().mercEquipment,
      progress: useMercStore.getState().mercProgress,
      hero: usePlayerStore.getState().player }).toEqual(before);
  });

  it('selects current owned fielded identity and its own canonical map', () => {
    const merc = arrange();
    const other = { ...merc, id: 'other-merc' };
    useMercStore.getState().addMerc(other);
    const cap = item('other-cap', 'items/base/helm-cap', { defense: 9 });
    useInventoryStore.getState().addItem(cap);
    expect(useMercStore.getState().equipOnMerc(other.id, 'head', cap)).toEqual({ ok: true });
    expect(startMerc().stats.defense).toBe(35);
    abortSubAreaRun();
    useMercStore.getState().setFieldedMerc(other.id);
    const next = startMerc();
    expect(next.id).toBe('merc-other-merc');
    expect(next.stats.defense).toBe(44);
  });

  it('leaves a frozen recording intact and rereads swapped gear on a fresh run', () => {
    const merc = arrange();
    const cap = item('cap-six', 'items/base/helm-cap', { defense: 6 });
    const swap = item('cap-nine', 'items/base/helm-cap', { defense: 9 });
    useInventoryStore.getState().addItem(cap);
    useInventoryStore.getState().addItem(swap);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head', cap)).toEqual({ ok: true });
    expect(startMerc().stats.defense).toBe(41);
    const state = useCombatStore.getState();
    const frozen = structuredClone({ team: state.playerTeam, events: state.recordedEvents,
      outcome: state.outcome, cursor: state.eventCursor });
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head', swap)).toEqual({ ok: true });
    const current = useCombatStore.getState();
    expect({ team: current.playerTeam, events: current.recordedEvents,
      outcome: current.outcome, cursor: current.eventCursor }).toEqual(frozen);
    abortSubAreaRun();
    expect(startMerc().stats.defense).toBe(44);
    abortSubAreaRun();
    expect(useMercStore.getState().unequipFromMerc(merc.id, 'head')).toEqual({ ok: true });
    expect(startMerc().stats).toEqual(merc.derivedStats);
  });

  it('adapter keeps identity, skill priority and grid while applying current gear', () => {
    const merc = arrange();
    const cap = item('direct-cap', 'items/base/helm-cap', { defense: 6 });
    const unit = adapt(merc, { row: 2, col: 1 }, { head: cap });
    expect(unit).toMatchObject({ id: `merc-${merc.id}`, kind: 'merc',
      gridPosition: { row: 2, col: 1 }, life: 172, mana: 95 });
    expect(unit.skillOrder).toEqual(mercToCombatUnit(merc).skillOrder);
    expect(unit.stats.defense).toBe(41);
    expect(unit.equippedWeapon).toBeUndefined();
  });
});


describe('adapter resources and equipment damage authority', () => {
  it('projects stats without healing saved pools but starts fresh combat at equipped maxima', () => {
    const original = arrange();
    const owned = { ...original, derivedStats: { ...original.derivedStats, life: 160, mana: 60 } };
    const charm = { ...item('pool-control', 'fixture/unknown', {}), affixes: [{
      affixId: 'pools', values: new Map([['statMods.life', 14], ['statMods.mana', 8]]) }] };
    const unit = adapt(owned, undefined, { head: charm });
    expect(unit.stats).toEqual({ ...owned.derivedStats, lifeMax: 186, manaMax: 103 });
    expect([unit.life, unit.mana]).toEqual([186, 103]);
    expect([owned.derivedStats.life, owned.derivedStats.mana]).toEqual([160, 60]);
    expect(adapt(owned).stats).not.toBe(owned.derivedStats);
    expect(adapt(owned).stats.resistances).not.toBe(owned.derivedStats.resistances);
  });

  it('adds rolled sword attack to real basic fallback damage', () => {
    const merc = { ...arrange(), signatureSkillId: '', comboOrder: ['fixture.missing'] };
    const bare = adapt(merc);
    const armed = adapt(merc, undefined, { weapon: item('sword',
      'items/base/wp1h-short-sword', { attack: 7 }) });
    expect(firstDamage(bare)).toMatchObject({ amount: 35, crit: false, dodged: false });
    expect(firstDamage(armed)).toMatchObject({ amount: 42, crit: false, dodged: false });
  });

  it.each([
    ['mskill-basic-arrow', [16, 26], 51, 58],
    ['mskill-pierce-arrow', [26, 42], 61, 68]
  ] as const)('adds real sword Attack once to %s and restores damage on unequip', (id, base, bareDamage, armedDamage) => {
    const merc = { ...arrange(), signatureSkillId: '', comboOrder: [id] };
    const bare = adapt(merc);
    const sword = item('sword', 'items/base/wp1h-short-sword', { attack: 7 });
    useInventoryStore.getState().addItem(sword);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'weapon', sword)).toEqual({ ok: true });
    const saved = structuredClone(useMercStore.getState().ownedMercs);
    const gear = useMercStore.getState().mercEquipment[merc.id];
    const armed = adapt(merc, undefined, gear);
    expect(firstDamage(armed).amount - firstDamage(bare).amount).toBe(7);
    // Seed0 hit draw .2664; base draw .000329 selects the authored minimum.
    expect(firstDamage(bare)).toMatchObject({ amount: bareDamage, crit: false, dodged: false });
    expect(firstDamage(armed)).toMatchObject({ amount: armedDamage, crit: false, dodged: false });
    expect(firstDamage(adapt(merc, undefined, gear))).toEqual(firstDamage(armed));
    expect(useMercStore.getState().ownedMercs).toEqual(saved);
    expect(useMercStore.getState().unequipFromMerc(merc.id, 'weapon')).toEqual({ ok: true });
    expect(firstDamage(adapt(merc, undefined, useMercStore.getState().mercEquipment[merc.id])))
      .toEqual(firstDamage(bare));
    expect(getSkill(id)?.effects).toContainEqual({
      kind: 'damage', damageType: 'physical', base, attackDamagePct: 100, tags: ['physical'] });
  });
});

function firstDamage(unit: CombatUnit) {
  const attacker = { ...unit, stats: { ...unit.stats, critChance: 0 } };
  const target: CombatUnit = { ...unit, id: 'one-hit-target', side: 'enemy', kind: 'monster',
    life: 1, mana: 0, skillOrder: [], stats: { ...unit.stats, life: 1, lifeMax: 1,
      attackSpeed: 1, defense: 0, physDodge: 0, magicDodge: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } } };
  const result = runBattleRecorded({ seed: 0, playerTeam: [attacker], enemyTeam: [target] });
  expect(result.result.winner).toBe('player');
  const event = result.events.find(row => row.kind === 'damage');
  if (!event) throw new Error('Missing real damage event');
  expect(event.source).toBe(attacker.id);
  return event;
}


describe('active run carry remains frozen', () => {
  it('keeps recorded merc stats and depleted resources through the next wave', () => {
    const merc = arrange();
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing hero');
    // Synthetic finisher isolates the carry boundary; it certifies no balance.
    registerSkill({ id: 'fixture.merc-gear-finisher', archetype: 'fixture',
      target: 'all-enemies', minLevel: 1, cooldown: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
    usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.merc-gear-finisher'] });
    const cap = item('cap-six', 'items/base/helm-cap', { defense: 6 });
    const swap = item('cap-nine', 'items/base/helm-cap', { defense: 9 });
    useInventoryStore.getState().addItem(cap);
    useInventoryStore.getState().addItem(swap);
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head', cap)).toEqual({ ok: true });
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
      const actual = original(input);
      // Controlled carry supplements the result before staging captures authority.
      return { ...actual, result: { ...actual.result,
        playerTeam: actual.result.playerTeam.map(unit => unit.kind === 'merc'
          ? { ...unit, life: 135, mana: 40 } : unit) } };
    });
    const initial = startMerc();
    expect(initial.stats.defense).toBe(41);
    const count = useCombatStore.getState().recordedEvents.length;
    for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
    const outcome = useCombatStore.getState().outcome;
    expect(outcome?.winner).toBe('player');
    if (!outcome) throw new Error('Missing real recorded outcome');
    expect(useMercStore.getState().equipOnMerc(merc.id, 'head', swap)).toEqual({ ok: true });
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const carried = useCombatStore.getState().playerTeam.find(unit => unit.kind === 'merc');
    expect(carried?.stats).toEqual(initial.stats);
    expect([carried?.life, carried?.mana]).toEqual([135, 40]);
    abortSubAreaRun();
    const next = startMerc();
    expect(next.stats.defense).toBe(44);
    expect([next.life, next.mana]).toEqual([172, 95]);
  });

  it('leaves missing or unowned fielded identities out of the team', () => {
    arrange();
    useMercStore.setState({ fieldedMercId: 'not-owned',
      mercEquipment: { 'not-owned': { head: item('phantom', 'items/base/helm-cap', { defense: 999 }) } } });
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
    expect(useCombatStore.getState().playerTeam.map(unit => unit.kind)).toEqual(['hero']);
  });
});


it('preserves the existing falsey fielded-ID guard even for an owned empty ID', () => {
  const merc = arrange();
  const empty = { ...merc, id: '' };
  useMercStore.setState({ ownedMercs: [empty], fieldedMercId: '',
    mercEquipment: { '': { head: item('empty-cap', 'items/base/helm-cap', { defense: 6 }) } } });
  expect(useMercStore.getState().getFieldedMerc()).toBeNull();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  expect(useCombatStore.getState().playerTeam.map(unit => unit.kind)).toEqual(['hero']);
  expect(useMercStore.getState().ownedMercs).toEqual([empty]);
});
