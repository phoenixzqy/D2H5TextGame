import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 20])('BUG200 native Conversion rank%i redirects the real monster attack away from the hero', rank => {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Conversion', 'paladin'),
    id: 'conversion-hero', level: 30, comboOrder: ['skills-paladin-conversion'],
    skillLevels: { 'paladin.sacrifice': 1, 'paladin.zeal': 1,
      'paladin.vengeance': 1, 'paladin.conversion': rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, attack: 1, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(1701)] };
  const monster: CombatUnit = { id: 'converted-monster', name: 'Synthetic ordinary monster',
    side: 'enemy', kind: 'monster', tier: 'trash', level: 30,
    life: 2000, mana: 0, stats: { ...hero.stats, attack: 100, attackSpeed: 80 },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold(1861)], enraged: false };
  const ally: CombatUnit = { ...monster, id: 'former-ally', statuses: [hold()] };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [monster, ally] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === hero.id)).toEqual([
    expect.objectContaining({ skillId: 'paladin.conversion', simClockMs: 1700 })]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === monster.id)).toEqual([
    expect.objectContaining({ target: ally.id, amount: 100, simClockMs: 1860 })]);
  expect(out.result.playerTeam[0]?.life).toBe(2000);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
  expect(out.result.enemyTeam.find(u => u.id === ally.id)?.life).toBe(1900);
  expect(out.result.enemyTeam.every(u => u.side === 'enemy')).toBe(true);
  expect(out.result.winner).toBeNull();
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
});
