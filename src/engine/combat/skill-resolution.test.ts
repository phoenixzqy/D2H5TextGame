/**
 * Bug A — combatants resolve and cast their configured skills.
 *
 * Integration test exercising chooseSkill + castSkill for cases that
 * historically silently fell back to basic attack:
 *   - Monsters with kebab-case skill ids in JSON.
 *   - Mercs with `mskill-*` / `aura-*` ids on their loadout.
 *
 * Necromancer raise_skeleton is covered by `summon-resummon.test.ts`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runBattle, runBattleRecorded, type BattleEvent, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType, DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';
import { getSkill, registerSkill, resetRegistry, loadDefaultSkills } from '../skills/registry';
import * as rngModule from '../rng';
import { applyStatus } from './status';

const baseStats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 200, manaMax: 200, attack: 1, defense: 0, magicResist: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(over: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: over.id, level: 5, tier: 'trash', stats: baseStats,
    life: 200, mana: 200, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, summonedAdds: false, ...over
  };
}

beforeEach(() => { resetSummonCounters(); });

function fireBoltSnapshot(rank = 1, attack = 1) {
  return {
    seed: 7,
    playerTeam: [mkUnit({
      id: 'sorceress', side: 'player', kind: 'hero', mana: 8,
      skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'skills-sorceress-fire-bolt': rank },
      stats: { ...baseStats, attack },
      // One real cast at 1700ms; subsequent actions are held to isolate its complete burn.
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 1701 }]
    })],
    enemyTeam: [mkUnit({
      id: 'target', side: 'enemy', life: 500,
      stats: { ...baseStats, life: 500, lifeMax: 500 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture' }]
    })]
  } as const satisfies CombatSnapshot;
}

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});

function amplifySnapshot(rank = 1, allyHoldAt = 3401): CombatSnapshot {
  return {
    seed: 1,
    playerTeam: [mkUnit({
      id: 'necromancer', side: 'player', kind: 'hero', mana: rank === 20 ? 11 : 15,
      stats: { ...baseStats, attackSpeed: 263 }, statuses: [hold(401)],
      skillOrder: ['skills-necromancer-amplify-damage'],
      skillLevels: { 'skills-necromancer-amplify-damage': rank }
    }), mkUnit({
      id: 'ally', side: 'player', kind: 'merc', stats: { ...baseStats, attack: 100 },
      statuses: [hold(allyHoldAt)]
    })],
    enemyTeam: [mkUnit({
      id: 'target', side: 'enemy', life: 500, statuses: [hold()],
      stats: { ...baseStats, life: 500, lifeMax: 500, defense: 10, magicResist: 10,
        resistances: { fire: 50, cold: 50, lightning: 50, poison: 50, arcane: 50, physical: 50 } }
    })]
  };
}

function directHitSnapshot(statuses: readonly ActiveStatus[], physical = 50): CombatSnapshot {
  const input = amplifySnapshot(1, 1701);
  return { ...input,
    playerTeam: input.playerTeam.map(u => u.id === 'necromancer' ? { ...u, statuses: [hold()] } : u),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold(), ...statuses],
      stats: { ...u.stats, resistances: { ...u.stats.resistances, physical } } }))
  };
}

function minorHealSnapshot(rank = 1): CombatSnapshot {
  return { seed: 1,
    playerTeam: [mkUnit({ id: 'hero', side: 'player', kind: 'hero', life: 100, statuses: [hold()] }),
      mkUnit({ id: 'priest', side: 'player', kind: 'merc', life: 180, mana: 0,
        stats: { ...baseStats, attackSpeed: 263 }, statuses: [hold(401)],
        skillOrder: ['mskill-minor-heal'], skillLevels: { 'mskill-minor-heal': rank } })],
    enemyTeam: [mkUnit({ id: 'enemy', side: 'enemy', life: 1000, statuses: [hold()] })]
  };
}

describe('P08a03b actual Minor Heal runtime (synthetic rank fixtures)', () => {
  afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

  it.each([1, 20])('restores exactly 43 HP at rank %s with no damage, replay drift or input mutation', (rank) => {
    expect(getSkill('mskill-minor-heal')).toEqual({ id: 'mskill-minor-heal', archetype: 'mercenary',
      target: 'single-ally', cooldown: 4, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'heal', amountRange: [30, 50], target: 'ally' }] });
    const input = minorHealSnapshot(rank);
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect.soft(recorded.result.playerTeam.map(u => u.life)).toEqual([143, 180]);
    expect.soft(recorded.events.filter(e => e.kind === 'heal')).toEqual([
      { kind: 'heal', target: 'hero', amount: 43, simClockMs: 400, uiDelayMs: 50 }
    ]);
    expect(recorded.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'priest', skillId: 'mskill-minor-heal', simClockMs: 400 })
    ]);
    expect(recorded.events.filter(e => ['damage', 'dot', 'buff', 'status'].includes(e.kind))).toEqual([]);
    expect(recorded.result.playerTeam[1]?.mana).toBe(0);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(input).toEqual(before);
  });

  it('consumes one actual seeded range draw and no targeting, hit or crit draw', () => {
    const random = rngModule.createRng(1);
    const range = vi.spyOn(random, 'nextInt');
    const chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    expect.soft(runBattle(minorHealSnapshot()).playerTeam.map(u => u.life)).toEqual([143, 180]);
    expect.soft(range.mock.calls).toEqual([[30, 50]]);
    expect(chance).not.toHaveBeenCalled();
    expect.soft(random.next()).toBe(0.002735721180215478);
  });

  it.each([1, 20])('recasts rank %s at exact 4400ms cooldown expiry after being held inside it', (rank) => {
    const input = minorHealSnapshot(rank);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'priest'
      ? { ...u, statuses: [{ ...hold(401), expiresAtMs: 4400 }, hold(4401)] } : u) });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'priest', skillId: 'mskill-minor-heal', simClockMs: 400 }),
      expect.objectContaining({ actor: 'priest', skillId: 'mskill-minor-heal', simClockMs: 4400 })
    ]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 43, simClockMs: 400 }),
      expect.objectContaining({ target: 'hero', amount: 30, simClockMs: 4400 })
    ]);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([173, 180]);
  });

  it('uses a basic attack inside the actual cooldown without another heal', () => {
    const input = minorHealSnapshot();
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'priest'
      ? { ...u, statuses: [{ ...hold(401), expiresAtMs: 4000 }, hold(4001)] } : u) });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'mskill-minor-heal', simClockMs: 400 }),
      expect.objectContaining({ skillId: null, simClockMs: 4000 })
    ]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 43, simClockMs: 400 })
    ]);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([143, 180]);
  });
});

describe('P08a02c production Amplify Damage runtime', () => {
  afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

  it.each([1, 20])('uses authored rank %s curse through exact 3400ms expiry, replay and immutable inputs', (rank) => {
    expect(getSkill('skills-necromancer-amplify-damage')).toMatchObject({
      id: 'necromancer.amplify_damage', manaCost: 15, cooldown: 3,
      manaCostPerRank: -0.2, cooldownPerRank: -0.05,
      effects: [{ kind: 'debuff', statusId: 'amplify-damage', durationMs: 3000, physicalResistReductionPct: 50 }]
    });
    const input = amplifySnapshot(rank);
    const before = structuredClone(input);
    const first = runBattleRecorded(input);
    expect(first.result.enemyTeam[0]?.life).toBe(370);
    expect(first.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'ally', target: 'target', amount: 90, crit: false, dodged: false, simClockMs: 1700 }),
      expect.objectContaining({ source: 'ally', target: 'target', amount: 40, crit: false, dodged: false, simClockMs: 3400 })
    ]);
    expect(first.result.enemyTeam[0]?.life).toBe(370);
    expect(runBattle(amplifySnapshot(rank, 1701)).enemyTeam[0]?.life).toBe(410);
    expect(runBattle(amplifySnapshot(rank, 0)).enemyTeam[0]?.life).toBe(500);
    expect(first.events.filter(e => e.kind === 'status')).toEqual([
      expect.objectContaining({ target: 'target', statusId: 'amplify-damage', simClockMs: 400 })
    ]);
    expect(first.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(first.result.playerTeam[0]?.mana).toBe(0);
    expect(first.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    expect(input).toEqual(before);
  });

  it('keeps the uncursed controls at HP460/420 and the exact hit/crit RNG stream unchanged', () => {
    const input = directHitSnapshot([]);
    expect(runBattle(input).enemyTeam[0]?.life).toBe(460);
    const twice = { ...input, playerTeam: input.playerTeam.map(u => u.id === 'ally' ? { ...u, statuses: [hold(3401)] } : u) };
    expect(runBattle(twice).enemyTeam[0]?.life).toBe(420);
    const random = rngModule.createRng(1);
    const chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    const result = runBattle(amplifySnapshot());
    expect(result.enemyTeam[0]?.life).toBe(370);
    expect(chance.mock.calls).toEqual([[0.85], [0], [0.85], [0]]);
    // Seed1 hit/crit draws: .6270739405881613/.002735721180215478,
    // then .5274470399599522/.9810509674716741; no cast/target/range draw.
    expect(random.next()).toBe(0.9683778982143849);
  });

  it.each([[1, 14], [20, 10]])('falls back at rank %s mana %s without spending mana or cursing', (rank, mana) => {
    const input = amplifySnapshot(rank, 0);
    const result = runBattleRecorded({ ...input,
      playerTeam: input.playerTeam.map(u => u.id === 'necromancer' ? { ...u, mana } : u) });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'necromancer', skillId: null, simClockMs: 400 })
    ]);
    expect(result.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(499);
    expect(result.result.playerTeam[0]?.mana).toBe(mana);
  });

  it.each([
    { rank: 1, mana: 30, recastAt: 3600, hp: 364 },
    { rank: 20, mana: 22, recastAt: 2400, hp: 317 }
  ])(
    'honors rank $rank cost/cooldown and permits recast at $recastAt ms', ({ rank, mana, recastAt, hp }) => {
      const input = amplifySnapshot(rank);
      const result = runBattleRecorded({ ...input,
        playerTeam: input.playerTeam.map(u => u.id === 'necromancer'
          ? { ...u, mana, statuses: [hold(recastAt + 401)] } : u) });
      const actions = result.events.filter(e => e.kind === 'action' && e.actor === 'necromancer');
      expect(actions.filter(e => e.kind === 'action' && e.skillId !== null).map(e => e.simClockMs)).toEqual([400, recastAt]);
      expect(actions.filter(e => e.kind === 'action' && e.skillId === null).map(e => e.simClockMs))
        .toEqual(rank === 1 ? [800, 1200, 1600, 2000, 2400, 2800, 3200, 4000] : [800, 1200, 1600, 2000, 2800]);
      expect(result.result.playerTeam[0]?.mana).toBe(0);
      // Independently replayed Seed1 draws include two caster misses at rank1,
      // or two at rank20; the ally hits twice in both timelines.
      expect(result.result.enemyTeam[0]?.life).toBe(hp);
    }
  );

  function registerHit(damageType: DamageType, target: 'single-enemy' | 'all-enemies' = 'single-enemy') {
    registerSkill({ id: 'fixture.hit', archetype: 'fixture', minLevel: 1,
      target, cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
  }

  it.each([
    { durationMs: 2000, physicalResistReductionPct: 20, hp: 400 },
    { durationMs: 3000, physicalResistReductionPct: 0, hp: 420 },
    { durationMs: 0, physicalResistReductionPct: 50, hp: 420 }
  ])('propagates supplied debuff milliseconds/potency rather than inventing defaults: %j',
    ({ durationMs, physicalResistReductionPct, hp }) => {
      registerSkill({ id: 'fixture.curse', archetype: 'fixture', minLevel: 1,
        target: 'all-enemies', cooldown: 99, manaCost: 0,
        effects: [{ kind: 'debuff', statusId: 'amplify-damage', duration: 99,
          durationMs, physicalResistReductionPct }] });
      const input = amplifySnapshot();
      const result = runBattle({ ...input,
        playerTeam: input.playerTeam.map(u => u.id === 'necromancer'
          ? { ...u, skillOrder: ['fixture.curse'] } : u) });
      expect(result.enemyTeam[0]?.life).toBe(hp);
    }
  );

  it('curses all living trash/boss/chapter-boss targets equally and excludes dead targets', () => {
    registerHit('physical', 'all-enemies');
    const input = amplifySnapshot();
    const target = input.enemyTeam[0];
    if (!target) throw new Error('Missing target');
    const result = runBattleRecorded({ ...input, seed: 3,
      playerTeam: input.playerTeam.map(u => u.id === 'ally' ? { ...u, skillOrder: ['fixture.hit'] } : u),
      enemyTeam: [
        { ...target, id: 'trash' }, { ...target, id: 'boss', tier: 'boss' },
        { ...target, id: 'chapter', tier: 'chapter-boss' }, { ...target, id: 'dead', life: 0 }
      ] });
    expect(result.events.filter(e => e.kind === 'status').map(e => e.target).sort()).toEqual(['boss', 'chapter', 'trash']);
    expect(result.result.enemyTeam.map(u => [u.id, u.life])).toEqual([
      ['trash', 370], ['boss', 370], ['chapter', 370], ['dead', 0]
    ]);
    expect(result.events.filter(e => e.kind === 'damage').map(e => [e.simClockMs, e.amount]))
      .toEqual([[1700, 90], [1700, 90], [1700, 90], [3400, 40], [3400, 40], [3400, 40]]);
  });

  const curse = (overrides: Partial<ActiveStatus & { physicalResistReductionPct: number }> = {}) => ({
    id: 'amplify-damage', sourceId: 'old', stacks: 1, remaining: -1, ...overrides
  });
  it.each([
    { name: 'canonical missing payload', statuses: [curse()], hit: 90 },
    { name: 'legacy missing payload', statuses: [curse({ id: 'amplify' })], hit: 90 },
    { name: 'explicit zero', statuses: [curse({ physicalResistReductionPct: 0 })], hit: 40 },
    { name: 'first active duplicate only', statuses: [curse({ physicalResistReductionPct: 20 }), curse({ id: 'amplify', physicalResistReductionPct: 70 })], hit: 60 },
    { name: 'pending earlier record', statuses: [curse({ physicalResistReductionPct: 70, appliedAtMs: 2000 }), curse({ id: 'amplify', physicalResistReductionPct: 20 })], hit: 60 },
    { name: 'expired earlier record', statuses: [curse({ physicalResistReductionPct: 70, expiresAtMs: 1700 }), curse({ id: 'amplify', physicalResistReductionPct: 20 })], hit: 60 },
    { name: 'pending alone', statuses: [curse({ appliedAtMs: 1701 })], hit: 40 },
    { name: 'exact start', statuses: [curse({ appliedAtMs: 1700 })], hit: 90 },
    { name: 'exact expiry', statuses: [curse({ expiresAtMs: 1700 })], hit: 40 },
    { name: 'tag only', statuses: [curse({ id: 'amp-damage' })], hit: 40 },
    { name: 'another status with scalar', statuses: [curse({ id: 'other', physicalResistReductionPct: 50 })], hit: 40 }
  ])('uses $name without summing duplicates or inventing clocks', ({ statuses, hit }) => {
    const input = directHitSnapshot(statuses);
    const before = structuredClone(input);
    const result = runBattleRecorded(input);
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'ally', simClockMs: 1700, amount: hit, crit: false, dodged: false })
    ]);
    expect(result.result.enemyTeam[0]?.life).toBe(500 - hit);
    expect(input).toEqual(before);
  });

  it('makes a replaced earlier record authoritative over the later active record', () => {
    const input = directHitSnapshot([
      curse({ id: 'amplify', appliedAtMs: 2000, physicalResistReductionPct: 70 }),
      curse({ physicalResistReductionPct: 20 })
    ]);
    const target = input.enemyTeam[0];
    if (!target) throw new Error('Missing target');
    const replaced = applyStatus(target, { id: 'amplify', sourceId: 'new', simClockMs: 400 }, rngModule.createRng(1));
    expect(runBattle({ ...input, enemyTeam: [replaced] }).enemyTeam[0]?.life).toBe(410);
  });

  it.each([[50, 40, 90], [0, 90, 140], [-75, 165, 190], [100, 15, 40]])(
    'subtracts before clamp/defense at resistance %s: ordinary %s / cursed %s', (resistance, normal, cursed) => {
      expect(runBattle(directHitSnapshot([], resistance)).enemyTeam[0]?.life).toBe(500 - normal);
      expect(runBattle(directHitSnapshot([curse()], resistance)).enemyTeam[0]?.life).toBe(500 - cursed);
    }
  );

  it('subtracts the existing act penalty after the curse without preclamping the resistance', () => {
    const input = directHitSnapshot([curse()], 100);
    expect(runBattle({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, resistPenalty: 20 })) })
      .enemyTeam[0]?.life).toBe(440);
  });

  it.each(['fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
    'leaves %s damage unchanged', (damageType) => {
      registerHit(damageType);
      for (const statuses of [[], [curse()]]) {
        const input = directHitSnapshot(statuses);
        const result = runBattle({ ...input,
          playerTeam: input.playerTeam.map(u => u.id === 'ally' ? { ...u, skillOrder: ['fixture.hit'] } : u) });
        expect(result.enemyTeam[0]?.life).toBe(460);
      }
    }
  );

  it('leaves periodic damage unchanged and preserves terminal death behavior', () => {
    for (const statuses of [[], [curse()]]) {
      const input = directHitSnapshot([...statuses, {
        id: 'legacy-periodic', sourceId: 'old', stacks: 1, remaining: 2,
        dotPerStack: 20, damageType: 'physical', expiresAtMs: 2000
      }]);
      expect(runBattle({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [hold()] })) })
        .enemyTeam[0]?.life).toBe(460);
    }
    const input = directHitSnapshot([curse()]);
    const before = structuredClone(input);
    const lethal = { ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 90 })) };
    const result = runBattleRecorded(lethal);
    expect(result.result.enemyTeam[0]?.life).toBe(0);
    expect(result.result.winner).toBe('player');
    expect(result.events.filter(e => e.kind === 'death')).toEqual([
      expect.objectContaining({ target: 'target', simClockMs: 1700 })
    ]);
    expect(runBattle(lethal)).toEqual(result.result);
    expect(input).toEqual(before);
  });
});

describe('P08a01 production Fire Bolt', () => {
  afterEach(() => { resetRegistry(); loadDefaultSkills(); });
  it.each([
    { rank: 1, hit: 30, hp: 461, dots: [[3400, 5], [4700, 4]] },
    { rank: 20, hit: 106, hp: 364, dots: [[3400, 17], [4700, 13]] }
  ])('deals the literal seeded rank $rank hit and full three-second burn', ({ rank, hit, hp, dots }) => {
    expect(getSkill('skills-sorceress-fire-bolt')).toMatchObject({
      id: 'sorceress.fire_bolt', manaCost: 8, cooldown: 1,
      effects: [{ kind: 'damage', base: [30, 45], perRank: [4, 4], damageType: 'fire',
        applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }]
    });
    const input = fireBoltSnapshot(rank);
    const before = structuredClone(input);
    const first = runBattleRecorded(input);
    // Seed 7's first hit/range/crit/status draws produce 30, or 30 + 19*4.
    expect(first.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', target: 'target', amount: hit,
        crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(first.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual(dots);
    expect(first.result.enemyTeam[0]?.life).toBe(hp);
    expect(first.result.enemyTeam[0]?.statuses.map(s => s.id)).toEqual(['stun']);
    expect(first.result.playerTeam[0]?.mana).toBe(0);
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    expect(input).toEqual(before);
  });

  it('keeps spell damage and burn independent of weapon attack', () => {
    const low = runBattleRecorded(fireBoltSnapshot(1, 1));
    const high = runBattleRecorded(fireBoltSnapshot(1, 10_000));
    const damage = (result: typeof low) => result.events.filter(e => e.kind === 'damage' || e.kind === 'dot');
    expect(damage(high)).toEqual(damage(low));
    expect(high.result.enemyTeam[0]?.life).toBe(461);
    expect(low.result.enemyTeam[0]?.life).toBe(461);
  });

  it('falls back to a basic attack at seven mana without applying burn or spending mana', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 7 }] });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'sorceress', skillId: null, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(499);
    expect(result.result.playerTeam[0]?.mana).toBe(7);
  });

  it('spends a cast cost on a seeded miss but applies no status or periodic damage', () => {
    const input = fireBoltSnapshot();
    const target = input.enemyTeam[0];
    const result = runBattleRecorded({ ...input, seed: 1,
      enemyTeam: [{ ...target, stats: { ...target.stats, magicDodge: 1 } }] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(500);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('uses a basic attack during the one-second cooldown even when another cast is affordable', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 16,
      stats: { ...hero.stats, attackSpeed: 263 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 801 }]
    }] });
    expect(result.events.filter(e => e.kind === 'action').map(e =>
      [e.simClockMs, e.skillId]))
      .toEqual([[400, 'sorceress.fire_bolt'], [800, null]]);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
    expect(result.events.filter(e => e.kind === 'damage').map(e => e.amount))
      .toEqual([30, 1]);
  });

  it('allows the next cast at the exact cooldown boundary', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 16,
      stats: { ...hero.stats, attackSpeed: 250 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 1501 }]
    }] });
    // A 500ms cadence reaches the first cast's 1500ms cooldown expiry exactly.
    expect(result.events.filter(e => e.kind === 'action').map(e =>
      [e.simClockMs, e.skillId]))
      .toEqual([[500, 'sorceress.fire_bolt'], [1000, null], [1500, 'sorceress.fire_bolt']]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('does not invent a DoT rate for an explicitly rate-less fire skill', () => {
    // D04 Druid fire now authors its own rate. A rate-less copy preserves the
    // original no-global-fallback contract without denying the new JSON tuning.
    const source = getSkill('skills-druid-firestorm');
    if (!source) throw new Error('Missing registered Firestorm');
    const id = 'fixture.rate-less-fire';
    registerSkill({ ...source, id, effects: source.effects.map(effect => {
      if (effect.kind !== 'damage') return effect;
      const { applyStatuses, ...single } = effect;
      void applyStatuses;
      return { ...single, applyStatus: { id: 'burn' } };
    }) });
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 20,
      skillOrder: [id], skillLevels: { [id]: 1 }
    }] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 41, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(459);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });
});

describe('Bug A — skill resolution at combat time', () => {
  it('monsters configured with kebab-case skill ids cast them (not basic attack)', () => {
    const fallen = mkUnit({
      id: 'fallen', side: 'enemy',
      skillOrder: ['monster-strong-melee'],
      stats: { ...baseStats, attack: 5 }
    });
    const target = mkUnit({
      id: 'target', side: 'player', kind: 'hero',
      stats: { ...baseStats, life: 99999, lifeMax: 99999 }, life: 99999
    });
    const result = runBattle({
      seed: 42, playerTeam: [target], enemyTeam: [fallen]
    });
    const skillCasts = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'action' }> =>
        e.kind === 'action' &&
        // Engine emits the canonical id from the resolved skill, not the
        // alias from `skillOrder`. Either is acceptable as long as it's
        // not a basic attack (skillId !== null).
        (e.skillId === 'monster.strong_melee' || e.skillId === 'monster-strong-melee')
    );
    expect(skillCasts.length).toBeGreaterThan(0);
  });

  it('merc with mskill-bash signature uses the skill (not basic attack)', () => {
    const merc = mkUnit({
      id: 'merc', side: 'player', kind: 'merc',
      skillOrder: ['mskill-bash'],
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 99999, lifeMax: 99999, attack: 0 }, life: 99999
    });
    const result = runBattle({
      seed: 7, playerTeam: [merc], enemyTeam: [enemy]
    });
    const bashCasts = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'action' }> =>
        e.kind === 'action' && (e.skillId === 'mskill-bash' || e.skillId === 'mskill_bash')
    );
    expect(bashCasts.length).toBeGreaterThan(0);

    const dmgs = result.events
      .filter(
        (e): e is Extract<BattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === 'merc' && !e.dodged
      )
      .map((e) => e.amount);
    expect(dmgs.length).toBeGreaterThan(0);
    const max = Math.max(...dmgs);
    expect(max).toBeGreaterThan(10); // bash base 25-40, basic attack would be 1
  });

  it('skips passive Might while the merc continues casting its active signature', () => {
    const merc = mkUnit({
      id: 'aura-merc', side: 'player', kind: 'merc',
      skillOrder: ['aura-might', 'mskill-jab'],
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 99999, lifeMax: 99999, attack: 0 }, life: 99999
    });
    const result = runBattle({
      seed: 13, playerTeam: [merc], enemyTeam: [enemy]
    });
    const actions = result.events.filter(e => e.kind === 'action' && e.actor === 'aura-merc');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(e => e.kind === 'action' && e.skillId === 'mskill-jab')).toBe(true);
    expect(actions.some(e => e.kind === 'action' && e.skillId === 'aura-might')).toBe(false);
    expect(result.events.filter(e => e.kind === 'buff' && e.buffId === 'might')).toEqual([]);
  });
});
