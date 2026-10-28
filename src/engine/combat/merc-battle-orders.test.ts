import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import { getSummon, registerSummon } from '../skills/summons';
import { createRng } from '../rng';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'] = 'player', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 700, mana: 80,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 0, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('merc-mercs/act5-barbarian-battle-orders#owned', 'player', {
    kind: 'merc', mercBattleOrders: true, skillOrder: ['aura-battle-orders'], ...patch });
}
function input(merc = source(), hero = unit('hero')): CombatSnapshot {
  return { seed: 7, maxRounds: 2, playerTeam: [hero, merc], enemyTeam: [unit('enemy', 'enemy')] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('supports the living hero, source, other merc and summon without refills or enemy bonuses', () => {
  const out = record({ ...input(), playerTeam: [unit('hero'), source(), unit('merc', 'player', { kind: 'merc' }),
    unit('summon', 'player', { kind: 'summon', summon: true, ownerId: 'hero' }), unit('dead', 'player', { life: 0 })] });
  expect(out.result.playerTeam.map(u => [u.life, u.mana, u.stats.lifeMax, u.stats.manaMax]))
    .toEqual([[700, 80, 1300, 130], [700, 80, 1300, 130], [700, 80, 1300, 130], [700, 80, 1300, 130], [0, 80, 1000, 100]]);
  expect(out.result.enemyTeam[0]).toMatchObject({ life: 700, mana: 80, stats: { lifeMax: 1000, manaMax: 100 } });
  expect(out.events.some(e => e.kind === 'heal' || e.kind === 'mana' || e.kind === 'action')).toBe(false);
});
it.each(['stun', 'freeze'])('retains living presence during %s without stacking levels or duplicates', id => {
  const scene = input(source({ level: 99, skillLevels: { 'aura-battle-orders': 20 }, statuses: [{ ...hold, id }] }));
  const out = record({ ...scene, playerTeam: [...scene.playerTeam, source({ id: 'merc-mercs/act5-barbarian-battle-orders#second' })] });
  expect(out.result.playerTeam[0]).toMatchObject({ stats: { lifeMax: 1300, manaMax: 130 } });
});
it.each([
  { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
  { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
  { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { life: Infinity },
  { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 },
  { id: 'merc-mercs/act5-barbarian-war-cry#impostor' }, { skillOrder: [] }
])('refuses ineligible marked source %j', patch => {
  expect(record(input(source(patch))).result.playerTeam[0]).toMatchObject({ stats: { lifeMax: 1000, manaMax: 100 } });
});
it('never derives authority from bare skill or buff strings', () => {
  const { mercBattleOrders: _marker, ...merc } = source();
  expect(record(input({ ...merc, activeBuffIds: ['aura-battle-orders', 'battle_orders'] })).result.playerTeam[0])
    .toMatchObject({ stats: { lifeMax: 1000, manaMax: 100 } });
});
it('does not increase original enemy capacity during actual paid Conversion', () => {
  const hero = unit('hero', 'player', { mana: 100, conversionRank: 1,
    skillOrder: ['paladin.conversion'], skillLevels: { 'paladin.conversion': 1 },
    stats: { ...unit('hero').stats, attackSpeed: 250 }, statuses: [{ ...hold, appliedAtMs: 501 }] });
  const scene = input(source(), hero), out = record(scene);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'converted' }));
  expect(out.result.enemyTeam[0]?.stats).toEqual(scene.enemyTeam[0]?.stats);
  expect(out.events.some(e => (e.kind === 'life-capacity' || e.kind === 'mana-capacity') && e.target === 'enemy')).toBe(false);
});
it('settles withdrawal and exported carry before death effects, then reacquires without refill', () => {
  const merc = source({ life: 1, statuses: [hold,
    { id: 'ignite', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] });
  const hero = unit('hero', 'player', { life: 1250, mana: 125,
    manaRegenCarry: .5, manaRegenCompensation: .01, manaRegenExactCarry: '1/2' });
  const out = record(input(merc, hero));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 1000 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana-capacity', target: hero.id, simClockMs: 1000,
    manaMax: 100, state: { mana: 100, manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0' } }));
  const carried = out.result.playerTeam[0];
  if (!carried) throw new Error('Missing carried hero');
  expect(carried).toMatchObject({ life: 1000, mana: 100, stats: { lifeMax: 1000, manaMax: 100 } });
  expect(record(input(source(), carried)).result.playerTeam[0])
    .toMatchObject({ life: 1000, mana: 100, stats: { lifeMax: 1300, manaMax: 130 } });
});
it('uses the extra MP headroom for real regeneration and spending', () => {
  registerSkill({ id: 'fixture.expensive', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 60, manaCost: 110, effects: [{ kind: 'heal', amount: 1, target: 'self' }] });
  const hero = unit('hero', 'player', { mana: 100, manaRegenPerSecond: 10, statuses: [], skillOrder: ['fixture.expensive'] });
  const scene = input(source(), hero), out = record(scene);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: hero.id, skillId: 'fixture.expensive' }));
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'regeneration' && e.mana > 100)).toBe(true);
  expect(record({ ...scene, playerTeam: [hero] }).events.some(e => e.kind === 'action' && e.skillId === 'fixture.expensive')).toBe(false);
});
it('drops an actual recovery integral on withdrawal before a tied spend, preventing fractional credit afterward', () => {
  // Seed7 gives the third registered unit a lower tie priority than the fourth.
  const ties = createRng(7).fork('scheduler-ties');
  const priorities = Array.from({ length: 4 }, () => ties.next());
  expect(priorities[3]).toBeGreaterThan(priorities[2] ?? Infinity);
  registerSkill({ id: 'fixture.orders-withdraw-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 100000, effects: [{ kind: 'damage', damageType: 'physical', base: [1, 1], alwaysHits: true }] });
  registerSkill({ id: 'fixture.orders-spend', archetype: 'fixture', target: 'self', minLevel: 1,
    manaCost: 10, cooldown: 100000, effects: [{ kind: 'heal', amount: 1, target: 'self' }] });
  const stats = { ...unit('hero').stats, attackSpeed: 187 };
  const hero = unit('hero', 'player', { stats, mana: 125, manaRegenPerSecond: .25,
    statuses: [], skillOrder: ['fixture.orders-spend'] });
  const merc = source({ stats, life: 1 });
  const enemy = unit('enemy', 'enemy', { stats, statuses: [], skillOrder: ['fixture.orders-withdraw-hit'] });
  const out = record({ seed: 7, playerTeam: [unit('held', 'player', { stats }), merc, hero], enemyTeam: [enemy] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 1004 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: hero.id, mana: 90, reason: 'cast', simClockMs: 1004 }));
  const first = out.events.find(e => e.kind === 'mana' && e.target === hero.id && e.reason === 'regeneration');
  expect(first).toMatchObject({ simClockMs: 5020, mana: 91 });
});
it('adds Orders independently over fresh personal capacity alongside Oak and paid form', () => {
  const hero = unit('hero', 'player', { life: 75, stats: { ...unit('hero').stats, lifeMax: 100 },
    skillOrder: ['druid.werewolf'],
    druidShapeRanks: { werewolf: 20, werebear: 0, lycanthropy: 20 },
    druidForm: { form: 'werewolf', rank: 20, lycanthropyRank: 20, sourceHeroId: 'hero' } });
  const scene = { ...input(source(), hero), druidAllyAuras: { sourceHeroId: hero.id, oakRank: 19, heartRank: 0 } };
  expect(record(scene).result.playerTeam[0]).toMatchObject({ life: 75, stats: { lifeMax: 247, manaMax: 130 } });
});
it('coexists with selected Vigor over the same baseline', () => {
  const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.vigor', skillLevels: { 'paladin.vigor': 20 } });
  if (!statAura) throw new Error('Missing native Vigor projection');
  expect(record({ ...input(), statAura }).result.playerTeam[0]).toMatchObject({ stats: { lifeMax: 1700, manaMax: 130 } });
});
it('projects an actual late summon before publication and removes support when the source dies', () => {
  const original = getSummon('minion');
  if (!original) throw new Error('Missing minion template');
  try {
    registerSummon('minion', owner => {
      const base = original(owner);
      return { ...base, stats: { ...base.stats, lifeMax: 100, manaMax: 19 } };
    });
    registerSkill({ id: 'fixture.orders-summon', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100000, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    const hero = unit('hero', 'player', { statuses: [], skillOrder: ['fixture.orders-summon'] });
    const out = record(input(source({ life: 3, statuses: [hold,
      { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] }), hero));
    const spawn = out.events.find(e => e.kind === 'summon');
    if (spawn?.kind !== 'summon') throw new Error('Missing actual late summon');
    expect(spawn.unit).toMatchObject({ stats: { lifeMax: 130, manaMax: 24 } });
    expect(out.result.playerTeam.find(u => u.id === spawn.unit.id)).toMatchObject({ stats: { lifeMax: 100, manaMax: 19 } });
  } finally { registerSummon('minion', original); }
});
