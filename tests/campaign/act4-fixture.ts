/** Constructed encounter publications isolate native route/action wiring; never earned wins. */
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { snapshotStores } from '@/stores/persistence';
import { claimCampaignQuest, type CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import { campaignProfiles } from './profiles';
import { createCampaignQuestActions } from './quest-actions';
import { runActTwo } from './act2-route';
import { runActThree } from './act3-route';
import type { CampaignQuestSettlement } from './quest-settlement';

export const constructedQuestGraph = () => structuredClone({ items: useInventoryStore.getState().questItems,
  progress: useMapStore.getState().questProgress, receipts: useMapStore.getState().questReceipts });
export const fixtureSave = () => { const save = snapshotStores(); assert.ok(save); return save; };

/** Publishes deliberately fake prerequisites; actual production admission owns original-member proof. */
export function publishConstructedActFourEncounter(area: string) {
  const contracts = [
    ['plains-of-despair', 'fallen-angel', 'obj-kill-izual', 'izual-victory'],
    ['river-of-flame', 'hellforge', 'obj-kill-hephasto', 'hephasto-victory'],
    ['chaos-sanctuary', 'terrors-end', 'obj-kill-diablo', 'diablo-victory']
  ] as const;
  const match = contracts.find(([suffix]) => area === `areas/act4-${suffix}`); assert.ok(match);
  const [, quest, objective, proof] = match, id = `quests/act4-${quest}`;
  const map = useMapStore.getState(), row = map.questProgress[id]; assert.ok(row);
  map.updateQuestProgress(id, { ...row, status: quest === 'hellforge' ? 'inProgress' : 'completed',
    objectives: { ...row.objectives, [objective]: true } });
  useMapStore.setState({ questReceipts: { ...useMapStore.getState().questReceipts, [`${id}#action:${proof}`]: true } });
}

/** Caller captures/restores/reset stores and clock; this starts one native hero and hire. */
export function constructActFourPrefix(profileId: keyof typeof campaignProfiles = 'sorceress-cold') {
  const profile = campaignProfiles[profileId];
  useHydrationStore.getState().setStatus('ready');
  assert.equal(createCharacter('Act4 fixture', profile.classId).ok, true);
  const initial = fixtureSave(), merc = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight'); assert.ok(merc);
  assert.equal(useMercStore.getState().hireMerc(merc).ok, true);
  const rewards: CampaignReward[] = [], settlements: CampaignQuestSettlement[] = [];
  let hook: CampaignRecord = () => undefined, ordinal = 0;
  const record: CampaignRecord = entry => { hook(entry); };
  const actions = createCampaignQuestActions(record, delta => { rewards.push(delta); });
  const enter = (act: number, area: string) => {
    useMapStore.getState().setCurrentLocation(act, area.replace(/^areas\/act([1-5])-/, 'a$1-'));
    const before = constructedQuestGraph(), map = useMapStore.getState();
    if (act === 2) {
      if (area.endsWith('far-oasis')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
        archetypeIds: ['monsters/act2.radament'] });
      else if (area.endsWith('arcane-sanctuary')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
        archetypeIds: ['monsters/act2.the-summoner'] });
      else map.recordBossKill({ actId: 'acts/act2', areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
    } else if (act === 3) {
      if (area.endsWith('travincal')) useMapStore.setState({ questReceipts: { ...map.questReceipts,
        'quests/act3-khalims-will#action:council-victory': true } });
      if (area.endsWith('durance-of-hate')) map.updateQuestProgress('quests/act3-guardian', {
        status: 'completed', objectives: { 'obj-kill-mephisto': true } });
    } else { assert.equal(act, 4); publishConstructedActFourEncounter(area); }
    useMapStore.getState().markCleared(area);
    const after = constructedQuestGraph();
    if (!isDeepStrictEqual(before, after)) settlements.push({ act, area, ordinal, index: 0,
      actionIndex: actions.entries.length, nativeReturned: true, winner: 'player', heroLife: 1,
      advance: 'victory', before, after });
    ordinal++;
  };
  const sisters = 'quests/act1-sisters-to-the-slaughter';
  useMapStore.getState().markCleared('areas/act1-catacombs');
  useMapStore.getState().updateQuestProgress(sisters, { status: 'completed', objectives: { 'obj-kill-andariel': true } });
  claimCampaignQuest(sisters, record, delta => { rewards.push(delta); });
  runActTwo(profile, record, area => { enter(2, area); }, actions);
  const act2Entries = actions.entries.slice(), act3Start = actions.entries.length;
  runActThree(profile, record, area => { enter(3, area); }, actions);
  const act3Entries = actions.entries.slice(act3Start), act4Start = actions.entries.length;
  return { initial, profile, actions, record, rewards, settlements, enter, act2Entries, act3Entries,
    act3Start, act4Start, prefixClaims: [sisters], hook: (next: CampaignRecord) => { hook = next; } };
}
