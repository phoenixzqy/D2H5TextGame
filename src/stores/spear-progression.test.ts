/** Constructed owned gear proves native equipment projection, not campaign balance. */
import { afterEach, assert, beforeEach, expect, it } from 'vitest';
import policy from '../../tests/fixtures/spear-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';
import { createRng } from '@/engine/rng';
import { rollItem } from '@/engine/loot/rollItem';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

const pools = loadAwardPools();
function reset() {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useMapStore.getState().reset(); useMercStore.getState().reset(); useFormationStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(reset); afterEach(reset);

it.each(policy.tiers)('$baseId enforces its equip level and retains spear mastery and owned custody on two-handed upgrade', tier => {
  const starter = rollItem({ baseId: 'items/base/weapon-spear', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
  const candidate = rollItem({ baseId: tier.baseId, rarity: 'normal', ilvl: tier.from }, pools, createRng(7));
  const shield = rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
  assert(starter && candidate && shield);
  const player = { ...createMockPlayer('Spear equipment fixture', 'barbarian'), level: tier.from - 1,
    skillLevels: { 'barbarian.spear_mastery': 20 }, equipment: [] };
  usePlayerStore.getState().setPlayer(player);
  for (const item of [starter, shield, candidate]) useInventoryStore.getState().addItem(item);
  expect(useInventoryStore.getState().equipItem(shield)).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipItem(starter)).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipped.offhand).toBeNull();
  expect(useInventoryStore.getState().backpack).toContainEqual({ ...shield, equipped: false });
  const frozen = structuredClone({ backpack: useInventoryStore.getState().backpack,
    equipped: useInventoryStore.getState().equipped, player: usePlayerStore.getState().player });
  expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: false, reason: 'requirements_not_met' });
  expect({ backpack: useInventoryStore.getState().backpack, equipped: useInventoryStore.getState().equipped,
    player: usePlayerStore.getState().player }).toEqual(frozen);
  const current = usePlayerStore.getState().player; assert(current);
  usePlayerStore.getState().setPlayer({ ...current, level: tier.from });
  usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
  const before = usePlayerStore.getState().player; assert(before);
  const beforeUnit = playerToCombatUnit(before);
  expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: true });
  const after = usePlayerStore.getState().player; assert(after);
  const unit = playerToCombatUnit(after);
  expect(resolveEquippedWeapon(useInventoryStore.getState().equipped))
    .toEqual({ weaponType: 'spear', handedness: 'twoHanded' });
  expect(after.derivedStats.attack - before.derivedStats.attack)
    .toBe((candidate.baseRolls?.attack ?? 0) - (starter.baseRolls?.attack ?? 0));
  expect(after.derivedStats.attack).toBeGreaterThan(before.derivedStats.attack);
  expect(unit.stats.attack).toBe(after.derivedStats.attack);
  expect(unit.increasedDamagePct?.physical).toBeCloseTo(0.6, 12);
  expect(unit.stats.attackSpeed).toBe(beforeUnit.stats.attackSpeed);
  expect(unit.stats.critChance - after.derivedStats.critChance).toBeCloseTo(0.1, 12);
  expect(unit.stats.critChance).toBe(beforeUnit.stats.critChance);
  expect(useInventoryStore.getState().equipped.offhand).toBeNull();
  expect(useInventoryStore.getState().backpack).toEqual([
    { ...shield, equipped: false }, { ...starter, equipped: false }
  ]);
});
