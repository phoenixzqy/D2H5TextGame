import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: at });
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 20])('BUG199 native paid Holy Shield rank%i reduces actual incoming HP loss', rank => {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Holy Shield', 'paladin'),
    id: 'holy-shield-fixture-hero', level: 30, comboOrder: ['skills-paladin-holy-shield'],
    skillLevels: { 'paladin.smite': 1, 'paladin.charge': 1, 'paladin.holy_shield': rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, defense: 100, magicResist: 0,
      attackSpeed: 250, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(501)] };
  registerSkill({ id: 'fixture.holy-shield-hit', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, cooldown: 100, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [1000, 1000] }] });
  const enemy: CombatUnit = { ...hero, id: 'fixture-enemy', side: 'enemy', kind: 'monster',
    skillOrder: ['fixture.holy-shield-hit'], skillLevels: {}, activeBuffIds: [],
    stats: { ...hero.stats, attackSpeed: 100 }, statuses: [hold(1701)] };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] }, before = structuredClone(input);
  const r = runBattleRecorded(input);
  expect(r.events.filter(e => e.kind === 'buff')).toEqual([
    expect.objectContaining({ target: hero.id, buffId: 'holy-shield', simClockMs: 500 })]);
  // +4%/+80% defense first: 1000 - 104/180 = 896/820; then floor(2%/40%) absorption.
  expect(r.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ target: hero.id, amount: rank === 1 ? 879 : 492, simClockMs: 1700 })]);
  expect(r.result.playerTeam[0]?.life).toBe(rank === 1 ? 1121 : 1508);
  expect(r.result.playerTeam[0]?.mana).toBe(rank === 1 ? 65 : 69);
  expect(r.result.playerTeam[0]?.stats).toEqual(hero.stats);
  expect(runBattleRecorded(input)).toEqual(r); expect(input).toEqual(before);
});
