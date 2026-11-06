import assert from 'node:assert/strict';
import { loadQuests } from '@/data/loaders/quests';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { SaveCurrent } from '@/engine/types/save';
import type { CampaignProfile } from './policy';
import { growCampaignBuild, equipCampaignGear, type CampaignRecord } from './actions';
import type { CampaignQuestEntry, createCampaignQuestActions } from './quest-actions';

const sisters = 'quests/act1-sisters-to-the-slaughter';
const radament = 'quests/act2-radaments-lair';
const staffQuest = 'quests/act2-horadric-staff';
const sun = 'quests/act2-tainted-sun';
const arcane = 'quests/act2-arcane-sanctuary';
const tombs = 'quests/act2-seven-tombs';
const quests = [radament, staffQuest, sun, arcane, tombs];
const cube = `${staffQuest}#objective:obj-cube`;
const shaft = `${staffQuest}#objective:obj-shaft`;
const amulet = `${staffQuest}#objective:obj-amulet`;
const staff = `${staffQuest}#objective:obj-transmute`;
const book = `${radament}#reward:questItem`;
const dryHills = 'areas/act2-dry-hills';
const oasis = 'areas/act2-far-oasis';
const lostCity = 'areas/act2-lost-city';
const sanctuary = 'areas/act2-arcane-sanctuary';
const tomb = 'areas/act2-tomb-of-tal-rasha';

function assertClaimed(id: string) {
  const definition = loadQuests().find(row => row.id === id);
  const map = useMapStore.getState();
  assert.ok(definition && Object.hasOwn(map.questProgress, id));
  const progress = map.questProgress[id];
  assert.ok(progress);
  assert.equal(progress.id, id);
  assert.equal(progress.status, 'completed');
  assert.equal(progress.rewardClaimed, true);
  for (const objective of definition.objectives) {
    assert.ok(Object.hasOwn(progress.objectives, objective.id));
    assert.equal(progress.objectives[objective.id], true);
  }
}

/** Supplement the same-invocation route with fresh creation and actual Claim proof. */
export function assertFreshActOnePrefix(created: SaveCurrent, successfulClaims: readonly string[]): void {
  assert.equal(created.player.level, 1, 'Prefix creation must be fresh L1');
  assert.equal(created.player.experience, 0);
  assert.deepEqual(created.map.questProgress, {});
  assert.deepEqual(created.map.questReceipts, {});
  assert.deepEqual(created.inventory.questItems, {});
  assert.deepEqual(created.map.clearedSubAreas, []);
  assert.equal(successfulClaims.filter(id => id === sisters).length, 1, 'Actual once-only Sisters Claim');
  assertClaimed(sisters);
  const map = useMapStore.getState();
  assert.ok(map.clearedSubAreas.includes('areas/act1-catacombs'));
  assert.equal(map.isActUnlocked(2), true);
}

/** Exact successful suffix actions; combat entries are accounted in the shared runner. */
export const actTwoActionOrder: readonly (readonly [CampaignQuestEntry['action'], string])[] = [
  ...quests.map(id => ['start', id] as const), ['visit', dryHills], ['recover', cube],
  ['recover', shaft], ['claim', radament], ['read', book], ['visit', lostCity],
  ['recover', amulet], ['interact', 'objects/serpent_altar'], ['claim', sun],
  ['assemble', staff], ['claim', staffQuest], ['interact', 'objects/horazon_journal'],
  ['claim', arcane], ['visit', tomb], ['insert', staff], ['claim', tombs]
];

/** Require all canonical objectives, exact Claims, consumed sources and actual clears. */
export function assertActTwoComplete(entries: readonly CampaignQuestEntry[]): void {
  assert.deepEqual(entries.map(row => [row.action, row.id]), actTwoActionOrder);
  assert.ok(entries.every(row => row.result === 'ok'));
  for (const id of quests) assertClaimed(id);
  const items = useInventoryStore.getState().questItems;
  for (const [source, itemId, state] of [
    [cube, 'quest/horadric_cube', 'owned'], [shaft, 'quest/staff_of_kings', 'consumed'],
    [amulet, 'quest/viper_amulet', 'consumed'], [staff, 'quest/horadric_staff', 'consumed'],
    [book, 'items/book_of_skill', 'consumed']
  ] as const) {
    assert.ok(Object.hasOwn(items, source));
    assert.deepEqual(items[source], { itemId, state });
  }
  const map = useMapStore.getState();
  for (const area of [oasis, sanctuary, tomb]) assert.ok(map.clearedSubAreas.includes(area));
  assert.equal(map.isActUnlocked(3), true);
}

/** Fixed three-admission suffix; grow/equip at entry, each clear and each Claim. */
export function runActTwo(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'farm' | 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>,
  boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); }): void {
  boundary();
  for (const id of quests) actions.start(id);
  actions.visit(dryHills); actions.recover(cube);
  finishActTwo(enter, actions, boundary, []);
}

/** Validate checkpoint action/state custody before any growth, equipment or admission. */
export function assertActTwoResumePrefix(actions: Pick<ReturnType<typeof createCampaignQuestActions>, 'entries'>,
  prefix: readonly CampaignQuestEntry[]): void {
  assert.equal(actions.entries.length, 0, 'Continuation requires new action custody');
  assert.ok([7, 10, 16, 20].includes(prefix.length), 'Continuation requires a complete Cube, Book, Staff or pre-Tomb prefix');
  assert.deepEqual(prefix.map(entry => [entry.action, entry.id]), actTwoActionOrder.slice(0, prefix.length));
  assert.ok(prefix.every(entry => entry.result === 'ok'), 'Continuation prefix contains a failed action');
  const last = prefix.at(-1); assert.ok(last);
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  assertClaimed(sisters);
  assert.equal(map.isActUnlocked(2), true);
  assert.deepEqual(map.questProgress, last.after.progress, 'Continuation quest progress mismatch');
  assert.deepEqual(map.questReceipts, last.after.receipts, 'Continuation quest receipts mismatch');
  assert.deepEqual(inventory.questItems, last.after.items, 'Continuation quest items mismatch');
  assert.deepEqual(inventory.questItems[cube], { itemId: 'quest/horadric_cube', state: 'owned' });
}

/** Continue a verified quest checkpoint without repeating prior actions or rewards. */
export function resumeActTwoAfterCube(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'farm' | 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, prefix: readonly CampaignQuestEntry[],
  boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); }): void {
  assertActTwoResumePrefix(actions, prefix);
  boundary();
  finishActTwo(enter, actions, boundary, prefix);
}

function finishActTwo(enter: (area: string, phase: 'farm' | 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, boundary: () => void,
  prefix: readonly CampaignQuestEntry[]): void {
  if (prefix.length < 10) {
    enter(oasis, 'route'); boundary();
    actions.recover(shaft); actions.claim(radament); actions.read(book); boundary();
  }
  if (prefix.length < 16) {
    actions.visit(lostCity); actions.recover(amulet);
    actions.interact('objects/serpent_altar'); actions.claim(sun); boundary();
    actions.assemble(staff); actions.claim(staffQuest); boundary();
  }
  if (prefix.length < 20) {
    enter(sanctuary, 'route'); boundary();
    actions.interact('objects/horazon_journal'); actions.claim(arcane); boundary();
    actions.visit(tomb); actions.insert(staff);
  }
  enter(tomb, 'route'); boundary();
  actions.claim(tombs); boundary();
  assertActTwoComplete([...prefix, ...actions.entries]);
}
