import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import type { RegisteredSkill, SummonEffect } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { CombatUnit } from './types';

// Literal reviewed D06 membership/caps/payments; these are synthetic engine
// fixtures, not evidence of earned characters, balance or campaign readiness.
const RANKS = [1, 2, 3, 6, 20] as const;
const CASES = [
  { id: 'amazon.valkyrie', template: 'valkyrie', caps: [1, 1, 1, 1, 1], costs: [25, 25, 25, 25, 25] },
  { id: 'assassin.shadow_warrior', template: 'shadow_warrior', caps: [1, 1, 1, 1, 1], costs: [22, 22, 22, 21, 18] },
  { id: 'assassin.shadow_master', template: 'shadow_master', caps: [1, 1, 1, 1, 1], costs: [35, 35, 35, 34, 30] },
  { id: 'druid.summon_dire_wolf', template: 'dire_wolf', caps: [1, 2, 3, 4, 8], costs: [20, 20, 20, 19, 16] },
  { id: 'druid.raven', template: 'raven', caps: [1, 2, 3, 4, 8], costs: [6, 6, 6, 6, 4] },
  { id: 'druid.poison_creeper', template: 'poison_creeper', caps: [1, 1, 1, 1, 1], costs: [8, 8, 8, 8, 6] },
  { id: 'druid.summon_spirit_wolf', template: 'spirit_wolf', caps: [1, 2, 3, 4, 8], costs: [14, 14, 14, 13, 11] },
  { id: 'druid.carrion_vine', template: 'carrion_vine', caps: [1, 1, 1, 1, 1], costs: [14, 14, 14, 13, 11] },
  { id: 'druid.solar_creeper', template: 'solar_creeper', caps: [1, 1, 1, 1, 1], costs: [18, 18, 18, 17, 15] },
  { id: 'druid.summon_grizzly', template: 'grizzly', caps: [1, 1, 1, 1, 1], costs: [35, 35, 35, 34, 30] },
  { id: 'necromancer.blood_golem', template: 'blood_golem', caps: [1, 1, 1, 1, 1], costs: [25, 25, 25, 25, 25] },
  { id: 'necromancer.clay_golem', template: 'clay_golem', caps: [1, 1, 1, 1, 1], costs: [15, 15, 15, 15, 15] },
  { id: 'necromancer.fire_golem', template: 'fire_golem', caps: [1, 1, 1, 1, 1], costs: [35, 35, 35, 35, 35] }
] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture value');
  return value;
}
const MATRIX = CASES.flatMap(row => RANKS.map((rank, i) => ({
  id: row.id, template: row.template, rank, cap: required(row.caps[i]), cost: required(row.costs[i])
})));
function authored(id: string): string {
  const [cls, name] = id.split('.');
  return `skills-${required(cls)}-${required(name).replace(/_/g, '-')}`;
}
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1_000_000, mana: 1000, stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 1000, manaMax: 1000,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 263, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false };
}
function input(id = 'druid.raven', rank = 2): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero'), skillOrder: [id], skillLevels: { [id]: rank } }],
    enemyTeam: [unit('target', 'enemy')] };
}
function source(id = 'druid.raven'): RegisteredSkill {
  const skill = getSkill(id);
  if (!skill) throw new Error(`Missing real source ${id}`);
  return skill;
}
function summonEffect(skill = source()): SummonEffect {
  const effect = skill.effects[0];
  if (effect?.kind !== 'summon') throw new Error('Missing real summon effect');
  return effect;
}
function preload(owner: CombatUnit, id = 'preloaded', template = 'raven'): CombatUnit {
  const built = buildSummon(owner, template);
  if (!built) throw new Error(`Missing real template ${template}`);
  return { ...built, id, life: 13,
    gridPosition: { row: 1, col: 1 },
    statuses: [{ id: 'stun', sourceId: 'preload', stacks: 1, remaining: -1 }] };
}
function summons(events: readonly RecordedBattleEvent[]) {
  return events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> => e.kind === 'summon');
}
function casts(events: readonly RecordedBattleEvent[], actor = 'hero') {
  return events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> =>
    e.kind === 'action' && e.actor === actor && e.skillId !== null);
}
function mana(events: readonly RecordedBattleEvent[], reason = 'cast') {
  return events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'mana' }> =>
    e.kind === 'mana' && e.reason === reason);
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const skeleton = getSkill('necromancer.raise_skeleton');
  if (!skeleton) throw new Error('Missing actual Skeleton source');
  registerSkill({ ...skeleton, id: 'fixture.legacy_skeleton', archetype: 'fixture' });
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D06 paid preparation batches', () => {
  it.each(MATRIX)('$id rank $rank prepares literal cap $cap at time zero for one payment $cost', row => {
    const snapshot = input(row.id, row.rank);
    const before = structuredClone(snapshot);
    const out = runBattleRecorded(snapshot);
    const spawned = summons(out.events);
    expect(spawned).toHaveLength(row.cap);
    expect(spawned.map(e => [e.owner, e.summonId, e.simClockMs])).toEqual(
      Array.from({ length: row.cap }, () => ['hero', row.template, 0]));
    expect(casts(out.events).map(e => [e.skillId, e.simClockMs])).toEqual([[row.id, 0]]);
    expect(mana(out.events).map(e => [e.target, e.mana, e.simClockMs])).toEqual([['hero', 1000 - row.cost, 0]]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(1000 - row.cost);
    expect(snapshot).toEqual(before);
  });

  it.each(CASES)('$id deduplicates authored/canonical slots and reads the authored rank', row => {
    const snapshot = input(row.id, 2);
    const hero = required(snapshot.playerTeam[0]);
    const out = runBattleRecorded({ ...snapshot, playerTeam: [{ ...hero,
      skillOrder: [authored(row.id), row.id, authored(row.id)], skillLevels: { [authored(row.id)]: 2 } }] });
    expect(summons(out.events)).toHaveLength(row.caps[1]);
    expect(casts(out.events).map(e => [e.skillId, e.simClockMs])).toEqual([[row.id, 0]]);
    expect(mana(out.events).map(e => e.mana)).toEqual([1000 - row.costs[1]]);
  });

  it('retains standalone rank-one fallback without allocating unslotted learned skills', () => {
    const snapshot = input();
    const hero = required(snapshot.playerTeam[0]);
    const { skillLevels: _levels, ...unallocated } = hero;
    const out = runBattleRecorded({ ...snapshot, playerTeam: [unallocated] });
    expect(summons(out.events).map(e => [e.summonId, e.simClockMs])).toEqual([['raven', 0]]);
    expect(mana(out.events).map(e => e.mana)).toEqual([994]);
    const unslotted = runBattleRecorded({ ...snapshot, playerTeam: [{ ...hero, skillOrder: [] }] });
    expect(summons(unslotted.events)).toEqual([]);
  });

  it('prepares in owner/skill order with one payment per canonical skill and no cross-owner cap', () => {
    const a = { ...unit('a'), mana: 7,
      skillOrder: ['druid.raven', 'druid.poison_creeper', 'skills-druid-raven'],
      skillLevels: { 'druid.raven': 2, 'druid.poison_creeper': 1 } };
    const b = { ...unit('b'), skillOrder: ['druid.poison_creeper', 'druid.raven'],
      skillLevels: { 'druid.raven': 2, 'druid.poison_creeper': 1 } };
    const out = runBattleRecorded({ ...input(), playerTeam: [a, b] });
    expect(summons(out.events).map(e => [e.owner, e.summonId, e.simClockMs])).toEqual([
      ['a', 'raven', 0], ['a', 'raven', 0], ['b', 'poison_creeper', 0], ['b', 'raven', 0], ['b', 'raven', 0]
    ]);
    expect(mana(out.events).map(e => [e.target, e.mana])).toEqual([['a', 1], ['b', 992], ['b', 986]]);
  });

  it('fills only missing owner/template slots and preserves damaged/statused/positioned preloads and dead IDs', () => {
    const snapshot = input('druid.raven', 3);
    const hero: CombatUnit = { ...required(snapshot.playerTeam[0]), summonGridPositions: [{ row: 0, col: 1 }, { row: 0, col: 2 }] };
    const live = preload(hero);
    const dead = { ...preload(hero, 'hero-summon-raven-1'), life: 0 };
    const foreign = preload(unit('foreign'), 'foreign-raven');
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero, live, dead, foreign] });
    expect(summons(out.events).map(e => [e.unit.id, e.simClockMs, e.unit.gridPosition])).toEqual([
      // Default hero occupies0:1; use the second preference, then the first open default cell.
      ['hero-summon-raven-2', 0, { row: 0, col: 2 }], ['hero-summon-raven-3', 0, { row: 1, col: 0 }]
    ]);
    const retained = out.result.playerTeam.find(u => u.id === 'preloaded');
    expect(retained).toMatchObject({ id: live.id, life: 13, stats: live.stats, statuses: live.statuses,
      gridPosition: live.gridPosition, summonOwnerId: 'hero', summonTemplateId: 'raven' });
    expect(out.result.playerTeam.find(u => u.id === dead.id)?.life).toBe(0);
    expect(mana(out.events).map(e => e.mana)).toEqual([994]);
  });

  it('does not charge, cast or spawn when the living template cap is already full', () => {
    const snapshot = input('druid.raven', 1);
    const hero = required(snapshot.playerTeam[0]);
    const live = preload(hero);
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero, live] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(1000);
    expect(out.result.playerTeam.find(u => u.id === live.id)?.life).toBe(13);
  });

  it('fails atomically on insufficient mana and never retries after real regeneration makes it affordable', () => {
    const snapshot = input();
    const hero = { ...required(snapshot.playerTeam[0]), statuses: [], mana: 5, manaRegenPerSecond: 10 };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
    expect(mana(out.events, 'regeneration').some(e => e.mana >= 6)).toBe(true);
    expect(out.result.playerTeam[0]?.mana).toBeGreaterThan(6);
  });

  it('never retries an unaffordable batch after a guaranteed elite MP orb makes mana available', () => {
    const snapshot = input();
    const hero = { ...required(snapshot.playerTeam[0]), statuses: [], mana: 5 };
    const doomed = { ...unit('orb-source', 'enemy'), tier: 'elite' as const, life: 1,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 2, dotPerStack: 1000,
        damageType: 'poison' as const }] };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero], enemyTeam: [...snapshot.enemyTeam, doomed] });
    expect(out.events.some(e => e.kind === 'death' && e.target === 'orb-source')).toBe(true);
    expect(mana(out.events, 'orb').find(e => e.target === 'hero')?.mana).toBe(55);
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(55);
  });

  it('ignores only the scoped own stale cooldown and applies one ordinary ranked cooldown', () => {
    const original = source();
    registerSkill({ ...original, cooldown: 4, cooldownPerRank: -.1 });
    const snapshot = input('druid.raven', 6);
    const hero = { ...required(snapshot.playerTeam[0]), statuses: [],
      stats: { ...required(snapshot.playerTeam[0]).stats, attack: 10_000_000 },
      cooldowns: { 'druid.raven': 90000, 'fixture.legacy_skeleton': 90000 },
      skillOrder: ['skills-druid-raven', 'fixture.legacy_skeleton'] };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero] });
    expect(summons(out.events).filter(e => e.simClockMs === 0).map(e => e.summonId)).toEqual(['raven', 'raven', 'raven', 'raven']);
    expect(casts(out.events).filter(e => e.simClockMs === 0).map(e => e.skillId)).toEqual(['druid.raven']);
    expect(mana(out.events).filter(e => e.simClockMs === 0).map(e => e.mana)).toEqual([994]);
    const lastHeroAction = required(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').at(-1));
    expect(lastHeroAction.simClockMs).toBeLessThan(3500);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.cooldowns['druid.raven'])
      .toBe(3500 - lastHeroAction.simClockMs);
  });

  it.each([true, false])('ordinary actions skip scoped slots and select next active/basic (active=%s)', active => {
    const next: RegisteredSkill = { id: 'fixture.next', archetype: 'fixture', trigger: 'active',
      target: 'single-enemy', minLevel: 1, manaCost: 0, cooldown: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [1, 1] }] };
    registerSkill(next);
    const snapshot = input('druid.raven', 1);
    const hero = { ...required(snapshot.playerTeam[0]), statuses: [],
      skillOrder: ['druid.raven', ...(active ? ['fixture.next'] : [])] };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero] });
    const ordinary = out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs > 0);
    expect(ordinary.length).toBeGreaterThan(0);
    expect(ordinary[0]).toMatchObject({ skillId: active ? 'fixture.next' : null, simClockMs: 400 });
    expect(casts(out.events).filter(e => e.skillId === 'druid.raven').map(e => e.simClockMs)).toEqual([0]);
  });
});

const INVALID_SOURCES: readonly [string, (s: RegisteredSkill, e: SummonEffect) => RegisteredSkill][] = [
  ['wrong known template', (s, e) => ({ ...s, effects: [{ ...e, summonId: 'poison_creeper' }] })],
  ['unknown template', (s, e) => ({ ...s, effects: [{ ...e, summonId: 'missing-template' }] })],
  ['extra summon effect', (s, e) => ({ ...s, effects: [e, e] })],
  ['extra nonsummon effect', (s, e) => ({ ...s, effects: [e, { kind: 'heal', target: 'self', amount: 1 }] })],
  ['missing effect', s => ({ ...s, effects: [] })],
  ['passive trigger', s => ({ ...s, trigger: 'passive' })],
  ['aura trigger', s => ({ ...s, trigger: 'aura' })],
  ['missing trigger', s => { const { trigger: _trigger, ...rest } = s; return rest; }],
  ['wrong target', s => ({ ...s, target: 'self' })],
  ['no startup', s => ({ ...s, summonOnStart: false })],
  ['nonfinite mana', s => ({ ...s, manaCost: NaN })],
  ['negative mana', s => ({ ...s, manaCost: -1 })],
  ['nonfinite cooldown', s => ({ ...s, cooldown: Infinity })],
  ['negative cooldown', s => ({ ...s, cooldown: -1 })],
  ['nonfinite mana delta', s => ({ ...s, manaCostPerRank: NaN })],
  ['overflowed ranked cost', s => ({ ...s, manaCostPerRank: Number.MAX_VALUE })],
  ['nonfinite cooldown delta', s => ({ ...s, cooldownPerRank: Infinity })],
  ['nonfinite min level', s => ({ ...s, minLevel: Infinity })],
  ['noninteger min level', s => ({ ...s, minLevel: 1.5 })],
  ['nonpositive min level', s => ({ ...s, minLevel: 0 })],
  ['nonfinite cap', (s, e) => ({ ...s, effects: [{ ...e, maxCount: Infinity }] })],
  ['noninteger cap', (s, e) => ({ ...s, effects: [{ ...e, maxCount: 1.5 }] })],
  ['nonpositive cap', (s, e) => ({ ...s, effects: [{ ...e, maxCount: 0 }] })],
  ['missing multi-cap curve', (s, e) => { const { maxCountScaling: _curve, ...rest } = e; return { ...s, effects: [rest] }; }],
  ['wrong cap curve', (s, e) => ({ ...s, effects: [{ ...e, maxCountScaling: { kind: 'raise-skeleton-1-6-12-cap-3' } }] })],
  ['nonfinite stat scaling', (s, e) => ({ ...s, effects: [{ ...e, statScaling: { lifeMax: NaN } }] })]
];

describe('D06 atomic source and batch validation', () => {
  it.each(INVALID_SOURCES)('rejects %s without payment, spawn or later ordinary retry', (_name, change) => {
    const original = source();
    registerSkill(change(original, summonEffect(original)));
    const snapshot = input('druid.raven', 3);
    const out = runBattleRecorded({ ...snapshot, playerTeam: [{ ...required(snapshot.playerTeam[0]), statuses: [],
      manaRegenPerSecond: 10 }] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(1000);
  });

  it('rejects singleton cap/curve drift rather than silently extending the authored policy', () => {
    const original = source('druid.poison_creeper');
    registerSkill({ ...original, effects: [{ ...summonEffect(original), maxCount: 2 }] });
    const out = runBattleRecorded(input(original.id, 2));
    expect(summons(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
  });

  it.each(['lifeMax', 'mana', 'manaMax', 'attack', 'defense', 'magicResist', 'attackSpeed',
    'critChance', 'critDamage', 'physDodge', 'magicDodge', 'magicFind', 'goldFind'] as const)(
    'rejects nonfinite candidate %s before any transaction', field => {
      const factory = getSummon('raven');
      if (!factory) throw new Error('Missing original factory');
      try {
        registerSummon('raven', owner => {
          const valid = factory(owner);
          return { ...valid, stats: { ...valid.stats, [field]: NaN } };
        });
        const out = runBattleRecorded(input('druid.raven', 1));
        expect(summons(out.events)).toEqual([]);
        expect(mana(out.events)).toEqual([]);
        expect(casts(out.events)).toEqual([]);
      } finally { registerSummon('raven', factory); }
      expect(getSummon('raven')).toBe(factory);
    });

  it.each(['zero capacity', 'negative combat stat', 'nonfinite resistance'] as const)(
    'rejects invalid candidate %s atomically', kind => {
      const factory = getSummon('raven');
      if (!factory) throw new Error('Missing original factory');
      try {
        registerSummon('raven', owner => {
          const valid = factory(owner);
          const stats = kind === 'zero capacity' ? { ...valid.stats, lifeMax: 0 } :
            kind === 'negative combat stat' ? { ...valid.stats, attack: -1 } :
              { ...valid.stats, resistances: { ...valid.stats.resistances, physical: NaN } };
          return { ...valid, stats };
        });
        const out = runBattleRecorded(input('druid.raven', 1));
        expect(summons(out.events)).toEqual([]);
        expect(mana(out.events)).toEqual([]);
        expect(casts(out.events)).toEqual([]);
      } finally { registerSummon('raven', factory); }
      expect(getSummon('raven')).toBe(factory);
    });

  it('rolls back a later invalid candidate before IDs, registration, scheduling, RNG, payment or cooldowns change', () => {
    const originalFactory = getSummon('raven');
    if (!originalFactory) throw new Error('Missing original raven factory');
    const originalSkill = source();
    let built = 0;
    try {
      registerSummon('raven', owner => {
        const valid = originalFactory(owner);
        built++;
        return built === 2 ? { ...valid, stats: { ...valid.stats, attack: NaN } } : valid;
      });
      const snapshot = input('druid.raven', 2);
      const hero = { ...required(snapshot.playerTeam[0]), skillOrder: ['druid.raven', 'druid.poison_creeper'],
        skillLevels: { 'druid.raven': 2, 'druid.poison_creeper': 1 } };
      const dead = { ...preload(hero, 'hero-summon-poison_creeper-1', 'poison_creeper'), life: 0 };
      const before = structuredClone({ ...snapshot, playerTeam: [hero, dead] });
      const immutable = structuredClone(before);
      const actual = runBattleRecorded(before);
      expect(built).toBe(2);
      expect(before).toEqual(immutable);
      registerSkill({ ...originalSkill, summonOnStart: false });
      const control = runBattleRecorded(before);
      expect(actual).toEqual(control);
      expect(summons(actual.events).map(e => [e.unit.id, e.simClockMs])).toEqual([['hero-summon-poison_creeper-2', 0]]);
      expect(mana(actual.events).map(e => e.mana)).toEqual([992]);
    } finally {
      registerSummon('raven', originalFactory);
      registerSkill(originalSkill);
    }
    expect(getSummon('raven')).toBe(originalFactory);
    expect(getSkill('druid.raven')).toBe(originalSkill);
  });
});

describe('D06 authoritative owner/template deaths and legacy controls', () => {
  function deathInput(mode: 'paid' | 'full' | 'unaffordable' | 'invalid' | 'synthetic'): CombatSnapshot {
    const snapshot = input('druid.raven', mode === 'full' ? 1 : 2);
    const hero = { ...required(snapshot.playerTeam[0]), statuses: [], mana: mode === 'unaffordable' ? 5 : 100,
      skillOrder: [mode === 'synthetic' ? 'fixture.raven' : 'druid.raven'] };
    if (mode === 'synthetic') registerSkill({ ...source(), id: 'fixture.raven', archetype: 'fixture' });
    if (mode === 'invalid') registerSkill({ ...source(), effects: [summonEffect(), { kind: 'heal', target: 'self', amount: 1 }] });
    const live = { ...preload(hero), life: 1, statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1,
      remaining: 2, dotPerStack: 100, damageType: 'poison' as const }] };
    return { ...snapshot, playerTeam: [hero, live] };
  }
  it.each(['paid', 'full', 'unaffordable'] as const)('%s scoped pair never refunds or replaces a matching preloaded death', mode => {
    const out = runBattleRecorded(deathInput(mode));
    expect(out.events.some(e => e.kind === 'death' && e.target === 'preloaded')).toBe(true);
    expect(mana(out.events, 'summon-refund')).toEqual([]);
    expect(summons(out.events).map(e => e.simClockMs)).toEqual(mode === 'paid' ? [0] : []);
    expect(casts(out.events).map(e => e.simClockMs)).toEqual(mode === 'paid' ? [0] : []);
  });
  it.each(['invalid', 'synthetic'] as const)('%s source does not establish scoped refund authority', mode => {
    const out = runBattleRecorded(deathInput(mode));
    expect(mana(out.events, 'summon-refund').some(e => e.target === 'hero')).toBe(true);
    if (mode === 'synthetic') expect(summons(out.events).some(e => e.simClockMs > 0)).toBe(true);
    else expect(summons(out.events)).toEqual([]);
  });
  it('keeps refund authority local to an enabled owner, not a shared template', () => {
    const snapshot = deathInput('full');
    const b = { ...unit('legacy'), mana: 1, skillOrder: ['fixture.raven'], statuses: [] };
    registerSkill({ ...source(), id: 'fixture.raven', archetype: 'fixture' });
    const doomed = { ...preload(b, 'legacy-doomed'), life: 1,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 2, dotPerStack: 100,
        damageType: 'poison' as const }] };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [...snapshot.playerTeam, b, doomed] });
    expect(mana(out.events, 'summon-refund').map(e => e.target)).toEqual(['legacy']);
    expect(summons(out.events).some(e => e.owner === 'legacy' && e.simClockMs > 0)).toBe(true);
    expect(summons(out.events).some(e => e.owner === 'hero')).toBe(false);
  });
  it('preserves another template refund and cooldown reset on the SAME enabled owner', () => {
    const skeleton = source('fixture.legacy_skeleton');
    // A long legacy cooldown makes the death-triggered reset observable at the
    // 60s boundary. Only this synthetic source is changed; restore via afterEach.
    registerSkill({ ...skeleton, cooldown: 120 });
    const hero = { ...unit('hero'), mana: 100,
      skillOrder: ['fixture.legacy_skeleton', 'druid.raven'],
      skillLevels: { 'fixture.legacy_skeleton': 6, 'druid.raven': 1 } };
    const poison = [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 2,
      dotPerStack: 1, damageType: 'poison' as const }];
    const oldSkeleton = { ...preload(hero, 'old-skeleton', 'skeleton'), life: 1, statuses: poison };
    const oldRaven = { ...preload(hero, 'old-raven'), life: 1, statuses: poison };
    const snapshot = { ...input(), playerTeam: [hero, oldSkeleton, oldRaven] };
    const out = runBattleRecorded(snapshot);
    expect(casts(out.events).map(e => [e.skillId, e.simClockMs]))
      .toEqual([['fixture.legacy_skeleton', 0]]);
    expect(mana(out.events).map(e => e.mana)).toEqual([85]);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target))
      .toEqual(['old-skeleton', 'old-raven']);
    // Legacy refunds use the FIRST summon skill, here Skeleton's 15. Only the
    // enabled Raven pair is suppressed; no matching-template refund redesign.
    expect(mana(out.events, 'summon-refund').map(e => [e.target, e.mana])).toEqual([['hero', 100]]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.cooldowns)
      .not.toHaveProperty('fixture.legacy_skeleton');
    const control = runBattleRecorded({ ...snapshot, playerTeam: [
      { ...hero, skillOrder: ['fixture.legacy_skeleton'] }, oldSkeleton, oldRaven
    ] });
    expect(mana(control.events).map(e => e.mana)).toEqual([85]);
    expect(mana(control.events, 'summon-refund').map(e => [e.target, e.mana]))
      .toEqual([['hero', 100], ['hero', 115]]);
    expect(control.result.playerTeam.find(u => u.id === 'hero')?.cooldowns)
      .not.toHaveProperty('fixture.legacy_skeleton');
  });

  it('retains synthetic Skeleton replacement/refund behavior', () => {
    const snapshot = input('fixture.legacy_skeleton', 2);
    const hero = { ...required(snapshot.playerTeam[0]), mana: 15, statuses: [] };
    const enemy = { ...required(snapshot.enemyTeam[0]), statuses: [], stats: { ...required(snapshot.enemyTeam[0]).stats, attack: 10000 } };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero], enemyTeam: [enemy] });
    expect(summons(out.events).filter(e => e.summonId === 'skeleton').length).toBeGreaterThanOrEqual(2);
    expect(mana(out.events, 'summon-refund').length).toBeGreaterThan(0);
  });
  it('never replaces or refunds newly prepared scoped summons killed by ordinary enemy attacks', () => {
    const snapshot = input('druid.raven', 2);
    const enemy = { ...required(snapshot.enemyTeam[0]), statuses: [], stats: { ...required(snapshot.enemyTeam[0]).stats, attack: 10000 } };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [{ ...required(snapshot.playerTeam[0]), statuses: [] }], enemyTeam: [enemy] });
    const ids = summons(out.events).map(e => e.unit.id);
    expect(ids).toHaveLength(2);
    expect(out.events.some(e => e.kind === 'death' && ids.includes(e.target))).toBe(true);
    expect(summons(out.events).map(e => e.simClockMs)).toEqual([0, 0]);
    expect(mana(out.events, 'summon-refund')).toEqual([]);
  });
});

describe('D06 terminal and replay boundaries', () => {
  it('skips scoped startup in initially terminal battles while preserving synthetic/excluded startup', () => {
    registerSkill({ ...source(), id: 'fixture.raven', archetype: 'fixture' });
    const snapshot = input();
    const hero = { ...required(snapshot.playerTeam[0]), skillOrder: ['druid.raven', 'fixture.raven', 'fixture.legacy_skeleton'] };
    const out = runBattleRecorded({ ...snapshot, playerTeam: [hero], enemyTeam: [] });
    expect(casts(out.events).map(e => e.skillId)).toEqual(['fixture.raven', 'fixture.legacy_skeleton']);
    expect(summons(out.events).map(e => e.summonId)).toEqual(['raven', 'skeleton']);
    expect(mana(out.events).map(e => e.mana)).toEqual([994, 979]);
  });
  it('skips dead owners', () => {
    const snapshot = input();
    const out = runBattleRecorded({ ...snapshot, playerTeam: [{ ...required(snapshot.playerTeam[0]), life: 0 }] });
    expect(summons(out.events)).toEqual([]);
    expect(mana(out.events)).toEqual([]);
  });
  it('preserves input, recorded/plain and A-A/A-B-A equivalence without counter resets', () => {
    const a = input('druid.raven', 3);
    const b = input('druid.summon_spirit_wolf', 6);
    const before = structuredClone(a);
    const first = runBattleRecorded(a);
    expect(runBattle(a)).toEqual(first.result);
    expect(runBattleRecorded(a)).toEqual(first);
    runBattleRecorded(b);
    expect(runBattleRecorded(a)).toEqual(first);
    expect(a).toEqual(before);
    expect(summons(first.events).map(e => e.unit.id)).toEqual([
      'hero-summon-raven-1', 'hero-summon-raven-2', 'hero-summon-raven-3'
    ]);
  });
});
