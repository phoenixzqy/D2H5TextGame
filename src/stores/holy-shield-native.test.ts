import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  refreshActivePlayerCombatConfig,
  startSubAreaRun
} from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
] as const;
function reset() {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Paladin');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({
    team: s.playerTeam,
    events: s.recordedEvents,
    outcome: s.outcome,
    cursor: s.eventCursor,
    rewards: s.runRewards
  });
}
/** Constructed level/pool/Attack equipment; native basic attacks, never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic native Holy Shield fixture', 'paladin');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: [],
    skillLevels: { 'paladin.smite': 1, 'paladin.charge': 1 }
  });
  const cap: Item = {
    id: 'fixture-pool-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', 100]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!value) throw new Error('Missing native Holy Shield outcome');
  return value;
}
it('learns using native allocation without rewriting a recorded wave, then pays next wave', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(hero().holyShieldRank).toBe(0);
  const first = recording(), final = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-holy-shield')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-paladin-holy-shield']);
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().holyShieldRank).toBe(1);
  expect(hero().holyShield).toBeUndefined();
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  expect(finalHero().holyShield).toEqual({ sourceHeroId: player().id, rank: 1 });
  expect(useCombatStore.getState().recordedEvents.filter(e => e.kind === 'buff' &&
    e.buffId === 'holy-shield')).toHaveLength(1);
});
it('updates paid potency only next wave, never repays, and replays original resources exactly', () => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-holy-shield')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-paladin-holy-shield']);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const first = recording(), final = structuredClone(finalHero());
  expect(final.holyShield).toEqual({ sourceHeroId: player().id, rank: 1 });
  expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-holy-shield')).toBe('ok');
  expect(recording()).toEqual(first);
  drain();
  expect(hero().holyShield).toEqual(final.holyShield);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().holyShield).toEqual({ sourceHeroId: player().id, rank: 2 });
  expect(hero().stats).toEqual(final.stats);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording();
  expect(second.events.filter(e => e.kind === 'buff' && e.buffId === 'holy-shield')).toEqual([]);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
});
it.each(['reset', 'prerequisite', 'class'] as const)('clears paid power next wave after %s loss', mode => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-holy-shield')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-paladin-holy-shield']);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const first = recording(), final = structuredClone(finalHero());
  expect(final.holyShield?.rank).toBe(1);
  if (mode === 'reset') expect(resetSkillsForCompositionTest()).toBe('ok');
  // Trusted invalid-allocation/class fixture: setPlayer deliberately replaces the character and aborts combat.
  else usePlayerStore.setState({ player: { ...player(),
    ...(mode === 'class' ? { class: 'sorceress' as const } :
      { skillLevels: { 'paladin.holy_shield': 1 } }) } });
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().holyShieldRank).toBe(0);
  expect(hero().holyShield).toBeUndefined();
  expect(hero().activeBuffIds).not.toContain('holy-shield');
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
});
it('Save22 roundtrips allocation/priority only; fresh projections and imports are unpaid', async () => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-holy-shield')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-paladin-holy-shield']);
  const expected = playerToCombatUnit(player()), save = snapshotStores();
  if (!save) throw new Error('Missing native save');
  expect(save.version).toBe(23);
  expect(expected.holyShieldRank).toBe(1);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(finalHero().holyShield?.rank).toBe(1);
  expect(playerToCombatUnit(player()).holyShield).toBeUndefined();
  const afterPaid = snapshotStores();
  expect(JSON.stringify(toJsonSafe(afterPaid))).not.toMatch(/holyShield|activeBuffIds/);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).activeBuffIds).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
