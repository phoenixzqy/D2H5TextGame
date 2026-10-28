import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve()),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
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
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';

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
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});
/** Synthetic large-pool/Attack equipment verifies wave boundaries, never earned class balance. */
function arrange(rank = 1) {
  usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Constructed native spirit', 'druid'),
    level: 30,
    skillPoints: 1,
    comboOrder: [],
    skillLevels: {
      'druid.oak_sage': 1,
      'druid.heart_of_wolverine': 1,
      'druid.spirit_of_barbs': rank
    }
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
function spirit() {
  const e = useCombatStore
    .getState()
    .recordedEvents.find((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs');
  if (e?.kind !== 'summon') throw new Error('Missing native spirit');
  return e;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

it('freezes upgrade until the next wave and original-resource replay repeats without income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  expect(spirit().unit).toMatchObject({ life: 80, stats: { lifeMax: 82, defense: 10 } });
  const first = recording();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-druid-spirit-of-barbs')).toBe('ok');
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(usePlayerStore.getState().player?.skillLevels?.['druid.spirit_of_barbs']).toBe(2);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.filter((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')
  ).toHaveLength(1);
  const second = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
});

it('removes passive creation after allocation reset without rewriting the current recording or duplicating rewards', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  spirit();
  const first = recording();
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(first);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  const events = useCombatStore.getState().recordedEvents;
  expect(events.some((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')).toBe(false);
  expect(
    events.some(
      (e) => e.kind === 'status-state' && e.statuses.some((s) => s.id === 'spirit-of-barbs')
    )
  ).toBe(false);
  expect(useCombatStore.getState().runRewards).toEqual(first.rewards);
});

it('round-trips all five Save22 domains exactly and recreates the spirit without persisting transient authority', async () => {
  arrange(20);
  const save = snapshotStores();
  if (!save) throw new Error('Missing Save22');
  expect(save.version).toBe(24);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const spawn = spirit();
  const serialized = JSON.stringify(toJsonSafe(snapshotStores()));
  for (const field of ['spiritOfBarbs', 'barbsSpiritId', 'summonTemplateId', spawn.unit.id])
    expect(serialized).not.toContain(field);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  const restored = snapshotStores();
  if (!restored) throw new Error('Missing restored save');
  for (const domain of ['player', 'inventory', 'map', 'mercs', 'formation'] as const)
    expect(toJsonSafe(restored[domain])).toEqual(toJsonSafe(save[domain]));
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(spirit()).toEqual(spawn);
});
