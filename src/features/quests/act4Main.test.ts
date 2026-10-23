import { withoutV17Fields } from '../../../tests/helpers/save-fixtures';
import * as questLoader from '@/data/loaders/quests';
import mainDocument from '@/data/quests/main.json';
import * as lootLoader from '@/data/loaders/loot';
import * as award from '@/engine/loot/award';
import { loadMercPool } from '@/data/loaders/mercs';
import { createRng, hashSeed } from '@/engine/rng';
import { xpTotal } from '@/engine/progression/xp';
import { decodeSave, validateQuestItemLedger } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { snapshotStores } from '@/stores/persistence';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/persistence';
import { claimQuestReward, canClaim } from './claimReward';
import { executeQuestAction, questActionStatus } from './questActions';
import { recoverQuestTool, questToolStatus } from './interactObject';

const FORGE = 'quests/act4-hellforge', IZUAL = 'quests/act4-fallen-angel', DIABLO = 'quests/act4-terrors-end';
const HAMMER = `${FORGE}#objective:obj-kill-hephasto`, PROOF = `${FORGE}#action:hephasto-victory`;
const SHATTER = `${FORGE}#action:shatter-soulstone`;
const actions = { isActUnlocked: useMapStore.getState().isActUnlocked,
  markQuestRewardClaimed: useMapStore.getState().markQuestRewardClaimed };
const grants = { gainExperience: usePlayerStore.getState().gainExperience,
  shareExperienceWithFielded: useMercStore.getState().shareExperienceWithFielded,
  addItem: useInventoryStore.getState().addItem, addCurrency: useInventoryStore.getState().addCurrency };
const KHALIM = 'quests/act3-khalims-will', GUARDIAN = 'quests/act3-guardian';
const STONE = `${GUARDIAN}#reward:questItem`, WILL = `${KHALIM}#objective:obj-transmute`;
const CUBE = 'quests/act2-horadric-staff#objective:obj-cube';
function required<T>(value: T | undefined | null): T { if (value == null) throw new Error('Missing Act IV fixture'); return value; }
function prepareSoulstone(): void {
  useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts,
    [`${KHALIM}#action:council-victory`]: true, [`${GUARDIAN}#action:break-compelling-orb`]: true },
    questProgress: { ...state.questProgress,
      'quests/act2-horadric-staff': { id: 'quests/act2-horadric-staff', status: 'inProgress', objectives: {
        'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [KHALIM]: { id: KHALIM, status: 'completed', rewardClaimed: true, objectives: {
        'obj-heart': true, 'obj-brain': true, 'obj-eye': true, 'obj-flail': true, 'obj-transmute': true } },
      [GUARDIAN]: { id: GUARDIAN, status: 'completed', rewardClaimed: true, objectives: { 'obj-kill-mephisto': true } }
    } }));
  useInventoryStore.setState({ questItems: {
    [CUBE]: { itemId: 'quest/horadric_cube', state: 'owned' },
    ...Object.fromEntries(['heart', 'brain', 'eye', 'flail'].map(part =>
      [`${KHALIM}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' }])),
    [WILL]: { itemId: 'items/khalims_will', state: 'consumed' },
    [STONE]: { itemId: 'items/soulstone_mephisto', state: 'owned' }
  } });
}
function prepareForge(): void {
  prepareSoulstone();
  useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [PROOF]: true },
    questProgress: { ...state.questProgress, [FORGE]: { id: FORGE, status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-kill-hephasto': true, 'obj-shatter': false } } } }));
  expect(recoverQuestTool(HAMMER)).toBe('ok');
}
function data() {
  return structuredClone([usePlayerStore, useInventoryStore, useMapStore, useMercStore].map(store =>
    Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function xp(): number { const player = required(usePlayerStore.getState().player); return xpTotal(player.level) + player.experience; }
function mercXp(): number {
  const state = useMercStore.getState(), merc = required(state.ownedMercs.find(row => row.id === state.fieldedMercId));
  let total = state.getMercProgress(merc.id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function withRewards(rewards: Record<string, unknown>, check: () => void): void {
  const quest = required(mainDocument.quests.find(row => row.id === FORGE));
  const original = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
  try { Object.defineProperty(quest, 'rewards', { ...original, value: rewards }); check(); }
  finally { Object.defineProperty(quest, 'rewards', original); }
}
beforeEach(() => {
  usePlayerStore.setState({ gainExperience: grants.gainExperience });
  useMercStore.setState({ shareExperienceWithFielded: grants.shareExperienceWithFielded });
  useInventoryStore.setState({ addItem: grants.addItem, addCurrency: grants.addCurrency });
  useMapStore.setState(actions);
  useMapStore.getState().reset(); useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); useMercStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Act IV fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 4, currentSubAreaId: 'areas/act4-river-of-flame', isActUnlocked: () => true });
});
afterEach(() => { vi.restoreAllMocks(); useMapStore.setState(actions);
  usePlayerStore.setState({ gainExperience: grants.gainExperience });
  useMercStore.setState({ shareExperienceWithFielded: grants.shareExperienceWithFielded });
  useInventoryStore.setState({ addItem: grants.addItem, addCurrency: grants.addCurrency });
});

describe('Act IV main contracts', () => {
  it('uses canonical identities and closed level-bound caches', () => {
    const quests = loadQuests();
    expect(quests.find(q => q.id === FORGE)?.rewards).toEqual({ xp: 7000, gemShards: 3,
      lootTable: { tableId: 'loot/hellforge-runes', ilvl: 56, picks: 1 } });
    expect(quests.find(q => q.id === DIABLO)?.rewards?.lootTable).toEqual({ tableId: 'loot/diablo-q', ilvl: 61, picks: 5 });
    const hammer = loadQuestItems().find(item => item.id === 'quest/hellforge_hammer');
    expect(hammer && questItemSource(hammer)).toBe(HAMMER);
  });
  it.each([IZUAL, DIABLO])('refuses historical completed flags without new qualified proof for %s', id => {
    const quest = loadQuests().find(q => q.id === id);
    if (!quest) throw new Error('Missing quest');
    useMapStore.setState({ questProgress: { [id]: { id, status: 'completed', rewardClaimed: false,
      objectives: Object.fromEntries(quest.objectives.map(o => [o.id, true])) } } });
    expect(canClaim(id)).toBe(false); expect(claimQuestReward(id)).toBe('not-completed');
  });
  it('requires qualified proof before explicit hammer recovery and real inputs before Shatter', () => {
    useMapStore.setState({ questProgress: { [FORGE]: { id: FORGE, status: 'inProgress',
      objectives: { 'obj-kill-hephasto': true, 'obj-shatter': false } } } });
    expect(questToolStatus(HAMMER)).toBe('unavailable'); expect(recoverQuestTool(HAMMER)).toBe('not-eligible');
    useMapStore.setState({ questReceipts: { [PROOF]: true } });
    expect(questToolStatus(HAMMER)).toBe('ready'); expect(recoverQuestTool(HAMMER)).toBe('ok');
    expect(questActionStatus(SHATTER)).toBe('unavailable'); expect(executeQuestAction(SHATTER)).toBe('not-eligible');
  });
});

describe('actual two-input Hellforge transaction', () => {
  it('consumes the actual hammer and Guardian reward together, completes the existing objective and pays nothing until Claim', () => {
    prepareForge(); const before = xp(), currencies = useInventoryStore.getState().currencies;
    expect(questActionStatus(SHATTER)).toBe('ready'); expect(executeQuestAction(SHATTER)).toBe('ok');
    expect(useInventoryStore.getState().questItems[HAMMER]?.state).toBe('consumed');
    expect(useInventoryStore.getState().questItems[STONE]?.state).toBe('consumed');
    expect(useMapStore.getState().questProgress[FORGE]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[FORGE]?.objectives['obj-shatter']).toBe(true);
    expect(useMapStore.getState().questReceipts[SHATTER]).toBe(true);
    expect(xp()).toBe(before); expect(useInventoryStore.getState().currencies).toBe(currencies);
    expect(questActionStatus(SHATTER)).toBe('consumed'); expect(executeQuestAction(SHATTER)).toBe('already-consumed');
    const map = useMapStore.getState(); expect(validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts))
      .toBe(useInventoryStore.getState().questItems);
    const save = required(snapshotStores()); expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });
  it('allows explicit real Shatter for completed unclaimed history after a new qualified recovery, without inferring consumption', () => {
    prepareForge();
    useMapStore.getState().updateQuestProgress(FORGE, { status: 'completed', rewardClaimed: false,
      objectives: { 'obj-kill-hephasto': true, 'obj-shatter': true } });
    expect(canClaim(FORGE)).toBe(false); expect(claimQuestReward(FORGE)).toBe('not-completed');
    expect(questActionStatus(SHATTER)).toBe('ready'); expect(executeQuestAction(SHATTER)).toBe('ok');
    expect(canClaim(FORGE)).toBe(true); expect(claimQuestReward(FORGE)).toBe('ok');
    expect(executeQuestAction(SHATTER)).toBe('already-consumed'); expect(claimQuestReward(FORGE)).toBe('already-claimed');
  });
  it.each(['hammer-missing', 'stone-missing', 'hammer-consumed', 'stone-consumed', 'hammer-source', 'stone-source', 'no-proof'])(
    'refuses %s without writing any participating state', fault => {
      prepareForge(); const items = { ...useInventoryStore.getState().questItems };
      if (fault === 'hammer-missing') Reflect.deleteProperty(items, HAMMER);
      if (fault === 'stone-missing') Reflect.deleteProperty(items, STONE);
      if (fault === 'hammer-consumed') items[HAMMER] = { itemId: 'quest/hellforge_hammer', state: 'consumed' };
      if (fault === 'stone-consumed') items[STONE] = { itemId: 'items/soulstone_mephisto', state: 'consumed' };
      if (fault === 'hammer-source' || fault === 'stone-source') {
        const key = fault === 'hammer-source' ? HAMMER : STONE;
        items[`${FORGE}#objective:lookalike`] = required(items[key]); Reflect.deleteProperty(items, key);
      }
      useInventoryStore.setState({ questItems: items });
      if (fault === 'no-proof') useMapStore.setState(state => {
        const { [PROOF]: _proof, ...questReceipts } = state.questReceipts; return { questReceipts };
      });
      const before = data(); expect(executeQuestAction(SHATTER)).toBe('not-eligible'); expect(data()).toEqual(before);
    });
  it.each(['inventory-before', 'inventory-after', 'map-before', 'map-after'])(
    'restores both inputs/progress/proof after %s failure and retries once', fault => {
      prepareForge(); const before = data();
      const store = fault.startsWith('inventory') ? useInventoryStore : useMapStore;
      if (store === useInventoryStore) {
        const write = useInventoryStore.setState;
        vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => {
          if (fault.endsWith('after')) write(...args);
          expect(executeQuestAction(SHATTER)).toBe('claim-in-progress'); throw new Error(fault);
        });
      } else {
        const write = useMapStore.setState;
        vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
          if (fault.endsWith('after')) write(...args);
          expect(recoverQuestTool(HAMMER)).toBe('claim-in-progress'); throw new Error(fault);
        });
      }
      expect(executeQuestAction(SHATTER)).toBe('grant-failed'); expect(data()).toEqual(before);
      vi.restoreAllMocks(); expect(executeQuestAction(SHATTER)).toBe('ok');
    });
  it('attempts both restorations under the shared lock and aggregates restoration failures', () => {
    prepareForge(); const before = data(), attempted: string[] = [];
    const inventoryWrite = useInventoryStore.setState, mapWrite = useMapStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(inventoryWrite).mockImplementationOnce((...args) => {
      attempted.push('items'); inventoryWrite(...args); expect(executeQuestAction(SHATTER)).toBe('claim-in-progress'); throw new Error('item restore');
    });
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { mapWrite(...args); throw new Error('publish'); })
      .mockImplementationOnce((...args) => {
        attempted.push('map'); mapWrite(...args); expect(claimQuestReward(FORGE)).toBe('claim-in-progress'); throw new Error('map restore');
      });
    expect(() => executeQuestAction(SHATTER)).toThrow(AggregateError); expect(attempted).toEqual(['items', 'map']); expect(data()).toEqual(before);
    vi.restoreAllMocks(); expect(executeQuestAction(SHATTER)).toBe('ok');
  });
});

describe('Act IV exact reward bundle and save boundary', () => {
  function prepareClaim(): void { prepareForge(); expect(executeQuestAction(SHATTER)).toBe('ok'); }
  it('claims 41000 hero/30750 fielded merc XP, two skill points, three gem-shards and exact private caches once', () => {
    prepareClaim();
    usePlayerStore.getState().setPlayer({ ...required(usePlayerStore.getState().player), id: 'qa-act4-cache', level: 40, experience: 0, skillPoints: 5 });
    const hired = useMercStore.getState().hireMerc(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight')));
    expect(hired.ok).toBe(true); useMercStore.getState().setFieldedMerc(required(hired.mercId));
    const xpBefore = xp(), mercBefore = mercXp(), points = required(usePlayerStore.getState().player).skillPoints;
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [IZUAL]: { id: IZUAL, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-izual': true } },
      [DIABLO]: { id: DIABLO, status: 'completed', rewardClaimed: false, objectives: {
        'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true, 'obj-kill-diablo': true } }
    }, questReceipts: { ...state.questReceipts, [`${IZUAL}#action:izual-victory`]: true, [`${DIABLO}#action:diablo-victory`]: true } }));
    const caches = [FORGE, DIABLO].map(id => {
      const profile = required(loadQuests().find(q => q.id === id)?.rewards?.lootTable);
      if (!award.isQuestTableRewardInput(profile)) throw new Error('Missing cache profile');
      return required(award.rollQuestTableRewards(profile, lootLoader.loadAwardPools(), createRng(hashSeed(JSON.stringify([
        'quest-loot-table-v1', 'qa-act4-cache', id, profile.tableId, profile.ilvl, profile.picks
      ])))));
    });
    for (const id of [IZUAL, FORGE, DIABLO]) { expect(canClaim(id)).toBe(true); expect(claimQuestReward(id)).toBe('ok'); }
    expect(xp()).toBe(xpBefore + 41000); expect(mercXp()).toBe(mercBefore + 30750);
    expect(required(usePlayerStore.getState().player).skillPoints).toBe(points + 2);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(3 + caches.reduce((n, cache) => n + cache.gems, 0));
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(caches.reduce((n, cache) => n + cache.runes + cache.runeShards, 0));
    expect(useInventoryStore.getState().backpack.map(item => ({ ...item, id: '' })))
      .toEqual(caches.flatMap(cache => cache.items.map(item => ({ ...item, id: '' }))));
    const paid = data(); for (const id of [IZUAL, FORGE, DIABLO]) expect(claimQuestReward(id)).toBe('already-claimed'); expect(data()).toEqual(paid);
    const save = required(snapshotStores()); expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });
  it.each([0, -1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('refuses invalid generic gemShards %s', amount => {
    prepareClaim(); const before = data();
    withRewards({ gemShards: amount }, () => { expect(() => loadQuests()).toThrow(/gemShards/); });
    const quests = loadQuests();
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(row => row.id === FORGE ? { ...row, rewards: { gemShards: amount } } : row));
    expect(claimQuestReward(FORGE)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it('aggregates direct gemShards and table gems before overflow checks, preserving legacy direct currency destinations', () => {
    prepareClaim();
    const roll = vi.spyOn(award, 'rollQuestTableRewards').mockReturnValue({ items: [], gems: 4, runes: 0, runeShards: 0, wishstones: 0 });
    useInventoryStore.setState({ currencies: { 'gem-shard': Number.MAX_SAFE_INTEGER - 6, gems: 10, runes: 20, runeShards: 30 } });
    const before = data(); expect(claimQuestReward(FORGE)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
    useInventoryStore.setState({ currencies: { 'gem-shard': 0, gems: 10, runes: 20, runeShards: 30 } });
    const profile = required(loadQuests().find(q => q.id === FORGE)?.rewards?.lootTable);
    withRewards({ gemShards: 3, gems: 2, runes: 3, runeShards: 4, lootTable: profile }, () => {
      expect(claimQuestReward(FORGE)).toBe('ok');
    });
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 7, gems: 12, runes: 23, runeShards: 34 }); expect(roll).toHaveBeenCalled();
  });
  it.each(['hero', 'merc', 'currency', 'claimed'].flatMap(fault => [false, true].map(afterWrite => ({ fault, afterWrite }))))(
    'restores all reward participants for $fault after-write=$afterWrite and retries exact Claim', ({ fault, afterWrite }) => {
      prepareClaim(); const before = data();
      const fail = (): never => { expect(executeQuestAction(SHATTER)).toBe('claim-in-progress'); throw new Error(fault); };
      if (fault === 'hero') usePlayerStore.setState({ gainExperience: amount => { if (afterWrite) grants.gainExperience(amount); return fail(); } });
      if (fault === 'merc') useMercStore.setState({ shareExperienceWithFielded: amount => { if (afterWrite) grants.shareExperienceWithFielded(amount); fail(); } });
      if (fault === 'currency') useInventoryStore.setState({ addCurrency: (kind, amount) => { if (afterWrite) grants.addCurrency(kind, amount); fail(); } });
      if (fault === 'claimed') useMapStore.setState({ markQuestRewardClaimed: id => { if (afterWrite) actions.markQuestRewardClaimed(id); fail(); } });
      expect(claimQuestReward(FORGE)).toBe('grant-failed'); expect(data()).toEqual(before);
      usePlayerStore.setState({ gainExperience: grants.gainExperience }); useMercStore.setState({ shareExperienceWithFielded: grants.shareExperienceWithFielded });
      useInventoryStore.setState({ addCurrency: grants.addCurrency }); useMapStore.setState(actions);
      expect(claimQuestReward(FORGE)).toBe('ok'); expect(useInventoryStore.getState().currencies['gem-shard']).toBe(3);
    });
  it('migrates frozen15 without minting proof, item, consumption, points or claimed reward repair', () => {
    prepareSoulstone(); const save = required(snapshotStores()), v15 = { ...withoutV17Fields(save), version: 15 }, before = structuredClone(v15);
    expect(decodeSave(v15)).toEqual(save); expect(v15).toEqual(before);
    const { [STONE]: _stone, ...questItems } = save.inventory.questItems;
    const missing = { ...v15, inventory: { ...v15.inventory, questItems } };
    const migrated = decodeSave(missing); expect(migrated.inventory.questItems).toEqual(questItems);
    expect(migrated.player).toEqual(save.player); expect(migrated.map.questReceipts).toEqual(save.map.questReceipts);
    expect(migrated.map.questProgress).toEqual(save.map.questProgress);
  });
  it.each(['owned-hammer', 'consumed-stone', 'izual-proof', 'diablo-proof', 'hephasto-proof', 'forge-proof'])(
    'rejects future %s in frozen15 before migration', fault => {
      prepareSoulstone(); const save = required(snapshotStores());
      if (fault === 'owned-hammer') prepareForge();
      if (fault === 'forge-proof' || fault === 'consumed-stone') { prepareForge(); expect(executeQuestAction(SHATTER)).toBe('ok'); }
      let latest = required(snapshotStores());
      if (fault === 'izual-proof' || fault === 'diablo-proof' || fault === 'hephasto-proof') {
        const id = fault === 'izual-proof' ? IZUAL : fault === 'diablo-proof' ? DIABLO : FORGE;
        const suffix = fault === 'izual-proof' ? 'izual-victory' : fault === 'diablo-proof' ? 'diablo-victory' : 'hephasto-victory';
        latest = { ...latest, map: { ...latest.map, questReceipts: { ...save.map.questReceipts, [`${id}#action:${suffix}`]: true } } };
      }
      expect(() => decodeSave({ ...withoutV17Fields(latest), version: 15 })).toThrow();
    });
});
