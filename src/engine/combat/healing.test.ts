import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import type { RegisteredSkill, SkillEffect } from '../skills/effects';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

const stats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 10, manaMax: 10, attack: 1, defense: 0, magicResist: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});
function unit(id: string, overrides: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side: 'player', kind: 'merc', level: 5, tier: 'trash',
    stats, life: 200, mana: 10, statuses: [hold()], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, ...overrides };
}
function healer(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return unit('healer', { stats: { ...stats, attackSpeed: 263 }, statuses: [hold(401)],
    skillOrder: ['fixture.recovery'], ...overrides });
}
function scenario(effects: readonly SkillEffect[], overrides: Partial<RegisteredSkill> = {},
  team = [unit('hero', { kind: 'hero', life: 100 }), healer()]): CombatSnapshot {
  registerSkill({ id: 'fixture.recovery', archetype: 'fixture', minLevel: 1,
    target: 'single-ally', manaCost: 5, cooldown: 4, effects, ...overrides });
  return { seed: 1, playerTeam: team,
    enemyTeam: [unit('enemy', { side: 'enemy', kind: 'monster', life: 100 })] };
}
function rngSpies(seed = 1) {
  const random = rngModule.createRng(seed);
  const range = vi.spyOn(random, 'nextInt');
  const chance = vi.spyOn(random, 'chance');
  vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
  return { random, range, chance };
}
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('heal recipient eligibility and actual restoration', () => {
  it('selects 40/100 ahead of 100/200 by life ratio', () => {
    const input = scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }),
      unit('injured', { life: 40, stats: { ...stats, lifeMax: 100 } }), healer()
    ]);
    const result = runBattleRecorded(input);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([100, 65, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'injured', amount: 25, simClockMs: 400 })
    ]);
  });

  it('uses life ratio even when the other candidate has lower absolute HP', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }),
      unit('small', { life: 90, stats: { ...stats, lifeMax: 100 } }), healer()
    ]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([125, 90, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 25 })
    ]);
  });

  it.each([false, true])('breaks equal ratios by battle insertion order (reversed=%s)', reverse => {
    const tied = [unit('first', { life: 40, stats: { ...stats, lifeMax: 100 } }),
      unit('second', { life: 80 })];
    if (reverse) tied.reverse();
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 10, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero' }), ...tied, healer()
    ]));
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: reverse ? 'second' : 'first', amount: 10 })
    ]);
  });

  it.each(['healer', 'summon'])('allows an injured %s to win ally selection', target => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero' }),
      unit('summon', { kind: 'summon', summonOwnerId: 'hero', life: target === 'summon' ? 50 : 200 }),
      healer({ life: target === 'healer' ? 50 : 200 })
    ]));
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target, amount: 25 })
    ]);
    expect(result.result.playerTeam.find(u => u.id === 'healer')?.mana).toBe(5);
  });

  it('excludes enemies, dead, full and nonpositive-max units without resurrection', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'all-allies' }], {}, [
      unit('hero', { kind: 'hero' }), unit('dead', { life: 0 }),
      unit('invalid', { life: 1, stats: { ...stats, lifeMax: 0 } }),
      unit('injured', { life: 100 }), healer()
    ]));
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'injured', amount: 25 })
    ]);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([200, 0, 1, 125, 200]);
    expect(result.result.enemyTeam[0]?.life).toBe(100);
  });

  it('retains fixed self scope and reports capped actual HP while preserving spent mana', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 50, target: 'self' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }), healer({ life: 190 })
    ]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([100, 200]);
    expect(result.result.playerTeam[1]?.mana).toBe(5);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'healer', amount: 10 })
    ]);
  });

  it('retains percentage all-allies scope, floors each max-life amount and caps actual deltas', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', pctOfMaxLife: 0.125, target: 'all-allies' }], {}, [
      unit('hero', { kind: 'hero', life: 190 }),
      unit('small', { life: 50, stats: { ...stats, lifeMax: 101 } }), healer({ life: 150 })
    ]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([200, 62, 175]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 10 }),
      expect.objectContaining({ target: 'small', amount: 12 }),
      expect.objectContaining({ target: 'healer', amount: 25 })
    ]);
  });

  it('ignores lower-ratio percentage candidates whose restoration floors to zero', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', pctOfMaxLife: 0.01, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }),
      unit('small', { life: 1, stats: { ...stats, lifeMax: 50 } }), healer()
    ]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([102, 1, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 2 })
    ]);
  });

  it('caps the actual production ranged Minor Heal at ten missing HP', () => {
    const input = scenario([], {}, [unit('hero', { kind: 'hero', life: 190 }),
      healer({ skillOrder: ['mskill-minor-heal'] })]);
    const result = runBattleRecorded(input);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([200, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 10 })
    ]);
  });
});

describe('pure-heal availability, priority and random stream', () => {
  it.each([false, true])('skips unavailable healing to the %s fallback with the identical seeded outcome', nextSkill => {
    registerSkill({ id: 'fixture.next', archetype: 'fixture', target: 'self', cooldown: 4,
      manaCost: 2, minLevel: 1, effects: [{ kind: 'buff', id: 'next-buff', duration: 1 }] });
    const input = scenario([{ kind: 'heal', amountRange: [30, 50], target: 'ally' }], {}, [
      unit('hero', { kind: 'hero' }), healer({ skillOrder: ['fixture.recovery', ...(nextSkill ? ['fixture.next'] : [])] })
    ]);
    const control = { ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      skillOrder: u.skillOrder.filter(id => id !== 'fixture.recovery') })) };
    const resultWithPriority = runBattleRecorded(input);
    const resultWithoutPriority = runBattleRecorded(control);
    // The control deliberately removes one configured ID. Compare every runtime
    // field/event after applying that same loadout-only removal to the result.
    expect({ ...resultWithPriority, result: { ...resultWithPriority.result,
      playerTeam: resultWithPriority.result.playerTeam.map(u => ({ ...u,
        skillOrder: u.skillOrder.filter(id => id !== 'fixture.recovery') })) }
    }).toEqual(resultWithoutPriority);
    const { random, range, chance } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: nextSkill ? 'fixture.next' : null })
    ]);
    expect(range).not.toHaveBeenCalled(); // Fixed basic damage also needs no range draw.
    expect(chance.mock.calls).toEqual(nextSkill ? [] : [[0.85], [0]]);
    expect(random.next()).toBe(nextSkill ? 0.6270739405881613 : 0.5274470399599522);
  });

  it.each([
    { kind: 'heal', amount: 0, amountRange: [30, 50], pctOfMaxLife: 1, target: 'ally' },
    { kind: 'heal', amountRange: [0, 0], target: 'ally' },
    { kind: 'heal', pctOfMaxLife: 0.001, target: 'ally' },
    { kind: 'heal', target: 'ally' }
  ] as const)('skips zero-potential effects without a heal range draw: %j', effect => {
    const input = scenario([effect]);
    const { random, range, chance } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ skillId: null })]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(result.result.playerTeam[1]?.mana).toBe(10);
    expect(range).not.toHaveBeenCalled();
    expect(chance.mock.calls).toEqual([[0.85], [0]]);
    expect(random.next()).toBe(0.5274470399599522);
  });

  it('lets explicit positive amount override range and percentage without drawing', () => {
    const input = scenario([{ kind: 'heal', amount: 7, amountRange: [30, 50], pctOfMaxLife: 1, target: 'ally' }]);
    const { range, chance } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.result.playerTeam[0]?.life).toBe(107);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ amount: 7 })]);
    expect(range).not.toHaveBeenCalled();
    expect(chance).not.toHaveBeenCalled();
  });

  it('shares one lazy range roll across all eligible allies and preserves the subsequent draw', () => {
    const input = scenario([{ kind: 'heal', amountRange: [30, 50], pctOfMaxLife: 1, target: 'all-allies' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }), unit('full'), healer({ life: 190 })
    ]);
    const { random, range, chance } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([143, 200, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 43 }), expect.objectContaining({ target: 'healer', amount: 10 })
    ]);
    expect(range.mock.calls).toEqual([[30, 50]]);
    expect(chance).not.toHaveBeenCalled();
    expect(random.next()).toBe(0.002735721180215478);
  });

  it('accepts a valid zero roll once, spends mana and cooldown, and emits no heal event', () => {
    const input = scenario([{ kind: 'heal', amountRange: [0, 1], target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }), healer({ statuses: [
        { ...hold(401), expiresAtMs: 800 }, hold(801)
      ] })
    ]);
    // Seed 7 first draw .011704753... maps to zero in inclusive [0,1].
    const { range } = rngSpies(7);
    const result = runBattleRecorded({ ...input, seed: 7 });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'fixture.recovery', simClockMs: 400 }),
      expect.objectContaining({ skillId: null, simClockMs: 800 })
    ]);
    expect(result.result.playerTeam[0]?.life).toBe(100);
    expect(result.result.playerTeam[1]?.mana).toBe(5);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(range.mock.calls).toEqual([[0, 1]]);
  });

  it('does not start a cooldown or spend mana when no target exists, allowing recovery at 800ms', () => {
    const dot: ActiveStatus = { id: 'poison', sourceId: 'fixture', remaining: -1, stacks: 1,
      dotPerStack: 100, appliedAtMs: 400, expiresAtMs: 800 };
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', statuses: [hold(), dot] }), healer({ statuses: [hold(801)] })
    ]));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null, simClockMs: 400 }),
      expect.objectContaining({ skillId: 'fixture.recovery', simClockMs: 800 })
    ]);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([185, 200]);
    expect(result.result.playerTeam[1]?.mana).toBe(5);
  });

  it.each([{ manaCost: 11 }, { minLevel: 6 }])('preserves ordinary resource/level gating: %j', overrides => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], overrides));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ skillId: null })]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(result.result.playerTeam[1]?.mana).toBe(10);
  });

  it('preserves empty-effect availability and falls through to basic', () => {
    const result = runBattleRecorded(scenario([]));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ skillId: null })]);
    expect(result.result.playerTeam[1]?.mana).toBe(10);
  });
});

describe('current-state healing across effects and boundary controls', () => {
  it('accumulates sequential all-allies heals with fresh HP and capped positive events', () => {
    const result = runBattleRecorded(scenario([
      { kind: 'heal', amount: 30, target: 'all-allies' }, { kind: 'heal', amount: 30, target: 'all-allies' }
    ], {}, [unit('hero', { kind: 'hero', life: 150 }), healer({ life: 190 })]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([200, 200]);
    expect(result.result.playerTeam[1]?.mana).toBe(5);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 30 }), expect.objectContaining({ target: 'healer', amount: 10 }),
      expect.objectContaining({ target: 'hero', amount: 20 })
    ]);
  });

  it('reselects the lowest ratio after a prior ally heal in the same cast', () => {
    const result = runBattleRecorded(scenario([
      { kind: 'heal', amount: 50, target: 'ally' }, { kind: 'heal', amount: 10, target: 'ally' }
    ], {}, [unit('hero', { kind: 'hero', life: 100 }), unit('other', { life: 120 }), healer()]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([150, 130, 200]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 50 }), expect.objectContaining({ target: 'other', amount: 10 })
    ]);
  });

  it('preserves a preceding buff and spent mana when healing the caster', () => {
    const result = runBattleRecorded(scenario([
      { kind: 'buff', id: 'fixture.blessing', duration: 1 },
      { kind: 'heal', amount: 25, target: 'all-allies' }
    ], {}, [unit('hero', { kind: 'hero' }), healer({ life: 100 })]));
    const actor = result.result.playerTeam[1];
    expect(actor?.life).toBe(125);
    expect(actor?.mana).toBe(5);
    expect(actor?.activeBuffIds).toContain('fixture.blessing');
    expect(actor?.stats).toEqual({ ...stats, attackSpeed: 263 });
  });

  it('retains mixed-effect casts, costs and cooldown with no eligible recipient or range draw', () => {
    const input = scenario([{ kind: 'heal', amountRange: [30, 50], target: 'ally' },
      { kind: 'buff', id: 'fixture.blessing', duration: 1 }], {}, [
      unit('hero', { kind: 'hero' }), healer({ statuses: [{ ...hold(401), expiresAtMs: 800 }, hold(801)] })
    ]);
    const { range } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'buff')).toEqual([expect.objectContaining({ buffId: 'fixture.blessing' })]);
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'fixture.recovery', simClockMs: 400 }),
      expect.objectContaining({ skillId: null, simClockMs: 800 })
    ]);
    expect(result.result.playerTeam[1]?.mana).toBe(5);
    expect(range).not.toHaveBeenCalled();
  });

  it('does not draw for a later ranged effect after an earlier effect fully restores every recipient', () => {
    const input = scenario([{ kind: 'heal', amount: 100, target: 'all-allies' },
      { kind: 'heal', amountRange: [30, 50], target: 'all-allies' }]);
    const { range } = rngSpies();
    const result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: 100 })]);
    expect(range).not.toHaveBeenCalled();
  });

  it('cannot cast while stunned', () => {
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100 }), healer({ statuses: [hold()] })
    ]));
    expect(result.events.filter(e => e.kind === 'action' || e.kind === 'heal')).toEqual([]);
    expect(result.result.playerTeam[0]?.life).toBe(100);
  });

  it.each(['hero', 'healer'])('settles periodic death of %s before the heal action at the same boundary', dying => {
    const dot: ActiveStatus = { id: 'poison', sourceId: 'fixture', remaining: -1, stacks: 1,
      dotPerStack: dying === 'hero' ? 250 : 500, expiresAtMs: 400 };
    const result = runBattleRecorded(scenario([{ kind: 'heal', amount: 25, target: 'ally' }], {}, [
      unit('hero', { kind: 'hero', life: 100, statuses: [hold(), ...(dying === 'hero' ? [dot] : [])] }),
      healer({ statuses: [hold(401), ...(dying === 'healer' ? [dot] : [])] })
    ]));
    expect(result.events.filter(e => e.kind === 'heal' || e.kind === 'action')).toEqual([]);
    expect(result.result.playerTeam.find(u => u.id === dying)?.life).toBe(0);
    expect(result.events.filter(e => e.kind === 'death')).toContainEqual(expect.objectContaining({ target: dying, simClockMs: 400 }));
  });
});
