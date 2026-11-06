import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadClassStartingStats } from '@/data/loaders/classes';
import { composeEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { prepareTownRespec, executeTownRespec } from './respecActions';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';

const QUEST = 'quests/side-act5-malahs-elixir';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore] as const;
beforeEach(() => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

describe('Malah effective Vitality survives actual stat reset without a refund', () => {
  it('refunds only raw investment once, retaining unspent points and exact physical entitlement', () => {
    const fresh = createMockPlayer('Malah reset', 'sorceress'), baseline = loadClassStartingStats('sorceress');
    usePlayerStore.getState().setPlayer({ ...fresh, level: 30, statPoints: 8,
      coreStats: { ...baseline, vitality: baseline.vitality + 7 },
      derivedStats: { ...fresh.derivedStats, life: 13, mana: 17 } });
    useInventoryStore.setState({ currencies: { wishstone: 5, opaque: 99 },
      questItems: Object.fromEntries(Array.from({ length: 5 }, (_, i) =>
        [`${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`, { itemId: 'quest/frost_lichen', state: 'consumed' as const }])) });
    useMapStore.setState({ questProgress: { [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: true,
      objectives: { 'obj-collect': true } } } });
    usePlayerStore.getState().recomputeDerived({});
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const quote = prepareTownRespec('npc/akara', 'stat');
    if (quote.kind !== 'ok') throw new Error(quote.kind);
    expect(quote.refund).toBe(7); expect(quote.cost).toBe(0);
    expect(executeTownRespec(quote.request)).toBe('ok');
    const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing reset hero');
    expect(hero.coreStats).toEqual(baseline); expect(hero.statPoints).toBe(15);
    const composition = composeEquippedPlayerStats(hero, 30, {}, map.questProgress, inventory.questItems);
    expect(composition.vitality).toMatchObject({ raw: baseline.vitality, elixir: 10, formula: baseline.vitality + 10 });
    expect(hero.derivedStats).toEqual(composition.derivedStats);
    expect(hero.derivedStats).toMatchObject({ life: 13, mana: 17 });
    expect(hero.respecsRemaining).toEqual({ stat: 2, skill: 3 });
    expect(useInventoryStore.getState()).toBe(inventory); expect(useMapStore.getState()).toBe(map);
    expect(executeTownRespec(quote.request)).toBe('stale');
    expect(prepareTownRespec('npc/akara', 'stat').kind).toBe('no-allocations');
    expect(usePlayerStore.getState().player).toBe(hero);
  });
});
