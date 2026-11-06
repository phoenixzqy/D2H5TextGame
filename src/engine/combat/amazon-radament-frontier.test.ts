import { expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { getSkill } from '../skills/registry';
import input from './fixtures/amazon-radament-frontier.json';

it('BUG501 lets the earned rank20 Bow defeat retained Radament without injected resources', () => {
  const snapshot = structuredClone(input) as unknown as CombatSnapshot;
  const before = structuredClone(snapshot);
  const hero = snapshot.playerTeam.find(unit => unit.kind === 'hero');
  expect(hero?.skillLevels?.['amazon.multiple_shot']).toBe(20);
  expect(hero?.mana).toBe(111);
  const output = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(output.result.winner).toBe('player');
  expect(output.result.playerTeam.find(unit => unit.kind === 'hero')?.life).toBeGreaterThan(0);
  expect(output.result.enemyTeam.every(unit => unit.life <= 0)).toBe(true);
});

it('registers rank-based Attack separately from the existing flat damage curve', () => {
  expect(getSkill('amazon.multiple_shot')?.effects).toEqual([expect.objectContaining({
    kind: 'damage', base: [40, 60], perRank: [12, 12], attackDamagePctPerRank: 40,
  })]);
});

it.each([[1, 0], [2, 30], [20, 570]])('rank%i applies Attack before physical resistance and Defense', (rank, increase) => {
  const firstHit = (attack: number) => {
    const snapshot = structuredClone(input) as unknown as CombatSnapshot;
    const original = snapshot.playerTeam.find(unit => unit.kind === 'hero');
    const enemy = snapshot.enemyTeam[0];
    if (!original || !enemy) throw new Error('Missing retained units');
    const hero = { ...original, statuses: [], activeBuffIds: [], cooldowns: {},
      skillOrder: ['amazon.multiple_shot'], skillLevels: { 'amazon.multiple_shot': rank },
      stats: { ...original.stats, attack, critChance: 0 }, increasedDamagePct: {} };
    const target = { ...enemy, statuses: [], activeBuffIds: [], cooldowns: {}, life: 1000000,
      skillOrder: [], stats: { ...enemy.stats, lifeMax: 1000000, attack: 0, defense: 10,
        physDodge: 0, resistances: { ...enemy.stats.resistances, physical: 25 } } };
    const output = runBattleRecorded({ ...snapshot, playerTeam: [hero], enemyTeam: [target] });
    const hit = output.events.find(event => event.kind === 'damage' && event.source === hero.id &&
      event.target === target.id && !event.dodged);
    if (!hit || hit.kind !== 'damage') throw new Error('Missing actual volley hit');
    return hit.amount;
  };
  // The same seed rolls the same flat base. +100 Attack adds rankCoefficient × .75.
  expect(firstHit(200) - firstHit(100)).toBe(increase);
});
