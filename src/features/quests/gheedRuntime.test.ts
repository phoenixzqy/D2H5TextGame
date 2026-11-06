/** Constructed Gheed capabilities; no owner-earned campaign, pacing or economy claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import { loadMercPool } from '@/data/loaders/mercs';
import * as quests from '@/data/loaders/quests';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores, useHydrationStore } from '@/stores/persistence';
import { executeLiveMaterialAction, prepareLiveMaterialAction } from '@/stores/materialActions';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { canClaim, claimQuestReward } from './claimReward';
import { areaCountedQuestSources, countedQuestCounters, countedSourceStatus, recoverCountedQuestSource } from './countedQuestActions';
import { withQuestTransaction } from './questTransaction';

const QUEST = 'quests/side-act1-gheeds-gamble', OBJECTIVE = 'obj-gamble-5';
const sources = [1, 2, 3, 4, 5].map(ordinal => `${QUEST}#objective:${OBJECTIVE}:source:lot-${String(ordinal)}`);
const ITEM = 'quest/gheed_salvage_lot';
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Gheed capability fixture');
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
    backpack: inventory.backpack, equipped: inventory.equipped, questItems: inventory.questItems,
    questServices: inventory.questServices, questProgress: map.questProgress, questReceipts: map.questReceipts });
}
function row(completed = false, claimed = false) {
  return { id: QUEST, status: completed ? 'completed' as const : 'inProgress' as const,
    rewardClaimed: claimed, objectives: { [OBJECTIVE]: completed } };
}
function owned(count = 5) {
  return Object.fromEntries(sources.slice(0, count).map(source => [source, { itemId: ITEM, state: 'owned' as const }]));
}
function ready() {
  useMapStore.setState({ questProgress: { [QUEST]: row(true) } });
  useInventoryStore.setState({ questItems: owned() });
}
function stopObservers() { stops.splice(0).forEach(stop => { stop(); }); }
function onShard(operation: () => void) {
  const baseline = useInventoryStore.getState().currencies['gem-shard'] ?? 0;
  let fired = false;
  stops.push(useInventoryStore.subscribe(current => {
    if (fired || current.currencies['gem-shard'] !== baseline + 1) return;
    fired = true; operation();
  }));
  return () => { expect(fired).toBe(true); };
}
function merc(threshold = 100000) {
  const def = required(loadMercPool().pool.find(item => item.id === 'mercs/act5-barbarian-recruit'));
  const actor = createMercFromDef(def, 'gheed-actual-recipient');
  const damaged = { ...actor, derivedStats: { ...actor.derivedStats, life: 13, mana: 3 } };
  useMercStore.getState().addMerc(damaged); useMercStore.getState().setFieldedMerc(damaged.id);
  useMercStore.setState({ mercProgress: { [damaged.id]: { experience: 0, experienceToNextLevel: threshold } } });
  return damaged;
}
async function importedStale(nearThreshold = false) {
  ready(); const current = hero();
  const derivedStats = deriveEquippedPlayerStats(current, current.level, {}, useMapStore.getState().questProgress, owned(), {});
  usePlayerStore.setState({ player: { ...current, experience: nearThreshold ? xpRequired(current.level) - 1 : 0,
    derivedStats: { ...derivedStats, defense: derivedStats.defense + 7 } } });
  const actor = merc();
  useMercStore.setState({ ownedMercs: [{ ...actor, derivedStats: { ...actor.derivedStats, defense: actor.derivedStats.defense + 11 } }] });
  const accepted = actors(); await importIntoStores(required(exportCurrentSave()));
  expect(actors()).toEqual(accepted); return accepted;
}
function ring(id = 'gheed-independent-ring'): Item {
  return { id, baseId: 'items/base/ring', rarity: 'normal', level: 1, identified: true, equipped: false };
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Gheed runtime', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35),
    equipment: [], statPoints: 11, skillPoints: 3, derivedStats: { ...fresh.derivedStats, life: 7, mana: 2 } });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-cold-plains', selectedDifficulty: 'normal',
    questProgress: { [QUEST]: row() } });
  useInventoryStore.setState({ currencies: { gold: 41, gemShards: 23, unrelated: 19 } });
});
afterEach(() => { stopObservers(); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('finite Gheed Recover and exact XP/shard exchange', () => {
  it('recovers five actual distinct lots without payout, then separately claims exactly XP1000 and shard1', () => {
    expect(required(loadCountedQuestItems().find(item => item.key === 'gheed')).sources).toEqual(sources);
    expect(areaCountedQuestSources('areas/act1-cold-plains').map(item => item.placement.source)).toEqual(sources);
    const before = state();
    for (const [index, source] of [sources[3], sources[0], sources[4], sources[2], sources[1]].entries()) {
      expect(countedSourceStatus(required(source))).toBe('available');
      expect(recoverCountedQuestSource(required(source))).toBe('ok');
      expect(recoverCountedQuestSource(required(source))).toBe('already-recovered');
      expect(countedQuestCounters('gheed')).toEqual({ held: index + 1, recovered: index + 1, consumed: 0, total: 5 });
      expect(useMapStore.getState().questProgress[QUEST]).toEqual(row(index === 4));
      expect(hero()).toEqual(before.hero); expect(useInventoryStore.getState().currencies).toEqual(before.currencies);
      expect(canClaim(QUEST)).toBe(index === 4);
    }
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(hero().experience - before.hero.experience).toBe(1000);
    expect(useInventoryStore.getState().currencies).toEqual({ ...before.currencies, 'gem-shard': 1, wishstone: 10 });
    expect(countedQuestCounters('gheed')).toEqual({ held: 0, consumed: 5, recovered: 5, total: 5 });
    expect(useMapStore.getState().questProgress[QUEST]).toEqual(row(true, true));
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().questServices).toEqual({});
    const paid = state(); expect(claimQuestReward(QUEST)).toBe('already-claimed');
    for (const source of sources) expect(recoverCountedQuestSource(source)).toBe('already-recovered');
    expect(state()).toEqual(paid);
  });

  it('keeps API discovery pure and copied completion requires all five real Recover actions', () => {
    useMapStore.setState({ questProgress: { [QUEST]: row(true) } }); const before = state();
    areaCountedQuestSources('areas/act1-cold-plains'); countedQuestCounters('gheed');
    useMapStore.getState().recordNpcTalk('npc/gheed');
    expect(canClaim(QUEST)).toBe(false); expect(claimQuestReward(QUEST)).toBe('not-completed');
    expect(state()).toEqual(before);
    for (const source of sources) expect(recoverCountedQuestSource(source)).toBe('ok');
    expect(claimQuestReward(QUEST)).toBe('ok');
  });

  it.each(['nightmare', 'wrong-area', 'wrong-act', 'loading', 'no-hero', 'combat', 'untracked', 'legacy-claimed', 'active-run'] as const)(
    'refuses %s recovery without adding proof or payment', fault => {
      if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
      if (fault === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 2 });
      if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
      if (fault === 'no-hero') usePlayerStore.setState({ player: null });
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      if (fault === 'untracked') useMapStore.setState({ questProgress: {} });
      if (fault === 'legacy-claimed') useMapStore.setState({ questProgress: { [QUEST]: row(true, true) } });
      if (fault === 'active-run') {
        useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
        expect(startSubAreaRun({ runSeed: 702, challengeOrdinal: 0 })).toBeTruthy();
        useMapStore.setState({ currentSubAreaId: 'areas/act1-cold-plains' }); useCombatStore.setState({ inCombat: false });
      }
      const before = structuredClone({ hero: usePlayerStore.getState().player, items: useInventoryStore.getState().questItems,
        currencies: useInventoryStore.getState().currencies });
      expect(recoverCountedQuestSource(required(sources[0]))).not.toBe('ok');
      expect({ hero: usePlayerStore.getState().player, items: useInventoryStore.getState().questItems,
        currencies: useInventoryStore.getState().currencies }).toEqual(before);
    });

  it.each(['source-before', 'source-after', 'source-noop', 'row-before', 'row-after', 'row-noop'] as const)(
    'restores previous four lots after fifth Recover %s and permits retry', fault => {
      useInventoryStore.setState({ questItems: owned(4) }); const before = state();
      const publish = (operation: () => void): void => {
        if (fault.endsWith('before')) throw new Error('before final Recover');
        if (fault.endsWith('noop')) return;
        operation(); throw new Error('after final Recover');
      };
      if (fault.startsWith('source')) {
        const real = useInventoryStore.setState;
        vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { publish(() => { real(update); }); });
      } else {
        const real = useMapStore.setState;
        vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { publish(() => { real(update); }); });
      }
      expect(recoverCountedQuestSource(required(sources[4]))).toBe('grant-failed'); expect(state()).toEqual(before);
      vi.restoreAllMocks(); expect(recoverCountedQuestSource(required(sources[4]))).toBe('ok');
      expect(canClaim(QUEST)).toBe(true);
    });

  it('claims later away from source in another difficulty with full bag and no mercenary', () => {
    ready(); useMapStore.setState({ currentAct: 2, currentSubAreaId: null, selectedDifficulty: 'nightmare' });
    const items = Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ring(`gheed-full-${String(index)}`));
    useInventoryStore.setState({ backpack: items });
    expect(canClaim(QUEST)).toBe(true); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().backpack).toEqual(items); expect(useMercStore.getState().ownedMercs).toEqual([]);
  });

  it('uses actual positive XP normalization on unchanged accepted stale-cache import and eligible merc share750', async () => {
    const before = await importedStale(), recipient = required(useMercStore.getState().ownedMercs[0]);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(hero().experience).toBe(before.hero.experience + 1000);
    expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, {}, useMapStore.getState().questProgress,
      useInventoryStore.getState().questItems, {}));
    expect(hero().derivedStats).toMatchObject({ life: 7, mana: 2 });
    expect(useMercStore.getState().getMercProgress(recipient.id).experience).toBe(750);
    expect(useMercStore.getState().ownedMercs[0]).toEqual(before.ownedMercs[0]);
  });

  it.each(['xp-before', 'xp-after', 'xp-noop', 'share-after', 'shard-before', 'shard-after', 'shard-noop', 'consume-after', 'claimed-before', 'claimed-after', 'claimed-noop'] as const)(
    'restores exact imported participating baseline after %s and retries once', async fault => {
      await importedStale(); const before = state(); let reached = false;
      if (fault.startsWith('xp')) {
        const real = usePlayerStore.getState().gainExperience;
        vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
          reached = true; if (fault.endsWith('before')) throw new Error('before XP');
          if (fault.endsWith('noop')) return { levelsGained: 0, newLevel: hero().level, statPointsGranted: 0, skillPointsGranted: 0 };
          real(amount); throw new Error('after XP');
        });
      }
      if (fault === 'share-after') {
        const real = useMercStore.getState().shareExperienceWithFielded;
        vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded').mockImplementation((amount, id) => {
          reached = true; real(amount, id); throw new Error('after share');
        });
      }
      if (fault.startsWith('shard')) {
        const real = useInventoryStore.getState().addQuestGemShard;
        vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard').mockImplementation(owner => {
          reached = true; if (fault.endsWith('before')) throw new Error('before shard');
          if (fault.endsWith('noop')) return; real(owner); throw new Error('after shard');
        });
      }
      if (fault === 'consume-after') {
        let fired = false; stops.push(useInventoryStore.subscribe(current => {
          if (fired || current.questItems[required(sources[0])]?.state !== 'consumed') return;
          reached = true; fired = true; throw new Error('after consume');
        }));
      }
      if (fault.startsWith('claimed')) {
        const real = useMapStore.getState().markQuestRewardClaimed;
        vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
          reached = true; expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
          if (fault.endsWith('before')) throw new Error('before claimed');
          if (fault.endsWith('noop')) return; real(id); throw new Error('after claimed');
        });
      }
      expect(claimQuestReward(QUEST)).toBe('grant-failed'); expect(reached).toBe(true); expect(state()).toEqual(before);
      stopObservers(); vi.restoreAllMocks(); expect(claimQuestReward(QUEST)).toBe('ok');
      expect(claimQuestReward(QUEST)).toBe('already-claimed');
    });

  it('refuses real direct spend before debit during its actual shard publication then releases for retry', () => {
    ready(); const before = state(); let refusal: unknown, balanceAfter: number | undefined;
    const fired = onShard(() => {
      try { useInventoryStore.getState().spendCurrency('gem-shard', 1); } catch (error) { refusal = error; }
      balanceAfter = useInventoryStore.getState().currencies['gem-shard']; throw new Error('force Claim rollback');
    });
    let result: unknown; try { result = claimQuestReward(QUEST); } catch (error) { result = error; }
    expect(refusal).toBeInstanceOf(WaveGuardError); expect(refusal).toMatchObject({ code: 'questBusy' });
    fired(); expect(balanceAfter).toBe(1); expect(result).toBe('grant-failed'); expect(state()).toEqual(before);
    stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
  });

  it.each([undefined, 0, 7])('keeps independent same-wallet additions with baseline%s through owned rollback', baseline => {
    ready(); useInventoryStore.setState(current => ({ currencies: { ...current.currencies,
      ...(baseline === undefined ? {} : { 'gem-shard': baseline }) } }));
    const before = actors(); const fired = onShard(() => {
      useInventoryStore.getState().addCurrency('gem-shard', 3);
      useInventoryStore.getState().addCurrency('unrelated', 5); throw new Error('after independent additions');
    });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired(); expect(actors()).toEqual(before);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe((baseline ?? 0) + 3);
    expect(useInventoryStore.getState().currencies.unrelated).toBe(24);
    expect(useInventoryStore.getState().questItems).toEqual(owned());
    stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe((baseline ?? 0) + 4);
  });

  it('accepts independent same-wallet additions on successful publication', () => {
    ready(); const fired = onShard(() => { useInventoryStore.getState().addCurrency('gem-shard', 4); });
    expect(claimQuestReward(QUEST)).toBe('ok'); fired(); expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
  });

  it('retains additions during restoration and fences nested Claim until release', () => {
    ready(); let granted = false, restored = false; const nested: string[] = [];
    stops.push(useInventoryStore.subscribe(current => {
      if (!granted && current.currencies['gem-shard'] === 1) {
        granted = true; current.addCurrency('gem-shard', 2); throw new Error('grant observer');
      }
      if (granted && !restored && current.currencies['gem-shard'] === 2) {
        restored = true; nested.push(claimQuestReward(QUEST)); current.addCurrency('gem-shard', 3);
      }
    }));
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); expect(restored).toBe(true);
    expect(nested).toEqual(['claim-in-progress']); expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
    stopObservers(); expect(claimQuestReward(QUEST)).toBe('ok'); expect(useInventoryStore.getState().spendCurrency('gem-shard', 6)).toBe(true);
  });

  it('keeps a raw ambiguous overwrite explicit without erasing it or locking subsequent spending', () => {
    ready(); const fired = onShard(() => {
      useInventoryStore.setState(current => ({ currencies: { ...current.currencies, 'gem-shard': 500 } }));
      throw new Error('raw ambiguous overwrite');
    });
    expect(() => claimQuestReward(QUEST)).toThrow(AggregateError); fired();
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(500);
    expect(useInventoryStore.getState().questItems).toEqual(owned());
    expect(useMapStore.getState().questProgress[QUEST]).toEqual(row(true));
    stopObservers(); expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
  });

  it.each(['real-xp', 'raw-xp', 'equipment', 'damage'] as const)('conserves independent hero %s through its aborted award', async mode => {
    await importedStale(mode === 'real-xp' || mode === 'raw-xp');
    const before = structuredClone(hero());
    if (mode === 'equipment') useInventoryStore.getState().addItem(ring());
    const independentAmount = mode === 'real-xp' ? 100000 : 2;
    let equipped: ReturnType<ReturnType<typeof useInventoryStore.getState>['equipItem']> | undefined;
    const fired = onShard(() => {
      if (mode === 'real-xp') usePlayerStore.getState().gainExperience(independentAmount);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(independentAmount);
      if (mode === 'equipment') equipped = useInventoryStore.getState().equipItem(required(useInventoryStore.getState().backpack[0]), 'ring-left');
      if (mode === 'damage') {
        const current = hero(); usePlayerStore.setState({ player: { ...current,
          derivedStats: { ...current.derivedStats, life: 3, mana: 1 } } });
      }
      throw new Error('after independent hero operation');
    });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
    if (mode === 'real-xp') {
      const growth = awardXp(xpTotal(before.level) + before.experience, independentAmount);
      expect(hero().level).toBe(growth.level); expect(hero().experience).toBe(growth.totalXp - xpTotal(growth.level));
      expect(hero().statPoints).toBe(before.statPoints + growth.statPointsGranted);
      expect(hero().skillPoints).toBe(before.skillPoints + growth.skillPointsGranted);
    }
    if (mode === 'raw-xp') {
      expect(hero().level).toBe(before.level); expect(hero().experience).toBe(before.experience + 2);
      expect(hero().derivedStats).toEqual(before.derivedStats);
    }
    if (mode === 'equipment') {
      expect(equipped).toEqual({ ok: true }); expect(useInventoryStore.getState().equipped['ring-left']?.id).toBe('gheed-independent-ring');
      expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
        useMapStore.getState().questProgress, useInventoryStore.getState().questItems, {}));
    }
    if (mode === 'damage') expect(hero().derivedStats).toMatchObject({ life: 3, mana: 1 });
    expect(useInventoryStore.getState().questItems).toEqual(owned());
  });

  it('preserves actual independent merc XP across a threshold while removing only its own share', () => {
    ready(); const recipient = merc(751), baseline = structuredClone(recipient);
    const real = useMercStore.getState().addExperience;
    // Independent 752XP crosses the same real threshold even without the aborted750XP share.
    real(recipient.id, 752); const expected = structuredClone({ actor: useMercStore.getState().ownedMercs[0],
      progress: useMercStore.getState().getMercProgress(recipient.id) });
    useMercStore.setState({ ownedMercs: [baseline], mercProgress: { [recipient.id]: { experience: 0, experienceToNextLevel: 751 } } });
    const fired = onShard(() => { real(recipient.id, 752); throw new Error('after independent merc XP'); });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
    expect({ actor: useMercStore.getState().ownedMercs[0], progress: useMercStore.getState().getMercProgress(recipient.id) }).toEqual(expected);
  });

  it.each(['removed', 'foreign', 'field-switch'] as const)('preserves independent recipient %s after failure', mode => {
    ready(); const recipient = merc();
    const other = createMercFromDef(required(loadMercPool().pool.find(item => item.id === 'mercs/act1-rogue-trainee')), 'gheed-other');
    useMercStore.getState().addMerc(other);
    let expected: ReturnType<typeof actors> | undefined;
    const fired = onShard(() => {
      if (mode === 'removed') useMercStore.getState().removeMerc(recipient.id);
      if (mode === 'foreign') useMercStore.setState({ ownedMercs: [{ ...other, id: recipient.id }],
        mercProgress: { [recipient.id]: { experience: 13, experienceToNextLevel: 97 } }, fieldedMercId: recipient.id });
      if (mode === 'field-switch') useMercStore.getState().setFieldedMerc(other.id);
      expected = actors(); throw new Error('independent recipient ownership change');
    });
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); fired();
    if (mode === 'removed' || mode === 'foreign') {
      expect(useMercStore.getState().ownedMercs).toEqual(expected?.ownedMercs);
      expect(useMercStore.getState().mercProgress).toEqual(expected?.mercProgress);
    }
    if (mode === 'field-switch') {
      expect(useMercStore.getState().fieldedMercId).toBe(other.id);
      expect(useMercStore.getState().getMercProgress(recipient.id).experience).toBe(0);
    }
  });

  it('refuses destination overflow before actual XP, shard, consumption or claimed writes', () => {
    ready(); useInventoryStore.getState().addCurrency('gem-shard', Number.MAX_SAFE_INTEGER);
    const before = state(), xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const shard = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard'), claimed = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed');
    expect(claimQuestReward(QUEST)).toBe('unsupported-rewards'); expect(state()).toEqual(before);
    expect(xp).not.toHaveBeenCalled(); expect(shard).not.toHaveBeenCalled(); expect(claimed).not.toHaveBeenCalled();
  });

  it.each([{ xp: 1000 }, { xp: 1000, gemShards: 2 }, { xp: 1000, gemShards: 1, gold: 0 },
    { xp: 1000, itemDrop: 'magic' }])('refuses changed whole reward bag %j before writes', bag => {
      ready(); const rows = quests.loadQuests(), changed = rows.map(item => item.id === QUEST ? { ...item, rewards: bag } : item);
      vi.spyOn(quests, 'loadQuests').mockReturnValue(changed); const before = state();
      expect(canClaim(QUEST)).toBe(false); expect(claimQuestReward(QUEST)).toBe('unsupported-rewards'); expect(state()).toEqual(before);
    });

  it('reports restoration faults explicitly while releasing both shard and quest owners', () => {
    ready(); const restore = useInventoryStore.getState().restoreQuestGemShard;
    vi.spyOn(useInventoryStore.getState(), 'restoreQuestGemShard').mockImplementation(owner => { restore(owner); throw new Error('restore observer'); });
    const fired = onShard(() => { throw new Error('grant observer'); });
    expect(() => claimQuestReward(QUEST)).toThrow(AggregateError); fired(); stopObservers(); vi.restoreAllMocks();
    expect(withQuestTransaction(() => 'released')).toBe('released'); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
  });

  it('keeps normal level-cap XP semantics and uses the claimed shard in the actual fusion sink', () => {
    ready(); const current = hero(); usePlayerStore.setState({ player: { ...current, level: LEVEL_CAP,
      experience: 0, experienceToNextLevel: 1 } });
    useInventoryStore.getState().addMaterials({ 'gems/amethyst/chipped': 3 });
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' })).toThrow();
    expect(claimQuestReward(QUEST)).toBe('ok'); expect(hero().level).toBe(LEVEL_CAP); expect(hero().experience).toBe(1000);
    executeLiveMaterialAction(prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' }));
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
    expect(useInventoryStore.getState().materials['gems/amethyst/flawed']).toBe(1);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
  });
});
