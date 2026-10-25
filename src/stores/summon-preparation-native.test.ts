import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
// Only disk I/O is mocked. Level, gear, allocated ranks/points and finisher are
// imported integration scaffolding; none is earned campaign/balance evidence.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit,
  refreshActivePlayerCombatConfig, resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const RAVEN = 'druid.raven';
const AUTHORED = 'skills-druid-raven';
const FINISHER = 'fixture.preparation-native-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing native preparation fixture');
  return value;
}
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function player(): Player { return required(usePlayerStore.getState().player); }
function inputHero() { return required(useCombatStore.getState().playerTeam[0]); }
function finalHero() { return required(useCombatStore.getState().outcome?.finalPlayerTeam[0]); }
function pools(hero: ReturnType<typeof inputHero>) {
  return [hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, enemies: s.enemyTeam, events: s.recordedEvents,
    outcome: s.outcome, rewards: s.runRewards, cursor: s.eventCursor,
    complete: s.playbackComplete, paused: s.isPaused, wave: s.currentWave });
}
function arrange(rank: number, mana = 300): void {
  const fresh = createMockPlayer('PreparationNative', 'druid');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 6, skillPoints: 2,
    skillLevels: rank > 0 ? { [RAVEN]: rank } : {}, comboOrder: [AUTHORED, FINISHER] });
  // Real L6 derived stats: life190/mana100/defense35, plus base Cap defense7.
  const cap: Item = { id: 'fixture-preparation-native-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', 999810], ['statMods.mana', 900], ['statMods.defense', 99958]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  usePlayerStore.getState().setPlayer({ ...player(), derivedStats: {
    ...player().derivedStats, life: 900000, mana
  } });
  const unit = playerToCombatUnit(player());
  expect([unit.stats.lifeMax, unit.stats.manaMax, unit.stats.defense]).toEqual([1000000, 1000, 100000]);
  expect(unit.manaRegenPerSecond).toBe(4);
  expect(unit.skillOrder).toEqual(rank > 0 ? [AUTHORED, FINISHER] : [FINISHER]);
  if (rank > 0) expect(unit.skillLevels?.[RAVEN]).toBe(rank);
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function next(): void { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
function expectBatch(count: number, payment: number): void {
  const state = useCombatStore.getState();
  expect(state.playerTeam.filter(u => u.kind === 'summon' || u.summon)).toEqual([]);
  const created = state.recordedEvents.filter(e => e.kind === 'summon');
  expect(created).toHaveLength(count);
  for (const event of created) {
    expect([event.summonId, event.simClockMs, event.unit.summonOwnerId]).toEqual(['raven', 0, inputHero().id]);
    expect(event.unit.life).toBe(event.unit.stats.lifeMax);
  }
  const actions = state.recordedEvents.filter(e => e.kind === 'action').filter(e => e.skillId === RAVEN);
  expect(actions.map(e => [e.actor, e.simClockMs])).toEqual(count > 0 ? [[inputHero().id, 0]] : []);
  const paid = state.recordedEvents.filter(e => e.kind === 'mana')
    .filter(e => e.reason === 'cast' && e.simClockMs === 0);
  expect(paid.map(e => [e.target, e.mana])).toEqual(count > 0 ? [[inputHero().id, inputHero().mana - payment]] : []);
}

beforeEach(() => {
  mockSyntheticEntryPools();
  reset(); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('D06 paid summon preparation through native recorded waves', () => {
  it('learns and upgrades for the next wave while preserving the current recording and event-array identity', () => {
    arrange(0); start(); expectBatch(0, 0);
    expect(inputHero().druidSummonRanks).toEqual({});
    expect(pools(inputHero())).toEqual([900000, 300, 0, 0, '0']);
    const first = recording(), firstEvents = useCombatStore.getState().recordedEvents;
    const firstFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(player().skillLevels).toEqual({ [RAVEN]: 1 });
    expect(player().skillPoints).toBe(1);
    refreshActivePlayerCombatConfig();
    expect(useCombatStore.getState().recordedEvents).toBe(firstEvents);
    expect(recording()).toEqual(first);
    next(); expectBatch(1, 6);
    expect(inputHero().skillLevels?.[RAVEN]).toBe(1);
    expect(inputHero().druidSummonRanks).toEqual({ raven: 1 });
    expect(pools(inputHero())).toEqual(pools(firstFinal));
    const second = recording(), secondEvents = useCombatStore.getState().recordedEvents;
    const secondFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(RAVEN)).toBe('ok');
    expect(player().skillLevels).toEqual({ [RAVEN]: 2 });
    expect(player().skillPoints).toBe(0);
    refreshActivePlayerCombatConfig();
    expect(useCombatStore.getState().recordedEvents).toBe(secondEvents);
    expect(recording()).toEqual(second);
    next(); expectBatch(2, 6);
    expect(inputHero().skillLevels?.[RAVEN]).toBe(2);
    expect(inputHero().druidSummonRanks).toEqual({ raven: 2 });
    expect(pools(inputHero())).toEqual(pools(secondFinal));
  });

  it('rebuilds all eight rank20 Ravens each wave for one4MP payment from exact carried pools and stale own cooldown', () => {
    arrange(20); start(); expectBatch(8, 4);
    const firstFinal = structuredClone(finalHero());
    expect(firstFinal.mana).toBeLessThan(1000);
    expect(firstFinal.cooldowns[RAVEN]).toBeGreaterThan(0);
    next(); expectBatch(8, 4);
    expect(inputHero().skillLevels?.[RAVEN]).toBe(20);
    expect(pools(inputHero())).toEqual(pools(firstFinal));
    expect(inputHero().cooldowns[RAVEN]).toBe(firstFinal.cooldowns[RAVEN]);
    const secondFinal = structuredClone(finalHero());
    expect(secondFinal.mana).toBeLessThan(1000);
    next(); expectBatch(8, 4);
    expect(pools(inputHero())).toEqual(pools(secondFinal));
  });

  it('does not retry an unaffordable batch after real recovery, then pays from recovered carried mana in the next wave', () => {
    arrange(2, 1); start(); expectBatch(0, 0);
    expect(inputHero().mana).toBe(1);
    const firstFinal = structuredClone(finalHero());
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.reason === 'regeneration')).toBe(true);
    expect(firstFinal.mana).toBeGreaterThanOrEqual(6);
    expect(firstFinal.mana).toBeLessThan(1000);
    next(); expectBatch(2, 6);
    expect(pools(inputHero())).toEqual(pools(firstFinal));
  });

  it('explicitly replays combo edits from the original payment baseline without duplicate payments or rewards', () => {
    arrange(2); start(); expectBatch(2, 6);
    const original = recording(), originalEvents = useCombatStore.getState().recordedEvents;
    const originalPools = pools(inputHero());
    const progress = structuredClone({ xp: player().experience, currencies: useInventoryStore.getState().currencies,
      backpack: useInventoryStore.getState().backpack, stash: useInventoryStore.getState().stash,
      rewards: useCombatStore.getState().runRewards });
    usePlayerStore.getState().setComboOrder([FINISHER]);
    refreshActivePlayerCombatConfig();
    expect(useCombatStore.getState().recordedEvents).toBe(originalEvents);
    expect(recording()).toEqual(original);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().recordedEvents).not.toBe(originalEvents);
    expectBatch(0, 0); expect(pools(inputHero())).toEqual(originalPools);
    expect(inputHero().druidSummonRanks).toEqual({});
    const without = useCombatStore.getState().recordedEvents;
    usePlayerStore.getState().setComboOrder([AUTHORED, FINISHER]);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().recordedEvents).not.toBe(without);
    expectBatch(2, 6); expect(recording()).toEqual(original);
    expect(inputHero().druidSummonRanks).toEqual({ raven: 2 });
    drain();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expectBatch(2, 6); expect(pools(inputHero())).toEqual(originalPools);
    expect(recording()).toEqual(original);
    expect({ xp: player().experience, currencies: useInventoryStore.getState().currencies,
      backpack: useInventoryStore.getState().backpack, stash: useInventoryStore.getState().stash,
      rewards: useCombatStore.getState().runRewards }).toEqual(progress);
  });
});
