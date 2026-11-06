import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { loadQuests } from '@/data/loaders/quests';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { resolveQuestResistanceBonus } from '@/engine/progression/quest-resistance';
import type { SaveCurrent } from '@/engine/types/save';
import { campaignQuestRewards, type CampaignQuestEntry } from './quest-actions';
import { actTwoActionOrder } from './act2-route';
import { actThreeActionOrder } from './act3-route';
import { actFourActionOrder } from './act4-route';
import { actFiveOrder, type ActFiveRoute } from './act5-route';
import { act5Runtime } from '@/data/loaders/act5-runtime';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { CAGE_PROOFS, POTION_SOURCE, THAW_PROOF, READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import type { CampaignQuestSettlement } from './quest-settlement';
import { savedCampaignState } from './campaign-state';

type PointState = NonNullable<CampaignQuestEntry['before']['player']>;
const totalXp = (player: PointState) => xpTotal(player.level) + player.experience;
function points(player: PointState) {
  const ranks = Object.values(player.skillLevels);
  const stats = (['strength', 'dexterity', 'vitality', 'energy'] as const).map(key => player.coreStats[key]);
  for (const value of [...ranks, ...stats, player.skillPoints, player.statPoints])
    assert.ok(Number.isSafeInteger(value) && value >= 0, 'Invalid campaign point balance');
  return { skill: player.skillPoints + ranks.reduce((sum, rank) => sum + rank, 0),
    stat: player.statPoints + stats.reduce((sum, stat) => sum + stat, 0) };
}
const pointState = (save: SaveCurrent): PointState => ({ ...save.player, skillLevels: save.player.skillLevels ?? {} });
const staffQuest = 'quests/act2-horadric-staff';
const radament = 'quests/act2-radaments-lair';
const cube = `${staffQuest}#objective:obj-cube`;
const shaft = `${staffQuest}#objective:obj-shaft`;
const amulet = `${staffQuest}#objective:obj-amulet`;
const staff = `${staffQuest}#objective:obj-transmute`;
const book = `${radament}#reward:questItem`;
const khalim = 'quests/act3-khalims-will', guardian = 'quests/act3-guardian';
const will = `${khalim}#objective:obj-transmute`;
const council = `${khalim}#action:council-victory`, orb = `${guardian}#action:break-compelling-orb`;
const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const hammer = `${forge}#objective:obj-kill-hephasto`, stone = `${guardian}#reward:questItem`;
const shatter = `${forge}#action:shatter-soulstone`;
const eve = 'quests/act5-eve-of-destruction', throne = `${eve}#action:throne-waves-victory`;
const baal = `${eve}#action:baal-victory`;
const actFourProofs = [
  { quest: fallen, objective: 'obj-kill-izual', receipt: `${fallen}#action:izual-victory`,
    area: 'areas/act4-plains-of-despair', completed: true },
  { quest: forge, objective: 'obj-kill-hephasto', receipt: `${forge}#action:hephasto-victory`,
    area: 'areas/act4-river-of-flame', completed: false },
  { quest: terror, objective: 'obj-kill-diablo', receipt: `${terror}#action:diablo-victory`,
    area: 'areas/act4-chaos-sanctuary', completed: true }
] as const;
const components = ['brain', 'heart', 'eye', 'flail'].map(part =>
  ({ source: `${khalim}#objective:obj-${part}`, itemId: `quest/khalims_${part}` }));
type Progress = CampaignQuestEntry['before']['progress'];
const trackedProgress = (progress: Progress) => Object.fromEntries(
  Object.entries(progress).filter(([id]) => id.startsWith('quests/act3-') || id.startsWith('quests/act4-') ||
    id.startsWith('quests/act5-') || id.startsWith('quests/side-act5-')));

/** A failed publication may retain either participating value, never an unrelated change. */
function assertPartialPublication<Value>(before: Readonly<Record<string, Value>>,
  after: Readonly<Record<string, Value>>, expected: Readonly<Record<string, Value>>) {
  for (const id of new Set([...Object.keys(before), ...Object.keys(after), ...Object.keys(expected)])) {
    const observed = [Object.hasOwn(after, id), after[id]];
    assert.ok(isDeepStrictEqual(observed, [Object.hasOwn(before, id), before[id]]) ||
      isDeepStrictEqual(observed, [Object.hasOwn(expected, id), expected[id]]), 'Unrelated exceptional publication');
  }
}

function expectedQuestProgress(entry: CampaignQuestEntry) {
  const progress = structuredClone(trackedProgress(entry.before.progress));
  if (entry.action === 'start') {
    const definition = loadQuests().find(row => row.id === entry.id); assert.ok(definition);
    assert.equal(Object.hasOwn(progress, entry.id), false);
    progress[entry.id] = { id: entry.id, status: 'inProgress',
      objectives: Object.fromEntries(definition.objectives.map(row => [row.id, false])) };
  } else if ((entry.action === 'recover' || entry.action === 'assemble') && entry.id !== hammer) {
    const row = progress[khalim]; assert.ok(row);
    const objective = entry.id.split('#objective:')[1]; assert.ok(objective);
    row.objectives[objective] = true;
    if (entry.action === 'assemble') row.status = 'completed';
  } else if (entry.action === 'claim') {
    const row = progress[entry.id]; assert.ok(row);
    assert.equal(row.status, 'completed'); assert.notEqual(row.rewardClaimed, true);
    row.rewardClaimed = true;
  } else if (entry.action === 'execute' && entry.id === shatter) {
    const row = progress[forge]; assert.ok(row);
    assert.equal(row.status, 'inProgress'); assert.equal(row.objectives['obj-kill-hephasto'], true);
    assert.equal(row.objectives['obj-shatter'], false); assert.notEqual(row.rewardClaimed, true);
    row.status = 'completed'; row.objectives['obj-shatter'] = true;
  } else if (entry.action === 'interact') {
    const seal = /^objects\/diablo_seal_([123])$/.exec(entry.id)?.[1]; assert.ok(seal);
    const row = progress[terror]; assert.ok(row);
    assert.equal(row.status, 'inProgress'); assert.notEqual(row.rewardClaimed, true);
    assert.equal(row.objectives[`obj-seal-${seal}`], false); assert.equal(row.objectives['obj-kill-diablo'], false);
    row.objectives[`obj-seal-${seal}`] = true;
  } else if (entry.action === 'act5') {
    const action = act5Runtime.actions.find(row => row.receiptSource === entry.id); assert.ok(action && action.kind !== 'read');
    const row = progress[action.questId]; assert.ok(row);
    if (action.kind === 'cage' && CAGE_PROOFS.every(source => source === entry.id || Object.hasOwn(entry.before.receipts, source)))
      row.objectives['obj-free-15'] = true;
    if (action.kind === 'inspect') row.objectives['obj-find-anya'] = true;
    if (action.kind === 'thaw') row.objectives['obj-thaw'] = true;
    row.status = Object.values(row.objectives).every(Boolean) ? 'completed' : 'inProgress';
  }
  return progress;
}

function expectedItems(entry: CampaignQuestEntry) {
  const items = { ...entry.before.items };
  const own = (source: string, itemId: string) => {
    assert.equal(Object.hasOwn(items, source), false, 'Repeated quest item creation');
    items[source] = { itemId, state: 'owned' };
  };
  const consume = (source: string, itemId: string) => {
    assert.ok(Object.hasOwn(items, source));
    assert.deepEqual(items[source], { itemId, state: 'owned' });
    items[source] = { itemId, state: 'consumed' };
  };
  if (entry.action === 'recover') {
    const component = components.find(row => row.source === entry.id);
    if (component) own(component.source, component.itemId);
    else if (entry.id === hammer) own(hammer, 'quest/hellforge_hammer');
    else if (entry.id === cube) own(cube, 'quest/horadric_cube');
    else if (entry.id === shaft) {
      assert.deepEqual(items[cube], { itemId: 'quest/horadric_cube', state: 'owned' });
      own(shaft, 'quest/staff_of_kings');
    } else {
      assert.equal(entry.id, amulet);
      assert.deepEqual(items[cube], { itemId: 'quest/horadric_cube', state: 'owned' });
      assert.deepEqual(items[shaft], { itemId: 'quest/staff_of_kings', state: 'owned' });
      own(amulet, 'quest/viper_amulet');
    }
  } else if (entry.action === 'act5' && entry.id === POTION_SOURCE) own(POTION_SOURCE, 'quest/malahs_potion');
  else if (entry.action === 'act5' && entry.id === THAW_PROOF) consume(POTION_SOURCE, 'quest/malahs_potion');
  else if (entry.action === 'claim' && entry.id === 'quests/act5-prison-of-ice') own(SCROLL_SOURCE, 'items/scroll_of_resist');
  else if (entry.action === 'claim' && entry.id === radament) own(book, 'items/book_of_skill');
  else if (entry.action === 'claim' && entry.id === guardian)
    own(`${guardian}#reward:questItem`, 'items/soulstone_mephisto');
  else if (entry.action === 'read') {
    if (entry.id === SCROLL_SOURCE) consume(SCROLL_SOURCE, 'items/scroll_of_resist');
    else { assert.equal(entry.id, book); consume(book, 'items/book_of_skill'); }
  }
  else if (entry.action === 'assemble') {
    assert.deepEqual(items[cube], { itemId: 'quest/horadric_cube', state: 'owned' });
    if (entry.id === will) {
      for (const component of components) consume(component.source, component.itemId);
      own(will, 'items/khalims_will');
    } else {
      assert.equal(entry.id, staff);
      consume(shaft, 'quest/staff_of_kings'); consume(amulet, 'quest/viper_amulet');
      own(staff, 'quest/horadric_staff');
    }
  } else if (entry.action === 'insert') { assert.equal(entry.id, staff); consume(staff, 'quest/horadric_staff'); }
  else if (entry.action === 'execute') {
    if (entry.id === shatter) { consume(hammer, 'quest/hellforge_hammer'); consume(stone, 'items/soulstone_mephisto'); }
    else { assert.equal(entry.id, orb); consume(will, 'items/khalims_will'); }
  }
  return items;
}

/** Reconcile ordered actual sources and held/allocated points, including partial technical stops. */
export function auditCampaignQuests(initial: SaveCurrent, terminal: SaveCurrent,
  entries: readonly CampaignQuestEntry[], prefixClaims: readonly string[],
  options: { act3Start?: number; act4Start?: number; act5Start?: number; act5Route?: ActFiveRoute;
    settlements?: readonly CampaignQuestSettlement[] } = {}) {
  assert.equal(terminal.player.id, initial.player.id);
  assert.equal(terminal.player.class, initial.player.class);
  assert.equal(new Set(prefixClaims).size, prefixClaims.length, 'Repeated prefix Claim');
  const act5Order = actFiveOrder(options.act5Route);
  let explicitSkillPoints = 0, explicitStatPoints = 0, successfulClaims = 0, reads = 0, scrollReads = 0, exceptions = 0;
  for (const id of prefixClaims) {
    assert.ok(['quests/act1-den-of-evil', 'quests/act1-sisters-to-the-slaughter'].includes(id));
    const rewards = campaignQuestRewards(id);
    assert.equal(terminal.map.questProgress[id]?.rewardClaimed, true);
    explicitSkillPoints += rewards.skillPoints; explicitStatPoints += rewards.statPoints;
  }
  let items = initial.inventory.questItems;
  let receipts = initial.map.questReceipts;
  let progress = trackedProgress(initial.map.questProgress);
  let campaign = savedCampaignState(initial);
  let councilProofs = 0, guardianCompletions = 0, settlementExceptions = 0, settlementIndex = 0;
  let izualProofs = 0, hephastoProofs = 0, diabloProofs = 0;
  let throneProofs = 0, baalProofs = 0, throneOrdinal: number | undefined;
  let shenkProofs = 0, nihlathakProofs = 0, ancientsProofs = 0;
  const settlements = options.settlements ?? [];
  const act3Start = options.act3Start;
  const act4Start = options.act4Start;
  const act5Start = options.act5Start;
  // Raw indices retain every attempted action and settlement. Only a successful
  // action advances the intended route; verified no-op refusals can be retried.
  const routePositions = [0];
  for (const entry of entries) routePositions.push(routePositions[routePositions.length - 1]! + (entry.result === 'ok' ? 1 : 0));
  const routePosition = (index: number) => {
    assert.ok(Number.isSafeInteger(index) && index >= 0 && index <= entries.length, 'Invalid campaign boundary');
    return routePositions[index]!;
  };
  if (act3Start !== undefined) {
    assert.equal(routePosition(act3Start), actTwoActionOrder.length, 'Exact Act II entry boundary');
    assert.ok(entries.length >= act3Start);
  }
  if (act4Start !== undefined) {
    assert.ok(act3Start !== undefined);
    assert.equal(routePosition(act3Start), actTwoActionOrder.length, 'Act IV requires exact Act III entry boundary');
    assert.equal(routePosition(act4Start), actTwoActionOrder.length + actThreeActionOrder.length, 'Exact Act III entry boundary');
    assert.ok(entries.length >= act4Start);
  }
  if (act5Start !== undefined) {
    assert.ok(act3Start !== undefined && act4Start !== undefined);
    assert.equal(routePosition(act3Start), actTwoActionOrder.length, 'Act V requires exact Act III entry boundary');
    assert.equal(routePosition(act4Start), actTwoActionOrder.length + actThreeActionOrder.length,
      'Act V requires exact Act IV entry boundary');
    assert.equal(routePosition(act5Start), actTwoActionOrder.length + actThreeActionOrder.length + actFourActionOrder.length,
      'Exact Act IV entry boundary');
    assert.ok(entries.length >= act5Start);
  }
  const order = [...actTwoActionOrder, ...(act3Start === undefined ? [] : actThreeActionOrder),
    ...(act4Start === undefined ? [] : actFourActionOrder), ...(act5Start === undefined ? [] : act5Order)];
  assert.ok(routePosition(entries.length) <= order.length);
  let lastActionIndex = -1, lastOrdinal = -1, lastWaveIndex = -1;
  for (const event of settlements) {
    assert.ok(Number.isSafeInteger(event.actionIndex) && event.actionIndex >= 0 && event.actionIndex <= entries.length);
    assert.ok(Number.isSafeInteger(event.ordinal) && event.ordinal >= 0);
    assert.ok(Number.isSafeInteger(event.index) && event.index >= 0);
    assert.ok(event.actionIndex >= lastActionIndex && event.ordinal >= lastOrdinal);
    if (event.ordinal === lastOrdinal) assert.ok(event.index > lastWaveIndex);
    lastActionIndex = event.actionIndex; lastOrdinal = event.ordinal; lastWaveIndex = event.index;
  }
  const settleBefore = (actionIndex: number) => {
    while (settlements[settlementIndex]?.actionIndex === actionIndex) {
      const event = settlements[settlementIndex++]; assert.ok(event);
      assert.deepEqual(event.before.items, items, 'Settlement item continuity');
      assert.deepEqual(event.after.items, items, 'Combat changed quest items');
      assert.deepEqual(event.before.receipts, receipts, 'Settlement receipt continuity');
      assert.deepEqual(trackedProgress(event.before.progress), progress, 'Settlement quest continuity');
      if (event.act === 5) assert.ok(event.before.campaign && event.after.campaign,
        'Act V settlements require actual campaign observations');
      if (event.before.campaign) assert.deepEqual(event.before.campaign, campaign, 'Settlement campaign continuity');
      if (event.after.campaign) assert.deepEqual(event.after.campaign, campaign, 'Combat changed campaign ownership');
      const expectedReceipts = { ...receipts }, expectedProgress = structuredClone(progress);
      if (isDeepStrictEqual(event.before, event.after)) {
        assert.ok(act5Start !== undefined);
        assert.equal(routePosition(actionIndex), routePosition(act5Start) + act5Order.findIndex(([action, id]) => action === 'claim' && id === eve));
        assert.equal(event.act, 5); assert.equal(event.area, 'areas/act5-throne-of-destruction');
        assert.equal(event.index, 4); assert.equal(event.nativeReturned, true);
        assert.equal(event.winner, 'player'); assert.ok(event.heroLife !== null && event.heroLife > 0);
        assert.equal(event.advance, 'next-wave');
        const row = progress[eve]; assert.ok(row);
        assert.equal(row.id, eve); assert.equal(row.status, 'inProgress'); assert.notEqual(row.rewardClaimed, true);
        assert.equal(row.objectives['obj-throne-waves'], true); assert.equal(row.objectives['obj-kill-baal'], false);
        assert.equal(receipts[throne], true); assert.equal(Object.hasOwn(receipts, baal), false);
        assert.ok(throneOrdinal !== undefined && event.ordinal > throneOrdinal, 'Retry must follow the previous Throne admission');
        throneOrdinal = event.ordinal;
      }
      const addsCouncil = !Object.hasOwn(receipts, council) && Object.hasOwn(event.after.receipts, council);
      const completesGuardian = progress[guardian]?.status !== 'completed' &&
        event.after.progress[guardian]?.status === 'completed';
      if (!event.nativeReturned) {
        settlementExceptions++;
        assert.equal(actionIndex, entries.length, 'Continuation after exceptional settlement');
        assert.equal(settlementIndex, settlements.length);
        assert.equal(event.winner, null); assert.equal(event.heroLife, null); assert.equal(event.advance, null);
      }
      if (addsCouncil || completesGuardian) {
        assert.ok(act3Start !== undefined && actionIndex >= act3Start);
        assert.equal(event.act, 3);
        if (event.nativeReturned) {
          assert.equal(event.winner, 'player'); assert.ok(event.heroLife !== null && event.heroLife > 0);
          assert.ok(event.advance === 'victory' || event.advance === 'next-wave');
        }
      }
      if (addsCouncil) {
        assert.equal(event.area, 'areas/act3-travincal');
        const row = progress[khalim]; assert.ok(row);
        assert.equal(row.status, 'inProgress'); assert.equal(row.objectives['obj-transmute'], false);
        expectedReceipts[council] = true; councilProofs++;
      }
      if (completesGuardian) {
        assert.equal(event.area, 'areas/act3-durance-of-hate');
        if (event.nativeReturned) assert.equal(event.advance, 'victory');
        assert.equal(receipts[orb], true);
        assert.deepEqual(items[will], { itemId: 'items/khalims_will', state: 'consumed' });
        const row = expectedProgress[guardian]; assert.ok(row);
        assert.equal(row.status, 'inProgress'); assert.equal(row.objectives['obj-kill-mephisto'], false);
        assert.notEqual(row.rewardClaimed, true);
        row.status = 'completed'; row.objectives['obj-kill-mephisto'] = true; guardianCompletions++;
      }
      for (const proof of actFourProofs) {
        const addsProof = !Object.hasOwn(receipts, proof.receipt) && Object.hasOwn(event.after.receipts, proof.receipt);
        const changesRow = !isDeepStrictEqual(progress[proof.quest], event.after.progress[proof.quest]);
        if (!addsProof && !changesRow) continue;
        assert.ok(act4Start !== undefined && actionIndex >= act4Start);
        assert.equal(event.act, 4); assert.equal(event.area, proof.area);
        if (event.nativeReturned) {
          assert.equal(event.winner, 'player'); assert.ok(event.heroLife !== null && event.heroLife > 0);
          assert.ok(event.advance === 'victory' || event.advance === 'next-wave');
        }
        const row = expectedProgress[proof.quest]; assert.ok(row);
        assert.equal(row.id, proof.quest); assert.equal(row.status, 'inProgress');
        assert.notEqual(row.rewardClaimed, true); assert.equal(row.objectives[proof.objective], false);
        if (proof.quest === terror) {
          if (event.nativeReturned) assert.equal(event.advance, 'victory');
          for (let seal = 1; seal <= 3; seal++) assert.equal(row.objectives[`obj-seal-${String(seal)}`], true);
        }
        row.objectives[proof.objective] = true;
        if (proof.completed) row.status = 'completed';
        expectedReceipts[proof.receipt] = true;
        if (addsProof) {
          if (proof.quest === fallen) izualProofs++;
          else if (proof.quest === forge) hephastoProofs++;
          else diabloProofs++;
        }
      }
      for (const proof of ACT5_ENCOUNTERS.filter(row => row.questId !== eve)) {
        const addsProof = !Object.hasOwn(receipts, proof.proof) && Object.hasOwn(event.after.receipts, proof.proof);
        const changesRow = !isDeepStrictEqual(progress[proof.questId], event.after.progress[proof.questId]);
        if (!addsProof && !changesRow) continue;
        assert.equal(options.act5Route, 'main-quests'); assert.ok(act5Start !== undefined);
        const claimIndex = act5Order.findIndex(([action, id]) => action === 'claim' && id === proof.questId);
        assert.ok(claimIndex >= 0); assert.equal(routePosition(actionIndex), routePosition(act5Start) + claimIndex);
        assert.equal(event.act, 5); assert.equal(event.area, proof.areaId);
        if (event.nativeReturned) {
          assert.equal(event.winner, 'player'); assert.ok(event.heroLife !== null && event.heroLife > 0);
          assert.equal(event.advance, 'victory');
        }
        const row = expectedProgress[proof.questId]; assert.ok(row);
        assert.equal(row.id, proof.questId); assert.equal(row.status, 'inProgress');
        assert.notEqual(row.rewardClaimed, true); assert.equal(row.objectives[proof.objectiveId], false);
        for (const prerequisite of proof.prerequisites) assert.equal(row.objectives[prerequisite], true);
        row.objectives[proof.objectiveId] = true; row.status = 'completed'; expectedReceipts[proof.proof] = true;
        if (addsProof) {
          if (proof.questId === 'quests/act5-siege-on-harrogath') shenkProofs++;
          else if (proof.questId === 'quests/act5-prison-of-ice') nihlathakProofs++;
          else ancientsProofs++;
        }
      }
      const addsThrone = !Object.hasOwn(receipts, throne) && Object.hasOwn(event.after.receipts, throne);
      const addsBaal = !Object.hasOwn(receipts, baal) && Object.hasOwn(event.after.receipts, baal);
      const changesEve = !isDeepStrictEqual(progress[eve], event.after.progress[eve]);
      if (addsThrone || addsBaal || changesEve) {
        assert.ok(act5Start !== undefined);
        assert.equal(routePosition(actionIndex), routePosition(act5Start) + act5Order.findIndex(([action, id]) => action === 'claim' && id === eve));
        assert.equal(event.act, 5); assert.equal(event.area, 'areas/act5-throne-of-destruction');
        assert.ok(event.index === 4 || event.index === 7, 'Act V proof at the wrong wave');
        const row = expectedProgress[eve]; assert.ok(row);
        assert.equal(row.id, eve); assert.equal(row.status, 'inProgress'); assert.notEqual(row.rewardClaimed, true);
        assert.equal(row.objectives['obj-kill-baal'], false);
        assert.equal(Object.hasOwn(receipts, baal), false);
        if (event.nativeReturned) {
          assert.equal(event.winner, 'player'); assert.ok(event.heroLife !== null && event.heroLife > 0);
          assert.equal(event.advance, event.index === 4 ? 'next-wave' : 'victory');
        }
        if (event.index === 4) {
          assert.equal(row.objectives['obj-throne-waves'], false);
          assert.equal(Object.hasOwn(receipts, throne), false); assert.equal(addsBaal, false);
          assert.equal(throneOrdinal, undefined); throneOrdinal = event.ordinal;
          row.objectives['obj-throne-waves'] = true; expectedReceipts[throne] = true;
          if (addsThrone) throneProofs++;
        } else {
          assert.equal(receipts[throne], true); assert.equal(row.objectives['obj-throne-waves'], true);
          assert.equal(event.ordinal, throneOrdinal, 'Baal must follow Throne proof in the same admission');
          row.objectives['obj-kill-baal'] = true; row.status = 'completed'; expectedReceipts[baal] = true;
          if (addsBaal) baalProofs++;
        }
      }
      if (!event.nativeReturned && (event.act === 4 || event.act === 5)) {
        assertPartialPublication(receipts, event.after.receipts, expectedReceipts);
        assertPartialPublication(progress, trackedProgress(event.after.progress), expectedProgress);
      } else {
        assert.deepEqual(event.after.receipts, expectedReceipts, 'Unexpected combat receipt transition');
        assert.deepEqual(trackedProgress(event.after.progress), expectedProgress, 'Unexpected combat quest transition');
      }
      receipts = event.after.receipts; progress = trackedProgress(event.after.progress);
    }
  };
  for (const [index, entry] of entries.entries()) {
    settleBefore(index);
    assert.deepEqual([entry.action, entry.id], order[routePosition(index)], 'Campaign action sequence');
    assert.deepEqual(entry.before.items, items, 'Quest item continuity before action');
    assert.deepEqual(entry.before.receipts, receipts);
    assert.deepEqual(trackedProgress(entry.before.progress), progress, 'Quest progress continuity before action');
    assert.deepEqual(entry.before.campaign, campaign, 'Campaign ownership continuity before action');
    const expectedCampaign = entry.action === 'claim' && entry.id === eve
      ? { ...campaign, questTitles: { ...campaign.questTitles, 'titles/slayer_of_baal': true as const },
        questDifficulties: { ...campaign.questDifficulties, 'difficulty/nightmare': true as const } } : campaign;
    const previous = entry.before.player, next = entry.after.player;
    assert.ok(previous && next);
    const growth = awardXp(totalXp(previous), totalXp(next) - totalXp(previous));
    const beforePoints = points(previous), afterPoints = points(next);
    const skill = afterPoints.skill - beforePoints.skill - growth.skillPointsGranted;
    const stat = afterPoints.stat - beforePoints.stat - growth.statPointsGranted;
    if (entry.result === 'ok') {
      if (entry.action === 'claim' && entry.id === eve) {
        assert.equal(receipts[throne], true); assert.equal(receipts[baal], true);
      }
      assert.deepEqual(entry.after.campaign, expectedCampaign, 'Actual campaign reward transition');
      if (entry.action === 'execute' || entry.action === 'act5') {
        if (entry.action === 'execute') assert.ok(entry.id === orb || entry.id === shatter);
        else assert.ok(act5Runtime.actions.some(row => row.receiptSource === entry.id && row.kind !== 'read'));
        assert.equal(Object.hasOwn(receipts, entry.id), false);
        receipts = { ...receipts, [entry.id]: true };
      } else if (entry.action === 'read' && entry.id === SCROLL_SOURCE) {
        assert.equal(Object.hasOwn(receipts, READ_PROOF), false); receipts = { ...receipts, [READ_PROOF]: true };
      }
      assert.deepEqual(entry.after.receipts, receipts, 'Unexpected action receipt transition');
      if (act3Start !== undefined && index >= act3Start) {
        if (entry.id === components[3]?.source) assert.equal(receipts[council], true, 'Flail without Council proof');
        if (entry.id === hammer || entry.id === shatter)
          assert.equal(receipts[`${forge}#action:hephasto-victory`], true, 'Hammer/Shatter without Hephasto proof');
        assert.deepEqual(trackedProgress(entry.after.progress), expectedQuestProgress(entry), 'Actual quest progress transition');
      } else assert.deepEqual(trackedProgress(entry.after.progress), progress);
      assert.deepEqual(entry.after.items, expectedItems(entry), 'Actual quest source transition');
      let expectedSkill = 0, expectedStat = 0;
      if (entry.action === 'claim') {
        successfulClaims++;
        const rewards = campaignQuestRewards(entry.id);
        assert.equal(totalXp(next) - totalXp(previous), rewards.xp);
        expectedSkill = rewards.skillPoints; expectedStat = rewards.statPoints;
      } else {
        assert.equal(totalXp(next), totalXp(previous));
        if (entry.action === 'read') {
          if (entry.id === SCROLL_SOURCE) scrollReads++;
          else { reads++; expectedSkill = 1; }
        }
      }
      assert.equal(skill, expectedSkill, 'Actual explicit skill grant');
      assert.equal(stat, expectedStat, 'Actual explicit stat grant');
    } else {
      if (entry.result === 'threw') {
        assert.equal(index, entries.length - 1, 'Continuation after failed action');
        assert.ok(!settlements.some(event => event.actionIndex > index), 'Combat continuation after failed action');
        exceptions++;
        assertPartialPublication(campaign, entry.after.campaign, expectedCampaign);
        const allowedReceipts = entry.action === 'execute' || entry.action === 'act5'
          ? { ...receipts, [entry.id]: true } : entry.action === 'read' && entry.id === SCROLL_SOURCE
            ? { ...receipts, [READ_PROOF]: true } : receipts;
        assert.ok(isDeepStrictEqual(entry.after.receipts, receipts) ||
          isDeepStrictEqual(entry.after.receipts, allowedReceipts), 'Unrelated exceptional receipt');
        assertPartialPublication(entry.before.items, entry.after.items, expectedItems(entry));
        const allowedProgress = act3Start !== undefined && index >= act3Start
          ? expectedQuestProgress(entry) : progress;
        assertPartialPublication(progress, trackedProgress(entry.after.progress), allowedProgress);
        const grant = entry.action === 'claim' ? campaignQuestRewards(entry.id) :
          { xp: 0, skillPoints: entry.action === 'read' && entry.id !== SCROLL_SOURCE ? 1 : 0, statPoints: 0 };
        assert.ok(totalXp(next) === totalXp(previous) || totalXp(next) - totalXp(previous) === grant.xp,
          'Unrelated exceptional XP grant');
        assert.ok(skill === 0 || skill === grant.skillPoints, 'Unrelated exceptional skill grant');
        assert.ok(stat === 0 || stat === grant.statPoints, 'Unrelated exceptional stat grant');
      }
      else assert.deepEqual(entry.after, entry.before, 'Refusal changed quest/point state');
    }
    // Include exceptional residual grants, rather than inventing rollback after a native exception.
    explicitSkillPoints += skill; explicitStatPoints += stat; items = entry.after.items;
    receipts = entry.after.receipts; progress = trackedProgress(entry.after.progress);
    campaign = entry.after.campaign;
  }
  settleBefore(entries.length);
  assert.equal(settlementIndex, settlements.length, 'Unreconciled settlement');
  assert.deepEqual(terminal.inventory.questItems, items, 'Terminal quest source conservation');
  assert.deepEqual(terminal.map.questReceipts, receipts, 'Terminal receipt conservation');
  assert.deepEqual(trackedProgress(terminal.map.questProgress), progress, 'Terminal quest progress conservation');
  assert.deepEqual(savedCampaignState(terminal), campaign, 'Terminal campaign ownership conservation');
  const start = pointState(initial), finish = pointState(terminal);
  const growth = awardXp(totalXp(start), totalXp(finish) - totalXp(start));
  const first = points(start), last = points(finish);
  assert.equal(last.skill, first.skill + growth.skillPointsGranted + explicitSkillPoints,
    'Held plus allocated skill point conservation');
  assert.equal(last.stat, first.stat + growth.statPointsGranted + explicitStatPoints,
    'Held plus allocated stat point conservation');
  const resumedRefusals = entries.slice(0, -1).filter(entry => entry.result !== 'ok' && entry.result !== 'threw').length;
  return { successfulClaims, reads, scrollReads, exceptions, resumedRefusals, councilProofs, guardianCompletions, settlementExceptions,
    izualProofs, hephastoProofs, diabloProofs, throneProofs, baalProofs,
    shenkProofs, nihlathakProofs, ancientsProofs,
    explicitSkillPoints, explicitStatPoints,
    xpSkillPoints: growth.skillPointsGranted, xpStatPoints: growth.statPointsGranted,
    skillPoints: { initial: first.skill, terminal: last.skill },
    statPoints: { initial: first.stat, terminal: last.stat },
    resistance: resolveQuestResistanceBonus(terminal.map.questProgress) };
}
