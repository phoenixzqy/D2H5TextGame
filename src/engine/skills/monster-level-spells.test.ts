import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { createSkillValidator } from './skill-validator';
import { MONSTER_LEVEL_SPELLS, resolveMonsterLevelSpells } from './monster-level-spells';

const ids = ['monster-frost-nova', 'monster-arcane-bolt'];
const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = input.find(value => value.id === id);
  if (!found) throw new Error('Missing fixture row');
  return found;
}
describe.each(ids)('%s JSON-owned level curve', id => {
  it('copies and deeply freezes native tuning without retaining caller-owned data', () => {
    const input = fixture(), before = structuredClone(input), skills = resolveMonsterLevelSpells(input);
    expect(skills).toEqual(MONSTER_LEVEL_SPELLS); expect(input).toEqual(before);
    expect(Object.isFrozen(skills)).toBe(true);
    const skill = skills.find(value => value.id === id.replace('monster-', 'monster.').replaceAll('-', '_'));
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing native effect');
    const effect = skill.effects[0], saved = structuredClone(skill);
    for (const value of [skill, skill.effects, effect, effect.base, effect.perMonsterLevel])
      expect(Object.isFrozen(value)).toBe(true);
    if (effect.applyStatus) expect(Object.isFrozen(effect.applyStatus)).toBe(true);
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
    Object.assign(row(input, id), { damage: { min: 999, max: 999 }, scaling: { monsterLevelDamageGrowth: [999, 999] } });
    expect(skill).toEqual(saved); expect(Object.isFrozen(input)).toBe(false);
  });
  it('rejects missing and duplicate authored rows', () => {
    const input = fixture();
    expect(() => resolveMonsterLevelSpells(input.filter(value => value.id !== id))).toThrow();
    expect(() => resolveMonsterLevelSpells([...input, row(input, id)])).toThrow();
  });
  it('refuses malformed, fractional, nonfinite, reversed or missing growth', () => {
    for (const growth of [undefined, [], [1], [1, 2, 3], [-1, 2], [1.5, 2], [1, Infinity], [NaN, 2], [3, 2]]) {
      const input = fixture(); row(input, id).scaling = { monsterLevelDamageGrowth: growth };
      expect(() => resolveMonsterLevelSpells(input)).toThrow();
    }
  });
  it('refuses invalid ranges and damage-type budgets', () => {
    const type = id === 'monster-frost-nova' ? 'cold' : 'arcane';
    for (const damage of [
      undefined, { min: 3, max: 2, breakdown: { [type]: 2 } },
      { min: -1, max: 2, breakdown: { [type]: 2 } }, { min: 1.5, max: 2, breakdown: { [type]: 2 } },
      { min: 1, max: Infinity, breakdown: { [type]: Infinity } },
      { min: 1, max: 2, breakdown: { [type]: 3 } }, { min: 1, max: 2, breakdown: { fire: 2 } },
      { min: 1, max: 2, breakdown: { [type]: 2, fire: 2 } }
    ]) {
      const input = fixture(); row(input, id).damage = damage;
      expect(() => resolveMonsterLevelSpells(input)).toThrow();
    }
  });
  it('refuses unsupported triggers, targets, rank/cost scaling or additional effects', () => {
    for (const change of [
      { trigger: 'passive' }, { target: 'single-ally' }, { minLevel: 2 }, { maxLevel: 20 },
      { cost: undefined }, { cost: { mana: 1 } }, { cooldown: 0 }, { cooldown: NaN },
      { attackDamagePct: 100 }, { statusEffect: { chance: 1 } },
      { scaling: { monsterLevelDamageGrowth: [1, 2], damagePerLevel: 99 } },
      { appliesTags: ['ignite'] }, { appliesStatus: ['poison'] },
      { projectileFlightMs: id === 'monster-frost-nova' ? 500 : undefined }
    ]) {
      const input = fixture(); Object.assign(row(input, id), change);
      expect(() => resolveMonsterLevelSpells(input)).toThrow();
    }
  });
  it('derives permitted numeric tuning from JSON instead of hardcoded runtime bases', () => {
    const input = fixture(), type = id === 'monster-frost-nova' ? 'cold' : 'arcane';
    Object.assign(row(input, id), { damage: { min: 2, max: 4, breakdown: { [type]: 4 } },
      scaling: { monsterLevelDamageGrowth: [3, 5] } });
    expect(resolveMonsterLevelSpells(input).find(value => value.id.endsWith(id.includes('nova') ? 'frost_nova' : 'arcane_bolt')))
      .toMatchObject({ effects: [{ base: [2, 4], perMonsterLevel: [3, 5] }] });
  });
});
it('keeps monster-level growth forbidden outside the explicit Lightning and Cold/Arcane spell leaves', () => {
  const validate = createSkillValidator();
  for (const source of rows) {
    if (ids.includes(source.id) || source.id === 'monster-act1-lightning-affix' || source.id === 'monster-baal-frost-nova') continue;
    expect(validate({ ...source, scaling: { monsterLevelDamageGrowth: [1, 2] } }), source.id).toBe(false);
  }
});
