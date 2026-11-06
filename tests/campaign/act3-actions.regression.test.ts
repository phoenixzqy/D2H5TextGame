/** Constructed native action fixtures, never earned Act III reachability or balance evidence.
 * Council/Guardian provenance matrices remain in the production admission suites. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercPool } from '@/data/loaders/mercs';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import * as lootAward from '@/engine/loot/award';
import * as nativeActions from '@/features/quests/questActions';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import * as persistence from '@/stores/persistence';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  WaveGuardError } from '@/stores/waveTransitionGuard';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, observeStore,
  resetEarnedStores } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import { createCampaignQuestActions, type CampaignQuestAction } from './quest-actions';

const khalim = 'quests/act3-khalims-will';
const guardian = 'quests/act3-guardian';
const staffQuest = 'quests/act2-horadric-staff';
const cube = `${staffQuest}#objective:obj-cube`;
const will = `${khalim}#objective:obj-transmute`;
const council = `${khalim}#action:council-victory`;
const orb = `${guardian}#action:break-compelling-orb`;
const soulstone = `${guardian}#reward:questItem`;
const travincal = 'areas/act3-travincal';
const dryHills = 'areas/act2-dry-hills';
const parts = [
  ['obj-brain', 'quest/khalims_brain', 'areas/act3-great-marsh'],
  ['obj-heart', 'quest/khalims_heart', 'areas/act3-flayer-jungle'],
  ['obj-eye', 'quest/khalims_eye', 'areas/act3-kurast-bazaar'],
  ['obj-flail', 'quest/khalims_flail', travincal]
] as const;
type QuestActions = ReturnType<typeof createCampaignQuestActions>;
let restores: (() => void)[];
let pity: number;
let ownsRun = false;

beforeEach(() => {
  assert.equal(hasActiveSubAreaRun(), false);
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  resetEarnedStores(); setIdleEliteMisses(0); useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act3 adapters', 'sorceress').ok).toBe(true);
  const merc = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  // Constructed access only; these tests do not earn either earlier-act prefix.
  useMapStore.setState({ currentAct: 2, currentSubAreaId: dryHills,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
});

afterEach(() => {
  if (ownsRun) { abortSubAreaRun(); ownsRun = false; }
  vi.restoreAllMocks(); setIdleEliteMisses(pity);
  for (const restore of restores) restore();
});

function hero() {
  const player = usePlayerStore.getState().player; assert.ok(player); return player;
}

function observed() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore) };
}

function fixture(record: CampaignRecord = () => undefined) {
  const rewards: { action: CampaignQuestAction; delta: CampaignReward }[] = [];
  const actions = createCampaignQuestActions(record, (delta, action) => { rewards.push({ action, delta }); });
  return { actions, rewards };
}

function last(actions: QuestActions) {
  const entry = actions.entries.at(-1); assert.ok(entry); return entry;
}

function refused(actions: QuestActions, action: CampaignQuestAction, id: string,
  attempt: () => void, result: string) {
  const before = observed(), count = actions.entries.length;
  expect(attempt).toThrow(); expect(observed()).toEqual(before);
  expect(actions.entries).toHaveLength(count + 1);
  expect(last(actions)).toMatchObject({ action, id, result,
    before: { items: before.inventory.questItems, receipts: before.map.questReceipts,
      progress: before.map.questProgress, currentAct: before.map.currentAct,
      currentSubAreaId: before.map.currentSubAreaId },
    after: { items: before.inventory.questItems, receipts: before.map.questReceipts,
      progress: before.map.questProgress, currentAct: before.map.currentAct,
      currentSubAreaId: before.map.currentSubAreaId } });
}

function tracked(actions: QuestActions) {
  actions.start(staffQuest); actions.visit(dryHills); actions.recover(cube);
  actions.start(khalim); actions.start(guardian);
}

function recoveredParts(actions: QuestActions) {
  tracked(actions);
  // Constructed retained Council receipt isolates adapters. The separate smoke below earns one
  // native receipt; production council-admission/guardian-admission suites own provenance faults.
  useMapStore.setState({ questReceipts: { [council]: true } });
  for (const [objective, _item, area] of parts) {
    useMapStore.getState().markCleared(area);
    useMapStore.getState().setCurrentLocation(3, area);
    actions.recover(`${khalim}#objective:${objective}`);
  }
}

function assembledWill(actions: QuestActions) {
  recoveredParts(actions); actions.assemble(will);
}

function guardianReadyToClaim(actions: QuestActions) {
  assembledWill(actions); actions.claim(khalim); actions.visit(travincal, 3); actions.execute(orb);
  // Constructed completed prerequisite, not qualified Mephisto combat evidence.
  // The production guardian-admission matrix independently owns completion authority.
  useMapStore.getState().updateQuestProgress(guardian,
    { status: 'completed', objectives: { 'obj-kill-mephisto': true } });
}

function expectXpGrant(before: ReturnType<typeof hero>, xp: number) {
  const growth = awardXp(xpTotal(before.level) + before.experience, xp);
  expect(xpTotal(hero().level) + hero().experience).toBe(growth.totalXp);
  expect(hero().skillPoints).toBe(before.skillPoints + growth.skillPointsGranted);
  expect(hero().statPoints).toBe(before.statPoints + growth.statPointsGranted);
  expect(hero().skillLevels).toEqual(before.skillLevels); expect(hero().coreStats).toEqual(before.coreStats);
}

function settleConstructedCouncil() {
  usePlayerStore.getState().setPlayer({ ...hero(), comboOrder: [] });
  // Disclosed imported power makes this a wiring test, not earned gear, viability or throughput.
  const gear = { id: 'act3-constructed-cap', baseId: 'items/base/helm-cap', socketCapacity: 0,
    rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const run = startSubAreaRun({ act: 3, subAreaId: travincal, runSeed: 7, challengeOrdinal: 0 });
  ownsRun = true; assert.ok(run);
  for (let wave = 1; wave <= run.totalWaves; wave++) {
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    expect(advanceWaveOrFinish()).toBe(wave === run.totalWaves ? 'victory' : 'next-wave');
  }
  useCombatStore.getState().endCombat();
}

describe('constructed native Act III campaign actions', () => {
  it('Starts false objectives and uses explicit Act III visits while retaining the Act II default', () => {
    const { actions, rewards } = fixture(), before = observed();
    actions.start(khalim); actions.start(guardian);
    expect(useMapStore.getState().questProgress[khalim]).toEqual({ id: khalim, status: 'inProgress',
      objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } });
    expect(useMapStore.getState().questProgress[guardian]).toEqual({ id: guardian, status: 'inProgress',
      objectives: { 'obj-kill-mephisto': false } });
    actions.visit(travincal, 3);
    expect(useMapStore.getState()).toMatchObject({ currentAct: 3, currentSubAreaId: travincal });
    actions.visit(dryHills);
    expect(useMapStore.getState()).toMatchObject({ currentAct: 2, currentSubAreaId: dryHills });
    expect(observed().player).toEqual(before.player); expect(observed().inventory).toEqual(before.inventory);
    expect(observed().merc).toEqual(before.merc); expect(observed().combat).toEqual(before.combat);
    expect(useMapStore.getState().questReceipts).toEqual({}); expect(rewards).toEqual([]);
  });

  it.each(parts)('recovers %s only after its constructed source clear', (objective, itemId, area) => {
    const { actions, rewards } = fixture(); tracked(actions);
    useMapStore.setState({ questReceipts: { [council]: true } });
    actions.visit(area, 3);
    const source = `${khalim}#objective:${objective}`;
    refused(actions, 'recover', source, () => { actions.recover(source); }, 'not-eligible');
    useMapStore.getState().markCleared(area);
    const before = observeEarnedState(); actions.recover(source);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'owned' });
    expect(useMapStore.getState().questProgress[khalim]?.objectives[objective]).toBe(true);
    expect(earnedDelta(before, observeEarnedState())).toEqual(earnedDelta(before, before));
    refused(actions, 'recover', source, () => { actions.recover(source); }, 'already-owned');
    expect(rewards).toEqual([]);
  });

  it('requires native constructed Council proof for Flail instead of accepting flags and a clear', () => {
    const { actions, rewards } = fixture(); tracked(actions);
    useMapStore.getState().markCleared(travincal);
    const progress = useMapStore.getState().questProgress[khalim]; assert.ok(progress);
    // updateQuestProgress replaces objectives; preserve the complete tracked row for native eligibility.
    useMapStore.getState().updateQuestProgress(khalim,
      { objectives: { ...progress.objectives, 'obj-flail': true } });
    actions.visit(travincal, 3);
    const flail = `${khalim}#objective:obj-flail`;
    refused(actions, 'recover', flail, () => { actions.recover(flail); }, 'not-eligible');
    expect(useMapStore.getState().questReceipts).toEqual({});
    settleConstructedCouncil();
    expect(useMapStore.getState().questReceipts).toEqual({ [council]: true });
    const before = observeEarnedState(); actions.recover(flail);
    expect(useInventoryStore.getState().questItems[flail]).toEqual({ itemId: 'quest/khalims_flail', state: 'owned' });
    expect(earnedDelta(before, observeEarnedState())).toEqual(earnedDelta(before, before));
    expect(rewards).toEqual([]);
  });

  it('assembles exact recovered components, retains the original Cube and pays Khalim XP8000 once', () => {
    const { actions, rewards } = fixture(); recoveredParts(actions);
    const before = observed(); actions.assemble(will);
    const ledger = { [cube]: { itemId: 'quest/horadric_cube', state: 'owned' },
      ...Object.fromEntries(parts.map(([objective, itemId]) =>
        [`${khalim}#objective:${objective}`, { itemId, state: 'consumed' }])),
      [will]: { itemId: 'items/khalims_will', state: 'owned' } };
    expect(useInventoryStore.getState().questItems).toEqual(ledger);
    expect(useMapStore.getState().questReceipts).toEqual(before.map.questReceipts);
    expect(useMapStore.getState().questProgress[khalim]).toMatchObject({ status: 'completed' });
    expect(earnedDelta(before, observeEarnedState())).toEqual(earnedDelta(before, before));
    const player = structuredClone(hero()); actions.claim(khalim); expectXpGrant(player, 8000);
    const mercId = useMercStore.getState().fieldedMercId; assert.ok(mercId);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 8000,
      mercXp: { [mercId]: 6000 }, addedItems: [], removedItemIds: [], materials: {} } });
    expect(useInventoryStore.getState().questItems).toEqual(ledger);
    refused(actions, 'claim', khalim, () => { actions.claim(khalim); }, 'already-claimed');
    refused(actions, 'assemble', will, () => { actions.assemble(will); }, 'already-owned');
    expect(rewards).toHaveLength(1);
  });

  it.each([cube, ...parts.map(([objective]) => `${khalim}#objective:${objective}`)])(
    'refuses assembly without actual input %s despite true objectives', missing => {
      const { actions, rewards } = fixture(); recoveredParts(actions);
      const questItems = { ...useInventoryStore.getState().questItems }; Reflect.deleteProperty(questItems, missing);
      useInventoryStore.setState({ questItems });
      refused(actions, 'assemble', will, () => { actions.assemble(will); }, 'not-eligible');
      expect(useInventoryStore.getState().questItems[will]).toBeUndefined(); expect(rewards).toEqual([]);
    });

  it('requires a canonical Visit after the displayed alias, then consumes only Will and adds only Orb proof', () => {
    const { actions, rewards } = fixture(); assembledWill(actions); actions.claim(khalim);
    useMapStore.getState().setCurrentLocation(3, 'a3-travincal');
    refused(actions, 'execute', orb, () => { actions.execute(orb); }, 'not-eligible');
    const beforeVisit = observed(); actions.visit(travincal, 3);
    expect(observed()).toEqual({ ...beforeVisit, map: { ...beforeVisit.map, currentSubAreaId: travincal } });
    expect(nativeActions.questActionStatus(orb)).toBe('ready');
    const before = observed(); actions.execute(orb);
    expect(observed()).toEqual({ ...before,
      inventory: { ...before.inventory, questItems: { ...before.inventory.questItems,
        [will]: { itemId: 'items/khalims_will', state: 'consumed' } } },
      map: { ...before.map, questReceipts: { ...before.map.questReceipts, [orb]: true } } });
    expect(useMapStore.getState().questProgress[guardian]).toEqual(before.map.questProgress[guardian]);
    expect(last(actions)).toMatchObject({ action: 'execute', id: orb, result: 'ok',
      before: { items: before.inventory.questItems, receipts: { [council]: true } },
      after: { items: { [will]: { state: 'consumed' } }, receipts: { [council]: true, [orb]: true } } });
    expect(earnedDelta(before, observeEarnedState())).toEqual(earnedDelta(before, before));
    expect(rewards).toHaveLength(1);
    refused(actions, 'execute', orb, () => { actions.execute(orb); }, 'already-consumed');
  });

  it.each(['actions/act3-break-compelling-orb', 'objects/compelling_orb', `${khalim}#action:break-compelling-orb`])(
    'refuses nonreceipt source %s without consuming Will', source => {
      const { actions, rewards } = fixture(); assembledWill(actions); actions.visit(travincal, 3);
      refused(actions, 'execute', source, () => { actions.execute(source); }, 'not-eligible');
      expect(useInventoryStore.getState().questItems[will]?.state).toBe('owned'); expect(rewards).toEqual([]);
    });

  it('refuses bare completed Khalim flags and premature Guardian Claim without income', () => {
    const { actions, rewards } = fixture(); tracked(actions);
    useMapStore.getState().updateQuestProgress(khalim, { status: 'completed', objectives: {
      'obj-brain': true, 'obj-heart': true, 'obj-eye': true, 'obj-flail': true, 'obj-transmute': true } });
    refused(actions, 'claim', khalim, () => { actions.claim(khalim); }, 'not-completed');
    refused(actions, 'claim', guardian, () => { actions.claim(guardian); }, 'not-completed');
    expect(rewards).toEqual([]);
  });

  it('retains the native Guardian level47/five-pick cache, XP18000 and an owned Soulstone once', () => {
    const { actions, rewards } = fixture(); guardianReadyToClaim(actions);
    const player = structuredClone(hero()), ledger = structuredClone(useInventoryStore.getState().questItems);
    const roll = vi.spyOn(lootAward, 'rollQuestTableRewards');
    actions.claim(guardian); expectXpGrant(player, 18000);
    expect(roll).toHaveBeenCalledTimes(1);
    expect(roll.mock.calls[0]?.[0]).toEqual({ tableId: 'loot/mephisto-q', ilvl: 47, picks: 5 });
    const rolled = roll.mock.results[0]; assert.ok(rolled?.type === 'return' && rolled.value);
    const cache = rolled.value, reward = rewards.at(-1); assert.ok(reward);
    expect(reward.delta.xp).toBe(18000);
    const mercId = useMercStore.getState().fieldedMercId; assert.ok(mercId);
    expect(actions.entries.at(-1)?.delta?.mercXp).toEqual({ [mercId]: 13500 });
    expect(reward.delta.addedItems).toEqual(cache.items);
    expect(reward.delta.currencies['rune-shard'] ?? 0).toBe(cache.runeShards);
    expect(reward.delta.materials).toEqual(cache.materials); expect(reward.delta.removedItemIds).toEqual([]);
    expect(useInventoryStore.getState().questItems).toEqual({ ...ledger,
      [soulstone]: { itemId: 'items/soulstone_mephisto', state: 'owned' } });
    expect(useMapStore.getState().questReceipts).toEqual({ [council]: true, [orb]: true });
    refused(actions, 'claim', guardian, () => { actions.claim(guardian); }, 'already-claimed');
    refused(actions, 'read', soulstone, () => { actions.read(soulstone); }, 'unsupported-rewards');
    expect(useInventoryStore.getState().questItems[soulstone]?.state).toBe('owned');
    expect(rewards.map(rewardEntry => rewardEntry.delta.xp)).toEqual([8000, 18000]);
    expect(roll).toHaveBeenCalledTimes(1);
  });

  it.each(['receipt', 'item'] as const)('rejects an extra %s mutation after native Orb commit without erasing its entry', fault => {
    const { actions, rewards } = fixture(); assembledWill(actions); actions.visit(travincal, 3);
    const execute = nativeActions.executeQuestAction;
    vi.spyOn(nativeActions, 'executeQuestAction').mockImplementation(source => {
      const result = execute(source);
      if (result === 'ok') {
        if (fault === 'receipt') useMapStore.setState(state => ({ questReceipts: {
          ...state.questReceipts, [`${guardian}#action:unexpected`]: true } }));
        else useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
          [cube]: { itemId: 'quest/horadric_cube', state: 'consumed' } } }));
      }
      return result;
    });
    expect(() => { actions.execute(orb); }).toThrow();
    expect(last(actions)).toMatchObject({ action: 'execute', id: orb, result: 'ok',
      after: { items: { [will]: { state: 'consumed' } }, receipts: { [orb]: true } } });
    expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed'); expect(rewards).toEqual([]);
  });
});

describe('Act III adapter safety and retained native commits', () => {
  function attempts(actions: QuestActions) {
    return [['visit', travincal, () => { actions.visit(travincal, 3); }],
      ['execute', orb, () => { actions.execute(orb); }]] as const;
  }

  it.each(['idle', 'loading', 'error'] as const)('guards Visit/Execute during %s hydration', status => {
    const { actions, rewards } = fixture(); useHydrationStore.getState().setStatus(status);
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'not-ready');
    expect(rewards).toEqual([]);
  });

  it.each(['replacement', 'no-player', 'combat-active'] as const)('guards Visit/Execute during %s', guard => {
    const { actions, rewards } = fixture();
    if (guard === 'replacement') vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    if (guard === 'no-player') usePlayerStore.getState().reset();
    if (guard === 'combat-active') useCombatStore.setState({ inCombat: true });
    for (const [action, id, attempt] of attempts(actions)) {
      refused(actions, action, id, attempt, guard === 'replacement' ? 'not-ready' : guard);
      if (guard === 'no-player') expect(last(actions).delta).toBeNull();
    }
    expect(rewards).toEqual([]);
  });

  it('guards Visit/Execute during an actual active native run even with inCombat false', () => {
    const { actions, rewards } = fixture();
    const run = startSubAreaRun({ act: 3, subAreaId: travincal, runSeed: 7, challengeOrdinal: 0 });
    ownsRun = true; assert.ok(run); useCombatStore.setState({ inCombat: false });
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'combat-active');
    expect(rewards).toEqual([]);
  });

  it('refuses mismatched/default-act and locked explicit Act III visits', () => {
    const { actions, rewards } = fixture();
    refused(actions, 'visit', travincal, () => { actions.visit(travincal); }, 'unknown-area');
    refused(actions, 'visit', dryHills, () => { actions.visit(dryHills, 3); }, 'unknown-area');
    useMapStore.setState({ clearedSubAreas: [] });
    refused(actions, 'visit', travincal, () => { actions.visit(travincal, 3); }, 'locked-area');
    expect(rewards).toEqual([]);
  });

  it.each(['wave', 'restore'] as const)('retains typed %s refusal for both new adapter paths', kind => {
    const { actions, rewards } = fixture();
    const wave = kind === 'wave' ? beginWaveTransition(true) : null;
    const restore = kind === 'restore' ? reserveWaveRestore() : null;
    try {
      for (const [action, id, attempt] of attempts(actions)) {
        const before = observed(); let caught: unknown;
        try { attempt(); } catch (error) { caught = error; }
        expect(caught).toBeInstanceOf(WaveGuardError);
        expect(caught).toMatchObject({ code: kind === 'wave' ? 'waveBusy' : 'restorePending' });
        expect(observed()).toEqual(before); expect(last(actions)).toMatchObject({ action, id, result: 'threw' });
      }
      expect(rewards).toEqual([]);
    } finally { if (wave) endWaveTransition(wave); if (restore) releaseWaveRestore(restore); }
  });

  it.each(['execute', 'khalim-claim', 'guardian-claim'] as const)(
    'retains native %s graph/income before a recorder failure', trigger => {
      const setup = fixture();
      if (trigger === 'guardian-claim') guardianReadyToClaim(setup.actions);
      else { assembledWill(setup.actions); setup.actions.visit(travincal, 3); }
      const rewards: CampaignReward[] = [], order: string[] = [], failure = new Error('Constructed Act III recorder failure');
      const id = trigger === 'execute' ? orb : trigger === 'khalim-claim' ? khalim : guardian;
      const action = trigger === 'execute' ? 'execute' : 'claim';
      const logged = createCampaignQuestActions(entry => {
        // This fault targets post-commit recording; the earlier checkpoint must succeed.
        if (entry.kind === 'campaign-boss-checkpoint') {
          expect(trigger).toBe('guardian-claim');
          expect(entry).toMatchObject({ boundary: 'before-claim', questId: guardian });
          expect(useMapStore.getState().questProgress[guardian]?.rewardClaimed).not.toBe(true);
          return;
        }
        order.push('record'); expect(logged.entries).toHaveLength(1);
        expect(last(logged)).toMatchObject({ action, id, result: 'ok' });
        if (trigger === 'execute') expect(last(logged).after).toMatchObject({
          items: { [will]: { state: 'consumed' } }, receipts: { [council]: true, [orb]: true } });
        else expect(last(logged).after.progress[id]?.rewardClaimed).toBe(true);
        throw failure;
      }, delta => { order.push('reward'); rewards.push(delta); });
      expect(() => { if (trigger === 'execute') logged.execute(id); else logged.claim(id); }).toThrow(failure);
      expect(order).toEqual(trigger === 'execute' ? ['record'] : ['reward', 'record']);
      expect(rewards.map(delta => delta.xp)).toEqual(trigger === 'execute' ? [] : [trigger === 'khalim-claim' ? 8000 : 18000]);
      if (trigger === 'execute') {
        expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed');
        expect(useMapStore.getState().questReceipts).toEqual({ [council]: true, [orb]: true });
      } else {
        expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
        if (trigger === 'guardian-claim') expect(useInventoryStore.getState().questItems[soulstone])
          .toEqual({ itemId: 'items/soulstone_mephisto', state: 'owned' });
      }
    });
});
