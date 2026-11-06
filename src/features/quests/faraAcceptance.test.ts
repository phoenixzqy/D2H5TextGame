/** Constructed Act II capabilities; no claim of owner-earned campaign or economy evidence. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores,
  useHydrationStore } from '@/stores/persistence';
import { executeLiveMaterialAction, prepareLiveMaterialAction } from '@/stores/materialActions';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { canClaim, claimQuestReward } from './claimReward';

const QUEST = 'quests/side-act2-fara-favored';
const RECEIPT = 'quests/side-act2-fara-favored#action:talk-fara';
const RADAMENT = 'quests/act2-radaments-lair';
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing independent Fara fixture');
  return value;
}
const hero = () => required(usePlayerStore.getState().player);
function actors() {
  const mercs = useMercStore.getState();
  return structuredClone({ hero: hero(), ownedMercs: mercs.ownedMercs, mercProgress: mercs.mercProgress,
    fieldedMercId: mercs.fieldedMercId, mercEquipment: mercs.mercEquipment });
}
function state() {
  const inventory = useInventoryStore.getState(), map = useMapStore.getState();
  return structuredClone({ ...actors(), currencies: inventory.currencies, materials: inventory.materials,
    backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    questItems: inventory.questItems, questServices: inventory.questServices,
    questProgress: map.questProgress, questReceipts: map.questReceipts });
}
function ring(id = 'independent-fara-ring'): Item {
  return { id, baseId: 'items/base/ring', rarity: 'normal', level: 1,
    identified: true, equipped: false };
}
function talk() {
  useMapStore.getState().recordNpcTalk('npc/fara');
  expect(useMapStore.getState().questReceipts[RECEIPT]).toBe(true);
  expect(useMapStore.getState().questProgress[QUEST]).toEqual({ id: QUEST,
    status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } });
}
async function importedStale(nearThreshold = false, gear = false) {
  const current = hero();
  const derivedStats = deriveEquippedPlayerStats(current, current.level, {},
    useMapStore.getState().questProgress, {}, {});
  usePlayerStore.setState({ player: { ...current,
    experience: nearThreshold ? xpRequired(current.level) - 1 : 0,
    derivedStats: { ...derivedStats, defense: derivedStats.defense + 7 } } });
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-recruit'));
  const fresh = createMercFromDef(def, 'fara-imported');
  const merc = { ...fresh, derivedStats: { ...fresh.derivedStats,
    defense: fresh.derivedStats.defense + 11, life: 13, mana: 3 } };
  useMercStore.getState().addMerc(merc); useMercStore.getState().setFieldedMerc(merc.id);
  if (gear) useInventoryStore.getState().addItem(ring());
  const accepted = actors();
  // The actual public export is imported unchanged, with no post-import cache patch.
  await importIntoStores(required(exportCurrentSave()));
  expect(actors()).toEqual(accepted);
  return accepted;
}
function onGrant(action: () => void) {
  const initial = useInventoryStore.getState().currencies['gem-shard'] ?? 0;
  let fired = false;
  stops.push(useInventoryStore.subscribe(current => {
    if (fired || current.currencies['gem-shard'] !== initial + 1) return;
    fired = true; action();
  }));
  return () => { expect(fired).toBe(true); };
}
function stopObservers() {
  stops.splice(0).forEach(stop => { stop(); });
}
function setBalance(value: number | undefined) {
  const { ['gem-shard']: _old, ...wallet } = useInventoryStore.getState().currencies;
  void _old;
  useInventoryStore.setState({ currencies: value === undefined ? wallet : { ...wallet, 'gem-shard': value } });
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Independent Fara acceptance', 'sorceress');
  const player = { ...fresh, id: 'fara-acceptance-hero', level: 35, equipment: [],
    experience: 0, experienceToNextLevel: xpRequired(35), statPoints: 11, skillPoints: 3 };
  const derivedStats = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...derivedStats, life: 7, mana: 3 } });
  useInventoryStore.setState({ currencies: { gold: 41, gemShards: 23, unrelated: 19 } });
  // Radament is completed but its reward is unclaimed; no Book of Skill was received/read.
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-far-oasis',
    selectedDifficulty: 'normal', clearedSubAreas: ['areas/act1-catacombs'], questProgress: {
      [RADAMENT]: { id: RADAMENT, status: 'completed', rewardClaimed: false,
        objectives: { 'obj-kill-radament': true } },
      [QUEST]: { id: QUEST, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-talk': false } }
    } });
});
afterEach(() => {
  stopObservers(); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests();
  stores.forEach(store => { store.getState().reset(); });
});

describe('Fara independent public currency-only acceptance', () => {
  it('imports accepted stale caches, earns only an actual Talk receipt, then separately claims one canonical shard without any actor write', async () => {
    const accepted = await importedStale(), wallet = structuredClone(useInventoryStore.getState().currencies);
    let heroWrites = 0, mercWrites = 0;
    stops.push(usePlayerStore.subscribe(() => { heroWrites++; }), useMercStore.subscribe(() => { mercWrites++; }));
    const gain = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const raw = vi.spyOn(usePlayerStore.getState(), 'addXP');
    const recompose = vi.spyOn(usePlayerStore.getState(), 'recomputeDerived');
    const mercGain = vi.spyOn(useMercStore.getState(), 'addExperience');
    expect(canClaim(QUEST)).toBe(false);
    talk();
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(actors()).toEqual(accepted);
    expect(canClaim(QUEST)).toBe(true);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, 'gem-shard': 1, wishstone: 10 });
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useInventoryStore.getState().questServices).toEqual({});
    expect(useMapStore.getState().questReceipts[RECEIPT]).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    expect(actors()).toEqual(accepted);
    expect({ heroWrites, mercWrites }).toEqual({ heroWrites: 0, mercWrites: 0 });
    for (const spy of [gain, raw, recompose, mercGain]) expect(spy).not.toHaveBeenCalled();
    const paid = state();
    useMapStore.getState().recordNpcTalk('npc/fara');
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(state()).toEqual(paid);
  });

  it.each(['missing-main', 'incomplete-main', 'false-objective', 'other-npc'] as const)('does not earn receipt or payment for %s', invalid => {
    useMapStore.setState(current => {
      const progress = { ...current.questProgress };
      if (invalid === 'missing-main') Reflect.deleteProperty(progress, RADAMENT);
      if (invalid === 'incomplete-main') progress[RADAMENT] = { id: RADAMENT,
        status: 'inProgress', objectives: { 'obj-kill-radament': true } };
      if (invalid === 'false-objective') progress[RADAMENT] = { id: RADAMENT,
        status: 'completed', objectives: { 'obj-kill-radament': false } };
      return { questProgress: progress };
    });
    const before = state();
    useMapStore.getState().recordNpcTalk(invalid === 'other-npc' ? 'npc/atma' : 'npc/fara');
    expect(Object.hasOwn(useMapStore.getState().questReceipts, RECEIPT)).toBe(false);
    expect(canClaim(QUEST)).toBe(false);
    expect(claimQuestReward(QUEST)).not.toBe('ok');
    expect(state()).toEqual(before);
  });

  it('requires actual re-Talk for source-free completed history and never compensates already claimed legacy history', () => {
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', objectives: { 'obj-talk': true } });
    const wallet = structuredClone(useInventoryStore.getState().currencies);
    expect(canClaim(QUEST)).toBe(false);
    expect(claimQuestReward(QUEST)).not.toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    talk(); expect(claimQuestReward(QUEST)).toBe('ok');
    useMapStore.setState(current => ({ questReceipts: Object.fromEntries(
      Object.entries(current.questReceipts).filter(([source]) => source !== RECEIPT)) }));
    const legacy = state();
    useMapStore.getState().recordNpcTalk('npc/fara');
    expect(claimQuestReward(QUEST)).not.toBe('ok');
    expect(state()).toEqual(legacy);
  });

  it.each(['receipt', 'row'] as const)('restores a real Talk %s observer fault and retries without automatic payment', boundary => {
    const before = state(); let fired = false;
    stops.push(useMapStore.subscribe(current => {
      const reached = boundary === 'receipt' ? current.questReceipts[RECEIPT] === true
        : current.questProgress[QUEST]?.status === 'completed';
      if (fired || !reached) return;
      fired = true; throw new Error(`Talk ${boundary} fault`);
    }));
    useMapStore.getState().recordNpcTalk('npc/fara');
    expect(fired).toBe(true); expect(state()).toEqual(before);
    stopObservers(); talk();
    expect(useInventoryStore.getState().currencies).toEqual(before.currencies);
    expect(claimQuestReward(QUEST)).toBe('ok');
  });

  describe.each(['wallet', 'claimed'] as const)('%s publication', boundary => {
    it.each(['before', 'after', 'noop'] as const)('%s failure leaves exact graph/cache/wallet and retries once', async mode => {
      await importedStale(); talk(); const before = state();
      let heroWrites = 0, mercWrites = 0;
      stops.push(usePlayerStore.subscribe(() => { heroWrites++; }), useMercStore.subscribe(() => { mercWrites++; }));
      let reached = false, paidAtMarker: number | undefined;
      const fail = () => { throw new Error(`${boundary} ${mode}`); };
      let restore: () => void;
      if (boundary === 'wallet') {
        const real = useInventoryStore.getState().addQuestGemShard;
        const spy = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard').mockImplementation(handle => {
          reached = true;
          if (mode === 'before') return fail();
          if (mode === 'noop') return;
          real(handle); return fail();
        });
        restore = () => { spy.mockRestore(); };
      } else {
        const real = useMapStore.getState().markQuestRewardClaimed;
        const spy = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
          reached = true; paidAtMarker = useInventoryStore.getState().currencies['gem-shard'];
          if (mode === 'before') return fail();
          if (mode === 'noop') return;
          real(id); return fail();
        });
        restore = () => { spy.mockRestore(); };
      }
      expect(claimQuestReward(QUEST)).toBe('grant-failed');
      expect(reached).toBe(true);
      if (boundary === 'claimed') expect(paidAtMarker).toBe(1);
      expect(state()).toEqual(before);
      expect({ heroWrites, mercWrites }).toEqual({ heroWrites: 0, mercWrites: 0 });
      restore(); expect(claimQuestReward(QUEST)).toBe('ok');
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
      expect(claimQuestReward(QUEST)).toBe('already-claimed');
      expect({ heroWrites, mercWrites }).toEqual({ heroWrites: 0, mercWrites: 0 });
    });
  });

  it('direct spend refuses before debit during actual Fara Claim and releases after rollback and retry', () => {
    talk(); const before = state();
    let refusal: unknown, balanceBefore: number | undefined, balanceAfter: number | undefined;
    const fired = onGrant(() => {
      balanceBefore = useInventoryStore.getState().currencies['gem-shard'];
      try { useInventoryStore.getState().spendCurrency('gem-shard', 1); } catch (error) { refusal = error; }
      balanceAfter = useInventoryStore.getState().currencies['gem-shard'];
      throw new Error('fault after actual direct debit attempt');
    });
    let result: ReturnType<typeof claimQuestReward> | undefined, claimError: unknown;
    try { result = claimQuestReward(QUEST); } catch (error) { claimError = error; }
    fired();
    // Keep this first: the controlled missing-fence stage must fail on the actual debit refusal.
    expect(refusal).toBeInstanceOf(WaveGuardError);
    expect(String(refusal)).toContain('questBusy');
    expect({ balanceBefore, balanceAfter }).toEqual({ balanceBefore: 1, balanceAfter: 1 });
    expect(claimError).toBeUndefined(); expect(result).toBe('grant-failed');
    expect(state()).toEqual(before);
    stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
  });

  it('negative addCurrency cannot bypass the unsettled key fence while unrelated currency spending remains independent', () => {
    talk(); let refusal: unknown, balanceAfter: number | undefined, unrelatedSpent: boolean | undefined;
    const fired = onGrant(() => {
      try { useInventoryStore.getState().addCurrency('gem-shard', -1); } catch (error) { refusal = error; }
      balanceAfter = useInventoryStore.getState().currencies['gem-shard'];
      unrelatedSpent = useInventoryStore.getState().spendCurrency('unrelated', 2);
      throw new Error('fault after negative ingress attempt');
    });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
    expect(refusal).toBeInstanceOf(Error); expect(balanceAfter).toBe(1); expect(unrelatedSpent).toBe(true);
    expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(false);
    expect(useInventoryStore.getState().currencies.unrelated).toBe(17);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(false);
  });

  describe.each([undefined, 0] as const)('baseline %s presence', baseline => {
    it.each([0, 3])('keeps independently added %s including own-key creation after a fault', independent => {
      setBalance(baseline); talk();
      const fired = onGrant(() => {
        useInventoryStore.getState().addCurrency('gem-shard', independent);
        useInventoryStore.getState().addCurrency('unrelated', 5);
        throw new Error('fault after independently attributed additions');
      });
      expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(independent);
      expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(true);
      expect(useInventoryStore.getState().currencies.unrelated).toBe(24);
      expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(false);
      stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok');
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(independent + 1);
    });
    it('permits an independent positive addition during successful settlement', () => {
      setBalance(baseline); talk();
      const fired = onGrant(() => { useInventoryStore.getState().addCurrency('gem-shard', 4); });
      expect(claimQuestReward(QUEST)).toBe('ok'); fired();
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
      expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    });
  });

  it('attributes additions during rollback without losing the previous independent addition or leaking ownership', () => {
    talk(); let stage = 0;
    stops.push(useInventoryStore.subscribe(current => {
      const amount = current.currencies['gem-shard'];
      if (stage === 0 && amount === 1) {
        stage = 1; useInventoryStore.getState().addCurrency('gem-shard', 2);
        throw new Error('begin rollback');
      }
      if (stage === 1 && amount === 2) {
        stage = 2; useInventoryStore.getState().addCurrency('gem-shard', 3);
      }
    }));
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); expect(stage).toBe(2);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
    stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 6)).toBe(true);
  });

  it('reports an ambiguous raw overwrite explicitly without erasing it or marking the quest paid', () => {
    talk();
    const fired = onGrant(() => {
      useInventoryStore.setState(current => ({ currencies: { ...current.currencies, 'gem-shard': 500 } }));
      throw new Error('unsupported raw competing overwrite');
    });
    expect(() => claimQuestReward(QUEST)).toThrow(AggregateError); fired();
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(500);
    expect(useMapStore.getState().questReceipts[RECEIPT]).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(false);
    stopObservers();
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
  });

  it.each(['real-xp', 'raw-xp', 'equipment', 'damage'] as const)('preserves actual independent %s semantics after a currency fault', async mode => {
    await importedStale(mode === 'real-xp' || mode === 'raw-xp', mode === 'equipment'); talk();
    const before = structuredClone(hero());
    let expected: ReturnType<typeof actors> | undefined;
    let equipResult: ReturnType<ReturnType<typeof useInventoryStore.getState>['equipItem']> | undefined;
    const fired = onGrant(() => {
      if (mode === 'real-xp') usePlayerStore.getState().gainExperience(2);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(2);
      if (mode === 'equipment') equipResult = useInventoryStore.getState().equipItem(required(useInventoryStore.getState().backpack[0]), 'ring-left');
      if (mode === 'damage') {
        const current = hero();
        usePlayerStore.setState({ player: { ...current, derivedStats: { ...current.derivedStats, life: 3, mana: 2 } } });
      }
      expected = actors();
      throw new Error(`fault after independent ${mode}`);
    });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
    expect(expected).toBeDefined(); expect(actors()).toEqual(expected);
    if (mode === 'real-xp') {
      expect(hero().level).toBe(before.level + 1);
      expect(hero().experience).toBe(1);
      expect(hero().statPoints).toBe(before.statPoints + 5);
      // Level 36 earns the existing milestone point as well as its level point.
      expect(hero().skillPoints).toBe(before.skillPoints + 2);
    }
    if (mode === 'raw-xp') {
      expect(hero().level).toBe(before.level);
      expect(hero().experience).toBe(before.experience + 2);
      expect(hero().statPoints).toBe(before.statPoints);
      expect(hero().derivedStats).toEqual(before.derivedStats);
    }
    if (mode === 'equipment') expect(equipResult).toEqual({ ok: true });
    if (mode === 'damage') expect(hero().derivedStats).toMatchObject({ life: 3, mana: 2 });
    expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(false);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(false);
  });

  it('does not require a mercenary or backpack destination for a currency-only reward', () => {
    const items = Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ring(`full-bag-${String(index)}`));
    useInventoryStore.setState({ backpack: items }); talk();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().backpack).toEqual(items);
    expect(useMercStore.getState().ownedMercs).toEqual([]);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
  });

  it('increments an existing canonical balance without converting legacy or unknown wallet keys', () => {
    setBalance(8); talk();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 9, gold: 41, gemShards: 23, unrelated: 19, wishstone: 10 });
  });

  it('refuses safe-integer overflow before a wallet or claimed publication', () => {
    setBalance(Number.MAX_SAFE_INTEGER); talk(); const before = state();
    const ingress = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard');
    const marker = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed');
    expect(claimQuestReward(QUEST)).not.toBe('ok');
    expect(ingress).not.toHaveBeenCalled(); expect(marker).not.toHaveBeenCalled();
    expect(state()).toEqual(before);
  });

  it('uses the separately claimed catalyst in one real three-owned-gem fusion without refreshing entitlement', () => {
    setBalance(0);
    useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 3 } });
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' })).toThrow();
    talk(); expect(claimQuestReward(QUEST)).toBe('ok');
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' });
    expect(executeLiveMaterialAction(request).replay).toBe(false);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
    expect(useInventoryStore.getState().materials['gems/amethyst/chipped'] ?? 0).toBe(0);
    expect(useInventoryStore.getState().materials['gems/amethyst/flawed']).toBe(1);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
    expect(useMapStore.getState().questReceipts[RECEIPT]).toBe(true);
  });
});
