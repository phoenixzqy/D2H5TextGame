import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_HEAL_LIGHTNING_SKILLS, resolveMonsterHealLightningSkills } from './monster-heal-lightning';

const ids = ['heal', 'lightning-bolt', 'thunder-storm', 'lightning'];
const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = input.find(value => value.id === 'monster-' + id);
  if (!found) throw new Error('Missing fixture');
  return found;
}
describe.each(ids)('authored monster %s source', id => {
  it('copies and freezes owned tuning without mutating/freezing source JSON', () => {
    const input = fixture(), before = structuredClone(input), skills = resolveMonsterHealLightningSkills(input);
    expect(skills).toEqual(MONSTER_HEAL_LIGHTNING_SKILLS);
    expect(input).toEqual(before);
    const skill = skills.find(value => value.id === 'monster.' + id.replaceAll('-', '_'));
    if (!skill) throw new Error('Missing native skill');
    const saved = structuredClone(skill), effect = skill.effects[0];
    expect(Object.isFrozen(skills)).toBe(true);
    for (const value of [skill, skill.effects, effect]) expect(Object.isFrozen(value)).toBe(true);
    if (effect?.kind === 'damage') {
      expect(Object.isFrozen(effect.base)).toBe(true); expect(Object.isFrozen(effect.applyStatus)).toBe(true);
      expect(Reflect.set(effect.base, '0', 999)).toBe(false);
    }
    Object.assign(row(input, id), { heal: { pctOfMaxLife: .9, target: 'ally' }, damage: { min: 999, max: 999 }, statusEffect: { durationMs: 99 } });
    expect(skill).toEqual(saved); expect(Object.isFrozen(input)).toBe(false);
  });
  it('rejects missing and duplicate source rows', () => {
    const input = fixture();
    expect(() => resolveMonsterHealLightningSkills(input.filter(value => value.id !== 'monster-' + id))).toThrow();
    expect(() => resolveMonsterHealLightningSkills([...input, row(input, id)])).toThrow();
  });
  it('rejects unsupported trigger, ranks, mana, delivery and extra payloads', () => {
    for (const change of [
      { trigger: 'passive' }, { target: 'single-ally' }, { minLevel: 2 }, { maxLevel: 20 },
      { cost: undefined }, { cost: { mana: 1 } }, { cooldown: 0 }, { cooldown: NaN },
      { additionalStatusEffects: [] }, { scaling: { damagePerLevel: 1 } },
      { attackDamagePct: 100 }, { hitSequence: { count: 2 } },
      ...(id === 'heal' ? [{ damage: { min: 1, max: 1, breakdown: { physical: 1 } } }, { statusEffect: {} }, { projectileFlightMs: 500 }]
        : [{ heal: { pctOfMaxLife: .3, target: 'self' } }, { damageType: 'fire' }, { appliesStatus: ['stun'] }, { appliesStatus: ['paralyze', 'stun'] }, { statusEffect: undefined }])
    ]) {
      const input = fixture(); Object.assign(row(input, id), change);
      expect(() => resolveMonsterHealLightningSkills(input)).toThrow();
    }
  });
});
it('rejects malformed, zero, nonfinite, flat or ally Heal payloads', () => {
  for (const heal of [undefined, {}, { min: 30, max: 30, target: 'self' },
    ...[0, -1, 1.1, NaN, Infinity].map(pctOfMaxLife => ({ pctOfMaxLife, target: 'self' })),
    { pctOfMaxLife: .3, target: 'ally' }, { pctOfMaxLife: .3, target: 'self', min: 30 }]) {
    const input = fixture(); row(input, 'heal').heal = heal;
    expect(() => resolveMonsterHealLightningSkills(input)).toThrow();
  }
});
it.each(ids.slice(1))('rejects invalid %s status, range and projectile payloads', id => {
  for (const change of [
    ...[0, -1, NaN, Infinity, 60001].map(durationMs => ({ statusEffect: { chance: 1, stacksOnApply: 1, durationMs } })),
    { statusEffect: { chance: .5, stacksOnApply: 1, durationMs: 1000 } },
    { statusEffect: { chance: 1, stacksOnApply: 2, durationMs: 1000 } },
    { statusEffect: { chance: 1, stacksOnApply: 1, durationMs: 1000, dotPctOfDamage: .1 } },
    ...[
      { min: 3, max: 2, breakdown: { lightning: 2 } },
      { min: 1.5, max: 2, breakdown: { lightning: 2 } },
      { min: 1, max: Infinity, breakdown: { lightning: Infinity } },
      { min: -1, max: 2, breakdown: { lightning: 2 } },
      { min: 1, max: 2, breakdown: { lightning: 3 } },
      { min: 1, max: 2, breakdown: { fire: 2 } },
      { min: 1, max: 2, breakdown: { lightning: 2, fire: 2 } }
    ].map(damage => ({ damage })),
    { projectileFlightMs: id === 'lightning-bolt' ? undefined : 500 }
  ]) {
    const input = fixture(); Object.assign(row(input, id), change);
    expect(() => resolveMonsterHealLightningSkills(input)).toThrow();
  }
});
it('derives permitted numeric Heal and lightning tuning from data', () => {
  const input = fixture(); row(input, 'heal').heal = { pctOfMaxLife: .25, target: 'self' };
  Object.assign(row(input, 'lightning-bolt'), { damage: { min: 1, max: 2, breakdown: { lightning: 2 } },
    statusEffect: { chance: 1, stacksOnApply: 1, durationMs: 1200 } });
  const output = resolveMonsterHealLightningSkills(input);
  expect(output[0]?.effects).toEqual([{ kind: 'heal', target: 'self', pctOfMaxLife: .25 }]);
  expect(output[1]?.effects).toEqual([{ kind: 'damage', damageType: 'lightning', base: [1, 2],
    projectileFlightMs: 500, applyStatus: { id: 'paralyze', chance: 1, stacksOnApply: 1, durationMs: 1200 } }]);
});
