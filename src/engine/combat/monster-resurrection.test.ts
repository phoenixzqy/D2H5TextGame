import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import monsterRows from '../../data/monsters/act1.json';
import monsterSchema from '../../data/schema/monster.schema.json';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { MonsterDef } from '../types/monsters';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import * as orbDrops from './orbs';
import * as statusEffects from './status';
import type { CombatUnit, MonsterTier } from './types';

const ID = 'monster.resurrect_fallen', ALIAS = 'monster-resurrect-fallen';
const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
function monster(slug: string, id = slug, tier: MonsterTier = 'trash'): CombatUnit {
  const row: unknown = monsterRows.find(row => row.id === `monsters/act1.${slug}`);
  if (!validate(row)) throw new Error('Invalid production fixture');
  return buildMonsterUnit({ def: row, id, tier, level: 1, rng: createRng(7) });
}
function hero(): CombatUnit {
  const base = monster('fallen', 'hero');
  return { ...base, side: 'player', kind: 'hero', life: 100_000, mana: 100,
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 100, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
function body(slug = 'fallen', id = 'body'): CombatUnit {
  const base = monster(slug, id);
  return { ...base, life: 1, mana: 3,
    stats: { ...base.stats, life: 100, lifeMax: 100, mana: 20, manaMax: 20,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0 },
    skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
      { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }
    ] };
}
function source(slug = 'fallen-shaman', id = 'shaman'): CombatUnit {
  const base = monster(slug, id, slug === 'bishibosh' ? 'boss' : 'trash');
  return { ...base, life: 100_000, stats: { ...base.stats, life: 100_000, lifeMax: 100_000 } };
}
function input(): CombatSnapshot {
  return { seed: 7, act: 1, playerTeam: [hero()], enemyTeam: [body(), source()] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  expect(runBattle(snapshot)).toEqual(out.result);
  return out;
}
function revives(events: readonly RecordedBattleEvent[]) {
  return events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'revive' }> => event.kind === 'revive');
}
function casts(events: readonly RecordedBattleEvent[]) {
  return events.filter(event => event.kind === 'action' && (event.skillId === ID || event.skillId === ALIAS));
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('BUG404 finite original Shaman resurrection', () => {
  it('uses the production factory and authored fire-first priority to restore one original row', () => {
    const initial = input(), out = record(initial), revive = revives(out.events)[0];
    expect(casts(out.events)).toHaveLength(1);
    expect(revive).toMatchObject({ source: 'shaman', target: 'body', unit: {
      id: 'body', kind: 'monster', side: 'enemy', life: 100, mana: 3, statuses: [], activeBuffIds: []
    } });
    expect(out.events.find(e => e.kind === 'action' && e.actor === 'shaman'))
      .toMatchObject({ skillId: 'monster.fire_bolt', simClockMs: 1820 });
    expect(out.result.enemyTeam.map(u => u.id)).toEqual(['body', 'shaman']);
    expect(out.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(out.events.some(e => e.kind === 'buff' && e.buffId === 'resurrect')).toBe(false);
    if (!revive) throw new Error('Expected revive');
    expect(revive.unit.stats).toEqual(initial.enemyTeam[0]?.stats);
    const index = out.events.indexOf(revive);
    expect(out.events[index - 2]).toMatchObject({ kind: 'action', actor: 'shaman', skillId: ID });
    expect(out.events[index - 1]).toMatchObject({ kind: 'message', messageKey: 'combat:corpses.consumedResurrection', params: { count: 0, corpseId: 'body' } });
    expect(out.events[index + 1]).toMatchObject({ kind: 'status-state', target: 'body', statuses: [] });
    expect(out.events[index + 1]).not.toHaveProperty('initial');
    expect(out.events.find(e => e.kind === 'action' && e.actor === 'body'))
      .toMatchObject({ simClockMs: revive.simClockMs + 1700 });
    expect(revive.unit).not.toBe(out.result.enemyTeam[0]);
  });

  it.each(['fallen-shaman', 'carver-shaman', 'devilkin-shaman'])(
    'qualifies original %s sources without changing authored spell order', slug => {
      const out = record({ ...input(), enemyTeam: [body(), source(slug)] });
      expect(revives(out.events)).toHaveLength(1);
    });
  it('keeps Bishibosh fire priority and revives only while both higher-priority spells cool down', () => {
    const bishop = source('bishibosh');
    expect(bishop.skillOrder).toEqual(['monster-fire-bolt', 'monster-fire-ball', ALIAS]);
    const ordinary = record({ ...input(), enemyTeam: [body(), bishop] });
    expect(revives(ordinary.events)).toEqual([]);
    expect(ordinary.events.filter(e => e.kind === 'action' && e.actor === bishop.id).slice(0, 4))
      .toMatchObject([{ skillId: 'monster.fire_bolt' }, { skillId: 'monster.fire_ball' },
        { skillId: 'monster.fire_bolt' }, { skillId: 'monster.fire_ball' }]);
    // Controlled legitimate pending cooldowns expose its native third priority;
    // default cadence need not create a resurrection opening on its own.
    const out = record({ ...input(), enemyTeam: [body(), { ...bishop,
      cooldowns: { 'monster.fire_bolt': 5000, 'monster.fire_ball': 5000 } }] });
    expect(revives(out.events)).toHaveLength(1);
    expect(out.events.find(e => e.kind === 'action' && e.actor === bishop.id))
      .toMatchObject({ skillId: ID, simClockMs: 1780 });
  });
  it.each(['fallen', 'dark-one', 'carver', 'devilkin'])(
    'qualifies original %s bodies', slug => {
      expect(revives(record({ ...input(), enemyTeam: [body(slug), source()] }).events)).toHaveLength(1);
    });
  it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion'] as const)(
    'permits original body tier %s', tier => {
      expect(revives(record({ ...input(), enemyTeam: [{ ...body(), tier }, source()] }).events)).toHaveLength(1);
    });
  it.each(['boss', 'chapter-boss'] as const)('rejects synthetic allowlisted %s bodies', tier => {
    expect(revives(record({ ...input(), enemyTeam: [{ ...body(), tier }, source()] }).events)).toEqual([]);
  });
  it.each([
    { kind: undefined }, { kind: 'summon' as const }, { kind: 'merc' as const }, { summon: true },
    { ownerId: '' }, { summonOwnerId: '' }, { summonTemplateId: '' },
    { life: 0 }, { monsterArchetypeId: undefined }, { monsterArchetypeId: 'monsters/act1.zombie' }
  ])('does not capture an ineligible original body %j', fields => {
    const candidate = { ...body() };
    Object.assign(candidate, fields);
    // Missing optional fields must be absent under exactOptionalPropertyTypes.
    if ('kind' in fields && fields.kind === undefined) delete candidate.kind;
    if ('monsterArchetypeId' in fields && fields.monsterArchetypeId === undefined) delete candidate.monsterArchetypeId;
    expect(revives(record({ ...input(), enemyTeam: [candidate, source()] }).events)).toEqual([]);
  });
  it.each([
    { kind: undefined }, { kind: 'summon' as const }, { summon: true }, { ownerId: '' },
    { summonOwnerId: '' }, { summonTemplateId: '' }, { life: 0 },
    { monsterArchetypeId: undefined }, { monsterArchetypeId: 'monsters/act1.zombie' }
  ])('rejects an ineligible original source %j', fields => {
    const candidate = { ...source() };
    Object.assign(candidate, fields);
    if ('kind' in fields && fields.kind === undefined) delete candidate.kind;
    if ('monsterArchetypeId' in fields && fields.monsterArchetypeId === undefined) delete candidate.monsterArchetypeId;
    expect(revives(record({ ...input(), enemyTeam: [body(), candidate] }).events)).toEqual([]);
  });
  it('a player-side Shaman and forged display names confer no source authority', () => {
    const base = input(), foreign = source();
    expect(revives(record({ ...base, playerTeam: [...base.playerTeam, { ...foreign, side: 'player' }],
      enemyTeam: [body(), { ...foreign, id: 'target', monsterArchetypeId: 'monsters/act1.zombie' }] }).events)).toEqual([]);
  });

  it.each([ID, ALIAS])('shares one body and the exact cooldown through %s', id => {
    const s = source(), out = record({ ...input(), enemyTeam: [body(), { ...s, skillOrder: [id] }] });
    expect(revives(out.events)).toHaveLength(1);
    expect(casts(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.target === 'shaman')).toEqual([]);
  });
  it('empty pool preserves fallback event/RNG output with no debit/cooldown/buff', () => {
    const s = source(), lone = { ...s, skillOrder: [ALIAS] }, base = input();
    const enabled = record({ ...base, enemyTeam: [lone] });
    const disabled = record({ ...base, enemyTeam: [{ ...lone, skillOrder: [] }] });
    expect(enabled.events).toEqual(disabled.events);
    expect(enabled.result.enemyTeam).toEqual(disabled.result.enemyTeam.map(u => ({ ...u, skillOrder: [ALIAS] })));
  });
  it('rejects a replaced permanent-buff definition before payment or effects', () => {
    const native = getSkill(ID);
    if (!native) throw new Error('Missing native skill');
    registerSkill({ ...native, cooldown: 6, isBuff: true, effects: [{ kind: 'buff', id: 'resurrect', duration: -1 }] });
    const out = record(input());
    expect(casts(out.events)).toEqual([]);
    expect(revives(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'buff' && e.buffId === 'resurrect')).toEqual([]);
  });

  it('closes the second death without a second corpse, orb or permanent survivor row', () => {
    const h = hero(), initial = input();
    const out = record({ ...initial, playerTeam: [{ ...h, statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1,
      remaining: 8, expiresAtMs: 8000 }] }] });
    expect(revives(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(2);
    expect(out.result.enemyTeam.find(u => u.id === 'body')?.life).toBe(0);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toHaveLength(1);
    const second = out.events.filter(e => e.kind === 'death' && e.target === 'body')[1];
    if (!second) throw new Error('Expected second death');
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'body' && e.simClockMs >= second.simClockMs)).toEqual([]);
  });
  it('retains absolute dead-time cooldowns and MP without retaining recovery carry', () => {
    const b = body(), out = record({ ...input(), enemyTeam: [{ ...b,
      cooldowns: { 'fixture.live': 10_000, 'fixture.expired': 3000 },
      manaRegenPerSecond: 10, manaRegenCarry: .75, manaRegenCompensation: .01, manaRegenExactCarry: '0.75'
    }, source()] });
    const revived = revives(out.events)[0];
    expect(revived).toBeDefined();
    if (!revived) throw new Error('Expected revive');
    expect(revived.unit.mana).toBe(3);
    expect(revived.unit.cooldowns).toEqual({ 'fixture.live': 10_000 - revived.simClockMs });
    expect(revived.unit.manaRegenCarry ?? 0).toBe(0);
    expect(revived.unit.manaRegenCompensation ?? 0).toBe(0);
    expect(revived.unit.manaRegenExactCarry ?? '0').toBe('0');
    expect(out.events.filter(e => e.kind === 'mana' && e.target === 'body' &&
      e.simClockMs > 1000 && e.simClockMs <= revived.simClockMs)).toEqual([]);
  });

  it('removes only the oldest eligible shared FIFO token and obeys the authored 5s cooldown', () => {
    const b = body(), s = source();
    const out = record({ ...input(), enemyTeam: [{ ...body('fallen', 'other'), monsterArchetypeId: 'monsters/act1.zombie' },
      { ...b, id: 'oldest' }, { ...b, id: 'next' }, { ...s, skillOrder: [ALIAS] }] });
    const restored = revives(out.events);
    expect(restored.map(e => e.target)).toEqual(['oldest', 'next']);
    expect((restored[1]?.simClockMs ?? 0) - (restored[0]?.simClockMs ?? 0)).toBeGreaterThanOrEqual(5000);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedResurrection')
      .map(e => e.kind === 'message' ? e.params : undefined)).toEqual([
        { count: 2, corpseId: 'oldest' }, { count: 1, corpseId: 'next' }
      ]);
  });

  it('two Shamans compete synchronously for one shared body', () => {
    const s = source(), out = record({ ...input(), enemyTeam: [body(),
      { ...s, skillOrder: [ID] }, { ...s, id: 'other-shaman', skillOrder: [ALIAS] }] });
    expect(revives(out.events)).toHaveLength(1);
    expect(casts(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toHaveLength(1);
  });

  it('a player Corpse Explosion can spend the exact token before the Shaman', () => {
    const h = hero();
    const out = record({ ...input(), playerTeam: [{ ...h, level: 6, statuses: [], skillOrder: ['necromancer.corpse_explosion'] }],
      corpseExplosion: [{ sourceHeroId: h.id, rank: 1 }] });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.corpse_explosion')).toHaveLength(1);
    expect(revives(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
  });

  it('an earlier Shaman revival leaves no parallel token for a player Corpse Explosion', () => {
    const h = hero(), s = source();
    const out = record({ ...input(), playerTeam: [{ ...h, level: 6, statuses: [], skillOrder: ['necromancer.corpse_explosion'] }],
      enemyTeam: [body(), { ...s, skillOrder: [ID], stats: { ...s.stats, attackSpeed: 263 } }],
      corpseExplosion: [{ sourceHeroId: h.id, rank: 1 }] });
    expect(revives(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.corpse_explosion')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(2);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toHaveLength(1);
  });

  it.each([7, 11, 23])('retains the original seeded priority at a tied first post-revival action (seed %s)', seed => {
    const witness = monster('zombie', 'witness');
    const initial = { ...input(), seed, enemyTeam: [body(), source(), { ...witness,
      life: 100_000, stats: { ...witness.stats, life: 100_000, lifeMax: 100_000, attackSpeed: 90 },
      skillOrder: [], statuses: [] }] };
    const out = record(initial), revived = revives(out.events)[0];
    if (!revived) throw new Error('Expected native revival');
    expect(revived.simClockMs).toBe(3640);
    // Witness keeps its 1780ms cadence; restored body starts a fresh 1700ms period.
    const tiedAt = revived.simClockMs + 1700;
    expect(tiedAt).toBe(3 * 1780);
    const priorities = createRng(seed).fork('scheduler-ties');
    priorities.next(); // Original hero registration.
    const bodyPriority = priorities.next();
    priorities.next(); // Original Shaman registration.
    const witnessPriority = priorities.next();
    const expected = bodyPriority >= witnessPriority ? ['body', 'witness'] : ['witness', 'body'];
    expect(out.events.filter(e => e.kind === 'action' && e.simClockMs === tiedAt &&
      (e.actor === 'body' || e.actor === 'witness')).map(e => e.kind === 'action' ? e.actor : undefined))
      .toEqual(expected);
    // Outcome order also preserves original insertion identity across re-entry.
    expect(out.result.enemyTeam.map(unit => unit.id)).toEqual(['body', 'shaman', 'witness']);
  });

  it('captures effective registered duplicate identity once, rejecting the overwritten body', () => {
    const b = body(), original = input();
    const overwritten = { ...b, monsterArchetypeId: 'monsters/act1.zombie' };
    const out = record({ ...original, enemyTeam: [b, overwritten, source()] });
    expect(revives(out.events)).toEqual([]);
  });

  it('sticky hero death ends battle before a pending revival', () => {
    const h = hero(), out = record({ ...input(), playerTeam: [{ ...h, life: 1, statuses: [
      { id: 'ignite', sourceId: 'shaman', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }
    ] }] });
    expect(out.result.winner).toBe('enemy');
    expect(revives(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
  });

  it('skips repeated orb/plague RNG at second death while retaining ordinary on-hit recovery', () => {
    const orbRolls = vi.spyOn(orbDrops, 'rollOrbDrops'), spreads = vi.spyOn(statusEffects, 'spreadPlague');
    const hit = 'fixture.lethal-plague';
    registerSkill({ id: hit, archetype: 'fixture', trigger: 'active', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical',
        base: [100, 100], alwaysHits: true, onHitRecovery: { lifeFraction: .5 },
        applyStatuses: [{ id: 'poison', dotPctOfDamage: .01 }, { id: 'plague', dotPctOfDamage: .01 }] }] });
    const h = hero(), b = body();
    const out = runBattleRecorded({ ...input(), playerTeam: [{ ...h, life: 50_000, skillOrder: [hit],
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 8, expiresAtMs: 8000 }] }],
      enemyTeam: [{ ...b, tier: 'elite' }, source()] });
    const deaths = out.events.filter(e => e.kind === 'death' && e.target === 'body');
    expect(deaths).toHaveLength(2);
    expect(orbRolls).toHaveBeenCalledTimes(1);
    expect(spreads).not.toHaveBeenCalled();
    const second = deaths[1];
    if (!second) throw new Error('Expected second death');
    expect(out.events.filter(e => e.kind === 'orb')).toHaveLength(2);
    expect(out.events.filter(e => e.kind === 'orb').every(e => e.simClockMs === 1000)).toBe(true);
    expect(out.events.some(e => e.kind === 'status' && e.target === 'body' &&
      e.statusId === 'plague' && e.simClockMs === second.simClockMs)).toBe(true);
    expect(out.events.some(e => e.kind === 'heal' && e.target === 'hero' &&
      e.amount === 50 && e.simClockMs === second.simClockMs)).toBe(true);
  });

});
