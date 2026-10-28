/** D11 once-only source Claims. Constructed real-store fixtures; no earned acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';
import * as questLoader from '@/data/loaders/quests';
import * as itemRoller from '@/engine/loot/rollItem';
import { xpTotal } from '@/engine/progression/xp';
import { validateCurrentCampaignRewards } from '@/engine/save/current-campaign';
import { MALUS_QUEST as MAIN, MALUS_SOURCE, MALUS_ITEM } from '@/engine/map/malus-quest';
import { ACT1_IMBUE_SOURCES as SOURCES, ACT1_QUEST_RECEIPTS as RECEIPTS } from '@/engine/map/act1-quest-sources';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';

const SIDE = 'quests/side-act1-charsis-imbue';
const stores = [usePlayerStore, useMapStore, useInventoryStore, useMercStore, useMetaStore, useFormationStore] as const;
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests(); useCombatStore.getState().reset();
  for (const store of stores) store.getState().reset();
}
function snapshot() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
function addMerc(id: string) {
  const def = loadMercPool().pool.find(row => row.id === id); if (!def) throw new Error('Missing imbue mercenary fixture');
  const merc = createMercFromDef(def); useMercStore.getState().addMerc(merc); return merc.id;
}
function mercXp(id: string) {
  const merc = useMercStore.getState().ownedMercs.find(row => row.id === id); if (!merc) throw new Error('Missing recipient');
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function heroXp() {
  const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing imbue hero');
  return xpTotal(hero.level) + hero.experience;
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Imbue Claim', 'sorceress'));
  useMapStore.setState({ currentAct: 1, questProgress: {
    [MAIN]: { id: MAIN, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-recover-malus': true, 'obj-imbue-ready': true } },
    [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-bring-item': true } }
  }, questReceipts: { [RECEIPTS.presentItem]: true } });
  useInventoryStore.setState({ questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('D11 Malus and side Present whole-bundle Claims', () => {
  it('authors exactly main3500XP+one charge and side one charge with no random item', () => {
    const quests = questLoader.loadQuests();
    expect(quests.find(row => row.id === MAIN)?.rewards).toEqual({ xp: 3500, service: 'imbue_item' });
    expect(quests.find(row => row.id === SIDE)?.rewards).toEqual({ service: 'imbue_item' });
  });
  it('claims main without side Present and shares2625XP with the previously fielded mercenary', () => {
    const prior = addMerc('mercs/act1-rogue-inner-sight'), later = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(prior);
    const main = useMapStore.getState().questProgress[MAIN]; if (!main) throw new Error('Missing main');
    useMapStore.setState({ questProgress: { [MAIN]: main }, questReceipts: {} });
    const hero = heroXp(), previous = mercXp(prior), other = mercXp(later);
    const inv = structuredClone(snapshot()[2]);
    const stop = usePlayerStore.subscribe(() => { useMercStore.getState().setFieldedMerc(later); });
    try { expect(canClaim(MAIN)).toBe(true); expect(claimQuestReward(MAIN)).toBe('ok'); } finally { stop(); }
    expect(heroXp()).toBe(hero + 3500); expect(mercXp(prior)).toBe(previous + 2625); expect(mercXp(later)).toBe(other);
    expect(useMercStore.getState().fieldedMercId).toBe(later);
    if (!inv) throw new Error('Missing inventory snapshot');
    Object.assign(inv, { questServices: { [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } } });
    expect(snapshot()[2]).toEqual(inv);
    const after = snapshot(); expect(claimQuestReward(MAIN)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });
  it('side Claim changes only its own charge and Claim, even before main Claim', () => {
    const before = snapshot(), progress = structuredClone(useMapStore.getState().questProgress);
    const side = progress[SIDE]; if (!side) throw new Error('Missing side'); side.rewardClaimed = true;
    expect(canClaim(SIDE)).toBe(true); expect(claimQuestReward(SIDE)).toBe('ok');
    const map = before[1], inv = before[2]; if (!map || !inv) throw new Error('Missing participants');
    Object.assign(map, { questProgress: progress });
    Object.assign(inv, { questServices: { [SOURCES.side]: { serviceId: 'imbue_item', state: 'available' } } });
    expect(snapshot()).toEqual(before);
  });
  it.each([[MAIN, SIDE], [SIDE, MAIN]] as const)('earns %s then %s once with exactly two independent charges', (first, second) => {
    const before = heroXp(); expect(claimQuestReward(first)).toBe('ok'); expect(claimQuestReward(second)).toBe('ok');
    expect(heroXp()).toBe(before + 3500);
    expect(useInventoryStore.getState().questServices).toEqual({
      [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' },
      [SOURCES.side]: { serviceId: 'imbue_item', state: 'available' }
    });
    const after = snapshot(); expect(claimQuestReward(first)).toBe('already-claimed');
    expect(claimQuestReward(second)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });
  it.each([MAIN, SIDE])('%s requires a real hand-in instead of bare legacy completed flags', quest => {
    useInventoryStore.setState({ questItems: {} }); useMapStore.setState({ questReceipts: {} });
    const before = snapshot(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed');
    expect(snapshot()).toEqual(before);
  });
  it('refuses side Claim with an old objective flag and no actual Present receipt', () => {
    useMapStore.setState({ questReceipts: {} });
    const before = snapshot(); expect(canClaim(SIDE)).toBe(false); expect(claimQuestReward(SIDE)).toBe('not-completed');
    expect(snapshot()).toEqual(before);
  });
  it.each([MAIN, SIDE])('%s refuses replay acquisition while keeping already-claimed history write-free', quest => {
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const before = snapshot(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed');
    expect(snapshot()).toEqual(before); useMapStore.getState().markQuestRewardClaimed(quest);
    useInventoryStore.setState({ questItems: {} }); useMapStore.setState({ questReceipts: {} });
    const claimed = snapshot(); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(snapshot()).toEqual(claimed);
  });
  it.each([MAIN, SIDE])('%s refuses an unsupported whole-bundle addition before any effect', quest => {
    const definitions = questLoader.loadQuests();
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(definitions.map(row => row.id === quest
      ? { ...row, rewards: { ...row.rewards, futureReward: 1 } } : row));
    const before = snapshot(); expect(claimQuestReward(quest)).toBe('unsupported-rewards'); expect(snapshot()).toEqual(before);
  });
  it.each([MAIN, SIDE])('%s refuses a supported but disallowed item allocation before construction', quest => {
    const definitions = questLoader.loadQuests();
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(definitions.map(row => row.id === quest
      ? { ...row, rewards: { ...row.rewards, itemDrop: { uniqueId: 'items/unique/pelta-lunata', ilvl: 2 } } } : row));
    // Observe the actual constructor: the default spy still calls native code.
    const allocation = vi.spyOn(itemRoller, 'rollUniqueItem');
    const before = snapshot();
    expect(claimQuestReward(quest)).toBe('unsupported-rewards');
    expect(allocation).not.toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
  });
  it.each([MAIN, SIDE])('%s detects a silent charge publication failure and restores its full bundle', quest => {
    if (quest === MAIN) { const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id); }
    const source = quest === MAIN ? SOURCES.main : SOURCES.side, before = snapshot(); let fired = false;
    const stop = useInventoryStore.subscribe(() => {
      if (fired || !Object.hasOwn(useInventoryStore.getState().questServices, source)) return;
      fired = true; useInventoryStore.setState(state => {
        const services = { ...state.questServices }; Reflect.deleteProperty(services, source); return { questServices: services };
      });
    });
    try { expect(claimQuestReward(quest)).toBe('grant-failed'); } finally { stop(); }
    expect(fired).toBe(true); expect(snapshot()).toEqual(before); expect(claimQuestReward(quest)).toBe('ok');
  });
  it.each([MAIN, SIDE])('%s detects a silent claimed-last failure and rolls back charge/income', quest => {
    if (quest === MAIN) { const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id); }
    const original = useMapStore.getState().markQuestRewardClaimed;
    useMapStore.setState({ markQuestRewardClaimed: () => undefined });
    try { const before = snapshot(); expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before); }
    finally { useMapStore.setState({ markQuestRewardClaimed: original }); }
  });
  it('refuses a silent hero XP failure before claiming or leaving a charge', () => {
    const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id);
    const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing hero');
    const fault = vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockReturnValue({ levelsGained: 0,
      newLevel: hero.level, statPointsGranted: 0, skillPointsGranted: 0 });
    const before = snapshot(); expect(claimQuestReward(MAIN)).toBe('grant-failed');
    expect(fault).toHaveBeenCalled(); expect(snapshot()).toEqual(before);
  });
  it('refuses a silent captured merc XP failure and restores hero income and charge', () => {
    const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id);
    const before = snapshot(), progress = structuredClone(useMercStore.getState().mercProgress);
    const mercs = structuredClone(useMercStore.getState().ownedMercs); let fired = false;
    const stop = useMercStore.subscribe(() => {
      if (fired) return; fired = true; useMercStore.setState({ ownedMercs: mercs, mercProgress: progress });
    });
    try { expect(claimQuestReward(MAIN)).toBe('grant-failed'); } finally { stop(); }
    expect(fired).toBe(true); expect(snapshot()).toEqual(before); expect(claimQuestReward(MAIN)).toBe('ok');
  });
  it('restores deep physical proof, journal, hero and source after mutate-then-throw, preserving unrelated writes', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(recipient);
    const before = snapshot(), hero = usePlayerStore.getState().player;
    const main = useMapStore.getState().questProgress[MAIN]; if (!hero || !main) throw new Error('Missing participants');
    let fired = false;
    const stop = usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; Object.assign(hero.coreStats, { strength: hero.coreStats.strength + 17 });
      main.objectives['obj-imbue-ready'] = false;
      useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
        [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'owned' }, 'observer-source': { itemId: 'observer-item', state: 'owned' } } }));
      useMapStore.setState(state => ({ currentAct: 2, questProgress: { ...state.questProgress,
        'quests/observer': { id: 'quests/observer', status: 'available', objectives: {} } } }));
      throw new Error('mutated imbue Claim');
    });
    try { expect(() => claimQuestReward(MAIN)).toThrow(AggregateError); } finally { stop(); }
    expect(fired).toBe(true); const map = before[1], inv = before[2]; if (!map || !inv) throw new Error('Missing snapshots');
    Object.assign(map, { questProgress: { ...Reflect.get(map, 'questProgress') as object,
      'quests/observer': { id: 'quests/observer', status: 'available', objectives: {} } } });
    Object.assign(inv, { questItems: { ...Reflect.get(inv, 'questItems') as object,
      'observer-source': { itemId: 'observer-item', state: 'owned' } } });
    expect(snapshot()).toEqual(before);
  });
  it('reports unresolved unearned unlock damage after restoring every scoped Claim participant', () => {
    const before = snapshot(); let fired = false, caught: unknown;
    const map = useMapStore.getState(), inv = useInventoryStore.getState();
    expect(() => { validateCurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame); }).not.toThrow();
    const stop = useInventoryStore.subscribe(() => {
      if (fired || !useInventoryStore.getState().questServices[SOURCES.side]) return;
      fired = true; useMapStore.setState({ questDifficulties: { 'difficulty/nightmare': true } });
      throw new Error('injected unearned unlock');
    });
    try { claimQuestReward(SIDE); } catch (error) { caught = error; } finally { stop(); }
    expect(fired).toBe(true);
    const expectedMap = before[1]; if (!expectedMap) throw new Error('Missing map snapshot');
    Object.assign(expectedMap, { questDifficulties: { 'difficulty/nightmare': true } });
    expect(snapshot()).toEqual(before);
    const restoredMap = useMapStore.getState(), restoredInv = useInventoryStore.getState();
    expect(() => { validateCurrentCampaignRewards(restoredMap, restoredInv.questItems, restoredInv.questServices, restoredMap.endgame); }).toThrow();
    expect(caught).toBeInstanceOf(AggregateError);
  });
  it('holds the shared lease through XP, charge, claimed-last and all restorations', () => {
    const outcomes: string[] = [];
    const stops = [usePlayerStore, useInventoryStore, useMapStore].map(store => store.subscribe(() => {
      outcomes.push(claimQuestReward(SIDE));
    }));
    try { expect(claimQuestReward(MAIN)).toBe('ok'); } finally { stops.forEach(stop => { stop(); }); }
    expect(outcomes.length).toBeGreaterThanOrEqual(3);
    expect(outcomes.every(value => value === 'claim-in-progress')).toBe(true);
  });
  it('attempts every participant restoration and reports failures while releasing the lease', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(recipient);
    const before = snapshot(), names = ['hero', 'merc', 'inventory', 'map'];
    const attempts: { domain: string; nested: string }[] = [];
    const stops = [usePlayerStore, useMercStore, useInventoryStore, useMapStore].map((store, index) => store.subscribe(() => {
      attempts.push({ domain: String(names[index]), nested: claimQuestReward(SIDE) });
      throw new Error('restore-' + String(names[index]));
    }));
    let caught: unknown;
    try { claimQuestReward(MAIN); } catch (error) { caught = error; } finally { stops.forEach(stop => { stop(); }); }
    expect(caught).toBeInstanceOf(AggregateError);
    if (!(caught instanceof AggregateError)) throw new Error('Missing restoration failure');
    const messages = caught.errors.map((error: unknown) => error instanceof Error ? error.message : String(error));
    expect(messages).toEqual(expect.arrayContaining(names.map(name => 'restore-' + name)));
    expect(new Set(attempts.map(row => row.domain))).toEqual(new Set(names));
    expect(attempts.filter(row => row.domain === 'hero').length).toBeGreaterThanOrEqual(2);
    expect(attempts.every(row => row.nested === 'claim-in-progress')).toBe(true);
    expect(snapshot()).toEqual(before); expect(claimQuestReward(MAIN)).toBe('ok');
  });
});
