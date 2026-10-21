import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType, DerivedStats } from '../types/attributes';
import { composeHeroRecovery } from '../progression/warmth';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

const stats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 200, manaMax: 200, attack: 1, defense: 0, magicResist: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});

function unit(id: string, side: CombatUnit['side'], overrides: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, level: 40, tier: 'trash', stats,
    life: 200, mana: 200, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, ...overrides };
}

/** Labeled learned-rank engine fixtures; this is not campaign acquisition evidence. */
function snapshot(warmthRank = 20, fireBoltRank = 20, warmthId = 'skills-sorceress-warmth'): CombatSnapshot {
  const skillLevels = { 'skills-sorceress-fire-bolt': fireBoltRank, [warmthId]: warmthRank };
  // Stage d consumes only fire composition. Recovery rate belongs to the later recovery card.
  const { increasedDamagePct } = composeHeroRecovery({
    classId: 'sorceress', level: 40, effectiveEnergy: 20, skillLevels
  });
  return { seed: 7,
    playerTeam: [unit('sorceress', 'player', { kind: 'hero', mana: 8, skillLevels,
      increasedDamagePct, skillOrder: ['skills-sorceress-fire-bolt'], statuses: [hold(1701)] })],
    enemyTeam: [unit('target', 'enemy', { life: 500,
      stats: { ...stats, life: 500, lifeMax: 500 }, statuses: [hold()] })]
  };
}

function withHero(input: CombatSnapshot, overrides: Partial<CombatUnit>): CombatSnapshot {
  return { ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...overrides })) };
}

function withTarget(input: CombatSnapshot, overrides: Partial<CombatUnit>): CombatSnapshot {
  return { ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, ...overrides })) };
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P07a01d actual Fire Bolt with automatically composed Warmth', () => {
  it.each([
    { rank: 0, hit: 106, dots: [[3400, 17], [4700, 13]], hp: 364 },
    { rank: 1, hit: 107, dots: [[3400, 17], [4700, 13]], hp: 363 },
    { rank: 2, hit: 108, dots: [[3400, 17], [4700, 13]], hp: 362 },
    { rank: 20, hit: 127, dots: [[3400, 20], [4700, 16]], hp: 337 }
  ])('applies rank $rank without a Warmth action and preserves literal HP, time and replay', ({ rank, hit, dots, hp }) => {
    expect(getSkill('skills-sorceress-fire-bolt')).toMatchObject({
      id: 'sorceress.fire_bolt', trigger: 'active', manaCost: 8, cooldown: 1,
      effects: [{ kind: 'damage', damageType: 'fire', base: [30, 45], perRank: [4, 4],
        applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }]
    });
    const input = snapshot(rank);
    const before = structuredClone(input);
    const spell = structuredClone(getSkill('sorceress.fire_bolt'));
    const warmth = structuredClone(getSkill('sorceress.warmth'));
    const result = runBattleRecorded(input);
    // Seed 7: hit .011704753153026104; range .06195825757458806 -> 106;
    // crit .97690763277933; status .6990287057124078. No expected value uses resolver output.
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'sorceress', skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', target: 'target', damageType: 'fire',
        amount: hit, crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount])).toEqual(dots);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(hp);
    expect(result.result.enemyTeam[0]?.statuses).toEqual([hold()]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
    expect(runBattle(input)).toEqual(result.result);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(input).toEqual(before);
    expect(getSkill('sorceress.fire_bolt')).toEqual(spell);
    expect(getSkill('sorceress.warmth')).toEqual(warmth);
  });

  it('lets a one-percent rank-one bonus floor away on rank-one Fire Bolt', () => {
    const result = runBattleRecorded(snapshot(1, 1));
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 30, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 5], [4700, 4]]);
    expect(result.result.enemyTeam[0]?.life).toBe(461);
  });

  it('applies increased fire before combo, crit, resistance, mitigation and final floor', () => {
    const input = withHero(snapshot(), { stats: { ...stats, critChance: 1, critDamage: 2 } });
    const result = runBattleRecorded(withTarget(input, {
      stats: { ...stats, life: 500, lifeMax: 500, defense: 7,
        resistances: { ...stats.resistances, fire: 25 } },
      statuses: [hold(), { id: 'paralyze', sourceId: 'fixture', stacks: 1, remaining: -1 }]
    }));
    // floor(106 * 1.2 * 1.2 * 2 * .75 - 7) = 221; burn floor(221*.1) = 22, once.
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 221, crit: true, dodged: false, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 37], [4700, 29]]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(213);
  });

  it('consumes the same main-stream hit/range/crit/status draws with Warmth', () => {
    const random = rngModule.createRng(7);
    const range = vi.spyOn(random, 'nextInt');
    const chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    expect.soft(runBattle(snapshot()).enemyTeam[0]?.life).toBe(337);
    expect(range.mock.calls).toEqual([[106, 121]]);
    expect(chance.mock.calls).toEqual([[0.85], [0], [1]]);
    expect(random.next()).toBe(0.5214452685322613);
  });

  it('treats an absent modifier map exactly like explicit fire zero', () => {
    const base = snapshot(0);
    const input = { ...base, playerTeam: base.playerTeam.map(u => {
      const { increasedDamagePct: _modifier, ...legacy } = u;
      return legacy;
    }) };
    const absent = runBattleRecorded(input);
    const zeroInput = withHero(input, { increasedDamagePct: { fire: 0 } });
    const zero = runBattleRecorded(zeroInput);
    expect(absent.events).toEqual(zero.events);
    expect(absent.result.enemyTeam).toEqual(zero.result.enemyTeam);
    expect(absent.result.playerTeam.map(u => [u.life, u.mana, u.stats]))
      .toEqual(zero.result.playerTeam.map(u => [u.life, u.mana, u.stats]));
    expect(absent.result.enemyTeam[0]?.life).toBe(364);
    expect(runBattle(input)).toEqual(absent.result);
    expect(runBattleRecorded(input)).toEqual(absent);
    expect(runBattle(zeroInput)).toEqual(zero.result);
    expect(runBattleRecorded(zeroInput)).toEqual(zero);
  });

  it.each([
    ['fire', 120], ['cold', 100], ['lightning', 100], ['arcane', 100],
    ['poison', 100], ['physical', 100], ['thorns', 100]
  ] as const)('keeps a labeled fixed-damage %s probe at its per-type amount %s', (damageType: DamageType, amount) => {
    registerSkill({ id: 'fixture.damage_probe', archetype: 'fixture', trigger: 'active',
      target: 'single-enemy', manaCost: 0, cooldown: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
    const input = withHero(snapshot(), { skillOrder: ['fixture.damage_probe'] });
    const before = structuredClone(input);
    const result = runBattleRecorded(input);
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType, amount, crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(500 - amount);
    expect(result.result.playerTeam[0]?.stats).toEqual(stats);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
    expect(input).toEqual(before);
  });

  it('keeps real spell damage independent of weapon attack', () => {
    const low = runBattleRecorded(snapshot());
    const high = runBattleRecorded(withHero(snapshot(), { stats: { ...stats, attack: 10000 } }));
    expect(high.events).toEqual(low.events);
    expect.soft(high.result.enemyTeam[0]?.life).toBe(337);
    expect(high.result.playerTeam[0]?.stats.attack).toBe(10000);
    expect(low.result.playerTeam[0]?.stats.attack).toBe(1);
  });

  it('does not pass a hero fire bonus to an allied actual Fire Bolt', () => {
    const input = snapshot();
    const result = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam,
      unit('ally', 'player', { kind: 'merc', mana: 8, stats: { ...stats, attackSpeed: 87 },
        skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'sorceress.fire_bolt': 20 },
        statuses: [hold(1805)] })] });
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', amount: 127, simClockMs: 1700 }),
      expect.objectContaining({ source: 'ally', amount: 112, simClockMs: 1804 })
    ]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(188);
    expect(result.result.playerTeam[1]?.increasedDamagePct).toBeUndefined();
    expect(result.result.playerTeam.map(u => u.mana)).toEqual([0, 0]);
  });

  it('refreshes burn with its first enhanced potency instead of multiplying or replacing it', () => {
    const input = withHero(snapshot(), { mana: 16, statuses: [hold(3401)] });
    const before = structuredClone(input);
    const result = runBattleRecorded(input);
    // Second range draw .4055216880515218 -> 112; floor(112*1.2)=134.
    // Original rate12 survives refresh; one stack until3400, two until6400.
    expect.soft(result.events.filter(e => e.kind === 'damage').map(e => [e.simClockMs, e.amount]))
      .toEqual([[1700, 127], [3400, 134]]);
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 20], [5100, 41], [6400, 31]]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(147);
    expect(result.result.enemyTeam[0]?.statuses).toEqual([hold()]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(input).toEqual(before);
  });

  it('preserves legacy burn source, start, potency and longer expiry while capping stacks at five', () => {
    const legacy: ActiveStatus = { id: 'burn', sourceId: 'old', appliedAtMs: 0,
      expiresAtMs: 100000, remaining: 100, stacks: 4, dotPerStack: 7, damageType: 'fire' };
    const input = withTarget(withHero(snapshot(), { mana: 16, statuses: [hold(3401)] }), {
      life: 10000, stats: { ...stats, life: 10000, lifeMax: 10000 }, statuses: [hold(), legacy]
    });
    const before = structuredClone(input);
    const result = runBattleRecorded(input);
    // floor(7*4*1.7 + 7*5*58.3)=2088 HP; neither hit replaces rate7.
    expect.soft(result.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(2088);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(7651);
    expect(result.result.enemyTeam[0]?.statuses).toEqual([hold(), { ...legacy, stacks: 5 }]);
    expect(result.events.filter(e => e.kind === 'damage').map(e => e.simClockMs)).toEqual([1700, 3400]);
    expect(input).toEqual(before);
  });

  it('falls back at seven mana without granting a fire bonus to the basic attack', () => {
    const result = runBattleRecorded(withHero(snapshot(), { mana: 7 }));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 1 })
    ]);
    expect(result.events.filter(e => ['buff', 'status', 'dot'].includes(e.kind))).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(499);
    expect(result.result.playerTeam[0]?.mana).toBe(7);
  });

  it('spends eight mana on a seeded miss without applying burn', () => {
    const input = withTarget(snapshot(), { stats: { ...stats, magicDodge: 1 } });
    const result = runBattleRecorded({ ...input, seed: 1 });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => ['status', 'dot'].includes(e.kind))).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(500);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('preserves cooldown fallback with an enhanced spell and unchanged physical basic attack', () => {
    const result = runBattleRecorded(withHero(snapshot(), { mana: 16,
      stats: { ...stats, attackSpeed: 263 }, statuses: [hold(801)] }));
    expect(result.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
      .toEqual([[400, 'sorceress.fire_bolt'], [800, null]]);
    expect.soft(result.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([127, 1]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(336);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
  });

  it('casts again at exact cooldown expiry without accumulating the Warmth percentage', () => {
    const result = runBattleRecorded(withHero(snapshot(), { mana: 16,
      stats: { ...stats, attackSpeed: 250 }, statuses: [hold(1501)] }));
    expect(result.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
      .toEqual([[500, 'sorceress.fire_bolt'], [1000, null], [1500, 'sorceress.fire_bolt']]);
    expect.soft(result.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([127, 1, 130]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(158);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(result.result.playerTeam[0]?.increasedDamagePct).toEqual({ fire: 0.2, lightning: 0 });
  });
});

describe('P07a01d authored passive action exclusion and active/legacy boundaries', () => {
  it.each([
    { id: 'skills-sorceress-warmth', rank: 0, spell: 'sorceress.fire_bolt', hit: 106 },
    { id: 'skills-sorceress-warmth', rank: 20, spell: 'skills-sorceress-fire-bolt', hit: 127 },
    { id: 'sorceress.warmth', rank: 0, spell: 'skills-sorceress-fire-bolt', hit: 106 },
    { id: 'sorceress.warmth', rank: 20, spell: 'sorceress.fire_bolt', hit: 127 }
  ])('skips imported $id at rank $rank before the real spell', ({ id, rank, spell, hit }) => {
    expect(getSkill(id)).toMatchObject({ trigger: 'passive', isBuff: true, manaCost: 0, cooldown: 0 });
    const result = runBattleRecorded(withHero(snapshot(rank, 20, id), { skillOrder: [id, spell] }));
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: hit, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'buff')).toEqual([]);
    expect.soft(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
    expect.soft(result.result.playerTeam[0]?.mana).toBe(0);
    expect(result.result.playerTeam[0]?.cooldowns).toEqual({});
  });

  it.each([0, 20])('uses an ordinary physical basic attack for a Warmth-only imported rank %s order', rank => {
    const result = runBattleRecorded(withHero(snapshot(rank), { skillOrder: ['skills-sorceress-warmth'] }));
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 1 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'buff')).toEqual([]);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
    expect(result.result.playerTeam[0]?.stats.attack).toBe(1);
  });

  it.each(['skills-paladin-might', 'skills-paladin-prayer', 'skills-sorceress-fire-mastery'])(
    'also excludes actual authored passive %s without adding aura or mastery effects', id => {
      expect(getSkill(id)).toHaveProperty('trigger', 'passive');
      const result = runBattleRecorded(withHero(snapshot(), { skillOrder: [id, 'skills-sorceress-fire-bolt'] }));
      expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
      ]);
      expect.soft(result.events.filter(e => e.kind === 'buff')).toEqual([]);
      expect.soft(result.result.enemyTeam[0]?.life).toBe(337);
    });

  it.each(['skills-sorceress-frozen-armor', 'sorceress.frozen_armor'])(
    'keeps actual active Frozen Armor %s eligible despite its passive scaling metadata', id => {
      expect(getSkill(id)).toMatchObject({ trigger: 'active', isBuff: true, manaCost: 7 });
      const input = snapshot();
      const result = runBattleRecorded(withHero(input, { skillOrder: [id],
        skillLevels: { ...input.playerTeam[0]?.skillLevels, [id]: 1 } }));
      expect(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'sorceress.frozen_armor', simClockMs: 1700 })
      ]);
      expect(result.events.filter(e => e.kind === 'buff')).toEqual([
        expect.objectContaining({ buffId: 'frozen-armor', target: 'sorceress', simClockMs: 1700 })
      ]);
      expect(result.result.playerTeam[0]?.mana).toBe(1);
      expect(result.result.playerTeam[0]?.activeBuffIds).toEqual(['frozen-armor']);
      expect(result.result.playerTeam[0]?.stats).toEqual(stats);
    });

  it.each(['aura-might', 'aura-prayer'])('retains the existing undefined-trigger %s stub behavior', id => {
    expect(getSkill(id)).not.toHaveProperty('trigger');
    const result = runBattleRecorded(withHero(snapshot(), { skillOrder: [id] }));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: id, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'buff')).toHaveLength(1);
    expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([id.slice(5)]);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
  });

  it('retains existing literal trigger:aura behavior in an explicitly synthetic fixture', () => {
    registerSkill({ id: 'fixture.literal_aura', archetype: 'fixture', trigger: 'aura',
      target: 'self', manaCost: 0, cooldown: 0, minLevel: 1, isBuff: true,
      effects: [{ kind: 'buff', id: 'literal-aura', duration: -1 }] });
    const result = runBattleRecorded(withHero(snapshot(), { skillOrder: ['fixture.literal_aura'] }));
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'fixture.literal_aura', simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'buff')).toEqual([
      expect.objectContaining({ buffId: 'literal-aura', simClockMs: 1700 })
    ]);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
    expect(result.result.playerTeam[0]?.activeBuffIds).toEqual(['literal-aura']);
  });

  it('excludes a labeled passive summon at both battle start and scheduled action selection', () => {
    const summon = getSkill('necromancer.raise_skeleton');
    expect(summon).toHaveProperty('summonOnStart', true);
    if (!summon) throw new Error('Missing real summon definition');
    registerSkill({ ...summon, id: 'fixture.passive_start', trigger: 'passive' });
    const result = runBattleRecorded(withHero(snapshot(), { mana: 15,
      skillOrder: ['fixture.passive_start', 'skills-sorceress-fire-bolt'] }));
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect.soft(result.result.playerTeam).toHaveLength(1);
    expect.soft(result.result.playerTeam[0]?.mana).toBe(7);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(337);
  });
});
