import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Item } from '@/engine/types/items';
import type { SaveCurrent } from '@/engine/types/save';
import { buildSave } from '@/engine/save/serialize';
import { createRng } from '@/engine/rng';
import { __resetRollItemSeqForTests, rollItem } from '@/engine/loot/rollItem';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { earnedDelta, observeEarnedState, resetEarnedStores, restoreEarnedSave } from './earned-state';

const item = (id: string): Item => ({ id, baseId: 'items/base/glove-leather',
  rarity: 'normal', level: 1, identified: true, equipped: false });

beforeEach(() => {
  __resetRollItemSeqForTests();
  resetEarnedStores();
  usePlayerStore.getState().setPlayer(createMockPlayer('Identity check', 'sorceress'));
});
afterEach(() => {
  resetEarnedStores();
  useHydrationStore.getState().setStatus('idle');
  __resetRollItemSeqForTests();
});

function currentSave(): SaveCurrent {
  const state = observeEarnedState();
  if (!state.player.player) throw new Error('Missing test player');
  const { endgame, ...map } = state.map;
  return buildSave({ timestamp: 1792497600000, player: state.player.player,
    inventory: state.inventory, mercs: state.merc, map, endgame,
    meta: { settings: state.meta.settings, idleState: state.meta.idleState,
      gachaState: state.meta.gachaState }, formation: state.formation });
}
function rollNextItem(): Item {
  const result = rollItem({ baseId: 'items/base/glove-leather', rarity: 'normal', ilvl: 1 },
    { bases: loadItemBases(), affixes: loadAffixPool() }, createRng(7));
  if (!result) throw new Error('Missing actual rolled item');
  return result;
}

describe('earned item measurement integrity', () => {
  it('observes exact signed material changes independently of unchanged legacy currencies', () => {
    useInventoryStore.setState({ materials: { 'runes/el': 4, 'materials/scrap': 2 },
      currencies: { 'rune-shard': 17, 'gem-shard': 8 } });
    const before = observeEarnedState();
    useInventoryStore.setState({ materials: { 'runes/el': 1, 'gems/ruby/chipped': 2 } });
    const delta = earnedDelta(before, observeEarnedState());
    expect(delta).toMatchObject({ materials: { 'runes/el': -3, 'materials/scrap': -2, 'gems/ruby/chipped': 2 },
      currencies: { 'rune-shard': 0, 'gem-shard': 0 } });
    expect(before.inventory.materials).toEqual({ 'runes/el': 4, 'materials/scrap': 2 });
  });

  it('refuses a newly added object reusing an existing ID instead of reporting zero loot', () => {
    useInventoryStore.setState({ backpack: [item('same')] });
    const before = observeEarnedState();
    useInventoryStore.setState({ backpack: [item('same'), item('same')] });
    expect(() => earnedDelta(before, observeEarnedState())).toThrow(/duplicate owned item ID/i);
  });

  it('refuses duplicate IDs in the starting state even when they disappear afterward', () => {
    useInventoryStore.setState({ backpack: [item('same')], stash: [item('same')] });
    const before = observeEarnedState();
    useInventoryStore.setState({ stash: [] });
    expect(() => earnedDelta(before, observeEarnedState())).toThrow(/duplicate owned item ID/i);
  });

  it('checks identity across hero and merc gear, not just the backpack', () => {
    useInventoryStore.setState({ equipped: { gloves: item('same') } });
    const before = observeEarnedState();
    useMercStore.setState({ mercEquipment: { rogue: { gloves: item('same') } } });
    expect(() => earnedDelta(before, observeEarnedState())).toThrow(/duplicate owned item ID/i);
  });

  it('allows an ordinary move between owned slots and measures one distinct addition', () => {
    useInventoryStore.setState({ backpack: [item('kept')] });
    const before = observeEarnedState();
    useInventoryStore.setState({ backpack: [item('new')], stash: [item('kept')] });
    const delta = earnedDelta(before, observeEarnedState());
    expect(delta.addedItems).toEqual([item('new')]);
    expect(delta.removedItemIds).toEqual([]);
  });
});

describe('isolated earned save reconstruction', () => {
  it.each(['backpack', 'stash', 'hero', 'merc'] as const)(
    'seeds actual item allocation above the saved maximum in %s before readiness', location => {
      const savedItem = item('it-a-2s'); // base36 2s = 100
      const original = currentSave();
      const save: SaveCurrent = { ...original,
        player: { ...original.player, equipment: location === 'hero' ? [savedItem] : [] },
        inventory: { ...original.inventory,
          backpack: location === 'backpack' ? [savedItem] : [],
          stash: location === 'stash' ? [savedItem] : [],
          equipped: location === 'hero' ? { gloves: savedItem } : {} },
        mercs: { ...original.mercs,
          mercEquipment: location === 'merc' ? { rogue: { gloves: savedItem } } : {} } };
      let rolledAtReady: Item | undefined;
      const unsubscribe = useHydrationStore.subscribe(state => {
        if (state.status === 'ready') rolledAtReady = rollNextItem();
      });
      try { restoreEarnedSave(save, 1792497600000); }
      finally { unsubscribe(); }
      expect(rolledAtReady?.id.split('-').at(-1)).toBe('2t'); // 101
      expect(rollNextItem().id.split('-').at(-1)).toBe('2u'); // 102
      expect(currentSave()).toEqual(save);
    });

  it('restores all saved domains as independent clones without refilling resources', () => {
    const baseline = currentSave();
    const mercDef = loadMercHireRoster()[0]?.mercs[0];
    if (!mercDef) throw new Error('Missing production mercenary definition');
    const merc = createMercFromDef(mercDef);
    const save: SaveCurrent = { ...baseline,
      player: { ...baseline.player,
        derivedStats: { ...baseline.player.derivedStats, life: 17, mana: 3 } },
      inventory: { ...baseline.inventory,
        backpack: [item('it-a-2s')], currencies: { wishstone: 7 } },
      mercs: { ...baseline.mercs, ownedMercs: [{ ...merc, level: 3, equipment: [item('it-b-2t')] }], fieldedMercId: merc.id,
        mercEquipment: { [merc.id]: { gloves: item('it-b-2t') } },
        mercProgress: { [merc.id]: { experience: 19, experienceToNextLevel: 304 } } },
      map: { ...baseline.map, currentSubAreaId: 'areas/act1-cold-plains',
        discoveredAreas: ['areas/act1-blood-moor', 'areas/act1-cold-plains'],
        clearedSubAreas: ['areas/act1-blood-moor'],
        questProgress: { den: { id: 'den', status: 'inProgress', objectives: { clear: true } } } },
      meta: { ...baseline.meta, settings: { ...baseline.meta.settings, locale: 'en', combatSpeed: 2 },
        idleState: { ...baseline.meta.idleState, lastOnline: 1792497590000,
          multiplierSecondsRemaining: 15, activeMultiplier: 2 },
        gachaState: { currency: 7, ownedMercIds: [merc.id], pityCounter: 13 } },
      formation: { playerPosition: { row: 2, col: 2 }, mercPosition: { row: 1, col: 0 },
        summonPositions: [{ row: 0, col: 2 }, { row: 2, col: 0 }] } };
    const original = structuredClone(save);
    useInventoryStore.setState({ currencies: { wishstone: 999 } });
    restoreEarnedSave(save, 1792497600000);
    expect(currentSave()).toEqual(original);
    expect(save).toEqual(original);
    expect(usePlayerStore.getState().player).not.toBe(save.player);
    expect(useInventoryStore.getState().backpack[0]).not.toBe(save.inventory.backpack[0]);
    expect(useMercStore.getState().ownedMercs[0]).not.toBe(save.mercs.ownedMercs[0]);
    expect(observeEarnedState().meta.idleBonusAnchor).toBe(1792497600000);
    useInventoryStore.getState().addCurrency('wishstone', 1);
    expect(save.inventory.currencies.wishstone).toBe(7);
  });

  it('rejects live combat before changing domains, hydration or item allocation', () => {
    const baseline = currentSave();
    const save: SaveCurrent = { ...baseline,
      inventory: { ...baseline.inventory, backpack: [item('it-a-zz')] } };
    useCombatStore.setState({ inCombat: true });
    const before = observeEarnedState();
    const combat = useCombatStore.getState();
    const hydration = useHydrationStore.getState();
    expect(() => { restoreEarnedSave(save, 1792497600000); }).toThrow(/quiescent service stores/i);
    expect(observeEarnedState()).toEqual(before);
    expect(useCombatStore.getState()).toBe(combat);
    expect(useHydrationStore.getState()).toBe(hydration);
    expect(rollNextItem().id.split('-').at(-1)).toBe('1');
  });

  it.each(['duplicate', 'nonfinite-anchor'] as const)(
    'rejects %s before changing stores or advancing item allocation', fault => {
      const original = currentSave();
      const savedItem = item('it-a-zz');
      const save: SaveCurrent = { ...original, inventory: { ...original.inventory,
        backpack: [savedItem], stash: fault === 'duplicate' ? [savedItem] : [] } };
      const before = observeEarnedState();
      const hydration = useHydrationStore.getState();
      expect(() => { restoreEarnedSave(save, fault === 'nonfinite-anchor' ? NaN : 1792497600000); })
        .toThrow(fault === 'duplicate' ? /duplicate owned item ID/i : /finite bonus anchor/i);
      expect(observeEarnedState()).toEqual(before);
      expect(useHydrationStore.getState()).toBe(hydration);
      expect(rollNextItem().id.split('-').at(-1)).toBe('1');
    });
});
