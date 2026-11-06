import type { CombatUnit } from '@/engine/combat/types';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import * as staging from './recordedWaveStaging';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const ARMOR = 'mskill-frozen-armor', AREA = 'areas/act1-blood-moor';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const item = (baseId: string, id: string): Item => ({ id, baseId,
  rarity: 'normal', level: 1, identified: true, equipped: false });
function owned() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act3-iron-wolf-frozen-armor');
  if (!def) throw new Error('Missing native Iron Wolf');
  return createMercFromDef(def, 'boundary');
}
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function merc(team: readonly CombatUnit[] = useCombatStore.getState().playerTeam) {
  const unit = team.find(row => row.kind === 'merc');
  if (!unit) throw new Error('Missing native staged merc');
  return unit;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function start() {
  expect(startSubAreaRun({ subAreaId: AREA, act: 1, runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
}
function firstWave(holdRestoredHero = false) {
  registerSkill({ id: 'fixture.armor-boundary-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100000, 100000], alwaysHits: true }
    ] });
  const hero = createMockPlayer('ArmorBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.armor-boundary-finisher'] });
  // Imported survivor stats and depleted entry pools isolate carry mechanics, not earned play.
  const native = owned(), imported: Mercenary = { ...native, level: 30,
    derivedStats: { ...native.derivedStats, life: 10000, lifeMax: 10000, mana: 1000, manaMax: 1000,
      attack: 1, attackSpeed: 263, critChance: 0 } };
  useMercStore.getState().addMerc(imported); useMercStore.getState().setFieldedMerc(imported.id);
  useInventoryStore.setState({ equipped: { weapon: item('items/base/weapon-bow', 'armor-hero-bow') } });
  useMercStore.setState({ mercEquipment: { [imported.id]: { weapon: item('items/base/weapon-bow', 'armor-merc-bow') } } });
  const stage = staging.stageRecordedWave;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementation(input => {
    const depleted = input.resetRunRewards === true && input.waveIdx === 0;
    const heldHero = holdRestoredHero && input.waveIdx === 2;
    return stage(depleted || heldHero ? { ...input, snapshot: { ...input.snapshot,
      playerTeam: input.snapshot.playerTeam.map(unit => depleted && unit.kind === 'merc'
        ? { ...unit, life: 5000, mana: 500 }
        : heldHero && unit.kind === 'hero' ? { ...unit, life: unit.life + 10000,
          stats: { ...unit.stats, lifeMax: unit.stats.lifeMax + 10000 }, statuses: [...unit.statuses,
          { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 8, appliedAtMs: 0, expiresAtMs: 8000 }] } : unit)
    } } : input);
  });
  start();
  const first = useCombatStore.getState(), terminal = first.outcome;
  if (!terminal) throw new Error('Missing actual first result');
  expect(terminal.winner).toBe('player');
  expect(merc()).not.toHaveProperty('mercFrozenArmor');
  const paid = merc(terminal.finalPlayerTeam);
  expect(paid).toHaveProperty('mercFrozenArmor', { defense: 120 });
  expect(first.recordedEvents).toContainEqual(expect.objectContaining({ kind: 'action', actor: paid.id,
    skillId: ARMOR, simClockMs: 400 }));
  expect(paid.life).toBeLessThan(paid.stats.lifeMax);
  expect(paid.mana).toBeLessThan(paid.stats.manaMax);
  return { imported, first, paid, before: structuredClone(first.outcome) };
}
beforeEach(() => {
  reset(); resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

it('qualifies only the actual owned identity, valid level and native loadout without persisting potency', () => {
  const original = owned(), before = structuredClone(original);
  expect(mercToCombatUnit(original)).toMatchObject({ mercFrozenArmorSource: true, skillOrder: [ARMOR] });
  for (const patch of [{ id: 'mercs/act3-iron-wolf-frozen-armor-forged#1' },
    { signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }, ...[0, NaN, Infinity, 1.5].map(level => ({ level }))]) {
    expect(mercToCombatUnit({ ...original, ...patch })).not.toHaveProperty('mercFrozenArmorSource');
  }
  expect(original).toEqual(before);
  expect(JSON.stringify(original)).not.toContain('mercFrozenArmor');
});

it('carries genuinely paid flat potency and depleted resources without recasting, through repeated replay', () => {
  const { paid, first, before } = firstWave(); drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const second = useCombatStore.getState(), initial = structuredClone(merc());
  for (let replay = 0; replay < 2; replay++) {
    expect(merc().mercFrozenArmor).toEqual({ defense: 120 });
    expect([merc().life, merc().mana]).toEqual([paid.life, paid.mana]);
    expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'action' &&
      event.actor === paid.id && event.skillId === ARMOR)).toBe(false);
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  }
  expect(merc()).toEqual(initial);
  expect(first.outcome).toEqual(before);
  expect(second.playerTeam.find(unit => unit.id === paid.id)).toEqual(initial);
});

it('omits stale known delivery on current unknown hero and merc equipment, leaving the old recording intact', () => {
  const { imported, first, before, paid } = firstWave();
  expect(merc().basicAttackDelivery).toBe('ranged');
  expect(first.playerTeam[0]?.basicAttackDelivery).toBe('ranged');
  useInventoryStore.setState({ equipped: { weapon: item('fixture/unknown-weapon', 'armor-hero-unknown') } });
  useMercStore.setState({ mercEquipment: { [imported.id]: { weapon: item('fixture/unknown-weapon', 'armor-merc-unknown') } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(merc()).not.toHaveProperty('basicAttackDelivery');
  expect(useCombatStore.getState().playerTeam[0]).not.toHaveProperty('basicAttackDelivery');
  expect([merc().life, merc().mana]).toEqual([paid.life, paid.mana]);
  expect(merc().mercFrozenArmor).toEqual({ defense: 120 });
  expect(first.outcome).toEqual(before);
});

it('uses the captured bare fielded merc after owned removal, without borrowing hero or bench equipment', () => {
  const { imported, paid, first, before } = firstWave(), bench = { ...imported, id: 'bench-armor' };
  useMercStore.setState({ ownedMercs: [bench], fieldedMercId: bench.id,
    mercEquipment: { [bench.id]: { weapon: item('items/base/weapon-bow', 'armor-bench-bow') } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(merc()).toMatchObject({ id: paid.id, basicAttackDelivery: 'melee', mercFrozenArmor: { defense: 120 },
    mercFrozenArmorSource: true, skillOrder: [ARMOR] });
  expect([merc().life, merc().mana]).toEqual([paid.life, paid.mana]);
  expect(first.outcome).toEqual(before);
});

it.each(['loadout', 'level'] as const)('strips paid state and exact markers only from the new input after loss of %s', loss => {
  const { imported, first, before } = firstWave();
  useMercStore.setState({ ownedMercs: [{ ...imported, ...(loss === 'level' ? { level: 0 }
    : { signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }) }] });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(merc()).not.toHaveProperty('mercFrozenArmorSource');
  expect(merc()).not.toHaveProperty('mercFrozenArmor');
  expect(merc().activeBuffIds).not.toContain('frozen_armor');
  expect(merc().activeBuffIds).not.toContain(ARMOR);
  expect(first.outcome).toEqual(before);
});

it.each(['loadout', 'level'] as const)('pays a new cast after a completed qualification-lost wave and restored %s', loss => {
  const { imported, first, before } = firstWave(true);
  useMercStore.setState({ ownedMercs: [{ ...imported, ...(loss === 'level' ? { level: 0 }
    : { signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }) }] });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const lost = useCombatStore.getState(), lostInitial = structuredClone(lost.playerTeam), lostOutcome = structuredClone(lost.outcome);
  expect(merc()).not.toHaveProperty('mercFrozenArmor');
  expect(merc(lost.outcome?.finalPlayerTeam)).not.toHaveProperty('mercFrozenArmor');
  expect(lost.outcome?.winner).toBe('player');
  useMercStore.setState({ ownedMercs: [imported] });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const restored = useCombatStore.getState(), initial = merc();
  expect(initial).toMatchObject({ mercFrozenArmorSource: true, skillOrder: [ARMOR] });
  expect(initial).not.toHaveProperty('mercFrozenArmor');
  expect(initial.activeBuffIds).not.toContain('frozen_armor');
  expect(initial.activeBuffIds).not.toContain(ARMOR);
  // Hold the synthetic finisher for eight seconds, with a declared hero survival
  // pool, so carried CD6 can expire before an actual newly paid merc action.
  // Both the published input and real engine simulation see this same entry seam.
  const casts = restored.recordedEvents.filter(event => event.kind === 'action' &&
    event.actor === initial.id && event.skillId === ARMOR);
  expect(restored.outcome?.winner).toBe('player');
  expect(restored.recordedEvents.some(event => event.kind === 'death' && event.target === restored.playerTeam[0]?.id)).toBe(false);
  expect(casts).toHaveLength(1);
  expect(casts[0]?.simClockMs).toBeGreaterThanOrEqual(initial.cooldowns[ARMOR] ?? 0);
  expect(casts[0]?.simClockMs).toBeGreaterThanOrEqual(400);
  expect(merc(restored.outcome?.finalPlayerTeam).mercFrozenArmor).toEqual({ defense: 120 });
  expect(lost.playerTeam).toEqual(lostInitial);
  expect(lost.outcome).toEqual(lostOutcome);
  expect(first.outcome).toEqual(before);
});

it('starts a new run without carried potency or cooldown and pays another ordinary action', () => {
  const { first, before } = firstWave();
  abortSubAreaRun(); start();
  const fresh = useCombatStore.getState(), initial = merc();
  expect(initial).not.toHaveProperty('mercFrozenArmor');
  expect(initial.activeBuffIds).not.toContain('frozen_armor');
  expect(initial.cooldowns).toEqual({});
  expect(fresh.recordedEvents.filter(event => event.kind === 'action' && event.actor === initial.id && event.skillId === ARMOR))
    .toEqual([expect.objectContaining({ simClockMs: 400 })]);
  expect(merc(fresh.outcome?.finalPlayerTeam).mercFrozenArmor).toEqual({ defense: 120 });
  expect(first.outcome).toEqual(before);
});
