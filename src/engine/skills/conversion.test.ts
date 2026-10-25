import { expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import { composeConversionRank, CONVERSION_DEFINITION, matchesConversion, resolveConversionDefinition } from './conversion';
import { registeredSkillFromJson, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

const row = skills.find(s => s.id === 'skills-paladin-conversion');
if (!row) throw new Error('Missing Conversion');
const allocated = { 'paladin.sacrifice': 1, 'paladin.zeal': 1, 'paladin.vengeance': 1,
  'paladin.conversion': 1, 'skills-paladin-conversion': 20 };
it('copies and validates finite JSON tuning without retaining mutable source references', () => {
  const input = structuredClone(skills), before = structuredClone(input), d = resolveConversionDefinition(input);
  expect(d).toEqual({ requiredLevel: 24, maxRank: 20, durationMs: 8000, eligibleTiers: ['trash', 'rare-minion'] });
  expect(d).toEqual(CONVERSION_DEFINITION); expect(input).toEqual(before);
  expect(Object.isFrozen(d)).toBe(true); expect(Object.isFrozen(d.eligibleTiers)).toBe(true);
});
it.each([
  { conversion: undefined }, { conversion: { durationMs: 0, eligibleTiers: ['trash', 'rare-minion'] } },
  { conversion: { durationMs: 8000, eligibleTiers: ['boss'] } },
  { conversion: { durationMs: 8000, eligibleTiers: ['trash', 'rare-minion'], chance: 1 } },
  { cost: {} }, { cost: { mana: 0 } }, { cooldown: 0 },
  { appliesStatus: ['stun'] }, { target: 'all-enemies' }, { trigger: 'passive' },
  { prerequisites: [] }, { statusEffect: { chance: 1 } }, { damage: { min: 100, max: 1 } }
])('rejects malformed or contradictory source %j', patch => {
  expect(() => resolveConversionDefinition(skills.map(s => s.id === row.id ? { ...s, ...patch } : s))).toThrow();
});
it('rejects missing/duplicate identity and foreign conversion tuning', () => {
  expect(() => resolveConversionDefinition(skills.filter(s => s.id !== row.id))).toThrow();
  expect(() => resolveConversionDefinition([...skills, row])).toThrow();
  expect(createSkillValidator()({ ...row, id: 'skills-paladin-smite' })).toBe(false);
});
it('uses exact aliases by MAX once with all transitive prerequisites and class/unlock authority', () => {
  const p = { class: 'paladin' as const, level: 30, skillLevels: allocated };
  expect(composeConversionRank(p)).toBe(20);
  expect(composeConversionRank({ ...p, class: 'amazon' })).toBe(0);
  expect(composeConversionRank({ ...p, level: 23 })).toBe(0);
  for (const key of ['paladin.sacrifice', 'paladin.zeal', 'paladin.vengeance']) {
    const skillLevels = { ...allocated }; Reflect.deleteProperty(skillLevels, key);
    expect(composeConversionRank({ ...p, skillLevels })).toBe(0);
  }
  for (const rank of [0, -1, .5, NaN, Infinity, 21]) expect(composeConversionRank({ ...p,
    skillLevels: { ...allocated, 'paladin.conversion': rank, 'skills-paladin-conversion': rank } })).toBe(0);
});
it('requires the whole unchanged paid registration, refusing extra effect power', () => {
  const source = PLAYABLE_CLASS_SKILL_DATA.paladin.find(s => s.id === row.id);
  if (!source) throw new Error('Missing typed Conversion');
  const skill = registeredSkillFromJson(source);
  expect(matchesConversion(skill)).toBe(true);
  expect(matchesConversion({ ...skill, manaCost: 0 })).toBe(false);
  expect(matchesConversion({ ...skill, target: 'all-enemies' })).toBe(false);
  expect(matchesConversion({ ...skill, effects: [{ kind: 'damage', damageType: 'physical', base: [1000, 1000], conversion: true }] })).toBe(false);
});
