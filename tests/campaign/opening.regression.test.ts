import { expect, it } from 'vitest';
import { runCampaign } from './native-runner';

// A frozen native creation stream, not statistical balance or five-act acceptance.
const profiles = [
  'sorceress-cold', 'sorceress-fire', 'amazon-bow', 'amazon-javelin',
  'assassin-martial', 'assassin-traps', 'necromancer-summon', 'necromancer-bone',
  'barbarian-double-swing', 'barbarian-double-throw', 'paladin-zeal',
  'paladin-holy-bolt', 'druid-fire', 'druid-summon'
];
it.each(profiles)('%s can earn its first Blood Moor reward from real starter state', profile => {
  const report = runCampaign('intro', profile, () => undefined, 'none');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  const first = report.waves[0];
  expect(first).toMatchObject({ area: 'areas/act1-blood-moor', ordinal: 0, index: 0,
    outcome: 'victory' });
  expect(first?.heroLife).toBeGreaterThan(0);
  expect(first?.xp).toBeGreaterThan(0);
  expect(report.nativeWaveExceptions).toEqual([]);
});
