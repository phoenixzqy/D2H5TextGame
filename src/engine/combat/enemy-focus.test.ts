import { beforeEach, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

function swarm(seed: number): CombatSnapshot {
  const definition = monsters.find(row => row.id === 'monsters/act5.warped-shaman');
  if (!definition) throw new Error('Missing native Warped Shaman');
  const enemies = Array.from({ length: 16 }, (_, index) => buildMonsterUnit({
    def: definition, level: 12, tier: 'trash', id: `owner-${String(index)}`, rng: createRng(7)
  }));
  const base = enemies[0]; if (!base) throw new Error('Missing owner');
  // Constructed overkill tank isolates automatic target access, not earned power.
  const hero: CombatUnit = { ...base, id: 'hero', kind: 'hero', side: 'player',
    life: 1_000_000, mana: 0, skillOrder: [], statuses: [], attackRange: [50_000, 50_000],
    stats: { ...base.stats, life: 1_000_000, lifeMax: 1_000_000, attack: 50_000,
      attackSpeed: 164, critChance: 0, physDodge: 0, magicDodge: 0 } };
  return { seed, act: 5, playerTeam: [hero], enemyTeam: enemies };
}

it.each([7, 19, 41])('does not let replacements permanently shield native summoners, seed%i', seed => {
  const input = swarm(seed), before = structuredClone(input), out = runBattleRecorded(input);
  const hits = out.events.filter(event => event.kind === 'damage' && event.source === 'hero');
  expect(hits[0]).toMatchObject({ target: 'owner-0' });
  expect(out.events.some(event => event.kind === 'summon')).toBe(true);
  expect(out.result.winner).toBe('player');
  expect(out.result.enemyTeam.filter(unit => unit.kind === 'monster' && unit.life > 0)).toEqual([]);
  expect(runBattleRecorded(input)).toEqual(out); expect(runBattle(input)).toEqual(out.result);
  expect(input).toEqual(before);
});

it('retains explicit active Taunt to a later living eligible source', () => {
  const input = swarm(7), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [{
    id: 'taunt', sourceId: 'owner-15', stacks: 1, remaining: 60, appliedAtMs: 0, expiresAtMs: 60_000
  }] }] });
  expect(out.events.find(event => event.kind === 'damage' && event.source === 'hero'))
    .toMatchObject({ target: 'owner-15' });
});
