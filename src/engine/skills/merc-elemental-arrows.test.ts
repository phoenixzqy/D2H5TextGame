import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { MERC_ELEMENTAL_ARROWS, resolveMercElementalArrows } from './merc-elemental-arrows';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, registerSkill, resetRegistry } from './registry';
import { createSkillValidator } from './skill-validator';

const fixtures = () => structuredClone(rows.filter(row => ['mskill-fire-arrow', 'mskill-cold-arrow'].includes(row.id)));
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('copies exact authored component fractions, Attack, costs, statuses and splash independently', () => {
  const source = fixtures(), before = structuredClone(source), out = resolveMercElementalArrows(source);
  expect(out).toEqual(MERC_ELEMENTAL_ARROWS);
  expect(source).toEqual(before);
  for (const [index, skill] of out.entries()) {
    const fire = index === 0;
    expect(skill).toMatchObject({ trigger: 'active', target: 'single-enemy', cooldown: 2, manaCost: 0, minLevel: 1 });
    expect(skill.effects[0]).toEqual({ kind: 'damage', damageType: 'physical', base: [22, 36],
      attackDamagePct: 100, components: [{ damageType: 'physical', weight: fire ? 1 : .5 },
        { damageType: fire ? 'fire' : 'cold', weight: .5 }],
      mercElementalArrow: fire ? { splash: { count: 2, share: .5 } } : {},
      applyStatus: fire ? { id: 'burn', damageType: 'fire', durationMs: 3000, dotPctOfDamage: .1 }
        : { id: 'chill', damageType: 'cold', durationMs: 2000, chance: .3 },
      tags: ['physical', fire ? 'fire' : 'cold', fire ? 'burn' : 'chill'] });
    const frozen = (value: unknown): void => {
      if (value !== null && typeof value === 'object') {
        expect(Object.isFrozen(value)).toBe(true);
        Object.values(value).forEach(frozen);
      }
    };
    frozen(skill);
  }
  const first = source[0];
  if (!first?.damage) throw new Error('Missing fixture');
  first.damage.min = 99;
  expect(out).toEqual(MERC_ELEMENTAL_ARROWS);
});

it('rejects missing/duplicated exact rows while ignoring unrelated values', () => {
  const [fire, cold] = fixtures();
  for (const source of [[], [fire], [cold], [fire, fire, cold], [fire, cold, cold]])
    expect(() => resolveMercElementalArrows(source)).toThrow(/exactly one/);
  expect(resolveMercElementalArrows([null, 42, { id: 'unrelated' }, fire, cold])).toEqual(MERC_ELEMENTAL_ARROWS);
});

it.each([
  { attackDamagePct: undefined }, { attackDamagePct: -1 }, { attackDamagePct: NaN },
  { attackDamagePct: Infinity }, { cost: {} }, { cost: { mana: 1 } }, { cooldown: 1 },
  { trigger: 'passive' }, { damageType: 'fire' }, { target: 'all-enemies' },
  { scaling: { damagePerLevel: 1 } }, { mercElementalArrow: {} },
  ...[0, 3, 1.5, NaN, Infinity].map(count => ({ mercElementalArrow: { splash: { count, share: .5 } } })),
  ...[0, -1, 2, NaN, Infinity].map(share => ({ mercElementalArrow: { splash: { count: 2, share } } })),
  { mercElementalArrow: { splash: { count: 2, share: .5, typo: 1 } } },
  { damage: { min: 40, max: 1, breakdown: { physical: 1, fire: .5 } } },
  { damage: { min: 1.5, max: 2, breakdown: { physical: 1, fire: .5 } } },
  { damage: { min: 22, max: 36, breakdown: { physical: 2, fire: 1 } } },
  { statusEffect: { durationMs: 3000, dotPctOfDamage: .2 } }, { typo: true }
])('rejects unsupported Fire metadata %j', patch => {
  const [fire, cold] = fixtures();
  expect(() => resolveMercElementalArrows([{ ...fire, ...patch }, cold])).toThrow();
});

it('rejects Cold splash or altered Cold status policy', () => {
  const [fire, cold] = fixtures();
  for (const patch of [{ mercElementalArrow: { splash: { count: 1, share: .5 } } },
    { statusEffect: { chance: 1, durationMs: 2000 } },
    { damage: { min: 22, max: 36, breakdown: { physical: 1, cold: 1 } } }])
    expect(() => resolveMercElementalArrows([fire, { ...cold, ...patch }])).toThrow();
});

it('rejects elemental-arrow metadata on every unrelated mercenary row', () => {
  const validate = createSkillValidator<unknown>();
  for (const row of rows.filter(row => !['mskill-fire-arrow', 'mskill-cold-arrow'].includes(row.id))) {
    expect(validate({ ...row, mercElementalArrow: {} }), row.id).toBe(false);
    expect(validate({ ...row, mercElementalArrow: { splash: { count: 2, share: .5 } } }), row.id).toBe(false);
  }
  for (const row of rows) expect(validate(row), row.id).toBe(true);
});

it('restores exact native definitions and ranged authority on every default load', () => {
  for (let i = 0; i < 3; i++) {
    for (const skill of MERC_ELEMENTAL_ARROWS) registerSkill({ ...skill, effects: [] });
    loadDefaultSkills();
    for (const skill of MERC_ELEMENTAL_ARROWS) {
      expect(getSkill(skill.id)).toBe(skill);
      expect(getSkillDamageDelivery(skill)).toBe('ranged');
      registerSkill({ ...skill });
      expect(getSkillDamageDelivery(skill)).toBeUndefined();
    }
  }
});
