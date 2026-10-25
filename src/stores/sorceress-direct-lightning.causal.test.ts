import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/sorceress.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { statusActiveAt } from '@/engine/combat/status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { playerToCombatUnit } from './combatHelpers';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
function fixture(slug = 'chain-lightning', rank = 1, seed = 7): CombatSnapshot {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(value => value.id === id);
    if (!row) throw new Error('Missing lightning prerequisite');
    for (const ancestor of row.prerequisites ?? []) add(ancestor);
    levels[id] = 1;
  }
  const id = 'skills-sorceress-' + slug;
  add(id); levels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic direct lightning', 'sorceress'),
    id: 'hero', level: 30, skillLevels: levels, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: 12 }, (_, i): CombatUnit => ({
    ...hero, id: 'target-' + String(i), side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [], statuses: [hold()],
    gridPosition: { row: Math.floor(i / 3), col: i % 3 }
  })) };
}
function heroDamage(event: RecordedBattleEvent): event is Extract<RecordedBattleEvent, { kind: 'damage' }> {
  return event.kind === 'damage' && event.source === 'hero';
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(unit => ({ id: unit.id, life: unit.life, mana: unit.mana,
    statuses: unit.life > 0 ? unit.statuses.filter(status => statusActiveAt(status, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
it.each([1, 2, 20])('Chain Lightning rank%i makes five distinct nearest-neighbor attempts', rank => {
  const input = fixture('chain-lightning', rank);
  const out = runBattleRecorded(input);
  expect(out.events.filter(heroDamage).map(event => event.target))
    .toEqual(['target-0', 'target-1', 'target-2', 'target-5', 'target-4']);
  expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
});

const spells = [
  { slug: 'charged-bolt', min: 25, max: 40, growth: 3, cost: 8, cooldown: 1, targets: ['target-0', 'target-1'] },
  { slug: 'lightning', min: 45, max: 80, growth: 6, cost: 15, cooldown: 1, targets: ['target-0'] },
  { slug: 'nova', min: 40, max: 60, growth: 4, cost: 18, cooldown: 2, targets: Array.from({ length: 12 }, (_, i) => 'target-' + String(i)) },
  { slug: 'chain-lightning', min: 50, max: 70, growth: 5, cost: 25, cooldown: 2, targets: ['target-0', 'target-1', 'target-2', 'target-5', 'target-4'] }
] as const;
for (const spell of spells) for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(`${spell.slug} rank${String(rank)} has exact independent paid hits, seed%i`, seed => {
    const input = fixture(spell.slug, rank, seed), rng = createRng(seed);
    const expected = spell.targets.map(target => {
      const hit = rng.chance(.85);
      const amount = hit ? rng.nextInt(spell.min + spell.growth * (rank - 1), spell.max + spell.growth * (rank - 1)) : 0;
      if (hit) { rng.chance(0); if (spell.slug === 'chain-lightning') rng.chance(1); }
      return { target, amount, dodged: !hit };
    });
    const out = record(input);
    expect(out.events.filter(heroDamage).map(event => ({ target: event.target, amount: event.amount, dodged: event.dodged }))).toEqual(expected);
    expect(out.events.filter(event => event.kind === 'action' && event.actor === 'hero')).toHaveLength(1);
    expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
    expect(out.events.filter(event => event.kind === 'dot')).toEqual([]);
    for (const target of input.enemyTeam) {
      const hit = expected.find(event => event.target === target.id);
      expect(out.result.enemyTeam.find(unit => unit.id === target.id)?.life).toBe(2000 - (hit?.amount ?? 0));
      expect(out.events.flatMap(event => event.kind === 'status' && event.target === target.id ? [event.statusId] : []))
        .toEqual(spell.slug === 'chain-lightning' && hit && !hit.dodged ? ['paralyze'] : []);
    }
  });
}
for (const spell of spells) {
  const id = 'skills-sorceress-' + spell.slug, canonical = 'sorceress.' + spell.slug.replaceAll('-', '_');
  it(`${spell.slug} requires legal native class/unlock/ranks and transitive prerequisites`, () => {
    const levels = Object.fromEntries(Object.entries(fixture(spell.slug).playerTeam[0]?.skillLevels ?? {}).map(([key, value]) =>
      [key.startsWith('skills-sorceress-') ? 'sorceress.' + key.slice('skills-sorceress-'.length).replaceAll('-', '_') : key, value]));
    const source = rows.find(row => row.id === id);
    if (!source) throw new Error('Missing lightning authority source');
    const owner = { ...createMockPlayer('Lightning authority', 'sorceress'), level: 30, skillLevels: levels, comboOrder: [id] };
    for (const patch of [{ class: 'barbarian' as const }, { level: source.requiredLevel - 1 }, { skillLevels: {} },
      ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...levels, [canonical]: rank } }))])
      expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
    for (const ancestor of Object.keys(levels).filter(key => key !== canonical)) {
      const missing = { ...levels }; Reflect.deleteProperty(missing, ancestor);
      expect(playerToCombatUnit({ ...owner, skillLevels: missing }).skillOrder).toEqual([]);
    }
    const before = structuredClone(owner);
    expect(playerToCombatUnit(owner).skillOrder).toEqual([spell.slug === 'chain-lightning' ? canonical : id]);
    const aliased = playerToCombatUnit({ ...owner, comboOrder: [canonical], skillLevels: { ...levels, [canonical]: 20 } });
    expect(aliased.skillOrder).toEqual([canonical]); expect(aliased.skillLevels?.[canonical]).toBe(20);
    expect(owner).toEqual(before);
  });
  it(`${spell.slug} refuses insufficient mana/carried cooldown without payment`, () => {
    for (const patch of [{ mana: spell.cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const input = fixture(spell.slug);
      const out = record({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit, ...patch })) });
      expect(out.events.some(event => event.kind === 'action' && event.skillId === canonical)).toBe(false);
      expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toEqual([]);
      expect(out.events.filter(event => event.kind === 'status')).toEqual([]);
    }
  });
  it(`${spell.slug} uses Lightning resistance then flat MR rather than Defense`, () => {
    const input = fixture(spell.slug), original = record(input).events.filter(heroDamage);
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(unit => ({ ...unit, stats: { ...unit.stats,
      defense: 99999, magicResist: 7, resistances: { ...unit.stats.resistances, lightning: 50 } } })) });
    expect(out.events.filter(heroDamage).map(event => [event.target, event.amount, event.dodged]))
      .toEqual(original.map(event => [event.target, event.dodged ? 0 : Math.max(1, Math.floor(event.amount * .5 - 7)), event.dodged]));
  });
  it(`${spell.slug} composes native rank2 Lightning Mastery and ordinary criticals`, () => {
    const input = fixture(spell.slug), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing lightning caster');
    const native = playerToCombatUnit({ ...createMockPlayer('Lightning Mastery composition', 'sorceress'), level: 30,
      skillLevels: { ...hero.skillLevels, 'skills-sorceress-lightning-mastery': 2 } });
    const increased = native.increasedDamagePct;
    if (!increased) throw new Error('Missing native Lightning Mastery projection');
    expect(increased.lightning).toBe(.08);
    const original = record(input).events.filter(heroDamage);
    const out = record({ ...input, playerTeam: [{ ...hero, increasedDamagePct: increased, stats: { ...hero.stats, critChance: 1 } }] });
    expect(out.events.filter(heroDamage).map(event => [event.target, event.amount, event.crit]))
      .toEqual(original.map(event => [event.target, event.dodged ? 0 : Math.floor(event.amount * 1.08 * 2), !event.dodged]));
  });
  it.each(['trash', 'boss'] as const)(`${spell.slug} respects actual Chill combo damage on %s`, tier => {
    const input = fixture(spell.slug), original = record(input).events.filter(heroDamage), factor = tier === 'boss' ? 1.15 : 1.3;
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(unit => ({ ...unit, tier, statuses: [...unit.statuses,
      { id: 'chill', sourceId: 'earlier-cold', stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000 }] })) });
    expect(out.events.filter(heroDamage).map(event => [event.target, event.amount, event.dodged]))
      .toEqual(original.map(event => [event.target, event.dodged ? 0 : Math.floor(event.amount * factor), event.dodged]));
  });
  it(`${spell.slug} pays once on a natural miss and applies no control`, () => {
    const input = fixture(spell.slug, 1, 4);
    const out = record({ ...input, enemyTeam: input.enemyTeam.slice(0, 1) });
    expect(out.events.filter(heroDamage)).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(out.events.filter(event => event.kind === 'status')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
  });
  it(`${spell.slug} starts one cooldown and waits for the next eligible action`, () => {
    const input = fixture(spell.slug);
    const out = record({ ...input,
      playerTeam: input.playerTeam.map(unit => ({ ...unit, statuses: [], stats: { ...unit.stats, attackSpeed: 263 } })),
      enemyTeam: input.enemyTeam.slice(0, 1).map(unit => ({ ...unit, life: 200000, stats: { ...unit.stats, lifeMax: 200000 } })) });
    const times = out.events.filter(event => event.kind === 'action' && event.skillId === canonical).map(event => event.simClockMs);
    expect(times.slice(0, 2)).toEqual([400, 400 + Math.ceil(spell.cooldown * 1000 / 400) * 400]);
    expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toHaveLength(times.length);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost * times.length);
  });
}
it.each([7, 19, 41, 97])('Chain Lightning reports actual Paralyze acceptance during its residual window, seed%i', seed => {
  const input = fixture('chain-lightning', 1, seed), rng = createRng(seed);
  const hit = rng.chance(.85);
  let accepted = false;
  if (hit) { rng.nextInt(50, 70); rng.chance(0); rng.chance(1); accepted = rng.chance(.5); }
  const out = record({ ...input, enemyTeam: input.enemyTeam.slice(0, 1).map(unit => ({ ...unit, statuses: [...unit.statuses,
    { id: 'paralyze-cd', sourceId: 'earlier-lightning', stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }] })) });
  const states = out.events.flatMap(event => event.kind === 'status-state' && event.simClockMs === 1700
    ? event.statuses.filter(status => status.id === 'paralyze') : []);
  expect(states.length > 0).toBe(accepted);
  for (const status of states) expect(status).toMatchObject({ sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: 2700 });
  expect(out.events.filter(event => event.kind === 'status' && event.statusId === 'paralyze')).toHaveLength(accepted ? 1 : 0);
});
it('Chain Lightning reaches five separated/overflow enemies without revisiting a target', () => {
  const input = fixture();
  const snapshot: CombatSnapshot = { ...input, enemyTeam: input.enemyTeam.map((unit, i) => ({
    ...unit, gridPosition: { row: i * 3, col: i % 3 }
  })) };
  const out = runBattleRecorded(snapshot);
  expect(out.events.filter(heroDamage).map(event => event.target))
    .toEqual(['target-0', 'target-1', 'target-2', 'target-3', 'target-4']);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
});
it.each(['trash', 'boss', 'chapter-boss'] as const)('Chain Lightning actually interrupts %s actions for its exact one-second interval', tier => {
  const input = fixture('chain-lightning'), baseline = fixture('lightning');
  // Cast before the first enemy action: tied actors use seeded priority, so a
  // 1700ms enemy action could legally precede the 1700ms application.
  const caster = (unit: CombatUnit): CombatUnit => ({ ...unit, statuses: [hold(401)],
    stats: { ...unit.stats, attackSpeed: 263 } });
  const enemy = (unit: CombatUnit): CombatUnit => ({ ...unit, tier, statuses: [],
    stats: { ...unit.stats, attackSpeed: 200 } });
  const plain = record({ ...baseline, playerTeam: baseline.playerTeam.map(caster), enemyTeam: baseline.enemyTeam.slice(0, 1).map(enemy) });
  const out = record({ ...input, playerTeam: input.playerTeam.map(caster), enemyTeam: input.enemyTeam.slice(0, 1).map(enemy) });
  const actions = (events: readonly RecordedBattleEvent[]) => events.filter(event => event.kind === 'action' && event.actor === 'target-0');
  expect(actions(plain.events)[0]?.simClockMs).toBe(900);
  expect(actions(out.events)[0]?.simClockMs).toBe(1800);
  expect(actions(out.events).some(event => event.simClockMs >= 400 && event.simClockMs < 1400)).toBe(false);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'target-0', simClockMs: 900 }));
  const application = out.events.find(event => event.kind === 'status-state' && event.target === 'target-0' && event.simClockMs === 400);
  if (application?.kind !== 'status-state') throw new Error('Missing exact Paralyze application snapshot');
  expect(application.statuses).toContainEqual(expect.objectContaining({ id: 'paralyze', expiresAtMs: 1400 }));
  const expiry = out.events.find(event => event.kind === 'status-state' && event.target === 'target-0' && event.simClockMs === 1400);
  if (expiry?.kind !== 'status-state') throw new Error('Missing exact Paralyze expiry snapshot');
  expect(expiry.statuses).toEqual([expect.objectContaining({ id: 'paralyze-cd', expiresAtMs: 5400 })]);
});
it('continues the original chain after a natural first-target miss', () => {
  const out = record(fixture('chain-lightning', 1, 4));
  expect(out.events.filter(heroDamage).map(event => event.target)).toEqual(['target-0', 'target-1', 'target-2', 'target-5', 'target-4']);
  expect(out.events.filter(heroDamage)[0]).toMatchObject({ amount: 0, dodged: true });
});
it('excludes dead/friendly units and continues after a lethal first hit without replacement', () => {
  const input = fixture(), hero = input.playerTeam[0], first = input.enemyTeam[0];
  if (!hero || !first) throw new Error('Missing chain boundary fixture');
  const out = record({ ...input,
    playerTeam: [...input.playerTeam, { ...hero, id: 'friendly', skillOrder: [], skillLevels: {}, statuses: [hold()] }],
    enemyTeam: [{ ...first, id: 'already-dead', life: 0 }, ...input.enemyTeam.map((unit, i) => i === 0 ? { ...unit, life: 1 } : unit)] });
  expect(out.events.filter(heroDamage).map(event => event.target)).toEqual(['target-0', 'target-1', 'target-2', 'target-5', 'target-4']);
  expect(out.events.filter(event => event.kind === 'death')).toEqual([expect.objectContaining({ target: 'target-0' })]);
  expect(out.result.playerTeam.find(unit => unit.id === 'friendly')?.life).toBe(2000);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
});
it('stops at the actual small pool rather than revisiting targets to fill five slots', () => {
  const input = fixture();
  const out = record({ ...input, enemyTeam: input.enemyTeam.slice(0, 2) });
  expect(out.events.filter(heroDamage).map(event => event.target)).toEqual(['target-0', 'target-1']);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
});
it('does not pay or cast when no living hostiles remain', () => {
  const input = fixture();
  const out = record({ ...input, enemyTeam: [] });
  expect(out.events.filter(event => event.kind === 'action' || event.kind === 'mana')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(100);
});
