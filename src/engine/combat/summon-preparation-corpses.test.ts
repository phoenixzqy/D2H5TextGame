import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type BattleEvent } from './combat';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import type { RegisteredSkill, SummonEffect } from '../skills/effects';
import type { CombatUnit } from './types';

interface ProjectedSnapshot extends CombatSnapshot {
  readonly skeletonMastery?: { readonly sourceHeroId: string; readonly rank: number; readonly maxRank: number;
    readonly summonLifePct: number; readonly summonAttackPct: number; readonly summonDefensePct: number };
}
const projection = (rank: number): NonNullable<ProjectedSnapshot['skeletonMastery']> =>
  ({ sourceHeroId: 'hero', rank, maxRank: 20, summonLifePct: rank * .04,
    summonAttackPct: rank * .02, summonDefensePct: rank * .01 });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 10000, mana: 60, stats: { life: 10000, lifeMax: 10000, mana: 60, manaMax: 60,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function snapshot(rank = 0, template = 'skeleton'): ProjectedSnapshot {
  const skill = template === 'skeletal_mage' ? 'necromancer.raise_skeletal_mage' : 'necromancer.raise_skeleton';
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillOrder: [skill], skillLevels: { [skill]: 6 },
    gridPosition: { row: 0, col: 0 }, summonGridPositions: [{ row: 1, col: 0 }, { row: 1, col: 1 }] }],
    enemyTeam: [{ ...unit('target', 'enemy'), life: 1000000,
      stats: { ...unit('target', 'enemy').stats, life: 1000000, lifeMax: 1000000 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    ...(rank > 0 ? { skeletonMastery: projection(rank) } : {}) };
}
function record(input: ProjectedSnapshot) {
  const before = structuredClone(input);
  const result = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(result.result);
  expect(runBattleRecorded(input)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out).not.toHaveProperty('skeletonMastery');
  }
  return result;
}
function summons(result: ReturnType<typeof record>) {
  return result.events.filter((event): event is Extract<BattleEvent, { kind: 'summon' }> &
    { readonly simClockMs: number; readonly uiDelayMs: number } => event.kind === 'summon');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Independent D06 v1c literals; imported fixtures are not earned progression evidence.
describe('D06 canonical Necromancer preparation and Mastery', () => {
  it.each([0, 1, 20])('prepares rank6 cap two at time zero for one payment under Mastery%i', rank => {
    // Stunned durable target keeps both skeletons alive for the full battle budget.
    const actual = record(snapshot(rank));
    const spawned = summons(actual);
    expect(spawned.map(e => e.unit.id)).toEqual(['hero-summon-skeleton-1', 'hero-summon-skeleton-2']);
    expect(spawned.map(e => e.unit.gridPosition)).toEqual([{ row: 1, col: 0 }, { row: 1, col: 1 }]);
    expect(spawned.map(e => e.simClockMs)).toEqual([0, 0]);
    expect(actual.events.filter(e => e.kind === 'mana')).toEqual([
      { kind: 'mana', target: 'hero', mana: 45, reason: 'cast', simClockMs: 0, uiDelayMs: 50 }
    ]);
    expect(actual.result.winner).toBeNull();
    expect(actual.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
    expect(actual.result.playerTeam.filter(u => u.summonOwnerId === 'hero' && u.life > 0)).toHaveLength(2);
  });

});

const RANKS = [1, 2, 3, 5, 6, 11, 12, 20] as const;
const CASES = [
  { id: 'necromancer.raise_skeleton', template: 'skeleton', cost: 15, cd: 1,
    caps: [1, 1, 1, 1, 2, 2, 3, 3], missing: 1 },
  { id: 'necromancer.raise_skeletal_mage', template: 'skeletal_mage', cost: 22, cd: 1,
    caps: [1, 2, 3, 3, 4, 5, 6, 8], missing: 3 },
  { id: 'necromancer.revive', template: 'revived', cost: 45, cd: 4,
    caps: [1, 2, 3, 3, 4, 5, 6, 8], missing: 3 }
] as const;
type PreparationCase = (typeof CASES)[number];
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing canonical fixture');
  return value;
}
function preparation(row: PreparationCase, rank = 6): ProjectedSnapshot {
  return { ...snapshot(), playerTeam: [{ ...unit('hero', 'player'), level: 30, mana: 1000,
    stats: { ...unit('hero', 'player').stats, mana: 1000, manaMax: 1000 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    skillOrder: [row.id], skillLevels: { [row.id]: rank } }] };
}
function source(row: PreparationCase): RegisteredSkill { return required(getSkill(row.id)); }
function effect(row: PreparationCase): SummonEffect {
  const value = source(row).effects[0];
  if (value?.kind !== 'summon') throw new Error('Missing canonical summon effect');
  return value;
}
function preload(owner: CombatUnit, template: string, id = 'preloaded'): CombatUnit {
  return { ...required(buildSummon(owner, template)), id, life: 13,
    gridPosition: { row: 1, col: 1 },
    statuses: [{ id: 'stun', sourceId: 'preload', stacks: 1, remaining: -1 }] };
}
function paid(out: ReturnType<typeof record>) {
  return out.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
}
function casts(out: ReturnType<typeof record>, owner = 'hero') {
  return out.events.filter(e => e.kind === 'action' && e.actor === owner && e.skillId !== null);
}
describe('D06 v1c canonical cap and payment oracles', () => {
  it.each(CASES.flatMap(row => RANKS.map((rank, index) => ({ ...row, rank, cap: required(row.caps[index]) }))))(
    '$id rank$rank creates cap$cap for one batch payment without a corpse', row => {
      const input = preparation(row, row.rank), out = record(input);
      expect(summons(out)).toHaveLength(row.cap);
      expect(summons(out).map(e => [e.owner, e.summonId, e.simClockMs]))
        .toEqual(Array.from({ length: row.cap }, () => ['hero', row.template, 0]));
      expect(casts(out).map(e => [e.kind === 'action' ? e.skillId : '', e.simClockMs])).toEqual([[row.id, 0]]);
      expect(paid(out)).toEqual([{ kind: 'mana', target: 'hero', mana: 1000 - row.cost,
        reason: 'cast', simClockMs: 0, uiDelayMs: 50 }]);
      expect(out.result.playerTeam[0]?.mana).toBe(1000 - row.cost);
    });
  it.each(CASES)('$id deduplicates both aliases at the authoritative authored rank', row => {
    const input = preparation(row), hero = required(input.playerTeam[0]);
    const authored = `skills-${row.id.replace('.', '-').replace(/_/g, '-')}`;
    const out = record({ ...input, playerTeam: [{ ...hero,
      skillOrder: [authored, row.id, authored], skillLevels: { [authored]: 6 } }] });
    expect(summons(out)).toHaveLength(row.missing + 1);
    expect(casts(out)).toHaveLength(1); expect(paid(out)).toHaveLength(1);
    expect(summons(out).every(e => e.simClockMs === 0)).toBe(true);
  });
  it.each(CASES)('$id preserves one damaged preload and pays once for missing units', row => {
    const input = preparation(row), hero = required(input.playerTeam[0]);
    const live = preload(hero, row.template);
    const out = record({ ...input, playerTeam: [hero, live] });
    expect(summons(out)).toHaveLength(row.missing);
    expect(summons(out).every(e => e.simClockMs === 0)).toBe(true);
    expect(paid(out).map(e => e.kind === 'mana' ? e.mana : 0)).toEqual([1000 - row.cost]);
    expect(out.result.playerTeam.find(u => u.id === live.id)).toMatchObject({ life: 13,
      stats: live.stats, statuses: live.statuses, gridPosition: live.gridPosition });
  });
  it.each(CASES)('$id never retries a poor batch after actual regeneration', row => {
    const input = preparation(row), hero = required(input.playerTeam[0]);
    const out = record({ ...input, playerTeam: [{ ...hero, mana: row.cost - 1,
      statuses: [], manaRegenPerSecond: 10 }] });
    expect(summons(out)).toEqual([]); expect(casts(out)).toEqual([]); expect(paid(out)).toEqual([]);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'regeneration' && e.mana >= row.cost)).toBe(true);
    expect(out.result.playerTeam[0]?.mana).toBeGreaterThan(row.cost);
  });
});

describe('D06 v1c death authority and ownership', () => {
  function dying(row: PreparationCase, mode: 'paid' | 'full' | 'poor' | 'invalid' | 'synthetic') {
    const input = preparation(row, mode === 'full' ? 1 : 6);
    const hero = { ...required(input.playerTeam[0]), statuses: [], mana: mode === 'poor' ? row.cost - 1 : 100 };
    if (mode === 'synthetic') {
      registerSkill({ ...source(row), id: 'fixture.corpse-legacy', archetype: 'fixture' });
      hero.skillOrder = ['fixture.corpse-legacy'];
    }
    if (mode === 'invalid') registerSkill({ ...source(row),
      effects: [effect(row), { kind: 'heal', target: 'self', amount: 1 }] });
    const live = { ...preload(hero, row.template), life: 1,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 2,
        dotPerStack: 100, damageType: 'poison' as const }] };
    return { ...input, playerTeam: [hero, live] };
  }
  it.each(CASES.flatMap(row => (['paid', 'full', 'poor'] as const).map(mode => ({ ...row, mode }))))(
    '$id $mode preparation never refunds or replaces a matching preload death', row => {
      const out = record(dying(row, row.mode));
      expect(out.events.some(e => e.kind === 'death' && e.target === 'preloaded')).toBe(true);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
      expect(summons(out).map(e => e.simClockMs)).toEqual(row.mode === 'paid' ? Array(row.missing).fill(0) : []);
      expect(casts(out).map(e => e.simClockMs)).toEqual(row.mode === 'paid' ? [0] : []);
    });
  it.each(CASES.flatMap(row => (['invalid', 'synthetic'] as const).map(mode => ({ ...row, mode }))))(
    '$id $mode source retains legacy refund authority', row => {
      const out = record(dying(row, row.mode));
      expect(out.events.some(e => e.kind === 'mana' && e.reason === 'summon-refund' && e.target === 'hero')).toBe(true);
      if (row.mode === 'synthetic') expect(summons(out).some(e => e.simClockMs > 0)).toBe(true);
      else expect(summons(out)).toEqual([]);
    });
  it.each(CASES)('$id authority is local to the enabled owner', row => {
    const input = dying(row, 'full'), canonical = required(input.playerTeam[0]);
    registerSkill({ ...source(row), id: 'fixture.other-owner', archetype: 'fixture' });
    const legacy = { ...canonical, id: 'legacy', mana: 1, skillOrder: ['fixture.other-owner'] };
    const old = { ...preload(legacy, row.template, 'legacy-doomed'), life: 1,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 2,
        dotPerStack: 100, damageType: 'poison' as const }] };
    const out = record({ ...input, playerTeam: [...input.playerTeam, legacy, old] });
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')
      .map(e => e.kind === 'mana' ? e.target : '')).toEqual(['legacy']);
    expect(summons(out).some(e => e.owner === 'hero')).toBe(false);
    expect(summons(out).some(e => e.owner === 'legacy' && e.simClockMs > 0)).toBe(true);
  });
});

describe('D06 v1c fresh Mastery and Revive identity', () => {
  it.each([
    ['necromancer.raise_skeletal_mage', 0, 123, 45, 10],
    ['necromancer.raise_skeletal_mage', 1, 127.92, 45.9, 10.1],
    ['necromancer.raise_skeletal_mage', 20, 221.4, 63, 12],
    ['necromancer.revive', 0, 210, 38, 23],
    ['necromancer.revive', 1, 210, 38, 23],
    ['necromancer.revive', 20, 210, 38, 23]
  ] as const)('%s retains creation stats under Mastery%i', (id, mastery, life, attack, defense) => {
    const row = required(CASES.find(value => value.id === id));
    const input = { ...preparation(row), ...(mastery ? { skeletonMastery: projection(mastery) } : {}) };
    const out = record(input), created = summons(out);
    expect(created).toHaveLength(4);
    for (const event of created) {
      expect(event.simClockMs).toBe(0);
      expect(event.unit.life).toBeCloseTo(life, 12);
      expect(event.unit.stats.lifeMax).toBeCloseTo(life, 12);
      expect(event.unit.stats.attack).toBeCloseTo(attack, 12);
      expect(event.unit.stats.defense).toBeCloseTo(defense, 12);
      if (row.template === 'skeletal_mage') expect(event.unit.stats.magicDodge).toBe(.09);
    }
    // Revive persists to the wave budget without an enemy-derived identity or expiry.
    expect(out.result.playerTeam.filter(u => u.summonTemplateId === row.template && u.life > 0)).toHaveLength(4);
    const sources = new Set(created.map(e => e.unit.id));
    const damage = out.events.filter(e => e.kind === 'damage' && sources.has(e.source));
    expect(damage.length).toBeGreaterThan(0);
    expect(damage.every(e => e.kind === 'damage' && e.damageType === 'physical')).toBe(true);
    expect(out.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 60000 });
  });
});

describe('D06 v1c atomic source and whole-batch rejection', () => {
  const invalid: readonly [string, (s: RegisteredSkill, e: SummonEffect) => RegisteredSkill][] = [
    ['wrong cap', (s, e) => ({ ...s, effects: [{ ...e, maxCount: e.maxCount === 3 ? 8 : 3 }] })],
    ['wrong curve', (s, e) => ({ ...s, effects: [{ ...e, maxCountScaling: {
      kind: e.maxCount === 3 ? 'first-three-then-every-three' : 'raise-skeleton-1-6-12-cap-3' } }] })],
    ['missing curve', (s, e) => { const { maxCountScaling: _curve, ...rest } = e; return { ...s, effects: [rest] }; }],
    ['wrong template', (s, e) => ({ ...s, effects: [{ ...e, summonId: 'raven' }] })],
    ['extra effect', (s, e) => ({ ...s, effects: [e, { kind: 'heal', target: 'self', amount: 1 }] })],
    ['passive', s => ({ ...s, trigger: 'passive' })],
    ['no startup', s => ({ ...s, summonOnStart: false })],
    ['nonfinite payment', s => ({ ...s, manaCost: NaN })],
    ['nonfinite growth', (s, e) => ({ ...s, effects: [{ ...e, statScaling: { lifeMax: NaN } }] })]
  ];
  it.each(CASES.flatMap(row => invalid.map(([name, change]) => ({ ...row, name, change }))))(
    '$id rejects $name before payment or later retry', row => {
      registerSkill(row.change(source(row), effect(row)));
      const input = preparation(row), hero = required(input.playerTeam[0]);
      const out = record({ ...input, playerTeam: [{ ...hero, statuses: [], manaRegenPerSecond: 10 }] });
      expect(summons(out)).toEqual([]); expect(casts(out)).toEqual([]); expect(paid(out)).toEqual([]);
      expect(out.result.playerTeam[0]?.mana).toBe(1000);
    });
  it.each(CASES)('$id stages a late-invalid candidate before consuming IDs, mana or scheduler entries', row => {
    const factory = required(getSummon(row.template));
    let calls = 0;
    try {
      registerSummon(row.template, owner => {
        const valid = factory(owner);
        return ++calls % 2 === 0 ? { ...valid, stats: { ...valid.stats, attack: NaN } } : valid;
      });
      const input = preparation(row), hero = required(input.playerTeam[0]);
      const out = record({ ...input, playerTeam: [{ ...hero, skillOrder: [row.id, 'druid.raven'],
        skillLevels: { [row.id]: 6, 'druid.raven': 1 } }] });
      expect(summons(out).map(e => [e.unit.id, e.simClockMs])).toEqual([['hero-summon-raven-1', 0]]);
      expect(paid(out).map(e => e.kind === 'mana' ? e.mana : 0)).toEqual([994]);
      expect(casts(out)).toEqual([expect.objectContaining({ skillId: 'druid.raven', simClockMs: 0 })]);
    } finally { registerSummon(row.template, factory); }
  });
});

describe('D06 v1c preload, coexistence and terminal boundaries', () => {
  it.each(CASES.flatMap(row => [1, 2].map(count => ({ ...row, count }))))(
    '$id preserves full/over-cap preloads ($count) without a cast or cost', row => {
      const input = preparation(row, 1), hero = required(input.playerTeam[0]);
      const old = Array.from({ length: row.count }, (_, index) => preload(hero, row.template, `old-${String(index)}`));
      const out = record({ ...input, playerTeam: [hero, ...old] });
      expect(summons(out)).toEqual([]); expect(paid(out)).toEqual([]); expect(casts(out)).toEqual([]);
      for (const live of old) expect(out.result.playerTeam.find(u => u.id === live.id))
        .toMatchObject({ life: 13, stats: live.stats, statuses: live.statuses, gridPosition: live.gridPosition });
      expect(out.result.playerTeam[0]?.mana).toBe(1000);
    });
  it.each(CASES)('$id skips reserved dead IDs without moving damaged preloads', row => {
    const input = preparation(row), hero = { ...required(input.playerTeam[0]),
      summonGridPositions: [{ row: 0, col: 2 }] };
    const old = preload(hero, row.template);
    const dead = { ...preload(hero, row.template, `hero-summon-${row.template}-1`), life: 0 };
    const out = record({ ...input, playerTeam: [hero, old, dead] });
    expect(summons(out)[0]).toMatchObject({ simClockMs: 0, unit: {
      id: `hero-summon-${row.template}-2`, gridPosition: { row: 0, col: 2 } } });
    expect(out.result.playerTeam.find(u => u.id === dead.id)?.life).toBe(0);
    expect(out.result.playerTeam.find(u => u.id === old.id)).toMatchObject({ life: 13,
      stats: old.stats, statuses: old.statuses, gridPosition: old.gridPosition });
  });
  it('coexists at each exact template cap with stable skill order and three payments', () => {
    const input = preparation(CASES[0]), hero = required(input.playerTeam[0]);
    const out = record({ ...input, playerTeam: [{ ...hero,
      skillOrder: CASES.map(row => row.id), skillLevels: Object.fromEntries(CASES.map(row => [row.id, 6])) }] });
    expect(summons(out).map(e => e.summonId)).toEqual([
      'skeleton', 'skeleton', 'skeletal_mage', 'skeletal_mage', 'skeletal_mage', 'skeletal_mage',
      'revived', 'revived', 'revived', 'revived']);
    expect(summons(out).every(e => e.simClockMs === 0)).toBe(true);
    expect(new Set(summons(out).map(e => e.unit.id)).size).toBe(10);
    expect(paid(out).map(e => e.kind === 'mana' ? e.mana : 0)).toEqual([985, 963, 918]);
    const a = preparation(CASES[0]), before = structuredClone(a), first = record(a);
    record(preparation(CASES[2])); expect(record(a)).toEqual(first); expect(a).toEqual(before);
  });
  it.each(CASES.flatMap(row => (['empty', 'dead-enemy', 'dead-owner'] as const).map(mode => ({ ...row, mode }))))(
    '$id skips $mode startup without any payment or ordinary selection', row => {
      const input = preparation(row), hero = required(input.playerTeam[0]);
      const out = record({ ...input,
        playerTeam: [{ ...hero, ...(row.mode === 'dead-owner' ? { life: 0 } : {}) }],
        enemyTeam: row.mode === 'empty' ? [] : input.enemyTeam.map(u => ({ ...u,
          ...(row.mode === 'dead-enemy' ? { life: 0 } : {}) })) });
      expect(summons(out)).toEqual([]); expect(paid(out)).toEqual([]); expect(casts(out)).toEqual([]);
    });
});

describe('D06 v1c ordinary actions and prepared-unit death', () => {
  it.each(CASES)('$id ignores only its stale startup cooldown and consumes no ordinary action', row => {
    registerSkill({ id: 'fixture.unrelated', archetype: 'fixture', target: 'single-enemy',
      minLevel: 1, cooldown: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [1, 1] }] });
    const input = preparation(row), hero = required(input.playerTeam[0]);
    const out = record({ ...input, playerTeam: [{ ...hero, statuses: [],
      stats: { ...hero.stats, attack: 10000000, attackSpeed: 263 },
      cooldowns: { [row.id]: 90000, 'fixture.unrelated': 90000 },
      skillOrder: [row.id, 'fixture.unrelated'] }] });
    expect(casts(out)).toEqual([expect.objectContaining({ skillId: row.id, simClockMs: 0 })]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs > 0))
      .toEqual([expect.objectContaining({ skillId: null, simClockMs: 400 })]);
    expect(out.result.playerTeam[0]?.cooldowns).toEqual({
      [row.id]: row.cd * 1000 - 400, 'fixture.unrelated': 89600 });
    expect(paid(out)).toHaveLength(1);
  });
  it.each(CASES)('$id never replaces or refunds freshly prepared units killed by attacks', row => {
    const input = preparation(row), hero = required(input.playerTeam[0]);
    const enemy = required(input.enemyTeam[0]);
    const out = record({ ...input, playerTeam: [{ ...hero, life: 1000000,
      stats: { ...hero.stats, life: 1000000, lifeMax: 1000000 }, statuses: [] }],
      enemyTeam: [{ ...enemy, statuses: [], stats: { ...enemy.stats, attack: 10000 } }] });
    const created = summons(out), ids = new Set(created.map(e => e.unit.id));
    expect(created).toHaveLength(row.missing + 1);
    expect(created.every(e => e.simClockMs === 0)).toBe(true);
    expect(out.events.some(e => e.kind === 'death' && ids.has(e.target))).toBe(true);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
  });
});


describe('D06 carried cooldown initialization regression', () => {
  it.each(['sorceress.fire_bolt', 'skills-sorceress-fire-bolt'])(
    'honors ordinary input cooldown key %s until exact expiry without mutating the input', alias => {
      const input = preparation(CASES[0]), hero = required(input.playerTeam[0]);
      const out = record({ ...input, playerTeam: [{ ...hero, statuses: [],
        stats: { ...hero.stats, attackSpeed: 263 }, skillOrder: [alias],
        skillLevels: { 'sorceress.fire_bolt': 1 }, cooldowns: { [alias]: 1200 } }] });
      expect(summons(out)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').slice(0, 3)
        .map(e => [e.kind === 'action' ? e.skillId : '', e.simClockMs]))
        .toEqual([[null, 400], [null, 800], ['sorceress.fire_bolt', 1200]]);
      expect(paid(out)[0]).toMatchObject({ simClockMs: 1200, mana: 992 });
    });
  it.each([0, -1, NaN, Infinity, -Infinity])('ignores invalid/expired remaining duration %s', duration => {
    const input = preparation(CASES[0]), hero = required(input.playerTeam[0]);
    const out = record({ ...input, playerTeam: [{ ...hero, statuses: [],
      stats: { ...hero.stats, attackSpeed: 263 }, skillOrder: ['sorceress.fire_bolt'],
      skillLevels: { 'sorceress.fire_bolt': 1 }, cooldowns: { 'sorceress.fire_bolt': duration } }] });
    expect(casts(out)[0]).toMatchObject({ skillId: 'sorceress.fire_bolt', simClockMs: 400 });
  });
});
