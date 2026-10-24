import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import type { DamageType, DerivedStats } from '@/engine/types/attributes';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { mercToCombatUnit } from './mercToCombatUnit';
import { createMercFromDef } from './mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';
import * as rngModule from '@/engine/rng';

const MASTERY = 'sorceress.cold_mastery';
const AUTHORED = 'skills-sorceress-cold-mastery';
const stats: DerivedStats = {
  life: 1000, lifeMax: 1000, mana: 200, manaMax: 200, attack: 100,
  defense: 0, magicResist: 10, attackSpeed: 100, critChance: 0, critDamage: 2,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { fire: 50, cold: 50, lightning: 50, poison: 50, arcane: 50, physical: 50 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});
function input(levels: Record<string, number>, type: DamageType = 'cold',
  level = 30, classId: 'sorceress' | 'amazon' = 'sorceress') {
  const fresh = createMockPlayer('ColdMasteryProbe', classId);
  // Factory supplies the real learned-passive projection; only combat power/cadence
  // is normalized so a literal100 hit isolates resistance from unrelated formulas.
  const composed = playerToCombatUnit({ ...fresh, level, skillLevels: levels, comboOrder: [] });
  const hero: CombatUnit = { ...composed, stats, life: 1000, mana: 200,
    manaRegenPerSecond: 0, skillOrder: [AUTHORED, 'fixture.cold-mastery-probe'],
    statuses: [hold(1701)] };
  const target: CombatUnit = { id: 'target', name: 'target', side: 'enemy', level: 30,
    tier: 'trash', stats, life: 1000, mana: 200, statuses: [hold()], cooldowns: {},
    skillOrder: [], activeBuffIds: [], enraged: false };
  registerSkill({ id: 'fixture.cold-mastery-probe', archetype: 'fixture',
    target: 'single-enemy', manaCost: 0, cooldown: 1, minLevel: 1,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills();
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Cold Mastery through production hero composition and damage', () => {
  it.each([{ rank: 0, damage: 40 }, { rank: 1, damage: 55 },
    { rank: 2, damage: 59 }, { rank: 20, damage: 131 }])(
    'rank$rank reduces only source cold resistance before magic mitigation ($damage)', ({ rank, damage }) => {
      const source = input({ [MASTERY]: rank }); const before = structuredClone(source);
      const result = runBattleRecorded(source);
      expect(result.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ source: source.playerTeam[0]?.id, target: 'target',
          damageType: 'cold', amount: damage, crit: false, dodged: false, simClockMs: 1700 })]);
      expect(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'fixture.cold-mastery-probe' })]);
      expect(result.events.filter(e => e.kind === 'buff' || e.kind === 'status')).toEqual([]);
      expect(result.result.enemyTeam[0]?.stats).toEqual(stats);
      expect(result.result.playerTeam[0]?.mana).toBe(200);
      expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
      expect(source).toEqual(before);
      expect(runBattleRecorded(source)).toEqual(result);
    });

  it.each(['fire', 'lightning', 'arcane', 'poison', 'physical', 'thorns'] as const)(
    'does not boost %s damage', type => {
      const result = runBattleRecorded(input({ [MASTERY]: 20 }, type));
      const damage = type === 'lightning' || type === 'arcane' ? 40 : 50;
      expect(result.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ damageType: type, amount: damage })]);
    });

  it.each([
    { rank: 1, resistance: 100, penalty: 0, damage: 15 },
    { rank: 20, resistance: 150, penalty: 0, damage: 31 },
    { rank: 20, resistance: -50, penalty: 0, damage: 190 },
    { rank: 1, resistance: 50, penalty: 10, damage: 65 }
  ])('penetrates before act penalty/clamp then flat MR: %#', ({ rank, resistance, penalty, damage }) => {
    const source = input({ [MASTERY]: rank });
    const target = source.enemyTeam[0]; if (!target) throw new Error('Missing fixture target');
    source.enemyTeam = [{ ...target, resistPenalty: penalty,
      stats: { ...stats, resistances: { ...stats.resistances, cold: resistance } } }];
    expect(runBattleRecorded(source).events.filter(e => e.kind === 'damage'))
      .toEqual([expect.objectContaining({ amount: damage })]);
  });

  it.each([
    { mercId: 'mercs/act3-iron-wolf-cold', heroDamage: 131, mercDamage: 40 },
    { mercId: 'mercs/act2-holy-freeze', heroDamage: 159, mercDamage: 50 }
  ])('keeps penetration personal alongside $mercId', ({ mercId, heroDamage, mercDamage }) => {
    const source = input({ [MASTERY]: 20 });
    // Seed1 lands both actors' hits; seed7's second actor legitimately misses.
    source.seed = 1;
    const def = loadMercPool().pool.find(def => def.id === mercId);
    if (!def) throw new Error('Missing native mercenary definition');
    const merc = mercToCombatUnit(createMercFromDef(def, 'cold-control'));
    expect(merc.coldResistanceReductionPct).toBeUndefined();
    source.playerTeam.push({ ...merc, stats, life: 1000, mana: 200,
      skillOrder: ['fixture.cold-mastery-probe'], statuses: [hold(1701)] });
    const result = runBattleRecorded(source);
    expect(result.events.filter(e => e.kind === 'damage')).toHaveLength(2);
    expect(result.events.filter(e => e.kind === 'damage')).toEqual(expect.arrayContaining([
      // Holy Freeze adds20% cold to both actors, but only the hero penetrates91 points.
      // Hero: floor(100*1.2*1.41-10)=159; merc: floor(100*1.2*.5-10)=50.
      expect.objectContaining({ source: source.playerTeam[0]?.id, amount: heroDamage }),
      expect.objectContaining({ source: merc.id, amount: mercDamage })]));
    expect(result.result.enemyTeam[0]?.stats.resistances.cold).toBe(50);
  });

  it.each([[0, 43], [1, 58], [20, 139]])('real rank20 Ice Bolt at Mastery%s hits%s and retains Chill/cost', (rank, damage) => {
    const source = input({ [MASTERY]: rank, 'sorceress.ice_bolt': 20 });
    const hero = source.playerTeam[0]; if (!hero) throw new Error('Missing fixture hero');
    source.playerTeam = [{ ...hero, skillOrder: [AUTHORED, 'skills-sorceress-ice-bolt'] }];
    const result = runBattleRecorded(source);
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: damage, damageType: 'cold' })]);
    expect(result.events.filter(e => e.kind === 'status')).toEqual([
      expect.objectContaining({ target: 'target', statusId: 'chill' })]);
    expect(result.result.playerTeam[0]?.mana).toBe(190);
  });

  it('preserves the real spell hit/range/critical/status RNG stream', () => {
    const calls = [];
    for (const rank of [0, 20]) {
      const random = rngModule.createRng(7);
      const chance = vi.spyOn(random, 'chance'); const range = vi.spyOn(random, 'nextInt');
      vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
      const source = input({ [MASTERY]: rank, 'sorceress.ice_bolt': 20 });
      const hero = source.playerTeam[0]; if (!hero) throw new Error('Missing fixture hero');
      source.playerTeam = [{ ...hero, skillOrder: ['skills-sorceress-ice-bolt'] }];
      runBattleRecorded(source);
      calls.push({ chance: chance.mock.calls, range: range.mock.calls });
      expect(range.mock.calls).toEqual([[106, 121]]);
      vi.restoreAllMocks();
    }
    expect(calls[1]).toEqual(calls[0]);
  });

  it.each([
    { levels: { [MASTERY]: 20 }, level: 29, classId: 'sorceress' as const, damage: 40 },
    { levels: { [MASTERY]: 20 }, level: 30, classId: 'amazon' as const, damage: 40 },
    { levels: { [AUTHORED]: 20, [MASTERY]: 1 }, level: 30, classId: 'sorceress' as const, damage: 131 },
    { levels: { [MASTERY]: 1, [AUTHORED]: 20 }, level: 30, classId: 'sorceress' as const, damage: 131 },
    { levels: { [MASTERY]: 99 }, level: 30, classId: 'sorceress' as const, damage: 131 },
    { levels: { [MASTERY]: 1.5 }, level: 30, classId: 'sorceress' as const, damage: 40 }
  ])('uses eligible allocated ranks once: $levels at $classId level $level', ({ levels, level, classId, damage }) => {
    expect(runBattleRecorded(input(levels, 'cold', level, classId)).events.filter(e => e.kind === 'damage'))
      .toEqual([expect.objectContaining({ amount: damage })]);
  });
});
