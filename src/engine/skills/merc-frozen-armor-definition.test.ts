import { expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { MERC_FROZEN_ARMOR_DEFINITION, MERC_FROZEN_ARMOR_SKILL, resolveMercFrozenArmor } from './merc-frozen-armor';

it('copies fractional authored tuning without retaining or freezing caller input', () => {
  const native = rows.find(row => row.id === 'mskill-frozen-armor');
  if (!native) throw new Error('Missing native Armor');
  const row = { ...structuredClone(native), mercFrozenArmor: { defense: 127.5 } };
  const before = structuredClone(row), out = resolveMercFrozenArmor([row]);
  expect(row).toEqual(before);
  expect(Object.isFrozen(row)).toBe(false);
  expect(Object.isFrozen(row.mercFrozenArmor)).toBe(false);
  row.mercFrozenArmor.defense = 1;
  expect(out.definition).toEqual({ minLevel: 1, maxRank: 20, defense: 127.5 });
  expect(Object.isFrozen(out)).toBe(true);
  expect(Object.isFrozen(out.definition)).toBe(true);
  expect(Object.isFrozen(out.skill)).toBe(true);
  expect(Object.isFrozen(out.skill.effects)).toBe(true);
  expect(Object.isFrozen(out.skill.effects[0])).toBe(true);
  expect(MERC_FROZEN_ARMOR_DEFINITION.defense).toBe(120);
  expect(MERC_FROZEN_ARMOR_SKILL.cooldown).toBe(6);
});

it('rejects missing, duplicate and malformed native definitions', () => {
  const row = rows.find(row => row.id === 'mskill-frozen-armor');
  if (!row) throw new Error('Missing native Armor');
  for (const source of [[], [row, row], [{ ...row, mercFrozenArmor: { defense: -1 } }]]) {
    expect(() => resolveMercFrozenArmor(source)).toThrow();
  }
});
