import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const id = 'skills-necromancer-blood-golem';
/** Native skill/preparation/body; synthetic pools and two-sided injury isolate missing recovery. */
function fixture(rank: number, learned = true, mana = 100) {
  const native = playerToCombatUnit({
    ...createMockPlayer('Blood Golem Repro', 'necromancer'), id: 'hero', level: 30,
    skillLevels: { 'skills-necromancer-clay-golem': 1, 'skills-necromancer-golem-mastery': 1,
      ...(learned ? { [id]: rank } : {}) }, comboOrder: [id]
  });
  const hero: CombatUnit = { ...native, life: 500, mana,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0',
    stats: { ...native.stats, life: 500, lifeMax: 1000, mana, manaMax: 1000,
      attack: 100, attackSpeed: 0, critChance: 0 }, statuses: [] };
  const target: CombatUnit = { ...hero, id: 'target', name: 'Synthetic injury target',
    side: 'enemy', kind: 'monster', life: 1000000, mana: 0, skillOrder: [], skillLevels: {},
    basicAttack: { damageType: 'physical', damage: [20, 20] },
    stats: { ...hero.stats, life: 1000000, lifeMax: 1000000, attackSpeed: 300,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    // Eight real ordinary enemy attacks can injure the paid body; then stop the enemy.
    statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1,
      remaining: -1, appliedAtMs: 3201 }] };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset();
});
describe('native Blood Golem missing recovery', () => {
  it.each([1, 2, 20])('rank%i pays and attacks but must restore actual friendly HP', rank => {
    const input = fixture(rank), before = structuredClone(input), recorded = runBattleRecorded(input);
    const created = recorded.events.filter(e => e.kind === 'summon'); expect(created).toHaveLength(1);
    const body = created[0]; if (!body) throw new Error('Missing native paid Blood Golem');
    expect(body.summonId).toBe('blood_golem'); expect(body.simClockMs).toBe(0);
    expect(recorded.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 75, simClockMs: 0 })
    ]);
    expect(recorded.events.some(e => e.kind === 'damage' && e.source === 'hero' && e.amount > 0)).toBe(true);
    expect(recorded.events.some(e => e.kind === 'damage' && e.source === body.unit.id && e.amount > 0)).toBe(true);
    expect(recorded.events.some(e => e.kind === 'damage' && e.target === body.unit.id && e.amount > 0)).toBe(true);
    expect(recorded.result.enemyTeam[0]?.life).toBeGreaterThan(0); // No kill/orb recovery can mask the result.
    expect(input).toEqual(before);
    // Broad diagnosis only: both friendly damage sources are injured. The complete
    // contract must still pin beneficiary, damage kinds,10%,rounding and living-body rules.
    const healed = recorded.events.reduce((sum, e) => sum +
      (e.kind === 'heal' && (e.target === 'hero' || e.target === body.unit.id) ? e.amount : 0), 0);
    expect(healed).toBeGreaterThan(0);
  });
  it('does not grant recovery or charge for an unlearned slotted Blood Golem', () => {
    const recorded = runBattleRecorded(fixture(1, false));
    expect(recorded.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'heal')).toEqual([]);
  });
  it('does not grant a body, payment or recovery below the actual25MP preparation cost', () => {
    const recorded = runBattleRecorded(fixture(1, true, 24));
    expect(recorded.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'heal')).toEqual([]);
  });
});
