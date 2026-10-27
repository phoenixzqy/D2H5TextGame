import { expect, it } from 'vitest';
import rows from '../../data/skills/assassin.json';
import { computeSkillRankDisplayStats } from './displayStats';
import { ASSASSIN_SHADOW_POLICY } from './assassin-shadow-skills';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
const validate = createSkillValidator<SkillDef>();
for (const template of ['shadow_warrior', 'shadow_master'] as const) it.each([1, 6, 20, 21])(
  `${template} previews actual own mana and captured rank cap at rank%i`, rank => {
    const row = rows.find(row => row.id === 'skills-assassin-' + template.replaceAll('_', '-'));
    if (!validate(row)) throw new Error('Missing valid authored shadow');
    const before = structuredClone(row), out = computeSkillRankDisplayStats(row, rank), safe = Math.min(rank, 20);
    expect(out.assassinShadow).toEqual({ template, rankCap: safe,
      manaMax: template === 'shadow_warrior' ? 100 : 150,
      independentSkills: template === 'shadow_warrior' ? [] : ASSASSIN_SHADOW_POLICY.master.attackSkills });
    expect(out.summonUnit?.stats.find(row => row.id === 'manaMax')?.value).toBe(template === 'shadow_warrior' ? 100 : 150);
    expect(out.summonUnit?.stats.find(row => row.id === 'shadowSkillRankCap')?.value).toBe(safe);
    expect(row).toEqual(before);
    expect(computeSkillRankDisplayStats({ ...row, id: 'foreign.' + template }, rank).assassinShadow).toBeUndefined();
    expect(computeSkillRankDisplayStats({ ...row, target: 'self' }, rank).assassinShadow).toBeUndefined();
  });
