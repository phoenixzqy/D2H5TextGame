import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
// Only the disk boundary is fake; selection, validation/import and native combat remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as combatEngine from '@/engine/combat/combat';
import type { CombatSnapshot } from '@/engine/combat/combat';
import { activeMightAura } from '@/engine/skills/might';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { deriveStats } from '@/engine/progression/stats';
import { toJsonSafe } from '@/engine/save';
import { withoutV17Fields } from '../../tests/helpers/save-fixtures';
import type { Mercenary, Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, playerToCombatUnit, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const AURA = 'paladin.might'; const AUTHORED = 'skills-paladin-might';
const FINISHER = 'fixture.might-finisher';
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
  if (!value) throw new Error('Missing native Might fixture player');
  return value;
}
/** Synthetic configuration projection retains the run; public hero replacement clears it. */
function configure(patch: Partial<Player>): void { usePlayerStore.setState({ player: { ...player(), ...patch } }); }
function gear(mana = 100, attackSpeed = 0): void {
  const cap: Item = { id: `fixture-might-cap-${String(++gearSequence)}`, baseId: 'items/base/helm-cap', socketCapacity: 0,
    rarity: 'rare', level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 999880], ['statMods.defense', 99973], ['statMods.mana', mana], ['statMods.attackSpeed', attackSpeed]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
/** Imported L30/points/gear and registered finisher are integration scaffolding, never earned campaign evidence. */
function arrange(rank = 1): void {
  const fresh = createMockPlayer('NativeMight', 'paladin');
  usePlayerStore.getState().setPlayer({ ...fresh, id: 'player-native-might', level: 30, skillPoints: 3,
    coreStats: { ...fresh.coreStats, energy: 20 }, comboOrder: [FINISHER],
    skillLevels: rank > 0 ? { [AURA]: rank } : {} });
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
  const value = input.playerTeam.find(unit => unit.id === 'player-native-might');
  if (!value) throw new Error('Missing original native hero');
  return value;
}
const pools = (value: ReturnType<typeof hero>) => [value.life, value.mana,
  value.manaRegenCarry, value.manaRegenCompensation, value.manaRegenExactCarry];
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === 'player-native-might');
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
  expect(latest().mightAura).toEqual({ selectedAuraId: AURA, sourceHeroId: player().id, rank, maxRank: 20,
    physicalDamagePct: rank * .03, attackPct: rank * .01,
    ...(mercId === undefined ? {} : { fieldedMercCombatId: mercId }) });
  expect(Object.isFrozen(latest().mightAura)).toBe(true);
}
function assertActualEffect(): void {
  const input = latest(); const { mightAura: _projection, ...none } = input;
  const control = runControl(none);
  const activeHit = useCombatStore.getState().recordedEvents.find(e => e.kind === 'damage' && e.source === player().id && e.amount > 0);
  const baseHit = control.events.find(e => e.kind === 'damage' && e.source === player().id && e.amount > 0);
  if (activeHit?.kind !== 'damage' || baseHit?.kind !== 'damage') throw new Error('Missing real native damage pair');
  expect(activeHit.amount).toBeGreaterThan(baseHit.amount);
  for (const out of [...input.playerTeam, ...(useCombatStore.getState().outcome?.finalPlayerTeam ?? [])]) {
    expect(out).not.toHaveProperty('mightAura');
    expect(out.stats.attack).toBe(input.playerTeam.find(u => u.id === out.id)?.stats.attack);
  }
}
/** A real merc damage event must increase; controls bypass only the capture spy. */
function assertMercEffect(id: string): void {
  const { mightAura: _projection, ...none } = latest();
  const control = runControl(none);
  const hit = useCombatStore.getState().recordedEvents.find(e => e.kind === 'damage' && e.source === id && e.amount > 0);
  const baseline = control.events.find(e => e.kind === 'damage' && e.source === id && e.amount > 0);
  if (hit?.kind !== 'damage' || baseline?.kind !== 'damage') throw new Error('Missing actual native merc damage pair');
  expect(hit.amount).toBeGreaterThan(baseline.amount);
}
function merc(id: string): Mercenary {
  const coreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };
  return { id, name: id, type: 'mercenary', team: 'player', level: 30, coreStats,
    derivedStats: { ...deriveStats(coreStats, 30), life: 1000000, lifeMax: 1000000,
      attack: 100, attackSpeed: 200, critChance: 0, physDodge: 0 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: ['fixture.merc-basic'],
    alive: true, turnOrder: 0, archetype: 'front', rarity: 'R', equipment: [] };
}
beforeEach(() => {
  mockSyntheticEntryPools();
  reset(); vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  const original = combatEngine.runBattleRecorded;
  vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
    snapshots.push(input); return original(input);
  });
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('native selected Might wave composition', () => {
  it('keeps learning/combo unselected, freezes ordinary changes and activates only on next real wave', () => {
    arrange(0); start(); const before = recording();
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    usePlayerStore.getState().setComboOrder([AURA, FINISHER]);
    expect(player()).not.toHaveProperty('selectedAuraId'); expect(latest().mightAura).toBeUndefined();
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
    const priorFinal = structuredClone(finalHero()); const originalAttack = hero().stats.attack;
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(recording()).toEqual(before); advance(); aura(2); assertActualEffect();
    expect(pools(hero())).toEqual(pools(priorFinal)); expect(hero().stats.attack).toBe(originalAttack);
  });
  it('clears to None on the next wave while leaving current recording untouched', () => {
    selected(20); start(); aura(20); const before = recording();
    expect(usePlayerStore.getState().selectAura(null)).toBe('ok'); expect(recording()).toEqual(before);
    advance(); expect(latest().mightAura).toBeUndefined();
    expect(runControl(latest()).events).toEqual(useCombatStore.getState().recordedEvents);
  });
  it('successful respec clears selection for the next wave without changing current playback', () => {
    selected(); start(); const before = recording();
    expect(usePlayerStore.getState().respec({ getGold: () => 100000, spendGold: () => true })).toBe('ok');
    expect(player()).not.toHaveProperty('selectedAuraId'); expect(recording()).toEqual(before);
    advance(); expect(latest().mightAura).toBeUndefined();
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
      configure({ skillLevels: { [AURA]: rank } });
      expect(usePlayerStore.getState().selectAura(rank > 0 ? AURA : null)).toBe('ok');
      const persistent = { ...player() }; replay();
      if (rank > 0) aura(rank); else expect(latest().mightAura).toBeUndefined();
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
    { class: 'sorceress' }, { level: 0 }, { skillLevels: {} }, { skillLevels: { 'aura-might': 20 } }
  ];
  it.each(ineligible)('suppresses ineligible imported current selection on replay %#', patch => {
    selected(20); start(); const before = recording(); configure(patch);
    expect(recording()).toEqual(before); replay(); expect(latest().mightAura).toBeUndefined();
  });
  it('clears the original run and selector when the public hero lifecycle removes or replaces it', () => {
    selected(20); start(); const saved = player(); const recorded = snapshots.length;
    usePlayerStore.getState().reset();
    expect(hasActiveSubAreaRun()).toBe(false);
    const absent = useCombatStore.getState();
    replay();
    expect(useCombatStore.getState()).toBe(absent);
    expect(snapshots).toHaveLength(recorded);
    expect(absent.recordedEvents).toEqual([]);
    const { selectedAuraId: _selection, ...unselected } = saved;
    usePlayerStore.getState().setPlayer({ ...unselected, id: 'different-hero' });
    const replaced = useCombatStore.getState();
    replay();
    expect(useCombatStore.getState()).toBe(replaced);
    expect(snapshots).toHaveLength(recorded);
    start();
    expect(latest().playerTeam[0]?.id).toBe('different-hero');
    expect(latest().mightAura).toBeUndefined();
    usePlayerStore.getState().setPlayer(saved);
    expect(hasActiveSubAreaRun()).toBe(false);
    replay();
    expect(snapshots).toHaveLength(recorded + 1);
    start(); aura(20); assertActualEffect();
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
    expect(activeMightAura(latest().mightAura, 'merc-fragile', new Map(latest().playerTeam.map(u => [u.id, u])))).toBeUndefined();
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'damage' && e.source === 'merc-bench-b')).toBe(false);
  });
  it('imports a genuine v9 None selection without inferring it from allocated Might or combo', async () => {
    arrange(20); usePlayerStore.getState().setComboOrder([AURA, FINISHER]);
    const save = snapshotStores(); if (!save) throw new Error('Missing actual v9 import fixture');
    const historical = toJsonSafe(withoutV17Fields(save)) as Record<string, unknown>;
    const { questItems: _ledger, ...inventory } = historical.inventory as Record<string, unknown>;
    const { questReceipts: _receipts, ...map } = historical.map as Record<string, unknown>;
    const legacy = { ...historical, version: 9 as const, inventory, map };
    expect(save.player).not.toHaveProperty('selectedAuraId');
    await importIntoStores(JSON.stringify(legacy));
    expect(player()).not.toHaveProperty('selectedAuraId');
    start(); expect(latest().mightAura).toBeUndefined();
    expect(runControl(latest()).events).toEqual(useCombatStore.getState().recordedEvents);
  });
  it('restores canonical selection through validated JSON import and activates the next native run without reselection', async () => {
    selected(20); const savedStats = structuredClone(player().derivedStats);
    const save = snapshotStores(); if (!save) throw new Error('Missing actual native save snapshot');
    const data = JSON.stringify(toJsonSafe(save)); start();
    for (const key of ['mightAura', 'physicalDamagePct', 'attackPct']) expect(save.player).not.toHaveProperty(key);
    await importIntoStores(data);
    expect(player().selectedAuraId).toBe(AURA); expect(player().derivedStats).toEqual(savedStats);
    expect(save).not.toHaveProperty('mightAura');
    start(); aura(20); assertActualEffect();
  });
});
