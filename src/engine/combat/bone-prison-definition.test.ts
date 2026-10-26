import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createSkillValidator } from '../skills/skill-validator';
import { BONE_PRISON_DEFINITION, isBonePrisonDefinition, resolveBonePrisonDefinition } from './bone-prison-definition';

const row = rows.find(r => r.id === 'skills-necromancer-bone-prison');
if (!row) throw new Error('Missing authored Bone Prison');
const validate = createSkillValidator();
it('authors finite nondamaging Prison timing without altering its unlock, rank, target or price', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(row).toMatchObject({ requiredLevel: 24, prerequisites: ['skills-necromancer-bone-wall'],
    trigger: 'active', target: 'all-enemies', maxLevel: 20, cooldown: 4, cost: { mana: 27 },
    scaling: { cooldownPerLevel: -.05, costPerLevel: -.2 }, appliesStatus: ['bone-prison'],
    statusEffect: { durationMs: 2000, bossDurationMultiplier: .5 } });
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 2000 } },
  ...[0, -1, .5, NaN, Infinity].map(durationMs => ({ statusEffect: { durationMs, bossDurationMultiplier: .5 } })),
  ...[0, -1, 1.1, NaN, Infinity].map(bossDurationMultiplier => ({ statusEffect: { durationMs: 2000, bossDurationMultiplier } })),
  { statusEffect: { durationMs: 2000, bossDurationMultiplier: .5, chance: .5 } },
  { trigger: 'passive' }, { target: 'self' }, { maxLevel: 21 }, { requiredLevel: 23 },
  { prerequisites: [] }, { cost: { mana: 0 } }, { cooldown: 0 }, { scaling: { cooldownPerLevel: -.1 } },
  { appliesStatus: ['stun'] }, { damage: { min: 1, max: 1 } }, { summon: true }, { summonId: 'skeleton' }
])('rejects incomplete or contradictory Prison contract %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false);
  expect(isBonePrisonDefinition(invalid)).toBe(false);
  expect(() => resolveBonePrisonDefinition([invalid])).toThrow();
});

it('copies immutable tuning, rejects duplicate/missing rows, and never freezes caller data', () => {
  expect(BONE_PRISON_DEFINITION).toEqual({ durationMs: 2000, bossDurationMultiplier: .5 });
  const source = structuredClone(rows), definition = resolveBonePrisonDefinition(source);
  const changed = source.find(r => r.id === row.id);
  if (!changed?.statusEffect) throw new Error('Missing copied Prison timing');
  changed.statusEffect.durationMs = 3000;
  expect(definition.durationMs).toBe(2000); expect(Object.isFrozen(definition)).toBe(true);
  expect(resolveBonePrisonDefinition(source).durationMs).toBe(3000);
  expect(() => resolveBonePrisonDefinition([])).toThrow();
  expect(() => resolveBonePrisonDefinition([row, row])).toThrow();
  expect(isBonePrisonDefinition({ ...row, id: 'monster.bone_prison' })).toBe(false);
});
