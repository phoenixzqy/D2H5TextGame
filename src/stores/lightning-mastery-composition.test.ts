import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
// Only the disk write boundary is faked; real stores/save validation/import/restore run.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, playerToCombatUnit,
  refreshActivePlayerCombatConfig, resetIdleElitePity, startSubAreaRun
} from './combatHelpers';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const MASTERY = 'sorceress.lightning_mastery';
const FIRE = 'sorceress.fire_mastery';
const AUTHORED = 'skills-sorceress-lightning-mastery';
const WARMTH = 'sorceress.warmth';
const FINISHER = 'fixture.mastery-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing Mastery integration fixture player');
  return current;
}
/** Synthetic configuration/resource projection retains the run; not public hero replacement. */
function configure(fields: Partial<Player>): void {
  usePlayerStore.setState({ player: { ...player(), ...fields } });
}
/** ImportedL30/points/gear and registered finisher are explicit native integration scaffolding. */
function arrange(ranks: Readonly<Record<string, number>> = { [WARMTH]: 1 }): void {
  const fresh = createMockPlayer('MasteryBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 2,
    coreStats: { ...fresh.coreStats, energy: 20 }, skillLevels: { [FIRE]: 20, ...ranks },
    comboOrder: [FINISHER] });
  const cap: Item = { id: 'fixture-mastery-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 999880], ['statMods.defense', 99973]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  configure({ derivedStats: { ...player().derivedStats, life: 1000000, mana: 50 } });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 8,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
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
    outcome: state.outcome, rewards: state.runRewards, cursor: state.eventCursor,
    complete: state.playbackComplete, paused: state.isPaused });
}
function currentHero() {
  const hero = useCombatStore.getState().playerTeam[0];
  if (!hero) throw new Error('Missing native hero input');
  return hero;
}
function finalHero() {
  const hero = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!hero) throw new Error('Missing native hero outcome');
  return hero;
}
const pools = (hero: ReturnType<typeof currentHero>) => [hero.life, hero.mana,
  hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];

beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('P07a03C native automatic Mastery composition at existing boundaries', () => {
  it('pulls actual L30 allocate/upgrade into next real waves while freezing current recording/resources', () => {
    arrange(); start();
    expect(currentHero().increasedDamagePct).toEqual({ fire: 0.81, lightning: 0 });
    const before = recording(); const firstFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(player().skillPoints).toBe(1);
    expect(player().skillLevels).toMatchObject({ [MASTERY]: 1, [WARMTH]: 1, [FIRE]: 20 });
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect.soft(currentHero().increasedDamagePct).toEqual({ fire: 0.81, lightning: 0.04 });
    expect(currentHero().manaRegenPerSecond).toBeCloseTo(4.16, 12);
    expect(pools(currentHero())).toEqual(pools(firstFinal));
    const second = recording(); const secondFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(MASTERY)).toBe('ok');
    expect(player().skillPoints).toBe(0);
    expect(recording()).toEqual(second);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect.soft(currentHero().increasedDamagePct?.lightning).toBeCloseTo(0.08, 12);
    expect(currentHero().manaRegenPerSecond).toBeCloseTo(4.16, 12);
    expect(pools(currentHero())).toEqual(pools(secondFinal));
    expect(firstFinal).toEqual(before.outcome?.finalPlayerTeam[0]);
  });

  it('rejects store allocation at L29 and keeps only eligible Warmth below the authored Mastery unlock', () => {
    arrange({ [MASTERY]: 20, [WARMTH]: 1 }); configure({ level: 29 });
    expect(usePlayerStore.getState().allocateSkillPoint(MASTERY)).toBe('level-too-low');
    expect(playerToCombatUnit(player()).increasedDamagePct).toEqual({ fire: 0.01, lightning: 0 });
    configure({ level: 30 });
    expect.soft(playerToCombatUnit(player()).increasedDamagePct?.lightning).toBeCloseTo(0.8, 12);
    configure({ class: 'amazon' });
    expect(playerToCombatUnit(player())).toMatchObject({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0, lightning: 0 } });
  });

  it('clears only removed Mastery on next wave without changing existing Warmth or resource carry', () => {
    arrange({ [AUTHORED]: 20, [MASTERY]: 2, [WARMTH]: 20 }); start();
    expect.soft(currentHero().increasedDamagePct).toEqual({ fire: 1, lightning: 0.8 });
    const before = recording(); const final = structuredClone(finalHero());
    configure({ skillLevels: { [FIRE]: 20, [WARMTH]: 20 } });
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().increasedDamagePct).toEqual({ fire: 1, lightning: 0 });
    expect(currentHero().manaRegenPerSecond).toBeCloseTo(7.2, 12);
    expect(currentHero().skillLevels).toEqual({ [FIRE]: 20, [WARMTH]: 20 });
    expect(pools(currentHero())).toEqual(pools(final));
  });

  it('replays original input pools/carry and restores original recording after repeated rank changes', () => {
    arrange({ [MASTERY]: 20, [WARMTH]: 1 }); start(); drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const before = recording(); const baseline = pools(currentHero());
    const durable = structuredClone({ player: player(), backpack: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards });
    for (let repeat = 0; repeat < 2; repeat++) {
      configure({ skillLevels: { [FIRE]: 20, [WARMTH]: 1 } });
      refreshActivePlayerCombatConfig();
      expect(recording()).toEqual(before);
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(currentHero().increasedDamagePct).toEqual({ fire: 0.81, lightning: 0 });
      expect(pools(currentHero())).toEqual(baseline);
      drain();
      configure({ skillLevels: { [FIRE]: 20, [MASTERY]: 20, [WARMTH]: 1 } });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect.soft(recording()).toEqual(before);
      expect(pools(currentHero())).toEqual(baseline);
    }
    expect({ player: player(), backpack: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards }).toEqual(durable);
  });

  it('roundtrips real save serialization/validated import without persisting combat modifiers', async () => {
    arrange({ [MASTERY]: 20, [WARMTH]: 20 }); start();
    const save = snapshotStores(); if (!save) throw new Error('Missing real store save snapshot');
    const json = JSON.stringify(toJsonSafe(save));
    const before = structuredClone(save.player);
    for (const key of ['increasedDamagePct', 'manaRegenPerSecond', 'manaRegenCarry',
      'manaRegenCompensation', 'manaRegenExactCarry', 'frozenArmor', 'activeBuffIds']) {
      expect(save.player).not.toHaveProperty(key);
    }
    await importIntoStores(json);
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
    expect(player()).toEqual(before);
    const fresh = playerToCombatUnit(player());
    expect.soft(fresh.increasedDamagePct).toEqual({ fire: 1, lightning: 0.8 });
    expect(fresh.manaRegenPerSecond).toBeCloseTo(7.2, 12);
    expect(pools(fresh).slice(2)).toEqual([0, 0, '0']);
    expect(fresh.activeBuffIds).toEqual([]);
    // Disk boundary is mocked; actual browser save/reload acceptance remains separate.
  });
});
