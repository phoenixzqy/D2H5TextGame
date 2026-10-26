/** Unearned native composition; real registered payment and opaque engine carry. */
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const MAGE = 'necromancer.raise_skeletal_mage', COMMAND = 'barbarian.battle_command';
const FINISH = 'fixture.native-mage-command-finish';
const HOLD = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function reset() {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
beforeEach(() => {
  reset();
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 60, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [2000000000, 2000000000] }] });
});
afterEach(reset);

it.each([[1, 2], [6, 4], [20, 9]])('retains native Mage rank%i authority across a paid party wave', (rank, count) => {
  const hero = playerToCombatUnit({ ...createMockPlayer('Unearned native Mage', 'necromancer'),
    id: 'native-mage', level: 30, comboOrder: [MAGE],
    skillLevels: { 'necromancer.raise_skeleton': 1, [MAGE]: rank } });
  const commander = playerToCombatUnit({ ...createMockPlayer('Unearned native Command', 'barbarian'),
    id: 'native-commander', level: 30, comboOrder: [COMMAND],
    skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1,
      'barbarian.battle_orders': 1, [COMMAND]: 1 } });
  expect(hero.skillOrder).toContain(MAGE);
  expect(hero.skillLevels?.[MAGE]).toBe(rank);
  expect(commander.battleCommandRank).toBe(1);
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster',
    life: 1000000, mana: 0, stats: { ...hero.stats, lifeMax: 1000000, attack: 0 },
    statuses: [HOLD], skillOrder: [], skillLevels: {} };
  const first = runBattleRecorded({ seed: 7, playerTeam: [
    { ...commander, mana: 11, skillOrder: [COMMAND, FINISH] },
    { ...hero, skillOrder: [], statuses: [HOLD] }], enemyTeam: [target] });
  expect(first.result.winner).toBe('player');
  expect(first.events.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(1);
  const carry = first.battleCommandCarry;
  if (!carry) throw new Error('Missing native paid party carry');
  const snapshot = { seed: 19, playerTeam: [{ ...hero, mana: 22, statuses: [HOLD] }], enemyTeam: [target] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot, carry);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot, carry)).toEqual(out);
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh).toHaveLength(count);
  fresh.forEach((event, i) => {
    expect(event.unit.stats).toMatchObject({ lifeMax: 88 + 7 * rank, attack: 30 + 3 * rank });
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === event.unit.id);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.kind === 'damage' &&
      e.damageType === ['fire', 'cold', 'lightning', 'poison'][i % 4])).toBe(true);
  });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: hero.id, mana: 0, simClockMs: 0 })]);
  expect(out.result.enemyTeam[0]?.life).toBeLessThan(target.life);
});
