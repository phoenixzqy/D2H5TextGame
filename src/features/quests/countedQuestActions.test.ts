import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCountedQuestItems, type CountedQuestKey } from '@/data/loaders/counted-quest-items';
import * as quests from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { areaCountedQuestSources, countedJadeGiveStatus, countedQuestCounters, countedSourceStatus, giveCountedJade, recoverCountedQuestSource } from './countedQuestActions';
import { canClaim, claimQuestReward } from './claimReward';
import { withQuestTransaction } from './questTransaction';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function definition(key: CountedQuestKey) { const result = loadCountedQuestItems().find(row => row.key === key); if (!result) throw new Error('Missing counted fixture'); return result; }
function track(key: CountedQuestKey, legacy = false) {
  const d = definition(key);
  useMapStore.setState({ currentAct: Number(d.actId.slice(-1)), currentSubAreaId: d.areaId,
    questProgress: { [d.quest]: { id: d.quest, status: legacy ? 'completed' : 'inProgress', rewardClaimed: false, objectives: { [d.objective]: legacy } } } });
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true); return d;
}
const player = () => usePlayerStore.getState().player;
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Counted', 'sorceress'));
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('finite counted Recover and Meshif Give', () => {
  it.each(['alkor', 'jade', 'jamella', 'malah'] as const)('discovers and recovers every distinct %s object, without reward or hidden main gates', key => {
    const d = track(key), before = structuredClone(player());
    const objects = areaCountedQuestSources(d.areaId);
    expect(objects.map(row => row.placement.source)).toEqual(d.sources);
    expect(objects.map(row => row.ordinal)).toEqual(d.sources.map((_, index) => index + 1));
    expect(areaCountedQuestSources('areas/not-real')).toEqual([]);
    for (const [index, source] of d.sources.entries()) {
      expect(countedSourceStatus(source)).toBe('available'); expect(recoverCountedQuestSource(source)).toBe('ok');
      expect(countedSourceStatus(source)).toBe('owned'); expect(recoverCountedQuestSource(source)).toBe('already-recovered');
      expect(countedQuestCounters(key)).toEqual({ held: index + 1, recovered: index + 1, consumed: 0, total: d.sources.length });
      expect(useMapStore.getState().questProgress[d.quest]?.status).toBe(key !== 'jade' && index === d.sources.length - 1 ? 'completed' : 'inProgress');
      expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
    }
    expect(player()).toEqual(before); expect(useInventoryStore.getState().currencies).toEqual({}); expect(useInventoryStore.getState().materials).toEqual({});
    expect(canClaim(d.quest)).toBe(key !== 'jade');
  });
  it('requires actual Normal current Meshif all-three Give, pays nothing, and permits later Claim elsewhere', () => {
    const d = track('jade');
    useMapStore.setState({ currentAct: 2 }); expect(giveCountedJade()).toBe('wrong-location');
    useMapStore.setState({ currentAct: 3 });
    expect(recoverCountedQuestSource(d.sources[0] ?? '')).toBe('ok');
    expect(countedJadeGiveStatus()).toBe('missing-items');
    for (const source of d.sources.slice(1)) expect(recoverCountedQuestSource(source)).toBe('ok');
    expect(canClaim(d.quest)).toBe(false); const before = structuredClone(player());
    useMapStore.setState({ selectedDifficulty: 'nightmare' }); expect(giveCountedJade()).toBe('wrong-difficulty');
    useMapStore.setState({ selectedDifficulty: 'normal' }); expect(countedJadeGiveStatus()).toBe('available'); expect(giveCountedJade()).toBe('ok');
    expect(giveCountedJade()).toBe('already-delivered'); expect(player()).toEqual(before);
    expect(countedQuestCounters('jade')).toEqual({ held: 0, consumed: 3, recovered: 3, total: 3 });
    expect(useInventoryStore.getState().currencies).toEqual({});
    useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor', selectedDifficulty: 'hell' });
    expect(canClaim(d.quest)).toBe(true); expect(claimQuestReward(d.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(1000);
  });
  it.each(['alkor', 'jade', 'jamella', 'malah'] as const)('allows genuine partial repair of completed unclaimed %s history', key => {
    const d = track(key, true); expect(canClaim(d.quest)).toBe(false);
    expect(recoverCountedQuestSource(d.sources[0] ?? '')).toBe('ok'); expect(canClaim(d.quest)).toBe(false);
    expect(useMapStore.getState().questProgress[d.quest]?.status).toBe('completed');
    expect(countedQuestCounters(key).held).toBe(1);
  });
  it.each(['loading', 'no-player', 'combat', 'nightmare', 'wrong-area', 'locked', 'untracked', 'claimed', 'objective', 'n-plus-one', 'cross-family'] as const)('refuses %s without granting a source', fault => {
    const d = track('alkor'), source = d.sources[0] ?? '';
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.setState({ player: null });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
    if (fault === 'locked') vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(false);
    if (fault === 'untracked') useMapStore.setState({ questProgress: {} });
    if (fault === 'claimed') useMapStore.getState().updateQuestProgress(d.quest, { status: 'completed', objectives: { [d.objective]: true }, rewardClaimed: true });
    if (fault === 'objective') useMapStore.getState().updateQuestProgress(d.quest, { objectives: { extra: false } });
    if (fault === 'n-plus-one') useInventoryStore.setState({ questItems: { [`${source}-extra`]: { itemId: d.itemId, state: 'owned' } } });
    if (fault === 'cross-family') useInventoryStore.setState({ questItems: { [source]: { itemId: definition('jade').itemId, state: 'owned' } } });
    const before = structuredClone(useInventoryStore.getState().questItems);
    expect(recoverCountedQuestSource(source)).not.toBe('ok'); expect(useInventoryStore.getState().questItems).toEqual(before);
  });
  it('refuses unknown exact sources and nested action reentry', () => {
    const d = track('alkor'), source = d.sources[0] ?? '';
    expect(recoverCountedQuestSource(`${source}-extra`)).toBe('unknown-source');
    expect(withQuestTransaction(() => recoverCountedQuestSource(source))).toBe('claim-in-progress');
    expect(useInventoryStore.getState().questItems).toEqual({});
  });
  it('refuses a paused actual active run before granting a source', () => {
    const d = track('alkor');
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor'); expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); expect(recoverCountedQuestSource(d.sources[0] ?? '')).toBe('combat-active');
    expect(useInventoryStore.getState().questItems).toEqual({});
  });
  it.each(['source-throw', 'row-silent', 'mixed-consumed'] as const)('restores all Jade ingredients and incomplete delivery after Give %s', fault => {
    const d = track('jade');
    for (const source of d.sources) expect(recoverCountedQuestSource(source)).toBe('ok');
    useMapStore.setState({ currentSubAreaId: null });
    const before = structuredClone({ hero: player(), items: useInventoryStore.getState().questItems, row: useMapStore.getState().questProgress[d.quest] });
    if (fault === 'source-throw') { const real = useInventoryStore.setState; vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('Give source'); }); }
    if (fault === 'row-silent') vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => undefined);
    if (fault === 'mixed-consumed') {
      let fired = false; stops.push(useInventoryStore.subscribe(() => {
        if (fired) return; fired = true;
        const source = d.sources[0]; if (source) useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [source]: { itemId: d.itemId, state: 'owned' } } }));
      }));
    }
    expect(giveCountedJade()).toBe('grant-failed');
    expect({ hero: player(), items: useInventoryStore.getState().questItems, row: useMapStore.getState().questProgress[d.quest] }).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({}); expect(canClaim(d.quest)).toBe(false);
  });
  it.each(['item-throw', 'item-silent', 'row-throw', 'row-silent', 'row-mutate', 'hero-change', 'area-change'] as const)('restores scoped action source/row after %s and preserves independent changes', fault => {
    const d = track('alkor'), source = d.sources.at(-1) ?? '', before = structuredClone(useMapStore.getState().questProgress[d.quest]);
    const beforeItems = Object.fromEntries(d.sources.slice(0, -1).map(key => [key, { itemId: d.itemId, state: 'owned' as const }]));
    useInventoryStore.setState({ questItems: beforeItems });
    if (fault.startsWith('item')) {
      const real = useInventoryStore.setState; vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { if (fault === 'item-silent') return; real(update); throw new Error('item fault'); });
    } else if (fault.startsWith('row-') && fault !== 'row-mutate') {
      const real = useMapStore.setState; vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { if (fault === 'row-silent') return; real(update); throw new Error('row fault'); });
    } else {
      let fired = false; stops.push(useInventoryStore.subscribe(() => {
        if (fired) return; fired = true;
        useInventoryStore.getState().addCurrency('unrelated', 7);
        if (fault === 'hero-change') usePlayerStore.getState().addXP(2);
        if (fault === 'area-change') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
        if (fault === 'row-mutate') { const row = useMapStore.getState().questProgress[d.quest]; if (row) row.rewardClaimed = true; }
      }));
    }
    expect(recoverCountedQuestSource(source)).toBe('grant-failed'); expect(useInventoryStore.getState().questItems).toEqual(beforeItems);
    expect(useMapStore.getState().questProgress[d.quest]).toEqual(before);
    if (fault === 'hero-change') expect(player()?.experience).toBe(2);
    if (fault === 'area-change') expect(useMapStore.getState().currentSubAreaId).toBe('areas/act1-blood-moor');
  });
  it('rejects source/row/reward getters without executing them', () => {
    const d = track('alkor'), source = d.sources[0] ?? ''; let reads = 0;
    Object.defineProperty(useInventoryStore.getState().questItems, source, { configurable: true, enumerable: true, get: () => { reads++; return { itemId: d.itemId, state: 'owned' }; } });
    expect(recoverCountedQuestSource(source)).toBe('invalid-state'); expect(reads).toBe(0);
    useInventoryStore.setState({ questItems: {} });
    const rows = quests.loadQuests(), changed = rows.map(row => row.id === d.quest ? { ...row } : row), target = changed.find(row => row.id === d.quest);
    if (!target) throw new Error('Missing fixture');
    Object.defineProperty(target, 'rewards', { enumerable: true, get: () => { reads++; return { xp: 4500, statPoints: 5 }; } });
    vi.spyOn(quests, 'loadQuests').mockReturnValue(changed);
    expect(recoverCountedQuestSource(source)).toBe('invalid-state'); expect(reads).toBe(0);
  });
});
