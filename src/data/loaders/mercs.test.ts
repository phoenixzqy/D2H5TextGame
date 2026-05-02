import { describe, expect, it } from 'vitest';
import { loadMercHireRoster, resolveMercSkillLoadout } from './mercs';

describe('merc hire roster', () => {
  it('exposes D2-style act hireables without Act IV or tavern recruits', () => {
    const roster = loadMercHireRoster();
    expect(roster.map((act) => act.act)).toEqual([1, 2, 3, 5]);
    expect(roster.flatMap((act) => act.mercs).map((def) => def.id)).not.toContain('mercs/act4-paladin-initiate');
    expect(roster.flatMap((act) => act.mercs).some((def) => def.id.startsWith('mercs/tavern-'))).toBe(false);
  });

  it('gives every hireable merc a three-skill loadout', () => {
    const bad = loadMercHireRoster()
      .flatMap((act) => act.mercs)
      .filter((def) => resolveMercSkillLoadout(def).length !== 3)
      .map((def) => def.id);

    expect(bad).toEqual([]);
  });
});
