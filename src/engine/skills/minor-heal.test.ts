import { describe, expect, it } from 'vitest';
import mercenarySkills from '../../data/skills/mercenary.json';
import { MINOR_HEAL_SKILL, resolveMinorHealSkill } from './minor-heal';

describe('P08a03a authored Minor Heal definition', () => {
  const productionId = 'mskill-minor-heal';
  const fixture = () => ({
    id: productionId, trigger: 'active', target: 'single-ally', cooldown: 4, minLevel: 1,
    heal: { min: 30, max: 50, target: 'ally' }
  });

  it('maps the actual JSON to the exact immutable ranged-heal definition', () => {
    const before = structuredClone(mercenarySkills);
    expect(MINOR_HEAL_SKILL).toEqual({
      id: productionId, archetype: 'mercenary', target: 'single-ally',
      cooldown: 4, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'heal', amountRange: [30, 50], target: 'ally' }]
    });
    expect(resolveMinorHealSkill(mercenarySkills)).toEqual(MINOR_HEAL_SKILL);
    expect(mercenarySkills).toEqual(before);
    const effect = MINOR_HEAL_SKILL.effects[0];
    expect(effect?.kind).toBe('heal');
    if (effect?.kind !== 'heal') throw new Error('Expected actual ranged heal');
    for (const value of [MINOR_HEAL_SKILL, MINOR_HEAL_SKILL.effects, effect, effect.amountRange]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
  });

  it('copies and freezes each result independently without freezing or retaining caller data', () => {
    const row = fixture();
    const before = structuredClone(row);
    const first = resolveMinorHealSkill([row]);
    const second = resolveMinorHealSkill([row]);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.effects).not.toBe(second.effects);
    expect(first.effects[0]).not.toBe(second.effects[0]);
    const effect = first.effects[0];
    const other = second.effects[0];
    if (effect?.kind !== 'heal' || other?.kind !== 'heal') throw new Error('Expected ranged heals');
    expect(effect.amountRange).not.toBe(other.amountRange);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.heal)).toBe(false);
    row.heal.min = 1;
    row.cooldown = 99;
    expect(effect.amountRange).toEqual([30, 50]);
    expect(first.cooldown).toBe(4);
    expect(Reflect.set(first, 'cooldown', 99)).toBe(false);
    expect(Reflect.set(first.effects, '0', {})).toBe(false);
    expect(Reflect.set(effect, 'target', 'self')).toBe(false);
    expect(Reflect.set(effect.amountRange ?? {}, '0', 999)).toBe(false);
    expect(second).toEqual(MINOR_HEAL_SKILL);
  });

  it.each([undefined, 0, 7])('maps authored cooldown/minimum level and optional mana cost %s', (mana) => {
    const row = { ...fixture(), cooldown: 9, minLevel: 6,
      ...(mana !== undefined ? { cost: { mana } } : {}) };
    expect(resolveMinorHealSkill([row])).toMatchObject({ cooldown: 9, minLevel: 6, manaCost: mana ?? 0 });
  });

  it.each([[0, 0], [0, 5], [7, 7]])('preserves valid integer range [%s, %s]', (min, max) => {
    expect(resolveMinorHealSkill([{ ...fixture(), heal: { min, max, target: 'ally' } }]).effects)
      .toEqual([{ kind: 'heal', amountRange: [min, max], target: 'ally' }]);
  });

  it('requires exactly one exact production row without introducing another identity', () => {
    const row = fixture();
    for (const rows of [[], [{ ...row, id: 'mskill.minor_heal' }], [row, row]]) {
      expect(() => resolveMinorHealSkill(rows)).toThrow(/exactly one/);
    }
    expect(resolveMinorHealSkill([{ ...row, id: 'mskill-prayer' }, row])).toEqual(MINOR_HEAL_SKILL);
  });

  it.each([
    { trigger: 'passive' }, { trigger: 'aura' }, { target: 'self' }, { target: 'all-allies' },
    { heal: { min: 30, max: 50, target: 'self' } }
  ])('rejects unsupported authored trigger/target scope %j', (overrides) => {
    expect(() => resolveMinorHealSkill([{ ...fixture(), ...overrides }])).toThrow(/active.*single-ally.*ally/);
  });

  it.each([
    {}, { heal: { max: 50, target: 'ally' } }, { heal: { min: 30, target: 'ally' } }
  ])('rejects missing authored heal bounds %j', (overrides) => {
    const row = { id: productionId, trigger: 'active', target: 'single-ally', cooldown: 4, minLevel: 1 };
    expect(() => resolveMinorHealSkill([{ ...row, ...overrides }])).toThrow(/range/);
  });

  it.each(['min', 'max'] as const)('rejects negative/fractional/nonfinite %s', (field) => {
    for (const invalid of [-1, 0.5, Infinity, -Infinity, NaN]) {
      expect(() => resolveMinorHealSkill([
        { ...fixture(), heal: { min: 30, max: 50, target: 'ally', [field]: invalid } }
      ])).toThrow(/range/);
    }
  });

  it('rejects a reversed authored range', () => {
    expect(() => resolveMinorHealSkill([
      { ...fixture(), heal: { min: 51, max: 50, target: 'ally' } }
    ])).toThrow(/range/);
  });
});
