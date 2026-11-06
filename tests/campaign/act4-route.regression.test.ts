/** Constructed encounter prerequisites test native actions; none is earned combat proof. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { xpTotal } from '@/engine/progression/xp';
import type { CampaignWave } from './policy';
import { createActFourAreaPreparation, enterPreparedActFourArea, auditActFourAreaPreparation } from './act4-area-preparation';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import * as build from './actions';
import { constructActFourPrefix } from './act4-fixture';
import { assertActThreeComplete } from './act3-route';
import type { CampaignQuestEntry } from './quest-actions';
import { CampaignStop } from './route';
import { actFourActionOrder, assertActFourComplete, assertFreshActThreePrefix, runActFour } from './act4-route';

const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const plains = 'areas/act4-plains-of-despair', river = 'areas/act4-river-of-flame', chaos = 'areas/act4-chaos-sanctuary';
const areas = [plains, river, chaos] as const;
const hammer = `${forge}#objective:obj-kill-hephasto`, stone = 'quests/act3-guardian#reward:questItem';
const shatter = `${forge}#action:shatter-soulstone`;
const seals = ['objects/diablo_seal_1', 'objects/diablo_seal_2', 'objects/diablo_seal_3'] as const;
const proofs = [`${fallen}#action:izual-victory`, `${forge}#action:hephasto-victory`, `${terror}#action:diablo-victory`];
const order = [['start', fallen], ['start', forge], ['start', terror], ['claim', fallen],
  ['visit', river], ['recover', hammer], ['execute', shatter], ['claim', forge], ['visit', chaos],
  ...seals.map(id => ['interact', id] as const), ['claim', terror]] as const;
let restores: (() => void)[];

beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function completed() {
  const current = constructActFourPrefix();
  assertFreshActThreePrefix(current.initial, current.prefixClaims, current.act2Entries, current.act3Entries);
  runActFour(current.profile, current.record, area => { current.enter(4, area); }, current.actions);
  return { ...current, suffix: current.actions.entries.slice(current.act4Start) };
}

describe('fixed Act IV suffix with constructed native prerequisites', () => {
  it('uses three admissions, thirteen native actions and seven grow/equip boundaries after copied21/32 prefixes', () => {
    const current = constructActFourPrefix(), trace: string[] = [], entered: string[] = [];
    const prefix = current.actions.entries.slice(), beforeItems = structuredClone(useInventoryStore.getState().questItems);
    const beforeRewards = current.rewards.length;
    current.hook(row => { if (row.kind === 'quest-action') trace.push(`${String(row.action)}:${String(row.id)}`); });
    const grow = build.growCampaignBuild, equip = build.equipCampaignGear;
    const growth = vi.spyOn(build, 'growCampaignBuild').mockImplementation((profile, record) => {
      expect(profile).toBe(current.profile); trace.push('grow'); grow(profile, record);
    });
    const gear = vi.spyOn(build, 'equipCampaignGear').mockImplementation((record, profile) => {
      expect(profile).toBe(current.profile); trace.push('gear'); equip(record, profile);
    });
    const visit = vi.spyOn(current.actions, 'visit');
    assertFreshActThreePrefix(current.initial, current.prefixClaims, current.act2Entries, current.act3Entries);
    runActFour(current.profile, current.record, (area, phase) => {
      expect(phase).toBe('route'); entered.push(area); trace.push(`enter:${area}`);
      if (area === plains) {
        for (const id of [fallen, forge, terror]) expect(useMapStore.getState().questProgress[id])
          .toMatchObject({ status: 'inProgress' });
      }
      if (area === chaos) expect(useMapStore.getState().questProgress[terror]).toMatchObject({
        status: 'inProgress', objectives: { 'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true,
          'obj-kill-diablo': false } });
      current.enter(4, area);
    }, current.actions);
    expect(entered).toEqual(areas); expect(actFourActionOrder).toEqual(order);
    expect(current.act3Start).toBe(21); expect(current.act4Start).toBe(32);
    expect(current.actions.entries).toHaveLength(45);
    expect(current.actions.entries.slice(0, 32)).toEqual(prefix);
    expect(current.actions.entries.slice(32).map(row => [row.action, row.id])).toEqual(order);
    expect(growth).toHaveBeenCalledTimes(7); expect(gear).toHaveBeenCalledTimes(7);
    expect(visit.mock.calls).toEqual([[river, 4], [chaos, 4]]);
    expect(trace).toEqual(['grow', 'gear', `start:${fallen}`, `start:${forge}`, `start:${terror}`,
      `enter:${plains}`, 'grow', 'gear', `claim:${fallen}`, 'grow', 'gear',
      `enter:${river}`, 'grow', 'gear', `visit:${river}`, `recover:${hammer}`, `execute:${shatter}`,
      `claim:${forge}`, 'grow', 'gear', `visit:${chaos}`, ...seals.map(id => `interact:${id}`),
      `enter:${chaos}`, 'grow', 'gear', `claim:${terror}`, 'grow', 'gear']);
    const rewards = current.rewards.slice(beforeRewards);
    expect(rewards.map(delta => delta.xp)).toEqual([9000, 7000, 25000]);
    const mercXp = current.actions.entries.slice(current.act4Start)
      .filter(row => row.action === 'claim')
      .map(row => {
        assert.ok(row.delta);
        return Object.values(row.delta.mercXp).reduce((sum, xp) => sum + xp, 0);
      });
    expect(mercXp).toEqual([6750, 5250, 18750]);
    expect(rewards[1]?.currencies['gem-shard']).toBe(3);
    expect(useInventoryStore.getState().questItems).toEqual({ ...beforeItems,
      [stone]: { itemId: 'items/soulstone_mephisto', state: 'consumed' },
      [hammer]: { itemId: 'quest/hellforge_hammer', state: 'consumed' } });
    expect(Object.keys(useMapStore.getState().questReceipts)).toHaveLength(6);
    expect(usePlayerStore.getState().player?.id).toBe(current.initial.player.id);
    expect(() => { assertActFourComplete(current.actions.entries.slice(32)); }).not.toThrow();
    // The strict Act III entry predicate must continue to reject the later consumed Stone.
    expect(() => { assertActThreeComplete(current.act3Entries); }).toThrow();
  });

  it.each(areas)('propagates the first constructed nonwin at %s without later actions', stop => {
    const current = constructActFourPrefix(), entered: string[] = [];
    const failure = new CampaignStop('nonwin', `Constructed ${stop} draw`);
    let atStop: ReturnType<typeof observeEarnedState> | undefined, lengthAtStop = 0;
    expect(() => { runActFour(current.profile, current.record, area => {
      entered.push(area);
      if (area === stop) {
        atStop = observeEarnedState(); lengthAtStop = current.actions.entries.length; throw failure;
      }
      current.enter(4, area);
    }, current.actions); }).toThrow(failure);
    expect(entered).toEqual(areas.slice(0, areas.indexOf(stop) + 1));
    expect(observeEarnedState()).toEqual(atStop); expect(current.actions.entries).toHaveLength(lengthAtStop);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(stop);
    expect(useInventoryStore.getState().questItems[stone]?.state).toBe(stop === chaos ? 'consumed' : 'owned');
    expect(useMapStore.getState().questProgress[terror]?.rewardClaimed).not.toBe(true);
    expect(() => { assertActFourComplete(current.actions.entries.slice(32)); }).toThrow();
  });

  it.each([['recover', hammer], ['execute', shatter], ['claim', fallen], ['claim', forge], ['claim', terror]] as const)(
    'retains native %s %s before recorder failure without continuation', (action, id) => {
      const current = constructActFourPrefix(), entered: string[] = [], failure = new Error(`Constructed recorder ${id}`);
      current.hook(row => { if (row.kind === 'quest-action' && row.action === action && row.id === id) throw failure; });
      expect(() => { runActFour(current.profile, current.record, area => {
        entered.push(area); current.enter(4, area);
      }, current.actions); }).toThrow(failure);
      expect(current.actions.entries.at(-1)).toMatchObject({ action, id, result: 'ok' });
      expect(entered).toEqual(id === fallen ? [plains] : id === terror ? areas : [plains, river]);
      const items = useInventoryStore.getState().questItems;
      expect(items[stone]?.state).toBe(action === 'recover' || id === fallen ? 'owned' : 'consumed');
      if (action === 'recover') expect(items[hammer]?.state).toBe('owned');
      if (action === 'execute') expect(useMapStore.getState().questReceipts[shatter]).toBe(true);
      if (action === 'claim') expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    });
});

describe('maintained Chaos preparation', () => {
  it('prepares after all seals and retains the returned policy through Claim', () => {
    const current = constructActFourPrefix(), prepared = { ...current.profile, priority: ['sorceress.ice_blast'] };
    let ready = false;
    const grow = build.growCampaignBuild;
    const growth = vi.spyOn(build, 'growCampaignBuild').mockImplementation((profile, record) => {
      expect(profile).toBe(ready ? prepared : current.profile); grow(profile, record);
    });
    const result = runActFour(current.profile, current.record, area => {
      expect(ready).toBe(area === chaos); current.enter(4, area);
    }, current.actions, profile => {
      expect(profile).toBe(current.profile);
      expect(useMapStore.getState().questProgress[terror]?.objectives).toMatchObject({
        'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true, 'obj-kill-diablo': false });
      ready = true; return prepared;
    });
    expect(result).toBe(prepared); expect(growth).toHaveBeenCalledTimes(7);
    expect(usePlayerStore.getState().player?.comboOrder).toEqual(prepared.priority);
    expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
  });

  it('stops before Chaos admission and Terror Claim when preparation fails', () => {
    const current = constructActFourPrefix(), entered: string[] = [];
    expect(() => runActFour(current.profile, current.record, area => {
      entered.push(area); current.enter(4, area);
    }, current.actions, () => { throw new Error('Chaos preparation failed'); })).toThrow('Chaos preparation failed');
    expect(entered).toEqual([plains, river]);
    expect(current.actions.entries.at(-1)).toMatchObject({ action: 'interact', id: seals[2] });
    expect(useMapStore.getState().questProgress[terror]?.rewardClaimed).not.toBe(true);
  });
});

describe('fresh Act III prefix predicate', () => {
  it('accepts native copied21/32 boundaries before any Act IV state', () => {
    const current = constructActFourPrefix();
    expect(() => { assertFreshActThreePrefix(current.initial, current.prefixClaims,
      current.act2Entries, current.act3Entries); }).not.toThrow();
  });
  it.each(['id', 'class', 'name'] as const)('rejects replaced hero %s despite prefix flags', field => {
    const current = constructActFourPrefix(), player = usePlayerStore.getState().player; assert.ok(player);
    usePlayerStore.setState({ player: { ...player, [field]: 'replaced' } });
    expect(() => { assertFreshActThreePrefix(current.initial, current.prefixClaims,
      current.act2Entries, current.act3Entries); }).toThrow();
  });
  it('requires actual Act I Claim and exact separate Act II/III ledgers', () => {
    const current = constructActFourPrefix();
    for (const [claims, act2, act3] of [[[], current.act2Entries, current.act3Entries],
      [current.prefixClaims, current.act2Entries.slice(1), current.act3Entries],
      [current.prefixClaims, current.act2Entries, current.actions.entries],
      [current.prefixClaims, current.act2Entries, current.act3Entries.slice(1)]] as const)
      expect(() => { assertFreshActThreePrefix(current.initial, claims, act2, act3); }).toThrow();
  });
  it.each(['quest', 'source', 'receipt', 'clear'] as const)('rejects premature Act IV %s', fault => {
    const current = constructActFourPrefix(), map = useMapStore.getState();
    if (fault === 'quest') map.updateQuestProgress(fallen, { status: 'inProgress', objectives: { 'obj-kill-izual': false } });
    if (fault === 'source') useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
      [hammer]: { itemId: 'quest/hellforge_hammer', state: 'owned' } } }));
    if (fault === 'receipt') useMapStore.setState({ questReceipts: { ...map.questReceipts, [proofs[0] ?? '']: true } });
    if (fault === 'clear') map.markCleared(plains);
    expect(() => { assertFreshActThreePrefix(current.initial, current.prefixClaims,
      current.act2Entries, current.act3Entries); }).toThrow();
  });
});

describe('Act IV terminal predicate', () => {
  it('requires exact successful suffix actions without omitted, duplicated, reordered or prefix rows', () => {
    const current = completed(), first = current.suffix[0], second = current.suffix[1]; assert.ok(first && second);
    const swapped = current.suffix.slice(); [swapped[0], swapped[1]] = [second, first];
    const refused: CampaignQuestEntry[] = current.suffix.map((row, index) => index === 5 ? { ...row, result: 'not-eligible' } : row);
    for (const rows of [current.actions.entries, current.suffix.slice(1), [...current.suffix, first], swapped, refused])
      expect(() => { assertActFourComplete(rows); }).toThrow();
  });
  it.each([fallen, forge, terror])('requires own canonical completed, exact true-objective and claimed row for %s', id => {
    const current = completed(), original = useMapStore.getState().questProgress[id]; assert.ok(original);
    for (const change of [{ rewardClaimed: false }, { status: 'inProgress' as const }, { id: 'wrong-row' },
      { objectives: Object.fromEntries(Object.keys(original.objectives).map(key => [key, false])) }]) {
      useMapStore.getState().updateQuestProgress(id, { ...original, ...change });
      expect(() => { assertActFourComplete(current.suffix); }).toThrow();
    }
  });
  it('requires every one of twelve retained sources with exact item/state and no extra source', () => {
    const current = completed(), items = useInventoryStore.getState().questItems;
    expect(Object.keys(items)).toHaveLength(12);
    for (const [source, original] of Object.entries(items)) {
      const missing = { ...items }; Reflect.deleteProperty(missing, source);
      for (const questItems of [missing, { ...items, [source]: { ...original, itemId: 'wrong-item' } },
        { ...items, [source]: { ...original, state: original.state === 'owned' ? 'consumed' as const : 'owned' as const } }]) {
        useInventoryStore.setState({ questItems }); expect(() => { assertActFourComplete(current.suffix); }).toThrow();
      }
    }
    useInventoryStore.setState({ questItems: { ...items, [`${forge}#objective:extra`]: {
      itemId: 'quest/hellforge_hammer', state: 'consumed' } } });
    expect(() => { assertActFourComplete(current.suffix); }).toThrow();
  });
  it('requires all six own true receipts and rejects extras', () => {
    const current = completed(), receipts = useMapStore.getState().questReceipts;
    expect(Object.keys(receipts)).toHaveLength(6);
    for (const source of Object.keys(receipts)) {
      const missing = { ...receipts }; Reflect.deleteProperty(missing, source);
      useMapStore.setState({ questReceipts: missing }); expect(() => { assertActFourComplete(current.suffix); }).toThrow();
      const falseReceipt = { ...receipts }; Reflect.set(falseReceipt, source, false);
      useMapStore.setState({ questReceipts: falseReceipt }); expect(() => { assertActFourComplete(current.suffix); }).toThrow();
    }
    useMapStore.setState({ questReceipts: { ...receipts, [`${forge}#action:extra`]: true } });
    expect(() => { assertActFourComplete(current.suffix); }).toThrow();
  });
  it.each(areas)('requires actual canonical clear %s beyond Act V access', area => {
    const current = completed();
    useMapStore.setState(state => ({ clearedSubAreas: state.clearedSubAreas.filter(id => id !== area) }));
    expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
    expect(() => { assertActFourComplete(current.suffix); }).toThrow();
  });
});


it('integrates challenge preparation with all thirteen native Act IV quest actions', () => {
  const current = constructActFourPrefix('necromancer-bone-intended-v1');
  usePlayerStore.getState().gainExperience(xpTotal(47));
  useMapStore.getState().markCleared('areas/act1-dark-wood');
  const state = createActFourAreaPreparation(), waves: CampaignWave[] = [];
  runActFour(current.profile, current.record, area => {
    enterPreparedActFourArea(current.profile, current.record, (act, source, phase) => {
      const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
      useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
      const xp = phase === 'farm' ? 5_000_000 : 1000;
      usePlayerStore.getState().gainExperience(xp);
      if (phase === 'route') current.enter(act, source);
      else map.setCurrentLocation(act, source);
      waves.push({ phase, area: source, ordinal, index: 0, outcome: 'victory', advance: 'victory',
        logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    }, state, area, waves);
  }, current.actions);
  expect(current.actions.entries.slice(current.act4Start).map(row => [row.action, row.id])).toEqual(order);
  expect(auditActFourAreaPreparation(state, waves)).toMatchObject({ completed: true, routeAreas: 3 });
  expect(useInventoryStore.getState().questItems[stone]?.state).toBe('consumed');
  expect(useInventoryStore.getState().questItems[hammer]?.state).toBe('consumed');
  expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
});
