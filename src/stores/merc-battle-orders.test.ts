import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-battle-orders');
if (!def) throw new Error('Missing authored mercenary Battle Orders');
const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

it.each([
  { label: 'maximum HP', stat: 'lifeMax' as const, resource: 'life' as const, base: 1000, boosted: 1300, current: 700 },
  { label: 'maximum MP', stat: 'manaMax' as const, resource: 'mana' as const, base: 100, boosted: 130, current: 80 }
])('supplies real mercenary Battle Orders: $label without refill', scenario => {
  const owned = createMercFromDef(def, 'orders-regression');
  const merc = { ...mercToCombatUnit(owned), statuses: [hold] };
  const nativeHero = playerToCombatUnit(createMockPlayer('Orders', 'sorceress'));
  // Constructed surviving resources isolate capacity; this is not earned recruitment evidence.
  const hero = { ...nativeHero, life: 700, mana: 80, skillOrder: [], statuses: [hold],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...nativeHero.stats, lifeMax: 1000, manaMax: 100 } };
  const enemy = { ...hero, id: 'held-target', side: 'enemy' as const, kind: 'monster' as const };
  const input = { seed: 7, maxRounds: 2, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(input);
  const { signatureSkillId: _signature, ...withoutSignature } = owned;
  const withoutAura = mercToCombatUnit({ ...withoutSignature,
    comboOrder: owned.comboOrder.filter(id => id !== 'aura-battle-orders') });
  const control = runBattleRecorded({ ...input,
    playerTeam: [hero, { ...withoutAura, statuses: [hold] }] });
  const controlHero = control.result.playerTeam.find(unit => unit.id === hero.id);
  expect(controlHero?.stats[scenario.stat]).toBe(scenario.base);
  expect(controlHero?.[scenario.resource]).toBe(scenario.current);
  const result = runBattleRecorded(input);
  const finalHero = result.result.playerTeam.find(unit => unit.id === hero.id);
  expect(finalHero?.stats[scenario.stat]).toBe(scenario.boosted);
  expect(finalHero?.[scenario.resource]).toBe(scenario.current);
  expect(result.events.some(e => e.kind === 'action' && e.skillId === 'aura-battle-orders')).toBe(false);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(result);
});
