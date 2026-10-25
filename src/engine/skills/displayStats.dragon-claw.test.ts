import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
const claw = PLAYABLE_CLASS_SKILL_DATA.assassin.find((s) => s.id === 'skills-assassin-dragon-claw');
if (!claw) throw new Error('Missing Dragon Claw');
it.each([0, 1, 2, 19, 20])(
  'Dragon Claw rank%i shows two attempts with a local critical bonus with damage per attempt',
  (rank) => {
    const m = computeSkillDisplayModel(claw, rank),
      current = m.current ?? m.next;
    const growth = 7 * Math.max(0, rank - 1);
    expect(current).toMatchObject({
      strikesPerCast: 2,
      criticalBonusPoints: 10,
      damage: [{ type: 'physical', min: 70 + growth, max: 100 + growth }],
      manaCost: 20,
      cooldown: 1
    });
    if (rank > 0 && rank < 20)
      expect(m.next).toMatchObject({
        strikesPerCast: 2,
        criticalBonusPoints: 10,
        damage: [{ type: 'physical', min: 70 + 7 * rank, max: 100 + 7 * rank }]
      });
    if (rank === 20) expect(m.next).toBeUndefined();
  }
);
it('does not advertise sequences for unrelated or contradictory templates', () => {
  for (const patch of [
    { id: 'skills-assassin-dragon-tail' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'cold' as const },
    { hitSequence: { strikes: 1 } },
    { hitSequence: { strikes: NaN } }
  ]) {
    expect(
      computeSkillDisplayModel({ ...claw, ...patch }, 1).current?.strikesPerCast
    ).toBeUndefined();
  }
});

it('omits bonus presentation for missing, unrelated and invalid metadata', () => {
  for (const patch of [
    { id: 'skills-assassin-dragon-talon' },
    { critChanceBonus: 0 },
    { critChanceBonus: -0.1 },
    { critChanceBonus: NaN },
    { critChanceBonus: Infinity },
    { critChanceBonus: 1.01 },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'cold' as const }
  ])
    expect(computeSkillDisplayModel({ ...claw, ...patch }, 1).current).not.toHaveProperty(
      'criticalBonusPoints'
    );
  const missing = { ...claw };
  Reflect.deleteProperty(missing, 'critChanceBonus');
  expect(computeSkillDisplayModel(missing, 1).current).not.toHaveProperty('criticalBonusPoints');
});
