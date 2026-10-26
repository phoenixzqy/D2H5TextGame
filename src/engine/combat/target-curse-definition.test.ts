import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createSkillValidator } from '../skills/skill-validator';
import {
  TARGET_CURSE_DEFINITIONS,
  TARGET_CURSE_SKILL_IDS,
  resolveTargetCurseDefinition,
  targetCurseId,
  type TargetCurseId
} from './target-curse-definition';

const validate = createSkillValidator();
for (const id of ['confuse', 'attract'] as const) {
  const row = rows.find(skill => skill.id === TARGET_CURSE_SKILL_IDS[id]);
  if (!row) throw new Error('Missing native target curse');
  it(id + ' requires finite JSON duration and preserves native resource/ownership authority', () => {
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(targetCurseId(row)).toBe(id);
    expect(TARGET_CURSE_DEFINITIONS[id]).toEqual({ id, durationMs: 3000 });
    expect(row).toMatchObject(id === 'confuse'
      ? { requiredLevel: 18, prerequisites: ['skills-necromancer-dim-vision'], target: 'all-enemies',
        cost: { mana: 13 }, cooldown: 3, scaling: { costPerLevel: -.25 } }
      : { requiredLevel: 24, prerequisites: ['skills-necromancer-confuse'], target: 'single-enemy',
        cost: { mana: 17 }, cooldown: 3, scaling: { cooldownPerLevel: -.05 } });
  });
  it.each([
    { statusEffect: undefined }, { statusEffect: {} },
    ...[0, -1, NaN, Infinity, -Infinity].map(durationMs => ({ statusEffect: { durationMs } })),
    { statusEffect: { durationMs: 3000, chance: .5 } },
    { statusEffect: { durationMs: 3000, damageReductionPct: 50 } },
    { trigger: 'passive' }, { target: 'self' }, { requiredLevel: 1 },
    { prerequisites: [] }, { minLevel: 0 }, { maxLevel: 21 },
    { cooldown: 0 }, { cost: { mana: 0 } }, { scaling: {} },
    { appliesStatus: ['blind'] }, { appliesStatus: [id, 'stun'] },
    { damage: { min: 1, max: 1 } }, { damageType: 'physical' }
  ])(id + ' refuses incomplete, nonfinite or mismatched canonical capability %j', patch => {
    const invalid = { ...row, ...patch };
    expect(validate(invalid)).toBe(false);
    expect(targetCurseId(invalid)).toBeUndefined();
    expect(() => resolveTargetCurseDefinition([invalid], id)).toThrow();
  });
  it(id + ' freezes detached JSON tuning and rejects missing/duplicate/wrong-identity definitions', () => {
    const copied = structuredClone(row), resolved = resolveTargetCurseDefinition([copied], id);
    if (!copied.statusEffect) throw new Error('Missing authored duration');
    copied.statusEffect.durationMs = 1500;
    expect(resolved.durationMs).toBe(3000);
    expect(resolveTargetCurseDefinition([copied], id).durationMs).toBe(1500);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(copied.statusEffect)).toBe(false);
    expect(Object.isFrozen(TARGET_CURSE_DEFINITIONS)).toBe(true);
    expect(() => resolveTargetCurseDefinition([], id)).toThrow();
    expect(() => resolveTargetCurseDefinition([row, row], id)).toThrow();
    const other: TargetCurseId = id === 'confuse' ? 'attract' : 'confuse';
    expect(() => resolveTargetCurseDefinition([row], other)).toThrow();
    expect(() => resolveTargetCurseDefinition([null, {}, ...rows], id)).not.toThrow();
  });
}
it('unrelated native skills cannot grant either target-redirection capability', () => {
  expect(targetCurseId(rows.find(row => row.id === 'skills-necromancer-dim-vision'))).toBeUndefined();
  for (const source of [null, undefined, {}, [], 'confuse', { id: 'confuse' }])
    expect(targetCurseId(source)).toBeUndefined();
});
