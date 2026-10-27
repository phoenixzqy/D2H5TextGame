import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { composeCorpseExplosion } from '@/engine/skills/corpse-explosion';
import { composeFindPotion } from '@/engine/skills/find-potion';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';

const hold = (start = 0, end?: number): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold',
  stacks: 1, remaining: -1, appliedAtMs: start, ...(end === undefined ? {} : { expiresAtMs: end }) });
function fixture(slug = 'death-sentry'): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed shared boundary', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-' + slug],
    skillLevels: Object.fromEntries(rows.map(row => [row.id, 1])) });
  const hero: CombatUnit = { ...native, life: 1000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100, attackSpeed: 200, attack: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(901), { id: 'poison', sourceId: 'constructed-clock', stacks: 1,
      remaining: -1, appliedAtMs: 4000, dotPerStack: 1000, damageType: 'poison' }] };
  const target: CombatUnit = { id: 'survivor', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999, manaMax: 0 },
    skillOrder: [], skillLevels: {}, assassinTrapRanks: {}, cooldowns: {}, activeBuffIds: [], statuses: [hold()], enraged: false };
  return { seed: 19, maxRounds: 20, playerTeam: [hero], enemyTeam: [target] };
}
function body(target: CombatUnit, id = 'body'): CombatUnit {
  return { ...target, id, life: 10000, stats: { ...target.stats, lifeMax: 10000 },
    statuses: [hold(), { id: 'poison', sourceId: 'constructed-body-clock', stacks: 1,
      remaining: -1, dotPerStack: 10000, damageType: 'poison' }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const at of [1800, 1900]) it(`Death Sentry shares one genuine body with a competing Corpse Explosion at ${String(at)}ms`, () => {
  const input = fixture(), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing fixture');
  const necro = { ...createMockPlayer('Constructed native CE', 'necromancer'), id: 'necro', level: 30,
    comboOrder: ['skills-necromancer-corpse-explosion'],
    skillLevels: { 'necromancer.teeth': 1, 'necromancer.corpse_explosion': 1 } };
  const authority = composeCorpseExplosion(necro);
  if (!authority) throw new Error('Missing native CE authority');
  const consumer: CombatUnit = { ...playerToCombatUnit(necro), life: 1000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, stats: { ...hero.stats, attackSpeed: at === 1800 ? 200 : 75 },
    statuses: [hold(0, at), hold(at + 1)] };
  const out = record({ ...input, playerTeam: [hero, consumer], enemyTeam: [body(target), target],
    corpseExplosion: [authority] });
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
  const consumption = out.events.filter(e => e.kind === 'message').filter(e =>
    ['combat:corpses.consumed', 'combat:corpses.consumedDeathSentry'].includes(e.messageKey));
  expect(consumption).toEqual([expect.objectContaining({ simClockMs: at, messageKey: at === 1800
    ? 'combat:corpses.consumed' : 'combat:corpses.consumedDeathSentry' })]);
  expect(consumption[0]?.params?.count).toBe(0);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'necro')).toEqual([
    expect.objectContaining({ simClockMs: at, skillId: at === 1800 ? 'necromancer.corpse_explosion' : null })
  ]);
  const payments = out.events.filter(e => e.kind === 'mana' && e.target === 'necro' && e.reason === 'cast');
  expect(payments).toHaveLength(at === 1800 ? 1 : 0);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.target === 'survivor')
    .map(e => [e.simClockMs, e.damageType])).toEqual([[900, 'lightning'], [1900, at === 1800 ? 'lightning' : 'fire'], [2900, 'lightning']]);
});

it('Find Potion consumes the same body before the next sentry pulse and grants actual recovery once', () => {
  const input = fixture(), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing fixture');
  const barb = { ...createMockPlayer('Constructed native search', 'barbarian'), id: 'barb', level: 30,
    comboOrder: ['skills-barbarian-find-potion'], skillLevels: { 'barbarian.find_potion': 1 } };
  const authority = composeFindPotion(barb);
  if (!authority) throw new Error('Missing native recovery authority');
  const consumer: CombatUnit = { ...playerToCombatUnit(barb), life: 500, mana: 50,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, stats: hero.stats,
    statuses: [hold(0, 1800), hold(1801)] };
  const out = record({ ...input, playerTeam: [hero, consumer], enemyTeam: [body(target), target], findPotion: [authority] });
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'barb' && e.skillId === 'barbarian.find_potion'))
    .toEqual([expect.objectContaining({ simClockMs: 1800 })]);
  expect(out.events.filter(e => e.kind === 'heal' && e.target === 'barb'))
    .toEqual([expect.objectContaining({ simClockMs: 1800, amount: 100 })]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedDeathSentry')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero').every(e => e.damageType === 'lightning')).toBe(true);
});

for (const count of [1, 2]) it(`simultaneous sentries consume ${String(count)} shared bodies once in creation/FIFO order`, () => {
  const input = fixture(), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing fixture');
  const out = record({ ...input, playerTeam: [hero, { ...hero, id: 'second' }],
    enemyTeam: Array.from({ length: count }, (_, n): CombatUnit => {
      const victim = body(target, 'body-' + String(n + 1));
      return { ...victim, statuses: victim.statuses.map(status => status.id === 'poison'
        ? { ...status, appliedAtMs: n * 200 } : status) };
    }).concat(target) });
  const consumed = out.events.filter(e => e.kind === 'message').filter(e => e.messageKey === 'combat:corpses.consumedDeathSentry');
  expect(consumed.map(e => [e.simClockMs, e.params])).toEqual(Array.from({ length: count }, (_, n) =>
    [1900, { count: count - n - 1, corpseId: 'body-' + String(n + 1) }]));
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.target === 'survivor' && e.simClockMs === 1900);
  expect(hits.map(e => [e.source, e.damageType])).toEqual([['hero', 'fire'], ['second', count === 1 ? 'lightning' : 'fire']]);
  for (let n = 1; n <= count; n++) expect(out.events.filter(e => e.kind === 'death' && e.target === 'body-' + String(n))).toHaveLength(1);
});

it('a paid Blade Shield ignores positive hostile Fire while its controlled bearer survives', () => {
  const input = fixture('blade-shield'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing attacker');
  const out = record({ ...input, enemyTeam: [{ ...target, basicAttack: { damage: [10, 10], damageType: 'fire' },
    stats: { ...target.stats, attackSpeed: 0 }, statuses: [hold(3301)] }] });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'survivor'))
    .toEqual([expect.objectContaining({ simClockMs: 2000, damageType: 'fire', amount: 10 })]);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero')).toEqual([]);
});

it('Blade Shield reserves independent attacker intervals and its counters cannot reflect', () => {
  const input = fixture('blade-shield'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing attacker');
  const attacker: CombatUnit = { ...target, physicalReflectionPct: 1,
    stats: { ...target.stats, attackSpeed: 0, attack: 10 }, statuses: [hold(3301)] };
  const out = record({ ...input, enemyTeam: [{ ...attacker, id: 'first' }, { ...attacker, id: 'second' }] });
  const hits = out.events.filter(e => e.kind === 'damage');
  expect(hits.filter(e => e.source !== 'hero')).toEqual([
    expect.objectContaining({ source: 'second', target: 'hero', simClockMs: 2000, amount: 10, damageType: 'physical' }),
    expect.objectContaining({ source: 'first', target: 'hero', simClockMs: 2000, amount: 10, damageType: 'physical' })
  ]);
  expect(hits.filter(e => e.source === 'hero')).toEqual([
    expect.objectContaining({ target: 'second', simClockMs: 2000, damageType: 'physical' }),
    expect.objectContaining({ target: 'first', simClockMs: 2000, damageType: 'physical' })
  ]);
  expect(hits.filter(e => e.source === 'hero').every(e => e.amount > 0)).toBe(true);
  expect(hits.some(e => e.damageType === 'thorns')).toBe(false);
});

for (const at of [6800, 6900]) it(`Blade Shield's paid half-open lifetime handles a real incoming hit at ${String(at)}ms`, () => {
  const input = fixture('blade-shield'), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing units');
  const out = record({ ...input, playerTeam: [{ ...hero, statuses: hero.statuses.map(status => status.id === 'poison'
    ? { ...status, appliedAtMs: 8000 } : status) }],
  enemyTeam: [{ ...target, stats: { ...target.stats, attackSpeed: at === 6800 ? 100 : 140, attack: 10 },
    statuses: [hold(0, at), hold(at + 1)] }] });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ target: 'hero', simClockMs: 900, mana: 70 })
  ]);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'survivor')).toEqual([
    expect.objectContaining({ target: 'hero', simClockMs: at, amount: 10, damageType: 'physical' })
  ]);
  const counters = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
  expect(counters).toHaveLength(at === 6800 ? 1 : 0);
  if (at === 6800) expect(counters[0]).toMatchObject({ target: 'survivor', simClockMs: 6800, damageType: 'physical' });
});
