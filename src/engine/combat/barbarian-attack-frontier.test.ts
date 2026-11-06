import { expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { getSkill } from '../skills/registry';
import input from './fixtures/barbarian-act1-attack-frontier.json';

for (const cell of input) {
  const skillId = cell.profileId.replaceAll('-', '.').replace('double.', 'double_');
  it(`BUG505 ${cell.profileId} clears the exact earned armor frontier with a living hero`, () => {
    const snapshot = structuredClone(cell.snapshot) as unknown as CombatSnapshot;
    const before = structuredClone(snapshot);
    const output = runBattleRecorded(snapshot);
    expect(snapshot).toEqual(before);
    expect(output.result.winner).toBe('player');
    expect(output.result.playerTeam.find(unit => unit.kind === 'hero')?.life).toBeGreaterThan(0);
    expect(output.result.enemyTeam.every(unit => unit.life <= 0)).toBe(true);
  });

  // A 200-Attack gap makes Throw's post-25%-resistance delta integral.
  const throwing = cell.profileId.endsWith('throw');
  const sensitivity = throwing ? [[1, 0], [2, 45], [20, 855]] : [[1, 0], [2, 15], [20, 285]];
  it.each(sensitivity)(`${skillId} rank%i adds Attack before armor and resistance`, (rank, increase) => {
    const firstHit = (attack: number) => {
      const snapshot = structuredClone(cell.snapshot) as unknown as CombatSnapshot;
      const original = snapshot.playerTeam.find(unit => unit.kind === 'hero'), enemy = snapshot.enemyTeam[0];
      if (!original || !enemy) throw new Error('Missing retained units');
      const hero = { ...original, statuses: [], activeBuffIds: [], cooldowns: {},
        skillOrder: [skillId], skillLevels: { [skillId]: rank },
        stats: { ...original.stats, attack, critChance: 0 }, increasedDamagePct: {} };
      const target = { ...enemy, statuses: [], activeBuffIds: [], cooldowns: {}, life: 1000000,
        skillOrder: [], stats: { ...enemy.stats, lifeMax: 1000000, attack: 0, defense: 10,
          physDodge: 0, resistances: { ...enemy.stats.resistances, physical: 25 } } };
      const output = runBattleRecorded({ ...snapshot, playerTeam: [hero], enemyTeam: [target] });
      const hit = output.events.find(event => event.kind === 'damage' && event.source === hero.id &&
        event.target === target.id && !event.dodged);
      if (!hit || hit.kind !== 'damage') throw new Error('Missing actual paired hit');
      return hit.amount;
    };
    expect(firstHit(throwing ? 300 : 200) - firstHit(100)).toBe(increase);
  });

  it(`${skillId} registers authored rank contribution without changing its strike model`, () => {
    expect(getSkill(skillId)?.effects).toEqual([expect.objectContaining({
      kind: 'damage', attackDamagePctPerRank: throwing ? 30 : 20,
      hitSequence: cell.profileId.endsWith('swing')
        ? { strikes: 2, targetMode: 'each-original' } : { strikes: 2 },
    })]);
  });
}
