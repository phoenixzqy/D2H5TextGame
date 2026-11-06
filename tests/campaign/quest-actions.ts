import assert from 'node:assert/strict';
import { loadQuests } from '@/data/loaders/quests';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { travelToAreaObjects, recoverQuestTool, interactWithAreaObject,
  assembleQuestItem, insertQuestItem } from '@/features/quests/interactObject';
import { questActionPreflight } from '@/features/quests/questTransaction';
import { executeQuestAction } from '@/features/quests/questActions';
import { executeAct5QuestAction } from '@/features/quests/act5QuestActions';
import { READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { earnedDelta, observeEarnedState, type EarnedState } from '../sim/production/earned-state';
import { recordCampaignBossCheckpoint, startCampaignQuest } from './actions';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import { campaignState } from './campaign-state';

export type CampaignQuestAction = 'start' | 'claim' | 'visit' | 'recover' | 'interact' | 'assemble' | 'insert' | 'read' | 'execute' | 'act5';


/** Narrow retained quest/point observation; full transient states check native refusals. */
function questState(state: EarnedState) {
  const player = state.player.player;
  return { player: player ? { level: player.level, experience: player.experience,
    skillPoints: player.skillPoints, statPoints: player.statPoints,
    skillLevels: player.skillLevels ?? {}, coreStats: player.coreStats } : null,
    items: state.inventory.questItems, progress: state.map.questProgress, receipts: state.map.questReceipts,
    campaign: campaignState(state.map),
    currentAct: state.map.currentAct, currentSubAreaId: state.map.currentSubAreaId };
}
export interface CampaignQuestEntry {
  readonly action: CampaignQuestAction;
  readonly id: string;
  readonly result: string;
  readonly before: ReturnType<typeof questState>;
  readonly after: ReturnType<typeof questState>;
  readonly delta: ReturnType<typeof earnedDelta> | null;
  readonly error?: string;
}

function hasIncome(delta: ReturnType<typeof earnedDelta>) {
  return delta.xp !== 0 || delta.addedItems.length > 0 || delta.removedItemIds.length > 0 ||
    Object.values(delta.mercXp).some(value => value !== 0) ||
    Object.values(delta.materials).some(value => value !== 0) ||
    Object.values(delta.currencies).some(value => value !== 0);
}

/** Narrow authored numeric rewards before using the loader's unknown reward bag. */
export function campaignQuestRewards(id: string) {
  const rewards = loadQuests().find(quest => quest.id === id)?.rewards; assert.ok(rewards);
  const amount = (key: 'xp' | 'skillPoints' | 'statPoints') => {
    const value = rewards[key] === undefined ? 0 : rewards[key];
    assert.ok(typeof value === 'number' && Number.isSafeInteger(value) && value >= 0,
      `Invalid campaign quest reward: ${id}: ${key}`);
    return value;
  };
  return { xp: amount('xp'), skillPoints: amount('skillPoints'), statPoints: amount('statPoints') };
}

function assertNativeGrant(action: CampaignQuestAction, id: string, before: EarnedState, after: EarnedState) {
  const previous = before.player.player, next = after.player.player;
  assert.ok(previous && next);
  const orb = 'quests/act3-guardian#action:break-compelling-orb';
  const forge = 'quests/act4-hellforge', shatter = `${forge}#action:shatter-soulstone`;
  if (action === 'execute') assert.ok(id === orb || id === shatter, 'Unknown campaign execution');
  const receipts = action === 'execute' || action === 'act5'
    ? { ...before.map.questReceipts, [id]: true }
    : action === 'read' && id === SCROLL_SOURCE
      ? { ...before.map.questReceipts, [READ_PROOF]: true } : before.map.questReceipts;
  assert.deepEqual(after.map.questReceipts, receipts, 'Unexpected quest proof receipt');
  const campaign = campaignState(before.map);
  const expectedCampaign = action === 'claim' && id === 'quests/act5-eve-of-destruction'
    ? { ...campaign, questTitles: { ...campaign.questTitles, 'titles/slayer_of_baal': true },
      questDifficulties: { ...campaign.questDifficulties, 'difficulty/nightmare': true } } : campaign;
  assert.deepEqual(campaignState(after.map), expectedCampaign, 'Unexpected campaign ownership or replay change');
  if (action === 'claim') {
    const rewards = campaignQuestRewards(id);
    const growth = awardXp(xpTotal(previous.level) + previous.experience, rewards.xp);
    assert.equal(xpTotal(next.level) + next.experience, growth.totalXp, 'Quest XP grant');
    assert.equal(next.skillPoints, previous.skillPoints + growth.skillPointsGranted + rewards.skillPoints,
      'Quest XP-derived plus explicit skill points');
    assert.equal(next.statPoints, previous.statPoints + growth.statPointsGranted + rewards.statPoints,
      'Quest XP-derived plus explicit stat points');
    assert.deepEqual(next.skillLevels, previous.skillLevels);
    assert.deepEqual(next.coreStats, previous.coreStats);
    return;
  }
  assert.deepEqual(earnedDelta(before, after), earnedDelta(before, before), 'Non-Claim ordinary income');
  if (action === 'execute') {
    assert.equal(Object.hasOwn(before.map.questReceipts, id), false);
    const inputs = id === orb
      ? [['quests/act3-khalims-will#objective:obj-transmute', 'items/khalims_will']]
      : [[`${forge}#objective:obj-kill-hephasto`, 'quest/hellforge_hammer'],
        ['quests/act3-guardian#reward:questItem', 'items/soulstone_mephisto']];
    const items = { ...before.inventory.questItems };
    for (const [source, itemId] of inputs) {
      assert.ok(source && itemId);
      assert.deepEqual(items[source], { itemId, state: 'owned' });
      items[source] = { itemId, state: 'consumed' };
    }
    assert.deepEqual(after.inventory, { ...before.inventory, questItems: items });
    const progress = structuredClone(before.map.questProgress);
    if (id === shatter) {
      const row = progress[forge]; assert.ok(row);
      assert.equal(row.status, 'inProgress'); assert.equal(row.objectives['obj-shatter'], false);
      row.status = 'completed'; row.objectives['obj-shatter'] = true;
    }
    assert.deepEqual(after.map, { ...before.map, questProgress: progress, questReceipts: receipts });
    for (const key of ['merc', 'formation', 'meta'] as const) assert.deepEqual(after[key], before[key]);
    assert.deepEqual(next, previous, 'Quest execution changed player');
  } else if (action === 'read') {
    const expected = id === SCROLL_SOURCE ? { ...previous,
      derivedStats: deriveEquippedPlayerStats(previous, previous.level, after.inventory.equipped,
        after.map.questProgress, after.inventory.questItems, after.map.questReceipts) }
      : { ...previous, skillPoints: previous.skillPoints + 1 };
    assert.deepEqual(next, expected, 'Separate native item Read');
    assert.deepEqual(after.inventory, { ...before.inventory, questItems: { ...before.inventory.questItems,
      [id]: { ...before.inventory.questItems[id], state: 'consumed' } } });
    assert.deepEqual(after.map, { ...before.map, questReceipts: receipts });
    for (const key of ['merc', 'formation', 'meta'] as const) assert.deepEqual(after[key], before[key]);
  } else assert.deepEqual(next, previous, 'World action changed player');
}

/** Execute once at a safe boundary, retaining actual transition/income before fallible logging. */
export function createCampaignQuestActions(record: CampaignRecord,
  onReward: (delta: CampaignReward, action: CampaignQuestAction) => void) {
  const entries: CampaignQuestEntry[] = [];
  const perform = (action: CampaignQuestAction, id: string, native: () => string) => {
    const before = observeEarnedState();
    let result = 'threw', thrown = false, cause: unknown;
    try { result = questActionPreflight() ?? native(); }
    catch (error) { thrown = true; cause = error; }
    const after = observeEarnedState();
    const delta = before.player.player && after.player.player ? earnedDelta(before, after) : null;
    const entry: CampaignQuestEntry = { action, id, result,
      before: questState(before), after: questState(after), delta,
      ...(thrown ? { error: String(cause) } : {}) };
    entries.push(entry);
    if (delta && hasIncome(delta)) onReward(delta, action);
    record({ kind: 'quest-action', ...entry });
    if (thrown) throw cause;
    if (result !== 'ok') assert.deepEqual(after, before, 'Quest refusal changed observed state');
    assert.equal(result, 'ok', `Campaign ${action} refused: ${id}: ${result}`);
    assertNativeGrant(action, id, before, after);
  };
  return { entries,
    start: (id: string) => { perform('start', id, () => { startCampaignQuest(id, () => undefined); return 'ok'; }); },
    claim: (id: string) => { perform('claim', id, () => {
      recordCampaignBossCheckpoint('before-claim', id, record);
      return claimQuestReward(id);
    }); },
    visit: (id: string, act = 2) => { perform('visit', id, () => travelToAreaObjects(act, id)); },
    recover: (id: string) => { perform('recover', id, () => recoverQuestTool(id)); },
    interact: (id: string) => { perform('interact', id, () => interactWithAreaObject(id)); },
    assemble: (id: string) => { perform('assemble', id, () => assembleQuestItem(id)); },
    insert: (id: string) => { perform('insert', id, () => insertQuestItem(id)); },
    read: (id: string) => { perform('read', id, () => readQuestItem(id)); },
    execute: (id: string) => { perform('execute', id, () => executeQuestAction(id)); },
    act5: (id: string) => { perform('act5', id, () => executeAct5QuestAction(id)); } };
}
