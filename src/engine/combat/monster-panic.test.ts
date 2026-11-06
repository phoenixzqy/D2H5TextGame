import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '../../data';
import act1Areas from '../../data/maps/sub-areas/act1.json';
import type { SubAreaDef } from '../types/maps';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import * as damage from './damage';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit } from './types';

const ID = 'monster.panic_flee', ALIAS = 'monster-panic-flee';
function monster(slug: string, id = slug): CombatUnit {
  const def = monsters.find(row => row.id === `monsters/act1.${slug}`);
  if (!def) throw new Error('Missing bundled monster');
  return buildMonsterUnit({ def, id, level: 1, tier: slug === 'bishibosh' ? 'boss' : 'trash', rng: createRng(7) });
}
function recipient(slug = 'fallen'): CombatUnit {
  const base = monster(slug, 'recipient');
  return { ...base, life: 100_000, stats: { ...base.stats, life: 100_000, lifeMax: 100_000,
    defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0, attackSpeed: 100,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function hero(active = false): CombatUnit {
  const base = recipient();
  return { ...base, id: 'hero', kind: 'hero', side: 'player', skillOrder: [],
    stats: { ...base.stats, attack: 1, attackSpeed: 0 }, attackRange: [1, 1],
    statuses: active ? [] : [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
function dyingSource(slug = 'fallen-shaman', id = 'shaman', at = 500): CombatUnit {
  const base = monster(slug, id);
  return { ...base, life: 1, skillOrder: [], statuses: [
    { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: at / 1000,
      expiresAtMs: at, dotPerStack: 1000 / at }
  ] };
}
function snapshot(units: readonly CombatUnit[] = [recipient(), dyingSource()], active = false): CombatSnapshot {
  return { seed: 7, act: 1, playerTeam: [hero(active)], enemyTeam: units };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
function casts(events: readonly RecordedBattleEvent[]) {
  return events.filter(event => event.kind === 'action' && [ID, ALIAS].includes(event.skillId ?? ''));
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('original Fallen shaman-death reaction', () => {
  it.each([
    { slug: 'fallen', base: 20, oracles: [[1, 20, 26, 30], [7, 50, 65, 75], [17, 100, 130, 150]] },
    { slug: 'dark-one', base: 32, oracles: [[1, 32, 42, 48], [7, 62, 81, 93], [17, 112, 146, 168]] },
    { slug: 'devilkin', base: 32, oracles: [[1, 32, 42, 48], [7, 62, 81, 93], [17, 112, 146, 168]] }
  ])('$slug has its authored base with unchanged +5 growth', ({ slug, base, oracles }) => {
    const def = monsters.find(row => row.id === `monsters/act1.${slug}`);
    if (!def) throw new Error('Missing family row');
    expect(def.attack).toEqual([base, base]);
    expect(def.attackGrowth).toEqual([5, 5]);
    for (const [level, trash, elite, rare] of oracles) {
      if (level === undefined) throw new Error('Missing level');
      expect(buildMonsterUnit({ def, level, tier: 'trash', rng: createRng(7) }).stats.attack).toBe(trash);
      expect(buildMonsterUnit({ def, level, tier: 'elite', rng: createRng(7) }).stats.attack).toBe(elite);
      expect(buildMonsterUnit({ def, level, tier: 'rare-elite', rng: createRng(7) }).stats.attack).toBe(rare);
    }
  });
  it.each(['fallen', 'dark-one', 'devilkin'])('%s uses ordinary attacks before any qualifying death', slug => {
    const body = recipient(slug);
    expect(body.skillOrder).toEqual([ALIAS]);
    const out = record(snapshot([body]));
    expect(casts(out.events)).toEqual([]);
    expect(out.events.find(e => e.kind === 'action' && e.actor === body.id))
      .toMatchObject({ skillId: null, simClockMs: 1700 });
  });
  it.each(['fallen-shaman', 'carver-shaman', 'devilkin-shaman', 'bishibosh'])(
    'reacts once on its normal action after original %s dies', slug => {
      const body = recipient(), out = record(snapshot([body, dyingSource(slug)]));
      expect(casts(out.events)).toMatchObject([{ actor: body.id, skillId: ID, simClockMs: 1700 }]);
      expect(out.events.filter(e => e.kind === 'action' && e.actor === body.id).slice(0, 3))
        .toMatchObject([{ skillId: ID }, { skillId: null }, { skillId: null }]);
      const granted = out.events.find(e => e.kind === 'status-state' && e.target === body.id &&
        e.statuses.some(s => s.id === 'panic_flee'));
      expect(granted).toMatchObject({ simClockMs: 1700, statuses: [
        { id: 'panic_flee', sourceId: body.id, appliedAtMs: 1700, expiresAtMs: 6700 }
      ] });
      expect(out.events.some(e => e.kind === 'status-state' && e.target === body.id &&
        e.simClockMs === 6700 && e.statuses.length === 0)).toBe(true);
      expect(out.events.filter(e => e.kind === 'mana' && e.target === body.id)).toEqual([]);
      expect(out.events.some(e => e.kind === 'message' && e.messageKey.includes('consumed'))).toBe(false);
      expect(out.result.enemyTeam.find(u => u.id === body.id)?.stats).toEqual(body.stats);
    });
  it('coalesces multiple deaths and retains pending while stunned, without extra casts', () => {
    const body = { ...recipient(), statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 3, expiresAtMs: 3000 }
    ] }, out = record(snapshot([body, dyingSource(), dyingSource('carver-shaman', 'other', 1000)]));
    expect(casts(out.events)).toMatchObject([{ simClockMs: 3400 }]);
    expect(out.events.find(e => e.kind === 'stunned' && e.target === body.id))
      .toMatchObject({ simClockMs: 1700 });
  });
  it.each(['zombie', 'carver', 'rakanishu'])('does not react to ordinary %s death', slug => {
    const out = record(snapshot([recipient(), dyingSource(slug)]));
    expect(casts(out.events)).toEqual([]);
  });
  it.each([{ summon: true }, { kind: 'summon' as const }, { ownerId: 'x' },
    { summonOwnerId: 'x' }, { summonTemplateId: 'x' }, { monsterArchetypeId: 'forged' }])(
    'rejects ineligible original source %j', fields => {
      expect(casts(record(snapshot([recipient(), { ...dyingSource(), ...fields }])).events)).toEqual([]);
    });
  it.each([{ summon: true }, { kind: 'summon' as const }, { ownerId: 'x' },
    { summonOwnerId: 'x' }, { summonTemplateId: 'x' }, { monsterArchetypeId: 'monsters/act1.carver' },
    { tier: 'boss' as const }])('rejects ineligible recipient %j', fields => {
      const body = { ...recipient(), skillOrder: [ALIAS], ...fields };
      expect(casts(record(snapshot([body, dyingSource()])).events)).toEqual([]);
    });
  it('excludes a friendly Shaman and recipients dying simultaneously with the Shaman', () => {
    const s = dyingSource(), input = snapshot([recipient()]);
    expect(casts(record({ ...input, playerTeam: [...input.playerTeam, { ...s, side: 'player' }] }).events)).toEqual([]);
    const body = { ...recipient(), life: 1, statuses: dyingSource().statuses };
    expect(casts(record(snapshot([body, s])).events)).toEqual([]);
  });
  it.each([ID, ALIAS])('shares the native cooldown and action through %s', id => {
    const body = { ...recipient(), skillOrder: [id], cooldowns: { [ALIAS]: 4000 } };
    const out = record(snapshot([body, dyingSource()]));
    expect(casts(out.events)).toMatchObject([{ skillId: ID, simClockMs: 5100 }]);
  });
  it('strips carried/forged markers without suppressing a later actual reaction', () => {
    const body = { ...recipient(), activeBuffIds: [ID, ALIAS, 'panic_flee'], statuses: [
      { id: 'panic_flee', sourceId: 'forged', stacks: 1, remaining: -1 }
    ] };
    const opening = record(snapshot([body]));
    expect(casts(opening.events)).toEqual([]);
    expect(opening.events.find(e => e.kind === 'status-state' && e.target === body.id))
      .toMatchObject({ statuses: [] });
    expect(casts(record(snapshot([body, dyingSource()])).events)).toHaveLength(1);
  });
  it.each([ID, ALIAS])('rejects a replaced marker-only %s before payment', id => {
    const original = getSkill(ID);
    if (!original) throw new Error('Missing Panic');
    registerSkill({ ...original, id, effects: [{ kind: 'buff', id: 'panic_flee', duration: -1 }] });
    const body = { ...recipient(), skillOrder: [id] }, out = record(snapshot([body, dyingSource()]));
    expect(casts(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'buff' && e.target === body.id)).toEqual([]);
  });
  it.each(['manual', 'idle'] as const)('native Den guard in %s mode has no automatic Panic', mode => {
    const area = (act1Areas as SubAreaDef[]).find(area => area.id === 'areas/act1-den-of-evil');
    if (!area) throw new Error('Missing native Den');
    const before = structuredClone(area), plan = resolveChallengeWavePlan({ subArea: area, mode,
      fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6, seed: 2223645302,
      challengeOrdinal: 40, idleEliteMisses: 11 }), guard = plan.waves[2];
    if (!guard) throw new Error('Missing Den guard');
    const units = guard.spawns.map((spawn, index) => {
      const def = monsters.find(row => row.id === spawn.archetypeId);
      if (!def) throw new Error('Missing guard row');
      return buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, id: `guard-${String(index)}`,
        rng: createRng(7 + index), extraSkillIds: spawn.eliteAffix ? [spawn.eliteAffix.skillId] : [],
        resistanceBonus: DEFAULT_ELITE_CONFIG.rareEliteResistanceBonus });
    });
    expect(units.every(u => !u.monsterArchetypeId?.includes('shaman'))).toBe(true);
    expect(units[0]?.stats.attack).toBe(93);
    expect(casts(record(snapshot(units)).events)).toEqual([]);
    expect(area).toEqual(before);
  });
});

describe('Panic finite dodge uses the real damage pipeline', () => {
  it.each(['physical', 'fire'] as const)('adds exactly 20 percentage points to %s then expires', type => {
    registerSkill({ id: 'fixture.strike', archetype: 'fixture', target: 'single-enemy', cooldown: 1,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: type, base: [1, 1] }] });
    const input = snapshot(undefined, true), h = { ...hero(true), skillOrder: ['fixture.strike'] };
    const spy = vi.spyOn(damage, 'resolveDamage');
    record({ ...input, playerTeam: [h] });
    const calls = spy.mock.calls.map(([arg]) => arg).filter(arg => arg.baseMin === 1 && arg.type === type);
    expect(calls.slice(0, 4).map(arg => arg.defenderDodge)).toEqual([0.2, 0.2, 0.2, 0]);
    const nativeInput = calls[0];
    if (!nativeInput) throw new Error('Missing native damage input');
    let avoided = 0;
    for (let seed = 0; seed < 100; seed++) {
      const base = damage.resolveDamage({ ...nativeInput, defenderDodge: 0 }, createRng(seed));
      const panic = damage.resolveDamage(nativeInput, createRng(seed));
      if (base.hit && !panic.hit) avoided++;
      if (base.dodged) expect(panic.dodged).toBe(true);
      expect(damage.resolveDamage({ ...nativeInput, ignoreDodge: true }, createRng(seed)))
        .toEqual(damage.resolveDamage({ ...nativeInput, defenderDodge: 0, ignoreDodge: true }, createRng(seed)));
    }
    expect(avoided).toBeGreaterThan(0);
  });
});

describe('Panic allegiance and finite original lives', () => {
  function converter(targetId?: string) {
    const h = hero(true);
    return { ...h, level: 30, mana: 25, conversionRank: 1, skillOrder: ['paladin.conversion'],
      skillLevels: { 'paladin.conversion': 1 }, stats: { ...h.stats, attackSpeed: 250, mana: 100, manaMax: 100 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 501 },
        ...(targetId ? [{ id: 'taunt', sourceId: targetId, stacks: 1, remaining: 1,
          appliedAtMs: 0, expiresAtMs: 501 }] : [])] };
  }
  it('does not treat a genuinely converted Shaman as hostile when periodic damage kills it', () => {
    const h = converter(), body = { ...recipient(), gridPosition: { row: 2, col: 2 } },
      s = { ...dyingSource('fallen-shaman', 'shaman', 1000), life: 1000,
        gridPosition: { row: 0, col: 0 }, stats: { ...recipient().stats, attackSpeed: 100 },
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
          { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1000 }] };
    const out = record({ ...snapshot([s, body]), playerTeam: [h] });
    expect(out.events.some(e => e.kind === 'status' && e.target === s.id && e.statusId === 'converted')).toBe(true);
    expect(out.events.some(e => e.kind === 'death' && e.target === s.id)).toBe(true);
    expect(casts(out.events)).toEqual([]);
  });
  it('conversion forfeits a pending reaction and does not restore it after allegiance returns', () => {
    const h = converter(), body = { ...recipient(), statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 20, expiresAtMs: 20000 }
    ] }, out = record({ ...snapshot([body, dyingSource('fallen-shaman', 'shaman', 100)]),
      playerTeam: [{ ...h, mana: 100, statuses: [
        { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 6000 }
      ] }] });
    expect(out.events.some(e => e.kind === 'status' && e.target === body.id && e.statusId === 'converted')).toBe(true);
    expect(casts(out.events)).toEqual([]);
  });
  it('a recipient converted before the trigger cannot receive it', () => {
    const out = record({ ...snapshot([recipient(), dyingSource('fallen-shaman', 'shaman', 1000)]), playerTeam: [converter('recipient')] });
    expect(out.events.some(e => e.kind === 'status' && e.target === 'recipient' && e.statusId === 'converted')).toBe(true);
    expect(casts(out.events)).toEqual([]);
  });
  it('an unused converted recipient may react to a later death after returning hostile', () => {
    const late = dyingSource('devilkin-shaman', 'late', 10000), out = record({
      ...snapshot([recipient(), dyingSource('fallen-shaman', 'early', 1000), { ...late, life: 100_000,
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
          { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 10, expiresAtMs: 10000, dotPerStack: 10000 }] }]),
      playerTeam: [converter('recipient')] });
    expect(out.events.some(e => e.kind === 'status' && e.target === 'recipient' && e.statusId === 'converted')).toBe(true);
    expect(casts(out.events)).toMatchObject([{ simClockMs: 10200 }]);
  });
  it('a converted Shaman killed by an ordinary hostile hit does not trigger Panic', () => {
    const body = { ...recipient(), gridPosition: { row: 2, col: 2 }, attackRange: [1000, 1000] as const,
      stats: { ...recipient().stats, attack: 1000 }, statuses: [
        { id: 'taunt', sourceId: 'shaman', appliedAtMs: 1000, expiresAtMs: 8000, remaining: 7, stacks: 1 }
      ] }, s = { ...dyingSource(), life: 400,
      stats: { ...recipient().stats }, gridPosition: { row: 0, col: 0 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const out = record({ ...snapshot([s, body]), playerTeam: [converter()] });
    expect(out.events.some(e => e.kind === 'status' && e.target === s.id && e.statusId === 'converted')).toBe(true);
    const death = out.events.find(e => e.kind === 'death' && e.target === s.id);
    expect(death?.simClockMs).toBeGreaterThan(500);
    expect(death?.simClockMs).toBeLessThan(8500);
    expect(casts(out.events)).toEqual([]);
  });
  it('conversion removes active Panic immediately and does not restore it after return', () => {
    const h = converter(), body = { ...recipient(), statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 18, appliedAtMs: 2001, expiresAtMs: 20000 }
    ] }, out = record({ ...snapshot([body, dyingSource()]), playerTeam: [{ ...h, mana: 100,
      stats: { ...h.stats, attackSpeed: 0 }, statuses: [
        { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 6001 }
      ] }] });
    expect(casts(out.events)).toHaveLength(1);
    const conversion = out.events.find(e => e.kind === 'status' && e.target === body.id && e.statusId === 'converted');
    expect(conversion).toBeDefined();
    if (!conversion) throw new Error('Missing native conversion');
    const clock = conversion.simClockMs;
    expect(clock).toBeGreaterThan(1700);
    expect(clock).toBeLessThan(6700);
    expect(out.events.slice(out.events.indexOf(conversion) + 1).filter(e => e.kind === 'status-state' && e.target === body.id)
      .every(e => e.kind === 'status-state' && !e.statuses.some(s => s.id === 'panic_flee'))).toBe(true);
  });
  it.each([undefined, 500])('qualifies native direct/projectile source death with flight=%s', flight => {
    registerSkill({ id: 'fixture.kill', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'fire', base: [1000, 1000],
        alwaysHits: true, ...(flight === undefined ? {} : { projectileFlightMs: flight }) }] });
    const h = hero(true), body = { ...recipient(), gridPosition: { row: 2, col: 2 } }, s = {
      ...dyingSource(), life: 10, gridPosition: { row: 0, col: 0 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const out = record({ ...snapshot([s, body]), playerTeam: [{ ...h, skillOrder: ['fixture.kill'],
      stats: { ...h.stats, attackSpeed: 250 }, statuses: [
        { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 501 }
      ] }] });
    expect(out.events.find(e => e.kind === 'death' && e.target === s.id))
      .toMatchObject({ simClockMs: 500 + (flight ?? 0) });
    expect(casts(out.events)).toMatchObject([{ simClockMs: 1700 }]);
  });
  it('resurrection does not reset a recipient allowance forfeited by its first death', () => {
    const source = monster('carver-shaman', 'reviver'), body = { ...recipient(), life: 1,
      statuses: dyingSource().statuses },
      out = record(snapshot([body, { ...source, life: 100_000, skillOrder: ['monster-resurrect-fallen'] },
        dyingSource('fallen-shaman', 'first', 5000), dyingSource('devilkin-shaman', 'second', 10_000)]));
    expect(out.events.filter(e => e.kind === 'revive' && e.target === body.id)).toHaveLength(1);
    expect(casts(out.events)).toEqual([]);
  });
  it('keeps appended affix priority when Panic is unavailable', () => {
    const body = { ...recipient(), skillOrder: [ALIAS, 'monster-arcane-bolt'] }, out = record(snapshot([body]));
    expect(casts(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === body.id).slice(0, 3))
      .toMatchObject([{ skillId: 'monster.arcane_bolt' }, { skillId: null }, { skillId: 'monster.arcane_bolt' }]);
  });
  it('a Shaman killed by ordinary reflection supplies the reaction at the next normal action', () => {
    const h = { ...hero(), physicalReflectionPct: 1 }, s = { ...dyingSource(), skillOrder: [],
      statuses: [], stats: { ...monster('fallen-shaman').stats, critChance: 0 } };
    const out = record({ ...snapshot([recipient(), s]), playerTeam: [h] });
    expect(out.events.some(e => e.kind === 'damage' && e.source === h.id && e.target === s.id)).toBe(true);
    expect(out.events.find(e => e.kind === 'damage' && e.source === s.id)).toMatchObject({ dodged: true, simClockMs: 1820 });
    expect(out.events.find(e => e.kind === 'death' && e.target === s.id)).toMatchObject({ simClockMs: 3640 });
    expect(casts(out.events)).toMatchObject([{ simClockMs: 5100 }]);
  });
  it('drops dodge before an attack landing exactly on its expiry boundary', () => {
    const h = hero(true), spy = vi.spyOn(damage, 'resolveDamage');
    const out = record({ ...snapshot(), playerTeam: [{ ...h, stats: { ...h.stats, attackSpeed: 145 } }] });
    expect(out.events.some(e => e.kind === 'action' && e.actor === h.id && e.simClockMs === 6700)).toBe(true);
    expect(spy.mock.calls.map(([arg]) => arg).filter(arg => arg.baseMin === 1).slice(0, 5)
      .map(arg => arg.defenderDodge)).toEqual([0, 0.2, 0.2, 0.2, 0]);
  });
  it('does not dodge or reduce existing periodic damage', () => {
    const body = { ...recipient(), statuses: [
      { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 10, expiresAtMs: 10000, dotPerStack: 10 }
    ] }, enabled = record(snapshot([body, dyingSource()])), disabled = record(snapshot([
      { ...body, skillOrder: [] }, dyingSource()
    ]));
    const total = (events: readonly RecordedBattleEvent[]) => events.reduce((n, e) =>
      n + (e.kind === 'dot' && e.target === body.id ? e.amount : 0), 0);
    expect(total(enabled.events)).toBe(100);
    expect(total(disabled.events)).toBe(100);
    expect(casts(enabled.events)).toHaveLength(1);
  });
});
