import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';
const reset = () => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset(); useMapStore.getState().reset();
};
beforeEach(reset); afterEach(reset);
it('captures equipment-only speed contribution from canonical stats, excluding learned passives and preserving resources', () => {
  const fresh = createMockPlayer('Cadence gear', 'barbarian');
  const player = { ...fresh, level: 30, skillLevels: { 'barbarian.increased_speed': 20 },
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 } };
  const gear: Item = { id: 'cadence-gloves', baseId: 'items/base/gloves-leather', rarity: 'rare',
    level: 1, identified: true, equipped: true,
    affixes: [{ affixId: 'fixture-cadence', values: new Map([['statMods.attackSpeed', 15], ['coreStats.dexterity', 7]]) }] };
  const equipped = { gloves: gear };
  useInventoryStore.setState({ equipped });
  const before = structuredClone({ player, gear });
  const map = useMapStore.getState();
  const derive = (items: Record<string, Item | null>) => deriveEquippedPlayerStats(player, player.level,
    items, map.questProgress, useInventoryStore.getState().questItems, map.questReceipts);
  const bare = derive({}), geared = derive(equipped);
  const native = playerToCombatUnit(player);
  expect(native.equipmentAttackSpeedPct).toBeCloseTo(geared.attackSpeed / bare.attackSpeed - 1, 12);
  expect(native.equipmentAttackSpeedPct).toBeGreaterThan(.1);
  expect(native.stats.attackSpeed).toBeCloseTo(geared.attackSpeed * 1.2, 12);
  expect([native.life, native.mana]).toEqual([31, 17]);
  expect(playerToCombatUnit({ ...player, skillLevels: {} }).equipmentAttackSpeedPct)
    .toBe(native.equipmentAttackSpeedPct);
  useInventoryStore.setState({ equipped: {} });
  expect(playerToCombatUnit(player).equipmentAttackSpeedPct).toBe(0);
  expect({ player, gear }).toEqual(before);
});
