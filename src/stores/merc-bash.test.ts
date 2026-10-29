import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

function scenario(attack: number) {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-battle-orders');
  if (!definition) throw new Error('Missing authored Battle Orders barbarian');
  const owned = createMercFromDef(definition, 'bash-regression');
  const native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate the native loadout, not earned recruitment or balance.
  const merc = { ...native, life: 1000000, mana: 0,
    stats: { ...native.stats, lifeMax: 1000000, attack, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Bash', 'sorceress'));
  const hero = { ...player, statuses: [hold] };
  const enemy = { ...player, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    life: 1000000, statuses: [hold], stats: { ...player.stats, lifeMax: 1000000,
      defense: 0, physDodge: 0, resistances: { physical: 0, fire: 0, cold: 0,
        lightning: 0, arcane: 0, poison: 0 } } };
  return { owned, input: { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] } };
}

function first(attack: number) {
  const { owned, input } = scenario(attack), before = structuredClone({ owned, input });
  expect(input.playerTeam[1]?.skillOrder).toContain('aura-battle-orders');
  expect(input.playerTeam[1]?.mercBattleOrders).toBe(true);
  const recording = runBattleRecorded(input);
  const action = recording.events.find(event => event.kind === 'action' && event.skillId === 'mskill-bash');
  if (action?.kind !== 'action') throw new Error('Missing native Bash action');
  const hits = recording.events.filter(event => event.kind === 'damage' &&
    event.source === action.actor && event.simClockMs === action.simClockMs);
  expect(hits).toHaveLength(2);
  for (const hit of hits) {
    if (hit.kind !== 'damage') throw new Error('Expected native damage attempt');
    expect(hit).toMatchObject({ target: 'target', damageType: 'physical', crit: false, dodged: false });
    expect(hit.amount).toBeGreaterThanOrEqual(25);
    expect(hit.amount).toBeLessThanOrEqual(40);
  }
  expect(recording.events.filter(event => event.kind === 'action' &&
    event.actor === action.actor && event.simClockMs === action.simClockMs)).toHaveLength(1);
  expect(recording.result.playerTeam.find(unit => unit.id === action.actor)?.mana).toBe(0);
  expect({ owned, input }).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recording);
  return hits;
}

it('gives the real Battle Orders barbarian two ordinary Bash attempts for one action', () => {
  first(100);
});

it('keeps the authored flat damage independent of Attack without changing saved resources', () => {
  expect(first(200)).toEqual(first(100));
});
