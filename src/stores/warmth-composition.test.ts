import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import {
  abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit,
  refreshActivePlayerCombatConfig, startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';

const AREA = 'areas/act1-blood-moor';
/** Compare legacy fire output while permitting only an own, exact-zero Lightning projection. */
function fireDamageProjection(actual: Readonly<Partial<Record<string, number>>> | undefined) {
  if (!actual || !Object.prototype.hasOwnProperty.call(actual, 'lightning')) return actual;
  expect(actual.lightning).toBe(0);
  const { lightning: _zero, ...remaining } = actual;
  return remaining;
}

const WARMTH = 'sorceress.warmth';
const FINISHER = 'fixture.warmth-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore] as const;

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing fixture player');
  return current;
}

/** Imported synthetic gear controls integration boundaries, never campaign balance. */
function equip(values: readonly (readonly [string, number])[], id = 'fixture-warmth-cap'): Item {
  const item: Item = { id, baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported', values: new Map(values) }] };
  useInventoryStore.getState().addItem(item);
  expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
  return item;
}

/** Controlled persistent resource fixture retains the run; not public hero replacement. */
function setResources(life: number, mana: number): void {
  const current = player();
  usePlayerStore.setState({ player: { ...current,
    derivedStats: { ...current.derivedStats, life, mana } } });
}

function arrange(energy = 35, extra: Partial<Player> = {}): void {
  const fresh = createMockPlayer('WarmthBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, ...extra,
    coreStats: { ...fresh.coreStats, energy }, comboOrder: [FINISHER] });
  useMapStore.getState().setCurrentLocation(1, AREA);
  // Real plan/spawn/combat/recording/award paths, synthetic finisher only.
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 8,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
}

function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

function recording() {
  const state = useCombatStore.getState();
  return structuredClone({ team: state.playerTeam, events: state.recordedEvents,
    outcome: state.outcome, cursor: state.eventCursor, paused: state.isPaused,
    complete: state.playbackComplete, rewards: state.runRewards });
}

/** Controlled carry boundary; recovery integration itself belongs to stage f. */
function nextWithCarry(exactCarry?: string): void {
  // L4 Energy182 gives335 MP; +30gear→206effective plus34flat→405.
  arrange(182, { level: 4, skillLevels: { [WARMTH]: 1 } });
  equip([['coreStats.energy', 30], ['statMods.life', 56], ['statMods.mana', 34],
    ['statMods.defense', 99_964]]);
  setResources(190, 400);
  start();
  drain();
  const outcome = useCombatStore.getState().outcome;
  if (!outcome) throw new Error('Missing actual winning outcome');
  useCombatStore.setState({ outcome: { ...outcome,
    finalPlayerTeam: outcome.finalPlayerTeam.map(unit => ({ ...unit,
      life: 190, mana: 400, manaRegenCarry: 0.75, manaRegenCompensation: 0.125,
      ...(exactCarry === undefined ? {} : { manaRegenExactCarry: exactCarry }) })) } });
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(player().level).toBe(4);
}

beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});

afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});

describe('authoritative hero Warmth composition', () => {
  it('uses raw equipped core once despite stale derived stats and legacy equipment', () => {
    arrange(190, { skillLevels: { [WARMTH]: 1 } });
    const cap = equip([['coreStats.energy', 30], ['statMods.life', 80], ['statMods.mana', 40]]);
    const current = player();
    const stale: Player = { ...current,
      equipment: [{ ...cap, id: 'legacy-decoy', affixes: [{ affixId: 'decoy',
        values: new Map([['coreStats.energy', 900], ['statMods.mana', 900]]) }] }],
      derivedStats: { ...current.derivedStats, life: 77, mana: 81,
        lifeMax: 9999, manaMax: 9999, attack: 9999, defense: 9999 } };
    usePlayerStore.getState().setPlayer(stale);
    const before = structuredClone({ player: stale, equipped: useInventoryStore.getState().equipped });
    const unit = playerToCombatUnit(stale);
    // 190 + 30 = 220 raw → 210 effective Energy; 0.2 × 210 × 1.04.
    expect.soft(unit.manaRegenPerSecond).toBeCloseTo(43.68, 12);
    expect.soft(fireDamageProjection(unit.increasedDamagePct)).toEqual({ fire: 0.01 });
    expect.soft(unit.stats).toEqual({ life: 77, lifeMax: 200, mana: 81, manaMax: 405,
      attack: 22, defense: 27, magicResist: 0, attackSpeed: 125, critChance: 0.05, critDamage: 2,
      physDodge: 0.1, magicDodge: 0.05, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } });
    expect.soft([unit.life, unit.mana, unit.manaRegenCarry, unit.manaRegenCompensation]).toEqual([77, 81, 0, 0]);
    expect({ player: stale, equipped: useInventoryStore.getState().equipped }).toEqual(before);
    expect(playerToCombatUnit(stale)).toEqual(unit);
  });

  it('publishes coherent core allocation stats and derives unchanged recovery semantics', () => {
    arrange(199, { statPoints: 1, skillLevels: {} });
    usePlayerStore.getState().allocateStatPoint('energy');
    expect(player().coreStats.energy).toBe(200);
    expect(player().derivedStats).toMatchObject({ life: 120, mana: 102, manaMax: 350 });
    const unit = playerToCombatUnit(player());
    expect.soft(unit.stats.manaMax).toBe(350);
    expect.soft(unit.manaRegenPerSecond).toBe(40);
    expect.soft(fireDamageProjection(unit.increasedDamagePct)).toEqual({ fire: 0 });
  });
});

describe('frozen recording and automatic next-wave configuration', () => {
  it('pulls ordinary learn, upgrade, Energy allocation and gear changes only at the next wave', () => {
    arrange(199, { skillPoints: 2, statPoints: 1, skillLevels: {} });
    equip([['statMods.life', 999_880], ['statMods.defense', 99_973]]);
    setResources(1_000_000, 348);
    start();
    const before = recording();
    const result = useCombatStore.getState().outcome?.finalPlayerTeam[0];
    if (!result) throw new Error('Missing real wave result');
    expect(usePlayerStore.getState().allocateSkillPoint(WARMTH)).toBe('ok');
    expect(usePlayerStore.getState().allocateSkillPoint(WARMTH)).toBe('ok');
    usePlayerStore.getState().allocateStatPoint('energy');
    expect(player().coreStats.energy).toBe(200);
    equip([['statMods.life', 999_880], ['statMods.defense', 99_973],
      ['coreStats.energy', 30], ['statMods.mana', 40]], 'fixture-upgraded-cap');
    // Ordinary store mutations must flow through playWave without any refresh helper.
    expect.soft(recording()).toEqual(before);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState().playerTeam[0];
    // Genuine first-wave awards grant 160 XP and level 2; no refill on level/equip.
    expect.soft(player().level).toBe(2);
    expect.soft(second?.level).toBe(2);
    expect.soft(second?.stats.manaMax).toBe(416);
    expect.soft(second?.stats.lifeMax).toBe(1_000_008);
    expect.soft(second?.manaRegenPerSecond).toBeCloseTo(46.44, 12);
    expect.soft(fireDamageProjection(second?.increasedDamagePct)).toEqual({ fire: 0.02 });
    expect.soft(second?.skillLevels).toEqual({ [WARMTH]: 2 });
    expect.soft([second?.life, second?.mana]).toEqual([result.life, result.mana]);

    const secondBefore = recording();
    const secondResult = useCombatStore.getState().outcome?.finalPlayerTeam[0];
    if (!secondResult) throw new Error('Missing second outcome');
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    expect.soft(recording()).toEqual(secondBefore);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const third = useCombatStore.getState().playerTeam[0];
    const level = player().level;
    expect.soft(third?.manaRegenPerSecond).toBeCloseTo(43.2, 12);
    expect.soft(third?.stats.manaMax).toBe(350 + (level - 1) * 4);
    expect.soft(third?.life).toBe(Math.min(secondResult.life, 120 + (level - 1) * 8));
    expect.soft(third?.mana).toBe(Math.min(secondResult.mana, 350 + (level - 1) * 4));
  });

  it.each(['absent', 'respec'] as const)('clears removed skill levels and bonuses on next wave (%s)', removal => {
    arrange(35, { skillLevels: { [WARMTH]: 2, 'skills-sorceress-warmth': 1 } });
    equip([['statMods.life', 999_880], ['statMods.defense', 99_973]]);
    setResources(1_000_000, 102);
    start();
    const before = recording();
    if (removal === 'absent') {
      const { skillLevels, ...withoutLevels } = player();
      expect(skillLevels).toBeDefined();
      // Synthetic absent-property input retains the recorded wave.
      usePlayerStore.setState({ player: withoutLevels });
    } else {
      // Store-level respec only; no ordinary respec UI or economy acceptance.
      expect(usePlayerStore.getState().respec({ getGold: () => 10_000,
        spendGold: cost => cost === 1000 })).toBe('ok');
    }
    expect.soft(recording()).toEqual(before);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState().playerTeam[0];
    expect.soft(second?.skillLevels).toEqual({});
    expect.soft(second?.manaRegenPerSecond).toBe(7);
    expect.soft(fireDamageProjection(second?.increasedDamagePct)).toEqual({ fire: 0 });
  });
});

describe('original wave-input resources and replay', () => {
  it('starts a new run with zero exact carry after a run with qualified exact credit', () => {
    nextWithCarry('0.625');
    expect(useCombatStore.getState().playerTeam[0]).toHaveProperty('manaRegenExactCarry', '0.625');
    start();
    expect(useCombatStore.getState().playerTeam[0]).toMatchObject({
      manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0'
    });
  });

  it('clears exact credit on every capped replay and restores only the original uncapped wave input', () => {
    nextWithCarry('0.625');
    const before = recording();
    expect(before.team[0]).toHaveProperty('manaRegenExactCarry', '0.625');
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    refreshActivePlayerCombatConfig();
    expect(recording()).toEqual(before);
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect.soft(useCombatStore.getState().playerTeam[0]).toMatchObject({
        mana: 335, manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0'
      });
    }
    equip([['coreStats.energy', 30], ['statMods.life', 56], ['statMods.mana', 34],
      ['statMods.defense', 99_964]], 'fixture-restored-exact-cap');
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().playerTeam[0]).toMatchObject({
      mana: 400, manaRegenCarry: 0.75, manaRegenCompensation: 0.125, manaRegenExactCarry: '0.625'
    });
    expect(before.team[0]).toHaveProperty('manaRegenExactCarry', '0.625');
  });

  it.each([false, true])('preserves qualified exact carry on next wave unless fresh maxima cap resources (%s)', shrink => {
    nextWithCarry('0.625');
    drain();
    const prior = useCombatStore.getState().outcome;
    if (!prior) throw new Error('Missing real outcome for exact-carry boundary');
    // Controlled metadata boundary, not evidence that this fraction was earned.
    useCombatStore.setState({ outcome: { ...prior,
      finalPlayerTeam: prior.finalPlayerTeam.map(unit => ({ ...unit,
        mana: 400, manaRegenCarry: 0.75, manaRegenCompensation: 0.125, manaRegenExactCarry: '0.625' })) } });
    const baseline = structuredClone(useCombatStore.getState().outcome);
    if (shrink) expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]).toMatchObject(shrink ? {
      mana: 335, manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0'
    } : {
      mana: 400, manaRegenCarry: 0.75, manaRegenCompensation: 0.125, manaRegenExactCarry: '0.625'
    });
    expect(baseline?.finalPlayerTeam[0]).toHaveProperty('manaRegenExactCarry', '0.625');
  });

  it('replays original HP/MP/carry after partial or completed playback without repeated rewards', () => {
    nextWithCarry();
    const initial = recording();
    const progress = structuredClone({ player: player(), inventory: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: initial.rewards });
    useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().eventCursor).toBe(1);
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect.soft(recording()).toEqual(initial);
      drain();
      const completed = useCombatStore.getState().playerTeam[0];
      // Actual kill-orb rewards cap the completed MP at405; replay starts400.
      expect(completed?.mana).toBe(405);
    }
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect.soft(recording()).toEqual(initial);
    expect({ player: player(), inventory: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards }).toEqual(progress);
  });

  it('clamps each shrink replay afresh and restores only the original input after expansion', () => {
    nextWithCarry();
    const initial = recording();
    const source = useCombatStore.getState().outcome;
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    for (let refresh = 0; refresh < 2; refresh++) {
      refreshActivePlayerCombatConfig();
      expect.soft(recording()).toEqual(initial);
    }
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const hero = useCombatStore.getState().playerTeam[0];
      expect.soft([hero?.life, hero?.stats.lifeMax, hero?.mana, hero?.stats.manaMax,
        hero?.manaRegenCarry, hero?.manaRegenCompensation]).toEqual([144, 144, 335, 335, 0, 0]);
    }
    equip([['coreStats.energy', 30], ['statMods.life', 56], ['statMods.mana', 34],
      ['statMods.defense', 99_964]], 'fixture-restored-cap');
    // Unequip clamps persistent pools; re-equip does not heal those cached pools.
    if (!initial.outcome) throw new Error('Missing expected outcome');
    const freshPools = (unit: typeof initial.team[number], index: number) => index === 0
      ? { ...unit, stats: { ...unit.stats, life: 144, mana: 335 } } : unit;
    const expanded = { ...initial, team: initial.team.map(freshPools),
      outcome: { ...initial.outcome, finalPlayerTeam: initial.outcome.finalPlayerTeam.map(freshPools) } };
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect.soft(recording()).toEqual(expanded);
      const hero = useCombatStore.getState().playerTeam[0];
      expect.soft([hero?.life, hero?.mana, hero?.manaRegenCarry, hero?.manaRegenCompensation])
        .toEqual([190, 400, 0.75, 0.125]);
    }
    expect(source).toEqual(initial.outcome);
    expect.soft([useCombatStore.getState().playerTeam[0]?.manaRegenCarry,
      useCombatStore.getState().playerTeam[0]?.manaRegenCompensation]).toEqual([0.75, 0.125]);
  });

  it('applies rising maxima without replenishing ongoing resources from persistent pools', () => {
    nextWithCarry();
    const initial = useCombatStore.getState().playerTeam[0];
    equip([['coreStats.energy', 50], ['statMods.life', 156], ['statMods.mana', 134],
      ['statMods.defense', 99_964]], 'fixture-expanded-cap');
    setResources(300, 520);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const hero = useCombatStore.getState().playerTeam[0];
    // 232raw→216effective; L4mana62+324+134=520, life144+156=300.
    expect.soft([hero?.stats.lifeMax, hero?.stats.manaMax]).toEqual([300, 520]);
    expect.soft([hero?.life, hero?.mana, hero?.manaRegenCarry, hero?.manaRegenCompensation])
      .toEqual([190, 400, 0.75, 0.125]);
    expect(initial?.life).toBe(190);
    expect(initial?.mana).toBe(400);
  });

  it('starts a new run with fresh carry and ignores refresh after finalization', () => {
    nextWithCarry();
    start();
    const hero = useCombatStore.getState().playerTeam[0];
    expect.soft([hero?.manaRegenCarry, hero?.manaRegenCompensation]).toEqual([0, 0]);
    const waves = useCombatStore.getState().totalWaves;
    for (let wave = 1; wave <= waves; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain();
      expect(advanceWaveOrFinish()).toBe(wave === waves ? 'victory' : 'next-wave');
    }
    const before = useCombatStore.getState();
    refreshActivePlayerCombatConfig();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState()).toBe(before);
  });

  it('clamps carried resources and clears carry at cap on an actual next wave', () => {
    nextWithCarry();
    const oldOutcome = useCombatStore.getState().outcome;
    if (!oldOutcome) throw new Error('Missing actual second-wave result');
    drain();
    // Keep the intended baseline resource edge independent of orb RNG.
    useCombatStore.setState({ outcome: { ...oldOutcome,
      finalPlayerTeam: oldOutcome.finalPlayerTeam.map(unit => ({ ...unit,
        life: 190, mana: 400, manaRegenCarry: 0.75, manaRegenCompensation: 0.125 })) } });
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const hero = useCombatStore.getState().playerTeam[0];
    expect.soft([hero?.life, hero?.mana, hero?.stats.lifeMax, hero?.stats.manaMax,
      hero?.manaRegenCarry, hero?.manaRegenCompensation]).toEqual([144, 335, 144, 335, 0, 0]);
  });

  it('does not compose the hero passive or resource changes into the actual fielded mercenary', () => {
    arrange(35, { skillLevels: { [WARMTH]: 20 } });
    equip([['statMods.life', 999_880], ['statMods.defense', 99_973]]);
    setResources(1_000_000, 102);
    const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
    if (!def) throw new Error('Missing actual mercenary definition');
    const merc = createMercFromDef(def);
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().setFieldedMerc(merc.id);
    const expected = mercToCombatUnit(merc, useFormationStore.getState().mercPosition);
    start();
    const team = useCombatStore.getState().playerTeam;
    expect.soft(fireDamageProjection(team[0]?.increasedDamagePct)).toEqual({ fire: 0.2 });
    expect(team[1]).toEqual(expected);
    const before = recording();
    // Synthetic allocation projection retains the run for the resolver check.
    usePlayerStore.setState({ player: { ...player(), skillLevels: {} } });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().playerTeam[1]).toEqual(expected);
    expect.soft(fireDamageProjection(useCombatStore.getState().playerTeam[0]?.increasedDamagePct)).toEqual({ fire: 0 });
    expect(before.team[1]).toEqual(expected);
  });

  it.each(['missing', 'different'] as const)('retains the current hero when the persistent player is %s', replacement => {
    nextWithCarry();
    const before = recording();
    // Synthetic resolver inputs retain the original run; public reset/replacement clears it.
    if (replacement === 'missing') usePlayerStore.setState({ player: null });
    else usePlayerStore.setState({ player: { ...player(), id: 'replacement-hero' } });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(before);
  });
});
