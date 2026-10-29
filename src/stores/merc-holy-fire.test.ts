import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

it.each([1, 20])('gives the actual Holy Fire mercenary its ambient8fire/s at rank%i while disabled', rank => {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act4-paladin-holy-fire');
  if (!definition) throw new Error('Missing actual Holy Fire mercenary');
  const owned = createMercFromDef(definition, 'holy-fire-primary');
  const native = mercToCombatUnit(owned);
  // Surviving constructed resources isolate presence mechanics, not earned play.
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0, statuses: [hold],
    skillLevels: { ...native.skillLevels, 'mskill-holy-fire': rank }, increasedDamagePct: {},
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100,
      critChance: 0, critDamage: 2 } };
  const player = playerToCombatUnit(createMockPlayer('Holy Fire', 'sorceress'));
  const hero: CombatUnit = { ...player, life: 1000000, statuses: [hold],
    stats: { ...player.stats, lifeMax: 1000000 } };
  const enemyTeam: CombatUnit[] = ['target', 'bystander', 'dead'].map(id => ({
    ...player, id, side: 'enemy', kind: 'monster', tier: 'trash',
    life: id === 'dead' ? 0 : 1000000, statuses: [], skillOrder: [],
    stats: { ...player.stats, lifeMax: 1000000, attack: 1, attackSpeed: 0,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  }));
  const input = { seed: 7, playerTeam: [hero, merc], enemyTeam };
  const before = structuredClone({ owned, input });
  expect(merc.skillOrder).toEqual(['mskill-holy-fire']);
  const out = runBattleRecorded(input);
  const hits = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    event.kind === 'damage' && event.source === merc.id && event.simClockMs <= 2000);
  const observations = hits.map(hit => [hit.target, hit.amount, hit.damageType,
    hit.crit, hit.dodged, hit.simClockMs]);
  expect(observations).toHaveLength(4);
  expect(observations).toEqual(expect.arrayContaining([
    ['target', 8, 'fire', false, false, 1000],
    ['bystander', 8, 'fire', false, false, 1000],
    ['target', 8, 'fire', false, false, 2000],
    ['bystander', 8, 'fire', false, false, 2000]
  ]));
  expect(native).toHaveProperty('mercHolyFireAura', true);
  expect(getSkill('mskill-holy-fire')).toMatchObject({ trigger: 'passive',
    manaCost: 0, minLevel: 1, target: 'all-enemies', effects: [] });
  expect(out.events.some(event => event.kind === 'action' && event.actor === merc.id)).toBe(false);
  const states = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
    event.kind === 'status-state' && event.simClockMs <= 2000);
  expect(states.some(event => event.statuses.some(status => status.sourceId === merc.id))).toBe(false);
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect({ owned, input }).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});
