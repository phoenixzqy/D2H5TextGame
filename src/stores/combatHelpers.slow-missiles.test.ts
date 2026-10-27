import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useFormationStore } from '@/stores/formationStore';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
const skill = 'skills-amazon-slow-missiles';
function player(rank = 1) { return { ...createMockPlayer('Slow Missiles authority', 'amazon'),
 level: 30, skillLevels: { 'skills-amazon-inner-sight': 1, [skill]: rank }, comboOrder: [skill] }; }
beforeEach(() => { usePlayerStore.getState().reset(); useInventoryStore.getState().reset(); useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
it.each([1, 20])('copies learned native rank%s independently of paid status', rank => {
 const p = player(rank), before = structuredClone(p), u = playerToCombatUnit(p);
 expect(u).toHaveProperty('slowMissilesRank', rank); expect(u.skillLevels?.['amazon.slow_missiles']).toBe(rank);
 expect(p).toEqual(before); expect(u.statuses.some(s => s.id === 'slow-missiles')).toBe(false);
});
it('rejects wrong class, level, prerequisite and malformed allocations at native projection', () => {
 const p = player();
 for (const candidate of [{ ...p, class: 'assassin' as const }, { ...p, level: 11 },
 { ...p, skillLevels: { [skill]: 1 } },
 ...[0, -1, 21, .5, NaN, Infinity].map(rank => ({ ...p, skillLevels: { ...p.skillLevels, [skill]: rank } }))]) {
  expect(playerToCombatUnit(candidate)).toHaveProperty('slowMissilesRank', 0);
 }
});
