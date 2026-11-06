import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { DIABLO_SIGNATURES, resolveDiabloSignatures } from './diablo-signatures';

const specs = [
  { id: 'monster-diablo-fire-breath', canonical: 'monster.diablo_fire_breath', type: 'fire', status: 'ignite', stacks: 3 },
  { id: 'monster-diablo-lightning', canonical: 'monster.diablo_lightning', type: 'lightning', status: 'paralyze', stacks: 1 }
] as const;
function source(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const row = input.find(value => value.id === id);
  if (!row) throw new Error('Missing fixture');
  return row;
}

describe.each(specs)('authored $id', spec => {
  it('copies and deeply freezes native tuning while leaving source data mutable', () => {
    const input = structuredClone(rows), before = structuredClone(input), skills = resolveDiabloSignatures(input);
    expect(skills).toEqual(DIABLO_SIGNATURES);
    expect(input).toEqual(before);
    const skill = skills.find(row => row.id === spec.canonical);
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing native cone');
    const effect = skill.effects[0], saved = structuredClone(skill);
    for (const value of [skills, skill, skill.effects, effect, effect.base, effect.applyStatus]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
    Object.assign(source(input, spec.id), { damage: { min: 999, max: 999 }, statusEffect: { durationMs: 99 } });
    expect(skill).toEqual(saved);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(source(input, spec.id))).toBe(false);
  });

  it('rejects missing and duplicate authored identities', () => {
    expect(() => resolveDiabloSignatures(rows.filter(row => row.id !== spec.id))).toThrow();
    expect(() => resolveDiabloSignatures([...rows, source(rows, spec.id)])).toThrow();
  });

  it('rejects incompatible rank, geometry, cooldown, resource and hidden payloads', () => {
    for (const patch of [
      { trigger: 'passive' }, { minLevel: 2 }, { maxLevel: 20 }, { target: 'all-enemies' },
      { aoeShape: undefined }, { aoeShape: 'cone-2' }, { maxTargets: undefined }, { maxTargets: 6 },
      { cooldown: 2 }, { cooldown: NaN }, { cost: undefined }, { cost: { mana: 1 } },
      { attackDamagePct: 100 }, { heal: { pctOfMaxLife: .5 } }, { scaling: { damagePerLevel: 1 } },
      { projectileFlightMs: 500 }, { extra: true }, { appliesStatus: ['stun'] }, { statusEffect: undefined }
    ]) {
      const input = structuredClone(rows); Object.assign(source(input, spec.id), patch);
      expect(() => resolveDiabloSignatures(input), JSON.stringify(patch)).toThrow();
    }
  });

  it('rejects malformed, nonfinite, reversed or mixed damage and status payloads', () => {
    for (const damage of [
      undefined, { min: 3, max: 2, breakdown: { [spec.type]: 2 } },
      { min: 1.5, max: 2, breakdown: { [spec.type]: 2 } },
      { min: 1, max: Infinity, breakdown: { [spec.type]: Infinity } },
      { min: -1, max: 2, breakdown: { [spec.type]: 2 } },
      { min: 1, max: 2, breakdown: { [spec.type]: 3 } },
      { min: 1, max: 2, breakdown: { [spec.type]: 2, cold: 2 } }
    ]) {
      const input = structuredClone(rows); source(input, spec.id).damage = damage;
      expect(() => resolveDiabloSignatures(input)).toThrow();
    }
    for (const patch of [{ chance: .5 }, { stacksOnApply: spec.stacks === 3 ? 1 : 3 },
      { durationMs: 0 }, { durationMs: Infinity }, { durationMs: 60001 }, { unknown: 1 },
      { dotPctOfDamage: spec.type === 'fire' ? 0 : .1 }]) {
      const input = structuredClone(rows), row = source(input, spec.id);
      Object.assign(row, { statusEffect: { ...row.statusEffect as object, ...patch } });
      expect(() => resolveDiabloSignatures(input)).toThrow();
    }
  });

  it('reads permitted damage and status tuning from JSON instead of hardcoding it', () => {
    const input = structuredClone(rows), row = source(input, spec.id);
    row.damage = { min: 1, max: 2, breakdown: { [spec.type]: 2 } };
    row.statusEffect = { chance: 1, stacksOnApply: spec.stacks, durationMs: 1500,
      ...(spec.type === 'fire' ? { dotPctOfDamage: .2 } : {}) };
    const skill = resolveDiabloSignatures(input).find(value => value.id === spec.canonical);
    expect(skill?.effects).toEqual([{ kind: 'damage', damageType: spec.type, base: [1, 2],
      applyStatus: { id: spec.status, ...row.statusEffect as object } }]);
  });
});
