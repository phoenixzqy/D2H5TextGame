import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import type { RegisteredSkill } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { CombatUnit } from './types';

const IRON = 'necromancer.iron_golem';
const AUTHORED = 'skills-necromancer-iron-golem';
const BLOOD = 'necromancer.blood_golem';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 1_000_000, mana: 35,
    stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 35, manaMax: 1000,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false };
}
function input(rank = 1): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero'), skillOrder: [IRON], skillLevels: { [IRON]: rank, [BLOOD]: 1 } }],
    enemyTeam: [unit('target', 'enemy')],
    ironGolem: { sourceHeroId: 'hero', sourceItemId: 'selected-item', life: 0, attack: 0, defense: 0 } };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot);
  const recorded = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(recorded.result);
  return recorded;
}
function summons(events: readonly RecordedBattleEvent[]) {
  return events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'summon' }> => event.kind === 'summon');
}
function casts(events: readonly RecordedBattleEvent[]) {
  return events.filter(event => event.kind === 'action' && event.skillId === IRON);
}
function payments(events: readonly RecordedBattleEvent[]) {
  return events.filter(event => event.kind === 'mana' && event.reason === 'cast');
}
function withoutItem(snapshot: CombatSnapshot): CombatSnapshot {
  const { ironGolem: _item, ...rest } = snapshot;
  return rest;
}
function preload(owner: CombatUnit, id = 'preloaded'): CombatUnit {
  return { ...required(buildSummon(owner, 'iron_golem')), id, life: 13,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
function dying(summon: CombatUnit): CombatUnit {
  return { ...summon, life: 1, statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1,
    remaining: 1, expiresAtMs: 1000, dotPerStack: 1000 }] };
}
const factory = required(getSummon('iron_golem'));
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { registerSummon('iron_golem', factory); resetRegistry(); loadDefaultSkills(); });

describe('D06 selected-item Iron Golem engine preparation', () => {
  it.each([
    [1, 260, 36, 48], [6, 340, 46, 63], [20, 564, 74, 105]
  ])('rank%s uses literal life/attack/defense %s/%s/%s and pays once', (rank, life, attack, defense) => {
    const out = record(input(rank));
    const spawned = required(summons(out.events)[0]);
    expect(summons(out.events)).toHaveLength(1);
    expect(spawned.simClockMs).toBe(0);
    expect(spawned.unit.life).toBe(life);
    expect(spawned.unit.stats.life).toBe(life);
    expect(spawned.unit.stats.lifeMax).toBe(life);
    expect(spawned.unit.stats.attack).toBe(attack);
    expect(spawned.unit.stats.defense).toBe(defense);
    expect(spawned.unit.stats.attackSpeed).toBe(60);
    expect(spawned.unit.stats.resistances.physical).toBe(20);
    expect(spawned.unit.stats.resistances.lightning).toBe(20);
    expect(casts(out.events)).toHaveLength(1);
    expect(payments(out.events)).toEqual([{ kind: 'mana', target: 'hero', mana: 0, reason: 'cast', simClockMs: 0, uiDelayMs: 50 }]);
    expect(out.result.ironGolemPreparation).toEqual({ sourceHeroId: 'hero', sourceItemId: 'selected-item',
      skillId: IRON, spawnedUnitId: spawned.unit.id, paidMp: 35 });
  });

  it.each([
    [1, 0, 8, 0, 260, 44, 48], [1, 0, 0, 53, 260, 36, 101],
    [20, 0, 0, 53, 564, 74, 158], [6, 12.5, 3.25, 4.5, 352.5, 49.25, 67.5]
  ])('rank%s adds isolated bonuses%s/%s/%s after scaling', (rank, life, attack, defense, hp, atk, def) => {
    const base = input(rank);
    const out = record({ ...base, ironGolem: { ...required(base.ironGolem), life, attack, defense } });
    const summon = required(summons(out.events)[0]).unit;
    expect([summon.life, summon.stats.life, summon.stats.lifeMax, summon.stats.attack, summon.stats.defense])
      .toEqual([hp, hp, hp, atk, def]);
  });

  it('uses one validated explicit rank for authored/canonical duplicate slots and stale cooldown', () => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const out = record({ ...base, playerTeam: [{ ...hero, skillOrder: [AUTHORED, IRON, AUTHORED],
      skillLevels: { [IRON]: 1, [AUTHORED]: 6, 'skills-necromancer-blood-golem': 1 },
      cooldowns: { [IRON]: 9000, [AUTHORED]: 12000, unrelated: 7000 } }] });
    const summon = required(summons(out.events)[0]).unit;
    expect([summon.stats.lifeMax, summon.stats.attack, summon.stats.defense]).toEqual([340, 46, 63]);
    expect(casts(out.events)).toHaveLength(1);
    expect(payments(out.events)).toHaveLength(1);
  });

  it('installs the ordinary4000ms cooldown once and preserves unrelated cooldowns', () => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const enemy = { ...required(base.enemyTeam[0]), life: 600,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 1, dotPerStack: 1000 }] };
    const out = record({ ...base, enemyTeam: [enemy], playerTeam: [{ ...hero, statuses: [],
      stats: { ...hero.stats, attackSpeed: 263 }, cooldowns: { [IRON]: 9000, unrelated: 7000 } }] });
    const elapsed = out.events.at(-1)?.simClockMs ?? 0;
    expect(elapsed).toBe(599);
    expect(required(out.result.playerTeam.find(u => u.id === 'hero')).cooldowns)
      .toEqual({ [IRON]: 4000 - elapsed, unrelated: 7000 - elapsed });
    expect(casts(out.events)).toHaveLength(1);
  });

  it('at34MP preserves the exact original mana without any payment', () => {
    const base = input();
    const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, mana: 34 })) });
    expect(required(out.result.playerTeam.find(u => u.id === 'hero')).mana).toBe(34);
    expect(payments(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it('at34MP retains mana and never retries after later regeneration', () => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const out = record({ ...base, playerTeam: [{ ...hero, mana: 34, manaRegenPerSecond: 100 }] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(payments(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
    expect(required(out.result.playerTeam.find(u => u.id === 'hero')).mana).toBeGreaterThan(35);
  });

  it('never uses a generic no-input fallback or unslotted learned skill', () => {
    const base = input();
    for (const snapshot of [withoutItem(base), { ...base, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [] })) }]) {
      const out = record(snapshot);
      expect(summons(out.events)).toEqual([]);
      expect(casts(out.events)).toEqual([]);
      expect(payments(out.events)).toEqual([]);
      expect(out.result.ironGolemPreparation).toBeUndefined();
    }
  });

  it('does not prepare in an initially terminal snapshot', () => {
    const out = record({ ...input(), enemyTeam: [] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it('does not prepare after an earlier startup skill makes the battle terminal', () => {
    const first = 'fixture.terminal_startup';
    registerSkill({ id: first, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 1, summonOnStart: true,
      effects: [{ kind: 'damage', damageType: 'physical', base: [2_000_000, 2_000_000] }] });
    const base = input();
    const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [first, IRON] })) });
    expect(out.events.some(e => e.kind === 'death' && e.target === 'target')).toBe(true);
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it.each([0, -1, 1.5, 21, NaN, Infinity])('refuses learned Iron rank%s without rank-one fallback', rank => {
    const out = record(input(rank));
    expect(summons(out.events)).toEqual([]);
    expect(payments(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it.each([
    { level: 23 }, { level: NaN }, { life: 0 }, { life: Infinity },
    { kind: 'merc' as const }, { summon: true }, { ownerId: '' }, { summonOwnerId: 'other' },
    { skillLevels: {} }, { skillLevels: { [IRON]: 1 } },
    { skillLevels: { [IRON]: 1, [BLOOD]: 0 } }, { skillLevels: { [IRON]: 1, [BLOOD]: 1.5 } },
    { skillLevels: { [IRON]: 1, [BLOOD]: 21 } }
  ])('refuses ineligible engine source%j', fields => {
    const base = input();
    const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...fields })) });
    expect(summons(out.events)).toEqual([]);
    expect(payments(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it.each([
    { sourceHeroId: 'other' }, { sourceItemId: '' }, { sourceItemId: null as unknown as string },
    { sourceItemId: 42 as unknown as string }, { life: -1 }, { attack: NaN },
    { defense: Infinity }, { life: Infinity }, { attack: -1 }, { defense: -1 }
  ])('malformed item input%j consumes no RNG, identity or resource effects', fields => {
    const base = input();
    const invalid = { ...base, ironGolem: { ...required(base.ironGolem), ...fields } };
    expect(record(invalid)).toEqual(record(withoutItem(base)));
  });

  it('a refused Iron candidate leaves later preparation identities and the whole recording unchanged', () => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const snapshot = { ...base, playerTeam: [{ ...hero, mana: 1000, skillOrder: [IRON, BLOOD] }] };
    const invalid = { ...snapshot, ironGolem: { ...required(base.ironGolem), attack: NaN } };
    const out = record(invalid);
    expect(summons(out.events).map(e => e.summonId)).toEqual(['blood_golem']);
    expect(out).toEqual(record(withoutItem(snapshot)));
  });

  it.each([59, 60])('respects earlier preparations and actual remaining%sMP', mana => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const out = record({ ...base, playerTeam: [{ ...hero, mana, skillOrder: [BLOOD, IRON] }] });
    expect(summons(out.events).map(e => e.summonId)).toEqual(mana === 60 ? ['blood_golem', 'iron_golem'] : ['blood_golem']);
    expect(out.result.ironGolemPreparation?.paidMp).toBe(mana === 60 ? 35 : undefined);
    expect(required(out.result.playerTeam.find(u => u.id === 'hero')).mana).toBe(mana === 60 ? 0 : 34);
  });

  it.each([1, 2])('preserves%s full living preloads without input, mana, replacement or factory call', count => {
    const base = input(); const hero = required(base.playerTeam[0]);
    const preloads = Array.from({ length: count }, (_, index) => preload(hero, `preloaded-${String(index)}`));
    registerSummon('iron_golem', () => { throw new Error('full preload must not build'); });
    const out = record({ ...withoutItem(base), playerTeam: [hero, ...preloads] });
    expect(summons(out.events)).toEqual([]);
    expect(payments(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
    for (const existing of preloads) expect(out.result.playerTeam.find(u => u.id === existing.id)).toMatchObject(existing);
  });

  it.each(['noItem', 'poor', 'invalidItem', 'full'])('valid%s attempt establishes no-refund death authority', kind => {
    const base = input(); const mana = kind === 'poor' ? 10 : 100;
    const hero = { ...required(base.playerTeam[0]), mana, cooldowns: { [IRON]: 9000 } };
    const item = kind === 'noItem' ? withoutItem(base) : base;
    const snapshot = { ...item,
      ...(kind === 'invalidItem' ? { ironGolem: { ...required(base.ironGolem), attack: -1 } } : {}),
      playerTeam: [hero, dying(preload(hero))] };
    const out = record(snapshot);
    expect(out.events.some(e => e.kind === 'death' && e.target === 'preloaded')).toBe(true);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
    expect(summons(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
    expect(required(out.result.playerTeam.find(u => u.id === 'hero')).mana).toBe(mana);
  });

  it('invalid canonical source establishes no authority and never enters generic casting', () => {
    const source = required(getSkill(IRON));
    registerSkill({ ...source, effects: [{ kind: 'summon', summonId: 'blood_golem', maxCount: 1 }] });
    const base = input(); const hero = { ...required(base.playerTeam[0]), mana: 10 };
    const out = record({ ...base, playerTeam: [hero, dying(preload(hero))] });
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toHaveLength(1);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it.each([
    { trigger: 'passive' as const }, { archetype: 'other' }, { summonOnStart: false },
    { manaCost: NaN }, { cooldown: Infinity }, { manaCostPerRank: Infinity },
    { effects: [{ kind: 'summon' as const, summonId: 'iron_golem', maxCount: 2 }] },
    { effects: [{ kind: 'summon' as const, summonId: 'iron_golem', maxCount: 1, statScaling: { attack: Infinity } }] }
  ])('malformed canonical source%j cannot fall through to generic startup or action', fields => {
    registerSkill({ ...required(getSkill(IRON)), ...fields });
    const out = record(input());
    expect(summons(out.events)).toEqual([]);
    expect(casts(out.events)).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });

  it('candidate overflow refuses before payment, identity or ordinary retry', () => {
    registerSummon('iron_golem', owner => {
      const summon = factory(owner);
      return { ...summon, stats: { ...summon.stats, attack: Number.MAX_VALUE } };
    });
    const base = input();
    const out = record({ ...base, ironGolem: { ...required(base.ironGolem), attack: Number.MAX_VALUE } });
    expect(out).toEqual(record(withoutItem(base)));
  });

  it('successful attestation survives summon death without replacement, mana refund or lost identity', () => {
    registerSummon('iron_golem', owner => dying(factory(owner)));
    const out = record(input());
    const spawned = required(summons(out.events)[0]);
    expect(summons(out.events)).toHaveLength(1);
    expect(out.events.some(e => e.kind === 'death' && e.target === spawned.unit.id)).toBe(true);
    expect(required(out.result.playerTeam.find(u => u.id === spawned.unit.id)).life).toBe(0);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
    expect(out.result.ironGolemPreparation).toEqual({ sourceHeroId: 'hero', sourceItemId: 'selected-item',
      skillId: IRON, spawnedUnitId: spawned.unit.id, paidMp: 35 });
  });

  it('copies item primitives at entry without freezing the caller input', () => {
    const base = input(); const item = { ...required(base.ironGolem), life: 12.5, attack: 3.25, defense: 4.5 };
    registerSummon('iron_golem', owner => {
      item.life = 1000; item.attack = 1000; item.defense = 1000; item.sourceItemId = 'changed';
      return factory(owner);
    });
    const out = runBattleRecorded({ ...base, ironGolem: item });
    const summon = required(summons(out.events)[0]).unit;
    expect([summon.life, summon.stats.attack, summon.stats.defense]).toEqual([272.5, 39.25, 52.5]);
    expect(out.result.ironGolemPreparation?.sourceItemId).toBe('selected-item');
    expect(Object.isFrozen(item)).toBe(false);
    expect(item.sourceItemId).toBe('changed');
  });

  it('preserves explicitly synthetic legacy Iron-template startup', () => {
    const source: RegisteredSkill = { ...required(getSkill(IRON)), id: 'fixture.legacy_iron', archetype: 'fixture' };
    registerSkill(source);
    const base = withoutItem(input());
    const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [source.id] })) });
    expect(summons(out.events).map(e => e.summonId)).toEqual(['iron_golem']);
    expect(out.result.ironGolemPreparation).toBeUndefined();
  });
});
