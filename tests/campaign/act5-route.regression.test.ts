/** Disclosed constructed source publications test wiring; none is earned combat proof. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import * as build from './actions';
import { constructActFivePrefix, publishConstructedActFiveWave } from './act5-fixture';
import { assertActFourComplete } from './act4-route';
import type { CampaignQuestEntry } from './quest-actions';
import { CampaignStop } from './route';
import { actFiveActionOrder, assertActFiveComplete, assertFreshActFourPrefix, runActFive } from './act5-route';

const eve = 'quests/act5-eve-of-destruction', throne = 'areas/act5-throne-of-destruction';
const throneProof = `${eve}#action:throne-waves-victory`, baalProof = `${eve}#action:baal-victory`;
const title = 'titles/slayer_of_baal', nightmare = 'difficulty/nightmare';
const stone = 'quests/act3-guardian#reward:questItem';
const hammer = 'quests/act4-hellforge#objective:obj-kill-hephasto';
const order = [['start', eve], ['claim', eve]] as const;
let restores: (() => void)[];

beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function publishFullThrone() {
  for (let index = 0; index < 8; index++) publishConstructedActFiveWave(index);
}

/** Native Start/Claim around disclosed proof fixtures, independent of the route under test. */
function completed() {
  const current = constructActFivePrefix();
  current.actions.start(eve); publishFullThrone(); current.actions.claim(eve);
  return { ...current, suffix: current.actions.entries.slice(current.act5Start) };
}

function fresh(current: ReturnType<typeof constructActFivePrefix>) {
  assertFreshActFourPrefix(current.initial, current.prefixClaims, current.act2Entries,
    current.act3Entries, current.act4Entries);
}

/** Reset the same constructed baseline between independent corruptions. */
function rejectEach(cases: readonly (() => void)[], check: () => void) {
  const restore = captureEarnedRestorers();
  try {
    for (const mutate of cases) {
      mutate(); expect(check).toThrow();
      for (const reset of restore) reset();
    }
  } finally { for (const reset of restore) reset(); }
}

describe('minimum native Act V route with constructed source prerequisites', () => {
  it('uses one full admission, two actions and three grow/equip boundaries after copied21/32/45 prefixes', () => {
    const current = constructActFivePrefix(), trace: string[] = [], entered: string[] = [];
    const prefix = current.actions.entries.slice(), items = structuredClone(useInventoryStore.getState().questItems);
    current.hook(row => { if (row.kind === 'quest-action') trace.push(`${String(row.action)}:${String(row.id)}`); });
    const grow = build.growCampaignBuild, equip = build.equipCampaignGear;
    const growth = vi.spyOn(build, 'growCampaignBuild').mockImplementation((profile, record) => {
      expect(profile).toBe(current.profile); trace.push('grow'); grow(profile, record);
    });
    const gear = vi.spyOn(build, 'equipCampaignGear').mockImplementation((record, profile) => {
      expect(profile).toBe(current.profile); trace.push('gear'); equip(record, profile);
    });
    fresh(current);
    runActFive(current.profile, current.record, (area, phase) => {
      expect(phase).toBe('route'); entered.push(area); trace.push(`enter:${area}`);
      expect(useMapStore.getState().questProgress[eve]).toMatchObject({ status: 'inProgress',
        objectives: { 'obj-throne-waves': false, 'obj-kill-baal': false } });
      expect(useMapStore.getState().questTitles).toEqual({});
      publishFullThrone();
    }, current.actions);
    expect(entered).toEqual([throne]); expect(actFiveActionOrder).toEqual(order);
    expect([current.act3Start, current.act4Start, current.act5Start]).toEqual([21, 32, 45]);
    expect(current.actions.entries).toHaveLength(47);
    expect(current.actions.entries.slice(0, 45)).toEqual(prefix);
    expect(current.actions.entries.slice(45).map(row => [row.action, row.id])).toEqual(order);
    expect(growth).toHaveBeenCalledTimes(3); expect(gear).toHaveBeenCalledTimes(3);
    expect(trace).toEqual(['grow', 'gear', `start:${eve}`, `enter:${throne}`,
      'grow', 'gear', `claim:${eve}`, 'grow', 'gear']);
    const claim = current.actions.entries.at(-1); assert.ok(claim?.delta && claim.before.player && claim.after.player);
    expect(claim.delta.xp).toBe(40000);
    expect(Object.values(claim.delta.mercXp).reduce((sum, xp) => sum + xp, 0)).toBe(30000);
    const before = claim.before.player, after = claim.after.player;
    const xpGrowth = awardXp(xpTotal(before.level) + before.experience, 40000);
    expect(after.skillPoints - before.skillPoints).toBe(xpGrowth.skillPointsGranted);
    expect(after.statPoints - before.statPoints).toBe(xpGrowth.statPointsGranted);
    expect(useInventoryStore.getState().questItems).toEqual(items);
    expect(useMapStore.getState().questTitles).toEqual({ [title]: true });
    expect(useMapStore.getState().questDifficulties).toEqual({ [nightmare]: true });
    expect(useMapStore.getState().selectedTitle).toBeNull();
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(() => { assertActFiveComplete(current.actions.entries.slice(45)); }).not.toThrow();
    // The strict six-receipt predicate remains an Act V entry-only assertion.
    expect(() => { assertActFourComplete(current.act4Entries); }).toThrow();
  });

  it.each([0, 4, 5, 6, 7])('retains the first constructed nonwin at Throne index%i without Claim or continuation', stop => {
    const current = constructActFivePrefix(), failure = new CampaignStop('nonwin', `Constructed Throne ${String(stop)}`);
    let atStop: ReturnType<typeof observeEarnedState> | undefined;
    expect(() => { runActFive(current.profile, current.record, area => {
      expect(area).toBe(throne);
      for (let index = 0; index < stop; index++) publishConstructedActFiveWave(index);
      atStop = observeEarnedState(); throw failure;
    }, current.actions); }).toThrow(failure);
    expect(observeEarnedState()).toEqual(atStop);
    expect(current.actions.entries.slice(45).map(row => [row.action, row.id])).toEqual([['start', eve]]);
    expect(useMapStore.getState().questReceipts[throneProof]).toBe(stop > 4 ? true : undefined);
    expect(useMapStore.getState().questReceipts[baalProof]).toBeUndefined();
    expect(useMapStore.getState().questProgress[eve]?.rewardClaimed).not.toBe(true);
    expect(useMapStore.getState().questTitles).toEqual({});
  });

  it.each(['start', 'claim'] as const)('retains native %s before recorder failure without a later action', action => {
    const current = constructActFivePrefix(), failure = new Error(`Constructed recorder ${action}`), entered: string[] = [];
    current.hook(row => { if (row.kind === 'quest-action' && row.action === action && row.id === eve) throw failure; });
    expect(() => { runActFive(current.profile, current.record, area => {
      entered.push(area); publishFullThrone();
    }, current.actions); }).toThrow(failure);
    expect(current.actions.entries.at(-1)).toMatchObject({ action, id: eve, result: 'ok' });
    expect(entered).toEqual(action === 'start' ? [] : [throne]);
    expect(useMapStore.getState().questProgress[eve]?.rewardClaimed).toBe(action === 'claim' ? true : undefined);
    expect(useMapStore.getState().questTitles).toEqual(action === 'claim' ? { [title]: true } : {});
  });

  it('rejects a constructed clear that omits its Baal proof before attempting Claim', () => {
    const current = constructActFivePrefix();
    expect(() => { runActFive(current.profile, current.record, () => {
      for (let index = 0; index < 7; index++) publishConstructedActFiveWave(index);
      useMapStore.getState().markCleared(throne);
    }, current.actions); }).toThrow();
    expect(current.actions.entries.filter(row => row.action === 'claim' && row.id === eve)).toHaveLength(0);
    expect(useMapStore.getState().questTitles).toEqual({});
    expect(useMapStore.getState().questProgress[eve]?.rewardClaimed).not.toBe(true);
  });
});

describe('fresh Act IV prefix predicate', () => {
  it('accepts native copied21/32/45 boundaries and consumed Shatter inputs before any Act V state', () => {
    const current = constructActFivePrefix();
    expect(useInventoryStore.getState().questItems[stone]?.state).toBe('consumed');
    expect(useInventoryStore.getState().questItems[hammer]?.state).toBe('consumed');
    expect(() => { fresh(current); }).not.toThrow();
  });
  it('rejects replaced hero identity, class or name despite completed prefix flags', () => {
    const current = constructActFivePrefix(), player = usePlayerStore.getState().player; assert.ok(player);
    rejectEach((['id', 'class', 'name'] as const).map(field => () => {
      usePlayerStore.setState({ player: { ...player, [field]: 'replaced' } });
    }), () => { fresh(current); });
  });
  it('requires actual Act I Claim and exact separate21/11/13 successful action slices', () => {
    const current = constructActFivePrefix();
    const refused = current.act4Entries.map((row, index) => index === 0 ? { ...row, result: 'not-eligible' } : row);
    for (const [claims, act2, act3, act4] of [[[], current.act2Entries, current.act3Entries, current.act4Entries],
      [current.prefixClaims, current.act2Entries.slice(1), current.act3Entries, current.act4Entries],
      [current.prefixClaims, current.act2Entries, current.act3Entries.slice(1), current.act4Entries],
      [current.prefixClaims, current.act2Entries, current.act3Entries, current.act4Entries.slice(1)],
      [current.prefixClaims, current.act2Entries, current.act3Entries, current.actions.entries],
      [current.prefixClaims, current.act2Entries, current.act3Entries, refused]] as const)
      expect(() => { assertFreshActFourPrefix(current.initial, claims, act2, act3, act4); }).toThrow();
  });
  it('rejects missing prior claimed rows, inherited consumed sources, receipts or actual clears', () => {
    const current = constructActFivePrefix(), map = useMapStore.getState(), inv = useInventoryStore.getState();
    const ids = ['quests/act3-khalims-will', 'quests/act3-guardian', 'quests/act4-hellforge'];
    const cases: (() => void)[] = ids.map(id => () => {
      const progress = { ...map.questProgress }; Reflect.deleteProperty(progress, id);
      useMapStore.setState({ questProgress: progress });
    });
    for (const source of [stone, hammer]) cases.push(() => {
      const item = inv.questItems[source]; assert.ok(item);
      useInventoryStore.setState({ questItems: { ...inv.questItems, [source]: { ...item, state: 'owned' } } });
    });
    cases.push(() => { useMapStore.setState({ questReceipts: {} }); }, () => {
      useMapStore.setState({ clearedSubAreas: map.clearedSubAreas.filter(id => id !== 'areas/act4-chaos-sanctuary') });
    });
    rejectEach(cases, () => { fresh(current); });
  });
  it('rejects premature Act V rows, tools, receipts, aliases, title/unlock and replay/endgame activity', () => {
    const current = constructActFivePrefix(), map = useMapStore.getState();
    rejectEach([
      () => { map.updateQuestProgress(eve, { status: 'inProgress', objectives: { 'obj-throne-waves': false, 'obj-kill-baal': false } }); },
      () => { map.updateQuestProgress('quests/side-act5-anyas-gift', { status: 'completed', objectives: {} }); },
      () => { useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
        'quests/act5-prison-of-ice#action:receive-potion': { itemId: 'quest/malahs_potion', state: 'owned' } } })); },
      () => { useMapStore.setState({ questReceipts: { ...map.questReceipts, [throneProof]: true } }); },
      () => { map.markCleared(throne); },
      () => { useMapStore.setState({ clearedSubAreas: [...map.clearedSubAreas, 'a5-throne-of-destruction'] }); },
      () => { useMapStore.setState({ questTitles: { [title]: true } }); },
      () => { useMapStore.setState({ questDifficulties: { [nightmare]: true } }); },
      () => { useMapStore.setState({ selectedTitle: title }); },
      () => { useMapStore.setState({ selectedDifficulty: 'nightmare' }); },
      () => { useMapStore.setState({ nightmareClearedSubAreas: [throne] }); },
      () => { useMapStore.setState({ hellClearedSubAreas: [throne] }); },
      () => { useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, nightmare: 1 } }); },
      () => { useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, hell: 1 } }); },
      () => { useMapStore.setState({ endgame: { ...map.endgame, attemptOrdinal: 1 } }); }
    ], () => { fresh(current); });
  });
});

describe('Act V terminal predicate', () => {
  it('accepts exact source-backed native Claim and leaves unrelated Act V quests absent', () => {
    const current = completed();
    expect(Object.keys(useMapStore.getState().questReceipts)).toHaveLength(8);
    expect(Object.keys(useMapStore.getState().questProgress).filter(id => id.startsWith('quests/act5-'))).toEqual([eve]);
    expect(() => { assertActFiveComplete(current.suffix); }).not.toThrow();
  });
  it('requires exact successful suffix actions without omitted, duplicated, reordered or prefix rows', () => {
    const current = completed(), first = current.suffix[0], second = current.suffix[1]; assert.ok(first && second);
    const refused: CampaignQuestEntry[] = [first, { ...second, result: 'not-completed' }];
    for (const rows of [current.actions.entries, current.suffix.slice(1), [...current.suffix, first], [second, first], refused])
      expect(() => { assertActFiveComplete(rows); }).toThrow();
  });
  it('requires own canonical exact completed, true-objective and claimed Eve plus prior claimed rows', () => {
    const current = completed(), map = useMapStore.getState(), row = map.questProgress[eve]; assert.ok(row);
    const cases: (() => void)[] = [
      { rewardClaimed: false }, { status: 'inProgress' as const }, { id: 'wrong-row' },
      { objectives: { 'obj-throne-waves': true, 'obj-kill-baal': false } },
      { objectives: { 'obj-throne-waves': true, 'obj-kill-baal': true, extra: true } }
    ].map(change => () => { map.updateQuestProgress(eve, { ...row, ...change }); });
    for (const id of ['quests/act3-khalims-will', 'quests/act3-guardian', 'quests/act4-hellforge']) cases.push(() => {
      const original = map.questProgress[id]; assert.ok(original); map.updateQuestProgress(id, { ...original, rewardClaimed: false });
    });
    rejectEach(cases, () => { assertActFiveComplete(current.suffix); });
  });
  it('requires exact twelve inherited physical sources, including consumed Soulstone and Hammer', () => {
    const current = completed(), items = useInventoryStore.getState().questItems, cases: (() => void)[] = [];
    expect(Object.keys(items)).toHaveLength(12);
    for (const [source, original] of Object.entries(items)) {
      const missing = { ...items }; Reflect.deleteProperty(missing, source);
      for (const questItems of [missing, { ...items, [source]: { ...original, itemId: 'wrong-item' } },
        { ...items, [source]: { ...original, state: original.state === 'owned' ? 'consumed' as const : 'owned' as const } }])
        cases.push(() => { useInventoryStore.setState({ questItems }); });
    }
    cases.push(() => { useInventoryStore.setState({ questItems: { ...items,
      'quests/act5-prison-of-ice#action:receive-potion': { itemId: 'quest/malahs_potion', state: 'owned' } } }); });
    rejectEach(cases, () => { assertActFiveComplete(current.suffix); });
  });
  it('requires all eight own true receipts and rejects extras or optional Act V rows', () => {
    const current = completed(), receipts = useMapStore.getState().questReceipts, cases: (() => void)[] = [];
    for (const source of Object.keys(receipts)) {
      const missing = { ...receipts }; Reflect.deleteProperty(missing, source);
      const falseReceipt = { ...receipts }; Reflect.set(falseReceipt, source, false);
      cases.push(() => { useMapStore.setState({ questReceipts: missing }); },
        () => { useMapStore.setState({ questReceipts: falseReceipt }); });
    }
    cases.push(() => { useMapStore.setState({ questReceipts: { ...receipts, [`${eve}#action:extra`]: true } }); },
      () => { useMapStore.getState().updateQuestProgress('quests/act5-rite-of-passage', { status: 'completed',
        objectives: { 'obj-kill-ancients': true }, rewardClaimed: true }); });
    rejectEach(cases, () => { assertActFiveComplete(current.suffix); });
  });
  it('requires actual canonical Throne clear and exact native campaign ownership without replay/endgame activity', () => {
    const current = completed(), map = useMapStore.getState();
    rejectEach([
      () => { useMapStore.setState({ clearedSubAreas: map.clearedSubAreas.filter(id => id !== throne) }); },
      () => { useMapStore.setState({ clearedSubAreas: [...map.clearedSubAreas, 'areas/act5-ancients-way'] }); },
      () => { useMapStore.setState({ questTitles: {} }); },
      () => { useMapStore.setState({ questDifficulties: {} }); },
      () => { const titles = { ...map.questTitles }; Reflect.set(titles, title, false); useMapStore.setState({ questTitles: titles }); },
      () => { const difficulties = { ...map.questDifficulties }; Reflect.set(difficulties, 'difficulty/hell', true);
        useMapStore.setState({ questDifficulties: difficulties }); },
      () => { useMapStore.setState({ selectedTitle: title }); },
      () => { useMapStore.setState({ selectedDifficulty: 'nightmare' }); },
      () => { useMapStore.setState({ nightmareClearedSubAreas: [throne] }); },
      () => { useMapStore.setState({ hellClearedSubAreas: [throne] }); },
      () => { useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, nightmare: 1 } }); },
      () => { useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, hell: 1 } }); },
      () => { useMapStore.setState({ endgame: { ...map.endgame, attemptOrdinal: 1 } }); }
    ], () => { assertActFiveComplete(current.suffix); });
  });
});
