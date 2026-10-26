import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit,
  refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import * as staging from './recordedWaveStaging';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';
import { nativeBattleCommandCarry, transferBattleCommandCarry } from './battleCommandCarry';
import { hasBattleCommandCarry } from '@/engine/combat/combat';
import { rebaseStatusClock, statusActiveAt } from '@/engine/combat/status';

const COMMAND = 'barbarian.battle_command', FINISHER = 'fixture.command-carry-finisher';
const HEAL = 'fixture.command-carry-heal';
const ranks = { 'barbarian.howl': 1, 'barbarian.shout': 1,
  'barbarian.battle_orders': 20, [COMMAND]: 1 };
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing synthetic native carry player');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing staged native hero');
  return value;
}
function record() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents,
    outcome: s.outcome, rewards: s.runRewards });
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  const state = useCombatStore.getState(), end = state.recordedEvents.at(-1);
  if (end?.kind !== 'end' || !state.outcome) throw new Error('Missing native playback outcome');
  const view = (units: typeof state.playerTeam | typeof state.outcome.finalPlayerTeam) => units.map(unit => ({
    id: unit.id, stats: unit.stats, life: unit.life, mana: unit.mana,
    recovery: unit.manaRegenPerSecond, damage: unit.increasedDamagePct,
    statuses: unit.life > 0 ? unit.statuses.filter(status => statusActiveAt(status, end.simClockMs)) : [] }));
  expect(view(state.playerTeam)).toEqual(view(state.outcome.finalPlayerTeam));
}
function start(heal = false) {
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [1000000000, 1000000000] }] });
  registerSkill({ id: HEAL, archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 60, manaCost: 0, effects: [{ kind: 'heal', target: 'self', amount: 1000000000 }] });
  const fresh = createMockPlayer('Synthetic native Command carry', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillLevels: ranks,
    comboOrder: [COMMAND, ...(heal ? [HEAL] : []), FINISHER] });
  const cap: Item = { id: 'fixture-command-carry-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', 999000], ['statMods.mana', 999000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  const s = useCombatStore.getState();
  expect(s.outcome?.winner).toBe('player');
  const cast = s.recordedEvents.find(e => e.kind === 'action' && e.skillId === COMMAND);
  const end = s.recordedEvents.at(-1), final = s.outcome?.finalPlayerTeam[0];
  if (!cast || end?.kind !== 'end' || !final) throw new Error('Missing actual paid native result');
  expect(end.simClockMs).toBeLessThan(cast.simClockMs + 8000);
  return { first: record(), final, remaining: cast.simClockMs + 8000 - end.simClockMs };
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

it('carries only the actual paid remaining native interval and does not pay Command again', () => {
  const { first, remaining } = start(); drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(useCombatStore.getState().recordedEvents.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toEqual([]);
  const fresh = playerToCombatUnit(player()), current = hero();
  expect(current.stats).toEqual({ ...fresh.stats, ...fresh.battleCommandPassives?.boosted.stats });
  expect(current.statuses.find(s => s.id === 'battle-command')).toMatchObject({ expiresAtMs: remaining });
  expect(first.events.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(1);
});

it('keeps paid carry with fresh learned/passive authority even after learning Command is removed', () => {
  const { first } = start();
  const skillLevels = { 'barbarian.howl': 1, 'barbarian.shout': 1, 'barbarian.battle_orders': 1 };
  usePlayerStore.setState({ player: { ...player(), skillLevels, comboOrder: [FINISHER] } });
  const fresh = playerToCombatUnit(player());
  expect(record()).toEqual(first); drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().battleCommandRank).toBe(0);
  expect(hero().skillLevels).toEqual(fresh.skillLevels);
  expect(hero().battleCommandPassives).toEqual(fresh.battleCommandPassives);
  expect(hero().stats).toEqual({ ...fresh.stats, ...fresh.battleCommandPassives?.boosted.stats });
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === COMMAND)).toBe(false);
});

it.each([false, true])('preserves paid high HP until all fresh capacity layers settle (remove gear: %s)', removeGear => {
  const { final } = start(true);
  const baseline = playerToCombatUnit(player());
  expect(final.life).toBeGreaterThan(baseline.stats.lifeMax);
  if (removeGear) expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
  const fresh = playerToCombatUnit(player()), boostedMax = fresh.battleCommandPassives?.boosted.stats.lifeMax;
  if (boostedMax === undefined) throw new Error('Missing fresh boosted capacity');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().stats.lifeMax).toBe(boostedMax);
  expect(hero().life).toBe(Math.min(final.life, boostedMax));
  expect(hero().life).toBeGreaterThan(fresh.stats.lifeMax);
});

it('replays the original carried baseline repeatedly without repaying or consuming its interval', () => {
  start(); drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const before = record();
  for (let repeat = 0; repeat < 2; repeat++) {
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(record()).toEqual(before);
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === COMMAND)).toBe(false);
  }
});

it('retains already-settled carry through a staging failure and retries it without double rebasing', () => {
  const { remaining } = start(); drain();
  const stage = staging.stageRecordedWave;
  const failure = vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(() => { throw new Error('fixture carry staging failure'); });
  expect(() => advanceWaveOrFinish()).toThrow('fixture carry staging failure');
  failure.mockRestore();
  expect(staging.stageRecordedWave).toBe(stage);
  const experience = player().experience, currencies = structuredClone(useInventoryStore.getState().currencies);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().statuses.find(s => s.id === 'battle-command')).toMatchObject({ expiresAtMs: remaining });
  expect(player().experience).toBe(experience);
  expect(useInventoryStore.getState().currencies).toEqual(currencies);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === COMMAND)).toBe(false);
});

it('fresh challenge entry has no previous paid Command or boosted profile', () => {
  start(); abortSubAreaRun();
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })).not.toBeNull();
  const fresh = playerToCombatUnit(player());
  expect(hero().stats).toEqual(fresh.stats);
  expect(hero().statuses.some(s => s.id === 'battle-command')).toBe(false);
  expect(useCombatStore.getState().recordedEvents.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(1);
});

it('binds native transfer to the exact actual result array and terminal clock; copied arrays have no authority', () => {
  start(); const state = useCombatStore.getState(), team = state.outcome?.finalPlayerTeam;
  const end = state.recordedEvents.at(-1);
  if (!team || end?.kind !== 'end') throw new Error('Missing native terminal result');
  const rebased = () => team.map(unit => rebaseStatusClock(unit, end.simClockMs));
  for (const copied of [[...team], structuredClone(team)]) {
    const target = rebased(); transferBattleCommandCarry(copied, end.simClockMs, target);
    expect(nativeBattleCommandCarry(target)).toBeUndefined();
  }
  for (const clock of [end.simClockMs + .25, end.simClockMs - 1, NaN]) {
    const target = rebased(); transferBattleCommandCarry(team, clock, target);
    expect(nativeBattleCommandCarry(target)).toBeUndefined();
  }
  const target = rebased(); transferBattleCommandCarry(team, end.simClockMs, target);
  const permit = nativeBattleCommandCarry(target);
  expect(permit).toBeDefined(); expect(hasBattleCommandCarry(permit, target[0] ?? hero())).toBe(true);
  expect(nativeBattleCommandCarry([...target])).toBeUndefined();
  expect(nativeBattleCommandCarry(structuredClone(target))).toBeUndefined();
});
