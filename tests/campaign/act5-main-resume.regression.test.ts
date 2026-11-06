/** Native actions with disclosed constructed encounter proofs; not earned combat evidence. */
import assert from 'node:assert/strict';
import { beforeAll, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { POTION_SOURCE } from '@/engine/save/act5-state';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { snapshotStores } from '@/stores/persistence';
import type { SaveCurrent } from '@/engine/types/save';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState, restoreEarnedSave } from '../sim/production/earned-state';
import type { CampaignProfile } from './policy';
import type { CampaignRecord } from './actions';
import { constructActFivePrefix, publishConstructedActFiveWave } from './act5-fixture';
import { createCampaignQuestActions } from './quest-actions';
import { runActFive, resumeActFiveMain, actFiveMainActionOrder, assertActFiveComplete } from './act5-route';

const areas = ['areas/act5-bloody-foothills', 'areas/act5-frigid-highlands', 'areas/act5-crystalline-passage',
 'areas/act5-ancients-way', 'areas/act5-throne-of-destruction'];
let restores: (() => void)[];
let baseline: { save: SaveCurrent; profile: CampaignProfile };
beforeAll(() => {
 const undo = captureEarnedRestorers(); vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
 try {
  const f = constructActFivePrefix(), save = snapshotStores(); assert.ok(save);
  baseline = { save, profile: f.profile };
 } finally { for (const restore of undo) restore(); vi.restoreAllMocks(); }
});
beforeEach(() => { restores = captureEarnedRestorers(); resetEarnedStores(); vi.spyOn(Date, 'now').mockReturnValue(1793304000000); });
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function fixture() {
 restoreEarnedSave(baseline.save, baseline.save.timestamp);
 let hook: CampaignRecord = () => undefined;
 const record: CampaignRecord = row => { hook(row); };
 return { profile: baseline.profile, record, actions: createCampaignQuestActions(record, () => undefined),
  act5Start: 0, hook: (next: CampaignRecord) => { hook = next; } };
}
function publish(area: string) {
 const map = useMapStore.getState(); map.setCurrentLocation(5, area);
 if (area === areas[4]) { for (let index = 0; index < 8; index++) publishConstructedActFiveWave(index); return; }
 const contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
 if (contract) {
  const row = map.questProgress[contract.questId]; assert.ok(row);
  map.updateQuestProgress(contract.questId, { ...row, status: 'completed', objectives: { ...row.objectives, [contract.objectiveId]: true } });
  useMapStore.setState({ questReceipts: { ...useMapStore.getState().questReceipts, [contract.proof]: true } });
 }
 map.markCleared(area);
}
function partial(count: number) {
 const f = fixture(), stop = new Error('Constructed boundary stop');
 f.hook(row => { if (row.kind === 'quest-action' && f.actions.entries.length - f.act5Start === count) throw stop; });
 expect(() => runActFive(f.profile, f.record, publish, f.actions, 'main-quests')).toThrow(stop);
 f.hook(() => undefined);
 return { ...f, prefix: f.actions.entries.slice(f.act5Start) };
}
function next(f: ReturnType<typeof fixture>) {
 return createCampaignQuestActions(f.record, () => undefined);
}

it.each(Array.from({ length: 18 }, (_unused, index) => index + 1))('resumes stable action prefix %i without repeating prior native areas or actions', count => {
 const f = partial(count), original = structuredClone(f.prefix), beforeClears = [...useMapStore.getState().clearedSubAreas];
 const actions = next(f), entered: string[] = [];
 resumeActFiveMain(f.profile, f.record, area => { entered.push(area); publish(area); }, actions, f.prefix);
 expect(f.prefix).toEqual(original);
 expect(entered).toEqual(areas.filter(area => !beforeClears.includes(area)));
 expect(actions.entries.map(row => [row.action, row.id])).toEqual(actFiveMainActionOrder.slice(count));
 expect(() => { assertActFiveComplete([...f.prefix, ...actions.entries], 'main-quests'); }).not.toThrow();
});

it.each([areas[0], areas[2], areas[3], areas[4]])('keeps completed native encounter %s when interrupted before its Claim', stopArea => {
 const f = fixture(), stop = new Error('After actual proof');
 expect(() => runActFive(f.profile, f.record, area => { publish(area); if (area === stopArea) throw stop; },
  f.actions, 'main-quests')).toThrow(stop);
 const prefix = f.actions.entries.slice(f.act5Start), actions = next(f), entered: string[] = [];
 resumeActFiveMain(f.profile, f.record, area => { entered.push(area); publish(area); }, actions, prefix);
 expect(entered).not.toContain(stopArea);
 expect(() => { assertActFiveComplete([...prefix, ...actions.entries], 'main-quests'); }).not.toThrow();
});

it('retains the qualified partial Throne proof and retries only the unfinished encounter', () => {
 const f = fixture(), stop = new Error('After wave five');
 expect(() => runActFive(f.profile, f.record, area => {
  if (area === areas[4]) { for (let index = 0; index <= 4; index++) publishConstructedActFiveWave(index); throw stop; }
  publish(area);
 }, f.actions, 'main-quests')).toThrow(stop);
 const prefix = f.actions.entries.slice(f.act5Start), actions = next(f), entered: string[] = [];
 expect(prefix).toHaveLength(18);
 resumeActFiveMain(f.profile, f.record, area => { entered.push(area); publish(area); }, actions, prefix);
 expect(entered).toEqual([areas[4]]); expect(actions.entries).toHaveLength(1);
 expect(() => { assertActFiveComplete([...prefix, ...actions.entries], 'main-quests'); }).not.toThrow();
});

it.each(['order', 'failed', 'items', 'receipts', 'progress', 'future-clear', 'access', 'custody'] as const)(
 'rejects %s corruption before any preparation or new action', fault => {
  const f = partial(13), prefix = structuredClone(f.prefix), actions = next(f), map = useMapStore.getState();
  if (fault === 'order') prefix.reverse();
  if (fault === 'failed') { const first = prefix[0]; assert.ok(first); Object.assign(first, { result: 'refused' }); }
  if (fault === 'items') { const item = useInventoryStore.getState().questItems[POTION_SOURCE]; assert.ok(item);
   useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [POTION_SOURCE]: { ...item, state: 'owned' } } })); }
  if (fault === 'receipts') useMapStore.setState({ questReceipts: { ...map.questReceipts, invalid: true } });
  if (fault === 'progress') useMapStore.setState({ questProgress: {} });
  if (fault === 'future-clear') map.markCleared('areas/act5-throne-of-destruction');
  if (fault === 'access') vi.spyOn(map, 'isActUnlocked').mockReturnValue(false);
  if (fault === 'custody') { const first = prefix[0]; assert.ok(first); actions.entries.push(first); }
  const before = observeEarnedState(), count = actions.entries.length;
  expect(() => resumeActFiveMain(f.profile, () => { throw new Error('Unexpected preparation'); },
   () => { throw new Error('Unexpected admission'); }, actions, prefix)).toThrow(/prefix|history|item|receipt|progress|clear|access|custody/i);
  expect(observeEarnedState()).toEqual(before); expect(actions.entries).toHaveLength(count);
 });
