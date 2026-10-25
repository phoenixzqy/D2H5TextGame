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

const spells = [
  { slug: 'fire-bolt', min: 30, max: 45, growth: 4, cost: 8, cooldown: 1 },
  { slug: 'fire-ball', min: 70, max: 100, growth: 7, cost: 20, cooldown: 1 },
  { slug: 'meteor', min: 100, max: 150, growth: 10, cost: 50, cooldown: 4 }
] as const;
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
function fixture(slug: string, rank = 1, seed = 7) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const source = rows.find(row => row.id === id);
    if (!source) throw new Error('Missing fire prerequisite');
    for (const required of source.prerequisites ?? []) add(required);
    levels[id] = 1;
  }
  const id = 'skills-sorceress-' + slug; add(id); levels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic direct fire', 'sorceress'),
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
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
it.each([1, 2, 20])('Meteor rank%i attempts all twelve living hostiles including overflow', rank => {
  const input = fixture('meteor', rank);
  const out = runBattleRecorded(input);
  expect(out.events.filter(heroDamage).map(e => e.target))
    .toEqual(input.enemyTeam.map(u => u.id));
  expect(out.result.playerTeam[0]?.mana).toBe(50);
});
it('Meteor attempts separated enemies independently of a fixed box', () => {
  const input = fixture('meteor');
  input.enemyTeam = input.enemyTeam.slice(0, 3).map((u, i) => ({ ...u,
    gridPosition: { row: i * 3, col: i } }));
  expect(runBattleRecorded(input).events.filter(heroDamage).map(e => e.target))
    .toEqual(input.enemyTeam.map(u => u.id));
});
for (const spell of spells) for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(`${spell.slug} rank${String(rank)} has exact paid hits and periodic HP loss, seed%i`, seed => {
    const input = fixture(spell.slug, rank, seed), rng = createRng(seed);
    const targets = spell.slug === 'meteor' ? input.enemyTeam : input.enemyTeam.slice(0, 1);
    const expected = targets.map(target => {
      const hit = rng.chance(.85);
      const amount = hit ? rng.nextInt(spell.min + spell.growth * (rank - 1), spell.max + spell.growth * (rank - 1)) : 0;
      if (hit) { rng.chance(0); rng.chance(1); if (spell.slug === 'meteor') rng.chance(1); }
      return { target: target.id, amount, dodged: !hit };
    });
    const out = record(input);
    expect(out.events.filter(heroDamage).map(e => ({ target: e.target, amount: e.amount, dodged: e.dodged }))).toEqual(expected);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.' + spell.slug.replaceAll('-', '_'))).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
    for (const target of input.enemyTeam) {
      const hit = expected.find(e => e.target === target.id), damage = hit?.amount ?? 0;
      const periodic = damage > 0 ? Math.max(1, Math.floor(damage * .1)) * 3 : 0;
      const actualPeriodic = out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === target.id ? e.amount : 0), 0);
      expect(actualPeriodic).toBe(periodic);
      expect(out.result.enemyTeam.find(u => u.id === target.id)?.life).toBe(2000 - damage - periodic);
      const statuses = out.events.flatMap(e => e.kind === 'status' && e.target === target.id ? [e.statusId] : []);
      expect(statuses).toEqual(damage > 0 ? spell.slug === 'meteor' ? ['burn', 'armor-melt'] : ['burn'] : []);
    }
  });
}
for (const spell of spells) {
  const id = 'skills-sorceress-' + spell.slug, canonical = 'sorceress.' + spell.slug.replaceAll('-', '_');
  it(`${spell.slug} requires native class/unlock/rank and every transitive prerequisite`, () => {
    const levels = Object.fromEntries(Object.entries(fixture(spell.slug).playerTeam[0]?.skillLevels ?? {}).map(([key, value]) =>
      [key.startsWith('skills-sorceress-') ? 'sorceress.' + key.slice('skills-sorceress-'.length).replaceAll('-', '_') : key, value]));
    const source = rows.find(row => row.id === id);
    if (!source) throw new Error('Missing fire authority source');
    const owner = { ...createMockPlayer('Fire authority', 'sorceress'), level: 30, skillLevels: levels, comboOrder: [id] };
    for (const patch of [{ class: 'barbarian' as const }, { level: source.requiredLevel - 1 },
      { skillLevels: {} }, ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...levels, [canonical]: rank } }))])
      expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
    for (const ancestor of Object.keys(levels).filter(key => key !== canonical && key !== id)) {
      const missing = { ...levels }; Reflect.deleteProperty(missing, ancestor);
      expect(playerToCombatUnit({ ...owner, skillLevels: missing }).skillOrder).toEqual([]);
    }
    const before = structuredClone(owner);
    expect(playerToCombatUnit(owner).skillOrder).toEqual([spell.slug === 'fire-bolt' ? canonical : id]);
    const aliased = playerToCombatUnit({ ...owner, comboOrder: [canonical], skillLevels: { ...levels, [canonical]: 20 } });
    expect(aliased.skillOrder).toEqual([canonical]); expect(aliased.skillLevels?.[canonical]).toBe(20);
    expect(owner).toEqual(before);
  });
  it(`${spell.slug} refuses insufficient MP and carried cooldown without payment`, () => {
    for (const patch of [{ mana: spell.cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const input = fixture(spell.slug); input.playerTeam = input.playerTeam.map(u => ({ ...u, ...patch }));
      const out = record(input);
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
    }
  });
  it(`${spell.slug} pays once on a natural miss and applies no Burn/Melt`, () => {
    const input = fixture(spell.slug, 1, 4); input.enemyTeam = input.enemyTeam.slice(0, 1);
    const out = record(input);
    expect(out.events.filter(heroDamage)).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(out.result.enemyTeam[0]?.life).toBe(2000); expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
  });
  it(`${spell.slug} uses Fire resistance then Defense and derives Burn from the mitigated hit`, () => {
    const input = fixture(spell.slug), baseline = record(input);
    input.enemyTeam = input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 7, magicResist: 99999,
      resistances: { ...u.stats.resistances, fire: 50 } } }));
    const out = record(input);
    expect(out.events.filter(heroDamage).map(e => [e.target, e.amount, e.dodged])).toEqual(baseline.events
      .filter(heroDamage).map(e => [e.target, e.dodged ? 0 : Math.max(1, Math.floor(e.amount * .5 - 7)), e.dodged]));
    for (const hit of out.events.filter(heroDamage).filter(e => !e.dodged)) {
      const burn = out.events.find(e => e.kind === 'status-state' && e.target === hit.target && e.statuses.some(s => s.id === 'ignite'));
      expect(burn?.kind === 'status-state' && burn.statuses.find(s => s.id === 'ignite')?.dotPerStack).toBe(Math.max(1, Math.floor(hit.amount * .1)));
    }
  });
  it(`${spell.slug} composes native personal Fire Mastery and ordinary criticals`, () => {
    const input = fixture(spell.slug), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing fire caster');
    const native = playerToCombatUnit({ ...createMockPlayer('Fire Mastery composition', 'sorceress'),
      level: 30, skillLevels: { ...hero.skillLevels, 'skills-sorceress-fire-mastery': 2 } });
    const increased = native.increasedDamagePct;
    if (!increased) throw new Error('Missing native Fire Mastery projection');
    expect(increased.fire).toBe(.08);
    const original = record(input).events.filter(heroDamage);
    input.playerTeam = [{ ...hero, increasedDamagePct: increased, stats: { ...hero.stats, critChance: 1 } }];
    expect(record(input).events.filter(heroDamage).map(e => [e.target, e.amount, e.crit]))
      .toEqual(original.map(e => [e.target, e.dodged ? 0 : Math.floor(e.amount * 1.08 * 2), !e.dodged]));
  });
  it(`${spell.slug} excludes dead enemies/friendlies and settles lethal targets once`, () => {
    const input = fixture(spell.slug), target = input.enemyTeam[0], hero = input.playerTeam[0];
    if (!target || !hero) throw new Error('Missing lethal fire fixture');
    input.playerTeam.push({ ...hero, id: 'friendly', skillOrder: [], skillLevels: {}, statuses: [hold()] });
    input.enemyTeam = [{ ...target, id: 'dead', life: 0 }, { ...target, life: 1 }];
    const out = record(input);
    expect(out.events.filter(heroDamage)).toEqual([expect.objectContaining({ target: target.id, dodged: false })]);
    expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: target.id })]);
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([0, 0]);
    expect(out.result.playerTeam.find(u => u.id === 'friendly')?.life).toBe(2000);
  });
  it(`${spell.slug} starts one cooldown and waits for the exact next eligible action`, () => {
    const input = fixture(spell.slug);
    input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [], stats: { ...u.stats, attackSpeed: 263 } }));
    input.enemyTeam = input.enemyTeam.slice(0, 1).map(u => ({ ...u, life: 200000, stats: { ...u.stats, lifeMax: 200000 } }));
    const out = record(input);
    const times = out.events.filter(e => e.kind === 'action' && e.skillId === canonical).map(e => e.simClockMs);
    expect(times.slice(0, 2)).toEqual([400, 400 + Math.ceil(spell.cooldown * 1000 / 400) * 400]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(times.length);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost * times.length);
  });
  it.each([1, 5])(`${spell.slug} refreshes an active %i-stack Burn, preserves its rate/source and caps at five`, stacks => {
    const input = fixture(spell.slug), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing existing Burn target');
    input.enemyTeam = [{ ...target, statuses: [hold(), { id: 'ignite', sourceId: 'earlier-fire',
      stacks, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000, dotPerStack: 2, damageType: 'fire' }] }];
    const out = record(input), nextStacks = Math.min(5, stacks + 1);
    const refresh = out.events.flatMap(e => e.kind === 'status-state' && e.simClockMs === 1700 &&
      e.target === target.id ? e.statuses.filter(s => s.id === 'ignite') : []);
    expect(refresh.length).toBeGreaterThan(0);
    for (const status of refresh) expect(status).toMatchObject({ stacks: nextStacks,
      sourceId: 'earlier-fire', dotPerStack: 2, appliedAtMs: 0, expiresAtMs: 4700 });
    const periodic = out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === target.id ? e.amount : 0), 0);
    expect(periodic).toBe(Math.floor(2 * stacks * 1.7 + 2 * nextStacks * 3));
    const hit = out.events.filter(heroDamage)[0]; expect(hit?.dodged).toBe(false);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - (hit?.amount ?? 0) - periodic);
    expect(out.events.filter(e => e.kind === 'dot').every(e => e.simClockMs <= 4700)).toBe(true);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: target.id,
      simClockMs: 4700, statuses: [expect.objectContaining({ id: 'stun' })] }));
  });
  it(`${spell.slug} deals minimum-one Burn DPS after a Defense-mitigated one-point hit`, () => {
    const input = fixture(spell.slug);
    input.enemyTeam = input.enemyTeam.slice(0, 1).map(u => ({ ...u, stats: { ...u.stats, defense: 99999 } }));
    const out = record(input);
    expect(out.events.filter(heroDamage)).toEqual([expect.objectContaining({ amount: 1, dodged: false })]);
    expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(3);
    expect(out.result.enemyTeam[0]?.life).toBe(1996);
  });
  it(`${spell.slug} starts fresh Burn potency/source at the old stack's exact expiry`, () => {
    const input = fixture(spell.slug), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing expiring Burn target');
    input.enemyTeam = [{ ...target, statuses: [hold(), { id: 'ignite', sourceId: 'expired-fire',
      stacks: 5, remaining: 1.7, appliedAtMs: 0, expiresAtMs: 1700, dotPerStack: 2, damageType: 'fire' }] }];
    const out = record(input), hit = out.events.filter(heroDamage)[0];
    expect(hit?.dodged).toBe(false);
    const rate = Math.max(1, Math.floor((hit?.amount ?? 0) * .1));
    const applied = out.events.flatMap(e => e.kind === 'status-state' && e.simClockMs === 1700 &&
      e.target === target.id ? e.statuses.filter(s => s.id === 'ignite') : []);
    expect(applied.length).toBeGreaterThan(0);
    for (const status of applied) expect(status).toMatchObject({ stacks: 1, sourceId: 'hero',
      dotPerStack: rate, appliedAtMs: 1700, expiresAtMs: 4700 });
    expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(17 + rate * 3);
  });
}
