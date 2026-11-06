import { expect, it } from 'vitest';
import authored from '@/data/skills/assassin.json';
import type { DisplaySkillSource } from './displayStats';
import { computeSkillRankDisplayStats } from './displayStats';

const cases = [
  ['shock-web', 'lightning', 30, 50, 3, 20],
  ['charged-bolt-sentry', 'lightning', 40, 60, 4, 13],
  ['wake-of-fire', 'fire', 60, 85, 5, 17],
  ['blade-sentinel', 'physical', 50, 75, 120, 15],
  ['lightning-sentry', 'lightning', 75, 110, 24, 22],
  ['wake-of-inferno', 'fire', 90, 130, 7, 25],
  ['death-sentry', 'lightning', 85, 125, 7, 27],
  ['blade-shield', 'physical', 95, 135, 8, 30]
] as const;
function source(slug: string): DisplaySkillSource {
  const row = authored.find(row => row.id === 'skills-assassin-' + slug);
  if (!row) throw new Error('Missing authored trap');
  return structuredClone(row) as DisplaySkillSource;
}
for (const [slug, type, min, max, growth, mana] of cases) for (const rank of [1, 2, 20]) {
  it(`${slug} rank${String(rank)} previews actual typed pulse/counter base and finite payment timing`, () => {
    const stats = computeSkillRankDisplayStats(source(slug), rank);
    const damage = { type, min: min + growth * (rank - 1), max: max + growth * (rank - 1) };
    expect(stats.damage).toEqual([damage]);
    expect(stats.manaCost).toBe(mana);
    expect(stats.assassinTrap).toEqual(slug === 'blade-shield'
      ? { mode: 'reactive', durationSeconds: 6, intervalSeconds: 1, damage }
      : { mode: slug === 'death-sentry' ? 'corpse' : 'pulse', durationSeconds: 3,
          intervalSeconds: 1, pulses: 3, damage,
          ...(slug === 'death-sentry' ? { corpseDamage: { ...damage, type: 'fire' },
            corpseBurnPercent: 10, corpseBurnSeconds: 3 } : {}) });
  });
}
it('does not advertise paid trap mechanics for partial, altered or unrelated sources', () => {
  const row = source('shock-web');
  for (const patch of [{ trigger: 'passive' }, { target: 'single-enemy' }, { maxLevel: 21 },
    { cooldown: 0 }, { cost: { mana: 0 } }, { damage: { min: 0, max: 1 } },
    { scaling: { damagePerLevel: 99 } }, { appliesStatus: [] }, { damageType: 'fire' }]) {
    expect(computeSkillRankDisplayStats({ ...row, ...patch } as DisplaySkillSource, 1).assassinTrap).toBeUndefined();
  }
  for (const slug of ['fire-blast', 'blade-fury', 'tiger-strike'])
    expect(computeSkillRankDisplayStats(source(slug), 1).assassinTrap).toBeUndefined();
  expect(computeSkillRankDisplayStats({ id: row.id, trigger: 'active', target: 'all-enemies', maxLevel: 20,
    cooldown: 2 }, 1).assassinTrap).toBeUndefined();
});
it('keeps preview objects independent and read-only without freezing caller data', () => {
  const row = source('death-sentry'), before = structuredClone(row);
  const first = computeSkillRankDisplayStats(row, 20), second = computeSkillRankDisplayStats(row, 20);
  expect(row).toEqual(before);
  expect(Object.isFrozen(row)).toBe(false);
  expect(Object.isFrozen(first.assassinTrap)).toBe(true);
  expect(first.assassinTrap).toEqual(second.assassinTrap);
  expect(first.assassinTrap).not.toBe(second.assassinTrap);
});
