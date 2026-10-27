/** Constructed real source graph isolates Claim; earning and browser paths have separate evidence. */
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
import { xpTotal } from '@/engine/progression/xp';
import { CAIN_QUEST as MAIN, CAIN_SIDE_QUEST as SIDE, CAIN_SCROLL_SOURCE as SOURCE } from '@/engine/map/cain-quest';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';


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
  const definition = loadMercPool().pool.find(row => row.id === id);
  if (!definition) throw new Error('Missing Cain recipient fixture');
  const merc = createMercFromDef(definition); useMercStore.getState().addMerc(merc); return merc.id;
}
function mercXp(id: string) {
  const merc = useMercStore.getState().ownedMercs.find(row => row.id === id);
  if (!merc) throw new Error('Missing Cain recipient');
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function heroXp() {
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Missing Cain hero');
  return xpTotal(hero.level) + hero.experience;
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Cain Claim', 'sorceress'));
  useMapStore.setState({ currentAct: 1, questProgress: {
    [MAIN]: { id: MAIN, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true } },
    [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } }
  }, questReceipts: { [R.rescueCain]: true, [R.cainTalk]: true } });
  useInventoryStore.setState({ questItems: { [SOURCE]: { itemId: 'quest/scroll_of_inifuss', state: 'consumed' } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('Cain whole-bundle Claim publication', () => {
  it('grants the main XP once to the captured merc even if an observer changes fielded selection', () => {
    const prior = addMerc('mercs/act1-rogue-inner-sight'), later = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(prior);
    const hero = heroXp(), previous = mercXp(prior), other = mercXp(later);
    const stop = usePlayerStore.subscribe(() => { useMercStore.getState().setFieldedMerc(later); });
    try { expect(claimQuestReward(MAIN)).toBe('ok'); } finally { stop(); }
    expect(heroXp()).toBe(hero + 2500); expect(mercXp(prior)).toBe(previous + 1875); expect(mercXp(later)).toBe(other);
    expect(useMercStore.getState().fieldedMercId).toBe(later);
    expect(useInventoryStore.getState().questServices).toEqual({});
    const after = snapshot(); expect(claimQuestReward(MAIN)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });

  it('claims the side permanent entitlement without numeric income or a charge', () => {
    const before = snapshot();
    const expectedProgress = structuredClone(useMapStore.getState().questProgress);
    const side = expectedProgress[SIDE];
    if (!side) throw new Error('Missing side snapshot');
    side.rewardClaimed = true;
    expect(claimQuestReward(SIDE)).toBe('ok');
    const map = before[1];
    if (!map) throw new Error('Missing map snapshot');
    Object.assign(map, { questProgress: expectedProgress });
    expect(snapshot()).toEqual(before);
  });

  it.each([MAIN, SIDE])('%s refuses replay Claims but preserves already-claimed history', quest => {
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const before = snapshot(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed');
    expect(snapshot()).toEqual(before);
    useMapStore.getState().markQuestRewardClaimed(quest);
    const claimed = snapshot(); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(snapshot()).toEqual(claimed);
  });

  it('restores deep participating payloads after a subscriber mutates originals then throws', () => {
    const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id);
    const before = snapshot(), hero = usePlayerStore.getState().player, row = useMapStore.getState().questProgress[MAIN];
    if (!hero || !row) throw new Error('Missing Claim fixture');
    let fired = false;
    const stop = usePlayerStore.subscribe(() => {
      if (fired) return; fired = true;
      Object.assign(hero.coreStats, { strength: hero.coreStats.strength + 17 });
      row.objectives['obj-decode'] = false;
      throw new Error('mutate then throw');
    });
    try { expect(claimQuestReward(MAIN)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual(before); expect(claimQuestReward(MAIN)).toBe('ok');
  });

  it.each([MAIN, SIDE])('%s rejects a silent claimed-flag write failure', quest => {
    const original = useMapStore.getState().markQuestRewardClaimed;
    useMapStore.setState({ markQuestRewardClaimed: () => undefined });
    try {
      const before = snapshot(); expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    } finally { useMapStore.setState({ markQuestRewardClaimed: original }); }
  });

  it('rejects a silent XP write failure before claiming', () => {
    const stop = vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockReturnValue({ levelsGained: 0,
      newLevel: 1, statPointsGranted: 0, skillPointsGranted: 0 });
    const before = snapshot(); expect(claimQuestReward(MAIN)).toBe('grant-failed'); expect(snapshot()).toEqual(before); stop.mockRestore();
  });

  it('restores source/context corruption after publication while preserving unrelated writes', () => {
    const before = snapshot(); let fired = false;
    const expectedProgress = structuredClone(useMapStore.getState().questProgress);
    const expectedItems = { ...structuredClone(useInventoryStore.getState().questItems),
      'observer-source': { itemId: 'observer-item', state: 'owned' as const } };
    const originalMain = expectedProgress[MAIN];
    if (!originalMain) throw new Error('Missing main snapshot');
    const stop = useMapStore.subscribe(() => {
      if (fired) return; fired = true;
      useMapStore.setState(state => ({ currentAct: 2, questProgress: { ...state.questProgress,
        [MAIN]: { ...originalMain, objectives: {} },
        'quests/observer': { id: 'quests/observer', status: 'available', objectives: {} } } }));
      useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
        [SOURCE]: { itemId: 'quest/scroll_of_inifuss', state: 'owned' },
        'observer-source': { itemId: 'observer-item', state: 'owned' } } }));
    });
    try { expect(claimQuestReward(SIDE)).toBe('grant-failed'); } finally { stop(); }
    const map = before[1], inventory = before[2];
    if (!map || !inventory) throw new Error('Missing participant snapshots');
    expectedProgress['quests/observer'] = { id: 'quests/observer', status: 'available', objectives: {} };
    Object.assign(map, { questProgress: expectedProgress });
    Object.assign(inventory, { questItems: expectedItems });
    expect(snapshot()).toEqual(before);
  });

  it('holds the shared lease through reward and claimed publications', () => {
    const results: string[] = [];
    const stopHero = usePlayerStore.subscribe(() => { results.push(claimQuestReward(SIDE)); });
    const stopMap = useMapStore.subscribe(() => { results.push(claimQuestReward(MAIN)); });
    try { expect(claimQuestReward(MAIN)).toBe('ok'); } finally { stopHero(); stopMap(); }
    expect(results).toEqual(['claim-in-progress', 'claim-in-progress']);
  });

  it('detects an equipped legacy-affix Map mutation during Claim and restores its exact entries', () => {
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing legacy-affix hero');
    const values = new Map([['strength', 2]]);
    const equipment = [{ id: 'legacy-map-cap', baseId: 'items/base/helm-cap', rarity: 'magic' as const,
      level: 1, identified: true, equipped: true, equipSlot: 'head' as const,
      affixes: [{ affixId: 'legacy-strength', values }] }];
    usePlayerStore.setState({ player: { ...hero, equipment } });
    const before = snapshot(); let fired = false;
    const stop = useMapStore.subscribe(() => { if (!fired) { fired = true; values.set('strength', 999); } });
    try { expect(claimQuestReward(SIDE)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual(before);
  });

  it('detects a changed sparse equipment-array length during Claim', () => {
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing sparse-array hero');
    const equipment: typeof hero.equipment[number][] = [];
    usePlayerStore.setState({ player: { ...hero, equipment } });
    const before = snapshot(); let fired = false;
    const stop = useMapStore.subscribe(() => { if (!fired) { fired = true; equipment.length = 1; } });
    try { expect(claimQuestReward(SIDE)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual(before);
  });

  it('rejects a silent captured-recipient XP failure and restores the hero reward', () => {
    const id = addMerc('mercs/act1-rogue-inner-sight'); useMercStore.getState().setFieldedMerc(id);
    const before = snapshot(), progress = structuredClone(useMercStore.getState().mercProgress);
    const recipient = structuredClone(useMercStore.getState().ownedMercs);
    let fired = false;
    const stop = useMercStore.subscribe(() => {
      if (fired) return; fired = true;
      useMercStore.setState({ ownedMercs: recipient, mercProgress: progress });
    });
    try {
      expect(claimQuestReward(MAIN)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    } finally { stop(); }
  });

  it('attempts every restoration, reports every observer error, preserves recipient order and releases the lease', () => {
    const id = addMerc('mercs/act1-rogue-inner-sight'); addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(id);
    const before = snapshot(), counts = [0, 0, 0, 0], errors = ['hero', 'merc', 'inventory', 'map'];
    const domains = [usePlayerStore, useMercStore, useInventoryStore, useMapStore] as const;
    const stops = domains.map((store, index) => store.subscribe(() => {
      counts[index] = (counts[index] ?? 0) + 1;
      expect(claimQuestReward(SIDE)).toBe('claim-in-progress');
      throw new Error(errors[index]);
    }));
    let caught: unknown;
    try { claimQuestReward(MAIN); } catch (error) { caught = error; } finally { for (const stop of stops) stop(); }
    expect(caught).toBeInstanceOf(AggregateError);
    if (!(caught instanceof AggregateError)) throw new Error('Missing explicit restoration failure');
    expect(caught.errors.map((error: unknown) => error instanceof Error ? error.message : String(error))).toEqual(errors);
    expect(counts).toEqual([2, 1, 1, 1]); expect(snapshot()).toEqual(before);
    expect(claimQuestReward(MAIN)).toBe('ok');
  });
  it.each(['hero-publication', 'merc-publication', 'claimed-publication', 'renamed-collision'])('restores immutable captured merc identity during %s without duplicate actors or wrong XP', stage => {
    const id = addMerc('mercs/act1-rogue-inner-sight'), other = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(id);
    const original = useMercStore.getState().ownedMercs.find(merc => merc.id === id);
    if (!original) throw new Error('Missing captured recipient');
    const before = snapshot(), previous = mercXp(id), unrelated = mercXp(other); let fired = false;
    const store = stage === 'merc-publication' ? useMercStore : stage === 'claimed-publication' ? useMapStore : usePlayerStore;
    const stop = store.subscribe(() => {
      if (fired) return; fired = true;
      Object.assign(original, { id: stage === 'renamed-collision' ? other : 'observer-renamed-recipient' });
      if (stage === 'claimed-publication') useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs, original] }));
      throw new Error('mutated captured recipient');
    });
    try { expect(claimQuestReward(MAIN)).toBe('grant-failed'); } finally { stop(); }
    expect(fired).toBe(true); expect(snapshot()).toEqual(before); expect(claimQuestReward(MAIN)).toBe('ok');
    expect(mercXp(id)).toBe(previous + 1875); expect(mercXp(other)).toBe(unrelated);
  });

  it.each(['silent-original-reinsertion', 'published-renamed', 'published-collision', 'published-moved'])(
    'restores exact captured recipient and unrelated actors after %s', stage => {
      const id = addMerc('mercs/act1-rogue-inner-sight'), other = addMerc('mercs/act1-rogue-fire');
      useMercStore.getState().setFieldedMerc(id);
      const original = useMercStore.getState().ownedMercs.find(merc => merc.id === id);
      if (!original) throw new Error('Missing captured recipient');
      const before = snapshot(), previous = mercXp(id), unrelated = mercXp(other); let fired = false;
      const stop = useMercStore.subscribe(() => {
        if (fired) return; fired = true;
        const published = useMercStore.getState().ownedMercs.find(merc => merc.id === id);
        if (!published || published === original) throw new Error('Expected native grown recipient');
        if (stage === 'silent-original-reinsertion') {
          Object.assign(original, { id: 'silently-reinserted-original' });
          useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs, original] }));
          return;
        }
        Object.assign(published, { id: stage === 'published-collision' ? other : 'renamed-published-recipient' });
        if (stage === 'published-moved') {
          useMercStore.setState(state => ({ ownedMercs: [...state.ownedMercs.filter(merc => merc !== published), published] }));
        }
        throw new Error('mutated published recipient');
      });
      try { expect(claimQuestReward(MAIN)).toBe('grant-failed'); } finally { stop(); }
      expect(fired).toBe(true); expect(snapshot()).toEqual(before);
      expect(claimQuestReward(MAIN)).toBe('ok');
      expect(mercXp(id)).toBe(previous + 1875); expect(mercXp(other)).toBe(unrelated);
    }
  );

});
