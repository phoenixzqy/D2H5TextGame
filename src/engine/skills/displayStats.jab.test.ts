import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
const jab = PLAYABLE_CLASS_SKILL_DATA.amazon.find((s) => s.id === 'skills-amazon-jab');
if (!jab) throw new Error('Missing Jab');
it.each([0, 1, 2, 19, 20])('Jab rank%i shows three attempts with damage per attempt', (rank) => {
  const m = computeSkillDisplayModel(jab, rank),
    current = m.current ?? m.next;
  const growth = 3 * Math.max(0, rank - 1);
  expect(current).toMatchObject({
    strikesPerCast: 3,
    damage: [{ type: 'physical', min: 30 + growth, max: 45 + growth }],
    manaCost: 5,
    cooldown: 1
  });
  if (rank > 0 && rank < 20)
    expect(m.next).toMatchObject({
      strikesPerCast: 3,
      damage: [{ type: 'physical', min: 30 + 3 * rank, max: 45 + 3 * rank }]
    });
  if (rank === 20) expect(m.next).toBeUndefined();
});
it('does not advertise sequences for unrelated or contradictory templates', () => {
  for (const patch of [
    { id: 'skills-amazon-power-strike' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'cold' as const },
    { hitSequence: { strikes: 1 } },
    { hitSequence: { strikes: NaN } }
  ]) {
    expect(
      computeSkillDisplayModel({ ...jab, ...patch }, 1).current?.strikesPerCast
    ).toBeUndefined();
  }
});
