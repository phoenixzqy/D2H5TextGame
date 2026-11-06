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
import type { Mercenary } from '@/engine/types/entities';
import { deriveStats } from '@/engine/progression/stats';
import { mercToCombatUnit } from './mercToCombatUnit';
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
  if (!value) throw new Error('Missing functional Druid');
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
  const fresh = createMockPlayer('Native Druid ally fixture', 'druid');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: ['druid.raven'],
    skillLevels: { 'druid.oak_sage': 1, 'druid.heart_of_wolverine': 1, 'druid.raven': 1 }
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
  if (!value) throw new Error('Missing native Druid outcome');
  return value;
}

it('applies both upgrades only next wave, keeps original merc identity, prepares real owned summons and replays original resources', () => {
  arrange();
  const coreStats = { strength: 20, dexterity: 20, vitality: 10000, energy: 20 };
  const merc: Mercenary = {
    ...player(),
    id: 'original',
    type: 'mercenary',
    classId: 'rogue',
    archetype: 'front',
    rarity: 'R',
    coreStats,
    derivedStats: deriveStats(coreStats, 30),
    comboOrder: []
  };
  useMercStore.getState().addMerc(merc);
  useMercStore.getState().addMerc({ ...merc, id: 'bench' });
  useMercStore.getState().setFieldedMerc(merc.id);
  const mercBase = mercToCombatUnit(merc).stats.lifeMax;
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  expect(hero().stats.lifeMax).toBe(
    playerToCombatUnit(player()).stats.lifeMax +
      Math.floor((playerToCombatUnit(player()).stats.lifeMax * 3) / 100)
  );
  expect(
    useCombatStore.getState().playerTeam.find((u) => u.id === 'merc-original')?.stats.lifeMax
  ).toBe(mercBase + Math.floor((mercBase * 3) / 100));
  const spawn = useCombatStore.getState().recordedEvents.find((e) => e.kind === 'summon');
  if (spawn?.kind !== 'summon') throw new Error('Missing real native Raven preparation');
  expect(spawn.unit.summonOwnerId).toBe(player().id);
  expect(spawn.unit.stats.lifeMax).toBeGreaterThan(spawn.unit.life);
  const observed = useCombatStore
    .getState()
    .recordedEvents.find((e) => e.kind === 'status-state' && e.target === spawn.unit.id);
  if (observed?.kind !== 'status-state') throw new Error('Missing native summon aura observation');
  expect(observed.statuses).toContainEqual(
    expect.objectContaining({ id: 'heart-of-wolverine', sourceId: player().id })
  );
  const first = recording(),
    final = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint('skills-druid-oak-sage')).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint('skills-druid-heart-of-wolverine')).toBe(
    'ok'
  );
  useMercStore.getState().setFieldedMerc('bench');
  expect(recording()).toEqual(first);
  drain();
  expect([hero().life, hero().stats.lifeMax]).toEqual([final.life, final.stats.lifeMax]);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const base = playerToCombatUnit(player()).stats.lifeMax;
  expect(hero().stats.lifeMax).toBe(base + Math.floor((base * 6) / 100));
  expect(hero().life).toBe(final.life);
  const original = useCombatStore.getState().playerTeam.find((u) => u.id === 'merc-original');
  expect(original?.stats.lifeMax).toBeGreaterThan(original?.vigorLife?.baseLifeMax ?? Infinity);
  expect(useCombatStore.getState().playerTeam.some((u) => u.id === 'merc-bench')).toBe(false);
  const second = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
});

it('pure allocation reset defers removal then clears capacity/derived auras without duplicate income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const first = recording();
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(first);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(hero().stats.lifeMax).toBe(playerToCombatUnit(player()).stats.lifeMax);
  expect(hero().vigorLife).toBeUndefined();
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some(
        (e) =>
          e.kind === 'status-state' &&
          e.statuses.some((s) => s.id === 'oak-sage' || s.id === 'heart-of-wolverine')
      )
  ).toBe(false);
  expect(useCombatStore.getState().runRewards).toEqual(first.rewards);
});

it('persists only allocations, round-trips Save22 exactly and recomposes the fresh run without transient aura fields', async () => {
  arrange();
  const save = snapshotStores();
  if (!save) throw new Error('Missing native allied aura save');
  expect(save.version).toBe(32);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const serialized = JSON.stringify(toJsonSafe(snapshotStores()));
  for (const field of ['druidAllyAuras', 'oakRank', 'heartRank', 'vigorLife'])
    expect(serialized).not.toContain(field);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const base = playerToCombatUnit(player()).stats.lifeMax;
  expect(hero().stats.lifeMax).toBe(base + Math.floor((base * 3) / 100));
  expect(hero().life).toBe(base);
});
