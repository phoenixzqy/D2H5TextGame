import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
const skill = PLAYABLE_CLASS_SKILL_DATA.amazon.find(row => row.id === 'skills-amazon-slow-missiles');
if (!skill) throw new Error('Missing authored Slow Missiles');
it.each([0, 1, 2, 18, 19, 20])('previews finite travel and actual current/next/MAX rank%i payment', rank => {
 const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank), safe = Math.max(1, rank);
 expect(rank === 0 ? model.next : model.current).toMatchObject({
  slowMissiles: { durationSeconds: 6, projectileSpeedPercent: 33 },
  manaCost: Math.round(10 - .1 * (safe - 1)),
  cooldown: Math.max(1, Number((3 - .05 * (safe - 1)).toFixed(1)))
 });
 if (rank > 0 && rank < 20) expect(model.next).toMatchObject({
  slowMissiles: { durationSeconds: 6, projectileSpeedPercent: 33 },
  manaCost: Math.round(10 - .1 * rank), cooldown: Math.max(1, Number((3 - .05 * rank).toFixed(1)))
 });
 if (rank === 20) expect(model.next).toBeUndefined();
 expect(skill).not.toHaveProperty('scaling.passiveStatsPerLevel');
 expect(skill).toEqual(before);
});
it('does not advertise a complete travel window from missing, free or contradictory metadata', () => {
 const malformed = [
  { ...skill, statusEffect: {} },
  { ...skill, statusEffect: { durationMs: 6000 } },
  { ...skill, statusEffect: { durationMs: 6000, projectileSpeedPct: Infinity } },
  { ...skill, statusEffect: { durationMs: 6000, projectileSpeedPct: 33, chance: 1 } },
  { ...skill, cost: { mana: 0 } },
  { ...skill, cooldown: 0 },
  { ...skill, id: 'skills-amazon-inner-sight' }
 ];
 for (const candidate of malformed) expect(computeSkillRankDisplayStats(candidate, 1)).not.toHaveProperty('slowMissiles');
});
