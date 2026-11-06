import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as towns from '@/data/loaders/towns';
import { loadItemBases } from '@/data/loaders/loot';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { LARZUK } from '@/engine/map/larzuk-quest';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { canPresentLarzukItem, larzukPresentCandidates, selectLarzukPresentItem, currentLarzukPresentItem, presentLarzukItem } from './larzukPresent';

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

describe('Larzuk explicit unchanged-item Present', () => {
  it('completes only its objective and proof, with no charge, XP or gear change before Siege Claim', () => {
    const selection = selected(), inventory = JSON.stringify(inv()), hero = structuredClone(usePlayerStore.getState().player);
    expect(larzukPresentCandidates()).toEqual([selection.item]);
    expect(currentLarzukPresentItem(selection)).toBe(selection.item);
    expect(presentLarzukItem(selection)).toBe('ok');
    expect(inv().backpack[0]).toBe(selection.item);
    expect(JSON.stringify(inv())).toBe(inventory);
    expect(usePlayerStore.getState().player).toEqual(hero);
    expect(map().questProgress[LARZUK.quest]).toEqual({ id: LARZUK.quest, status: 'completed', rewardClaimed: false, objectives: { [LARZUK.objective]: true } });
    expect(map().questReceipts).toEqual({ [siege.proof]: true, [LARZUK.proof]: true });
    expect(map().currentSubAreaId).toBe('areas/act5-bloody-foothills');
    const before = bytes(); expect(presentLarzukItem(selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it.each(['unclaimed', 'available', 'consumed'] as const)('is independent of Siege reward state %s', state => {
    if (state !== 'unclaimed') {
      useMapStore.getState().updateQuestProgress(LARZUK.prerequisite, { rewardClaimed: true });
      useInventoryStore.setState({ questServices: { [mainSource]: state === 'available'
        ? { serviceId: 'socket_item', state } : { serviceId: 'socket_item', state, targetItemId: 'old-main-target' } } });
    }
    const before = structuredClone(inv().questServices);
    expect(presentLarzukItem(selected())).toBe('ok'); expect(inv().questServices).toEqual(before);
  });
  it('repairs completed unclaimed proofless history only through real Present', () => {
    map().updateQuestProgress(LARZUK.quest, { status: 'completed', objectives: { [LARZUK.objective]: true } });
    expect(canPresentLarzukItem()).toBe(true); expect(presentLarzukItem(selected())).toBe('ok');
  });
  it.each(['missing-siege', 'missing-victory', 'incomplete-siege', 'false-objective', 'missing-side', 'wrong-side-id', 'untracked', 'claimed', 'extra-objective', 'wrong-act', 'locked', 'missing-npc', 'nightmare', 'loading', 'no-player', 'combat'] as const)(
    'refuses %s without publication', fault => {
      const selection = selected();
      if (fault === 'missing-siege') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, LARZUK.prerequisite); return { questProgress: rows }; });
      if (fault === 'missing-victory') useMapStore.setState({ questReceipts: {} });
      if (fault === 'incomplete-siege') map().updateQuestProgress(LARZUK.prerequisite, { status: 'inProgress' });
      if (fault === 'false-objective') map().updateQuestProgress(LARZUK.prerequisite, { objectives: { [siege.objectiveId]: false } });
      if (fault === 'missing-side') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, LARZUK.quest); return { questProgress: rows }; });
      if (fault === 'wrong-side-id') map().updateQuestProgress(LARZUK.quest, { id: 'wrong' });
      if (fault === 'untracked') map().updateQuestProgress(LARZUK.quest, { status: 'available' });
      if (fault === 'claimed') map().updateQuestProgress(LARZUK.quest, { status: 'completed', rewardClaimed: true, objectives: { [LARZUK.objective]: true } });
      if (fault === 'extra-objective') map().updateQuestProgress(LARZUK.quest, { objectives: { [LARZUK.objective]: false, forged: false } });
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 4 });
      if (fault === 'locked') useMapStore.setState({ isActUnlocked: () => false });
      if (fault === 'missing-npc') vi.mocked(towns.loadTownNpcs).mockReturnValue([]);
      if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
      if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
      if (fault === 'no-player') usePlayerStore.getState().reset();
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      const before = bytes(); expect(canPresentLarzukItem()).toBe(false); expect(larzukPresentCandidates()).toEqual([]);
      expect(currentLarzukPresentItem(selection)).toBeNull();
      expect(presentLarzukItem(selection)).toBe(fault === 'loading' ? 'not-ready' : fault === 'no-player' ? 'no-player' : fault === 'combat' ? 'combat-active' : 'not-eligible');
      expect(bytes()).toBe(before);
    });
  it.each(['lookalike', 'replacement', 'deep-mutation', 'move', 'duplicate', 'hero-replacement'] as const)('rejects stale %s selection', fault => {
    const selection = selected(), item = selection.item;
    if (fault === 'lookalike') expect(selectLarzukPresentItem(structuredClone(item))).toBeNull();
    if (fault === 'replacement') useInventoryStore.setState({ backpack: [structuredClone(item)] });
    if (fault === 'deep-mutation') Object.assign(required(item.baseRolls), { attack: 999 });
    if (fault === 'move') useInventoryStore.setState({ backpack: [], stash: [item] });
    if (fault === 'duplicate') useInventoryStore.setState({ stash: [structuredClone(item)] });
    if (fault === 'hero-replacement') usePlayerStore.setState({ player: structuredClone(selection.hero) });
    if (fault === 'lookalike') return;
    const before = bytes(); expect(currentLarzukPresentItem(selection)).toBeNull(); expect(presentLarzukItem(selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it('holds the shared lease through publication and refuses reentry/snapshot', () => {
    const selection = selected(); let calls = 0;
    expect(withQuestTransaction(() => presentLarzukItem(selection))).toBe('claim-in-progress');
    stops.push(useMapStore.subscribe(() => { calls++; expect(presentLarzukItem(selection)).toBe('claim-in-progress'); expect(() => snapshotStores()).toThrow('questBusy'); }));
    expect(presentLarzukItem(selection)).toBe('ok'); expect(calls).toBe(1);
  });
  it.each(['throw-before', 'throw-after', 'silent', 'mutate-row', 'mutate-proof', 'mutate-item', 'move-item', 'mutate-main-source'] as const)(
    'restores deep participants after %s while preserving unrelated writes', fault => {
      const selection = selected(), itemBefore = structuredClone(selection.item), rowsBefore = structuredClone(map().questProgress), proofsBefore = structuredClone(map().questReceipts);
      if (fault === 'throw-before' || fault === 'throw-after' || fault === 'silent') {
        const real = useMapStore.setState;
        vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { if (fault === 'throw-before') throw new Error('before'); if (fault === 'silent') return; real(update); throw new Error('after'); });
      } else {
        let fired = false;
        stops.push(useMapStore.subscribe(() => {
          if (fired) return; fired = true;
          useInventoryStore.setState(state => ({ currencies: { ...state.currencies, gems: 7 }, backpack: [...state.backpack, gear('unrelated')] }));
          if (fault === 'mutate-row') Object.assign(required(map().questProgress[LARZUK.quest]), { rewardClaimed: true });
          if (fault === 'mutate-proof') useMapStore.setState({ questReceipts: { [siege.proof]: true } });
          if (fault === 'mutate-item') Object.assign(required(selection.item.baseRolls), { attack: 999 });
          if (fault === 'move-item') useInventoryStore.setState(state => ({ backpack: state.backpack.filter(row => row !== selection.item), socketQuarantine: [{ sourceVersion: 18, item: selection.item, origin: { container: 'backpack', index: 0 } }] }));
          if (fault === 'mutate-main-source') useInventoryStore.setState({ questServices: { [mainSource]: { serviceId: 'socket_item', state: 'available' } } });
        }));
      }
      expect(presentLarzukItem(selection)).toBe('grant-failed');
      expect(map().questProgress).toEqual(rowsBefore); expect(map().questReceipts).toEqual(proofsBefore);
      expect(inv().backpack[0]).toEqual(itemBefore); expect(inv().socketQuarantine).toEqual([]);
      expect(inv().questServices).toEqual({}); expect(inv().questServices[sideSource]).toBeUndefined();
      if (fault.startsWith('mutate') || fault === 'move-item') { expect(inv().currencies.gems).toBe(7); expect(inv().backpack[1]?.id).toBe('unrelated'); }
    });
  it.each([false, true])('preserves independent equipment and restores matching hero stats; observer throws=%s', throws => {
    const cap: Item = { id: 'independent-cap', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
      identified: true, equipped: false, baseRolls: { defense: 5 },
      affixes: [{ affixId: 'life', values: new Map([['statMods.life', 7]]) }] };
    useInventoryStore.setState(state => ({ backpack: [...state.backpack, cap] }));
    const selection = selected(), hero = structuredClone(selection.hero);
    let fired = false;
    stops.push(useMapStore.subscribe(() => {
      if (fired) return; fired = true;
      expect(inv().equipItem(cap)).toEqual({ ok: true });
      if (throws) throw new Error('Independent equip then throw');
    }));
    expect(presentLarzukItem(selection)).toBe('grant-failed');
    expect(fired).toBe(true); expect(inv().equipped.head?.id).toBe(cap.id);
    expect(inv().backpack).toEqual([selection.itemBefore]);
    const expected = { ...hero, derivedStats: deriveEquippedPlayerStats(hero, hero.level, inv().equipped,
      map().questProgress, inv().questItems, map().questReceipts) };
    expect(usePlayerStore.getState().player).toEqual(expected);
    expect(expected.derivedStats.lifeMax).toBe(hero.derivedStats.lifeMax + 7);
    expect(map().questReceipts[LARZUK.proof]).toBeUndefined();
  });
  it('reports restoration failure explicitly and releases the lease', () => {
    const selection = selected(), real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementation(update => { real(update); throw new Error('publication or rollback'); });
    expect(() => presentLarzukItem(selection)).toThrow(AggregateError);
    vi.mocked(useMapStore.setState).mockRestore(); expect(() => snapshotStores()).not.toThrow();
  });
});
