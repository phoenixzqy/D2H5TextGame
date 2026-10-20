import { describe, expect, it } from 'vitest';
import necromancerSkills from '../../data/skills/necromancer.json';
import type { SkillStatusEffectMetadata } from '../types/skills';
import { AMPLIFY_DAMAGE_DEFINITION, resolveAmplifyDamageDefinition } from './amplify-damage-definition';

describe('authored Amplify Damage definition', () => {
  const skillId = 'skills-necromancer-amplify-damage';
  const fixture = (statusEffect?: SkillStatusEffectMetadata) => ({
    id: skillId, ...(statusEffect !== undefined ? { statusEffect } : {})
  });

  it('derives the frozen canonical family defaults from the actual production JSON', () => {
    const before = structuredClone(necromancerSkills);
    expect(AMPLIFY_DAMAGE_DEFINITION).toEqual({
      canonicalStatusId: 'amplify-damage', legacyStatusId: 'amplify',
      durationMs: 3000, physicalResistReductionPct: 50
    });
    expect(resolveAmplifyDamageDefinition(necromancerSkills)).toEqual(AMPLIFY_DAMAGE_DEFINITION);
    expect(Object.isFrozen(AMPLIFY_DAMAGE_DEFINITION)).toBe(true);
    expect(necromancerSkills).toEqual(before);
  });

  it('copies explicit zero defaults without mutating or retaining mutable source metadata', () => {
    const metadata = { durationMs: 0, physicalResistReductionPct: 0 };
    const source = [fixture(metadata)];
    const before = structuredClone(source);
    const definition = resolveAmplifyDamageDefinition(source);
    expect(definition).toMatchObject({ durationMs: 0, physicalResistReductionPct: 0 });
    expect(source).toEqual(before);
    expect(Object.isFrozen(source[0]?.statusEffect)).toBe(false);
    metadata.durationMs = 500;
    expect(definition.durationMs).toBe(0);
    expect(Reflect.set(definition, 'durationMs', 999)).toBe(false);
    expect(definition.durationMs).toBe(0);
  });

  it.each([undefined, {}, { durationMs: 3000 }, { physicalResistReductionPct: 50 }])(
    'rejects missing authored scalar defaults: %j', (metadata) => {
      expect(() => resolveAmplifyDamageDefinition([fixture(metadata)])).toThrow(/finite nonnegative/);
    }
  );

  it.each(['durationMs', 'physicalResistReductionPct'] as const)('rejects invalid %s', (field) => {
    for (const invalid of [-1, Infinity, -Infinity, NaN]) {
      expect(() => resolveAmplifyDamageDefinition([
        fixture({ durationMs: 3000, physicalResistReductionPct: 50, [field]: invalid })
      ])).toThrow(/finite nonnegative/);
    }
  });

  it('requires exactly one exact production ID rather than another curse or a legacy ID', () => {
    const authored = fixture({ durationMs: 3000, physicalResistReductionPct: 50 });
    for (const source of [[], [{ ...authored, id: 'necromancer.amplify_damage' }], [authored, authored]]) {
      expect(() => resolveAmplifyDamageDefinition(source)).toThrow(/exactly one/);
    }
    expect(resolveAmplifyDamageDefinition([{ ...authored, id: 'skills-necromancer-decrepify' }, authored]))
      .toEqual(AMPLIFY_DAMAGE_DEFINITION);
  });
});
