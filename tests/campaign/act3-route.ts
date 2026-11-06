import assert from 'node:assert/strict';
import { loadQuests } from '@/data/loaders/quests';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { SaveCurrent } from '@/engine/types/save';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { CampaignProfile } from './policy';
import { growCampaignBuild, equipCampaignGear, type CampaignRecord } from './actions';
import type { CampaignQuestEntry, createCampaignQuestActions } from './quest-actions';
import { assertFreshActOnePrefix, assertActTwoComplete } from './act2-route';

const staffQuest = 'quests/act2-horadric-staff';
const khalim = 'quests/act3-khalims-will';
const guardian = 'quests/act3-guardian';
const brain = `${khalim}#objective:obj-brain`;
const heart = `${khalim}#objective:obj-heart`;
const eye = `${khalim}#objective:obj-eye`;
const flail = `${khalim}#objective:obj-flail`;
const will = `${khalim}#objective:obj-transmute`;
const council = `${khalim}#action:council-victory`;
const orb = `${guardian}#action:break-compelling-orb`;
const soulstone = `${guardian}#reward:questItem`;
const marsh = 'areas/act3-great-marsh';
const jungle = 'areas/act3-flayer-jungle';
const bazaar = 'areas/act3-kurast-bazaar';
const travincal = 'areas/act3-travincal';
const durance = 'areas/act3-durance-of-hate';

const actTwoItems = {
  [`${staffQuest}#objective:obj-cube`]: { itemId: 'quest/horadric_cube', state: 'owned' },
  [`${staffQuest}#objective:obj-shaft`]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
  [`${staffQuest}#objective:obj-amulet`]: { itemId: 'quest/viper_amulet', state: 'consumed' },
  [`${staffQuest}#objective:obj-transmute`]: { itemId: 'quest/horadric_staff', state: 'consumed' },
  'quests/act2-radaments-lair#reward:questItem': { itemId: 'items/book_of_skill', state: 'consumed' }
} as const;

const actThreeItems = {
  [brain]: { itemId: 'quest/khalims_brain', state: 'consumed' },
  [heart]: { itemId: 'quest/khalims_heart', state: 'consumed' },
  [eye]: { itemId: 'quest/khalims_eye', state: 'consumed' },
  [flail]: { itemId: 'quest/khalims_flail', state: 'consumed' },
  [will]: { itemId: 'items/khalims_will', state: 'consumed' },
  [soulstone]: { itemId: 'items/soulstone_mephisto', state: 'owned' }
} as const;

/** Require the same fresh hero and successful original prefixes before either Act III Start. */
export function assertFreshActTwoPrefix(created: SaveCurrent, prefixClaims: readonly string[],
  act2Entries: readonly CampaignQuestEntry[]): void {
  assertFreshActOnePrefix(created, prefixClaims);
  assertActTwoComplete(act2Entries);
  const player = usePlayerStore.getState().player; assert.ok(player);
  assert.equal(player.id, created.player.id, 'Act III must retain the created hero');
  assert.equal(player.class, created.player.class);
  assert.equal(player.name, created.player.name);
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  for (const [label, rows] of [['quests', map.questProgress], ['sources', items],
    ['receipts', map.questReceipts]] as const) {
    assert.ok(!Object.getOwnPropertyNames(rows).some(id => id.startsWith('quests/act3-')),
      `Act III ${label} must be absent before Starts`);
  }
  assert.ok(!map.clearedSubAreas.some(id => id.startsWith('areas/act3-') || id.startsWith('a3-')),
    'Act III clears must be absent before Starts');
}

/** Exact successful suffix actions; accepted combat provenance belongs to the shared runner. */
export const actThreeActionOrder: readonly (readonly [CampaignQuestEntry['action'], string])[] = [
  ['start', khalim], ['start', guardian], ['recover', brain], ['recover', heart],
  ['recover', eye], ['recover', flail], ['assemble', will], ['claim', khalim],
  ['visit', travincal], ['execute', orb], ['claim', guardian]
];

/** Require canonical claimed rows, actual clears and the exact retained item/receipt graph. */
export function assertActThreeComplete(act3Entries: readonly CampaignQuestEntry[]): void {
  assert.deepEqual(act3Entries.map(row => [row.action, row.id]), actThreeActionOrder);
  assert.ok(act3Entries.every(row => row.result === 'ok'));
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  for (const id of [khalim, guardian]) {
    const definition = loadQuests().find(row => row.id === id); assert.ok(definition);
    assert.ok(Object.hasOwn(map.questProgress, id));
    const progress = map.questProgress[id]; assert.ok(progress);
    assert.equal(progress.id, id);
    assert.equal(progress.status, 'completed');
    assert.equal(progress.rewardClaimed, true);
    assert.deepEqual(progress.objectives, Object.fromEntries(definition.objectives.map(row => [row.id, true])));
  }
  assert.deepEqual(items, { ...actTwoItems, ...actThreeItems });
  assert.deepEqual(map.questReceipts, { [council]: true, [orb]: true });
  for (const source of [council, orb]) {
    assert.ok(Object.hasOwn(map.questReceipts, source));
    assert.equal(map.questReceipts[source], true);
  }
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  for (const area of [marsh, jungle, bazaar, travincal, durance]) {
    assert.ok(map.clearedSubAreas.includes(area), `Missing actual Act III clear: ${area}`);
  }
  assert.equal(map.isActUnlocked(4), true);
}

/** Fixed five-admission suffix; grow then equip at entry, each clear and each Claim. */
export function runActThree(initialProfile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>,
  beforeDurance?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  const start = actions.entries.length;
  growCampaignBuild(initialProfile, record); equipCampaignGear(record, initialProfile);
  actions.start(khalim); actions.start(guardian);
  return finishActThree(initialProfile, record, enter, actions, [], start, beforeDurance);
}

/** Continue a verified stable action boundary without replaying prior encounters or Claims. */
export function resumeActThree(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, prefix: readonly CampaignQuestEntry[],
  beforeDurance?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  assert.equal(actions.entries.length, 0, 'Continuation requires new action custody');
  assertActThreeResumePrefix(prefix);
  growCampaignBuild(profile, record); equipCampaignGear(record, profile);
  return finishActThree(profile, record, enter, actions, prefix, 0, beforeDurance);
}

/** Read-only preflight shared with the preparation continuation before growth or equipment. */
export function assertActThreeResumePrefix(prefix: readonly CampaignQuestEntry[]): void {
  assert.ok(prefix.length >= 2 && prefix.length <= 10, 'Continuation requires an unfinished Act III prefix');
  assert.deepEqual(prefix.map(row => [row.action, row.id]), actThreeActionOrder.slice(0, prefix.length));
  assert.ok(prefix.every(row => row.result === 'ok'), 'Continuation prefix contains a failed action');
  const last = prefix.at(-1); assert.ok(last);
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  assert.equal(map.questProgress['quests/act2-seven-tombs']?.rewardClaimed, true);
  assert.equal(map.isActUnlocked(3), true, 'Continuation requires earned Act III access');
  assert.deepEqual(map.questProgress, last.after.progress, 'Continuation quest progress mismatch');
  assert.deepEqual(map.questReceipts, last.after.receipts, 'Continuation quest receipts mismatch');
  assert.deepEqual(items, last.after.items, 'Continuation quest items mismatch');
  for (const [source, item] of Object.entries(actTwoItems)) assert.deepEqual(items[source], item);
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  for (const area of [marsh, jungle, bazaar, travincal].slice(0, Math.min(4, prefix.length - 2)))
    assert.ok(map.clearedSubAreas.includes(area), `Continuation missing actual clear: ${area}`);
}

function finishActThree(initialProfile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, prefix: readonly CampaignQuestEntry[],
  start: number, beforeDurance?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  let profile = initialProfile;
  const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
  const recoveries = [[marsh, brain], [jungle, heart], [bazaar, eye], [travincal, flail]] as const;
  for (const [index, [area, source]] of recoveries.entries()) {
    if (prefix.length > index + 2) continue;
    enter(area, 'route'); boundary();
    if (area === travincal) {
      const receipts = useMapStore.getState().questReceipts;
      assert.ok(Object.hasOwn(receipts, council));
      assert.equal(receipts[council], true, 'Flail requires retained qualified Council proof');
    }
    actions.recover(source);
  }
  if (prefix.length <= 6) actions.assemble(will);
  if (prefix.length <= 7) { actions.claim(khalim); boundary(); }
  if (prefix.length <= 8) actions.visit(travincal, 3);
  if (prefix.length <= 9) actions.execute(orb);
  if (beforeDurance) profile = beforeDurance(profile);
  enter(durance, 'route'); boundary();
  actions.claim(guardian); boundary();
  assertActThreeComplete([...prefix, ...actions.entries.slice(start)]);
  return profile;
}
