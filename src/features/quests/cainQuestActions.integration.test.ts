/** Constructed tracking/clear state; calls real production APIs, no genuine save. */
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { loadMercPool } from '@/data/loaders/mercs';
import { xpTotal } from '@/engine/progression/xp';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { loadQuests } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { recoverQuestTool, questToolStatus, interactWithAreaObject } from '@/features/quests/interactObject';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';

const MAIN = 'quests/act1-search-for-cain';
const SIDE = 'quests/side-act1-cains-favor';
const SCROLL = `${MAIN}#objective:obj-inifuss-tree`;
const RESCUE = `${MAIN}#action:rescue-cain`;
const TALK = `${SIDE}#action:cain-talk`;
const AREA = 'areas/act1-dark-wood';
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [usePlayerStore, useMapStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore]) store.getState().reset();
}
function snapshot() {
  return structuredClone([usePlayerStore, useMapStore, useInventoryStore, useMercStore, useMetaStore, useFormationStore].map(store => Object.fromEntries(
    Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function track(claimed = false, completed = false) {
  const quest = loadQuests().find(row => row.id === MAIN);
  if (!quest) throw new Error('Missing Cain quest');
  useMapStore.setState({ currentAct: 1, currentSubAreaId: AREA, clearedSubAreas: [AREA],
    questProgress: { [MAIN]: { id: MAIN, status: completed ? 'completed' : 'inProgress', rewardClaimed: claimed,
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) } } });
}
function consumedScroll() {
  track();
  useMapStore.getState().updateQuestProgress(MAIN, { objectives: {
    'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': false
  } });
  useInventoryStore.setState({ questItems: { [SCROLL]: { itemId: 'quest/scroll_of_inifuss', state: 'consumed' } } });
}
function rescued(sideClaimed = false) {
  consumedScroll();
  useMapStore.getState().updateQuestProgress(MAIN, { status: 'completed', objectives: {
    'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true
  } });
  useMapStore.setState(state => ({ currentSubAreaId: null, questReceipts: { [RESCUE]: true },
    questProgress: { ...state.questProgress, [SIDE]: { id: SIDE, status: sideClaimed ? 'completed' : 'inProgress',
      rewardClaimed: sideClaimed, objectives: {} } } }));
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Cain source boundary', 'sorceress'));
});
afterEach(reset);

describe('Cain physical recovery/rescue contract before implementation', () => {
  it('authors the actual canonical physical scroll and Akara Give', () => {
    const quest = loadQuests().find(row => row.id === MAIN);
    expect(quest?.objectives[0]).toMatchObject({ id: 'obj-inifuss-tree', type: 'fetch',
      itemId: 'quest/scroll_of_inifuss', targetId: 'objects/inifuss_tree', areaId: AREA });
    expect(quest?.objectives[1]).toMatchObject({ id: 'obj-decode', type: 'give',
      itemId: 'quest/scroll_of_inifuss', npcId: 'npc/akara' });
  });
  it('places the explicit cage at the ruined-village site inside canonical Dark Wood', () => {
    expect(loadQuests().find(row => row.id === MAIN)?.objectives[2]).toMatchObject({
      id: 'obj-rescue-cain', type: 'interact', targetId: 'objects/cain_cage', areaId: AREA
    });
  });
  it('offers real tracked/cleared scroll recovery', () => {
    track(); expect(questToolStatus(SCROLL)).toBe('ready');
  });
  it('recovers the exact owned scroll once without Claim or XP', () => {
    track(); const xp = usePlayerStore.getState().player?.experience;
    expect(recoverQuestTool(SCROLL)).toBe('ok');
    expect(useInventoryStore.getState().questItems[SCROLL]).toEqual({ itemId: 'quest/scroll_of_inifuss', state: 'owned' });
    expect(useMapStore.getState().questProgress[MAIN]?.objectives['obj-inifuss-tree']).toBe(true);
    expect(useMapStore.getState().questProgress[MAIN]?.rewardClaimed).toBe(false);
    expect(usePlayerStore.getState().player?.experience).toBe(xp);
    const after = snapshot(); expect(recoverQuestTool(SCROLL)).toBe('already-owned'); expect(snapshot()).toEqual(after);
  });
  it('consumes only the exact physical scroll at Akara, with no decoded token', () => {
    track(); useMapStore.getState().updateQuestProgress(MAIN, { objectives: {
      'obj-inifuss-tree': true, 'obj-decode': false, 'obj-rescue-cain': false
    } });
    useInventoryStore.setState({ questItems: { [SCROLL]: { itemId: 'quest/scroll_of_inifuss', state: 'owned' } } });
    useMapStore.setState({ currentSubAreaId: null });
    expect(giveQuestItem(SCROLL, 'npc/akara')).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({ [SCROLL]: { itemId: 'quest/scroll_of_inifuss', state: 'consumed' } });
    expect(useMapStore.getState().questProgress[MAIN]?.objectives['obj-decode']).toBe(true);
    expect(useMapStore.getState().questProgress[MAIN]?.objectives['obj-rescue-cain']).toBe(false);
  });
  it('publishes the actual rescue proof and objective together after hand-in', () => {
    consumedScroll(); expect(interactWithAreaObject('objects/cain_cage')).toBe('ok');
    expect(useMapStore.getState().questReceipts[RESCUE]).toBe(true);
    expect(useMapStore.getState().questProgress[MAIN]?.objectives['obj-rescue-cain']).toBe(true);
    expect(useMapStore.getState().questProgress[MAIN]?.rewardClaimed).toBe(false);
  });
  it('authors canonical Act I Cain dialogue while retaining later-act presence definitions', () => {
    expect(loadTownNpcs(1).some(npc => npc.id === 'npc/cain')).toBe(true);
    expect(loadTownNpcs(3).some(npc => npc.id === 'npc/cain')).toBe(true);
  });
  it('requires actual rescue rather than bare completed flags before first Claim', () => {
    track(); useMapStore.getState().updateQuestProgress(MAIN, { status: 'completed', objectives: {
      'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true
    } });
    const before = snapshot(); expect(canClaim(MAIN)).toBe(false); expect(snapshot()).toEqual(before);
  });
  it.each([false, true])('repairs a partial completed legacy journal without changing claimed=%s', claimed => {
    track(claimed, true); useMapStore.getState().updateQuestProgress(MAIN, { objectives: {} });
    const xp = usePlayerStore.getState().player?.experience;
    expect(recoverQuestTool(SCROLL)).toBe('ok');
    expect(useMapStore.getState().questProgress[MAIN]).toEqual({ id: MAIN, status: 'completed', rewardClaimed: claimed,
      objectives: { 'obj-inifuss-tree': true } });
    expect(usePlayerStore.getState().player?.experience).toBe(xp);
  });
  it('publishes a real side Talk receipt only after actual rescue', () => {
    rescued(); useMapStore.getState().recordNpcTalk('npc/cain');
    expect(useMapStore.getState().questReceipts[TALK]).toBe(true);
    expect(useMapStore.getState().questProgress[SIDE]?.objectives['obj-talk']).toBe(true);
  });
  it('permits fresh real Talk to repair a claimed partial side journal without income', () => {
    rescued(true); const xp = usePlayerStore.getState().player?.experience;
    useMapStore.getState().recordNpcTalk('npc/cain');
    expect(useMapStore.getState().questReceipts[TALK]).toBe(true);
    expect(useMapStore.getState().questProgress[SIDE]).toEqual({ id: SIDE, status: 'completed', rewardClaimed: true,
      objectives: { 'obj-talk': true } });
    expect(usePlayerStore.getState().player?.experience).toBe(xp);
  });
  it('preserves already-claimed history without another Claim or writes', () => {
    track(true, true); const before = snapshot();
    expect(claimQuestReward(MAIN)).toBe('already-claimed'); expect(snapshot()).toEqual(before);
  });
  it('refuses Talk proof before rescue without writes', () => {
    track(); useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [SIDE]: { id: SIDE, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-talk': false } } } }));
    const before = snapshot(); useMapStore.getState().recordNpcTalk('npc/cain'); expect(snapshot()).toEqual(before);
  });
  it.each(['untracked', 'uncleared', 'wrong-area', 'wrong-source'])('refuses %s recovery without writes', condition => {
    track();
    if (condition === 'untracked') useMapStore.setState({ questProgress: {} });
    if (condition === 'uncleared') useMapStore.setState({ clearedSubAreas: [] });
    if (condition === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
    const before = snapshot();
    expect(recoverQuestTool(condition === 'wrong-source' ? `${SCROLL}:wrong` : SCROLL)).toBe('not-eligible');
    expect(snapshot()).toEqual(before);
  });
});

function hireRecipient(): string {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing native merc definition');
  const result = useMercStore.getState().hireMerc(def);
  expect(result.ok).toBe(true);
  if (!result.mercId) throw new Error('Missing hired merc');
  useMercStore.getState().setFieldedMerc(result.mercId);
  return result.mercId;
}
function heroXp(): number {
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Missing hero');
  return xpTotal(hero.level) + hero.experience;
}
function recipientXp(id: string): number {
  const merc = useMercStore.getState().ownedMercs.find(row => row.id === id);
  if (!merc) throw new Error('Missing merc recipient');
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function completedSideGraph() {
  rescued();
  useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [TALK]: true },
    questProgress: { ...state.questProgress, [SIDE]: { id: SIDE, status: 'completed',
      rewardClaimed: false, objectives: { 'obj-talk': true } } } }));
}

describe('Cain supported permanent entitlement Claims', () => {
  it('main Claim grants2500 heroXP/1875 captured mercXP once without a finite service charge', () => {
    rescued(); const id = hireRecipient();
    const heroBefore = heroXp(); const mercBefore = recipientXp(id);
    const services = structuredClone(useInventoryStore.getState().questServices);
    expect(canClaim(MAIN)).toBe(true);
    expect(claimQuestReward(MAIN)).toBe('ok');
    expect(heroXp()).toBe(heroBefore + 2500); expect(recipientXp(id)).toBe(mercBefore + 1875);
    expect(useInventoryStore.getState().questServices).toEqual(services);
    expect(useMapStore.getState().questProgress[MAIN]?.rewardClaimed).toBe(true);
    const after = snapshot(); expect(claimQuestReward(MAIN)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });
  it('side Claim grants10wishes once without XP or finite charge', () => {
    completedSideGraph(); const id = hireRecipient();
    const before = snapshot(); const heroBefore = heroXp(); const mercBefore = recipientXp(id);
    const expectedProgress = structuredClone(useMapStore.getState().questProgress);
    const side = expectedProgress[SIDE];
    if (!side) throw new Error('Missing side snapshot');
    side.rewardClaimed = true;
    expect(canClaim(SIDE)).toBe(true); expect(claimQuestReward(SIDE)).toBe('ok');
    expect(heroXp()).toBe(heroBefore); expect(recipientXp(id)).toBe(mercBefore);
    const expected = structuredClone(before);
    const map = expected[1];
    if (!map) throw new Error('Missing map snapshot');
    Object.assign(map, { questProgress: expectedProgress });
    const inventory = expected[2]; if (!inventory) throw new Error('Missing inventory snapshot');
    Object.assign(inventory, { currencies: { wishstone: 10 } });
    expect(snapshot()).toEqual(expected);
    const after = snapshot(); expect(claimQuestReward(SIDE)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });
  it('bare completed main flags cannot publish a first entitlement Claim or income', () => {
    track(false, true); useMapStore.getState().updateQuestProgress(MAIN, { objectives: {
      'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true
    } });
    const before = snapshot(); expect(claimQuestReward(MAIN)).toBe('not-completed'); expect(snapshot()).toEqual(before);
  });
  it('bare completed side flags cannot publish a first entitlement Claim or income', () => {
    useMapStore.setState({ questProgress: { [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-talk': true } } } });
    const before = snapshot(); expect(canClaim(SIDE)).toBe(false);
    expect(claimQuestReward(SIDE)).toBe('not-completed'); expect(snapshot()).toEqual(before);
  });
  it('explicit claimed legacy main proof repair never repeats income or creates a charge', () => {
    track(true, true); const id = hireRecipient();
    const heroBefore = heroXp(); const mercBefore = recipientXp(id);
    const inventory = structuredClone(useInventoryStore.getState().questServices);
    expect(recoverQuestTool(SCROLL)).toBe('ok');
    useMapStore.setState({ currentSubAreaId: null });
    expect(giveQuestItem(SCROLL, 'npc/akara')).toBe('ok');
    useMapStore.setState({ currentSubAreaId: AREA });
    expect(interactWithAreaObject('objects/cain_cage')).toBe('ok');
    expect(claimQuestReward(MAIN)).toBe('already-claimed');
    expect(heroXp()).toBe(heroBefore); expect(recipientXp(id)).toBe(mercBefore);
    expect(useInventoryStore.getState().questServices).toEqual(inventory);
    expect(useMapStore.getState().questProgress[MAIN]?.rewardClaimed).toBe(true);
  });
  it('real Talk repairs a claimed side with no repeated Claim income or finite charge', () => {
    rescued(true); const id = hireRecipient();
    const heroBefore = heroXp(); const mercBefore = recipientXp(id);
    const services = structuredClone(useInventoryStore.getState().questServices);
    useMapStore.getState().recordNpcTalk('npc/cain');
    expect(useMapStore.getState().questReceipts[TALK]).toBe(true);
    expect(claimQuestReward(SIDE)).toBe('already-claimed');
    expect(heroXp()).toBe(heroBefore); expect(recipientXp(id)).toBe(mercBefore);
    expect(useInventoryStore.getState().questServices).toEqual(services);
  });
});
