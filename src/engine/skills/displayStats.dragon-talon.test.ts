import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
const talon = PLAYABLE_CLASS_SKILL_DATA.assassin.find(
  (s) => s.id === 'skills-assassin-dragon-talon'
);
if (!talon) throw new Error('Missing Dragon Talon');
it.each([0, 1, 2, 19, 20])(
  'Dragon Talon rank%i shows three attempts with damage per attempt',
  (rank) => {
    const m = computeSkillDisplayModel(talon, rank),
      current = m.current ?? m.next;
    const growth = 4 * Math.max(0, rank - 1);
    expect(current).toMatchObject({
      strikesPerCast: 3,
      damage: [{ type: 'physical', min: 40 + growth, max: 60 + growth }],
      manaCost: 4,
      cooldown: 1
    });
    if (rank > 0 && rank < 20)
      expect(m.next).toMatchObject({
        strikesPerCast: 3,
        damage: [{ type: 'physical', min: 40 + 4 * rank, max: 60 + 4 * rank }]
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
      computeSkillDisplayModel({ ...talon, ...patch }, 1).current?.strikesPerCast
    ).toBeUndefined();
  }
});
