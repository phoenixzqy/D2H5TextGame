import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit, ActiveStatus } from './types';
import type { DerivedStats, DamageType } from '../types/attributes';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

const stats: DerivedStats = {
  life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 100,
  defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});
type ReflectingUnit = CombatUnit & { readonly physicalReflectionPct?: number };
function unit(id: string, side: CombatUnit['side'], patch: Partial<ReflectingUnit> = {}): ReflectingUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 70, tier: 'trash', stats, life: 1000, mana: 100, statuses: [hold()],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
function scenario(type: DamageType = 'physical', bearer: Partial<ReflectingUnit> = {},
  attacker: Partial<ReflectingUnit> = {}): CombatSnapshot {
  registerSkill({ id: 'fixture.reflection-hit', archetype: 'fixture', minLevel: 1,
    target: 'all-enemies', manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  return { seed: 7,
    playerTeam: [unit('bearer', 'player', { physicalReflectionPct: .2, ...bearer })],
    enemyTeam: [unit('attacker', 'enemy', { statuses: [hold(1701)],
      skillOrder: ['fixture.reflection-hit'], ...attacker })] };
}
const reflected = (result: ReturnType<typeof runBattleRecorded>) => result.events.filter(e =>
  e.kind === 'damage' && e.damageType === 'thorns');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Bramble bounded direct reflection', () => {
  it.each(['hero', 'merc'] as const)('reflects actual HP lost for a surviving %s, with deterministic replay', kind => {
    const input = scenario('physical', { kind,
      stats: { ...stats, defense: 7, resistances: { ...stats.resistances, physical: 25 } } });
    const before = structuredClone(input), result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', target: 'bearer', damageType: 'physical', amount: 68 }),
      expect.objectContaining({ source: 'bearer', target: 'attacker', damageType: 'thorns',
        amount: 13, crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(result.result.playerTeam[0]?.life).toBe(932);
    expect(result.result.enemyTeam[0]?.life).toBe(987);
    expect(runBattle(input)).toEqual(result.result);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(input).toEqual(before);
  });
  it('uses the attacker physical resistance/defense and minimum1, ignoring dodge/crit/combo/damage boosts', () => {
    const input = scenario('physical', { increasedDamagePct: { thorns: 99 },
      stats: { ...stats, critChance: 1, critDamage: 100 } }, {
      physicalReflectionPct: .2, stats: { ...stats, defense: 2, physDodge: 1,
        resistances: { ...stats.resistances, physical: 25 } }
    });
    expect(reflected(runBattleRecorded(input))).toEqual([
      expect.objectContaining({ amount: 13, crit: false, dodged: false })
    ]);
    const attacker = input.enemyTeam[0];
    if (!attacker) throw new Error('Missing attacker');
    expect(reflected(runBattleRecorded({ ...input, enemyTeam: [{ ...attacker,
      stats: { ...attacker.stats, defense: 999 } }] }))).toEqual([
      expect.objectContaining({ amount: 1 })
    ]);
  });
  it.each(['fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
    'does not reflect direct %s', type => { expect(reflected(runBattleRecorded(scenario(type)))).toEqual(
      type === 'thorns' ? [expect.objectContaining({ source: 'attacker', amount: 100 })] : []); });
  it.each([0, 50, 100])('does not retaliate when the bearer starts at %s HP and cannot survive', life => {
    expect(reflected(runBattleRecorded(scenario('physical', { life })))).toEqual([]);
  });
  it('does not reflect a miss or periodic physical damage', () => {
    // Dodge retains the existing 5% hit floor; seed8 actually misses that roll.
    const miss = runBattleRecorded({ ...scenario('physical', { stats: { ...stats, physDodge: 1 } }), seed: 8 });
    expect(miss.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', dodged: true, amount: 0 })
    ]);
    expect(reflected(miss)).toEqual([]);
    const input = scenario();
    expect(reflected(runBattleRecorded({ ...input,
      playerTeam: [unit('bearer', 'player', { physicalReflectionPct: .2, statuses: [hold(), {
        id: 'poison', sourceId: 'attacker', stacks: 1, remaining: -1,
        damageType: 'physical', dotPerStack: 1
      }] })], enemyTeam: [unit('attacker', 'enemy')] }))).toEqual([]);
  });
  it('consumes the same battle RNG as a no-reflection control when death topology is unchanged', () => {
    const input = scenario(), control = { ...input, playerTeam: input.playerTeam.map(u =>
      ({ ...u, physicalReflectionPct: 0 })) };
    const tails: number[] = [], calls: unknown[][] = [];
    for (const snapshot of [input, control]) {
      const random = rngModule.createRng(7), chance = vi.spyOn(random, 'chance');
      vi.spyOn(rngModule, 'createRng').mockReturnValueOnce(random);
      runBattleRecorded(snapshot); calls.push(chance.mock.calls); tails.push(random.next());
      vi.restoreAllMocks();
    }
    expect(calls[0]).toEqual(calls[1]); expect(tails[0]).toBe(tails[1]);
  });
  it('closes reflected death once and prevents later AoE targets and later skill effects', () => {
    const input = scenario('physical', {}, { life: 10 });
    registerSkill({ id: 'fixture.reflection-hit', archetype: 'fixture', minLevel: 1,
      target: 'all-enemies', manaCost: 0, cooldown: 1, effects: [
        { kind: 'damage', damageType: 'physical', base: [100, 100] },
        { kind: 'buff', id: 'must-not-apply-after-death', duration: -1 },
        { kind: 'damage', damageType: 'fire', base: [100, 100] }
      ] });
    const result = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam,
      unit('bystander', 'player', { kind: 'merc' })] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', target: 'bearer', damageType: 'physical', amount: 100 }),
      expect.objectContaining({ source: 'bearer', target: 'attacker', damageType: 'thorns', amount: 20 })
    ]);
    expect(result.events.filter(e => e.kind === 'death')).toEqual([
      expect.objectContaining({ target: 'attacker' })
    ]);
    expect(result.result.winner).toBe('player');
    expect(result.result.playerTeam.find(u => u.id === 'bystander')?.life).toBe(1000);
    expect(result.result.enemyTeam[0]?.activeBuffIds).toEqual([]);
  });
});
