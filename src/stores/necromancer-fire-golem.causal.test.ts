import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const id = 'skills-necromancer-fire-golem';
function fixture(rank: number, learned = true) {
  const player = {
    ...createMockPlayer('Synthetic Fire Golem', 'necromancer'),
    id: 'hero', level: 30,
    skillLevels: {
      'skills-necromancer-clay-golem': 1,
      'skills-necromancer-golem-mastery': 1,
      'skills-necromancer-blood-golem': 1,
      'skills-necromancer-iron-golem': 1,
      ...(learned ? { [id]: rank } : {})
    },
    comboOrder: [id]
  };
  const native = playerToCombatUnit(player);
  const hero: CombatUnit = {
    ...native, life: 10000, mana: 100, manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0, manaRegenCarry: 0, manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 1000,
      manaMax: 1000, attack: 1, critChance: 0 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1, remaining: -1 }]
  };
  const target: CombatUnit = {
    ...hero, id: 'target', name: 'Held synthetic target', kind: 'monster', side: 'enemy',
    life: 1000000, mana: 0, skillOrder: [], skillLevels: {},
    stats: { ...hero.stats, life: 1000000, lifeMax: 1000000, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
});
describe('native Fire Golem combat promise', () => {
  it.each([1, 2, 20])('rank%i pays once and deals actual Fire and Burn damage', rank => {
    const input = fixture(rank), before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    const created = recorded.events.filter(e => e.kind === 'summon');
    expect(created).toHaveLength(1);
    const body = created[0];
    if (!body) throw new Error('Missing paid Fire Golem');
    expect(body.summonId).toBe('fire_golem');
    expect(body.simClockMs).toBe(0);
    expect(recorded.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 65, simClockMs: 0 })
    ]);
    const direct = recorded.events.filter(e => e.kind === 'damage' && e.source === body.unit.id);
    expect(direct.length).toBeGreaterThan(0);
    expect(direct.every(e => e.kind === 'damage' && e.damageType === 'fire')).toBe(true);
    expect(recorded.events.some(e => e.kind === 'status-state' && e.target === 'target' &&
      e.statuses.some(s => s.id === 'ignite' && s.sourceId === body.unit.id &&
        s.damageType === 'fire' && (s.dotPerStack ?? 0) > 0))).toBe(true);
    const directLoss = direct.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
    const periodicLoss = recorded.events.reduce((sum, e) => sum +
      (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0);
    expect(periodicLoss).toBeGreaterThan(0);
    expect(recorded.result.enemyTeam[0]?.life).toBe(1000000 - directLoss - periodicLoss);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(runBattle(input)).toEqual(recorded.result);
  });
  it('does not prepare an unlearned slotted skill', () => {
    const recorded = runBattleRecorded(fixture(1, false));
    expect(recorded.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
});
