import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ASSASSIN_TRAP_IDS } from '@/engine/skills/assassin-traps';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

beforeEach(() => {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
});

function player(id: string, rank = 1) {
  return { ...createMockPlayer('Constructed native trap authority', 'assassin'), level: 30,
    comboOrder: [id], skillLevels: { ...Object.fromEntries(rows.map(row => [row.id, 1])), [id]: rank } };
}

for (const id of ASSASSIN_TRAP_IDS) for (const rank of [1, 20])
  it(`native ${id} rank${String(rank)} captures learned authority independently of mutable allocations`, () => {
    const alias = 'skills-assassin-' + id.slice(9).replaceAll('_', '-'), input = player(alias, rank);
    const before = structuredClone(input), native = playerToCombatUnit(input);
    expect(native.assassinTrapRanks).toEqual({ [id]: rank });
    expect(input).toEqual(before);
    input.skillLevels[alias] = 0;
    input.comboOrder.length = 0;
    expect(native.assassinTrapRanks).toEqual({ [id]: rank });
    expect(Object.isFrozen(native.assassinTrapRanks)).toBe(true);
  });

it('native class, level, selection and transitive prerequisites control the fresh projection', () => {
  const input = player('skills-assassin-lightning-sentry');
  expect(playerToCombatUnit({ ...input, class: 'amazon' }).assassinTrapRanks).toBeUndefined();
  expect(playerToCombatUnit({ ...input, level: 23 }).assassinTrapRanks).toEqual({});
  expect(playerToCombatUnit({ ...input, comboOrder: [] }).assassinTrapRanks).toEqual({});
  expect(playerToCombatUnit({ ...input, skillLevels: { ...input.skillLevels,
    'skills-assassin-fire-blast': 0 } }).assassinTrapRanks).toEqual({});
});
