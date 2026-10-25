import { beforeEach, describe, expect, it } from 'vitest';
import authored from '@/data/skills/druid.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const templates = [
  'raven',
  'spirit_wolf',
  'dire_wolf',
  'grizzly',
  'poison_creeper',
  'carrion_vine',
  'solar_creeper'
];
const rows = authored.filter((row) => 'summonId' in row && templates.includes(row.summonId));
const canonical = (id: string) => id.replace('skills-druid-', 'druid.').replaceAll('-', '_');
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
});
describe.each(rows)('native Druid summon authority $id', (row) => {
  const template = row.summonId;
  if (!template) throw new Error('Missing authored summon template');
  const player = () => ({
    ...createMockPlayer('Synthetic summon authority', 'druid'),
    level: 30,
    skillLevels: {
      ...Object.fromEntries((row.prerequisites ?? []).map((id) => [canonical(id), 1])),
      [row.id]: 1,
      [canonical(row.id)]: 20
    },
    comboOrder: [row.id]
  });
  it('captures only the selected template at the greatest valid exact alias rank', () => {
    const input = player(),
      before = structuredClone(input),
      unit = playerToCombatUnit(input);
    expect(Reflect.get(unit, 'druidSummonRanks')).toEqual({ [template]: 20 });
    expect(input).toEqual(before);
    expect(Object.isFrozen(Reflect.get(unit, 'druidSummonRanks'))).toBe(true);
  });
  it('does not grant authority to unselected or wrong-class allocations', () => {
    expect(
      Reflect.get(playerToCombatUnit({ ...player(), comboOrder: [] }), 'druidSummonRanks')
    ).toEqual({});
    expect(
      Reflect.get(playerToCombatUnit({ ...player(), class: 'sorceress' }), 'druidSummonRanks')
    ).toBeUndefined();
  });
  it('rejects out-of-range, fractional, nonfinite and foreign-prefix ranks', () => {
    for (const rank of [0, -1, 1.5, 21, NaN, Infinity]) {
      const input = player();
      expect(
        Reflect.get(
          playerToCombatUnit({
            ...input,
            skillLevels: {
              ...Object.fromEntries((row.prerequisites ?? []).map((id) => [canonical(id), 1])),
              [row.id]: rank,
              [canonical(row.id)]: rank,
              ['foreign.' + canonical(row.id)]: 20
            }
          }),
          'druidSummonRanks'
        )
      ).toEqual({});
    }
  });
  it('requires unlock and direct learned prerequisites', () => {
    expect(
      Reflect.get(
        playerToCombatUnit({ ...player(), level: row.requiredLevel - 1 }),
        'druidSummonRanks'
      )
    ).toEqual({});
    if ((row.prerequisites ?? []).length > 0) {
      expect(
        Reflect.get(
          playerToCombatUnit({ ...player(), skillLevels: { [row.id]: 1 } }),
          'druidSummonRanks'
        )
      ).toEqual({});
    }
  });
});
