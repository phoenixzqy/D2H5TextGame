import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Only the disk boundary is fake; selection, validation/import and native combat remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as combatEngine from '@/engine/combat/combat';
import type { CombatSnapshot } from '@/engine/combat/combat';
import { activeMeditationAura } from '@/engine/skills/meditation';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { deriveStats } from '@/engine/progression/stats';
import { toJsonSafe } from '@/engine/save';
import type { Mercenary, Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const AURA = 'paladin.meditation'; const AUTHORED = 'skills-paladin-meditation';
const FINISHER = 'fixture.meditation-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
let snapshots: CombatSnapshot[] = [];
let gearSequence = 0;
const runControl = combatEngine.runBattleRecorded;
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  snapshots = []; gearSequence = 0;
}
function player(): Player {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing native Meditation fixture player');
  return value;
}
/** Synthetic configuration projection retains the run; public hero replacement clears it. */
function configure(patch: Partial<Player>): void { usePlayerStore.setState({ player: { ...player(), ...patch } }); }
function gear(mana = 100, attackSpeed = 0, energy = 0): void {
  const cap: Item = { id: `fixture-meditation-cap-${String(++gearSequence)}`, baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 999880], ['statMods.defense', 99973], ['statMods.mana', mana], ['statMods.attackSpeed', attackSpeed], ['coreStats.energy', energy]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
/** Imported L30/points/gear and registered finisher are integration scaffolding, never earned campaign evidence. */
function arrange(rank = 1): void {
  const fresh = createMockPlayer('NativeMeditation', 'paladin');
  usePlayerStore.getState().setPlayer({ ...fresh, id: 'player-native-meditation', level: 30, skillPoints: 3,
    coreStats: { ...fresh.coreStats, energy: 20 }, comboOrder: [FINISHER],
    skillLevels: { 'skills-paladin-prayer': 1, 'skills-paladin-cleansing': 1, ...(rank > 0 ? { [AURA]: rank } : {}) } });
  registerSkill({ id: 'fixture.meditation-merc-spend', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'buff', id: 'fixture-merc-paid', duration: -1 }] });
  gear(); configure({ derivedStats: { ...player().derivedStats, life: 1_000_000, mana: 50 } });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function selected(rank = 1): void { arrange(rank); expect(usePlayerStore.getState().selectAura(AURA)).toBe('ok'); }
function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function latest(): CombatSnapshot {
  const input = snapshots.at(-1);
  if (!input) throw new Error('Missing actual native battle input');
  return input;
}
function hero(input = latest()) {
  const value = input.playerTeam.find(unit => unit.id === 'player-native-meditation');
  if (!value) throw new Error('Missing original native hero');
  return value;
}
const pools = (value: ReturnType<typeof hero>) => [value.life, value.mana,
  value.manaRegenCarry, value.manaRegenCompensation, value.manaRegenExactCarry];
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === 'player-native-meditation');
  if (!value) throw new Error('Missing actual native hero outcome');
  return value;
}
function recording() {
  const state = useCombatStore.getState();
  return structuredClone({ team: state.playerTeam, events: state.recordedEvents, outcome: state.outcome,
    rewards: state.runRewards, cursor: state.eventCursor, complete: state.playbackComplete, paused: state.isPaused });
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function advance(): void { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
function replay(): void { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }
function aura(rank: number, mercId?: string): void {
  expect(latest().meditationAura).toEqual({ selectedAuraId: AURA, sourceHeroId: player().id, rank, maxRank: 20,
    sourceBaselinePerSecond: hero().manaRegenPerSecond, manaRegenPctPerRank: .03,
    ...(mercId === undefined ? {} : { fieldedMercCombatId: mercId }) });
  expect(Object.isFrozen(latest().meditationAura)).toBe(true);
}
function assertActualEffect(): void {
  const input = latest(); const { meditationAura: _projection, ...none } = input;
  const control = runControl(none);
  const actual = useCombatStore.getState().outcome?.finalPlayerTeam.find(u => u.id === player().id);
  const base = control.result.playerTeam.find(u => u.id === player().id);
  if (!actual || !base) throw new Error('Missing native recovery pair');
  expect(actual.mana + Number(actual.manaRegenExactCarry ?? '0')).toBeGreaterThan(
    base.mana + Number(base.manaRegenExactCarry ?? '0'));
  for (const out of [...input.playerTeam, ...(useCombatStore.getState().outcome?.finalPlayerTeam ?? [])]) {
    expect(out).not.toHaveProperty('meditationAura');
    expect(out.manaRegenPerSecond).toBe(input.playerTeam.find(u => u.id === out.id)?.manaRegenPerSecond);
  }
}
/** Native merc spends at its real action, then receives bonus without a baseline stat. */
function assertMercEffect(id: string): void {
  const input = latest(); const { meditationAura: _projection, ...none } = input;
  const control = runControl(none);
  expect(input.playerTeam.find(u => u.id === id)).not.toHaveProperty('manaRegenPerSecond');
  expect(useCombatStore.getState().recordedEvents).toContainEqual(expect.objectContaining({
    kind: 'mana', target: id, reason: 'cast' }));
  expect(useCombatStore.getState().recordedEvents).toContainEqual(expect.objectContaining({
    kind: 'mana', target: id, reason: 'regeneration' }));
  expect(control.events.filter(e => e.kind === 'mana' && e.target === id && e.reason === 'regeneration')).toEqual([]);
}
function merc(id: string): Mercenary {
  const coreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };
  return { id, name: id, type: 'mercenary', team: 'player', level: 30, coreStats,
    derivedStats: { ...deriveStats(coreStats, 30), life: 1000000, lifeMax: 1000000,
      attack: 100, attackSpeed: 200, critChance: 0, physDodge: 0 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: ['fixture.meditation-merc-spend'],
    alive: true, turnOrder: 0, archetype: 'front', rarity: 'R', equipment: [] };
}
beforeEach(() => {
  reset(); vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  const original = combatEngine.runBattleRecorded;
  vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
    snapshots.push(input); return original(input);
  });
});
afterEach(() => { reset(); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('native selected Meditation wave composition', () => {
  it('keeps learning/combo unselected, freezes ordinary changes and activates only on next real wave', () => {
    arrange(0); start(); const before = recording();
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    usePlayerStore.getState().setComboOrder([AURA, FINISHER]);
    expect(player()).not.toHaveProperty('selectedAuraId'); expect(latest().meditationAura).toBeUndefined();
    expect(recording()).toEqual(before);
    const priorFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().selectAura(AURA)).toBe('ok');
    refreshActivePlayerCombatConfig(); expect(recording()).toEqual(before);
    advance(); aura(1); assertActualEffect();
    expect(pools(hero())).toEqual(pools(priorFinal));
    expect(hero().stats.attack).toBe(playerToCombatUnit(player()).stats.attack);
  });
  it('upgrades explicitly selected rank for the next wave without multiplying stats or refilling carry', () => {
    selected(); start(); aura(1); assertActualEffect(); const before = recording();
    const priorFinal = structuredClone(finalHero()); const originalRate = hero().manaRegenPerSecond;
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(recording()).toEqual(before); advance(); aura(2); assertActualEffect();
    expect(pools(hero())).toEqual(pools(priorFinal)); expect(hero().manaRegenPerSecond).toBe(originalRate);
  });
  it('clears to None on the next wave while leaving current recording untouched', () => {
    selected(20); start(); aura(20); const before = recording();
    expect(usePlayerStore.getState().selectAura(null)).toBe('ok'); expect(recording()).toEqual(before);
    advance(); expect(latest().meditationAura).toBeUndefined();
    expect(runControl(latest()).events).toEqual(useCombatStore.getState().recordedEvents);
  });
  it('successful respec clears selection for the next wave without changing current playback', () => {
    selected(); start(); const before = recording();
    expect(usePlayerStore.getState().respec({ getGold: () => 100000, spendGold: () => true })).toBe('ok');
    expect(player()).not.toHaveProperty('selectedAuraId'); expect(recording()).toEqual(before);
    advance(); expect(latest().meditationAura).toBeUndefined();
  });
  it('replays None→20→1→20 from original pools, even after completed playback, with no stacking or rewards', () => {
    selected(20); start(); aura(20); const originalInput = structuredClone(latest());
    const originalRecording = structuredClone(useCombatStore.getState().recordedEvents);
    const originalOutcome = structuredClone(useCombatStore.getState().outcome); const originalPools = pools(hero());
    // Orbs can increase final MP; prove real payment and a changed output instead of net depletion.
    let manaBeforeCast = hero().mana; let paid = false;
    for (const event of useCombatStore.getState().recordedEvents) {
      if (event.kind !== 'mana' || event.target !== player().id) continue;
      if (event.reason === 'cast') { expect(event.mana).toBe(manaBeforeCast - 8); paid = true; break; }
      manaBeforeCast = event.mana;
    }
    expect(paid).toBe(true); expect(pools(finalHero())).not.toEqual(originalPools);
    for (const rank of [0, 20, 1, 20, 20]) {
      drain();
      const rewards = structuredClone({ backpack: useInventoryStore.getState().backpack,
        currencies: useInventoryStore.getState().currencies, run: useCombatStore.getState().runRewards });
      configure({ skillLevels: { ...player().skillLevels, [AURA]: rank } });
      expect(usePlayerStore.getState().selectAura(rank > 0 ? AURA : null)).toBe('ok');
      const persistent = { ...player() }; replay();
      if (rank > 0) aura(rank); else expect(latest().meditationAura).toBeUndefined();
      expect(pools(hero())).toEqual(originalPools); expect(hero().stats).toEqual(originalInput.playerTeam[0]?.stats);
      expect(player()).toEqual(persistent); expect(useCombatStore.getState().runRewards).toEqual(rewards.run);
      expect(useInventoryStore.getState().currencies).toEqual(rewards.currencies);
      expect(useInventoryStore.getState().backpack).toEqual(rewards.backpack);
      if (rank === 20) {
        expect(useCombatStore.getState().recordedEvents).toEqual(originalRecording);
        expect(useCombatStore.getState().outcome).toEqual(originalOutcome);
      }
    }
  });
  it('restores original resource/carry baseline after a replay clamp and restored equipment maxima', () => {
    selected(20); start(); advance(); aura(20);
    const baseline = structuredClone(latest()); const originalPools = pools(hero());
    const persistentMana = player().derivedStats.mana;
    expect(originalPools.slice(2)).not.toEqual([0, 0, '0']);
    const before = recording();
    const progress = structuredClone({ experience: player().experience,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards });
    gear(-190); const small = playerToCombatUnit(player());
    expect(small.stats.manaMax).toBe(6); expect(small.stats.manaMax).toBeLessThan(hero().mana);
    expect(player().derivedStats.mana).toBe(6);
    for (let repeat = 0; repeat < 2; repeat++) {
      replay(); aura(20); expect(hero().mana).toBe(6);
      expect(pools(hero()).slice(2)).toEqual([0, 0, '0']); drain();
    }
    gear();
    // Explicit fixture restoration of the same persistent configuration, never product refill.
    expect(player().derivedStats.mana).toBe(6);
    configure({ derivedStats: { ...player().derivedStats, mana: persistentMana } });
    expect(originalPools[1]).not.toBe(persistentMana);
    for (let repeat = 0; repeat < 2; repeat++) {
      replay(); aura(20); expect(pools(hero())).toEqual(originalPools);
      expect(latest().playerTeam).toEqual(baseline.playerTeam);
      expect(recording()).toEqual(before); drain();
    }
    expect(player().experience).toBe(progress.experience);
    expect(useInventoryStore.getState().currencies).toEqual(progress.currencies);
    expect(useCombatStore.getState().runRewards).toEqual(progress.rewards);
  });
  const ineligible: readonly Partial<Player>[] = [
    { class: 'sorceress' }, { level: 0 }, { skillLevels: {} }, { skillLevels: { 'aura-meditation': 20 } }
  ];
  it.each(ineligible)('suppresses ineligible imported current selection on replay %#', patch => {
    selected(20); start(); const before = recording(); configure(patch);
    expect(recording()).toEqual(before); replay(); expect(latest().meditationAura).toBeUndefined();
  });
  it('does not reuse the original saved selector if current player is absent or has another identity', () => {
    selected(20); start(); const saved = player(); const before = recording();
    // Synthetic resolver inputs deliberately retain the original run; not public replacement.
    usePlayerStore.setState({ player: null }); replay(); expect(latest().meditationAura).toBeUndefined();
    usePlayerStore.setState({ player: { ...saved, id: 'different-hero' } }); replay();
    expect(latest().meditationAura).toBeUndefined(); expect(before.events.length).toBeGreaterThan(0);
    usePlayerStore.setState({ player: saved }); replay(); aura(20); assertActualEffect();
  });
  it('keeps the original explicitly fielded merc across roster changes; bench cannot receive the projection', () => {
    selected(20); const first = merc('fielded-a'); const bench = merc('bench-b');
    useMercStore.getState().addMerc(first); useMercStore.getState().addMerc(bench);
    useMercStore.getState().setFieldedMerc(first.id); start(); aura(20, 'merc-fielded-a');
    expect(latest().playerTeam.map(u => u.id)).toEqual([player().id, 'merc-fielded-a']);
    assertMercEffect('merc-fielded-a');
    const original = structuredClone(latest().playerTeam);
    useMercStore.getState().setFieldedMerc(bench.id); replay(); aura(20, 'merc-fielded-a');
    expect(latest().playerTeam).toEqual(original);
    useMercStore.getState().setFieldedMerc(null); replay(); aura(20, 'merc-fielded-a');
    expect(latest().playerTeam.some(u => u.id === 'merc-bench-b')).toBe(false);
    advance(); aura(20, 'merc-fielded-a'); assertMercEffect('merc-fielded-a');
    abortSubAreaRun(); useMercStore.getState().setFieldedMerc(bench.id); start(); aura(20, 'merc-bench-b');
  });
  it('does not revive or retarget the original merc after a genuine recorded death and won-wave carry', () => {
    selected(20); gear(100, -1000);
    const bare = merc('fragile'); const bench = merc('bench-b');
    const fragile = { ...bare, derivedStats: { ...bare.derivedStats, life: 1, lifeMax: 1, defense: 0, attackSpeed: 1 } };
    useMercStore.getState().addMerc(fragile); useMercStore.getState().addMerc(bench);
    useMercStore.getState().setFieldedMerc(fragile.id); start();
    const outcome = useCombatStore.getState().outcome;
    expect(outcome?.finalPlayerTeam.find(u => u.id === 'merc-fragile')?.life).toBe(0);
    expect(useCombatStore.getState().recordedEvents).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc-fragile' }));
    useMercStore.getState().setFieldedMerc(bench.id); advance(); aura(20, 'merc-fragile');
    expect(latest().playerTeam.map(u => u.id)).toEqual([player().id]);
    expect(activeMeditationAura(latest().meditationAura, 'merc-fragile', new Map(latest().playerTeam.map(u => [u.id, u])))).toBeUndefined();
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.target === 'merc-bench-b')).toBe(false);
  });
  it('imports a genuine v9 None selection without inferring it from allocated Meditation or combo', async () => {
    arrange(20); usePlayerStore.getState().setComboOrder([AURA, FINISHER]);
    const save = snapshotStores(); if (!save) throw new Error('Missing actual v9 import fixture');
    const jsonSafe = toJsonSafe(save);
    if (typeof jsonSafe !== 'object' || jsonSafe === null) throw new Error('Missing serialized legacy fixture');
    const legacy = { ...jsonSafe, version: 9 as const };
    expect(save.player).not.toHaveProperty('selectedAuraId');
    await importIntoStores(JSON.stringify(legacy));
    expect(player()).not.toHaveProperty('selectedAuraId');
    start(); expect(latest().meditationAura).toBeUndefined();
    expect(runControl(latest()).events).toEqual(useCombatStore.getState().recordedEvents);
  });
  it('restores canonical selection through validated JSON import and activates the next native run without reselection', async () => {
    selected(20); const savedStats = structuredClone(player().derivedStats);
    const save = snapshotStores(); if (!save) throw new Error('Missing actual native save snapshot');
    const data = JSON.stringify(toJsonSafe(save)); start();
    for (const key of ['meditationAura', 'sourceBaselinePerSecond', 'manaRegenPctPerRank', 'manaRegenCarry', 'manaRegenCompensation', 'manaRegenExactCarry']) expect(save.player).not.toHaveProperty(key);
    await importIntoStores(data);
    expect(player().selectedAuraId).toBe(AURA); expect(player().derivedStats).toEqual(savedStats);
    expect(save).not.toHaveProperty('meditationAura');
    start(); aura(20); assertActualEffect();
  });
  it('uses the numeric fresh adapter baseline after equipment/effective Energy exactly once', () => {
    selected(20); start(); const original = pools(hero()); const before = recording();
    gear(100, 0, 162);
    expect(recording()).toEqual(before); replay(); aura(20);
    expect(playerToCombatUnit(player()).manaRegenPerSecond).toBe(36.4);
    expect(latest().meditationAura?.sourceBaselinePerSecond).toBe(36.4);
    expect(pools(hero())).toEqual(original);
    configure({ coreStats: { ...player().coreStats, energy: 250 } }); replay(); aura(20);
    expect(latest().meditationAura?.sourceBaselinePerSecond).toBe(61.2);
    gear(); configure({ coreStats: { ...player().coreStats, energy: 7 },
      derivedStats: { ...player().derivedStats, manaMax: 99999 } }); replay(); aura(20);
    expect(latest().meditationAura?.sourceBaselinePerSecond).toBe(1.4000000000000001);
    expect(hero().manaRegenPerSecond).toBe(1.4000000000000001);
    expect(pools(hero())).toEqual(original);
  });
  it('replaces Meditation with Might/None and back without stacking, replay rewards or changing original pools', () => {
    selected(20); configure({ skillLevels: { [AURA]: 20, 'paladin.might': 20 } }); start();
    const baseline = structuredClone(latest()); const before = recording();
    for (const selectedAuraId of ['paladin.might', null, AURA, AURA] as const) {
      expect(usePlayerStore.getState().selectAura(selectedAuraId)).toBe('ok');
      const rewards = structuredClone(useCombatStore.getState().runRewards);
      replay(); expect(pools(hero())).toEqual(pools(hero(baseline)));
      expect(useCombatStore.getState().runRewards).toEqual(rewards);
      if (selectedAuraId === AURA) { aura(20); expect(recording()).toEqual(before); }
      else expect(latest().meditationAura).toBeUndefined();
      expect(Boolean(latest().mightAura)).toBe(selectedAuraId === 'paladin.might');
      expect(runControl(latest()).events).toEqual(useCombatStore.getState().recordedEvents);
    }
  });

});
