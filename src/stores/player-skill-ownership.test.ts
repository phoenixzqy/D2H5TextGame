import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

// Synthetic eligibility fixtures. These do not constitute earned build/balance evidence.
function player(fields: Partial<Player> = {}): Player {
  return { ...createMockPlayer('Synthetic ownership', 'barbarian'),
    id: 'fixture-ownership-hero', level: 30, comboOrder: ['barbarian.bash'], skillLevels: {}, ...fields };
}
function fight(p: Player) {
  const native = playerToCombatUnit(p);
  const hero: CombatUnit = { ...native, life: 100000, mana: 1000,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 100000, manaMax: 1000, attackSpeed: 100,
      critChance: 0, physDodge: 0, magicDodge: 0 } };
  const dummy: CombatUnit = { ...hero, id: 'fixture-ownership-dummy', side: 'enemy', kind: 'monster', life: 1,
    skillOrder: [], skillLevels: {}, statuses: [],
    stats: { ...hero.stats, lifeMax: 1, attackSpeed: 1, attack: 1, defense: 0 } };
  const snapshot = { seed: 7, playerTeam: [hero], enemyTeam: [dummy], maxRounds: 1 };
  const result = runBattle(snapshot);
  expect(runBattle(snapshot)).toEqual(result);
  const actions = result.events.filter((event): event is Extract<BattleEvent, { kind: 'action' }> =>
    event.kind === 'action' && event.actor === hero.id);
  expect(actions).toHaveLength(1);
  return { result, action: actions[0], native };
}
function reset() {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset(); useMapStore.getState().reset();
}
beforeEach(reset); afterEach(reset);

describe('native class-active ownership reaches actual seeded combat', () => {
  it('uses a basic attack when an unlearned Bash is configured', () => {
    const { action, result } = fight(player());
    expect.soft(action?.skillId).toBeNull();
    expect(result.playerTeam[0]?.mana).toBe(1000);
  });
  it('refuses a foreign Ice Blast even when its rank and prerequisite are imported', () => {
    const { action, result } = fight(player({ comboOrder: ['sorceress.ice_blast'],
      skillLevels: { 'sorceress.ice_bolt': 1, 'sorceress.ice_blast': 20 } }));
    expect.soft(action?.skillId).toBeNull();
    expect(result.playerTeam[0]?.mana).toBe(1000);
  });
  it.each(['barbarian', 'amazon'] as const)('refuses an unauthored class stub for %s despite imported allocation', classId => {
    const { action, result } = fight(player({ class: classId, comboOrder: ['amazon.piercing_strike'],
      skillLevels: { 'amazon.piercing_strike': 20 } }));
    expect.soft(action?.skillId).toBeNull();
    expect(result.playerTeam[0]?.mana).toBe(1000);
  });
  it.each([undefined, NaN, Infinity, -Infinity, -1, 0, 1.5, 21])(
    'refuses malformed or absent Bash allocation %s without inventing rank one', rank => {
      const p = player({ skillLevels: rank === undefined ? {} : { 'barbarian.bash': rank } });
      expect(fight(p).action?.skillId).toBeNull();
    });
  it('requires Ice Bolt before learned Ice Blast', () => {
    expect(fight(player({ class: 'sorceress', comboOrder: ['sorceress.ice_blast'],
      skillLevels: { 'sorceress.ice_blast': 1 } })).action?.skillId).toBeNull();
  });
  it('requires the whole Glacial Spike prerequisite chain', () => {
    expect(fight(player({ class: 'sorceress', comboOrder: ['sorceress.glacial_spike'],
      skillLevels: { 'sorceress.ice_blast': 1, 'sorceress.glacial_spike': 1 } })).action?.skillId).toBeNull();
  });
  it.each([0, -1, 5, 5.5, 30.5, NaN, Infinity])('refuses an invalid or locked owner level %s', level => {
    expect(playerToCombatUnit(player({ class: 'sorceress', level, comboOrder: ['sorceress.ice_blast'],
      skillLevels: { 'sorceress.ice_bolt': 1, 'sorceress.ice_blast': 1 } })).skillOrder).toEqual([]);
  });
  it.each([1, 20])('valid Bash rank%s casts, pays five MP and retains deterministic damage', rank => {
    const { action, result } = fight(player({ skillLevels: { 'barbarian.bash': rank } }));
    expect(action?.skillId).toBe('barbarian.bash');
    expect(result.playerTeam[0]?.mana).toBe(995);
    const hits = result.events.filter((event): event is Extract<BattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === 'fixture-ownership-hero');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.amount).toBeGreaterThanOrEqual(50 + (rank - 1) * 5);
  });
  it('takes the maximum valid allocation alias once and preserves persisted configuration', () => {
    const p = player({ comboOrder: ['skills-barbarian-bash'],
      skillLevels: { 'barbarian.bash': 1, 'skills-barbarian-bash': 20, 'fixture.keep': 4 } });
    const before = structuredClone(p);
    Object.freeze(p.comboOrder); Object.freeze(p.skillLevels); Object.freeze(p);
    const actual = fight(p), control = fight(player({ skillLevels: { 'barbarian.bash': 20 } }));
    expect.soft(actual.native.skillLevels).toEqual({ 'barbarian.bash': 20, 'fixture.keep': 4 });
    expect(actual.result.events).toEqual(control.result.events);
    expect(p).toEqual(before);
  });
  it('removes known passives and selected auras from the combat priority copy only', () => {
    const p = player({ comboOrder: ['barbarian.iron_skin', 'paladin.holy_fire', 'fixture.unrelated'],
      skillLevels: { 'barbarian.iron_skin': 1, 'paladin.holy_fire': 1 } });
    expect(playerToCombatUnit(p).skillOrder).toEqual(['fixture.unrelated']);
    expect(p.comboOrder).toEqual(['barbarian.iron_skin', 'paladin.holy_fire', 'fixture.unrelated']);
  });
});
