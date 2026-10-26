import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { composeFindPotion, findPotionRecovery } from '@/engine/skills/find-potion';
import { composeFindItem, copyFindItemFinds, findItemBonusEnemies, findItemChance, rollFindItemSearch } from '@/engine/skills/find-item';
import { composeGrimWard, grimWardDuration } from '@/engine/skills/grim-ward';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const command = 'barbarian.battle_command';
function fixture(slug: 'find_potion' | 'find_item' | 'grim_ward', rank: number, seed = 7): CombatSnapshot {
  const owner = { ...createMockPlayer('Synthetic Command corpse potency', 'barbarian'),
    id: 'hero', level: 30, skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1,
      'barbarian.battle_orders': 1, [command]: 1, 'barbarian.find_potion': 1,
      'barbarian.find_item': 1, ['barbarian.' + slug]: rank }, comboOrder: [command, 'barbarian.' + slug] };
  const native = playerToCombatUnit(owner), hero: CombatUnit = { ...native, life: 500, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    basicAttack: { damage: [0, 0], damageType: 'physical' },
    stats: { ...native.stats, lifeMax: 1000, manaMax: 400, attackSpeed: 100, attack: 0, critChance: 0 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: 3401 }] };
  // These fixed diagnostic pools deliberately replace the real passive stat profile.
  Reflect.deleteProperty(hero, 'battleCommandPassives');
  const enemy: CombatUnit = { ...hero, id: 'survivor', side: 'enemy', kind: 'monster',
    life: 1000000, skillOrder: [], skillLevels: {}, stats: { ...hero.stats, lifeMax: 1000000 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }] };
  const body: CombatUnit = { ...enemy, id: 'body', life: 1, statuses: [...enemy.statuses,
    { id: 'poison', sourceId: 'synthetic-body', stacks: 1, remaining: -1,
      dotPerStack: 100, damageType: 'poison' }] };
  const fp = composeFindPotion(owner), fi = composeFindItem(owner), gw = composeGrimWard(owner);
  if (!fp || !fi || !gw && slug === 'grim_ward') throw new Error('Missing native corpse authority');
  return { seed, playerTeam: [hero], enemyTeam: [enemy, body],
    findPotion: [fp], findItem: [fi], ...(gw ? { grimWard: [gw] } : {}) };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === command)).toEqual([
    expect.objectContaining({ simClockMs: 1700 })]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
  return out;
}
function reset() {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
afterEach(reset);
beforeEach(reset);

it.each([1, 20])('paid Command raises Find Potion allocated%i recovery without changing learned authority', rank => {
  for (const seed of [7, 19, 41, 97]) {
    const input = fixture('find_potion', rank, seed), out = record(input);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion')).toEqual([
      expect.objectContaining({ simClockMs: 3400 })]);
    expect(out.events.filter(e => e.kind === 'heal' && e.simClockMs === 3400)).toEqual([
      expect.objectContaining({ target: 'hero', amount: Math.floor(1000 * (.1 + .005 * rank)) })]);
    const debit = out.events.find(e => e.kind === 'mana' && e.reason === 'cast' && e.simClockMs === 3400);
    if (debit?.kind !== 'mana') throw new Error('Missing paid recovery debit');
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'find-potion')).toEqual([
      expect.objectContaining({ mana: debit.mana + Math.floor(400 * (.05 + .0025 * rank)) })]);
    expect(out.result.playerTeam[0]?.skillLevels).toEqual(input.playerTeam[0]?.skillLevels);
  }
});

it.each([1, 20])('paid Grim Ward allocated%i retains boosted lifetime after Command expires', rank => {
  const input = fixture('grim_ward', rank), out = record(input), duration = 6000 + 500 * rank;
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward')).toEqual([
    expect.objectContaining({ simClockMs: 3400 })]);
  expect(out.events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedGrimWard'))
    .toMatchObject({ simClockMs: 3400, params: { count: 0, corpseId: 'body', duration: duration / 1000 } });
  expect(out.events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.grimWardEnded')?.simClockMs)
    .toBe(3400 + duration);
});

it.each([1, 20])('successful Find Item allocated%i captures boosted potency and preserves original settlement identity', rank => {
  let successes = 0;
  for (let seed = 0; seed < 16; seed++) {
    const input = fixture('find_item', rank, seed), out = record(input), finds = out.result.findItemFinds ?? [];
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_item')).toEqual([
      expect.objectContaining({ simClockMs: 3400 })]);
    for (const find of finds) {
      successes++;
      expect(find).toEqual({ sourceHeroId: 'hero', corpseId: 'body', rank: rank + 1, rankBonus: 1 });
      expect(findItemBonusEnemies([find], input, out.result.enemyTeam, 'hero')).toEqual([input.enemyTeam[1]]);
    }
  }
  expect(successes).toBeGreaterThan(0);
});


it.each(['find_potion', 'find_item', 'grim_ward'] as const)('paid Command preserves zero native %s authority despite raw learned fields', slug => {
  const base = fixture(slug, 20), input = { ...base,
    ...(slug === 'find_potion' ? { findPotion: [] } : {}),
    ...(slug === 'find_item' ? { findItem: [] } : {}),
    ...(slug === 'grim_ward' ? { grimWard: [] } : {}) };
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.' + slug)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.result.findItemFinds ?? []).toEqual([]);
});

it('accepts captured21 recovery, search and ward potency while plain21 remains invalid', () => {
  const input = fixture('find_potion', 20), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing recovery source');
  expect(findPotionRecovery(hero, 21, 1)).toEqual({ life: 200, mana: 40 });
  expect(findPotionRecovery(hero, 21)).toBeUndefined();
  expect(grimWardDuration(21, 1)).toBe(16000);
  expect(() => grimWardDuration(21)).toThrow();
  expect(findItemChance(21, 1)).toBe(.4);
  expect(() => findItemChance(21)).toThrow();
  let draws = 0;
  const rng = { next: () => { draws++; return .395; } };
  expect(rollFindItemSearch(20, rng)).toBe(false);
  expect(rollFindItemSearch(21, rng, 1)).toBe(true);
  expect(draws).toBe(2);
  expect(() => rollFindItemSearch(21, rng)).toThrow();
  expect(draws).toBe(2);
});

it('copied captured search potency stays frozen and must match original allocated source/body authority', () => {
  const input = fixture('find_item', 20), dead = input.enemyTeam.map(unit => unit.id === 'body' ? { ...unit, life: 0 } : unit);
  const find = { sourceHeroId: 'hero', corpseId: 'body', rank: 21, rankBonus: 1 as const };
  const copied = copyFindItemFinds([find]);
  expect(copied).toEqual([find]);
  expect(copied[0]).not.toBe(find);
  expect(Object.isFrozen(copied)).toBe(true); expect(Object.isFrozen(copied[0])).toBe(true);
  expect(findItemBonusEnemies(copied, input, dead, 'hero')).toEqual([input.enemyTeam[1]]);
  for (const patch of [{ rank: 20 }, { rank: 22 }, { rankBonus: undefined }, { rankBonus: 2 },
    { sourceHeroId: 'other' }, { corpseId: 'survivor' }, { extra: 1 }]) {
    expect(() => findItemBonusEnemies([{ ...find, ...patch }], input, dead, 'hero')).toThrow();
  }
  expect(() => findItemBonusEnemies(copied, { ...input, findItem: [{ sourceHeroId: 'hero', rank: 19 }] }, dead, 'hero')).toThrow();
  expect(() => findItemBonusEnemies(copied, input, input.enemyTeam, 'hero')).toThrow();
});

it('a real inert paid action is required for matched Command controls', () => {
  const input = fixture('find_potion', 1);
  registerSkill({ id: 'fixture.inert-command', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 4, manaCost: 11, effects: [{ kind: 'buff', id: 'fixture.inert-command', duration: 60 }] });
  const control = { ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit,
    skillOrder: ['fixture.inert-command', 'barbarian.find_potion'] })) };
  const out = runBattleRecorded(control);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'fixture.inert-command')).toEqual([
    expect.objectContaining({ simClockMs: 1700 })]);
  expect(out.events.filter(e => e.kind === 'heal' && e.simClockMs === 3400)).toEqual([
    expect.objectContaining({ target: 'hero', amount: 100 })]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
});

it('fixed seed78 crosses the learned20/paid21 search chance edge with identical paid actions', () => {
  const input = fixture('find_item', 20, 78), boosted = record(input);
  registerSkill({ id: 'fixture.inert-command', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 4, manaCost: 11, isBuff: true,
    effects: [{ kind: 'buff', id: 'fixture.inert-command', duration: 60 }] });
  const control = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit,
    skillOrder: ['fixture.inert-command', 'barbarian.find_item'] })) });
  expect(control.events.filter(e => e.kind === 'action' && e.skillId === 'fixture.inert-command')).toHaveLength(1);
  expect(control.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_item')).toEqual([
    expect.objectContaining({ simClockMs: 3400 })]);
  expect(control.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual(boosted.events.filter(e => e.kind === 'mana' && e.reason === 'cast'));
  expect(control.result.findItemFinds ?? []).toEqual([]);
  expect(boosted.result.findItemFinds).toEqual([{ sourceHeroId: 'hero', corpseId: 'body', rank: 21, rankBonus: 1 }]);
});


it('Find Potion pays baseline potency after the half-open Command interval ends', () => {
  const base = fixture('find_potion', 20), input = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
    mana: 13, stats: { ...unit.stats, manaMax: 100 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: 8.299,
      appliedAtMs: 1701, expiresAtMs: 10000 },
      { id: 'stun', sourceId: 'synthetic-final-hold', stacks: 1, remaining: -1, appliedAtMs: 10201 }] })) };
  const out = record(input);
  const cast = out.events.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion');
  expect(cast).toHaveLength(1);
  expect(cast[0]?.simClockMs).toBeGreaterThanOrEqual(9700);
  expect(out.events.filter(e => e.kind === 'heal' && e.simClockMs === cast[0]?.simClockMs)).toEqual([
    expect.objectContaining({ target: 'hero', amount: 195 })]);
});
