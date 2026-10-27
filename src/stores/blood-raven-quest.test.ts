/** Constructed native-settlement wiring; no earned power or browser acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { decodeSave } from '@/engine/save/validate';
import { xpTotal } from '@/engine/progression/xp';
import { loadQuests } from '@/data/loaders/quests';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { usePlayerStore } from './playerStore';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores } from './persistence';

const QUEST = 'quests/act1-sisters-burial-grounds';
const AREA = 'areas/act1-burial-grounds';
const TARGET = 'monsters/act1.blood-raven';
const domains = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Missing Blood Raven fixture');
  return value;
}
function reset(): void {
  abortSubAreaRun();
  __resetPersistenceForTests();
  for (const store of domains) store.getState().reset();
}
function track(): void {
  const quest = required(loadQuests().find(row => row.id === QUEST));
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress',
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])),
    rewardClaimed: false });
}
function start(): number {
  const hero = createMockPlayer('Blood Raven wiring', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: [] });
  // Deliberately constructed equipment proves source wiring, never earned viability.
  const cap = { id: 'blood-raven-wiring-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare' as const, level: 1, identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const equipped = required(usePlayerStore.getState().player);
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: hero.derivedStats.mana } });
  useMapStore.getState().setCurrentLocation(1, AREA);
  return required(startSubAreaRun({ subAreaId: AREA, act: 1, runSeed: 7,
    challengeOrdinal: 0 })).totalWaves;
}
function drain(): void {
  for (const _event of useCombatStore.getState().recordedEvents) {
    useCombatStore.getState().advanceEvent();
  }
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function reachFinal(): void {
  const total = start();
  for (let wave = 1; wave < total; wave++) {
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-kill-blood-raven'] ?? false).toBe(false);
  }
  const outcome = required(useCombatStore.getState().outcome);
  expect(outcome.winner).toBe('player');
  expect(outcome.finalEnemyTeam.some(enemy => enemy.monsterArchetypeId === TARGET && enemy.life <= 0)).toBe(true);
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

describe('authored Blood Raven quest and canonical native kill', () => {
  it('credits only settled playback, then ordered Kashya Talk completes without claiming', () => {
    track();
    const early = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/kashya');
    expect(useMapStore.getState()).toBe(early);
    reachFinal();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-kill-blood-raven']).toBe(false);
    drain();
    expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[QUEST]).toEqual({ id: QUEST,
      status: 'inProgress', objectives: { 'obj-kill-blood-raven': true, 'obj-return': false },
      rewardClaimed: false });
    const before = required(snapshotStores());
    expect(xpTotal(before.player.level) + before.player.experience).toBeGreaterThan(0);
    const wrongNpc = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(wrongNpc);
    useMapStore.getState().recordNpcTalk('npc/kashya');
    const progress = useMapStore.getState().questProgress[QUEST];
    expect(progress).toEqual({ id: QUEST, status: 'completed',
      objectives: { 'obj-kill-blood-raven': true, 'obj-return': true }, rewardClaimed: false });
    const after = required(snapshotStores());
    expect(after.player).toEqual(before.player);
    expect(after.inventory).toEqual(before.inventory);
    expect(after.mercs).toEqual(before.mercs);
    const saved = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(saved.map.questProgress[QUEST]).toEqual(progress);
    const settled = useMapStore.getState();
    expect(advanceWaveOrFinish()).toBe('idle');
    useMapStore.getState().recordNpcTalk('npc/kashya');
    expect(useMapStore.getState()).toBe(settled);
  });

  it('never backfills an untracked historical clear or earlier talk', () => {
    reachFinal(); drain();
    expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().isCleared(AREA)).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]).toBeUndefined();
    track();
    const tracked = useMapStore.getState();
    expect(advanceWaveOrFinish()).toBe('idle');
    useMapStore.getState().recordNpcTalk('npc/kashya');
    expect(useMapStore.getState()).toBe(tracked);
    expect(tracked.questProgress[QUEST]?.objectives).toEqual({
      'obj-kill-blood-raven': false, 'obj-return': false });
  });

  it.each([
    { actId: 'acts/act2', areaId: AREA, archetypeIds: [TARGET] },
    { actId: 'acts/act1', areaId: 'areas/act1-catacombs', archetypeIds: [TARGET] },
    { actId: 'acts/act1', areaId: AREA, archetypeIds: ['monsters/act1.fallen'] }
  ])('refuses mismatched kill event %j', event => {
    track();
    const before = useMapStore.getState();
    useMapStore.getState().recordMonsterKills(event);
    expect(useMapStore.getState()).toBe(before);
  });

  it('does not credit abandoned final playback', () => {
    track(); reachFinal(); drain();
    const before = useMapStore.getState().questProgress[QUEST];
    abortSubAreaRun();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[QUEST]).toBe(before);
  });
});
