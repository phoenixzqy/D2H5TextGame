/** Constructed public capabilities; these controls do not establish earned Act II pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary } from '@/engine/progression/merc-growth';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores,
  useHydrationStore } from '@/stores/persistence';
import { canClaim, claimQuestReward } from './claimReward';
import { recoverQuestTool } from './interactObject';

// Literal expectations deliberately do not derive rewards from the implementation's tuples.
const cases = [
  { key: 'horazon', quest: 'quests/side-act2-summoners-secret', objective: 'obj-find',
    source: 'quests/side-act2-summoners-secret#objective:obj-find', item: 'quest/horazon_lockbox',
    area: 'areas/act2-arcane-sanctuary', xp: 5000, mercXp: 3750,
    uniqueId: 'items/unique/manald-heal', ilvl: 23, slot: 'ring-left' },
  { key: 'elzix', quest: 'quests/side-act2-lost-caravan', objective: 'obj-find-box',
    source: 'quests/side-act2-lost-caravan#objective:obj-find-box', item: 'quest/elzix_strongbox',
    area: 'areas/act2-far-oasis', xp: 3000, mercXp: 2250,
    uniqueId: 'items/unique/eye-of-etlich', ilvl: 18, slot: 'amulet' }
] as const;
type CacheCase = typeof cases[number];
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing independent retained-cache fixture');
  return value;
}
const hero = () => required(usePlayerStore.getState().player);
const heroXp = () => xpTotal(hero().level) + hero().experience;
function canonicalHero() {
  return deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
    useMapStore.getState().questProgress, useInventoryStore.getState().questItems,
    useMapStore.getState().questReceipts);
}
function mercXp(id: string) {
  const state = useMercStore.getState(), actor = required(state.ownedMercs.find(row => row.id === id));
  let total = state.getMercProgress(id).experience;
  for (let level = 1; level < actor.level; level++) total += mercXpForLevel(level);
  return total;
}
function hire(suffix: string, level = 35): Mercenary {
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
  const fresh = createMercFromDef(def, suffix), grown = growMercenary(fresh, Math.max(level, fresh.level) - fresh.level);
  const actor = { ...grown, derivedStats: { ...grown.derivedStats, life: 13, mana: 3 } };
  useMercStore.getState().addMerc(actor);
  return actor;
}
function track(entry: CacheCase) {
  useMapStore.setState(state => ({ currentAct: 2, currentSubAreaId: entry.area,
    selectedDifficulty: 'normal', clearedSubAreas: ['areas/act1-catacombs'],
    questProgress: { ...state.questProgress, [entry.quest]: { id: entry.quest,
      status: 'inProgress', rewardClaimed: false, objectives: { [entry.objective]: false } } } }));
}
function recover(entry: CacheCase) {
  track(entry);
  expect(recoverQuestTool(entry.source)).toBe('ok');
  expect(canClaim(entry.quest)).toBe(true);
}
async function importedStale(entry: CacheCase) {
  track(entry);
  const current = hero(), canonical = canonicalHero();
  usePlayerStore.setState({ player: { ...current,
    derivedStats: { ...canonical, defense: canonical.defense + 7 } } });
  const accepted = structuredClone(hero());
  // Import the unchanged public export. No post-import cache repair or copied source proof.
  await importIntoStores(required(exportCurrentSave()));
  expect(hero()).toEqual(accepted);
  expect(hero().derivedStats.defense).toBe(canonicalHero().defense + 7);
  expect(recoverQuestTool(entry.source)).toBe('ok');
  expect(hero()).toEqual(accepted);
  return accepted;
}
function data() {
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  return structuredClone({ player: hero(), backpack: inventory.backpack, stash: inventory.stash,
    equipped: inventory.equipped, currencies: inventory.currencies, materials: inventory.materials,
    questItems: inventory.questItems, legacy: inventory.legacyGearQuarantine,
    sockets: inventory.socketQuarantine, progress: useMapStore.getState().questProgress,
    ownedMercs: mercs.ownedMercs, mercProgress: mercs.mercProgress,
    mercEquipment: mercs.mercEquipment, fieldedMercId: mercs.fieldedMercId });
}
function noReward(entry: CacheCase) {
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  const items = [...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
    ...hero().equipment, ...mercs.ownedMercs.flatMap(row => row.equipment),
    ...Object.values(mercs.mercEquipment).flatMap(slots => Object.values(slots)),
    ...inventory.legacyGearQuarantine.map(row => row.item), ...inventory.socketQuarantine.map(row => row.item)];
  expect(items.some(item => item?.uniqueId === entry.uniqueId)).toBe(false);
  expect(inventory.questItems[entry.source]).toEqual({ itemId: entry.item, state: 'owned' });
  expect(useMapStore.getState().questProgress[entry.quest]?.rewardClaimed).toBe(false);
}
function onReward(entry: CacheCase, action: (item: Item) => void) {
  let fired = false;
  stops.push(useInventoryStore.subscribe(state => {
    const item = state.backpack.find(row => row.uniqueId === entry.uniqueId);
    if (fired || !item) return;
    fired = true;
    action(item);
  }));
  return () => { expect(fired).toBe(true); };
}
function stopObservers() {
  stops.splice(0).forEach(stop => { stop(); });
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Independent cache acceptance', 'sorceress');
  const player = { ...fresh, id: 'cache-acceptance-hero', level: 35, equipment: [],
    experience: 0, experienceToNextLevel: xpRequired(35), statPoints: 11, skillPoints: 3 };
  const derivedStats = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...derivedStats, life: 7, mana: 3 } });
  useInventoryStore.setState({ currencies: { gold: 41, gemShards: 23, 'opaque-wallet': 17 } });
});
afterEach(() => {
  stopObservers(); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests();
  stores.forEach(store => { store.getState().reset(); });
});

describe.each(cases)('$key independent public acceptance', entry => {
  it('imports an accepted cache, really recovers, and separately pays the exact named bag without healing or equipping', async () => {
    const recipient = hire('prior-fielded'), reserve = hire('reserve');
    useMercStore.getState().setFieldedMerc(recipient.id);
    const accepted = await importedStale(entry), beforeXp = heroXp();
    const beforeRecipient = mercXp(recipient.id), beforeReserve = mercXp(reserve.id);
    const mercBefore = structuredClone(required(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id)));
    const wallet = structuredClone(useInventoryStore.getState().currencies);
    // Claim location/difficulty do not replace the independently earned source requirement.
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    expect(claimQuestReward(entry.quest)).toBe('ok');
    expect(heroXp() - beforeXp).toBe(entry.xp);
    expect(mercXp(recipient.id) - beforeRecipient).toBe(entry.mercXp);
    expect(mercXp(reserve.id)).toBe(beforeReserve);
    expect(useMercStore.getState().fieldedMercId).toBe(recipient.id);
    expect(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id)?.derivedStats).toEqual(mercBefore.derivedStats);
    expect(hero().derivedStats).toEqual(canonicalHero());
    expect(hero().derivedStats.life).toBe(accepted.derivedStats.life);
    expect(hero().derivedStats.mana).toBe(accepted.derivedStats.mana);
    expect(hero().statPoints).toBe(accepted.statPoints);
    expect(hero().skillPoints).toBe(accepted.skillPoints);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useInventoryStore.getState().backpack[0]).toMatchObject({ uniqueId: entry.uniqueId,
      ilvl: entry.ilvl, identified: true, equipped: false });
    expect(useInventoryStore.getState().equipped).toEqual({});
    expect(useInventoryStore.getState().questItems[entry.source]).toEqual({ itemId: entry.item, state: 'owned' });
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    stopObservers();
    const paid = data();
    expect(claimQuestReward(entry.quest)).toBe('already-claimed');
    expect(data()).toEqual(paid);
  });

  it('preserves independent fielding after actual recipient publication aborts the Claim', () => {
    const recipient = hire('original-fielded'), reserve = hire('new-fielded');
    useMercStore.getState().setFieldedMerc(recipient.id); recover(entry);
    const before = data();
    let fired = false;
    stops.push(useMercStore.subscribe(() => {
      if (fired) return;
      fired = true; useMercStore.getState().setFieldedMerc(reserve.id);
    }));
    expect(claimQuestReward(entry.quest)).toBe('grant-failed');
    expect(fired).toBe(true);
    expect(data()).toEqual({ ...before, fieldedMercId: reserve.id });
    noReward(entry);
  });

  describe.each(['hero', 'merc', 'item', 'claimed'] as const)('%s publication', boundary => {
    it.each(['before', 'after', 'noop'] as const)('%s fault leaves no partial bag and permits one full retry', mode => {
      const recipient = hire('fault-recipient');
      useMercStore.getState().setFieldedMerc(recipient.id);
      recover(entry);
      const before = data(), beforeHero = heroXp(), beforeMerc = mercXp(recipient.id);
      const fail = () => { throw new Error(`${boundary}-${mode}`); };
      let faultReached = false, paidAtMarker: { hero: number; merc: number; items: number } | undefined;
      let restore: () => void;
      if (boundary === 'hero') {
        const real = usePlayerStore.getState().gainExperience;
        const spy = vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
          faultReached = true;
          if (mode === 'before') return fail();
          if (mode === 'noop') return { levelsGained: 0, newLevel: hero().level, statPointsGranted: 0, skillPointsGranted: 0 };
          real(amount); return fail();
        });
        restore = () => { spy.mockRestore(); };
      } else if (boundary === 'merc') {
        const real = useMercStore.getState().addExperience;
        const spy = vi.spyOn(useMercStore.getState(), 'addExperience').mockImplementation((id, amount) => {
          faultReached = true;
          if (mode === 'before') return fail();
          if (mode === 'noop') return { levelsGained: 0, newLevel: recipient.level };
          real(id, amount); return fail();
        });
        restore = () => { spy.mockRestore(); };
      } else if (boundary === 'item') {
        const real = useInventoryStore.getState().addItem;
        const spy = vi.spyOn(useInventoryStore.getState(), 'addItem').mockImplementation((item, toStash) => {
          faultReached = true;
          if (mode === 'before') return fail();
          if (mode === 'noop') return;
          real(item, toStash); return fail();
        });
        restore = () => { spy.mockRestore(); };
      } else {
        const real = useMapStore.getState().markQuestRewardClaimed;
        const spy = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
          faultReached = true;
          paidAtMarker = { hero: heroXp() - beforeHero, merc: mercXp(recipient.id) - beforeMerc,
            items: useInventoryStore.getState().backpack.filter(row => row.uniqueId === entry.uniqueId).length };
          if (mode === 'before') return fail();
          if (mode === 'noop') return;
          real(id); return fail();
        });
        restore = () => { spy.mockRestore(); };
      }
      expect(claimQuestReward(entry.quest)).toBe('grant-failed');
      expect(faultReached).toBe(true);
      if (boundary === 'claimed') expect(paidAtMarker).toEqual({ hero: entry.xp, merc: entry.mercXp, items: 1 });
      expect(data()).toEqual(before);
      restore();
      expect(claimQuestReward(entry.quest)).toBe('ok');
      expect(heroXp()).toBe(beforeHero + entry.xp);
      expect(mercXp(recipient.id)).toBe(beforeMerc + entry.mercXp);
      expect(useInventoryStore.getState().backpack).toHaveLength(1);
      expect(useInventoryStore.getState().backpack[0]?.uniqueId).toBe(entry.uniqueId);
    });
  });

  it.each([2, 2000])('removes its recipient share while conserving real independent %s XP and ordinary growth', independent => {
    const recipient = hire('independent-recipient', 1);
    useMercStore.getState().setFieldedMerc(recipient.id); recover(entry);
    const original = useMercStore.getState();
    const baseline = { ownedMercs: original.ownedMercs, mercProgress: original.mercProgress };
    // An ordinary real award supplies the counterfactual, including threshold resource growth.
    original.addExperience(recipient.id, independent);
    const expectedActor = structuredClone(required(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id)));
    const expectedProgress = structuredClone(useMercStore.getState().getMercProgress(recipient.id));
    useMercStore.setState(baseline);
    let fired = false;
    stops.push(useMercStore.subscribe(() => {
      if (fired) return;
      fired = true;
      useMercStore.getState().addExperience(recipient.id, independent);
      throw new Error('fault after independent recipient XP');
    }));
    expect(claimQuestReward(entry.quest)).toBe('grant-failed');
    expect(fired).toBe(true);
    expect(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id)).toEqual(expectedActor);
    expect(useMercStore.getState().getMercProgress(recipient.id)).toEqual(expectedProgress);
    noReward(entry);
  });

  it.each(['removed', 'same-id-reused'] as const)('preserves independent fielding and a %s recipient without resurrection or foreign XP', mode => {
    const recipient = hire('departing'), reserve = hire('independent-reserve');
    useMercStore.getState().setFieldedMerc(recipient.id); recover(entry);
    let foreign: Mercenary | undefined, foreignProgress: ReturnType<typeof useMercStore.getState>['mercProgress'][string] | undefined;
    let fired = false;
    stops.push(useMercStore.subscribe(() => {
      if (fired) return;
      fired = true;
      useMercStore.getState().removeMerc(recipient.id);
      if (mode === 'same-id-reused') {
        const replacement = { ...structuredClone(recipient), name: 'Independent same-ID merc' };
        useMercStore.getState().addMerc(replacement);
        useMercStore.getState().addExperience(replacement.id, 17);
        foreign = required(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id));
        foreignProgress = structuredClone(useMercStore.getState().getMercProgress(recipient.id));
      }
      useMercStore.getState().setFieldedMerc(reserve.id);
      throw new Error('recipient departure');
    }));
    expect(claimQuestReward(entry.quest)).toBe('grant-failed');
    expect(fired).toBe(true);
    expect(useMercStore.getState().fieldedMercId).toBe(reserve.id);
    if (mode === 'removed') {
      expect(useMercStore.getState().ownedMercs.some(row => row.id === recipient.id)).toBe(false);
      expect(useMercStore.getState().mercProgress).not.toHaveProperty(recipient.id);
    } else {
      expect(useMercStore.getState().ownedMercs.find(row => row.id === recipient.id)).toBe(foreign);
      expect(useMercStore.getState().getMercProgress(recipient.id)).toEqual(foreignProgress);
    }
    noReward(entry);
  });

  it.each(['cleanup-owned', 'real-equip'] as const)('handles %s cache normalization after imported accepted cache and physical rollback', async mode => {
    const accepted = await importedStale(entry), beforeXp = heroXp();
    const fired = onReward(entry, item => {
      if (mode === 'real-equip') {
        expect(useInventoryStore.getState().equipItem(item, entry.slot)).toEqual({ ok: true });
        expect(hero().derivedStats).toEqual(canonicalHero());
      } else {
        // Adversarial physical staging only: no supported recomposition and no actor replacement.
        const actor = hero(), staged = { ...item, equipped: true, equipSlot: entry.slot };
        useInventoryStore.setState(state => ({ backpack: state.backpack.filter(row => row !== item),
          equipped: { ...state.equipped, [entry.slot]: staged } }));
        Object.assign(actor, { equipment: [staged] });
        expect(hero()).toBe(actor);
      }
      throw new Error('fault with reward in hero equipment');
    });
    expect(claimQuestReward(entry.quest)).toBe('grant-failed'); fired();
    expect(heroXp()).toBe(beforeXp);
    noReward(entry);
    expect(hero().derivedStats).toEqual(mode === 'cleanup-owned' ? accepted.derivedStats : canonicalHero());
    expect(hero().derivedStats.life).toBe(7);
    expect(hero().derivedStats.mana).toBe(3);
    stopObservers();
    expect(claimQuestReward(entry.quest)).toBe('ok');
    expect(heroXp()).toBe(beforeXp + entry.xp);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
  });

  it('conserves the other paid cache through claimed-last failure and retries only this bag', () => {
    const other = required(cases.find(row => row.key !== entry.key));
    recover(other); expect(claimQuestReward(other.quest)).toBe('ok');
    recover(entry);
    const before = data(), beforeXp = heroXp(), real = useMapStore.getState().markQuestRewardClaimed;
    const spy = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); throw new Error('second cache claimed-last');
    });
    expect(claimQuestReward(entry.quest)).toBe('grant-failed');
    expect(data()).toEqual(before);
    spy.mockRestore();
    expect(claimQuestReward(entry.quest)).toBe('ok');
    expect(heroXp()).toBe(beforeXp + entry.xp);
    expect(useInventoryStore.getState().backpack.map(row => row.uniqueId).sort())
      .toEqual([entry.uniqueId, other.uniqueId].sort());
    expect(claimQuestReward(other.quest)).toBe('already-claimed');
    expect(useInventoryStore.getState().questItems).toEqual({
      [entry.source]: { itemId: entry.item, state: 'owned' },
      [other.source]: { itemId: other.item, state: 'owned' }
    });
  });
});
