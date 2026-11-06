import { expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import input from './fixtures/amazon-multiple-shot-frontier.json';

it('BUG500 lets the invested cone clear the retained Dark Wood frontier with a living hero', () => {
  // Exact native175 W4 party/resources/enemies, original seed. Only the skill
  // allocation is constructed from its earned17-point budget; no reward credit.
  const snapshot = structuredClone(input) as unknown as CombatSnapshot;
  const before = structuredClone(snapshot);
  const hero = snapshot.playerTeam.find(unit => unit.kind === 'hero');
  expect(Object.values(hero?.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)).toBe(17);
  const output = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(output.result.winner).toBe('player');
  expect(output.result.playerTeam.find(unit => unit.kind === 'hero')?.life).toBeGreaterThan(0);
  expect(output.result.enemyTeam.every(unit => unit.life <= 0)).toBe(true);
});
