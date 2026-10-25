import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

// Synthetic native-composition fixtures; no earned progression or balance claim.
function player(rank: number, fields: Partial<Player> = {}): Player {
  return { ...createMockPlayer('Energy Shield fixture', 'sorceress'),
    id: 'shield-hero', level: 30, comboOrder: [],
    skillLevels: { 'sorceress.telekinesis': 1, 'sorceress.teleport': 1,
      'sorceress.energy_shield': rank }, ...fields };
}
function reset() {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset(); useMapStore.getState().reset();
}
beforeEach(reset); afterEach(reset);

function firstHit(p: Player, mana = 1000) {
  const native = playerToCombatUnit(p);
  const stats = { ...native.stats, lifeMax: 100000, manaMax: 1000,
    attackSpeed: 1, attack: 1, defense: 0, magicResist: 0, critChance: 0,
    physDodge: 0, magicDodge: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } };
  const hero: CombatUnit = { ...native, stats, life: 100000, mana,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 };
  const enemy: CombatUnit = { ...hero, id: 'shield-attacker', kind: 'monster', side: 'enemy',
    skillLevels: {}, stats: { ...stats, attackSpeed: 1000, attack: 100 },
    attackRange: [100, 100] };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
  const result = runBattle(input);
  expect(runBattle(input)).toEqual(result);
  const hit = result.events.find(e => e.kind === 'damage' && e.target === hero.id);
  const payment = result.events.find(e => e.kind === 'mana' && e.target === hero.id);
  if (hit?.kind !== 'damage') throw new Error('Missing fixed 100-damage hit');
  return { amount: hit.amount, mana: payment?.kind === 'mana' ? payment.mana : mana };
}

describe('native Energy Shield changes real incoming damage and ordinary recovery', () => {
  it.each([{ rank: 1, damage: 97, mana: 997 }, { rank: 20, damage: 40, mana: 940 }])(
    'diverts actual damage at rank $rank, paying one MP per prevented HP', row => {
      expect(firstHit(player(row.rank))).toEqual({ amount: row.damage, mana: row.mana });
    });
  it('spends only available mana and sends the uncovered remainder to life', () => {
    expect(firstHit(player(20), 10)).toEqual({ amount: 90, mana: 0 });
  });
  it.each([1, 20])('applies authored ordinary mana recovery at rank%s without raising maximum MP', rank => {
    const base = playerToCombatUnit(player(0)), shield = playerToCombatUnit(player(rank));
    expect(shield.manaRegenPerSecond).toBeCloseTo((base.manaRegenPerSecond ?? 0) * (1 + .02 * rank), 12);
    expect(shield.manaRegenBaselinePerSecond).toBe(shield.manaRegenPerSecond);
    expect(shield.stats.manaMax).toBe(base.stats.manaMax);
    expect(shield.mana).toBe(base.mana);
  });
  it.each([
    player(0), player(20, { class: 'barbarian' }), player(20, { level: 23 }),
    player(20, { skillLevels: { 'sorceress.energy_shield': 20 } })
  ])('does not grant power from an unlearned, foreign, locked or prerequisite-less allocation', p => {
    expect(firstHit(p)).toEqual({ amount: 100, mana: 1000 });
  });
});
