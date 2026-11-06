import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function nativeMonster(): CombatUnit {
  const def = monsters.find(row => row.id === 'monsters/act3.mephisto');
  if (!def) throw new Error('Missing native Mephisto');
  return buildMonsterUnit({ def, level: 40, tier: 'boss', rng: createRng(13) });
}

function snapshot(enemy: CombatUnit): CombatSnapshot {
  const hero: CombatUnit = {
    id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 40, tier: 'trash',
    life: 100_000, mana: 0,
    stats: { ...enemy.stats, life: 100_000, lifeMax: 100_000,
      mana: 0, manaMax: 0, attack: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
  return { seed: 13, act: 3, playerTeam: [hero], enemyTeam: [enemy] };
}

it.each(['monster-frost-nova', 'monster.frost_nova'])(
  'uses canonical monster cooldown metadata for %s without changing the registered spell', id => {
    const enemy = { ...nativeMonster(), skillOrder: [id] };
    const input = snapshot(enemy), before = structuredClone(input);
    const result = runBattleRecorded(input);
    const times = result.events.filter(event => event.kind === 'action' &&
      event.actor === enemy.id && event.skillId === 'monster.frost_nova').map(event => event.simClockMs);
    expect(times.slice(0, 3)).toEqual([1540, 6160, 10780]);
    expect(getSkill(id)?.cooldown).toBe(3);
    expect(input).toEqual(before);
    expect(runBattle(input)).toEqual(result.result);
  }
);

it('keeps the shared cooldown when a monster has no override for that skill', () => {
  const native = nativeMonster();
  const { skillCooldownOverrides: omitted, ...withoutOverrides } = native;
  expect(omitted).toEqual({ 'monster.frost_nova': 4 });
  for (const enemy of [withoutOverrides,
    { ...withoutOverrides, skillCooldownOverrides: { 'monster.lightning': 8 } }]) {
    const input = snapshot({ ...enemy, skillOrder: ['monster-frost-nova'] });
    const result = runBattleRecorded(input);
    expect(result.events.filter(event => event.kind === 'action' &&
      event.actor === enemy.id && event.skillId === 'monster.frost_nova')
      .slice(0, 3).map(event => event.simClockMs)).toEqual([1540, 4620, 7700]);
  }
});

it('does not grant a monster cooldown override to a hero that carries copied metadata', () => {
  const source = nativeMonster();
  const input = snapshot({ ...source, skillOrder: [] });
  const hero = input.playerTeam[0];
  if (!hero || !source.monsterArchetypeId) throw new Error('Missing hero or monster archetype');
  const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
    monsterArchetypeId: source.monsterArchetypeId,
    skillCooldownOverrides: { 'monster.frost_nova': 10 },
    skillOrder: ['monster-frost-nova'] }] });
  const actions = result.events.filter(event => event.kind === 'action' &&
    event.actor === hero.id && event.skillId === 'monster.frost_nova');
  expect(actions.slice(0, 3).map(event => event.simClockMs)).toEqual([1540, 4620, 7700]);
});

it('copies and freezes authored cooldowns independently from the definition', () => {
  const native = monsters.find(row => row.id === 'monsters/act3.mephisto');
  if (!native) throw new Error('Missing native Mephisto');
  const overrides = { 'monster.frost_nova': 4 };
  const def: MonsterDef = { ...native, skillCooldownOverrides: overrides };
  const unit = buildMonsterUnit({ def, level: 40, tier: 'boss', rng: createRng(13) });
  expect(unit.skillCooldownOverrides).toEqual(overrides);
  expect(unit.skillCooldownOverrides).not.toBe(overrides);
  expect(Object.isFrozen(unit.skillCooldownOverrides)).toBe(true);
  overrides['monster.frost_nova'] = 8;
  expect(unit.skillCooldownOverrides).toEqual({ 'monster.frost_nova': 4 });
});
