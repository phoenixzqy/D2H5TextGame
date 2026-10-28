/** Constructed real-store D11 service cases; no earned progression or balance claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import * as persistence from '@/stores/persistence';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import * as loot from '@/data/loaders/loot';
import { createRng, hashSeed } from '@/engine/rng';
import { prepareRareAffixes } from '@/engine/loot/rollItem';
import type { Item } from '@/engine/types/items';
import { MALUS_QUEST as MAIN, MALUS_SIDE_QUEST as SIDE, MALUS_SOURCE, MALUS_ITEM } from '@/engine/map/malus-quest';
import { ACT1_IMBUE_SOURCES as SOURCES, ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { claimQuestReward } from '@/features/quests/claimReward';
import { useQuestService } from './questServices';
import { charsiImbueSources, charsiImbueCandidates, selectCharsiPresentItem, selectCharsiImbueItem,
  presentCharsiItem, restoreCharsiImbue, imbueCharsiItem } from './charsiImbue';

const stores = [usePlayerStore, useMapStore, useInventoryStore, useMercStore] as const;
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests(); useCombatStore.getState().reset();
  for (const store of stores) store.getState().reset();
}
function snapshot() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
function item(type = 'weapon'): Item {
  const base = [...loot.loadItemBases().values()].find(row => row.type === type && row.reqLevel > 1 && row.canHaveAffixes);
  if (!base) throw new Error('Missing native base');
  return { id: 'imbue-' + type, baseId: base.id, rarity: 'normal', level: 50, ilvl: 50,
    identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    baseRolls: { attack: 23 }, generatedName: { prefix: 'historical/prefix' } };
}
function presentSelection(target: Item) {
  const selected = selectCharsiPresentItem(target); expect(selected).not.toBeNull();
  if (!selected) throw new Error('Missing Present selection'); return selected;
}
function useSelection(source: string, target: Item) {
  const selected = selectCharsiImbueItem(source, target); expect(selected).not.toBeNull();
  if (!selected) throw new Error('Missing Imbue selection'); return selected;
}
function earnBoth() {
  const map = useMapStore.getState(), side = map.questProgress[SIDE]; if (!side) throw new Error('Missing side');
  useMapStore.setState({ questProgress: { ...map.questProgress, [SIDE]: { ...side, status: 'completed', objectives: { 'obj-bring-item': true } } },
    questReceipts: { [R.presentItem]: true } });
  expect(claimQuestReward(MAIN)).toBe('ok'); expect(claimQuestReward(SIDE)).toBe('ok');
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Imbue', 'sorceress'));
  useMapStore.setState({ currentAct: 1, questProgress: {
    [MAIN]: { id: MAIN, status: 'completed', rewardClaimed: false, objectives: { 'obj-recover-malus': true, 'obj-imbue-ready': true } },
    [SIDE]: { id: SIDE, status: 'inProgress', rewardClaimed: false, objectives: {} }
  } });
  useInventoryStore.setState({ questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('D11 explicit Charsi Present, Restore and witnessed Imbue', () => {
  it('discovers independent charges, complete absence repair, and consumption without a surviving target', () => {
    expect(charsiImbueSources()).toEqual([]); earnBoth();
    expect(charsiImbueSources()).toEqual([
      { source: SOURCES.main, state: 'available' }, { source: SOURCES.side, state: 'available' }
    ]);
    useInventoryStore.setState({ questServices: { [SOURCES.side]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: 'salvaged' } } });
    expect(charsiImbueSources()).toEqual([
      { source: SOURCES.main, state: 'restorable' }, { source: SOURCES.side, state: 'consumed' }
    ]);
  });
  it('discovery requires full proof and readiness, and offers no absent source repair in replay', () => {
    earnBoth(); useInventoryStore.setState({ questServices: {} });
    expect(charsiImbueSources()).toHaveLength(2);
    useMapStore.setState({ questReceipts: {} });
    expect(charsiImbueSources()).toEqual([{ source: SOURCES.main, state: 'restorable' }]);
    useHydrationStore.getState().setStatus('loading'); expect(charsiImbueSources()).toEqual([]);
    useHydrationStore.getState().setStatus('ready'); const evidence = campaignEvidence();
    useMapStore.setState(state => ({ selectedDifficulty: 'nightmare', questDifficulties: { 'difficulty/nightmare': true },
      questProgress: { ...state.questProgress, ...evidence.questProgress }, questReceipts: { ...state.questReceipts, ...evidence.questReceipts } }));
    expect(charsiImbueSources()).toEqual([]);
    useInventoryStore.setState({ questServices: { [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } } });
    expect(charsiImbueSources()).toEqual([{ source: SOURCES.main, state: 'available' }]);
    useMapStore.setState({ questDifficulties: {} }); expect(charsiImbueSources()).toEqual([]);
  });

  it('presents the actual item unchanged before main Claim, publishing only side objective and receipt', () => {
    const target = item(); useInventoryStore.setState({ backpack: [target] }); const before = snapshot();
    const rows = structuredClone(useMapStore.getState().questProgress);
    expect(charsiImbueCandidates()).toEqual([target]);
    expect(presentCharsiItem(presentSelection(target))).toBe('ok');
    const map = before[1]; if (!map) throw new Error('Missing map');
    Object.assign(map, { questProgress: { ...rows, [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-bring-item': true } } }, questReceipts: { [R.presentItem]: true } });
    expect(useMapStore.getState().questProgress[SIDE]).toEqual({ id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-bring-item': true } });
    expect(snapshot()).toEqual(before); expect(useInventoryStore.getState().backpack[0]).toBe(target);
    expect(selectCharsiPresentItem(target)).toBeNull();
    useInventoryStore.setState({ backpack: [] }); expect(claimQuestReward(SIDE)).toBe('ok');
  });
  it.each([false, true])('repairs sparse completed side proof while preserving claimed=%s and income', claimed => {
    const target = item(); useInventoryStore.setState({ backpack: [target] });
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: claimed, objectives: {} } } }));
    const hero = structuredClone(usePlayerStore.getState().player);
    expect(presentCharsiItem(presentSelection(target))).toBe('ok');
    expect(useMapStore.getState().questProgress[SIDE]?.rewardClaimed).toBe(claimed);
    expect(usePlayerStore.getState().player).toEqual(hero);
    expect(useInventoryStore.getState().questServices).toEqual({});
  });
  it.each([SOURCES.main, SOURCES.side])('restores exactly absent preserved claimed source %s once', source => {
    earnBoth(); useInventoryStore.setState({ questServices: {} }); const before = snapshot();
    expect(restoreCharsiImbue(source)).toBe('ok');
    const inv = before[2]; if (!inv) throw new Error('Missing inventory');
    Object.assign(inv, { questServices: { [source]: { serviceId: 'imbue_item', state: 'available' } } });
    expect(snapshot()).toEqual(before); const after = snapshot();
    expect(restoreCharsiImbue(source)).toBe('already-available'); expect(snapshot()).toEqual(after);
  });
  it.each([SOURCES.main, SOURCES.side])('never restores consumed %s after its target is absent', source => {
    earnBoth(); useInventoryStore.setState(state => ({ questServices: { ...state.questServices,
      [source]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: 'salvaged-forever' } } }));
    const before = snapshot(); expect(restoreCharsiImbue(source)).toBe('already-consumed'); expect(snapshot()).toEqual(before);
  });
  it.each([['weapon', SOURCES.main], ['armor', SOURCES.main], ['weapon', SOURCES.side], ['armor', SOURCES.side]] as const)('imbues selected %s via %s with exact seed and only the four permitted fields', (type, source) => {
    earnBoth(); const target = item(type); useInventoryStore.setState({ backpack: [target] }); const before = snapshot(), services = structuredClone(useInventoryStore.getState().questServices);
    const hero = usePlayerStore.getState().player, base = loot.loadItemBases().get(target.baseId);
    if (!hero || !base) throw new Error('Missing seed inputs');
    const rules = loot.loadRarityAffixRules().rare; if (!rules) throw new Error('Missing rare rules');
    const expected = prepareRareAffixes(base, target.ilvl ?? target.level, loot.loadAffixPool(), rules)(
      createRng(hashSeed(JSON.stringify(['quest-imbue-v1', hero.id, source, target.id, target.baseId, target.ilvl ?? target.level]))));
    expect(imbueCharsiItem(useSelection(source, target))).toBe('ok');
    const inv = before[2]; if (!inv) throw new Error('Missing inventory');
    Object.assign(inv, { backpack: [{ ...target, rarity: 'rare', affixes: expected, generatedName: {}, identified: true }],
      questServices: { ...services, [source]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: target.id } } });
    expect(snapshot()).toEqual(before);
    expect(useInventoryStore.getState().questServices[source]).toEqual({ serviceId: 'imbue_item', state: 'consumed', targetItemId: target.id });
    expect(useInventoryStore.getState().questServices[source === SOURCES.main ? SOURCES.side : SOURCES.main]?.state).toBe('available');
  });
  it('uses an earned source in unlocked replay while unearned Present and absent Restore refuse', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] });
    const evidence = campaignEvidence();
    useMapStore.setState(state => ({ selectedDifficulty: 'nightmare', questDifficulties: { 'difficulty/nightmare': true },
      questProgress: { ...state.questProgress, ...evidence.questProgress }, questReceipts: { ...state.questReceipts, ...evidence.questReceipts } }));
    useMapStore.setState(state => { const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, R.presentItem);
      return { questReceipts: receipts, questProgress: { ...state.questProgress, [SIDE]: { id: SIDE, status: 'inProgress', rewardClaimed: false, objectives: {} } } }; });
    useInventoryStore.setState(state => { const services = { ...state.questServices }; Reflect.deleteProperty(services, SOURCES.side); return { questServices: services }; });
    const before = snapshot(); expect(selectCharsiPresentItem(target)).toBeNull();
    expect(restoreCharsiImbue(SOURCES.main)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
    expect(imbueCharsiItem(useSelection(SOURCES.main, target))).toBe('ok');
    expect(useInventoryStore.getState().questServices[SOURCES.main]?.state).toBe('consumed');
  });
  it.each(['unidentified', 'equipped', 'magic', 'jewelry', 'sockets', 'contents', 'affixes', 'unique', 'set', 'runeword',
    'zero-ilvl', 'unsafe-ilvl', 'unknown', 'duplicate', 'hero-mirror', 'quarantine', 'detached'])('refuses %s target before effects', kind => {
    const control = item(); useInventoryStore.setState({ backpack: [control] }); expect(selectCharsiPresentItem(control)).not.toBeNull();
    expect(claimQuestReward(MAIN)).toBe('ok'); expect(selectCharsiImbueItem(SOURCES.main, control)).not.toBeNull();
    let target = item(kind === 'jewelry' ? 'jewelry' : 'weapon');
    if (kind === 'unidentified') target = { ...target, identified: false };
    if (kind === 'equipped') target = { ...target, equipped: true };
    if (kind === 'magic') target = { ...target, rarity: 'magic' };
    if (kind === 'sockets') target = { ...target, socketCapacity: 1 };
    if (kind === 'contents') target = { ...target, socketContents: [{ kind: 'rune', id: 'runes/el' }] };
    if (kind === 'affixes') target = { ...target, affixes: [{ affixId: 'old/affix', values: new Map() }] };
    if (kind === 'unique') target = { ...target, uniqueId: 'items/unique/pelta-lunata' };
    if (kind === 'set') target = { ...target, setPieceId: 'sets/invalid' };
    if (kind === 'runeword') Object.assign(target, { runewordId: undefined });
    if (kind === 'zero-ilvl') target = { ...target, ilvl: 0 };
    if (kind === 'unsafe-ilvl') target = { ...target, ilvl: Number.MAX_SAFE_INTEGER + 1 };
    if (kind === 'unknown') target = { ...target, baseId: 'missing/base' };
    useInventoryStore.setState({ backpack: [target], ...(kind === 'duplicate' ? { stash: [target] } : {}) });
    if (kind === 'hero-mirror') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player, equipment: [target] } : null }));
    if (kind === 'quarantine') useInventoryStore.setState({ legacyGearQuarantine: [{ item: target, origin: { container: 'backpack', index: 0 } }] });
    const before = snapshot(); expect(selectCharsiImbueItem(SOURCES.main, kind === 'detached' ? { ...target } : target)).toBeNull();
    expect(selectCharsiPresentItem(kind === 'detached' ? { ...target } : target)).toBeNull(); expect(snapshot()).toEqual(before);
  });
  it.each(['item-replace', 'item-mutate', 'hero-replace', 'source-replace', 'source-mutate'])('refuses stale %s witness', kind => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const selected = useSelection(SOURCES.main, target);
    if (kind === 'item-replace') useInventoryStore.setState({ backpack: [{ ...target }] });
    if (kind === 'item-mutate') Object.assign(target, { baseRolls: { attack: 24 } });
    if (kind === 'hero-replace') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
    if (kind === 'source-replace') useInventoryStore.setState(state => ({ questServices: { ...state.questServices,
      [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } } }));
    if (kind === 'source-mutate') Object.assign(useInventoryStore.getState().questServices[SOURCES.main] ?? {}, { targetItemId: 'tampered' });
    const before = snapshot(); expect(imbueCharsiItem(selected)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
  });
  it('refuses impossible rare pool privately without spending or constructing another item', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const selected = useSelection(SOURCES.main, target);
    vi.spyOn(loot, 'loadAffixPool').mockReturnValue([]); const before = snapshot();
    expect(imbueCharsiItem(selected)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
  });
  it('cannot bypass item/source witnesses through generic ID-only use', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const before = snapshot();
    expect(useQuestService(SOURCES.main, target.id)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
  });
  it('detects moved/mutated target and proof, restores scoped participants, then retries deterministically', () => {
    earnBoth(); const target = item(), other = { ...item(), id: 'unrelated-item' };
    useInventoryStore.setState({ backpack: [target] }); const selected = useSelection(SOURCES.main, target);
    const before = snapshot(); let fired = false; let failedAffixes: Item['affixes'];
    const stop = useInventoryStore.subscribe(state => {
      if (fired) return; fired = true; const published = state.backpack[0]; if (!published) throw new Error('Missing publication');
      failedAffixes = structuredClone(published.affixes); Object.assign(published, { id: 'renamed-target' });
      const main = useMapStore.getState().questProgress[MAIN]; if (main) Object.assign(main.objectives, { 'obj-imbue-ready': false });
      useInventoryStore.setState({ backpack: [other], socketQuarantine: [{ sourceVersion: 18, item: published, origin: { container: 'backpack', index: 0 } }] });
      throw new Error('injected mutate then throw');
    });
    try { expect(imbueCharsiItem(selected)).toBe('grant-failed'); } finally { stop(); }
    const inv = before[2]; if (!inv) throw new Error('Missing inventory'); Object.assign(inv, { backpack: [target, other] });
    expect(snapshot()).toEqual(before); const restored = useInventoryStore.getState().backpack[0]; if (!restored) throw new Error('Missing restored target');
    expect(imbueCharsiItem(useSelection(SOURCES.main, restored))).toBe('ok'); expect(useInventoryStore.getState().backpack[0]?.affixes).toEqual(failedAffixes);
  });
  it('keeps the shared lease through publication and refuses reentrancy', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const selected = useSelection(SOURCES.main, target);
    const results: string[] = []; const stop = useInventoryStore.subscribe(() => results.push(imbueCharsiItem(selected)));
    try { expect(imbueCharsiItem(selected)).toBe('ok'); } finally { stop(); } expect(results).toEqual(['claim-in-progress']);
  });
  it.each(['present', 'restore', 'use'])('restores silent %s publication loss before retry', action => {
    const target = item(); useInventoryStore.setState({ backpack: [target] });
    if (action !== 'present') earnBoth();
    if (action === 'restore') useInventoryStore.setState({ questServices: {} });
    const before = snapshot(); let fired = false;
    const chosenPresent = action === 'present' ? presentSelection(target) : null;
    const chosenUse = action === 'use' ? useSelection(SOURCES.main, target) : null;
    const stop = action === 'present' ? useMapStore.subscribe(() => {
      if (fired) return; fired = true; useMapStore.setState({ questReceipts: {} });
    }) : useInventoryStore.subscribe(() => {
      if (fired) return; fired = true; useInventoryStore.setState(state => {
        const services = { ...state.questServices }; Reflect.deleteProperty(services, SOURCES.main); return { questServices: services };
      });
    });
    try { expect(action === 'present' ? presentCharsiItem(chosenPresent) : action === 'restore'
      ? restoreCharsiImbue(SOURCES.main) : imbueCharsiItem(chosenUse)).toBe('grant-failed'); } finally { stop(); }
    expect(fired).toBe(true); expect(snapshot()).toEqual(before);
    const restored = useInventoryStore.getState().backpack[0]; if (!restored) throw new Error('Missing restored target');
    expect(action === 'present' ? presentCharsiItem(presentSelection(restored)) : action === 'restore'
      ? restoreCharsiImbue(SOURCES.main) : imbueCharsiItem(useSelection(SOURCES.main, restored))).toBe('ok');
  });
  it.each(['missing-malus', 'missing-present', 'unclaimed', 'unknown-source', 'undefined-entry', 'malformed-entry'])('refuses Restore with %s authority', kind => {
    earnBoth(); useInventoryStore.setState({ questServices: {} }); let source: string = SOURCES.side;
    if (kind === 'missing-malus') useInventoryStore.setState({ questItems: {} });
    if (kind === 'missing-present') useMapStore.setState({ questReceipts: {} });
    if (kind === 'unclaimed') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-bring-item': true } } } }));
    if (kind === 'unknown-source') source = 'quests/unknown#reward:service';
    if (kind === 'undefined-entry') Object.defineProperty(useInventoryStore.getState().questServices, source, { value: undefined, enumerable: true });
    if (kind === 'malformed-entry') Object.defineProperty(useInventoryStore.getState().questServices, source,
      { value: { serviceId: 'imbue_item', state: 'available', targetItemId: 'wrong' }, enumerable: true });
    const before = snapshot(); expect(restoreCharsiImbue(source)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
  });
  it.each(['item-replace', 'item-mutate', 'hero-replace'])('refuses stale Present %s witness', kind => {
    const target = item(); useInventoryStore.setState({ backpack: [target] }); const selected = presentSelection(target);
    if (kind === 'item-replace') useInventoryStore.setState({ backpack: [{ ...target }] });
    if (kind === 'item-mutate') Object.assign(target, { level: 49 });
    if (kind === 'hero-replace') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
    const before = snapshot(); expect(presentCharsiItem(selected)).toBe('not-eligible'); expect(snapshot()).toEqual(before);
  });
  it.each(['present', 'restore', 'use'])('guards %s against hydration, combat, active run, replacement and wrong town', action => {
    const target = item(); useInventoryStore.setState({ backpack: [target] });
    if (action !== 'present') earnBoth();
    if (action === 'restore') useInventoryStore.setState({ questServices: {} });
    const present = action === 'present' ? presentSelection(target) : null;
    const use = action === 'use' ? useSelection(SOURCES.main, target) : null;
    const invoke = () => action === 'present' ? presentCharsiItem(present) : action === 'restore' ? restoreCharsiImbue(SOURCES.main) : imbueCharsiItem(use);
    useHydrationStore.getState().setStatus('loading'); let before = snapshot(); expect(invoke()).toBe('not-ready'); expect(snapshot()).toEqual(before);
    useHydrationStore.getState().setStatus('ready'); useCombatStore.setState({ inCombat: true }); before = snapshot();
    expect(invoke()).toBe('combat-active'); expect(snapshot()).toEqual(before); useCombatStore.setState({ inCombat: false });
    const replacement = vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true); before = snapshot();
    expect(invoke()).toBe('not-ready'); expect(snapshot()).toEqual(before); replacement.mockRestore();
    useMapStore.setState({ currentAct: 2 }); before = snapshot(); expect(invoke()).toBe('not-eligible'); expect(snapshot()).toEqual(before);
    useMapStore.setState({ currentAct: 1 });
    expect(startSubAreaRun({ act: 1, subAreaId: 'areas/act1-den-of-evil', runSeed: 7 })).not.toBeNull();
    before = snapshot(); expect(invoke()).toBe('combat-active'); expect(snapshot()).toEqual(before);
  });
  it('attempts and verifies every restoration, aggregating failures while holding the lease', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const selected = useSelection(SOURCES.main, target), before = snapshot();
    let inventoryWrites = 0, playerWrites = 0, mapWrites = 0; const nested: string[] = [];
    const stopInventory = useInventoryStore.subscribe(() => { inventoryWrites++; nested.push(imbueCharsiItem(selected));
      throw new Error(inventoryWrites === 1 ? 'publication observer' : 'inventory restoration observer'); });
    const stopPlayer = usePlayerStore.subscribe(() => { playerWrites++; nested.push(imbueCharsiItem(selected)); throw new Error('player restoration observer'); });
    const stopMap = useMapStore.subscribe(() => { mapWrites++; nested.push(imbueCharsiItem(selected)); throw new Error('map restoration observer'); });
    let caught: unknown; try { imbueCharsiItem(selected); } catch (error) { caught = error; } finally { stopInventory(); stopPlayer(); stopMap(); }
    expect(caught).toBeInstanceOf(AggregateError); if (!(caught instanceof AggregateError)) throw new Error('Missing aggregate');
    expect(caught.errors).toHaveLength(3); expect(caught.cause).toEqual(new Error('publication observer'));
    expect(inventoryWrites).toBe(2); expect(playerWrites).toBe(1); expect(mapWrites).toBe(1);
    expect(nested).toEqual(Array(4).fill('claim-in-progress')); expect(snapshot()).toEqual(before);
    const restored = useInventoryStore.getState().backpack[0]; if (!restored) throw new Error('Missing restored target');
    expect(imbueCharsiItem(useSelection(SOURCES.main, restored))).toBe('ok');
  });

  it('reports unresolved campaign graph damage after all scoped restoration attempts', () => {
    earnBoth(); const target = item(); useInventoryStore.setState({ backpack: [target] }); const evidence = campaignEvidence();
    useMapStore.setState(state => ({ selectedDifficulty: 'nightmare', questDifficulties: { 'difficulty/nightmare': true },
      questProgress: { ...state.questProgress, ...evidence.questProgress }, questReceipts: { ...state.questReceipts, ...evidence.questReceipts } }));
    const selected = useSelection(SOURCES.main, target), before = snapshot(); let fired = false;
    const stop = useInventoryStore.subscribe(() => { if (fired) return; fired = true;
      useMapStore.setState({ questDifficulties: {} }); throw new Error('observer removes replay unlock'); });
    let caught: unknown; try { imbueCharsiItem(selected); } catch (error) { caught = error; } finally { stop(); }
    expect(fired).toBe(true); expect(caught).toBeInstanceOf(AggregateError);
    if (!(caught instanceof AggregateError)) throw new Error('Missing explicit restoration failure');
    expect(caught.errors).toHaveLength(1); expect(caught.cause).toEqual(new Error('observer removes replay unlock'));
    const map = before[1]; if (!map) throw new Error('Missing map'); Object.assign(map, { questDifficulties: {} });
    expect(snapshot()).toEqual(before);
  });

});
