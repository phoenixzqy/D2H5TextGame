import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-pierce');
if (!def) throw new Error('Missing authored Rogue Pierce');
const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

// Seeds frozen from the production PRNG before RED: first draw is hit, second is critical.
it.each([
  { label: 'chance increment', seed: 0, critChance: 0, controlDamage: 100, controlCrit: false, damage: 220 },
  { label: 'multiplier increment', seed: 7, critChance: .95, controlDamage: 200, controlCrit: true, damage: 220 },
  { label: 'existing overflow', seed: 7, critChance: 1, controlDamage: 200, controlCrit: true, damage: 222 }
])('supplies real Rogue party critical support: $label', scenario => {
  const owned = createMercFromDef(def, 'critical-regression');
  const merc = { ...mercToCombatUnit(owned), statuses: [hold] };
  const nativeHero = playerToCombatUnit(createMockPlayer('Critical', 'sorceress'));
  // Constructed surviving stats isolate support; this is not earned recruitment evidence.
  const hero = { ...nativeHero, life: 100000, skillOrder: [], increasedDamagePct: {},
    basicAttack: { damageType: 'fire' as const, damage: [100, 100] as const },
    stats: { ...nativeHero.stats, lifeMax: 100000, critChance: scenario.critChance,
      critDamage: 2, attackSpeed: 200 } };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    stats: { ...hero.stats, defense: 0, magicResist: 0, magicDodge: 0, attackSpeed: 1,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold] };
  const input = { seed: scenario.seed, maxRounds: 2, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(input);
  const withoutPassive = mercToCombatUnit({ ...owned,
    comboOrder: owned.comboOrder.filter(id => id !== 'passive-critical') });
  const control = runBattleRecorded({ ...input, playerTeam: [hero, { ...withoutPassive, statuses: [hold] }] });
  expect(control.events.find(e => e.kind === 'damage' && e.source === hero.id))
    .toMatchObject({ amount: scenario.controlDamage, damageType: 'fire', crit: scenario.controlCrit, dodged: false });
  const result = runBattleRecorded(input);
  expect(result.events.find(e => e.kind === 'damage' && e.source === hero.id))
    .toMatchObject({ amount: scenario.damage, damageType: 'fire', crit: true, dodged: false });
  expect(result.events.some(e => e.kind === 'action' && e.skillId === 'passive-critical')).toBe(false);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(result);
});
