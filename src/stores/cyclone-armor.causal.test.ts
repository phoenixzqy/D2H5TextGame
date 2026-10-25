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

it.each([1, 20])('BUG191 native paid rank%i reduces actual incoming HP loss', rank => {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Cyclone Armor', 'druid'),
    id: 'cyclone-fixture-hero', level: 30, comboOrder: ['skills-druid-cyclone-armor'],
    skillLevels: { 'druid.arctic_blast': 1, 'druid.cyclone_armor': rank } });
  const hero: CombatUnit = { ...native, life: 1000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(501)] };
  registerSkill({ id: 'fixture.cyclone-hit', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, cooldown: 100, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100] }] });
  const enemy: CombatUnit = { ...hero, id: 'fixture-enemy', side: 'enemy', kind: 'monster',
    skillOrder: ['fixture.cyclone-hit'], skillLevels: {}, activeBuffIds: [],
    stats: { ...hero.stats, attackSpeed: 100 }, statuses: [hold(1701)] };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] }, before = structuredClone(input);
  const r = runBattleRecorded(input);
  expect(r.events.filter(e => e.kind === 'buff')).toEqual([
    expect.objectContaining({ target: hero.id, buffId: 'cyclone-armor', simClockMs: 500 })]);
  expect(r.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ target: hero.id, amount: rank === 1 ? 97 : 40,
      cycloneAbsorbed: rank === 1 ? 2 : 40, simClockMs: 1700 })]);
  expect(r.result.playerTeam[0]?.life).toBe(rank === 1 ? 903 : 960);
  expect(r.result.playerTeam[0]?.mana).toBe(rank === 1 ? 83 : 87);
  expect(r.result.playerTeam[0]?.stats).toEqual(hero.stats);
  expect(runBattleRecorded(input)).toEqual(r); expect(input).toEqual(before);
});
