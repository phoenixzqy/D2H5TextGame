import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_DOT_SKILLS, resolveMonsterDotSkills } from './monster-dot';

const ids = ['fire-bolt', 'fire-ball', 'fire-arrow', 'inferno', 'poison-cloud', 'mephisto-poison-cloud', 'poison-dagger', 'plague-spit'];
const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = input.find(value => value.id === 'monster-' + id);
  if (!found) throw new Error('Missing fixture');
  return found;
}
describe.each(ids)('authored monster %s payload', id => {
  it('copies and deeply freezes native tuning without mutating or freezing source JSON', () => {
    const input = fixture(), before = structuredClone(input), resolved = resolveMonsterDotSkills(input);
    const skill = resolved.find(value => value.id === 'monster.' + id.replaceAll('-', '_'));
    expect(resolved).toEqual(MONSTER_DOT_SKILLS);
    expect(input).toEqual(before);
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing resolved damage');
    const effect = skill.effects[0], saved = structuredClone(effect);
    for (const value of [resolved, skill, skill.effects, effect, effect.base, effect.applyStatus])
      expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(input)).toBe(false);
    row(input, id).damage = { min: 1, max: 1, breakdown: { fire: 1 } };
    row(input, id).statusEffect = { dotPctOfDamage: .9, durationMs: 99 };
    expect(effect).toEqual(saved);
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
  });
  it('rejects missing and duplicate authored leaves', () => {
    const input = fixture();
    expect(() => resolveMonsterDotSkills(input.filter(value => value.id !== 'monster-' + id))).toThrow();
    expect(() => resolveMonsterDotSkills([...input, row(input, id)])).toThrow();
  });
  it('rejects absent, zero, nonfinite or unsupported DoT metadata', () => {
    const stacksOnApply = id === 'mephisto-poison-cloud' ? 3 : 1;
    for (const change of [
      { statusEffect: undefined }, { statusEffect: {} },
      ...[0, -1, 1.1, NaN, Infinity].map(dotPctOfDamage => ({ statusEffect: { chance: 1, stacksOnApply, dotPctOfDamage, durationMs: 3000 } })),
      ...[0, -1, NaN, Infinity, 60001].map(durationMs => ({ statusEffect: { chance: 1, stacksOnApply, dotPctOfDamage: .1, durationMs } })),
      ...[0, 2, 4, NaN, Infinity, null, '3', stacksOnApply === 3 ? 1 : 3].map(invalid =>
        ({ statusEffect: { chance: 1, stacksOnApply: invalid, dotPctOfDamage: .1, durationMs: 3000 } })),
      { statusEffect: { chance: .5, stacksOnApply, dotPctOfDamage: .1, durationMs: 3000 } },
      { appliesStatus: [] }, { appliesStatus: ['poison', 'ignite'] }, { appliesStatus: ['bleed'] },
      { additionalStatusEffects: [] }, { scaling: { damagePerLevel: 1 } }, { attackDamagePct: 100 },
      { hitSequence: { count: 2 } }, { trigger: 'passive' }, { target: 'self' },
      { maxLevel: 20 }, { minLevel: 2 }, { cost: { mana: 1 } }, { cost: undefined }, { cooldown: 0 }
    ]) {
      const input = fixture(); Object.assign(row(input, id), change);
      expect(() => resolveMonsterDotSkills(input)).toThrow();
    }
  });
  it('rejects malformed, mismatched and inverted elemental direct ranges', () => {
    const type = id.includes('poison') || id === 'plague-spit' ? 'poison' : 'fire';
    for (const damage of [
      { min: 5, max: 2, breakdown: { [type]: 2 } },
      { min: -1, max: 2, breakdown: { [type]: 2 } },
      { min: 1.5, max: 2, breakdown: { [type]: 2 } },
      { min: 1, max: 2, breakdown: { [type]: 3 } },
      { min: 1, max: Infinity, breakdown: { [type]: Infinity } },
      { min: 1, max: 2, breakdown: { physical: 2 } },
      { min: 1, max: 2, breakdown: { fire: 2, poison: 2 } }
    ]) {
      const input = fixture(); row(input, id).damage = damage;
      expect(() => resolveMonsterDotSkills(input)).toThrow();
    }
  });
});

it('derives permitted numeric tuning from authored data without duplicated engine coefficients', () => {
  const input = fixture(), changed = row(input, 'fire-bolt');
  changed.damage = { min: 10, max: 20, breakdown: { fire: 20 } };
  changed.statusEffect = { chance: 1, stacksOnApply: 1, dotPctOfDamage: .2, durationMs: 4500 };
  const skill = resolveMonsterDotSkills(input).find(value => value.id === 'monster.fire_bolt');
  expect(skill?.effects[0]).toEqual({ kind: 'damage', damageType: 'fire', base: [10, 20],
    projectileFlightMs: 500, applyStatus: { id: 'ignite', chance: 1, stacksOnApply: 1,
      dotPctOfDamage: .2, durationMs: 4500 } });
});
