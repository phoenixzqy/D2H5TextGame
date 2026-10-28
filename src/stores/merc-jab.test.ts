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
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act2-holy-freeze');
  if (!definition) throw new Error('Missing authored Holy Freeze mercenary');
  const native = mercToCombatUnit(createMercFromDef(definition, 'jab-regression'));
  // Surviving constructed stats isolate the native skill, not earned recruitment or balance.
  const merc = { ...native, life: 1000000, mana: 0,
    stats: { ...native.stats, lifeMax: 1000000, attack, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Jab', 'sorceress'));
  const hero = { ...player, statuses: [hold] };
  const enemy = { ...player, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    life: 1000000, statuses: [hold], stats: { ...player.stats, lifeMax: 1000000,
      defense: 0, physDodge: 0, resistances: { physical: 0, fire: 0, cold: 0,
        lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] };
}

it('gives a real projected Act II mercenary three Attack-scaled Jab attempts for one action', () => {
  const input = scenario(100), before = structuredClone(input);
  const recording = runBattleRecorded(input);
  const action = recording.events.find(event => event.kind === 'action' && event.skillId === 'mskill-jab');
  if (action?.kind !== 'action') throw new Error('Missing native Jab action');
  const hits = recording.events.filter(event => event.kind === 'damage' &&
    event.source === action.actor && event.simClockMs === action.simClockMs);
  // Seed 7 gives flat rolls 18, 23, 20; native Holy Freeze Chill adds the physical ×1.1 combo.
  expect(hits).toEqual([194, 202, 198].map((amount): unknown => expect.objectContaining({
    amount, target: 'target', damageType: 'physical', crit: false, dodged: false })));
  expect(recording.events.filter(event => event.kind === 'action' &&
    event.actor === action.actor && event.simClockMs === action.simClockMs)).toHaveLength(1);
  expect(recording.result.playerTeam.find(unit => unit.id === action.actor)?.mana).toBe(0);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recording);
});

it('uses fresh projected Attack for every attempt without changing the saved mercenary stats', () => {
  const input = scenario(200), before = structuredClone(input);
  const recording = runBattleRecorded(input);
  const action = recording.events.find(event => event.kind === 'action' && event.skillId === 'mskill-jab');
  if (action?.kind !== 'action') throw new Error('Missing native Jab action');
  expect(recording.events.filter(event => event.kind === 'damage' && event.source === action.actor &&
    event.simClockMs === action.simClockMs)).toEqual([359, 367, 363].map((amount): unknown =>
    expect.objectContaining({ amount, crit: false, dodged: false })));
  expect(recording.result.playerTeam.find(unit => unit.id === action.actor)?.stats).toEqual(input.playerTeam[1]?.stats);
  expect(input).toEqual(before);
});
