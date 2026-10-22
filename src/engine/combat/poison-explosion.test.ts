import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composePoisonExplosion } from '../skills/poison-explosion';

const PE = 'necromancer.poison_explosion', ALIAS = 'skills-necromancer-poison-explosion';
const CE = 'necromancer.corpse_explosion', DAGGER = 'necromancer.poison_dagger';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing PE fixture');
  return value;
}
function status(id: string, extra: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, ...extra };
}
function unit(id: string, side: 'player' | 'enemy' = 'player', extra: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 18, tier: 'trash',
    life: 100_000, mana: 15,
    stats: { life: 100_000, lifeMax: 100_000, mana: 15, manaMax: 15,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...extra };
}
function body(id = 'body'): CombatUnit {
  return unit(id, 'enemy', { life: 1, statuses: [status('stun'), status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] });
}
// Malformed external data is exercised only through the public snapshot boundary.
type Input = Omit<CombatSnapshot, 'poisonExplosion'> & { readonly poisonExplosion?: unknown };
function input(rank = 1): Input {
  const projection = required(composePoisonExplosion({ id: 'hero', class: 'necromancer', level: 18,
    skillLevels: { [DAGGER]: 1, [PE]: rank } }));
  return { seed: 1, playerTeam: [unit('hero', 'player', { skillOrder: [PE] })],
    enemyTeam: [body(), unit('target', 'enemy', { statuses: [status('stun')] })], poisonExplosion: [projection] };
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
function record(value: Input) {
  const before = structuredClone(value), snapshot = freeze(value) as CombatSnapshot;
  const out = runBattleRecorded(snapshot);
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
  return out;
}
const casts = (events: readonly RecordedBattleEvent[]) => events.filter(e => e.kind === 'action' &&
  (e.skillId === PE || e.skillId === ALIAS));
const feedback = (events: readonly RecordedBattleEvent[]) => events.filter(e => e.kind === 'message' &&
  e.messageKey.startsWith('combat:corpses.'));
const withHero = (base: Input, extra: Partial<CombatUnit>): Input => ({ ...base,
  playerTeam: [{ ...required(base.playerTeam[0]), ...extra }] });
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D06 finite wave-local Poison Explosion', () => {
  it('requires actual Player authority instead of a slotted generic PE rank', () => {
    const base = input(), out = record({ ...base, poisonExplosion: undefined });
    expect(casts(out.events)).toEqual([]);
    expect(out.events).toEqual(record(withHero({ ...base, poisonExplosion: undefined }, { skillOrder: [] })).events);
  });

  it('empty supply skips to an identical basic fallback in the same action without RNG or MP cost', () => {
    const base = input(), empty = { ...base, enemyTeam: [required(base.enemyTeam[1])] };
    const out = record(empty), control = record(withHero(empty, { skillOrder: [] }));
    expect(out.events).toEqual(control.events); expect(out.result.enemyTeam).toEqual(control.result.enemyTeam);
    // The requested priority is retained as input configuration in each final unit.
    const runtime = (units: readonly CombatUnit[]) => units.map(({ skillOrder: _order, ...rest }) => rest);
    expect(runtime(out.result.playerTeam)).toEqual(runtime(control.result.playerTeam));
  });

  it('PE-only authority collects one real death, commits one body and15MP, and retains dead identity', () => {
    const out = record(input());
    expect(casts(out.events)).toHaveLength(1);
    expect(feedback(out.events).map(e => e.kind === 'message' ? [e.messageKey, e.params] : null)).toEqual([
      ['combat:corpses.available', { count: 1 }], ['combat:corpses.consumedPoison', { count: 0 }]
    ]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 1700 })
    ]);
    expect(out.events.filter(e => e.kind === 'death').map(e => [e.simClockMs, e.target])).toEqual([[1000, 'body']]);
    expect(out.result.enemyTeam.map(e => [e.id, e.life === 0])).toEqual([['body', true], ['target', false]]);
  });

  it('PE and CE compete for the single FIFO in combo order without a duplicate cast', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] },
      { mana: 35, stats: { ...hero.stats, manaMax: 35 }, skillOrder: [PE, CE] }));
    expect(out.events.filter(e => e.kind === 'action' && (e.skillId === PE || e.skillId === CE)))
      .toEqual([expect.objectContaining({ skillId: PE, simClockMs: 1700 })]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? [e.messageKey, e.params] : null)).toEqual([
      ['combat:corpses.available', { count: 1 }], ['combat:corpses.consumedPoison', { count: 0 }]
    ]);
  });
});

describe('PE authority, commitment and shared-pool boundaries', () => {
  it.each([undefined, null, {}, [], [{ sourceHeroId: 'hero', rank: 0 }],
    [{ sourceHeroId: 'hero', rank: 1.5 }], [{ sourceHeroId: 'hero', rank: 21 }],
    [{ sourceHeroId: 'hero', rank: NaN }], [{ sourceHeroId: 'hero', rank: Infinity }],
    [{ sourceHeroId: 'hero', rank: -1 }], [{ sourceHeroId: '', rank: 1 }],
    [{ sourceHeroId: 'hero', rank: 1, extra: true }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: '', rank: 2 }],
    Array.from({ length: 1 }), new Array<unknown>(1), [{ sourceHeroId: 'unbound', rank: 1 }]
  ])('invalid complete PE authority %j grants no cast or corpse feedback', projection => {
    const out = record({ ...input(), poisonExplosion: projection });
    expect(casts(out.events)).toEqual([]); expect(feedback(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it.each([{ side: 'enemy' as const }, { kind: 'merc' as const }, { kind: 'monster' as const },
    { summon: true }, { ownerId: '' }, { summonOwnerId: 'owner' }, { life: 0 },
    { life: NaN }, { life: Infinity }, { level: 17 }, { level: 18.5 }
  ])('rejects an ineligible runtime source %j', fields => {
    const base = input(), out = record({ ...withHero(base, fields), playerTeam: [
      { ...required(base.playerTeam[0]), ...fields }, unit('control', 'player', { statuses: [status('stun')] })] });
    expect(casts(out.events)).toEqual([]); expect(feedback(out.events)).toEqual([]);
  });

  it.each([PE, ALIAS, 'necromancer/poison-explosion'])('requires authority for requested/resolved identity %s', id => {
    const out = record(withHero({ ...input(), poisonExplosion: undefined }, { skillOrder: [id] }));
    expect(casts(out.events)).toEqual([]); expect(feedback(out.events)).toEqual([]);
  });

  it.each([PE, ALIAS])('accepts exact alias %s with separately composed authority', id => {
    expect(casts(record(withHero(input(), { skillOrder: [id] })).events)).toHaveLength(1);
  });

  it.each([PE, ALIAS])('blocks altered active and startup semantics under %s', id => {
    registerSkill({ ...required(getSkill(PE)), id, target: 'self', summonOnStart: true,
      effects: [{ kind: 'heal', amount: 1, target: 'self' }] });
    const out = record(withHero(input(), { skillOrder: [id] }));
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId !== null)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it('gates a requested PE even after its registered object is redirected to another identity', () => {
    const redirected = { ...required(getSkill(PE)), id: PE };
    registerSkill(redirected); redirected.id = 'fixture.redirected';
    const out = record(input());
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId !== null)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it('refuses sparse or additional registered effects without payment or a crash', () => {
    const original = required(getSkill(PE)), sparse = [...original.effects]; sparse.length = 2;
    for (const effects of [sparse, [...original.effects, { kind: 'heal' as const, amount: 1, target: 'self' as const }]]) {
      registerSkill({ ...original, effects });
      const out = record(input());
      expect(casts(out.events)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    }
  });

  it.each([14, NaN, Infinity, -Infinity])('unaffordable or nonfinite MP %s leaves the corpse unspent', mana => {
    // Seed2's two death-orb rolls miss, keeping malformed MP unchanged at selection.
    const out = record(withHero({ ...input(), seed: 2 }, { mana }));
    expect(out.events.filter(e => e.kind === 'orb')).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([expect.objectContaining({ messageKey: 'combat:corpses.available', params: { count: 1 } })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it.each([PE, ALIAS])('honors a carried cooldown on either alias %s at its exact boundary', id => {
    const out = record(withHero(input(), { cooldowns: { [PE]: 0, [ALIAS]: 0, [id]: 3400 } }));
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([3400]);
    expect(out.events.find(e => e.kind === 'action')).toMatchObject({ skillId: null, simClockMs: 1700 });
  });

  it('uses2s cooldown with two real bodies and400ms actions', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, enemyTeam: [body('z-first'), body('a-second'), required(base.enemyTeam[1])] },
      { mana: 30, stats: { ...hero.stats, manaMax: 30, attackSpeed: 263 },
        statuses: [status('stun', { expiresAtMs: 1000 })] }));
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([1200, 3200]);
    expect(out.events.filter(e => e.kind === 'action' && e.simClockMs > 1200 && e.simClockMs < 3200)
      .every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 2, 1, 0]);
  });

  it('all targets dodging spends one body and15MP without applying Poison', () => {
    const out = record({ ...input(), seed: 7 });
    expect(casts(out.events)).toHaveLength(1);
    expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'poison'))
      .toMatchObject({ amount: 0, dodged: true, simClockMs: 1700 });
    expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'poison')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'dot' && e.target === 'target')).toEqual([]);
    expect(feedback(out.events).at(-1)).toMatchObject({ messageKey: 'combat:corpses.consumedPoison', params: { count: 0 } });
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });

  it('empty PE falls through to the next legal combo with identical costs and RNG', () => {
    const id = 'fixture.pe-fallback';
    registerSkill({ id, archetype: 'fixture', target: 'single-enemy', minLevel: 1, manaCost: 1, cooldown: 1,
      effects: [{ kind: 'damage', damageType: 'arcane', base: [1, 3] }] });
    const base = input(), empty = { ...base, enemyTeam: [required(base.enemyTeam[1])] };
    expect(record(withHero(empty, { skillOrder: [PE, id] })).events)
      .toEqual(record(withHero(empty, { skillOrder: [id] })).events);
  });

  it.each([[CE, PE], [PE, CE]])('single-body competition follows priority %j', (first, second) => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] },
      { mana: 35, stats: { ...hero.stats, manaMax: 35 }, skillOrder: [first, second] }));
    expect(out.events.filter(e => e.kind === 'action' && (e.skillId === CE || e.skillId === PE)))
      .toEqual([expect.objectContaining({ skillId: first, simClockMs: 1700 })]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 0]);
  });

  it('19MP skips CE then spends PE15MP and leaves4MP with no CE cooldown', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] },
      { mana: 19, stats: { ...hero.stats, manaMax: 19 }, skillOrder: [CE, PE],
        statuses: [status('stun', { appliedAtMs: 1701 })] }));
    expect(casts(out.events)).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(4);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === CE)).toEqual([]);
    expect(out.result.playerTeam[0]?.cooldowns[CE]).toBeUndefined();
  });

  it('invalid PE authority leaves valid CE authority and collection independent', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, poisonExplosion: [{ sourceHeroId: 'hero', rank: 0 }],
      corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] },
    { mana: 20, stats: { ...hero.stats, manaMax: 20 }, skillOrder: [PE, CE] }));
    expect(casts(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === CE)).toHaveLength(1);
    expect(feedback(out.events).at(-1)).toMatchObject({ messageKey: 'combat:corpses.consumed', params: { count: 0 } });
  });

  it('invalid CE authority leaves valid PE authority and collection independent', () => {
    const out = record(withHero({ ...input(), corpseExplosion: [{ sourceHeroId: 'hero', rank: 0 }] },
      { skillOrder: [CE, PE] }));
    expect(casts(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === CE)).toEqual([]);
  });

  it('an unaffordable faster hero leaves the one token for a later eligible PE hero', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const poor = { ...hero, mana: 14, stats: { ...hero.stats, attackSpeed: 263 },
      statuses: [status('stun', { expiresAtMs: 1000 })] };
    const out = record({ ...base, playerTeam: [poor, unit('other', 'player', { skillOrder: [ALIAS] })],
      poisonExplosion: [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'other', rank: 20 }] });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' &&
      (e.simClockMs === 1200 || e.simClockMs === 1600))).toEqual([
      expect.objectContaining({ skillId: null, simClockMs: 1200 }), expect.objectContaining({ skillId: null, simClockMs: 1600 })
    ]);
    expect(casts(out.events)).toEqual([expect.objectContaining({ actor: 'other', simClockMs: 1700 })]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 0]);
  });

  it('two PE/CE heroes compete in ordinary action order for one shared token', () => {
    const base = input();
    const out = record({ ...base, playerTeam: [required(base.playerTeam[0]), unit('other', 'player',
      { mana: 20, skillOrder: [CE] })], corpseExplosion: [{ sourceHeroId: 'other', rank: 1 }] });
    const actions = out.events.filter(e => e.kind === 'action' && e.simClockMs === 1700);
    expect(actions).toHaveLength(2);
    expect(actions.filter(e => e.kind === 'action' && (e.skillId === CE || e.skillId === PE))).toHaveLength(1);
    expect(actions.filter(e => e.kind === 'action' && e.skillId === null)).toHaveLength(1);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 0]);
  });
});

// Literal production-registry seed1 baseline frozen before the corpse patch;
// each row independently checked with integer combo/potency/HP-ms arithmetic.
const oracles = [
  {"rank": 1, "state": "fresh", "hit": 60, "rate": 3, "stacks": 1, "dots": [[3400, 5], [5100, 5], [6700, 5]], "totalDot": 15, "final": 925},
  {"rank": 1, "state": "marker3", "hit": 87, "rate": 4, "stacks": 4, "dots": [[2000, 4], [3400, 23], [5100, 27], [6700, 26]], "totalDot": 80, "final": 833},
  {"rank": 1, "state": "damaging3", "hit": 87, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 888},
  {"rank": 5, "state": "fresh", "hit": 80, "rate": 4, "stacks": 1, "dots": [[2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 20, "final": 900},
  {"rank": 5, "state": "marker3", "hit": 116, "rate": 5, "stacks": 4, "dots": [[2000, 6], [3400, 28], [5100, 34], [6700, 32]], "totalDot": 100, "final": 784},
  {"rank": 5, "state": "damaging3", "hit": 116, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 859},
  {"rank": 6, "state": "fresh", "hit": 85, "rate": 4, "stacks": 1, "dots": [[2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 20, "final": 895},
  {"rank": 6, "state": "marker3", "hit": 123, "rate": 6, "stacks": 4, "dots": [[2000, 7], [3400, 33], [5100, 41], [6700, 39]], "totalDot": 120, "final": 757},
  {"rank": 6, "state": "damaging3", "hit": 123, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 852},
  {"rank": 9, "state": "fresh", "hit": 100, "rate": 5, "stacks": 1, "dots": [[2000, 1], [3400, 7], [5100, 9], [6700, 8]], "totalDot": 25, "final": 875},
  {"rank": 9, "state": "marker3", "hit": 145, "rate": 7, "stacks": 4, "dots": [[2000, 8], [3400, 39], [5100, 48], [6700, 45]], "totalDot": 140, "final": 715},
  {"rank": 9, "state": "damaging3", "hit": 145, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 830},
  {"rank": 12, "state": "fresh", "hit": 115, "rate": 5, "stacks": 1, "dots": [[2000, 1], [3400, 7], [5100, 9], [6700, 8]], "totalDot": 25, "final": 860},
  {"rank": 12, "state": "marker3", "hit": 166, "rate": 8, "stacks": 4, "dots": [[2000, 9], [3400, 45], [5100, 54], [6700, 52]], "totalDot": 160, "final": 674},
  {"rank": 12, "state": "damaging3", "hit": 166, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 809},
  {"rank": 13, "state": "fresh", "hit": 120, "rate": 6, "stacks": 1, "dots": [[2000, 1], [3400, 9], [5100, 10], [6700, 10]], "totalDot": 30, "final": 850},
  {"rank": 13, "state": "marker3", "hit": 174, "rate": 8, "stacks": 4, "dots": [[2000, 9], [3400, 45], [5100, 54], [6700, 52]], "totalDot": 160, "final": 666},
  {"rank": 13, "state": "damaging3", "hit": 174, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 801},
  {"rank": 17, "state": "fresh", "hit": 140, "rate": 7, "stacks": 1, "dots": [[2000, 2], [3400, 9], [5100, 12], [6700, 12]], "totalDot": 35, "final": 825},
  {"rank": 17, "state": "marker3", "hit": 203, "rate": 10, "stacks": 4, "dots": [[2000, 12], [3400, 56], [5100, 68], [6700, 64]], "totalDot": 200, "final": 597},
  {"rank": 17, "state": "damaging3", "hit": 203, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 772},
  {"rank": 20, "state": "fresh", "hit": 155, "rate": 7, "stacks": 1, "dots": [[2000, 2], [3400, 9], [5100, 12], [6700, 12]], "totalDot": 35, "final": 810},
  {"rank": 20, "state": "marker3", "hit": 224, "rate": 11, "stacks": 4, "dots": [[2000, 13], [3400, 61], [5100, 75], [6700, 71]], "totalDot": 220, "final": 556},
  {"rank": 20, "state": "damaging3", "hit": 224, "rate": 1, "stacks": 4, "dots": [[1000, 3], [1700, 2], [2000, 1], [3400, 5], [5100, 7], [6700, 7]], "totalDot": 25, "final": 751}
] as const;
describe('preserved production PE damage and Poison timing', () => {
  it.each(oracles)('rank$rank / $state preserves literal direct hit, all periodic events and HP', oracle => {
    const base = input(oracle.rank), hero = required(base.playerTeam[0]);
    const poison = oracle.state === 'fresh' ? [] : [status('poison', { stacks: 3,
      appliedAtMs: 0, expiresAtMs: 3000, ...(oracle.state === 'damaging3' ? { dotPerStack: 1 } : {}) })];
    const snapshot = { ...base, playerTeam: [{ ...hero, skillLevels: { [PE]: oracle.rank },
      statuses: [status('stun', { appliedAtMs: 1701 })] }],
    enemyTeam: [body(), unit('target', 'enemy', { life: 1000,
      statuses: [status('stun'), status('marker', { expiresAtMs: 2000 }), ...poison] })] };
    const out = record(snapshot);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
      expect.objectContaining({ amount: oracle.hit, crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(out.events.flatMap(e => e.kind === 'dot' && e.target === 'target' ? [[e.simClockMs, e.amount]] : []))
      .toEqual(oracle.dots);
    expect(out.events.reduce((n, e) => n + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0))
      .toBe(oracle.totalDot);
    expect(out.result.enemyTeam.find(u => u.id === 'target')?.life).toBe(oracle.final);
    expect(out.events.filter(e => e.kind === 'status')).toEqual([
      expect.objectContaining({ statusId: 'poison', target: 'target', simClockMs: 1700 })
    ]);
    expect(out.events.filter(e => e.kind === 'death').map(e => [e.simClockMs, e.target])).toEqual([[1000, 'body']]);
    expect(casts(out.events)).toHaveLength(1); expect(out.result.playerTeam[0]?.mana).toBe(0);
    expect(record(snapshot)).toEqual(out);
    record({ ...snapshot, seed: 7 });
    expect(record(snapshot)).toEqual(out);
  });

  it('uses projected rank6 despite conflicting generic99/0 alias ranks', () => {
    const base = input(6);
    const out = record(withHero(base, { skillOrder: [ALIAS], skillLevels: { [PE]: 99, [ALIAS]: 0 },
      statuses: [status('stun', { appliedAtMs: 1701 })] }));
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
      expect.objectContaining({ amount: 85, dodged: false, simClockMs: 1700 })
    ]);
    expect(out.events.reduce((n, e) => n + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0)).toBe(20);
  });
});

describe('PE death closure, rewards identities and wave lifecycle', () => {
  it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
    'credits one primary %s death and retains its ordinary orb/death identities', tier => {
      const base = input(), snapshot = { ...base, enemyTeam: [{ ...body(), tier }, required(base.enemyTeam[1])] };
      const out = record(snapshot), control = record(withHero({ ...snapshot, poisonExplosion: undefined }, { skillOrder: [] }));
      expect(casts(out.events)).toHaveLength(1);
      expect(out.events.filter(e => e.kind === 'orb')).toEqual(control.events.filter(e => e.kind === 'orb'));
      expect(out.events.filter(e => e.kind === 'death')).toEqual(control.events.filter(e => e.kind === 'death'));
      expect(out.result.enemyTeam.map(u => u.id)).toEqual(['body', 'target']);
    });

  it.each([{ kind: 'summon' as const }, { kind: 'merc' as const }, { kind: 'hero' as const },
    { summon: true }, { ownerId: '' }, { summonOwnerId: 'owner' }])('excluded primary victim %j cannot supply PE', fields => {
    const base = input(), out = record({ ...base, enemyTeam: [{ ...body(), ...fields }, required(base.enemyTeam[1])] });
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
    expect(casts(out.events)).toEqual([]); expect(feedback(out.events)).toEqual([]);
  });

  it('initial-dead and nonlethal primary inputs grant no opening supply', () => {
    const base = input();
    for (const life of [0, 100_000]) {
      const out = record({ ...base, enemyTeam: [{ ...body(), life }, required(base.enemyTeam[1])] });
      expect(casts(out.events)).toEqual([]); expect(feedback(out.events)).toEqual([]);
    }
  });

  it('orphan closure publishes one primary corpse after both deaths without duplicate credit', () => {
    const base = input(), child = unit('child', 'enemy', { summonOwnerId: 'body', statuses: [status('stun')] });
    const out = record({ ...base, enemyTeam: [body(), child, required(base.enemyTeam[1])] });
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body', 'child']);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 0]);
    const orphanIndex = out.events.findIndex(e => e.kind === 'death' && e.target === 'child');
    expect(out.events.indexOf(required(feedback(out.events)[0]))).toBeGreaterThan(orphanIndex);
  });

  it.each(['hero', 'merc', 'summon'] as const)('an ordinary %s direct kill supplies a later PE action', kind => {
    const base = input(), killer = unit('killer', 'player', { kind,
      ...(kind === 'summon' ? { summon: true, summonOwnerId: 'hero' } : {}) });
    const out = record({ ...base, seed: 7, playerTeam: [...base.playerTeam,
      { ...killer, stats: { ...killer.stats, attackSpeed: 263 } }],
    enemyTeam: [{ ...body(), statuses: [status('stun')] }, required(base.enemyTeam[1])] });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'killer' && e.target === 'body'))
      .toMatchObject({ amount: 1, dodged: false, simClockMs: 400 });
    expect(casts(out.events)).toEqual([expect.objectContaining({ simClockMs: 1700 })]);
  });

  it('an actual Shatter execute supplies PE without altering execute damage', () => {
    const base = input(), killer = unit('killer', 'player', { kind: 'merc' }), victim = body();
    const out = record({ ...base, seed: 7, playerTeam: [...base.playerTeam,
      { ...killer, stats: { ...killer.stats, attackSpeed: 263 } }],
    enemyTeam: [{ ...victim, life: 19, stats: { ...victim.stats, lifeMax: 100 },
      statuses: [status('stun'), status('freeze')] }, required(base.enemyTeam[1])] });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'killer')).toMatchObject({ amount: 19, simClockMs: 400 });
    expect(casts(out.events)).toHaveLength(1);
  });

  it.each([60, 61])('PE itself creates a later paid corpse after a direct/periodic kill at%sHP', life => {
    const base = input(), hero = required(base.playerTeam[0]);
    const out = record(withHero({ ...base, enemyTeam: [body(), unit('second', 'enemy', { life,
      statuses: [status('stun')] }), required(base.enemyTeam[1])] }, { mana: 30, stats: { ...hero.stats, manaMax: 30 } }));
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([1700, 5100]);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body', 'second']);
    expect(out.events.find(e => e.kind === 'death' && e.target === 'second'))
      .toMatchObject({ simClockMs: life === 60 ? 1700 : 2034 });
    expect(feedback(out.events).map(e => e.kind === 'message' ? [e.messageKey, e.params?.count] : null)).toEqual([
      ['combat:corpses.available', 1], ['combat:corpses.consumedPoison', 0],
      ['combat:corpses.available', 1], ['combat:corpses.consumedPoison', 0]
    ]);
    expect(out.result.enemyTeam.map(u => u.id)).toEqual(['body', 'second', 'target']);
  });

  it('closes simultaneous periodic deaths before publishing tokens and a same-time action', () => {
    const base = input(), timedBody = (id: string) => ({ ...body(id), statuses: [status('stun'),
      status('bleed', { appliedAtMs: 700, expiresAtMs: 1700, dotPerStack: 1 })] });
    const out = record({ ...base, enemyTeam: [timedBody('z-first'), timedBody('a-second'), required(base.enemyTeam[1])] });
    const deaths = out.events.filter(e => e.kind === 'death');
    expect(deaths).toMatchObject([{ target: 'z-first', simClockMs: 1700 }, { target: 'a-second', simClockMs: 1700 }]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : null)).toEqual([1, 2, 1]);
    expect(out.events.indexOf(required(deaths[1]))).toBeLessThan(out.events.indexOf(required(feedback(out.events)[0])));
    expect(out.events.indexOf(required(feedback(out.events)[1]))).toBeLessThan(out.events.indexOf(required(casts(out.events)[0])));
  });

  it('a lethal hit applies Poison before death spread affects later targets, and skips orphaned targets', () => {
    const base = input(20), dying = unit('dying', 'enemy', { life: 1, statuses: [status('stun')] });
    const child = unit('child', 'enemy', { summonOwnerId: 'dying', statuses: [status('stun')] });
    const target = unit('target', 'enemy', { statuses: [status('stun'),
      status('poison', { stacks: 2, appliedAtMs: 0, expiresAtMs: 3000 })] });
    const out = record(withHero({ ...base, enemyTeam: [body(), dying, child, target] },
      { statuses: [status('stun', { appliedAtMs: 1701 })] }));
    const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage');
    expect(hits.map(e => e.target)).toEqual(['dying', 'target']);
    expect(hits[0]).toMatchObject({ amount: 155, dodged: false });
    expect(hits[1]?.dodged).toBe(false); expect(required(hits[1]).amount).toBeGreaterThan(155);
    const applied = out.events.findIndex(e => e.kind === 'status' && e.target === 'dying');
    const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'dying');
    const nextHit = out.events.indexOf(required(hits[1]));
    expect(applied).toBeGreaterThan(-1); expect(death).toBeGreaterThan(applied); expect(nextHit).toBeGreaterThan(death);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body', 'dying', 'child']);
    expect(out.events.reduce((n, e) => n + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0)).toBe(140);
    expect(casts(out.events)).toHaveLength(1);
  });

  it('final-enemy death ends before any PE payment; no target also spends nothing', () => {
    for (const enemyTeam of [[body()], []]) {
      const out = record({ ...input(), enemyTeam });
      expect(casts(out.events)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.result.winner).toBe('player');
    }
  });

  it('unrelated synthetic poison spells remain ordinary and independent of corpse authority', () => {
    const id = 'fixture.ordinary-poison', pe = required(getSkill(PE));
    registerSkill({ ...pe, id });
    const base = withHero(input(), { skillOrder: [id] });
    const out = record(base), control = record({ ...base, poisonExplosion: undefined });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === id)).toHaveLength(1);
    const withoutFeedback = (events: readonly RecordedBattleEvent[]) => events.filter(e =>
      e.kind !== 'message' || !e.messageKey.startsWith('combat:corpses.'));
    expect(withoutFeedback(out.events)).toEqual(withoutFeedback(control.events));
  });

  it('A/A/B/A is stable without resets and a new wave cannot reuse old supply', () => {
    const a = input(), first = record(a); expect(record(a)).toEqual(first);
    record({ ...input(20), seed: 7 }); expect(record(a)).toEqual(first);
    const next = record({ ...a, enemyTeam: [{ ...body(), life: 0 }, required(a.enemyTeam[1])] });
    expect(casts(next.events)).toEqual([]); expect(feedback(next.events)).toEqual([]);
  });
});
