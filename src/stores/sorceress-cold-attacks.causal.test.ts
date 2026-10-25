import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/sorceress.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { statusActiveAt } from '@/engine/combat/status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const spells = [
  { slug: 'ice-bolt', min: 30, max: 45, growth: 4, cost: 10, cooldown: 1 },
  { slug: 'frost-nova', min: 25, max: 35, growth: 3, cost: 20, cooldown: 3 },
  { slug: 'frozen-orb', min: 60, max: 90, growth: 6, cost: 30, cooldown: 2 },
  { slug: 'blizzard', min: 85, max: 125, growth: 8, cost: 35, cooldown: 4 }
] as const;
type Slug = typeof spells[number]['slug'];
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
/** Native legal allocations; declared synthetic pools/positions/holds isolate one cast. */
function fixture(slug: Slug, rank = 1, seed = 7) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(s => s.id === id);
    if (!row) throw new Error('Missing native cold prerequisite');
    for (const required of row.prerequisites ?? []) add(required);
    levels[id] = 1;
  }
  const id = 'skills-sorceress-' + slug; add(id); levels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic cold attack', 'sorceress'),
    id: 'hero', level: 30, skillLevels: levels, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const count = slug === 'blizzard' ? 12 : 9;
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: count }, (_, i): CombatUnit => ({
    ...hero, id: 'target-' + String(i), side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [], statuses: [hold()],
    gridPosition: { row: Math.floor(i / 3), col: i % 3 }
  })) } satisfies CombatSnapshot;
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

for (const spell of spells) {
  const id = 'skills-sorceress-' + spell.slug, canonical = 'sorceress.' + spell.slug.replaceAll('-', '_');
  it(`${spell.slug} refuses insufficient MP and carried cooldown without payment`, () => {
    for (const patch of [{ mana: spell.cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const input = fixture(spell.slug);
      input.playerTeam = input.playerTeam.map(u => ({ ...u, ...patch }));
      const out = record(input);
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
    }
  });
  it(`${spell.slug} requires native class/unlock/transitive prerequisites and legal ranks`, () => {
    const levels = { ...fixture(spell.slug).playerTeam[0]?.skillLevels };
    const owner = { ...createMockPlayer('Cold authority', 'sorceress'), level: 30,
      skillLevels: levels, comboOrder: [id] };
    const source = rows.find(s => s.id === id);
    if (!source) throw new Error('Missing cold authority row');
    for (const patch of [{ class: 'barbarian' as const }, { level: source.requiredLevel - 1 },
      { skillLevels: {} }, ...[0, -1, 1.5, 21].map(rank => ({ skillLevels: { ...levels, [canonical]: rank } }))])
      expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
    if (spell.slug !== 'ice-bolt') {
      const missingAncestor = { ...levels };
      Reflect.deleteProperty(missingAncestor, 'skills-sorceress-ice-bolt');
      Reflect.deleteProperty(missingAncestor, 'sorceress.ice_bolt');
      expect(playerToCombatUnit({ ...owner, skillLevels: missingAncestor }).skillOrder).toEqual([]);
    }
    const before = structuredClone(owner);
    expect(playerToCombatUnit(owner).skillOrder).toEqual([id]);
    const aliased = playerToCombatUnit({ ...owner, comboOrder: [canonical], skillLevels: { ...levels, [canonical]: 20 } });
    expect(aliased.skillOrder).toEqual([canonical]);
    expect(aliased.skillLevels?.[canonical]).toBe(20);
    expect(owner).toEqual(before);
  });
  it(`${spell.slug} pays once on a natural miss and applies no Chill or Freeze`, () => {
    const input = fixture(spell.slug, 1, 4);
    input.enemyTeam = input.enemyTeam.slice(0, 1);
    const out = record(input);
    expect(out.events.filter(heroDamage))
      .toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
    expect(out.result.enemyTeam[0]?.life).toBe(2000);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
  });
  it(`${spell.slug} retains Cold resistance then flat MR, without ordinary Defense bypass`, () => {
    const input = fixture(spell.slug), baseline = record(input);
    input.enemyTeam = input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
      defense: 99999, magicResist: 7, resistances: { ...u.stats.resistances, cold: 50 } } }));
    const out = record(input);
    const original = baseline.events.filter(heroDamage);
    const hits = out.events.filter(heroDamage);
    expect(hits.map(e => [e.target, e.amount, e.dodged])).toEqual(original.map(e =>
      [e.target, e.dodged ? 0 : Math.max(1, Math.floor(e.amount * .5 - 7)), e.dodged]));
    expect(hits.some(e => !e.dodged)).toBe(true);
  });
  it(`${spell.slug} composes actual personal Cold Mastery and matching increased damage`, () => {
    const input = fixture(spell.slug), baseline = record(input);
    const hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing cold caster');
    const native = playerToCombatUnit({ ...createMockPlayer('Cold Mastery composition', 'sorceress'),
      level: 30, skillLevels: { ...hero.skillLevels, 'skills-sorceress-cold-mastery': 2 }, comboOrder: [id] });
    const reduction = native.coldResistanceReductionPct;
    if (reduction === undefined) throw new Error('Missing native Cold Mastery projection');
    expect(reduction).toBe(19);
    input.playerTeam = [{ ...hero, coldResistanceReductionPct: reduction,
      increasedDamagePct: { cold: .5 } }];
    input.enemyTeam = input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, magicResist: 7,
      resistances: { ...u.stats.resistances, cold: 50 } } }));
    const out = record(input);
    expect(out.events.filter(heroDamage).map(e => [e.target, e.amount]))
      .toEqual(baseline.events.filter(heroDamage).map(e =>
        [e.target, e.dodged ? 0 : Math.max(1, Math.floor(e.amount * 1.5 * .69 - 7))]));
    expect(out.result.enemyTeam.every(u => u.stats.resistances.cold === 50)).toBe(true);
  });
  it(`${spell.slug} resolves ordinary criticals before Cold mitigation`, () => {
    const input = fixture(spell.slug), baseline = record(input);
    input.playerTeam = input.playerTeam.map(u => ({ ...u, stats: { ...u.stats, critChance: 1 } }));
    const hits = record(input).events.filter(heroDamage);
    expect(hits.map(e => [e.target, e.amount, e.crit])).toEqual(baseline.events
      .filter(heroDamage).map(e => [e.target, e.amount * 2, !e.dodged]));
  });
  it(`${spell.slug} excludes dead enemies/friendlies and settles lethal victims once`, () => {
    const input = fixture(spell.slug), target = input.enemyTeam[0], hero = input.playerTeam[0];
    if (!target || !hero) throw new Error('Missing cold lethal fixture');
    input.playerTeam.push({ ...hero, id: 'friendly', skillOrder: [], skillLevels: {}, statuses: [hold()] });
    input.enemyTeam = [{ ...target, id: 'dead', life: 0 }, { ...target, life: 1 }];
    const out = record(input);
    expect(out.events.filter(heroDamage))
      .toEqual([expect.objectContaining({ target: target.id, dodged: false })]);
    expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: target.id })]);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([0, 0]);
    expect(out.result.playerTeam.find(u => u.id === 'friendly')?.life).toBe(2000);
  });
  it(`${spell.slug} actually slows enemy actions until exact Chill expiry`, () => {
    const input = fixture(spell.slug, 1, 1), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing Chill timing target');
    input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [hold(1301)],
      stats: { ...u.stats, attackSpeed: 150 } }));
    input.enemyTeam = [{ ...target, statuses: [] }];
    const out = record(input);
    expect(out.events.filter(e => e.kind === 'status').map(e => [e.statusId, e.simClockMs]))
      .toEqual([['chill', 1300]]);
    const times = out.events.filter(e => e.kind === 'action' && e.actor === target.id).slice(0, 3).map(e => e.simClockMs);
    expect(times).toHaveLength(3);
    for (const [i, expected] of [30100 / 17, 3700, 5400].entries()) expect(times[i]).toBeCloseTo(expected, 8);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: target.id,
      simClockMs: 3300, statuses: [] }));
    expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
  });
  it(`${spell.slug} starts one cooldown per cast and waits for its exact next eligible action`, () => {
    const input = fixture(spell.slug);
    input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [], stats: { ...u.stats, attackSpeed: 263 } }));
    input.enemyTeam = input.enemyTeam.slice(0, 1).map(u => ({ ...u, life: 200000, stats: { ...u.stats, lifeMax: 200000 } }));
    const out = record(input);
    const times = out.events.filter(e => e.kind === 'action' && e.skillId === canonical).map(e => e.simClockMs);
    expect(times.slice(0, 2)).toEqual([400, 400 + Math.ceil(spell.cooldown * 1000 / 400) * 400]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(times.length);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost * times.length);
  });
}

for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
  it.each([1, 20])(`Frost Nova rank%i independently Freezes ${tier} for its exact finite interval`, rank => {
    // Seed5: landed hit, base, critical, guaranteed Chill, then 0.085137... secondary roll.
    const input = fixture('frost-nova', rank, 5), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing Nova Freeze target');
    input.enemyTeam = [{ ...target, tier, statuses: [] }];
    const out = record(input), expiresAtMs = tier === 'trash' ? 2700 : 2200;
    expect(out.events.filter(e => e.kind === 'status').map(e => [e.statusId, e.simClockMs]))
      .toEqual([['chill', 1700], ['freeze', 1700]]);
    const applied = out.events.flatMap(e => e.kind === 'status-state' && e.target === target.id &&
      e.simClockMs === 1700 && e.statuses.some(s => s.id === 'freeze') ? [e] : []);
    expect(applied).toHaveLength(1);
    expect(applied[0]?.statuses).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'freeze', appliedAtMs: 1700, expiresAtMs }),
        expect.objectContaining({ id: 'chill', appliedAtMs: 1700, expiresAtMs: 3700 })
      ]));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: target.id,
      simClockMs: expiresAtMs, statuses: [expect.objectContaining({ id: 'chill' })] }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: target.id, simClockMs: 1700 }));
    expect(out.events.filter(e => e.kind === 'action' && e.actor === target.id && e.simClockMs >= 1700 && e.simClockMs < expiresAtMs)).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(80);
  });
}

it('Frozen Orb includes duplicate occupants of its cells without an invented target cap', () => {
  const input = fixture('frozen-orb'), middle = input.enemyTeam[4];
  if (!middle) throw new Error('Missing cone duplicate');
  input.enemyTeam.push({ ...middle, id: 'duplicate' });
  expect(record(input).events.filter(e => e.kind === 'damage').map(e => e.target))
    .toEqual(['target-1', 'target-3', 'target-4', 'duplicate', 'target-5']);
});
it('Frozen Orb uses native default placement when coordinates are absent', () => {
  const input = fixture('frozen-orb');
  input.enemyTeam = input.enemyTeam.map(({ gridPosition: _position, ...rest }) => rest);
  expect(record(input).events.filter(e => e.kind === 'damage').map(e => e.target))
    .toEqual(['target-1', 'target-2', 'target-0', 'target-3']);
});
it.each([0, 3])('Frozen Orb keeps clipped/overflow row%i cells and stable row-major targets', row => {
  const input = fixture('frozen-orb'), base = input.enemyTeam[0];
  if (!base) throw new Error('Missing clipped cone');
  input.enemyTeam = [{ ...base, id: 'right', gridPosition: { row, col: 2 } },
    { ...base, id: 'below', gridPosition: { row: row + 1, col: 1 } },
    { ...base, id: 'left', gridPosition: { row, col: 0 } }];
  expect(record(input).events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['left', 'below']);
});
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });

for (const spell of spells) for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(`${spell.slug} rank${String(rank)} seed%i damages its real targets once for one payment`, seed => {
    const input = fixture(spell.slug, rank, seed), out = record(input);
    const targets = spell.slug === 'ice-bolt' ? ['target-0'] : spell.slug === 'frozen-orb'
      ? ['target-1', 'target-3', 'target-4', 'target-5'] : input.enemyTeam.map(u => u.id);
    const hits = out.events.filter(heroDamage);
    expect(hits.map(e => e.target)).toEqual(targets);
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: 'sorceress.' + spell.slug.replaceAll('-', '_'), simClockMs: 1700 })
    ]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - spell.cost })
    ]);
    for (const hit of hits) if (!hit.dodged) {
      expect(hit.damageType).toBe('cold');
      expect(hit.amount).toBeGreaterThanOrEqual(spell.min + spell.growth * (rank - 1));
      expect(hit.amount).toBeLessThanOrEqual(spell.max + spell.growth * (rank - 1));
      expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: hit.target, statusId: 'chill' }));
    }
    expect(out.events.some(e => e.kind === 'dot')).toBe(false);
    for (const unit of out.result.enemyTeam) expect(unit.life).toBe(2000 - hits.reduce((n, e) =>
      n + (e.target === unit.id ? e.amount : 0), 0));
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
  });
}
