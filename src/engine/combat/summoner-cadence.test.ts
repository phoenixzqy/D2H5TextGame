import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function nativeSnapshot(): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act2.the-summoner');
  if (!def) throw new Error('Missing native Summoner');
  const enemy = buildMonsterUnit({ def, level: 28, tier: 'boss', id: 'enemy', rng: createRng(7) });
  // An unearned passive tank exposes the native action bar; this is not balance evidence.
  const hero: CombatUnit = { id: 'hero', name: 'hero', kind: 'hero', side: 'player',
    level: 28, tier: 'trash', life: 100_000, mana: 0,
    stats: { ...enemy.stats, life: 100_000, lifeMax: 100_000, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    activeBuffIds: [], cooldowns: {}, enraged: false };
  return { seed: 13, act: 2, playerTeam: [hero], enemyTeam: [enemy] };
}

it('gives native Summoner a real Teleport window between three elemental attacks', () => {
  const input = nativeSnapshot(), before = structuredClone(input), out = runBattleRecorded(input);
  const actions = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'action' }> =>
    event.kind === 'action' && event.actor === 'enemy' && event.simClockMs > 0);
  expect(actions.some(event => event.skillId === 'monster.teleport')).toBe(true);
  expect(actions.slice(0, 8).map(event => [event.simClockMs, event.skillId])).toEqual([
    [1620, 'monster.fire_ball'], [3240, 'monster.frost_nova'], [4860, 'monster.lightning'],
    [6480, 'monster.teleport'], [8100, 'monster.fire_ball'], [9720, 'monster.frost_nova'],
    [11340, 'monster.lightning'], [12960, 'monster.teleport']
  ]);
  for (const damageType of ['fire', 'cold', 'lightning']) {
    expect(out.events.some(event => event.kind === 'damage' && event.source === 'enemy' &&
      event.target === 'hero' && event.damageType === damageType && event.amount > 0)).toBe(true);
  }
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', simClockMs: 6480,
    statuses: expect.arrayContaining([expect.objectContaining({ id: 'monster-teleport',
      appliedAtMs: 6480, expiresAtMs: 7480 })]) as unknown }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', simClockMs: 7480,
    statuses: expect.not.arrayContaining([expect.objectContaining({ id: 'monster-teleport' })]) as unknown }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'summon', owner: 'enemy', simClockMs: 0 }));
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});

it('keeps cooldown changes on the Summoner and retains shared spell definitions', () => {
  const enemy = nativeSnapshot().enemyTeam[0];
  expect(enemy?.skillOrder).toEqual(['monster-fire-ball', 'monster-frost-nova', 'monster-lightning',
    'monster-teleport', 'monster-summon-adds']);
  expect(enemy?.skillCooldownOverrides).toEqual({ 'monster.fire_ball': 6, 'monster.frost_nova': 6 });
  expect(Object.isFrozen(enemy?.skillCooldownOverrides)).toBe(true);
  for (const [id, cooldown] of [['monster-fire-ball', 3], ['monster-frost-nova', 3],
    ['monster-lightning', 2], ['monster-teleport', 3]] as const) expect(getSkill(id)?.cooldown).toBe(cooldown);
  expect(monsters.filter(row => row.id !== 'monsters/act2.the-summoner').some(row =>
    row.skillCooldownOverrides?.['monster.fire_ball'] !== undefined)).toBe(false);
});
