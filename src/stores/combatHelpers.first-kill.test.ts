/** Constructed native reward evidence; no earned campaign/balance credit. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { abortSubAreaRun, advanceWaveOrFinish, awardLootForVictory, createSimpleEnemy, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { __resetPersistenceForTests, hydrateFromSave, snapshotStores, useHydrationStore } from './persistence';
import * as lootData from '@/data/loaders/loot';
import { materialEconomy } from '@/data/loaders/materials';
import { __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { decodeSaveJson } from '@/engine/save/validate';

const disk = vi.hoisted(() => ({ current: null as SaveCurrent | null }));
vi.mock('./save-adapter', () => ({ loadSave: () => Promise.resolve(disk.current),
  saveSave: () => Promise.resolve(), deleteSave: () => Promise.resolve() }));
const AREA = 'areas/act1-catacombs';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore];
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function drain() {
  for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
}
function start(act: 1 | 5 = 1, area = AREA) {
  const handle = startSubAreaRun({ act, subAreaId: area, runSeed: 7, challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing native first-kill fixture');
  return handle.totalWaves;
}
function reachBoss(act: 1 | 5 = 1, area = AREA) {
  const count = start(act, area);
  for (let wave = 0; wave < count - 1; wave++) {
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  }
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function settleBoss() {
  const before = useCombatStore.getState().runRewards.items.length;
  drain(); expect(advanceWaveOrFinish()).toBe('victory');
  return useCombatStore.getState().runRewards.items.slice(before);
}
beforeEach(() => {
  reset(); disk.current = null; useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  registerSkill({ id: 'fixture.first-kill-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [1000000,1000000], alwaysHits: true }] });
  const hero = createMockPlayer('First kill fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.first-kill-finisher'],
    coreStats: { ...hero.coreStats, vitality: 10000 } });
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('awards one actual unique only on the first terminal boss kill, with no duplicate settlement', () => {
  reachBoss(); const first = settleBoss();
  expect(first.at(-1)).toMatchObject({ rarity: 'unique' });
  expect(first.at(-1)?.uniqueId).toBeTruthy();
  expect(useMapStore.getState().clearedSubAreas).toEqual([AREA]);
  const inventory = useInventoryStore.getState();
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(inventory);
  reachBoss(); const repeat = settleBoss();
  expect(first).toHaveLength(repeat.length + 1);
  expect(first.slice(0, -1).map(item => ({ ...item, id: '' })))
    .toEqual(repeat.map(item => ({ ...item, id: '' })));
});

it('persists the awarded unique and consumed flag together; Continue cannot award it again', async () => {
  reachBoss(); const first = settleBoss();
  const unique = first.at(-1);
  expect(unique).toMatchObject({ rarity: 'unique' });
  const snapshot = snapshotStores();
  expect(snapshot?.map.clearedSubAreas).toContain(AREA);
  disk.current = decodeSaveJson(JSON.stringify(snapshot));
  for (const store of stores) store.getState().reset();
  expect(await hydrateFromSave()).toBe(true);
  expect(useMapStore.getState().clearedSubAreas).toContain(AREA);
  expect([...useInventoryStore.getState().backpack, ...useInventoryStore.getState().stash]).toContainEqual(unique);
  reachBoss(); expect(settleBoss()).toHaveLength(first.length - 1);
});

it.each(['nightmare', 'hell'] as const)('uses the frozen %s eligibility despite UI difficulty changes', profile => {
  const proof = campaignEvidence();
  useMapStore.setState({ ...proof, questDifficulties: { 'difficulty/nightmare': true },
    clearedSubAreas: [AREA, 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate',
      'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ questItems: proof.questItems });
  expect(selectReplayProfile(profile)).toBe('ok');
  reachBoss();
  useMapStore.setState({ selectedDifficulty: 'normal', currentSubAreaId: 'areas/act1-blood-moor' });
  const first = settleBoss();
  const key = profile === 'hell' ? 'hellClearedSubAreas' : 'nightmareClearedSubAreas';
  expect(useMapStore.getState()[key]).toEqual([AREA]);
  useCombatStore.getState().endCombat();
  expect(selectReplayProfile(profile)).toBe('ok');
  reachBoss(); expect(settleBoss()).toHaveLength(first.length - 1);
});

it('restores the complete reward bag and first-kill eligibility if clear publication throws', () => {
  reachBoss();
  const before = useInventoryStore.getState(), map = useMapStore.getState();
  const mark = map.markCleared;
  vi.spyOn(map, 'markCleared').mockImplementation(area => { mark(area); throw new Error('first-kill observer'); });
  drain(); expect(advanceWaveOrFinish).toThrow('first-kill observer');
  expect(useInventoryStore.getState()).toEqual(before);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
});

it('keeps eligibility after an aborted boss wave and grants the bonus on a new successful run', () => {
  reachBoss(); abortSubAreaRun();
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  reachBoss(); const first = settleBoss();
  reachBoss(); expect(settleBoss()).toHaveLength(first.length - 1);
});

it('gives neither a first-kill item nor a consumed flag on a real lost battle', () => {
  usePlayerStore.getState().setPlayer(createMockPlayer('Lost battle fixture', 'sorceress'));
  start(); expect(useCombatStore.getState().outcome?.winner).not.toBe('player');
  const inventory = useInventoryStore.getState();
  drain(); expect(advanceWaveOrFinish()).toBe('defeat');
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
});

it('publishes the extra Mal-or-higher rune only on the first Hell Baal victory', () => {
  const proof = campaignEvidence(), area = 'areas/act5-throne-of-destruction';
  useMapStore.setState({ ...proof, questDifficulties: { 'difficulty/nightmare': true },
    clearedSubAreas: [AREA, 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate',
      'areas/act4-chaos-sanctuary', area] });
  useInventoryStore.setState({ questItems: proof.questItems });
  expect(selectReplayProfile('hell')).toBe('ok');
  reachBoss(5, area);
  const before = useCombatStore.getState().runRewards;
  const firstItems = settleBoss(), after = useCombatStore.getState().runRewards;
  const firstRunes = after.runes - before.runes;
  const firstMaterials = Object.fromEntries(Object.entries(after.materials).map(([id, count]) => [id, count - (before.materials[id] ?? 0)]));
  reachBoss(5, area);
  const beforeRepeat = useCombatStore.getState().runRewards;
  const repeatItems = settleBoss(), repeat = useCombatStore.getState().runRewards;
  expect(firstItems).toHaveLength(repeatItems.length + 1);
  expect(firstRunes).toBe(repeat.runes - beforeRepeat.runes + 1);
  const repeatMaterials = Object.fromEntries(Object.entries(repeat.materials).map(([id, count]) => [id, count - (beforeRepeat.materials[id] ?? 0)]));
  const differences = Object.keys(firstMaterials).filter(id => firstMaterials[id] !== (repeatMaterials[id] ?? 0));
  expect(differences).toHaveLength(1);
  const id = differences[0];
  expect(id).toMatch(/^runes\//);
  if (!id) throw new Error('Missing extra Hell rune');
  expect(firstMaterials[id]).toBe((repeatMaterials[id] ?? 0) + 1);
  expect(materialEconomy.runeOrder.indexOf(id)).toBeGreaterThanOrEqual(22);
  expect(useMapStore.getState().hellClearedSubAreas).toContain(area);
});

it('does not let a direct helper caller supply native first-kill eligibility', () => {
  const enemy = { ...createSimpleEnemy(14, 0), tier: 'chapter-boss' as const };
  const opts = { act: 1 as const, seed: 7, treasureClassId: 'loot/act1-boss', slainEnemies: [enemy] };
  __resetRollItemSeqForTests();
  const ordinary = awardLootForVictory(opts);
  useInventoryStore.getState().reset(); __resetRollItemSeqForTests();
  const injected = { ...opts, firstKillBossId: enemy.id, firstKillBonus: true };
  expect(awardLootForVictory(injected)).toEqual(ordinary);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
});

it('treats a historical loaded clear as consumed without a retroactive unique', () => {
  useMapStore.setState({ clearedSubAreas: [AREA] });
  reachBoss(); const first = settleBoss();
  reachBoss(); expect(settleBoss().map(item => ({ ...item, id: '' })))
    .toEqual(first.map(item => ({ ...item, id: '' })));
});

it('refuses the whole native bag before XP or inventory writes if the first-kill unique is impossible', () => {
  reachBoss();
  const pools = lootData.loadAwardPools(), policy = pools.chapterBossFirstKills;
  if (!policy) throw new Error('Missing refusal fixture');
  const rule = policy.bosses.get('loot/act1-boss');
  if (!rule) throw new Error('Missing boss rule');
  vi.spyOn(lootData, 'loadAwardPools').mockReturnValue({ ...pools, chapterBossFirstKills: {
    eliteBaseIds: new Set(), bosses: new Map([['loot/act1-boss', { ...rule, randomUnique: 'elite' }]]) } });
  const before = useInventoryStore.getState(), xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  drain(); expect(advanceWaveOrFinish).toThrow('No materializable chapter-boss unique');
  expect(xp).not.toHaveBeenCalled();
  expect(useInventoryStore.getState()).toEqual(before);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
});
