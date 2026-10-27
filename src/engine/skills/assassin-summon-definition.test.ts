import { expect, it } from 'vitest';
import authored from '../../data/summons/assassin.json';
import rows from '@/data/skills/assassin.json';
import { getAssassinSummonStats, resolveAssassinSummonDefinition } from './assassin-summon-definition';
import { getSummonStats } from '@/engine/skills/summons';
import { scaleSummonStats } from '@/engine/skills/scaling';
import { computeSkillRankDisplayStats } from '@/engine/skills/displayStats';
import { createSkillValidator } from '@/engine/skills/skill-validator';
import type { SkillDef } from '@/engine/types/skills';

const validate = createSkillValidator<SkillDef>();
const templates = ['shadow_warrior', 'shadow_master'] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing body fixture');
  return value;
}
const cases = [
  ['shadow_warrior', 1, 150, 32, 24, 0.1],
  ['shadow_warrior', 6, 190, 42, 29, 0.1],
  ['shadow_warrior', 20, 302, 70, 43, 0.1],
  ['shadow_master', 1, 210, 40, 32, 0.12],
  ['shadow_master', 6, 260, 55, 42, 0.13],
  ['shadow_master', 20, 400, 97, 70, 0.158]
] as const;
it.each(cases)('preserves %s rank%i literal body and existing preview', (id, rank, life, attack, defense, dodge) => {
  const row = rows.find(row => row.id === 'skills-assassin-' + id.replace(/_/g, '-'));
  if (!validate(row)) throw new Error('Missing valid real shadow skill');
  const expected = getSummonStats(id, { skillLevel: rank, statScaling: row.scaling.summonStatsPerLevel });
  const next = scaleSummonStats(required(getAssassinSummonStats(id)), row.scaling.summonStatsPerLevel, rank);
  expect(next).toEqual(expected);
  const mana = id === 'shadow_warrior' ? 100 : 150;
  expect(next).toMatchObject({ life, lifeMax: life, attack, defense, magicDodge: dodge, mana, manaMax: mana });
  const display = Object.fromEntries(computeSkillRankDisplayStats(row, rank).summonUnit?.stats.map(stat => [stat.id, stat.value]) ?? []);
  expect(display).toMatchObject({ lifeMax: life, attack, defense });
});
it.each(templates)('returns fresh complete %s stats without retaining mutable references', id => {
  const first = required(getAssassinSummonStats(id)), before = structuredClone(first);
  Reflect.set(first, 'attack', 9999); Reflect.set(first.resistances, 'physical', 99);
  expect(getAssassinSummonStats(id)).toEqual(before);
  expect(getAssassinSummonStats(id)?.resistances).not.toBe(first.resistances);
});
it('deeply copies/freezes both templates without freezing or retaining caller data', () => {
  const input = structuredClone(authored), before = structuredClone(input), out = resolveAssassinSummonDefinition(input);
  expect(out).toEqual(before); expect(Object.isFrozen(out)).toBe(true); expect(Object.isFrozen(out.templates)).toBe(true);
  for (const id of templates) {
    expect(Object.isFrozen(out.templates[id])).toBe(true); expect(Object.isFrozen(out.templates[id].resistances)).toBe(true);
    expect(Object.isFrozen(input.templates[id])).toBe(false); expect(Object.isFrozen(input.templates[id].resistances)).toBe(false);
    input.templates[id].lifeMax += 1; input.templates[id].resistances.physical += 1;
  }
  expect(out).toEqual(before); expect(resolveAssassinSummonDefinition(input)).toEqual(input);
});
it.each(templates)('requires every authored %s stat and resistance without fallback', id => {
  for (const field of Object.keys(authored.templates[id])) {
    const input = structuredClone(authored); Reflect.deleteProperty(input.templates[id], field);
    expect(() => resolveAssassinSummonDefinition(input)).toThrow('Invalid authored Assassin');
  }
  for (const field of Object.keys(authored.templates[id].resistances)) {
    const input = structuredClone(authored); Reflect.deleteProperty(input.templates[id].resistances, field);
    expect(() => resolveAssassinSummonDefinition(input)).toThrow('Invalid authored Assassin');
  }
});
it.each(templates)('rejects malformed, nonfinite and out-of-range %s tuning', id => {
  for (const patch of [
    { lifeMax: 0 }, { lifeMax: -1 }, { lifeMax: 1.5 }, { manaMax: -1 }, { attack: -1 }, { defense: NaN },
    { attackSpeed: Infinity }, { critChance: 1.01 }, { critDamage: 0.5 }, { physDodge: -0.01 }, { magicDodge: 2 },
    { magicFind: -1 }, { goldFind: -1 }, { extra: 1 }, { resistances: {} },
    { resistances: { ...authored.templates[id].resistances, arcane: 101 } },
    { resistances: { ...authored.templates[id].resistances, cold: -101 } },
    { resistances: { ...authored.templates[id].resistances, lightning: NaN } }
  ]) {
    const input = structuredClone(authored); Object.assign(input.templates[id], patch);
    expect(() => resolveAssassinSummonDefinition(input)).toThrow('Invalid authored Assassin');
  }
});
it('requires exact complete owner/template membership and rejects unknown properties', () => {
  for (const input of [null, [], {}, { ...authored, id: 'summons/amazon' }, { ...authored, extra: true },
    { ...authored, templates: {} }, { ...authored, templates: { shadow_warrior: authored.templates.shadow_warrior } },
    { ...authored, templates: { shadow_master: authored.templates.shadow_master } },
    { ...authored, templates: { ...authored.templates, valkyrie: authored.templates.shadow_warrior } }])
    expect(() => resolveAssassinSummonDefinition(input)).toThrow('Invalid authored Assassin');
  for (const id of ['valkyrie', 'skeleton', 'raven', '__proto__', 'constructor', '', 'shadow-warrior'])
    expect(getAssassinSummonStats(id)).toBeUndefined();
});
