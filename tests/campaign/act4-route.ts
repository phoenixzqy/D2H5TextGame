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
import { assertActThreeComplete } from './act3-route';

const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const plains = 'areas/act4-plains-of-despair', river = 'areas/act4-river-of-flame', chaos = 'areas/act4-chaos-sanctuary';
const hammer = `${forge}#objective:obj-kill-hephasto`, stone = 'quests/act3-guardian#reward:questItem';
const shatter = `${forge}#action:shatter-soulstone`;
const izual = `${fallen}#action:izual-victory`, hephasto = `${forge}#action:hephasto-victory`;
const diablo = `${terror}#action:diablo-victory`;
const staff = 'quests/act2-horadric-staff', khalim = 'quests/act3-khalims-will';
const council = `${khalim}#action:council-victory`, orb = 'quests/act3-guardian#action:break-compelling-orb';
const seals = ['objects/diablo_seal_1', 'objects/diablo_seal_2', 'objects/diablo_seal_3'] as const;

/** Require the same created hero and exact completed prefixes before any Act IV Start. */
export function assertFreshActThreePrefix(created: SaveCurrent, prefixClaims: readonly string[],
  act2Entries: readonly CampaignQuestEntry[], act3Entries: readonly CampaignQuestEntry[]): void {
  assertFreshActOnePrefix(created, prefixClaims);
  assertActTwoComplete(act2Entries); assertActThreeComplete(act3Entries);
  const player = usePlayerStore.getState().player; assert.ok(player);
  assert.equal(player.id, created.player.id, 'Act IV must retain the created hero');
  assert.equal(player.class, created.player.class); assert.equal(player.name, created.player.name);
  const map = useMapStore.getState();
  for (const [label, rows] of [['quests', map.questProgress], ['sources', useInventoryStore.getState().questItems],
    ['receipts', map.questReceipts]] as const) {
    assert.ok(!Object.getOwnPropertyNames(rows).some(id => id.startsWith('quests/act4-')),
      `Act IV ${label} must be absent before Starts`);
  }
  assert.ok(!map.clearedSubAreas.some(id => id.startsWith('areas/act4-') || id.startsWith('a4-')),
    'Act IV clears must be absent before Starts');
}

/** Exact successful suffix actions; accepted original combat provenance belongs to production. */
export const actFourActionOrder: readonly (readonly [CampaignQuestEntry['action'], string])[] = [
  ['start', fallen], ['start', forge], ['start', terror], ['claim', fallen],
  ['visit', river], ['recover', hammer], ['execute', shatter], ['claim', forge], ['visit', chaos],
  ...seals.map(id => ['interact', id] as const), ['claim', terror]
];

/** Require exact claimed rows, clears and the inherited graph including consumed actual Soulstone. */
export function assertActFourComplete(act4Entries: readonly CampaignQuestEntry[]): void {
  assert.deepEqual(act4Entries.map(row => [row.action, row.id]), actFourActionOrder);
  assert.ok(act4Entries.every(row => row.result === 'ok'));
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  for (const id of [fallen, forge, terror]) {
    const definition = loadQuests().find(row => row.id === id); assert.ok(definition);
    assert.ok(Object.hasOwn(map.questProgress, id)); const row = map.questProgress[id]; assert.ok(row);
    assert.equal(row.id, id); assert.equal(row.status, 'completed'); assert.equal(row.rewardClaimed, true);
    assert.deepEqual(row.objectives, Object.fromEntries(definition.objectives.map(objective => [objective.id, true])));
  }
  assert.deepEqual(items, {
    [`${staff}#objective:obj-cube`]: { itemId: 'quest/horadric_cube', state: 'owned' },
    [`${staff}#objective:obj-shaft`]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
    [`${staff}#objective:obj-amulet`]: { itemId: 'quest/viper_amulet', state: 'consumed' },
    [`${staff}#objective:obj-transmute`]: { itemId: 'quest/horadric_staff', state: 'consumed' },
    'quests/act2-radaments-lair#reward:questItem': { itemId: 'items/book_of_skill', state: 'consumed' },
    ...Object.fromEntries(['brain', 'heart', 'eye', 'flail'].map(part =>
      [`${khalim}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' }])),
    [`${khalim}#objective:obj-transmute`]: { itemId: 'items/khalims_will', state: 'consumed' },
    [stone]: { itemId: 'items/soulstone_mephisto', state: 'consumed' },
    [hammer]: { itemId: 'quest/hellforge_hammer', state: 'consumed' }
  });
  assert.deepEqual(map.questReceipts, { [council]: true, [orb]: true, [izual]: true,
    [hephasto]: true, [shatter]: true, [diablo]: true });
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  for (const area of [plains, river, chaos]) assert.ok(map.clearedSubAreas.includes(area), `Missing actual Act IV clear: ${area}`);
  assert.equal(map.isActUnlocked(5), true);
}

/** Fixed three-admission suffix; grow then equip at entry, each full clear and each Claim. */
export function runActFour(initialProfile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>,
  beforeChaos?: (profile: CampaignProfile) => CampaignProfile): CampaignProfile {
  let profile = initialProfile;
  const start = actions.entries.length;
  const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
  const proof = (source: string) => {
    const receipts = useMapStore.getState().questReceipts;
    assert.ok(Object.hasOwn(receipts, source)); assert.equal(receipts[source], true);
  };
  boundary(); actions.start(fallen); actions.start(forge); actions.start(terror);
  enter(plains, 'route'); boundary(); proof(izual); actions.claim(fallen); boundary();
  enter(river, 'route'); boundary(); proof(hephasto);
  actions.visit(river, 4); actions.recover(hammer); actions.execute(shatter);
  actions.claim(forge); boundary();
  actions.visit(chaos, 4); for (const seal of seals) actions.interact(seal);
  if (beforeChaos) profile = beforeChaos(profile);
  enter(chaos, 'route'); boundary(); proof(diablo); actions.claim(terror); boundary();
  assertActFourComplete(actions.entries.slice(start));
  return profile;
}
