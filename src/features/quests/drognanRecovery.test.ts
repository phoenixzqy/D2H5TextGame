import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { areaQuestTools, questToolStatus, recoverQuestTool, travelToAreaObjects } from './interactObject';
import { withQuestTransaction } from './questTransaction';

const quest = 'quests/side-act2-drognan-tome', source = `${quest}#objective:obj-fetch`;
const area = 'areas/act2-lost-city', itemId = 'quest/sun_cult_tome';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore] as const;
const stops: (() => void)[] = [];
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
const row = () => useMapStore.getState().questProgress[quest];
function track(completed = false) {
  useMapStore.setState({ questProgress: { [quest]: { id: quest, status: completed ? 'completed' : 'inProgress',
    objectives: { 'obj-fetch': completed }, rewardClaimed: false } } });
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Drognan recovery', 'sorceress'));
  useMapStore.setState({ currentAct: 2, currentSubAreaId: area, clearedSubAreas: ['areas/act1-catacombs'] });
  track();
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('Drognan actual terminal tome recovery', () => {
  it('authors an archival tool at the canonical fetch object without another Read reward', () => {
    const definition = loadQuests().find(entry => entry.id === quest);
    expect(definition?.objectives).toEqual([{ id: 'obj-fetch', type: 'fetch', itemId, areaId: area,
      targetId: 'objects/sun_cult_tome_cache', description: 'Find the Sun-Cult Tome.' }]);
    expect(definition?.rewards).toEqual({ xp: 4000, skillPoints: 1, wishstones: 10 });
    const item = loadQuestItems().find(entry => entry.id === itemId);
    expect(item).toMatchObject({ kind: 'tool', sourceQuestId: quest, sourceObjectiveId: 'obj-fetch' });
    expect(item).not.toHaveProperty('effect');
  });
  it('only explicit Recover earns the retained source and terminal completion, without income', () => {
    const before = bytes();
    expect(areaQuestTools(2, area).map(questItemSource)).toContain(source);
    expect(bytes()).toBe(before);
    expect(travelToAreaObjects(2, area)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({});
    const hero = structuredClone(usePlayerStore.getState().player), mercs = JSON.stringify(useMercStore.getState());
    expect(questToolStatus(source)).toBe('ready');
    expect(recoverQuestTool(source)).toBe('ok');
    expect(row()).toEqual({ id: quest, status: 'completed', objectives: { 'obj-fetch': true }, rewardClaimed: false });
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId, state: 'owned' } });
    expect(usePlayerStore.getState().player).toEqual(hero); expect(JSON.stringify(useMercStore.getState())).toBe(mercs);
    const earned = bytes(); expect(recoverQuestTool(source)).toBe('already-owned'); expect(bytes()).toBe(earned);
  });
  it('requires real recovery for completed unclaimed legacy history and never repairs claimed history', () => {
    track(true); expect(recoverQuestTool(source)).toBe('ok');
    useInventoryStore.setState({ questItems: {} });
    useMapStore.getState().updateQuestProgress(quest, { rewardClaimed: true });
    const before = bytes(); expect(recoverQuestTool(source)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it('continues to show the retained tome as owned after Claim without replaying recovery', () => {
    expect(recoverQuestTool(source)).toBe('ok');
    useMapStore.getState().updateQuestProgress(quest, { rewardClaimed: true });
    const before = bytes(); expect(questToolStatus(source)).toBe('owned');
    expect(recoverQuestTool(source)).toBe('already-owned'); expect(bytes()).toBe(before);
  });
  it.each(['missing-row', 'claimed', 'foreign-id', 'extra-objective', 'area', 'act', 'locked', 'nightmare', 'loading', 'no-player', 'combat'] as const)('refuses %s without publication', fault => {
    if (fault === 'missing-row') useMapStore.setState({ questProgress: {} });
    if (fault === 'claimed') useMapStore.getState().updateQuestProgress(quest, { status: 'completed', rewardClaimed: true, objectives: { 'obj-fetch': true } });
    if (fault === 'foreign-id') useMapStore.getState().updateQuestProgress(quest, { id: 'foreign' });
    if (fault === 'extra-objective') useMapStore.getState().updateQuestProgress(quest, { objectives: { 'obj-fetch': false, extra: true } });
    if (fault === 'area') useMapStore.setState({ currentSubAreaId: 'areas/act2-dry-hills' });
    if (fault === 'act') useMapStore.setState({ currentAct: 1 });
    if (fault === 'locked') useMapStore.setState({ clearedSubAreas: [] });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    const before = bytes();
    expect(recoverQuestTool(source)).toBe(fault === 'loading' ? 'not-ready' : fault === 'no-player' ? 'no-player' : fault === 'combat' ? 'combat-active' : 'not-eligible');
    expect(bytes()).toBe(before);
  });
  it('refuses an actual active run even while the combat presentation is paused', () => {
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useMapStore.setState({ currentAct: 2, currentSubAreaId: area }); useCombatStore.setState({ inCombat: false });
    expect(hasActiveSubAreaRun()).toBe(true);
    const before = bytes(); expect(recoverQuestTool(source)).toBe('combat-active'); expect(bytes()).toBe(before);
  });
  it('holds the shared lease throughout source publication and releases it afterwards', () => {
    expect(withQuestTransaction(() => recoverQuestTool(source))).toBe('claim-in-progress');
    stops.push(useMapStore.subscribe(() => { expect(recoverQuestTool(source)).toBe('claim-in-progress'); }));
    expect(recoverQuestTool(source)).toBe('ok');
    stops.splice(0).forEach(stop => { stop(); });
    expect(recoverQuestTool(source)).toBe('already-owned');
  });
  it.each(['row-throw', 'item-throw', 'row-mutate', 'item-mutate'] as const)('restores deep participating source after %s while preserving other writes', fault => {
    const original = structuredClone(row()); let fired = false;
    const corrupt = () => {
      if (fired) return; fired = true;
      useInventoryStore.getState().addCurrency('gem-shard', 5);
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', { status: 'inProgress', objectives: { 'obj-clear-den': false } });
      if (fault === 'row-mutate') { const current = row(); if (current) Object.assign(current.objectives, { 'obj-fetch': false }); }
      if (fault === 'item-mutate') { const item = useInventoryStore.getState().questItems[source]; if (item) Object.assign(item, { state: 'consumed' }); }
      if (fault.endsWith('throw')) throw new Error('injected observer failure');
    };
    stops.push(fault.startsWith('row') ? useMapStore.subscribe(corrupt) : useInventoryStore.subscribe(corrupt));
    expect(recoverQuestTool(source)).toBe('grant-failed');
    expect(row()).toEqual(original); expect(useInventoryStore.getState().questItems).toEqual({});
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
    expect(useMapStore.getState().questProgress['quests/act1-den-of-evil']?.status).toBe('inProgress');
    stops.splice(0).forEach(stop => { stop(); }); expect(recoverQuestTool(source)).toBe('ok');
  });
  it('leaves the neighboring Horadric Cube fetch staged', () => {
    const staff = loadQuests().find(entry => entry.id === 'quests/act2-horadric-staff');
    const cube = staff?.objectives.find(objective => objective.id === 'obj-cube');
    if (!staff || !cube || typeof cube.areaId !== 'string') throw new Error('Missing canonical Cube fixture');
    useMapStore.setState({ currentSubAreaId: cube.areaId, questProgress: { [staff.id]: { id: staff.id, status: 'inProgress',
      objectives: Object.fromEntries(staff.objectives.map(objective => [objective.id, false])) } } });
    expect(recoverQuestTool(`${staff.id}#objective:obj-cube`)).toBe('ok');
    expect(useMapStore.getState().questProgress[staff.id]?.status).toBe('inProgress');
  });
  it.each(['location', 'hydration', 'hero', 'combat'] as const)('rolls back the source if %s changes during publication', fault => {
    const original = structuredClone(row()); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true;
      if (fault === 'location') useMapStore.setState({ currentSubAreaId: 'areas/act2-dry-hills' });
      if (fault === 'hydration') useHydrationStore.getState().setStatus('loading');
      if (fault === 'hero') usePlayerStore.getState().setPlayer(createMockPlayer('Replacement', 'paladin'));
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    }));
    expect(recoverQuestTool(source)).toBe('grant-failed');
    expect(row()).toEqual(original); expect(useInventoryStore.getState().questItems).toEqual({});
  });
  it('preserves independent hero progression when source publication must roll back', () => {
    const original = structuredClone(row()); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true;
      usePlayerStore.getState().gainExperience(37);
    }));
    expect(recoverQuestTool(source)).toBe('grant-failed');
    expect(row()).toEqual(original); expect(useInventoryStore.getState().questItems).toEqual({});
    expect(usePlayerStore.getState().player?.experience).toBe(37);
  });
  it('reports restoration observer failure explicitly and releases the shared lease', () => {
    const original = structuredClone(row());
    stops.push(useInventoryStore.subscribe(() => { throw new Error('Persistent item observer failure'); }));
    expect(() => recoverQuestTool(source)).toThrow(AggregateError);
    expect(row()).toEqual(original); expect(useInventoryStore.getState().questItems).toEqual({});
    stops.splice(0).forEach(stop => { stop(); });
    expect(recoverQuestTool(source)).toBe('ok');
  });
});
