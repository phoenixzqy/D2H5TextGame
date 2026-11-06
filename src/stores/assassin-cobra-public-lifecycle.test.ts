import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';

// Only the IndexedDB table is replaced; combat, stores and save adapters stay real.
const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return { state, get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => {
      state.record = structuredClone(record);
      return Promise.resolve();
    }), delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); }) };
});
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => {
    Object.assign(this, { saves: { get: disk.get, put: disk.put, delete: disk.delete } });
  } }; }
} }));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { awardXp, xpRequired, xpTotal } from '@/engine/progression/xp';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import type { SaveCurrent } from '@/engine/types/save';
import type { CombatUnit } from '@/engine/combat/types';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests, exportCurrentSave, flushSave,
  hydrateFromSave, importIntoStores, snapshotStores } from './persistence';
import { exportSave, loadSave } from './save-adapter';

const TIGER = 'skills-assassin-tiger-strike';
const COBRA = 'skills-assassin-cobra-strike';
const CHARGE = 'charge-cobra-strike';
const NOW = Date.parse('2026-10-28T08:00:00Z');
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, useFormationStore] as const;

function reset(): void {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Missing Cobra lifecycle fixture');
  return value;
}
function snapshot(): SaveCurrent { return required(snapshotStores()); }
function hero() { return required(useCombatStore.getState().playerTeam[0]); }
function withoutStatuses(unit: CombatUnit) {
  const { statuses: _statuses, ...rest } = unit;
  return rest;
}

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  reset(); disk.state.record = undefined; vi.clearAllMocks();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

function arrange(rank: number): void {
  const base = createMockPlayer('Constructed public Cobra lifecycle', 'assassin');
  const rewards = awardXp(0, xpTotal(30));
  usePlayerStore.getState().setPlayer({ ...base, level: 30, experience: 0,
    experienceToNextLevel: xpRequired(30), derivedStats: deriveStats(base.coreStats, 30),
    statPoints: rewards.statPointsGranted, skillPoints: base.skillPoints + rewards.skillPointsGranted,
    skills: [], skillLevels: {}, comboOrder: [], equipment: [] });
  // Keep declared synthetic pool/attack gear, with ordinary native action speed.
  // The old slow cap let natural regen refill every paid cast before a basic.
  // This proves integration, never earned gear, sustain or pacing.
  const cap: Item = { id: 'constructed-cobra-lifecycle-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false,
    socketCapacity: 0, socketContents: [], affixes: [{ affixId: 'synthetic-import',
      values: new Map([['statMods.life', 999880], ['statMods.mana', 999000],
        ['statMods.attack', 25]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  expect(usePlayerStore.getState().allocateSkillPoint(COBRA)).toBe('prereq-missing');
  expect(usePlayerStore.getState().allocateSkillPoint(TIGER)).toBe('ok');
  for (let point = 0; point < rank; point++) {
    expect(usePlayerStore.getState().allocateSkillPoint(COBRA)).toBe('ok');
  }
  usePlayerStore.getState().setComboOrder([COBRA]);
  expect(required(usePlayerStore.getState().player).skillLevels).toEqual({
    'assassin.tiger_strike': 1, 'assassin.cobra_strike': rank });
}

function start(rank: number): void {
  expect(startSubAreaRun({ subAreaId: 'areas/act1-catacombs', runSeed: 7,
    challengeOrdinal: 0 })).not.toBeNull();
  expect(hero().assassinMartialRanks).toEqual({ 'assassin.cobra_strike': rank });
  expect(hero().statuses.some(status => status.id === CHARGE)).toBe(false);
  const initial = useCombatStore.getState().recordedEvents.find(event =>
    event.kind === 'status-state' && event.target === hero().id && event.initial);
  expect(initial?.kind).toBe('status-state');
  if (initial?.kind !== 'status-state') throw new Error('Missing initial status authority');
  expect(initial.statuses.some(status => status.id === CHARGE)).toBe(false);
}

/** Ordinary wave installation and public playback only; no CombatUnit overrides. */
function observeRecovery(): number {
  let witnesses = 0;
  for (let wave = 0; wave < 6; wave++) {
    const installed = useCombatStore.getState();
    const initialMana = hero().mana;
    expect(installed.enemyTeam.length).toBeGreaterThan(0);
    for (const enemy of installed.enemyTeam) {
      expect(enemy.monsterArchetypeId).toBeTruthy();
      expect([enemy.mana, enemy.stats.mana, enemy.stats.manaMax]).toEqual([0, 0, 0]);
    }
    expect(installed.recordedEvents.some(event => event.kind === 'mana' &&
      installed.enemyTeam.some(enemy => enemy.id === event.target))).toBe(false);
    const events = installed.recordedEvents;
    for (let steps = 0; steps <= events.length && !useCombatStore.getState().playbackComplete; steps++) {
      const before = useCombatStore.getState(), beforeHero = hero();
      before.advanceEvent();
      const after = useCombatStore.getState(), batch = events.slice(before.eventCursor, after.eventCursor);
      expect(after.eventCursor).toBeGreaterThan(before.eventCursor);
      const recoveries = batch.filter(event => event.kind === 'mana')
        .filter(event => event.target === beforeHero.id && event.reason === 'cobra-strike');
      if (recoveries.length === 0 || after.playbackComplete) continue;
      // Check the visible public state before final-team snapping can hide a missed event.
      const latestMana = required(batch.filter(event => event.kind === 'mana')
        .filter(event => event.target === beforeHero.id).at(-1));
      expect(hero().mana).toBe(latestMana.mana);
      for (const recovery of recoveries) {
        const index = events.indexOf(recovery);
        const previous = events.slice(0, index).filter(event => event.kind === 'mana')
          .filter(event => event.target === beforeHero.id).at(-1)?.mana ?? initialMana;
        expect(recovery.mana).toBeGreaterThan(previous);
      }
      const healing = batch.filter(event => event.kind === 'heal')
        .filter(event => event.target === beforeHero.id);
      const competing = batch.some(event => event.kind === 'orb' ||
        event.kind === 'life-capacity' && event.target === beforeHero.id);
      if (healing.some(event => event.amount > 0) && !competing) {
        expect(batch.some(event => event.kind === 'action' && event.actor === beforeHero.id &&
          event.skillId === null)).toBe(true);
        const charge = required(beforeHero.statuses.find(status => status.id === CHARGE));
        const consumedStacks = charge.stacks;
        expect([1, 2, 3]).toContain(consumedStacks);
        expect(hero().statuses.some(status => status.id === CHARGE)).toBe(false);
        const prefix = events.slice(0, before.eventCursor);
        // A later builder attempt can miss while an earlier paid charge survives.
        // Follow the charge's actual application time to its successful builder.
        const builder = required(prefix.filter(event => event.kind === 'action')
          .filter(event => event.actor === beforeHero.id && event.skillId === 'assassin.cobra_strike' &&
            event.simClockMs === charge.appliedAtMs).at(-1));
        const paid = required(prefix.filter(event => event.kind === 'mana')
          .filter(event => event.target === beforeHero.id && event.reason === 'cast' &&
            event.simClockMs === builder.simClockMs).at(-1));
        const beforePayment = prefix.slice(0, prefix.indexOf(paid)).filter(event => event.kind === 'mana')
          .filter(event => event.target === beforeHero.id).at(-1)?.mana ?? initialMana;
        expect(paid.mana).toBeLessThan(beforePayment);
        const gain = required(prefix.slice(prefix.indexOf(paid) + 1)
          .filter(event => event.kind === 'status-state')
          .find(event => event.target === beforeHero.id && event.simClockMs === builder.simClockMs &&
            event.statuses.some(status => status.id === CHARGE && status.stacks === consumedStacks)));
        const beforeGain = required(prefix.slice(0, prefix.indexOf(gain))
          .filter(event => event.kind === 'status-state')
          .filter(event => event.target === beforeHero.id).at(-1));
        expect(consumedStacks).toBe(Math.min(3, (beforeGain.statuses.find(status => status.id === CHARGE)?.stacks ?? 0) + 1));
        expect(prefix.indexOf(builder)).toBeLessThan(prefix.indexOf(paid));
        expect(prefix.indexOf(paid)).toBeLessThan(prefix.indexOf(gain));
        expect(prefix.slice(prefix.indexOf(paid) + 1, prefix.indexOf(gain)).some(event =>
          event.kind === 'damage' && event.source === beforeHero.id && !event.dodged && event.amount > 0 &&
          installed.enemyTeam.some(enemy => enemy.id === event.target))).toBe(true);
        const damage = batch.filter(event => event.kind === 'damage' || event.kind === 'dot')
          .filter(event => event.target === beforeHero.id && (event.kind !== 'damage' || !event.dodged))
          .reduce((sum, event) => sum + event.amount, 0);
        expect(hero().life).toBe(beforeHero.life - damage + healing.reduce((sum, event) => sum + event.amount, 0));
        witnesses++;
      }
    }
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    const outcome = required(installed.outcome), final = useCombatStore.getState();
    expect(final.playerTeam.map(withoutStatuses)).toEqual(outcome.finalPlayerTeam.map(withoutStatuses));
    expect(final.enemyTeam.map(withoutStatuses)).toEqual(outcome.finalEnemyTeam.map(withoutStatuses));
    for (const unit of [...final.playerTeam, ...final.enemyTeam]) {
      const observed = required(events.filter(event => event.kind === 'status-state')
        .filter(event => event.target === unit.id).at(-1));
      expect(unit.statuses).toEqual(unit.life > 0 ? observed.statuses : []);
    }
    if (witnesses > 0) return witnesses;
    if (advanceWaveOrFinish() !== 'next-wave') break;
  }
  expect(witnesses).toBeGreaterThan(0);
  return witnesses;
}

it.each([1, 20])('rank %i public Cobra recovery survives ordinary save/Continue/import without persisting charges', async rank => {
  arrange(rank); start(rank);
  expect(observeRecovery()).toBeGreaterThan(0);
  const expected = toJsonSafe(snapshot());
  const exported = required(exportCurrentSave());
  expect(JSON.parse(exported) as unknown).toEqual(expected);
  for (const transient of ['assassinMartialRanks', CHARGE, 'martialCharges', 'recordedEvents',
    'manaRegenCarry', 'manaRegenExactCarry']) expect(exported).not.toContain('"' + transient + '"');
  await flushSave();
  expect(toJsonSafe(required(await loadSave()))).toEqual(expected);
  expect(JSON.parse(required(await exportSave())) as unknown).toEqual(expected);
  expect(disk.put).toHaveBeenCalled();

  reset(); useHydrationStore.getState().setStatus('idle');
  expect(snapshotStores()).toBeNull();
  expect(await hydrateFromSave()).toBe(true);
  expect(useHydrationStore.getState().status).toBe('ready');
  expect(toJsonSafe(snapshot())).toEqual(expected);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  start(rank); expect(observeRecovery()).toBeGreaterThan(0);

  // Import replaces a live recorded run using the real save validator/write queue.
  await importIntoStores(exported);
  expect(toJsonSafe(snapshot())).toEqual(expected);
  expect(toJsonSafe(required(await loadSave()))).toEqual(expected);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  start(rank); expect(observeRecovery()).toBeGreaterThan(0);
});
