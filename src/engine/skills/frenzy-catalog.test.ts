import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-frenzy');
if (!row) throw new Error('Missing actual Frenzy');
const validate = createSkillValidator();
const complete = () => ({ ...row, hitSequence: { strikes: 2 }, frenzy: { attackSpeedPctPerStack: .05, maxStacks: 5, durationMs: 6000 } });
it('authors the real pair without changing damage, cost or native eligibility', () => {
  expect(row).toMatchObject({ target: 'single-enemy', hitSequence: { strikes: 2 }, frenzy: { attackSpeedPctPerStack: .05, maxStacks: 5, durationMs: 6000 },
    damage: { min: 85, max: 120 }, scaling: { damagePerLevel: 8 }, cost: { mana: 12 },
    cooldown: 1, requiredLevel: 24, maxLevel: 20, prerequisites: ['skills-barbarian-double-throw'] });
  expect(row).not.toHaveProperty('aoeShape'); expect(row).not.toHaveProperty('maxTargets');
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('retains the default total-attempt semantics through actual registration', () => {
  const before = structuredClone(row), skill = registeredSkillFromJson(row);
  expect(skill).toMatchObject({ id: 'barbarian.frenzy', target: 'single-enemy',
    manaCost: 12, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [85, 120], perRank: [8, 8], hitSequence: { strikes: 2 }, frenzy: true }] });
  expect(skill).not.toHaveProperty('aoeShape'); expect(row).toEqual(before);
});
it('requires the exact pair and rejects contradictory Frenzy metadata', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  for (const patch of [{ frenzy: undefined }, { frenzy: { attackSpeedPctPerStack: 0, maxStacks: 5, durationMs: 6000 } }, { frenzy: { attackSpeedPctPerStack: .05, maxStacks: 0, durationMs: 6000 } }, { frenzy: { attackSpeedPctPerStack: .05, maxStacks: 5, durationMs: 0 } }, { hitSequence: undefined }, { hitSequence: {} }, { hitSequence: { strikes: 1 } },
    { hitSequence: { strikes: 3 } }, { hitSequence: { strikes: 2, targetMode: 'each-original' } },
    { hitSequence: { strikes: 2, typo: true } }, { aoeShape: 'cross' }, { maxTargets: 3 },
    { trigger: 'passive' }, { target: 'area-enemies' }, { damageType: 'cold' },
    { requiredLevel: 1 }, { maxLevel: 21 }, { prerequisites: [] }, { cost: { mana: 10 } },
    { appliesStatus: ['stun'] }, { ignoresDefense: true }, { onHitRecovery: { lifeFraction: .5 } }])
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
});
it('does not leak the pair capability to an unrelated skill or change sibling modes', () => {
  const bash = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-bash');
  expect(validate(bash)).toBe(true); expect(validate({ ...bash, hitSequence: { strikes: 2 } })).toBe(false);
  const swing = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-double-swing');
  expect(swing?.hitSequence).toEqual({ strikes: 2, targetMode: 'each-original' });
  const fury = PLAYABLE_CLASS_SKILL_DATA.druid.find(s => s.id === 'skills-druid-fury');
  expect(fury?.hitSequence).toEqual({ strikes: 5 });
  expect(validate(swing)).toBe(true); expect(validate(fury)).toBe(true);
});
it.each([0, 1, 2, 19, 20])('previews rank%i per-attempt damage and two total attempts', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ strikesPerCast: 2, manaCost: 12, cooldown: 1, frenzy: { percentPerStack: 5, maxStacks: 5, durationSeconds: 6 },
      damage: [{ type: 'physical', min: 85 + 8 * (stats.rank - 1), max: 120 + 8 * (stats.rank - 1) }] });
    expect(stats).not.toHaveProperty('strikesPerTarget');
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
it('does not advertise a valid Frenzy pair for contradictory or missing metadata', () => {
  for (const patch of [{ target: 'area-enemies' }, { trigger: 'passive' }, { damageType: 'arcane' as const },
    { hitSequence: { strikes: 3 } }, { hitSequence: { strikes: 2, targetMode: 'each-original' as const } },
    { aoeShape: 'cross' as const }])
    expect(computeSkillDisplayModel({ ...row, ...patch }, 1).current).not.toHaveProperty('strikesPerCast');
  const missing = { ...row };
  Reflect.deleteProperty(missing, 'hitSequence');
  expect(computeSkillDisplayModel(missing, 1).current).not.toHaveProperty('strikesPerCast');
});
