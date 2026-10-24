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
  if (!value) throw new Error('Missing functional Assassin');
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
  const fresh = createMockPlayer('Native Assassin passive fixture', 'assassin');
  usePlayerStore
    .getState()
    .setPlayer({
      ...fresh,
      level: 30,
      skillPoints: 3,
      comboOrder: [],
      skillLevels: { 'assassin.burst_of_speed': 1 }
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
          ['statMods.attack', 1000]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
function learn() {
  for (const slug of ['fade', 'venom', 'venom']) {
    expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-' + slug)).toBe('ok');
  }
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
it('native learning affects the next wave and respec replay removes bonuses without healing or income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const baseline = structuredClone(hero()),
    first = recording(),
    persisted = structuredClone(player().derivedStats);
  learn();
  expect(recording()).toEqual(first);
  expect(player().derivedStats).toEqual(persisted);
  const final = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!final) throw new Error('Missing wave outcome');
  const length = first.events.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane'] as const) {
    expect(hero().stats.resistances[type]).toBe(baseline.stats.resistances[type] + 2);
  }
  expect(hero().stats.magicDodge).toBeCloseTo(baseline.stats.magicDodge + 0.005, 12);
  expect(hero().increasedDamagePct?.poison).toBeCloseTo(0.06, 12);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'status' && e.statusId === 'poison')
  ).toBe(true);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording(),
    pools = [hero().life, hero().mana];
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(hero().stats).toEqual(playerToCombatUnit(player()).stats);
  expect(hero().stats.resistances).toEqual(baseline.stats.resistances);
  expect(hero().stats.magicDodge).toBe(baseline.stats.magicDodge);
  expect(hero().increasedDamagePct?.poison ?? 0).toBe(0);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'status' && e.statusId === 'poison')
  ).toBe(false);
  expect([hero().life, hero().mana]).toEqual(pools);
  expect(useCombatStore.getState().runRewards).toEqual(second.rewards);
  const replay = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(replay);
});
it('roundtrips learned Fade/Venom and exact ownership without persisting combat bonuses', async () => {
  arrange();
  learn();
  const expected = playerToCombatUnit(player()),
    save = snapshotStores();
  if (!save) throw new Error('Missing snapshot');
  expect(save.player.derivedStats.resistances.fire).toBe(expected.stats.resistances.fire - 2);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(useInventoryStore.getState().equipped.head?.id).toBe('fixture-pool-cap');
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
