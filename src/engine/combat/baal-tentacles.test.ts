import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon } from '../skills/summons';
import { buildMonsterUnit } from './monster-factory';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Stationary durable diagnostic controls; no earned progression or balance claim.
function fixture(): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act5.baal');
  if (!def) throw new Error('Missing native Baal');
  const boss = buildMonsterUnit({ def, level: 82, tier: 'boss', id: 'baal', rng: createRng(13) });
  const hero: CombatUnit = { ...boss, id: 'hero', kind: 'hero', side: 'player', tier: 'trash',
    life: 1_000_000, mana: 0, skillOrder: [], statusImmunities: [], enrage: undefined,
    stats: { ...boss.stats, attack: 0, life: 1_000_000, lifeMax: 1_000_000, mana: 0, manaMax: 0,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0 },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
  return { seed: 13, act: 5, enemyTeam: [{ ...boss, skillOrder: ['monster-tentacles'] }], playerTeam: [hero] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}

it('replaces the damage stub with five ordinary independently scheduled bodies and skips at capacity', () => {
  const skill = getSkill('monster-tentacles');
  expect(skill).toBe(getSkill('monster.tentacles'));
  expect(skill).toMatchObject({ target: 'summon', cooldown: 4, manaCost: 0,
    effects: [{ kind: 'summon', summonId: 'baal_tentacle', count: 5, maxCount: 5, refundOnDeath: false }] });
  if (!skill) throw new Error('Missing Tentacles');
  expect(getSkillDamageDelivery(skill)).toBe('spell');
  const input = fixture(), out = record(input);
  const summons = out.events.filter(event => event.kind === 'summon');
  expect(summons).toHaveLength(5);
  expect(new Set(summons.map(event => event.unit.id)).size).toBe(5);
  expect(new Set(summons.map(event => JSON.stringify(event.unit.gridPosition))).size).toBe(5);
  for (const event of summons) {
    expect(event).toMatchObject({ owner: 'baal', summonId: 'baal_tentacle', simClockMs: 1300,
      unit: { tier: 'trash', kind: 'summon', summon: true, side: 'enemy', level: 82,
        monsterArchetypeId: 'monsters/act5.baal-tentacle', summonRefundOnDeath: false,
        summonOwnerId: 'baal', basicAttackDelivery: 'melee', stats: { attackSpeed: 100 } } });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: event.unit.id, simClockMs: 3000 }));
    expect(out.events.some(hit => hit.kind === 'damage' && hit.source === event.unit.id && !hit.dodged && hit.amount > 0)).toBe(true);
  }
  expect(out.events.filter(event => event.kind === 'action' && event.actor === 'baal' && event.skillId === 'monster.tentacles')).toHaveLength(1);
  expect(out.events.some(event => event.kind === 'damage' && event.source === 'baal' && event.simClockMs === 1300)).toBe(false);
});

it('counts only living bodies belonging to this owner and fills exactly the missing capacity', () => {
  const base = fixture(), boss = base.enemyTeam[0];
  const def = monsters.find(row => row.id === 'monsters/act5.baal-tentacle');
  if (!boss || !def) throw new Error('Missing native fixture');
  const body = buildSummon(boss, 'baal_tentacle', { monsterDef: def, rng: createRng(7) });
  if (!body) throw new Error('Missing tentacle body');
  const adds = Array.from({ length: 5 }, (_, i) => ({ ...body, id: 'prior' + String(i), life: i === 4 ? 0 : body.life }));
  const other: CombatUnit = { ...body, id: 'other-owner', summonOwnerId: 'someone-else' };
  const out = record({ ...base, enemyTeam: [boss, ...adds, other] });
  const summons = out.events.filter(event => event.kind === 'summon');
  expect(summons).toHaveLength(1);
  expect(summons[0]).toMatchObject({ owner: boss.id, simClockMs: 1300 });
  expect(out.result.enemyTeam.filter(unit => unit.summonOwnerId === boss.id && unit.life > 0)).toHaveLength(5);
});

it('removes living tentacles when their owner dies, without orphan actions after death', () => {
  const base = fixture(), boss = base.enemyTeam[0];
  if (!boss) throw new Error('Missing Baal');
  const out = record({ ...base, enemyTeam: [{ ...boss,
    statuses: [{ id: 'ignite', sourceId: 'hero', stacks: 1, remaining: -1, dotPerStack: 1_000_000, appliedAtMs: 2000 }] }] });
  const summons = out.events.filter(event => event.kind === 'summon');
  expect(summons).toHaveLength(5);
  const death = out.events.find(event => event.kind === 'death' && event.target === boss.id);
  if (!death) throw new Error('Missing owner death');
  expect(out.result.winner).toBe('player');
  for (const event of summons) {
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: event.unit.id, simClockMs: death.simClockMs }));
    expect(out.result.enemyTeam.find(unit => unit.id === event.unit.id)?.life).toBe(0);
    expect(out.events.some(action => action.kind === 'action' && action.actor === event.unit.id && action.simClockMs > death.simClockMs)).toBe(false);
  }
});

it('lets the player kill tentacles and Baal replace them after cooldown with fresh identities', () => {
  registerSkill({ id: 'fixture.sweep', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 10, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [5000, 5000], alwaysHits: true }] });
  const base = fixture(), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const out = record({ ...base, playerTeam: [{ ...hero, statuses: [], skillOrder: ['fixture.sweep'],
    stats: { ...hero.stats, attackSpeed: 100 } }] });
  const summons = out.events.filter(event => event.kind === 'summon');
  const first = summons.filter(event => event.simClockMs === 1300);
  const replacement = summons.filter(event => event.simClockMs === 6500);
  expect(first).toHaveLength(5);
  expect(replacement).toHaveLength(5);
  expect(new Set([...first, ...replacement].map(event => event.unit.id)).size).toBe(10);
  for (const event of first)
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: event.unit.id, simClockMs: 1700 }));
  for (const event of replacement)
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: event.unit.id, simClockMs: 8200 }));
});
