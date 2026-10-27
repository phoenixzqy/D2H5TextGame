import { expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import { computeSkillRankDisplayStats, type DisplaySkillSource } from '@/engine/skills/displayStats';
it.each([1, 2, 20])('Flight rank%i exposes its paid blink beside its unchanged finisher damage', rank => {
  const row = rows.find(row => row.id === 'skills-assassin-dragon-flight');
  if (!row) throw new Error('Missing Flight fixture');
  const source = structuredClone(row) as DisplaySkillSource, before = structuredClone(source),
    out = computeSkillRankDisplayStats(source, rank);
  expect(source).toEqual(before);
  expect(out).toMatchObject({ assassinFlight: { durationSeconds: 1, magicDodgePercent: rank },
    assassinMartial: { kind: 'finisher' }, manaCost: 15, cooldown: 2,
    damage: [{ type: 'physical', min: 80 + 7 * (rank - 1), max: 115 + 7 * (rank - 1) }] });
});

it('does not advertise a blink for partial, altered or unrelated source templates', () => {
  const row = rows.find(row => row.id === 'skills-assassin-dragon-flight');
  if (!row) throw new Error('Missing Flight fixture');
  for (const patch of [{ trigger: 'passive' }, { target: 'all-enemies' },
    { cooldown: 0 }, { cost: { mana: 0 } }, { damage: { min: 1, max: 1 } },
    { maxLevel: 21 }, { requiredLevel: 1 }, { scaling: { damagePerLevel: 99 } }])
    expect(computeSkillRankDisplayStats({ ...row, ...patch } as DisplaySkillSource, 1))
      .not.toHaveProperty('assassinFlight');
  expect(computeSkillRankDisplayStats({ id: row.id, trigger: 'active', target: 'single-enemy',
    cooldown: 2, maxLevel: 20 }, 1)).not.toHaveProperty('assassinFlight');
  for (const other of rows.filter(row => row.id !== 'skills-assassin-dragon-flight'))
    expect(computeSkillRankDisplayStats(other as DisplaySkillSource, 1)).not.toHaveProperty('assassinFlight');
});
