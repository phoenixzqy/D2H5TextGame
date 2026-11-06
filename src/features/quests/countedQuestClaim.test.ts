import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCountedQuestItems, type CountedQuestKey } from '@/data/loaders/counted-quest-items';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadJamellaQuestAwardPools, loadJamellaQuestRewardProfile } from '@/data/loaders/quest-table-rewards';
import * as quests from '@/data/loaders/quests';
import * as award from '@/engine/loot/award';
import { createRng, hashSeed } from '@/engine/rng';
import { LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import * as saveAdapter from '@/stores/save-adapter';
import { toJsonSafe } from '@/engine/save';
import { importIntoStores, snapshotStores } from '@/stores/persistence';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { executeLiveMaterialAction, prepareLiveMaterialAction, previewLiveMaterialAction } from '@/stores/materialActions';
import { canClaim, claimQuestReward } from './claimReward';
import { countedQuestCounters } from './countedQuestActions';
import { withQuestTransaction } from './questTransaction';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing counted Claim fixture'); return value; }
function prepare(key: CountedQuestKey, consumed = key === 'jade') {
  const d = required(loadCountedQuestItems().find(row => row.key === key));
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor', selectedDifficulty: 'hell', questProgress: {
    [d.quest]: { id: d.quest, status: 'completed', rewardClaimed: false, objectives: { [d.objective]: true } }
  } });
  useInventoryStore.setState({ questItems: Object.fromEntries(d.sources.map(source => [source, { itemId: d.itemId, state: consumed ? 'consumed' : 'owned' }])) });
  return d;
}
const hero = () => required(usePlayerStore.getState().player);
async function prepareCachedSave(key: CountedQuestKey) {
  const d = prepare(key), current = hero();
  useMapStore.setState({ selectedDifficulty: 'normal' });
  const player = { ...current, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), coreStats: { ...current.coreStats, vitality: 499 },
    derivedStats: { ...current.derivedStats, life: 7, mana: 5 } };
  const canonical = deriveEquippedPlayerStats(player, player.level, {}, useMapStore.getState().questProgress,
    useInventoryStore.getState().questItems, useMapStore.getState().questReceipts);
  // Native current saves retain some accepted derived caches; real XP recomposes them.
  usePlayerStore.setState({ player: { ...player, derivedStats: { ...canonical, defense: canonical.defense + 7 } } });
  const hired = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-recruit')));
  const actor = { ...hired, derivedStats: { ...hired.derivedStats, life: 13, mana: 17 } };
  useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id);
  vi.spyOn(saveAdapter, 'saveSave').mockResolvedValue();
  await importIntoStores(JSON.stringify(toJsonSafe(required(snapshotStores()))));
  return d;
}

function merc() {
  const actor = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), 'actual-recipient');
  useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id); return actor;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const player = createMockPlayer('Counted Claim', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, level: 1, experience: 0, statPoints: 11, skillPoints: 3,
    derivedStats: { ...player.derivedStats, life: 7, mana: 2 } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('finite counted whole-bag Claim', () => {
  it.each(['gheed', 'alkor', 'jade', 'jamella', 'malah'] as const)('pays %s ten canonical wishes once alongside its existing reward', key => {
    const d = prepare(key);
    useInventoryStore.setState({ currencies: { wishstone: 7, wishstones: 23, opaque: 4 } });
    expect(claimQuestReward(d.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
    expect(useInventoryStore.getState().currencies.wishstones).toBe(23);
    expect(useInventoryStore.getState().currencies.opaque).toBe(4);
    expect(countedQuestCounters(key).consumed).toBe(d.sources.length);
    expect(claimQuestReward(d.quest)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });
  describe.each(['gheed', 'alkor', 'jade', 'jamella', 'malah'] as const)('%s wish participant', key => {
    it.each(['missing', 'extra'] as const)('rejects %s authored reward fields before any payment', mode => {
      const d = prepare(key), rows = quests.loadQuests();
      const changed = rows.map(row => {
        if (row.id !== d.quest) return row;
        const rewards = { ...row.rewards };
        if (mode === 'missing') Reflect.deleteProperty(rewards, 'wishstones');
        else Object.assign(rewards, { gold: 0 });
        return { ...row, rewards };
      });
      vi.spyOn(quests, 'loadQuests').mockReturnValue(changed);
      const before = structuredClone(hero());
      expect(canClaim(d.quest)).toBe(false); expect(claimQuestReward(d.quest)).toBe('unsupported-rewards');
      expect(hero()).toEqual(before); expect(useInventoryStore.getState().currencies).toEqual({});
    });
    it.each(['before', 'after', 'noop'] as const)('restores all original participants after %s wish ingress and permits a complete retry', mode => {
      const d = prepare(key), before = structuredClone({ hero: hero(), items: useInventoryStore.getState().questItems,
        rows: useMapStore.getState().questProgress, currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials });
      const real = useInventoryStore.getState().addQuestCurrency;
      const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(owner => {
        if (mode === 'before') throw new Error('before wishes');
        if (mode === 'after') { real(owner); throw new Error('after wishes'); }
      });
      expect(claimQuestReward(d.quest)).toBe('grant-failed');
      expect({ hero: hero(), items: useInventoryStore.getState().questItems, rows: useMapStore.getState().questProgress,
        currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials }).toEqual(before);
      mock.mockRestore(); expect(claimQuestReward(d.quest)).toBe('ok');
      expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
      expect(claimQuestReward(d.quest)).toBe('already-claimed');
    });
    it('pays before claimed-last, preserves independent additions on failure, and releases both keys for retry', () => {
      const d = prepare(key), before = structuredClone(hero());
      useInventoryStore.setState({ currencies: { wishstones: 23 } });
      const real = useMapStore.getState().markQuestRewardClaimed;
      const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
        expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
        if (key === 'gheed') expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
        real(id); useInventoryStore.getState().addCurrency('wishstone', 3);
        if (key === 'gheed') useInventoryStore.getState().addCurrency('gem-shard', 4);
        throw new Error('claimed-last');
      });
      expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(hero()).toEqual(before);
      expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
      expect(countedQuestCounters(key).consumed).toBe(key === 'jade' ? d.sources.length : 0);
      expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 3, wishstones: 23, ...(key === 'gheed' ? { 'gem-shard': 4 } : {}) });
      mock.mockRestore(); expect(claimQuestReward(d.quest)).toBe('ok');
      expect(useInventoryStore.getState().currencies.wishstone).toBe(13);
      if (key === 'gheed') expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
    });
    it('preflights wish overflow before XP, source consumption or any payment, and releases partial reservations', () => {
      const d = prepare(key), before = structuredClone(hero());
      useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
      expect(claimQuestReward(d.quest)).toBe('unsupported-rewards'); expect(hero()).toEqual(before);
      expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
      expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
      useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(d.quest)).toBe('ok');
      expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    });
    it('reports an unattributed wish overwrite while still restoring every other participant and releasing owners', () => {
      const d = prepare(key), before = structuredClone(hero());
      const real = useMapStore.getState().markQuestRewardClaimed;
      vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
        real(id); useInventoryStore.setState({ currencies: { ...useInventoryStore.getState().currencies, wishstone: 123 } });
        throw new Error('unattributed overwrite');
      });
      expect(() => claimQuestReward(d.quest)).toThrow(AggregateError);
      expect(hero()).toEqual(before); expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
      expect(countedQuestCounters(key).consumed).toBe(key === 'jade' ? d.sources.length : 0);
      expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
      expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
    });
  });
  it.each([['alkor', 4500], ['jade', 3500], ['jamella', 7000], ['malah', 9000]] as const)('claims imported %s with a retained derived cache through real XP normalization', async (key, xp) => {
    const d = await prepareCachedSave(key), before = structuredClone(hero());
    const actor = required(useMercStore.getState().ownedMercs[0]);
    expect(before.derivedStats.defense).toBe(129);
    expect(canClaim(d.quest)).toBe(true); expect(claimQuestReward(d.quest)).toBe('ok');
    expect(hero().experience - before.experience).toBe(xp);
    expect(hero().statPoints - before.statPoints).toBe(key === 'alkor' ? 5 : 0);
    expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
      useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts));
    expect(hero().derivedStats.defense).toBe(122); expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(5);
    expect(useMercStore.getState().getMercProgress(actor.id).experience).toBe(Math.floor(xp * 0.75));
    expect(useMercStore.getState().ownedMercs[0]?.derivedStats).toEqual(actor.derivedStats);
    expect(countedQuestCounters(key).consumed).toBe(d.sources.length); expect(claimQuestReward(d.quest)).toBe('already-claimed');
  });
  it.each(['xp', 'claim', 'gear', 'independent-xp', 'raw-xp', 'damage'] as const)('restores an accepted derived cache after %s while retaining independent normalization', async fault => {
    const d = await prepareCachedSave('alkor'), before = structuredClone(hero());
    const real = usePlayerStore.getState().gainExperience;
    if (fault === 'xp') vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { real(amount); throw new Error('XP publication failure'); });
    if (fault === 'claim') vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => { throw new Error('Claim publication failure'); });
    if (fault === 'gear' || fault === 'independent-xp' || fault === 'raw-xp' || fault === 'damage') {
      let fired = false;
      stops.push(usePlayerStore.subscribe(() => {
        if (fired) return; fired = true;
        if (fault === 'gear') useInventoryStore.setState({ equipped: { chest: { id: 'independent-armor', baseId: 'items/base/armor-quilted', rarity: 'normal',
          level: 1, identified: true, equipped: true, equipSlot: 'chest', baseRolls: { defense: 9 } } } });
        else {
          if (fault === 'independent-xp') real(2);
          if (fault === 'raw-xp') usePlayerStore.getState().addXP(2);
          if (fault === 'damage') Object.assign(hero().derivedStats, { life: 3, mana: 2 });
          throw new Error('Independent publication failure');
        }
      }));
    }
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(hero().experience).toBe(fault === 'independent-xp' || fault === 'raw-xp' ? 2 : before.experience);
    expect(hero().statPoints).toBe(before.statPoints);
    expect(hero().derivedStats).toEqual(fault === 'gear' || fault === 'independent-xp'
      ? deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
        useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
      : { ...before.derivedStats, life: fault === 'damage' ? 3 : 7, mana: fault === 'damage' ? 2 : 5 });
    expect(hero().derivedStats.life).toBe(fault === 'damage' ? 3 : 7); expect(hero().derivedStats.mana).toBe(fault === 'damage' ? 2 : 5);
    expect(countedQuestCounters('alkor').held).toBe(3); expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
  });
  it.each([['alkor', 4500], ['jade', 3500], ['jamella', 7000], ['malah', 9000]] as const)('pays complete %s XP and consumed graph once, away from source in another difficulty', (key, xp) => {
    const d = prepare(key), before = structuredClone(hero());
    expect(canClaim(d.quest)).toBe(true); expect(claimQuestReward(d.quest)).toBe('ok');
    expect(xpTotal(hero().level) + hero().experience - xpTotal(before.level) - before.experience).toBe(xp);
    expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(2); expect(hero().coreStats).toEqual(before.coreStats);
    expect(countedQuestCounters(key)).toEqual({ held: 0, consumed: d.sources.length, recovered: d.sources.length, total: d.sources.length });
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(true);
    const after = structuredClone({ hero: hero(), currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials });
    expect(claimQuestReward(d.quest)).toBe('already-claimed'); expect(canClaim(d.quest)).toBe(false);
    expect({ hero: hero(), currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials }).toEqual(after);
  });
  it('adds Alkor five independent points on top of incidental level awards and existing investments', () => {
    const d = prepare('alkor'), before = structuredClone(hero());
    expect(claimQuestReward(d.quest)).toBe('ok');
    expect(hero().statPoints - before.statPoints).toBe((hero().level - before.level) * 5 + 5);
    expect(hero().skillPoints - before.skillPoints).toBe(hero().level - before.level);
  });
  it('credits only canonical rune-shard and preserves old camel-case/gold/unknown wallet keys', () => {
    const d = prepare('jade');
    useInventoryStore.setState({ currencies: { 'rune-shard': 17, runeShards: 23, gold: 41, opaque: 29 } });
    expect(claimQuestReward(d.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 1017, runeShards: 23, gold: 41, opaque: 29, wishstone: 10 });
    expect(useInventoryStore.getState().materials).toEqual({});
  });
  it('spends the credited canonical wallet through a later real material recipe after the Claim lease releases', () => {
    const d = prepare('jade');
    useInventoryStore.setState({ currencies: { runeShards: 23, gold: 41, opaque: 29 },
      backpack: [{ id: 'real-socket-clear-target', baseId: 'items/base/armor-quilted', rarity: 'normal', level: 1, ilvl: 25,
        socketCapacity: 2, socketContents: [{ kind: 'gem', id: 'gems/ruby/chipped' }], identified: true, equipped: false, baseRolls: { defense: 9 } }],
      materials: { 'runes/hel': 1, 'gems/skull/flawed': 1 } });
    expect(claimQuestReward(d.quest)).toBe('ok');
    useMapStore.setState({ selectedDifficulty: 'normal' });
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/socket-clear', itemIds: ['real-socket-clear-target'] });
    expect(previewLiveMaterialAction(request).replay).toBe(false); expect(executeLiveMaterialAction(request).replay).toBe(false);
    expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 900, runeShards: 23, gold: 41, opaque: 29, wishstone: 10 });
    expect(useInventoryStore.getState().materials).toEqual({}); expect(useInventoryStore.getState().backpack[0]?.socketContents).toEqual([]);
  });
  it('pins Jamella to the standard deterministic material bag and rolls once per attempt', () => {
    const d = prepare('jamella'), profile = loadJamellaQuestRewardProfile();
    const expected = required(award.rollQuestTableRewards(profile.input, loadJamellaQuestAwardPools(), createRng(hashSeed(JSON.stringify([
      'quest-loot-table-v1', hero().id, d.quest, profile.input.tableId, 51, 1
    ])))));
    const spy = vi.spyOn(award, 'rollQuestTableRewards');
    expect(canClaim(d.quest)).toBe(true); expect(spy).not.toHaveBeenCalled();
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(spy).toHaveBeenCalledTimes(1);
    expect(useInventoryStore.getState().materials).toEqual(expected.materials);
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 10 });
  });
  it('adds Malah post-cap capacity without changing raw vitality or healing', () => {
    const d = prepare('malah'), current = hero();
    usePlayerStore.setState({ player: { ...current, coreStats: { ...current.coreStats, vitality: 500 } } });
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    // Level-cap XP isolates the source contribution from ordinary level Life.
    usePlayerStore.setState({ player: { ...hero(), level: LEVEL_CAP } }); usePlayerStore.getState().recomputeDerived({});
    const before = structuredClone(hero());
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(hero().coreStats.vitality).toBe(500);
    expect(hero().derivedStats.lifeMax - before.derivedStats.lifeMax).toBe(20); expect(hero().derivedStats.life).toBe(7);
  });
  it.each([['alkor', 3375], ['jade', 2625], ['jamella', 5250], ['malah', 6750]] as const)('awards captured actual merc %s recipient its 75 percent share', (key, share) => {
    const d = prepare(key), actor = merc();
    const threshold = 100000; useMercStore.setState({ mercProgress: { [actor.id]: { experience: 8, experienceToNextLevel: threshold } } });
    expect(claimQuestReward(d.quest)).toBe('ok');
    expect(useMercStore.getState().getMercProgress(actor.id)).toEqual({ experience: share + 8, experienceToNextLevel: threshold });
    expect(useMercStore.getState().fieldedMercId).toBe(actor.id);
  });
  it.each(['missing', 'partial', 'claimed-owned', 'partial-consumed', 'jade-owned', 'source-free-claimed'] as const)('refuses %s proof without paying', fault => {
    const d = prepare(fault === 'jade-owned' ? 'jade' : 'alkor', false), inv = useInventoryStore.getState();
    if (fault === 'missing' || fault === 'source-free-claimed') useInventoryStore.setState({ questItems: {} });
    if (fault === 'partial') useInventoryStore.setState({ questItems: Object.fromEntries(Object.entries(inv.questItems).slice(0, 1)) });
    if (fault === 'partial-consumed') { const first = required(d.sources[0]); useInventoryStore.setState({ questItems: { ...inv.questItems, [first]: { itemId: d.itemId, state: 'consumed' } } }); }
    if (fault === 'claimed-owned' || fault === 'source-free-claimed') useMapStore.getState().updateQuestProgress(d.quest, { rewardClaimed: true });
    const before = structuredClone({ hero: hero(), items: useInventoryStore.getState().questItems });
    expect(canClaim(d.quest)).toBe(false); expect(claimQuestReward(d.quest)).not.toBe('ok');
    expect({ hero: hero(), items: useInventoryStore.getState().questItems }).toEqual(before);
  });
  it.each(['xp', 'points', 'wallet', 'material'] as const)('preflights whole-bag %s overflow before XP or consumption', fault => {
    const d = prepare(fault === 'wallet' ? 'jade' : fault === 'material' ? 'jamella' : 'alkor');
    if (fault === 'xp') usePlayerStore.setState({ player: { ...hero(), experience: Number.MAX_SAFE_INTEGER } });
    if (fault === 'points') usePlayerStore.setState({ player: { ...hero(), statPoints: Number.MAX_SAFE_INTEGER } });
    if (fault === 'wallet') useInventoryStore.setState({ currencies: { 'rune-shard': Number.MAX_SAFE_INTEGER } });
    if (fault === 'material') useInventoryStore.setState({ materials: Object.fromEntries(loadJamellaQuestRewardProfile().table.picks.map(pick => [required(pick.itemId), Number.MAX_SAFE_INTEGER])) });
    const before = structuredClone({ hero: hero(), items: useInventoryStore.getState().questItems, currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials });
    expect(claimQuestReward(d.quest)).toBe('unsupported-rewards');
    expect({ hero: hero(), items: useInventoryStore.getState().questItems, currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials }).toEqual(before);
  });
  it.each(['hero-throw', 'hero-silent', 'merc-throw', 'currency-throw', 'material-throw', 'source-throw', 'claim-throw', 'claim-silent', 'claim-mutate'] as const)('restores every participating domain after %s and permits one complete retry', fault => {
    const key = fault === 'currency-throw' ? 'jade' : fault === 'material-throw' ? 'jamella' : 'alkor';
    const d = prepare(key), actor = merc();
    const before = structuredClone({ hero: hero(), items: useInventoryStore.getState().questItems, row: useMapStore.getState().questProgress[d.quest], merc: actor,
      progress: useMercStore.getState().mercProgress });
    if (fault === 'hero-throw' || fault === 'hero-silent') {
      const real = usePlayerStore.getState().gainExperience;
      vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { if (fault === 'hero-silent') return { levelsGained: 0, newLevel: 1, statPointsGranted: 0, skillPointsGranted: 0 }; real(amount); throw new Error('hero fault'); });
    }
    if (fault === 'merc-throw') { const real = useMercStore.getState().shareExperienceWithFielded; vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded').mockImplementation((amount, id) => { real(amount, id); throw new Error('merc fault'); }); }
    if (fault === 'currency-throw') { const real = useInventoryStore.getState().addCurrency; vi.spyOn(useInventoryStore.getState(), 'addCurrency').mockImplementation((id, amount) => { real(id, amount); throw new Error('currency fault'); }); }
    if (fault === 'material-throw') { const real = useInventoryStore.getState().addMaterials; vi.spyOn(useInventoryStore.getState(), 'addMaterials').mockImplementation(materials => { real(materials); throw new Error('material fault'); }); }
    if (fault === 'source-throw') { const real = useInventoryStore.setState; vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('source fault'); }); }
    if (fault === 'claim-throw' || fault === 'claim-silent') {
      const real = useMapStore.getState().markQuestRewardClaimed; vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { if (fault === 'claim-silent') return; real(id); throw new Error('claim fault'); });
    }
    if (fault === 'claim-mutate') { let fired = false; stops.push(useMapStore.subscribe(() => { if (fired) return; fired = true; const row = useMapStore.getState().questProgress[d.quest]; if (row) row.rewardClaimed = false; })); }
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect({ hero: hero(), items: useInventoryStore.getState().questItems, row: useMapStore.getState().questProgress[d.quest], merc: useMercStore.getState().ownedMercs[0], progress: useMercStore.getState().mercProgress }).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({}); expect(useInventoryStore.getState().materials).toEqual({});
    vi.restoreAllMocks(); stops.splice(0).forEach(stop => { stop(); });
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(claimQuestReward(d.quest)).toBe('already-claimed');
  });
  it('keeps rollback key absence, unrelated wallet/source rows, independent fielding and dismissal', () => {
    const d = prepare('jade'), actor = merc(); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true;
      useInventoryStore.getState().addCurrency('unrelated', 7); useMercStore.getState().removeMerc(actor.id);
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(useInventoryStore.getState().currencies).toEqual({ unrelated: 7 });
    expect(useMercStore.getState().ownedMercs).toEqual([]); expect(useMercStore.getState().fieldedMercId).toBeNull();
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false); expect(hero().experience).toBe(0);
  });
  it('does not restore merc domains when no recipient participated', () => {
    const d = prepare('alkor'); const real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { real(id); throw new Error('claimed'); });
    const mercSet = vi.spyOn(useMercStore, 'setState'); expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(mercSet).not.toHaveBeenCalled();
  });
  it('refuses getters before generic dispatch, with no executed getters', () => {
    const d = prepare('alkor'); let reads = 0;
    const rows = quests.loadQuests(), changed = rows.map(row => row.id === d.quest ? { ...row } : row), quest = required(changed.find(row => row.id === d.quest));
    Object.defineProperty(quest, 'rewards', { enumerable: true, get: () => { reads++; return { xp: 4500, statPoints: 5 }; } });
    vi.spyOn(quests, 'loadQuests').mockReturnValue(changed);
    expect(canClaim(d.quest)).toBe(false); expect(claimQuestReward(d.quest)).toBe('unsupported-rewards'); expect(reads).toBe(0);
  });
  it('holds the lease through every restoration and reports restoration failure explicitly', () => {
    const d = prepare('alkor'); expect(withQuestTransaction(() => claimQuestReward(d.quest))).toBe('claim-in-progress');
    const real = useMapStore.setState; const nested: string[] = [];
    const mark = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { mark(id); throw new Error('claimed observer'); });
    vi.spyOn(useMapStore, 'setState').mockImplementation(update => { real(update); nested.push(claimQuestReward(d.quest)); throw new Error('source/restore observer'); });
    expect(() => claimQuestReward(d.quest)).toThrow(AggregateError); expect(nested.every(result => result === 'claim-in-progress')).toBe(true);
  });
});
