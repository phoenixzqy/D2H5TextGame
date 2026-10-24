import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as towns from '@/data/loaders/towns';
import { loadQuests } from '@/data/loaders/quests';
import { loadItemBases } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ACT5_ENCOUNTERS, PRISON_QUEST } from '@/engine/map/act5-admission';
import { INSPECT_PROOF, POTION_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { decodeSave, validateQuestItemLedger } from '@/engine/save/validate';
import { validateCurrentCampaignRewards } from '@/engine/save/current-campaign';
import { QUEST_SERVICE_SOURCES, type QuestServiceLedger } from '@/engine/services/quest-services';
import type { Item, Rarity } from '@/engine/types/items';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { questServicesForNpc, questServiceCandidates, useQuestService as applyQuestService } from './questServices';

const SIEGE = 'quests/act5-siege-on-harrogath#reward:service';
const LARZUK = 'quests/side-act5-larzuks-sockets#reward:service';
const HALBU = 'quests/side-act4-halbus-soul#reward:service';
const PRISON = `${PRISON_QUEST}#reward:service`;
const ANYA = 'quests/side-act5-anyas-gift#reward:service';
const FORGE = 'quests/act4-hellforge', GUARDIAN = 'quests/act3-guardian', KHALIM = 'quests/act3-khalims-will';
const HAMMER = `${FORGE}#objective:obj-kill-hephasto`, STONE = `${GUARDIAN}#reward:questItem`;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const originalTownNpcs = towns.loadTownNpcs;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing service fixture'); return value; }
const weaponBase = required([...loadItemBases().values()].find(base => base.type === 'weapon' && (base.maxSockets ?? 0) > 1));
const armorBase = required([...loadItemBases().values()].find(base => base.type === 'armor' && (base.maxSockets ?? 0) > 1));
function gear(id = 'selected', rarity: Rarity = 'normal', baseId = weaponBase.id): Item {
  return { id, baseId, rarity, level: 12, identified: true, equipped: false, socketCapacity: 0,
    baseRolls: { attack: 7 }, affixes: [], statRolls: { defense: 3 } };
}
function track(id: string): void {
  const quest = required(loadQuests().find(row => row.id === id));
  useMapStore.getState().updateQuestProgress(id, { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, true])) });
}
function actualMainSource(id: string): void {
  track(id);
  const encounter = ACT5_ENCOUNTERS.find(row => row.questId === id);
  if (encounter) useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [encounter.proof]: true } }));
  if (id === PRISON_QUEST) {
    useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts,
      [INSPECT_PROOF]: true, [POTION_SOURCE]: true, [THAW_PROOF]: true } }));
    useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
      [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' } } }));
  }
  if (id === FORGE) {
    track(KHALIM); track(GUARDIAN);
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      'quests/act2-horadric-staff': { id: 'quests/act2-horadric-staff', status: 'inProgress', objectives: {
        'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } },
    questReceipts: { ...state.questReceipts, [`${KHALIM}#action:council-victory`]: true,
      [`${GUARDIAN}#action:break-compelling-orb`]: true, [`${FORGE}#action:hephasto-victory`]: true,
      [`${FORGE}#action:shatter-soulstone`]: true } }));
    useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
      'quests/act2-horadric-staff#objective:obj-cube': { itemId: 'quest/horadric_cube', state: 'owned' },
      ...Object.fromEntries(['heart', 'brain', 'eye', 'flail'].map(part =>
        [`${KHALIM}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' as const }])),
      [`${KHALIM}#objective:obj-transmute`]: { itemId: 'items/khalims_will', state: 'consumed' },
      [HAMMER]: { itemId: 'quest/hellforge_hammer', state: 'consumed' },
      [STONE]: { itemId: 'items/soulstone_mephisto', state: 'consumed' } } }));
  }
}
function grant(...sources: (keyof typeof QUEST_SERVICE_SOURCES)[]): void {
  for (const source of sources) {
    const id = source.slice(0, source.indexOf('#')); actualMainSource(id);
    if (source === LARZUK) actualMainSource(SIEGE.split('#')[0] ?? '');
    if (source === ANYA) actualMainSource(PRISON_QUEST);
    if (source === HALBU) actualMainSource(FORGE);
    useInventoryStore.setState(state => ({ questServices: { ...state.questServices,
      [source]: { serviceId: QUEST_SERVICE_SOURCES[source], state: 'available' } } }));
  }
}
const inventory = () => useInventoryStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function noChange(source: string, id = 'selected', result = 'not-eligible'): void {
  const before = bytes(); expect(applyQuestService(source, id)).toBe(result); expect(bytes()).toBe(before);
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const hero = createMockPlayer('英雄', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, id: 'hero-exact', equipment: [] });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: null, isActUnlocked: () => true });
  vi.spyOn(towns, 'loadTownNpcs').mockImplementation(act => act === 5
    ? ['larzuk', 'anya'].map(id => ({ id: `npc/${id}`, portraitId: id, nameKey: `town.npc.${id}` })) : originalTownNpcs(act));
  useInventoryStore.setState({ backpack: [gear()] }); grant(SIEGE);
  validateQuestItemLedger(inventory().questItems, useMapStore.getState().questProgress, useMapStore.getState().questReceipts);
  validateCurrentCampaignRewards(useMapStore.getState(), inventory().questItems, inventory().questServices, useMapStore.getState().endgame);
});
afterEach(() => {
  stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks();
  useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests();
});

describe('actual current-town service discovery and selected gear', () => {
  it('lists independent main and side charges at only their real NPC', () => {
    grant(LARZUK, PRISON, ANYA, HALBU);
    expect(questServicesForNpc('npc/larzuk').map(row => row.source)).toEqual([SIEGE, LARZUK]);
    expect(questServicesForNpc('npc/anya').map(row => row.source)).toEqual([PRISON, ANYA]);
    expect(questServicesForNpc('npc/halbu')).toEqual([]);
    expect(questServicesForNpc('npc/malah')).toEqual([]);
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok');
    expect(questServicesForNpc('npc/larzuk')[0]).toEqual({ source: SIEGE, serviceId: 'socket_item', state: 'consumed', targetItemId: 'selected' });
    expect(inventory().questServices[LARZUK]?.state).toBe('available');
    noChange(SIEGE, 'selected', 'already-consumed');
  });
  it('uses the current town NPC after returning from combat with a selected map area', () => {
    useMapStore.setState({ currentSubAreaId: 'areas/act5-bloody-foothills' });
    expect(questServicesForNpc('npc/larzuk')).toEqual([{ source: SIEGE, serviceId: 'socket_item', state: 'available' }]);
    expect(questServiceCandidates(SIEGE)).toEqual(inventory().backpack);
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok');
    expect(inventory().backpack[0]?.socketCapacity).toBe(weaponBase.maxSockets);
    expect(useMapStore.getState().currentSubAreaId).toBe('areas/act5-bloody-foothills');
  });
  it.each(['wrong-act', 'locked', 'missing-npc', 'nightmare'] as const)('refuses %s location without writes', fault => {
    if (fault === 'wrong-act') useMapStore.setState({ currentAct: 4 });
    if (fault === 'locked') useMapStore.setState({ isActUnlocked: () => false });
    if (fault === 'missing-npc') vi.mocked(towns.loadTownNpcs).mockReturnValue([]);
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    expect(questServicesForNpc('npc/larzuk')).toEqual([]); expect(questServiceCandidates(SIEGE)).toEqual([]); noChange(SIEGE);
  });
  it.each(['unknown', 'no-charge', 'unclaimed', 'historical', 'contradictory'] as const)('rejects %s source authority', fault => {
    if (fault === 'unknown') { noChange('quests/forged#reward:service'); return; }
    if (fault === 'no-charge') useInventoryStore.setState({ questServices: {} });
    if (fault === 'unclaimed') useMapStore.getState().updateQuestProgress(SIEGE.split('#')[0] ?? '', { rewardClaimed: false });
    if (fault === 'historical') useMapStore.setState({ questReceipts: {} });
    if (fault === 'contradictory') useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [THAW_PROOF]: true } }));
    expect(questServiceCandidates(SIEGE)).toEqual([]); noChange(SIEGE);
  });
  it.each([LARZUK, ANYA, HALBU] as const)('rejects forged side charge %s without its actual main prerequisite', source => {
    useMapStore.setState({ currentAct: source === HALBU ? 4 : 5, questProgress: {}, questReceipts: {} });
    track(source.split('#')[0] ?? '');
    useInventoryStore.setState({ questItems: {}, questServices: {
      [source]: { serviceId: QUEST_SERVICE_SOURCES[source], state: 'available' } } });
    useInventoryStore.setState({ backpack: [gear('selected', 'normal', source === HALBU ? armorBase.id : weaponBase.id)] });
    expect(questServiceCandidates(source)).toEqual([]); noChange(source);
  });
  it.each([LARZUK, ANYA, HALBU] as const)('accepts actual completed prerequisite before its separate reward claim for %s', source => {
    grant(source);
    const main = source === LARZUK ? SIEGE.split('#')[0] ?? '' : source === ANYA ? PRISON_QUEST : FORGE;
    useMapStore.getState().updateQuestProgress(main, { rewardClaimed: false });
    useInventoryStore.setState(state => ({ questServices: { [source]: required(state.questServices[source]) },
      backpack: [gear('selected', 'normal', source === HALBU ? armorBase.id : weaponBase.id)] }));
    useMapStore.setState({ currentAct: source === HALBU ? 4 : 5 });
    expect(applyQuestService(source, 'selected')).toBe('ok');
  });
  it('rejects side Larzuk after removing actual Siege victory while retaining canonical completed progress', () => {
    grant(LARZUK); expect(questServiceCandidates(LARZUK)).toHaveLength(1);
    const encounter = required(ACT5_ENCOUNTERS.find(row => row.questId === SIEGE.split('#')[0]));
    const receipts = { ...useMapStore.getState().questReceipts }; Reflect.deleteProperty(receipts, encounter.proof);
    useMapStore.setState({ questReceipts: receipts });
    useInventoryStore.setState(state => ({ questServices: { [LARZUK]: required(state.questServices[LARZUK]) } }));
    expect(questServiceCandidates(LARZUK)).toEqual([]); noChange(LARZUK);
  });
  it.each(['inspect', 'potion-receipt', 'thaw', 'victory', 'potion-missing', 'potion-owned', 'potion-identity'] as const)(
    'rejects side Anya after removing its actual Prison %s edge', fault => {
      grant(ANYA); expect(questServiceCandidates(ANYA)).toHaveLength(1);
      const receipts = { ...useMapStore.getState().questReceipts }, items = { ...inventory().questItems };
      const encounter = required(ACT5_ENCOUNTERS.find(row => row.questId === PRISON_QUEST));
      if (fault === 'inspect') Reflect.deleteProperty(receipts, INSPECT_PROOF);
      if (fault === 'potion-receipt') Reflect.deleteProperty(receipts, POTION_SOURCE);
      if (fault === 'thaw') Reflect.deleteProperty(receipts, THAW_PROOF);
      if (fault === 'victory') Reflect.deleteProperty(receipts, encounter.proof);
      if (fault === 'potion-missing') Reflect.deleteProperty(items, POTION_SOURCE);
      if (fault === 'potion-owned') items[POTION_SOURCE] = { itemId: 'quest/malahs_potion', state: 'owned' };
      if (fault === 'potion-identity') items[POTION_SOURCE] = { itemId: 'quest/hellforge_hammer', state: 'consumed' };
      useMapStore.setState({ questReceipts: receipts }); useInventoryStore.setState({ questItems: items });
      expect(questServiceCandidates(ANYA)).toEqual([]); noChange(ANYA);
    });
  it.each(['hephasto', 'shatter', 'hammer-missing', 'stone-missing', 'hammer-owned', 'stone-owned', 'hammer-identity', 'stone-identity'] as const)(
    'rejects side Halbu after removing its actual Hellforge %s edge', fault => {
      grant(HALBU); useMapStore.setState({ currentAct: 4 });
      useInventoryStore.setState({ backpack: [gear('selected', 'normal', armorBase.id)] });
      expect(questServiceCandidates(HALBU)).toHaveLength(1);
      const receipts = { ...useMapStore.getState().questReceipts }, items = { ...inventory().questItems };
      if (fault === 'hephasto') Reflect.deleteProperty(receipts, `${FORGE}#action:hephasto-victory`);
      if (fault === 'shatter') Reflect.deleteProperty(receipts, `${FORGE}#action:shatter-soulstone`);
      if (fault === 'hammer-missing') Reflect.deleteProperty(items, HAMMER);
      if (fault === 'stone-missing') Reflect.deleteProperty(items, STONE);
      if (fault === 'hammer-owned') items[HAMMER] = { itemId: 'quest/hellforge_hammer', state: 'owned' };
      if (fault === 'stone-owned') items[STONE] = { itemId: 'items/soulstone_mephisto', state: 'owned' };
      if (fault === 'hammer-identity') items[HAMMER] = { itemId: 'items/soulstone_mephisto', state: 'consumed' };
      if (fault === 'stone-identity') items[STONE] = { itemId: 'quest/hellforge_hammer', state: 'consumed' };
      useMapStore.setState({ questReceipts: receipts }); useInventoryStore.setState({ questItems: items });
      expect(questServiceCandidates(HALBU)).toEqual([]); noChange(HALBU);
    });
  it.each(['stash', 'equipped', 'merc', 'duplicate', 'quarantine', 'flag', 'mirror', 'not-owned'] as const)('rejects %s selected ownership', fault => {
    const item = required(inventory().backpack[0]);
    if (fault === 'stash') useInventoryStore.setState({ backpack: [], stash: [item] });
    if (fault === 'equipped') useInventoryStore.setState({ backpack: [], equipped: { weapon: { ...item, equipped: true } } });
    if (fault === 'merc') useMercStore.setState({ mercEquipment: { merc: { weapon: item } } });
    if (fault === 'duplicate') useInventoryStore.setState({ backpack: [item, { ...item }] });
    if (fault === 'quarantine') {
      const { socketCapacity: _capacity, ...legacy } = item;
      useInventoryStore.setState({ legacyGearQuarantine: [{ item: legacy, origin: { container: 'stash', index: 0 } }] });
    }
    if (fault === 'flag') useInventoryStore.setState({ backpack: [{ ...item, equipped: true }] });
    if (fault === 'mirror') usePlayerStore.setState(state => ({ player: { ...required(state.player), equipment: [item] } }));
    if (fault === 'not-owned') { noChange(SIEGE, 'lookalike'); return; }
    expect(questServiceCandidates(SIEGE)).toEqual([]); noChange(SIEGE);
  });
  it.each(['normal', 'magic', 'rare', 'unique', 'set'] as const)('uses reviewed %s socket budget and preserves all other fields', rarity => {
    const item = gear('selected', rarity); useInventoryStore.setState({ backpack: [item] });
    expect(questServiceCandidates(SIEGE)).toEqual([item]); expect(applyQuestService(SIEGE, item.id)).toBe('ok');
    expect(inventory().backpack).toEqual([{ ...item, socketCapacity: rarity === 'normal' ? weaponBase.maxSockets : 1 }]);
    expect(inventory().questServices[SIEGE]).toEqual({ serviceId: 'socket_item', state: 'consumed', targetItemId: item.id });
  });
  it.each(['capacity', 'missing-capacity', 'runes', 'runeword', 'max-zero', 'non-gear'] as const)('rejects %s socket target', fault => {
    const item = gear();
    const base = fault === 'max-zero' ? required([...loadItemBases().values()].find(row => row.type === 'weapon' && row.maxSockets === 0))
      : required([...loadItemBases().values()].find(row => row.type === 'jewelry'));
    const { socketCapacity: _capacity, ...legacy } = item;
    useInventoryStore.setState({ backpack: [fault === 'capacity' ? { ...item, socketCapacity: 1 }
      : fault === 'missing-capacity' ? legacy : fault === 'runes' ? { ...item, socketContents: [{ kind: 'rune', id: 'runes/el' }] }
        : fault === 'runeword' ? { ...item, runewordId: 'runewords/steel' } : { ...item, baseId: base.id }] });
    noChange(SIEGE);
  });
  it('restricts Halbu to armor at actual Act IV town', () => {
    grant(HALBU); useMapStore.setState({ currentAct: 4 });
    noChange(HALBU); const armor = gear('armor', 'normal', armorBase.id);
    useInventoryStore.setState(state => ({ backpack: [...state.backpack, armor] }));
    expect(questServiceCandidates(HALBU)).toEqual([armor]); expect(applyQuestService(HALBU, armor.id)).toBe('ok');
    expect(inventory().backpack[1]?.socketCapacity).toBe(armorBase.maxSockets);
  });
  it('personalizes actual gear using exact live character identity, without changing its power', () => {
    grant(PRISON, ANYA); const item = { ...gear(), socketCapacity: 2 };
    useInventoryStore.setState({ backpack: [item] });
    expect(applyQuestService(PRISON, item.id)).toBe('ok');
    expect(inventory().backpack[0]).toEqual({ ...item, personalizedBy: { characterId: 'hero-exact', name: '英雄' } });
    noChange(ANYA); expect(inventory().questServices[ANYA]?.state).toBe('available');
  });
  it.each(['', ' ', ' leading', 'trailing ', '12345678901234567', '😀'.repeat(9)])('rejects invalid exact live name %j', name => {
    grant(PRISON); usePlayerStore.setState(state => ({ player: { ...required(state.player), name } })); noChange(PRISON);
  });
  it('accepts exactly sixteen UTF-16 units and rejects empty character ID', () => {
    grant(PRISON); usePlayerStore.setState(state => ({ player: { ...required(state.player), id: '', name: '😀'.repeat(8) } }));
    noChange(PRISON); usePlayerStore.setState(state => ({ player: { ...required(state.player), id: 'exact' } }));
    expect(applyQuestService(PRISON, 'selected')).toBe('ok');
    expect(inventory().backpack[0]?.personalizedBy).toEqual({ characterId: 'exact', name: '😀'.repeat(8) });
  });
  it.each(['already-personalized', 'runeword', 'bound-object'] as const)('refuses %s personalization target', fault => {
    grant(PRISON); const item = gear();
    useInventoryStore.setState({ backpack: [fault === 'already-personalized'
      ? { ...item, personalizedBy: { characterId: 'previous', name: 'Previous' } }
      : fault === 'runeword' ? { ...item, runewordId: 'runewords/steel' }
        : { ...item, baseId: 'quest/malahs_potion' }] }); noChange(PRISON);
  });
  it('uses independent socket charges on two actual selected instances', () => {
    grant(LARZUK); useInventoryStore.setState(state => ({ backpack: [...state.backpack, gear('second')] }));
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok'); noChange(LARZUK);
    expect(applyQuestService(LARZUK, 'second')).toBe('ok');
    expect(inventory().questServices[SIEGE]?.targetItemId).toBe('selected');
    expect(inventory().questServices[LARZUK]?.targetItemId).toBe('second');
  });
  it.each(['not-ready', 'no-player', 'combat-active'] as const)('returns %s before mutation', refusal => {
    if (refusal === 'not-ready') useHydrationStore.getState().setStatus('loading');
    if (refusal === 'no-player') usePlayerStore.getState().reset();
    if (refusal === 'combat-active') useCombatStore.setState({ inCombat: true });
    noChange(SIEGE, 'selected', refusal);
  });
});

describe('shared service transaction publication and rollback', () => {
  it('shares the quest lock with other actions and refuses pending restore', () => {
    expect(withQuestTransaction(() => applyQuestService(SIEGE, 'selected'))).toBe('claim-in-progress');
    const lease = reserveWaveRestore();
    try { expect(() => applyQuestService(SIEGE, 'selected')).toThrow('restorePending'); }
    finally { releaseWaveRestore(lease); }
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok');
  });
  it('publishes item and source together, blocking reentry, snapshot and restore for every observer', () => {
    let observations = 0;
    stops.push(useInventoryStore.subscribe(() => {
      observations++; expect(inventory().questServices[SIEGE]?.state).toBe('consumed');
      expect(inventory().backpack[0]?.socketCapacity).toBe(weaponBase.maxSockets);
      expect(applyQuestService(SIEGE, 'selected')).toBe('claim-in-progress');
      expect(() => snapshotStores()).toThrow('questBusy'); expect(() => exportCurrentSave()).toThrow('questBusy');
      expect(() => reserveWaveRestore()).toThrow('questBusy');
    }));
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok'); expect(observations).toBe(1);
  });
  it.each(['throw-before', 'throw-after', 'silent-item', 'silent-source', 'silent-all'] as const)('restores %s failure exactly and permits retry', fault => {
    const before = bytes(), real = useInventoryStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => {
      if (fault === 'throw-before') throw new Error('before');
      if (fault === 'silent-all') return;
      const patch = typeof update === 'function' ? update(inventory()) : update;
      if (fault === 'silent-item') real({ questServices: required(patch.questServices) });
      else if (fault === 'silent-source') real({ backpack: required(patch.backpack) });
      else { real(update); throw new Error('after'); }
    });
    expect(applyQuestService(SIEGE, 'selected')).toBe('grant-failed'); expect(bytes()).toBe(before);
    vi.mocked(useInventoryStore.setState).mockRestore(); expect(applyQuestService(SIEGE, 'selected')).toBe('ok');
  });
  it('preserves unrelated observer writes and restores a target moved during failed publication', () => {
    const original = required(inventory().backpack[0]), other = gear('observer-item'); let fired = false, checks = 0;
    stops.push(useInventoryStore.subscribe(() => {
      checks++; expect(() => snapshotStores()).toThrow('questBusy'); expect(() => exportCurrentSave()).toThrow('questBusy');
      expect(() => reserveWaveRestore()).toThrow('questBusy');
      if (fired) return; fired = true;
      const transformed = required(inventory().backpack[0]);
      useInventoryStore.setState(state => ({ backpack: [other], stash: [...state.stash, transformed],
        currencies: { ...state.currencies, gems: 4 } }));
      useMapStore.setState({ currentAct: 4 });
    }));
    expect(applyQuestService(SIEGE, 'selected')).toBe('grant-failed');
    expect(inventory().backpack).toEqual([original, other]); expect(inventory().stash).toEqual([]);
    expect(inventory().currencies.gems).toBe(4); expect(useMapStore.getState().currentAct).toBe(4);
    expect(inventory().questServices[SIEGE]?.state).toBe('available'); expect(checks).toBeGreaterThanOrEqual(3);
  });
  it('detects in-place item mutation and restores the original stats', () => {
    const before = structuredClone(required(inventory().backpack[0])); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true; const item = required(inventory().backpack[0]);
      Object.assign(required(item.baseRolls), { attack: 999 });
    }));
    expect(applyQuestService(SIEGE, 'selected')).toBe('grant-failed'); expect(inventory().backpack[0]).toEqual(before);
    expect(inventory().questServices[SIEGE]?.state).toBe('available');
  });
  it('detects in-place hero identity mutation while preserving that observer write', () => {
    grant(PRISON); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true; Object.assign(required(usePlayerStore.getState().player), { id: 'changed-by-observer' });
    }));
    expect(applyQuestService(PRISON, 'selected')).toBe('grant-failed');
    expect(inventory().backpack[0]?.personalizedBy).toBeUndefined();
    expect(inventory().questServices[PRISON]?.state).toBe('available');
    expect(usePlayerStore.getState().player?.id).toBe('changed-by-observer');
  });
  it('restores observer moves into merc ownership and actor equipment while retaining unrelated merc gear', () => {
    const other = gear('unrelated-merc'); let fired = false;
    useMercStore.setState({ mercEquipment: { merc: { head: other } } });
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true; const item = required(inventory().backpack[0]);
      useInventoryStore.setState({ backpack: [] });
      useMercStore.setState({ mercEquipment: { merc: { weapon: item, head: other } } });
      usePlayerStore.setState(state => ({ player: { ...required(state.player), equipment: [item] } }));
    }));
    expect(applyQuestService(SIEGE, 'selected')).toBe('grant-failed');
    expect(inventory().backpack).toEqual([gear()]);
    expect(useMercStore.getState().mercEquipment.merc).toEqual({ weapon: null, head: other });
    expect(usePlayerStore.getState().player?.equipment).toEqual([]);
  });
  it('attempts every ownership restoration even when the inventory restoration throws', () => {
    const realInventory = useInventoryStore.setState, realMercs = useMercStore.setState; let calls = 0;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation(update => {
      calls++; realInventory(update);
      if (calls === 1) {
        const item = required(inventory().backpack[0]);
        realMercs({ mercEquipment: { merc: { weapon: item } } });
        usePlayerStore.setState(state => ({ player: { ...required(state.player), equipment: [item] } }));
      }
      throw new Error('mutate then throw');
    });
    const mercWrite = vi.spyOn(useMercStore, 'setState'), playerWrite = vi.spyOn(usePlayerStore, 'setState');
    expect(() => applyQuestService(SIEGE, 'selected')).toThrow(AggregateError);
    expect(mercWrite).toHaveBeenCalledOnce(); expect(playerWrite).toHaveBeenCalledTimes(2);
    expect(useMercStore.getState().mercEquipment.merc?.weapon).toBeNull();
    expect(usePlayerStore.getState().player?.equipment).toEqual([]);
    expect(inventory().questServices[SIEGE]?.state).toBe('available');
  });
  it('detects observer mutation during rollback and never claims restoration succeeded', () => {
    const real = useInventoryStore.setState; let calls = 0;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation(update => {
      calls++; real(update);
      if (calls === 1) throw new Error('publication');
      Object.assign(required(inventory().questServices[SIEGE]), { state: 'consumed', targetItemId: 'forged' });
    });
    expect(() => applyQuestService(SIEGE, 'selected')).toThrow(AggregateError);
  });
  it('reports failed restoration and holds the guard through all attempts, then releases it', () => {
    const real = useInventoryStore.setState; let calls = 0;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation(update => {
      calls++; expect(() => snapshotStores()).toThrow('questBusy');
      real(update); throw new Error(calls === 1 ? 'publication' : 'rollback');
    });
    expect(() => applyQuestService(SIEGE, 'selected')).toThrow(AggregateError); expect(calls).toBeGreaterThanOrEqual(2);
    expect(inventory().questServices[SIEGE]?.state).toBe('available');
    vi.mocked(useInventoryStore.setState).mockRestore(); expect(snapshotStores()).not.toBeNull();
    expect(applyQuestService(SIEGE, 'selected')).toBe('ok');
  });
  it('rejects silent rollback failure instead of reporting a safe refusal', () => {
    const real = useInventoryStore.setState; let calls = 0;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation(update => {
      calls++; if (calls > 1) return; real(update); throw new Error('publication');
    });
    expect(() => applyQuestService(SIEGE, 'selected')).toThrow(AggregateError);
  });
  it('roundtrips the same transformed ID and independent historical use records', () => {
    grant(PRISON); expect(applyQuestService(SIEGE, 'selected')).toBe('ok'); expect(applyQuestService(PRISON, 'selected')).toBe('ok');
    const save = decodeSave(required(snapshotStores()));
    expect(save.inventory.backpack).toEqual(inventory().backpack);
    expect(save.inventory.questServices).toEqual(inventory().questServices satisfies QuestServiceLedger);
  });
});
