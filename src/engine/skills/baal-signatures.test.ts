import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { BAAL_SIGNATURES, resolveBaalSignatures } from './baal-signatures';

const specs = [
  { id: 'monster-baal-frost-nova', canonical: 'monster.baal_frost_nova', type: 'cold' },
  { id: 'monster-baal-inferno', canonical: 'monster.baal_inferno', type: 'fire' },
  { id: 'monster-baal-mana-rift', canonical: 'monster.baal_mana_rift', type: 'arcane' }
] as const;
function source(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const row = input.find(value => value.id === id);
  if (!row) throw new Error('Missing fixture');
  return row;
}

describe.each(specs)('authored $id', spec => {
  it('copies and deeply freezes native tuning without freezing or aliasing source data', () => {
    const input = structuredClone(rows), before = structuredClone(input), skills = resolveBaalSignatures(input);
    expect(skills).toEqual(BAAL_SIGNATURES);
    expect(input).toEqual(before);
    const skill = skills.find(row => row.id === spec.canonical);
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing native spell');
    const effect = skill.effects[0], saved = structuredClone(skill);
    for (const value of [skills, skill, skill.effects, effect, effect.base,
      ...(effect.perMonsterLevel ? [effect.perMonsterLevel] : []),
      ...(effect.applyStatuses ? [effect.applyStatuses, ...effect.applyStatuses] : [effect.applyStatus])]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
    Object.assign(source(input, spec.id), { damage: { min: 999, max: 999 },
      statusEffect: { durationMs: 99 }, scaling: { monsterLevelDamageGrowth: [999, 999] } });
    expect(skill).toEqual(saved);
    expect(Object.isFrozen(source(input, spec.id))).toBe(false);
  });

  it('rejects missing/duplicate identities and incompatible targeting, resource or hidden effects', () => {
    expect(() => resolveBaalSignatures(rows.filter(row => row.id !== spec.id))).toThrow();
    expect(() => resolveBaalSignatures([...rows, source(rows, spec.id)])).toThrow();
    for (const patch of [{ target: 'single-enemy' }, { trigger: 'passive' }, { cooldown: 1 },
      { minLevel: 2 }, { maxLevel: 20 }, { cost: { mana: 1 } }, { heal: { pctOfMaxLife: .5 } },
      { projectileFlightMs: 100 }, { extra: true }, { appliesStatus: ['stun'] }, { statusEffect: undefined },
      ...(spec.type === 'fire' ? [{ maxTargets: 6 }, { aoeShape: 'cone-2' }] : [{ maxTargets: 5 }])]) {
      const input = structuredClone(rows); Object.assign(source(input, spec.id), patch);
      expect(() => resolveBaalSignatures(input), JSON.stringify(patch)).toThrow();
    }
  });

  it('rejects malformed, nonfinite, reversed or mixed tuning', () => {
    for (const damage of [undefined, { min: 3, max: 2, breakdown: { [spec.type]: 2 } },
      { min: -1, max: 2, breakdown: { [spec.type]: 2 } },
      { min: 1, max: Infinity, breakdown: { [spec.type]: Infinity } },
      { min: 1, max: 2, breakdown: { [spec.type]: 3 } },
      { min: 1, max: 2, breakdown: { [spec.type]: 2, physical: 1 } }]) {
      const input = structuredClone(rows); source(input, spec.id).damage = damage;
      expect(() => resolveBaalSignatures(input)).toThrow();
    }
    for (const patch of [{ chance: .5 }, { stacksOnApply: spec.type === 'fire' ? 1 : 5 },
      { durationMs: 0 }, { durationMs: Infinity }, { unknown: 1 }]) {
      const input = structuredClone(rows), row = source(input, spec.id);
      row.statusEffect = { ...row.statusEffect as object, ...patch };
      expect(() => resolveBaalSignatures(input)).toThrow();
    }
    const input = structuredClone(rows);
    source(input, spec.id).scaling = { monsterLevelDamageGrowth: [3, 2] };
    expect(() => resolveBaalSignatures(input)).toThrow();
  });

  it('reads supported damage, growth and status tuning from JSON', () => {
    const input = structuredClone(rows), row = source(input, spec.id);
    row.damage = { min: 1, max: 2, breakdown: { [spec.type]: 2 } };
    if (spec.type === 'cold') row.scaling = { monsterLevelDamageGrowth: [3, 4] };
    if (spec.type !== 'arcane') row.statusEffect = { ...row.statusEffect as object, durationMs: 1500,
      ...(spec.type === 'fire' ? { dotPctOfDamage: .2 } : {}) };
    const effect = resolveBaalSignatures(input).find(value => value.id === spec.canonical)?.effects[0];
    expect(effect).toMatchObject({ kind: 'damage', damageType: spec.type, base: [1, 2] });
    if (effect?.kind !== 'damage') throw new Error('Missing native damage');
    if (spec.type === 'cold') expect(effect.perMonsterLevel).toEqual([3, 4]);
    expect(effect.applyStatuses?.[0] ?? effect.applyStatus).toEqual({
      id: spec.type === 'cold' ? 'freeze' : spec.type === 'fire' ? 'ignite' : 'mana-burn',
      ...row.statusEffect as object
    });
    if (spec.type === 'fire') expect(effect.applyStatuses?.[1]).toEqual({ id: 'armor-melt' });
  });
});
