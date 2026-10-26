import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

for (const [id, percent, base, scaling] of [['iron-maiden', 100, 11, .25], ['life-tap', 25, 9, .2], ['lower-resist', 30, 22, .3]] as const) {
  const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-' + id);
  if (!skill) throw new Error('Missing authored damage curse');
  it.each([0, 1, 2, 18, 19, 20])(`${id} previews authored potency/duration and actual rank%i cost without mutation`, rank => {
    const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
    expect(rank === 0 ? model.next : model.current).toMatchObject({ damageCurse: { id, durationSeconds: 3, percent },
      manaCost: Math.round(base - scaling * (Math.max(1, rank) - 1)), cooldown: 3 });
    if (rank > 0 && rank < 20) expect(model.next).toMatchObject({ damageCurse: { id, durationSeconds: 3, percent },
      manaCost: Math.round(base - scaling * rank) });
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(skill).toEqual(before);
  });
  it(`${id} never advertises power from incomplete or contradictory metadata`, () => {
    for (const statusEffect of [{}, { durationMs: 3000 }, { ...skill.statusEffect, durationMs: Infinity },
      { ...skill.statusEffect, damageReductionPct: 33 }])
      expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('damageCurse');
  });
  it(`${id} previews its own validated authored tuning rather than registry defaults`, () => {
    const fields = { 'iron-maiden': 'reflectedPhysicalDamagePct', 'life-tap': 'lifeTapHealingPct',
      'lower-resist': 'allResistReductionPct' } as const;
    const source = { ...skill, statusEffect: { ...skill.statusEffect, durationMs: 2500, [fields[id]]: 40 } };
    const before = structuredClone(source);
    expect(computeSkillRankDisplayStats(source, 1)).toMatchObject({
      damageCurse: { id, durationSeconds: 2.5, percent: 40 }
    });
    expect(source).toEqual(before);
  });
}
