import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Durable I/O is replaced; native admission, factories, recording and receipts remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function publishedInput() {
  const published = inspectRecordedWaves().currentPublished;
  if (!published) throw new Error('Missing native recording');
  return published.binding.engineInput;
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  // Constructed access and high power isolate context; no earned progression claim.
  registerSkill({ id: 'fixture.act-context-finisher', archetype: 'fixture',
    target: 'all-enemies', minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000], alwaysHits: true }] });
  const hero = createMockPlayer('Native act context fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, level: 60,
    comboOrder: ['fixture.act-context-finisher'], coreStats: { ...hero.coreStats, vitality: 10000 } });
  useMapStore.setState({ questProgress: Object.fromEntries(loadQuests().map(q => [q.id,
    { id: q.id, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(q.objectives.map(o => [o.id, true])) }])) });
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it.each([
  [1, 'areas/act1-blood-moor'], [2, 'areas/act2-rocky-waste'],
  [3, 'areas/act3-great-marsh'], [4, 'areas/act4-plains-of-despair'],
  [5, 'areas/act5-bloody-foothills']
] as const)('records accepted Act %s on its first native wave', (act, subAreaId) => {
  expect(startSubAreaRun({ act, subAreaId, runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  expect(publishedInput().act).toBe(act);
});

it('retains the accepted act on the next wave and public replay after map selection changes', () => {
  startSubAreaRun({ act: 4, subAreaId: 'areas/act4-plains-of-despair', runSeed: 7, challengeOrdinal: 0 });
  const combat = useCombatStore.getState();
  for (const _event of combat.recordedEvents) useCombatStore.getState().advanceEvent();
  useMapStore.getState().setCurrentLocation(1, 'a1-blood-moor');
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(publishedInput().act).toBe(4);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(publishedInput().act).toBe(4);
});

it('uses the correct act threshold for a living boss between ten and fifteen percent life', () => {
  startSubAreaRun({ act: 4, subAreaId: 'areas/act4-plains-of-despair', runSeed: 7, challengeOrdinal: 0 });
  const source = publishedInput(), hero = source.playerTeam[0], enemy = source.enemyTeam[0];
  if (!hero || !enemy) throw new Error('Missing native units');
  const controlled = { ...source,
    playerTeam: [{ ...hero, life: 100000, skillOrder: [],
      stats: { ...hero.stats, lifeMax: 100000, attack: 1, critChance: 0 } }],
    enemyTeam: [{ ...enemy, tier: 'boss' as const, life: 14, statuses: [],
      stats: { ...enemy.stats, lifeMax: 100, attack: 0, defense: 0, critChance: 0 } }]
  };
  const native = runBattleRecorded(controlled);
  const correct = runBattleRecorded({ ...controlled, act: 4 });
  expect(native.events).toEqual(correct.events);
  expect(native.result).toEqual(correct.result);
  const firstEnrage = (events: typeof native.events) => events.find(e => e.kind === 'enrage')?.simClockMs;
  const legacy = runBattleRecorded({ ...controlled, act: 1 });
  expect(firstEnrage(correct.events)).toBeDefined();
  expect(firstEnrage(correct.events)).toBeLessThan(firstEnrage(legacy.events) ?? Infinity);
});
