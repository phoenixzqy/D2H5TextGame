import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset(); });
it('creates a finite learned personal pool without healing or changing saved stats', () => {
  const fresh = createMockPlayer('Bone Armor functional fixture', 'necromancer');
  for (const [rank, capacity] of [[1, 12], [10, 120], [20, 240], [99, 240]] as const) {
    const p = { ...fresh, comboOrder: [], skillLevels: { 'necromancer.bone_armor': rank } };
    const before = structuredClone(p), u = playerToCombatUnit(p);
    expect(u.statuses).toEqual([expect.objectContaining({ id: 'bone-armor', sourceId: p.id,
      boneArmor: { rank: Math.min(rank, 20), remaining: capacity } })]);
    expect(u.life).toBe(fresh.derivedStats.life);
    expect(u.mana).toBe(fresh.derivedStats.mana);
    expect(u.stats).toEqual(playerToCombatUnit({ ...p, skillLevels: {} }).stats);
    expect(playerToCombatUnit(p)).toEqual(u);
    expect(p).toEqual(before);
  }
});

it('uses the maximum exact alias once and rejects unallocated, foreign or malformed evidence', () => {
  const fresh = createMockPlayer('Bone Armor eligibility fixture', 'necromancer');
  for (const skillLevels of [
    { 'skills-necromancer-bone-armor': 1 },
    { 'skills-necromancer-bone-armor': 1, 'necromancer.bone_armor': 2 },
    { 'necromancer.bone_armor': 2, 'skills-necromancer-bone-armor': 1 }
  ]) {
    const expected = Math.max(...Object.values(skillLevels));
    expect(playerToCombatUnit({ ...fresh, skillLevels }).statuses[0]?.boneArmor)
      .toEqual({ rank: expected, remaining: expected * 12 });
  }
  for (const invalid of [0, -1, NaN, Infinity, 1.5, '20', null, undefined]) {
    const skillLevels = { 'necromancer.bone_armor': invalid } as unknown as NonNullable<typeof fresh.skillLevels>;
    expect(playerToCombatUnit({ ...fresh, skillLevels }).statuses).toEqual([]);
  }
  for (const classId of ['sorceress', 'barbarian', 'amazon', 'paladin', 'druid', 'assassin'] as const) {
    expect(playerToCombatUnit({ ...fresh, class: classId, skillLevels: { 'necromancer.bone_armor': 20 } }).statuses).toEqual([]);
  }
  expect(playerToCombatUnit({ ...fresh, level: 0, skillLevels: { 'necromancer.bone_armor': 20 } }).statuses).toEqual([]);
  expect(playerToCombatUnit({ ...fresh, comboOrder: ['necromancer.bone_armor'], skillLevels: {} }).statuses).toEqual([]);
});
