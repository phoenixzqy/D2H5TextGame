import assert from 'node:assert/strict';
import { loadQuests } from '@/data/loaders/quests';
import { hasEndgameAccess, emptyEndgameState } from '@/engine/endgame/state';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateAct5QuestGraph, CAGE_PROOFS, INSPECT_PROOF, POTION_SOURCE,
  THAW_PROOF, READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { hasAct5CampaignReward, BAAL_TITLE, NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import type { SaveCurrent, QuestItemLedger } from '@/engine/types/save';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { CampaignProfile } from './policy';
import { growCampaignBuild, equipCampaignGear, type CampaignRecord } from './actions';
import type { CampaignQuestEntry, createCampaignQuestActions } from './quest-actions';
import { assertFreshActOnePrefix, assertActTwoComplete } from './act2-route';
import { actThreeActionOrder } from './act3-route';
import { assertActFourComplete } from './act4-route';
import { campaignState, savedCampaignState } from './campaign-state';

const eve = 'quests/act5-eve-of-destruction', throne = 'areas/act5-throne-of-destruction';
const siege = 'quests/act5-siege-on-harrogath', rescue = 'quests/act5-rescue-on-mount-arreat';
const prison = 'quests/act5-prison-of-ice', rite = 'quests/act5-rite-of-passage';
const foothills = 'areas/act5-bloody-foothills', highlands = 'areas/act5-frigid-highlands';
const crystalline = 'areas/act5-crystalline-passage', ancients = 'areas/act5-ancients-way';
const mainQuests = [siege, rescue, prison, rite, eve];
const mainItems: QuestItemLedger = {
  [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' },
  [SCROLL_SOURCE]: { itemId: 'items/scroll_of_resist', state: 'consumed' }
};
const staff = 'quests/act2-horadric-staff', khalim = 'quests/act3-khalims-will';
const guardian = 'quests/act3-guardian', forge = 'quests/act4-hellforge';
const inheritedQuests = ['quests/act1-sisters-to-the-slaughter', 'quests/act2-radaments-lair', staff,
  'quests/act2-tainted-sun', 'quests/act2-arcane-sanctuary', 'quests/act2-seven-tombs', khalim,
  guardian, 'quests/act4-fallen-angel', forge, 'quests/act4-terrors-end'];
const inheritedClears = ['areas/act1-catacombs', 'areas/act2-far-oasis', 'areas/act2-arcane-sanctuary',
  'areas/act2-tomb-of-tal-rasha', 'areas/act3-great-marsh', 'areas/act3-flayer-jungle',
  'areas/act3-kurast-bazaar', 'areas/act3-travincal', 'areas/act3-durance-of-hate',
  'areas/act4-plains-of-despair', 'areas/act4-river-of-flame', 'areas/act4-chaos-sanctuary'];
const inheritedItems = {
  [`${staff}#objective:obj-cube`]: { itemId: 'quest/horadric_cube', state: 'owned' },
  [`${staff}#objective:obj-shaft`]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
  [`${staff}#objective:obj-amulet`]: { itemId: 'quest/viper_amulet', state: 'consumed' },
  [`${staff}#objective:obj-transmute`]: { itemId: 'quest/horadric_staff', state: 'consumed' },
  'quests/act2-radaments-lair#reward:questItem': { itemId: 'items/book_of_skill', state: 'consumed' },
  ...Object.fromEntries(['brain', 'heart', 'eye', 'flail'].map(part =>
    [`${khalim}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' }])),
  [`${khalim}#objective:obj-transmute`]: { itemId: 'items/khalims_will', state: 'consumed' },
  [`${guardian}#reward:questItem`]: { itemId: 'items/soulstone_mephisto', state: 'consumed' },
  [`${forge}#objective:obj-kill-hephasto`]: { itemId: 'quest/hellforge_hammer', state: 'consumed' }
};
const inheritedReceipts = {
  [`${khalim}#action:council-victory`]: true, [`${guardian}#action:break-compelling-orb`]: true,
  'quests/act4-fallen-angel#action:izual-victory': true, [`${forge}#action:hephasto-victory`]: true,
  [`${forge}#action:shatter-soulstone`]: true, 'quests/act4-terrors-end#action:diablo-victory': true
};
const throneProof = `${eve}#action:throne-waves-victory`, baalProof = `${eve}#action:baal-victory`;
const emptyCampaign = { questTitles: {}, questDifficulties: {}, selectedTitle: null,
  selectedDifficulty: 'normal', nightmareClearedSubAreas: [], hellClearedSubAreas: [],
  replayOrdinals: { nightmare: 0, hell: 0 }, endgame: emptyEndgameState() };
const actFiveKey = (id: string) => id.startsWith('quests/act5-') || id.startsWith('quests/side-act5-');
const actFiveArea = (id: string) => id.startsWith('areas/act5-') || id.startsWith('a5-');

function assertClaimed(id: string) {
  const definition = loadQuests().find(row => row.id === id); assert.ok(definition);
  const progress = useMapStore.getState().questProgress;
  assert.ok(Object.hasOwn(progress, id)); const row = progress[id]; assert.ok(row);
  assert.equal(row.id, id); assert.equal(row.status, 'completed'); assert.equal(row.rewardClaimed, true);
  assert.deepEqual(row.objectives, Object.fromEntries(definition.objectives.map(objective => [objective.id, true])));
}

function assertInheritedGraph(extraItems: QuestItemLedger = {}) {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  for (const id of inheritedQuests) assertClaimed(id);
  assert.deepEqual(items, { ...inheritedItems, ...extraItems });
  for (const area of inheritedClears) assert.ok(map.clearedSubAreas.includes(area), `Missing inherited clear: ${area}`);
  assert.equal(map.isActUnlocked(5), true);
}

/** Fixed minimum Baal suffix; production owns original-source combat proof. */
export const actFiveActionOrder: readonly (readonly [CampaignQuestEntry['action'], string])[] = [
  ['start', 'quests/act5-eve-of-destruction'], ['claim', 'quests/act5-eve-of-destruction']
];

export type ActFiveRoute = 'minimum' | 'main-quests';

/** Exact declared main-quest suffix; source-bound item Read is separate from Claim. */
export const actFiveMainActionOrder: readonly (readonly [CampaignQuestEntry['action'], string])[] = [
  ['start', siege], ['claim', siege], ['start', rescue], ['visit', highlands],
  ...CAGE_PROOFS.map(source => ['act5', source] as const), ['claim', rescue],
  ['start', prison], ['visit', crystalline], ['act5', INSPECT_PROOF],
  ['act5', POTION_SOURCE], ['act5', THAW_PROOF], ['claim', prison], ['read', SCROLL_SOURCE],
  ['start', rite], ['claim', rite], ['start', eve], ['claim', eve]
];

/** Decode explicit runtime selection before creating a character or changing any native store. */
export function resolveActFiveRoute(route = 'minimum'): ActFiveRoute {
  assert.ok(route === 'minimum' || route === 'main-quests', 'Invalid Act V route');
  return route;
}

/** Share the exact selected action order with the independent campaign auditor. */
export function actFiveOrder(route = 'minimum') {
  return resolveActFiveRoute(route) === 'main-quests' ? actFiveMainActionOrder : actFiveActionOrder;
}

/** Require the same fresh hero and exact successful prefixes before the Eve Start. */
export function assertFreshActFourPrefix(created: SaveCurrent, prefixClaims: readonly string[],
  act2Entries: readonly CampaignQuestEntry[], act3Entries: readonly CampaignQuestEntry[],
  act4Entries: readonly CampaignQuestEntry[]): void {
  assertFreshActOnePrefix(created, prefixClaims); assertActTwoComplete(act2Entries);
  assert.deepEqual(act3Entries.map(row => [row.action, row.id]), actThreeActionOrder);
  assert.ok(act3Entries.every(row => row.result === 'ok'));
  // The earlier owned-Soulstone predicate cannot run after actual Shatter consumption.
  assertActFourComplete(act4Entries); assertInheritedGraph();
  const player = usePlayerStore.getState().player; assert.ok(player);
  assert.equal(player.id, created.player.id, 'Act V must retain the created hero');
  assert.equal(player.class, created.player.class); assert.equal(player.name, created.player.name);
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  for (const [label, rows] of [['quests', map.questProgress], ['sources', inventory.questItems],
    ['receipts', map.questReceipts]] as const)
    assert.ok(!Object.getOwnPropertyNames(rows).some(actFiveKey), `Act V ${label} must be absent before Start`);
  assert.ok(!map.clearedSubAreas.some(actFiveArea), 'Act V clears must be absent before Start');
  assert.deepEqual(savedCampaignState(created), emptyCampaign);
  assert.deepEqual(campaignState(map), emptyCampaign);
  validateNative24CurrentCampaignRewards(map, inventory.questItems, inventory.questServices, map.endgame);
}

/** Require inherited consumed sources plus both actual Eve proofs, Claim and entitlements. */
export function assertActFiveComplete(act5Entries: readonly CampaignQuestEntry[], route: ActFiveRoute = 'minimum'): void {
  assert.deepEqual(act5Entries.map(row => [row.action, row.id]), actFiveOrder(route));
  assert.ok(act5Entries.every(row => row.result === 'ok'));
  assertInheritedGraph(route === 'main-quests' ? mainItems : {}); assertClaimed(eve);
  const map = useMapStore.getState(), inventory = useInventoryStore.getState(), items = inventory.questItems;
  const extraReceipts = route === 'main-quests' ? {
    [`${siege}#action:shenk-victory`]: true, ...Object.fromEntries(CAGE_PROOFS.map(id => [id, true])),
    [INSPECT_PROOF]: true, [POTION_SOURCE]: true, [THAW_PROOF]: true,
    [`${prison}#action:nihlathak-victory`]: true, [READ_PROOF]: true,
    [`${rite}#action:ancients-victory`]: true
  } : {};
  for (const id of route === 'main-quests' ? mainQuests : [eve]) assertClaimed(id);
  assert.deepEqual(Object.getOwnPropertyNames(map.questProgress).filter(actFiveKey), route === 'main-quests' ? mainQuests : [eve]);
  assert.deepEqual(map.questReceipts, { ...inheritedReceipts, ...extraReceipts, [throneProof]: true, [baalProof]: true });
  assert.deepEqual(map.clearedSubAreas.filter(actFiveArea), route === 'main-quests'
    ? [foothills, highlands, crystalline, ancients, throne] : [throne]);
  assert.deepEqual(map.questTitles, { [BAAL_TITLE]: true });
  assert.deepEqual(map.questDifficulties, { [NIGHTMARE_UNLOCK]: true });
  assert.deepEqual(campaignState(map), { ...emptyCampaign,
    questTitles: { [BAAL_TITLE]: true }, questDifficulties: { [NIGHTMARE_UNLOCK]: true } });
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  validateAct5QuestGraph(items, map.questProgress, map.questReceipts);
  validateNative24CurrentCampaignRewards(map, items, inventory.questServices, map.endgame);
  assert.equal(hasAct5CampaignReward(map.questProgress, map.questReceipts, items), true);
  assert.equal(hasEndgameAccess({ questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: items }), true);
}

/** Continue a verified main-quest prefix; completed paid preparation is carried in the supplied profile. */
export function resumeActFiveMain(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, prefix: readonly CampaignQuestEntry[]): CampaignProfile {
  assert.equal(actions.entries.length, 0, 'Continuation requires new action custody');
  assert.ok(prefix.length >= 1 && prefix.length < actFiveMainActionOrder.length, 'Invalid unfinished Act V prefix');
  assert.deepEqual(prefix.map(row => [row.action, row.id]), actFiveMainActionOrder.slice(0, prefix.length),
    'Continuation prefix order mismatch');
  assert.ok(prefix.every(row => row.result === 'ok'), 'Continuation prefix contains failed history');
  const last = prefix.at(-1); assert.ok(last);
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  assert.ok(map.isActUnlocked(5), 'Continuation requires earned Act V access');
  assert.deepEqual(items, last.after.items, 'Continuation quest items mismatch');
  assert.deepEqual(campaignState(map), last.after.campaign, 'Continuation campaign history mismatch');
  const progress = structuredClone(last.after.progress);
  const receipts: Record<string, true> = { ...last.after.receipts };
  const areas = [[foothills, 1, 2], [highlands, 3, 4], [crystalline, 13, 14],
    [ancients, 16, 17], [throne, 18, 19]] as const;
  const actualClears = map.clearedSubAreas.filter(actFiveArea);
  for (const [area, earliest, required] of areas) {
    if (actualClears.includes(area)) {
      assert.ok(prefix.length >= earliest, `Continuation has a future clear: ${area}`);
      const contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
      if (contract) assert.equal(map.questReceipts[contract.proof], true, 'Continuation clear requires its receipt');
      if (area === throne) assert.ok(map.questReceipts[throneProof] && map.questReceipts[baalProof],
        'Continuation Throne clear requires both receipts');
    } else assert.ok(prefix.length < required, `Continuation missing required clear: ${area}`);
  }
  assert.deepEqual(actualClears, areas.map(([area]) => area).filter(area => actualClears.includes(area)),
    'Continuation clear history mismatch');
  const nativeProof = (proof: string, quest: string, objective: string, earliest: number) => {
    if (map.questReceipts[proof] !== true || receipts[proof] === true) return;
    assert.ok(prefix.length >= earliest, 'Continuation contains a future receipt');
    const row = progress[quest]; assert.ok(row && !row.rewardClaimed, 'Continuation receipt requires unclaimed progress');
    row.objectives[objective] = true;
    row.status = Object.values(row.objectives).every(Boolean) ? 'completed' : 'inProgress';
    receipts[proof] = true;
  };
  for (const [area, earliest] of areas) {
    const contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
    if (contract) {
      if (map.questReceipts[contract.proof] === true) assert.ok(actualClears.includes(area),
        'Continuation encounter receipt requires an actual clear');
      nativeProof(contract.proof, contract.questId, contract.objectiveId, earliest);
    }
  }
  nativeProof(throneProof, eve, 'obj-throne-waves', 18);
  nativeProof(baalProof, eve, 'obj-kill-baal', 18);
  assert.deepEqual(map.questReceipts, receipts, 'Continuation quest receipts mismatch');
  assert.deepEqual(map.questProgress, progress, 'Continuation quest progress mismatch');
  assertInheritedGraph(Object.fromEntries(Object.entries(items).filter(([id]) => actFiveKey(id))));
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  validateAct5QuestGraph(items, map.questProgress, map.questReceipts);
  validateNative24CurrentCampaignRewards(map, items, useInventoryStore.getState().questServices, map.endgame);
  growCampaignBuild(profile, record); equipCampaignGear(record, profile);
  return finishActFiveMain(profile, record, enter, actions, prefix);
}

/** Selected quest suffix with preparation boundaries after Siege and Rite Claims. */
export function runActFive(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, route: ActFiveRoute = 'minimum',
  afterSiege?: (() => CampaignProfile) | (() => void),
  afterRite?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  actFiveOrder(route);
  assert.ok(!afterSiege || route === 'main-quests', 'Siege preparation requires the main-quest route');
  assert.ok(!afterRite || route === 'main-quests', 'Rite preparation requires the main-quest route');
  const start = actions.entries.length;
  const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
  boundary();
  if (route === 'main-quests') return finishActFiveMain(profile, record, enter, actions, [], afterSiege, afterRite);
  actions.start(eve); enter(throne, 'route'); boundary();
  const map = useMapStore.getState();
  for (const proof of [throneProof, baalProof]) {
    assert.ok(Object.hasOwn(map.questReceipts, proof)); assert.equal(map.questReceipts[proof], true);
  }
  assert.ok(map.clearedSubAreas.includes(throne));
  actions.claim(eve); boundary();
  assertActFiveComplete(actions.entries.slice(start), route);
  return profile;
}

function finishActFiveMain(initial: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, prefix: readonly CampaignQuestEntry[],
  afterSiege?: (() => CampaignProfile) | (() => void),
  afterRite?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  let profile = initial;
  const start = actions.entries.length, taken = prefix.length;
  const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
  const clear = (area: string) => { if (!useMapStore.getState().clearedSubAreas.includes(area)) enter(area, 'route'); };
  if (taken <= 0) actions.start(siege);
  if (taken <= 1) {
    clear(foothills); actions.claim(siege);
    const prepared = afterSiege?.(); if (prepared) profile = prepared;
    boundary();
  }
  if (taken <= 2) actions.start(rescue);
  if (taken <= 3) { clear(highlands); actions.visit(highlands, 5); }
  for (const [index, source] of CAGE_PROOFS.entries()) if (taken <= 4 + index) actions.act5(source);
  if (taken <= 7) { actions.claim(rescue); boundary(); }
  if (taken <= 8) actions.start(prison);
  if (taken <= 9) actions.visit(crystalline, 5);
  for (const [index, source] of [INSPECT_PROOF, POTION_SOURCE, THAW_PROOF].entries())
    if (taken <= 10 + index) actions.act5(source);
  if (taken <= 13) { clear(crystalline); actions.claim(prison); }
  if (taken <= 14) { actions.read(SCROLL_SOURCE); boundary(); }
  if (taken <= 15) actions.start(rite);
  if (taken <= 16) {
    clear(ancients); actions.claim(rite);
    if (afterRite) profile = afterRite(profile);
    boundary();
  }
  if (taken <= 17) actions.start(eve);
  clear(throne); boundary();
  const map = useMapStore.getState();
  assert.ok(map.questReceipts[throneProof] && map.questReceipts[baalProof], 'Missing native Eve receipts');
  actions.claim(eve); boundary();
  assertActFiveComplete([...prefix, ...actions.entries.slice(start)], 'main-quests');
  return profile;
}
