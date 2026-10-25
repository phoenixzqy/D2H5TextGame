import { describe, expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
const skills = PLAYABLE_CLASS_SKILL_DATA.druid;
import { computeSkillDisplayModel } from './displayStats';
const fury = skills.find((s) => s.id === 'skills-druid-fury');
if (!fury) throw new Error('Missing Fury');
describe('Fury per-strike bounds and bounded attempts', () => {
  it.each([0, 1, 2, 20])(
    'allocated%i shows per-strike damage without promising total damage',
    (rank) => {
      const m = computeSkillDisplayModel(fury, rank),
        current = m.current ?? m.next;
      const growth = 8 * Math.max(0, rank - 1);
      expect(current).toMatchObject({
        strikesPerCast: 5,
        damage: [{ type: 'physical', min: 95 + growth, max: 135 + growth }],
        manaCost: 11,
        cooldown: 1
      });
      if (rank > 0 && rank < 20)
        expect(m.next).toMatchObject({
          strikesPerCast: 5,
          damage: [{ type: 'physical', min: 95 + 8 * rank, max: 135 + 8 * rank }]
        });
      if (rank === 20) expect(m.next).toBeUndefined();
    }
  );
});
