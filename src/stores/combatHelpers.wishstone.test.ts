import { afterEach, beforeEach, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { materialEconomy } from '@/data/loaders/materials';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { awardLootForVictory, createSimpleEnemy } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { usePlayerStore } from './playerStore';

const stores = [useInventoryStore, useMercStore, usePlayerStore];
const reset = () => { for (const store of stores) store.getState().reset(); };
beforeEach(reset);
afterEach(reset);

it('uses independent per-enemy wishstone coins while publishing the entire native victory bag once', () => {
  usePlayerStore.getState().setPlayer(createMockPlayer('Currency', 'amazon'));
  const ids = ['currency-enemy-a', 'currency-enemy-b'];
  const chance = materialEconomy.currencyRewards.wishstones.killChance;
  const seed = Array.from({ length: 256 }, (_, i) => i).find(value => {
    const hits = ids.map(id => createRng(value).fork(`wishstone:${id}`).chance(chance));
    return hits[0] !== hits[1];
  });
  if (seed === undefined) throw new Error('Missing deterministic mixed-hit fixture');
  const slainEnemies = ids.map((id, i) => ({ ...createSimpleEnemy(10, i), id, tier: 'boss' as const, life: 0 }));
  const reward = awardLootForVictory({ slainEnemies, act: 1, treasureClassId: 'loot/missing', seed });
  expect(reward.wishstones).toBe(6);
  expect(reward.runes).toBe(2);
  expect(reward.gems).toBe(2);
  expect(reward.runeShards).toBeGreaterThan(0);
  expect(useInventoryStore.getState().currencies.wishstone).toBe(6);
  expect(useInventoryStore.getState().materials).toEqual(reward.materials);
});
