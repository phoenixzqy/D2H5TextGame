import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as towns from '@/data/loaders/towns';
import { loadItemBases } from '@/data/loaders/loot';
import * as quests from '@/data/loaders/quests';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { useQuestService } from '@/features/town/questServices';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { LARZUK } from '@/engine/map/larzuk-quest';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { selectLarzukPresentItem, presentLarzukItem } from '@/features/town/larzukPresent';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const originalTownNpcs = towns.loadTownNpcs;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Larzuk fixture'); return value; }
const siege = required(ACT5_ENCOUNTERS.find(row => row.questId === LARZUK.prerequisite));
const base = required([...loadItemBases().values()].find(row => row.type === 'weapon' && (row.maxSockets ?? 0) > 1));
const mainSource = `${LARZUK.prerequisite}#reward:service`, sideSource = `${LARZUK.quest}#reward:service`;
function gear(id = 'presented'): Item { return { id, baseId: base.id, rarity: 'normal', level: 12, identified: true,
  equipped: false, socketCapacity: 0, baseRolls: { attack: 7 }, affixes: [] }; }
const inv = () => useInventoryStore.getState();
const map = () => useMapStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
const selected = () => required(selectLarzukPresentItem(required(inv().backpack[0])));
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Larzuk', 'sorceress'), equipment: [] });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-bloody-foothills', isActUnlocked: () => true,
    questProgress: {
      [LARZUK.prerequisite]: { id: LARZUK.prerequisite, status: 'completed', rewardClaimed: false, objectives: { [siege.objectiveId]: true } },
      [LARZUK.quest]: { id: LARZUK.quest, status: 'inProgress', rewardClaimed: false, objectives: { [LARZUK.objective]: false } }
    }, questReceipts: { [siege.proof]: true } });
  vi.spyOn(towns, 'loadTownNpcs').mockImplementation(originalTownNpcs);
  useInventoryStore.setState({ backpack: [gear()] });
  validateQuestItemLedger(inv().questItems, map().questProgress, map().questReceipts);
  validateNative24CurrentCampaignRewards(map(), inv().questItems, inv().questServices, map().endgame);
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });


function present(): void { expect(presentLarzukItem(selected())).toBe('ok'); }
function proofless(): void { map().updateQuestProgress(LARZUK.quest, { status: 'completed', objectives: { [LARZUK.objective]: true } }); }

  it('settles finite side wishes once alongside the full existing reward', () => {
    present(); const qid = LARZUK.quest;
    useInventoryStore.setState({ currencies: { wishstone: 7, wishstones: 23, opaque: 4 } });
    expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17, wishstones: 23, opaque: 4 });
    expect(claimQuestReward(qid)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });


  function wishParticipants() {
    const p = usePlayerStore.getState().player, inv = useInventoryStore.getState(), map = useMapStore.getState();
    return structuredClone({ heroProgress: p && [p.level, p.experience, p.statPoints, p.skillPoints, p.derivedStats.life, p.derivedStats.mana],
      rows: map.questProgress, receipts: map.questReceipts, items: inv.questItems, services: inv.questServices,
      backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped });
  }
  it.each(['before', 'after', 'noop'] as const)('restores finite side wish ingress %s with all old rewards and permits one full retry', mode => {
    present(); const qid = LARZUK.quest;
    const before = wishParticipants(), real = useInventoryStore.getState().addQuestCurrency;
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(owner => {
      if (mode === 'before') throw new Error('before wishes');
      if (mode === 'after') { real(owner); throw new Error('after wishes'); }
    });
    expect(claimQuestReward(qid)).toBe('grant-failed'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({});
    mock.mockRestore(); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(claimQuestReward(qid)).toBe('already-claimed');
  });
  it('preflights finite side wish overflow before publishing any old reward and releases the reservation', () => {
    present(); const qid = LARZUK.quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    present(); const qid = LARZUK.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
      real(id); useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('claimed-last');
    });
    let restored = false;
    const stop = useInventoryStore.subscribe(state => {
      if (restored || state.currencies.wishstone !== 3) return; restored = true;
      const row = useMapStore.getState().questProgress[qid]; if (row) row.rewardClaimed = true;
    });
    try { expect(claimQuestReward(qid)).toBe('grant-failed'); } finally { stop(); }
    expect(restored).toBe(true); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 3 });
    mock.mockRestore(); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(13);
  });
  it('reports an unknown finite side wish overwrite while restoring every other participant and releasing the owner', () => {
    present(); const qid = LARZUK.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

describe('Larzuk source-bound service-only Claim', () => {
  it('refuses proofless completed legacy history in both preview and execution without writes', () => {
    proofless(); const before = bytes();
    expect(canClaim(LARZUK.quest)).toBe(false); expect(claimQuestReward(LARZUK.quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it('separates Present, Claim, and later socket use on different gear with an independent main source', () => {
    map().updateQuestProgress(LARZUK.prerequisite, { rewardClaimed: true });
    useInventoryStore.setState(state => ({ backpack: [...state.backpack, gear('socket-target')],
      questServices: { [mainSource]: { serviceId: 'socket_item', state: 'available' } } }));
    const inventory = JSON.stringify(inv()), hero = structuredClone(usePlayerStore.getState().player), mercs = JSON.stringify(useMercStore.getState());
    present(); expect(JSON.stringify(inv())).toBe(inventory); expect(canClaim(LARZUK.quest)).toBe(true);
    expect(claimQuestReward(LARZUK.quest)).toBe('ok');
    expect(inv().questServices).toEqual({ [mainSource]: { serviceId: 'socket_item', state: 'available' }, [sideSource]: { serviceId: 'socket_item', state: 'available' } });
    expect(usePlayerStore.getState().player).toEqual(hero); expect(JSON.stringify(useMercStore.getState())).toBe(mercs);
    expect(inv().backpack).toEqual([gear(), gear('socket-target')]);
    expect(claimQuestReward(LARZUK.quest)).toBe('already-claimed');
    expect(useQuestService(sideSource, 'socket-target')).toBe('ok');
    expect(inv().backpack[0]).toEqual(gear()); expect(inv().backpack[1]).toEqual({ ...gear('socket-target'), socketCapacity: base.maxSockets });
    expect(inv().questServices[sideSource]).toEqual({ serviceId: 'socket_item', state: 'consumed', targetItemId: 'socket-target' });
    expect(inv().questServices[mainSource]).toEqual({ serviceId: 'socket_item', state: 'available' });
    expect(useQuestService(sideSource, 'socket-target')).toBe('already-consumed');
  });
  it.each(['missing-siege', 'missing-victory', 'missing-objective', 'missing-proof', 'nightmare', 'combat'] as const)('refuses changed %s authority at Claim', fault => {
    present();
    if (fault === 'missing-siege') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, LARZUK.prerequisite); return { questProgress: rows }; });
    if (fault === 'missing-victory') useMapStore.setState({ questReceipts: { [LARZUK.proof]: true } });
    if (fault === 'missing-objective') map().updateQuestProgress(LARZUK.quest, { objectives: { [LARZUK.objective]: false } });
    if (fault === 'missing-proof') useMapStore.setState({ questReceipts: { [siege.proof]: true } });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    const before = bytes(); expect(canClaim(LARZUK.quest)).toBe(false); expect(claimQuestReward(LARZUK.quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it.each(['available', 'consumed', 'absent'] as const)('never restores/regrants claimed proofless legacy %s history', state => {
    proofless(); map().updateQuestProgress(LARZUK.quest, { rewardClaimed: true });
    if (state !== 'absent') useInventoryStore.setState({ questServices: { [sideSource]: state === 'available'
      ? { serviceId: 'socket_item', state } : { serviceId: 'socket_item', state, targetItemId: 'old-side-target' } } });
    const before = bytes(); expect(canClaim(LARZUK.quest)).toBe(false); expect(claimQuestReward(LARZUK.quest)).toBe('already-claimed'); expect(bytes()).toBe(before);
    if (state === 'available') expect(useQuestService(sideSource, 'presented')).toBe('ok');
  });
  it('refuses broadened authored reward bundles before allocating or granting anything', () => {
    present(); const rows = quests.loadQuests(), side = required(rows.find(row => row.id === LARZUK.quest));
    vi.spyOn(quests, 'loadQuests').mockReturnValue(rows.map(row => row === side ? { ...row, rewards: { ...row.rewards, xp: 1 } } : row));
    const before = bytes(); expect(claimQuestReward(LARZUK.quest)).toBe('unsupported-rewards'); expect(bytes()).toBe(before);
  });
  it.each(['service-throw', 'service-silent', 'claimed-throw', 'claimed-silent', 'mutate-entry', 'mutate-main', 'mutate-proof'] as const)(
    'verifies and restores %s under the shared lease while preserving unrelated writes', fault => {
      present(); const beforeRows = structuredClone(map().questProgress), beforeProofs = structuredClone(map().questReceipts);
      if (fault === 'service-throw' || fault === 'service-silent') {
        const real = useInventoryStore.setState;
        vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { if (fault === 'service-silent') return; real(update); throw new Error('after service'); });
      } else {
        let fired = false;
        stops.push(useMapStore.subscribe(() => {
          if (fired) return; fired = true;
          expect(claimQuestReward(LARZUK.quest)).toBe('claim-in-progress'); expect(() => snapshotStores()).toThrow('questBusy');
          useInventoryStore.setState(state => ({ currencies: { ...state.currencies, gems: 8 } }));
          if (fault === 'claimed-throw') throw new Error('after claimed');
          if (fault === 'claimed-silent') map().updateQuestProgress(LARZUK.quest, { rewardClaimed: false });
          if (fault === 'mutate-entry') Object.assign(required(inv().questServices[sideSource]), { targetItemId: 'forged' });
          if (fault === 'mutate-main') useInventoryStore.setState(state => ({ questServices: { ...state.questServices, [mainSource]: { serviceId: 'socket_item', state: 'available' } } }));
          if (fault === 'mutate-proof') useMapStore.setState({ questReceipts: { [siege.proof]: true } });
        }));
      }
      expect(claimQuestReward(LARZUK.quest)).toBe('grant-failed'); expect(map().questProgress).toEqual(beforeRows);
      expect(map().questReceipts).toEqual(beforeProofs); expect(inv().questServices).toEqual({});
      if (!fault.startsWith('service')) expect(inv().currencies.gems).toBe(8);
    });
});
