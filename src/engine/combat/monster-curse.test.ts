import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs
});
function fixture(stopAfterCast = true, skill = 'monster-curse'): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act1.ghost');
  if (!def) throw new Error('Missing native Ghost');
  const enemy = buildMonsterUnit({ def, level: 12, tier: 'trash', id: 'enemy', rng: rngModule.createRng(7) });
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 100, skillOrder: [], statuses: [hold()],
    stats: { ...enemy.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [{ ...enemy,
    skillOrder: [skill], statuses: stopAfterCast ? [hold(1781)] : [] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('registers the authored single-target four-second Curse as a real nondamaging debuff', () => {
  const skill = getSkill('monster-curse');
  expect(getSkill('monster.curse')).toBe(skill);
  expect(skill).toEqual({ id: 'monster.curse', archetype: 'monster', target: 'single-enemy',
    cooldown: 4, minLevel: 1, manaCost: 0, effects: [{ kind: 'debuff', statusId: 'amplify-damage',
      durationMs: 3000, physicalResistReductionPct: 50 }] });
});

it.each(['monster-curse', 'monster.curse'])('%s applies despite magic dodge without damage or a hit roll', skill => {
  const input = fixture(true, skill);
  const snapshot = { ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    stats: { ...u.stats, magicDodge: 1 } })) };
  const create = rngModule.createRng, draws: { mock: { calls: readonly unknown[] } }[] = [];
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    for (const key of ['next', 'nextInt', 'chance', 'pick'] as const) draws.push(vi.spyOn(rng, key));
    return rng;
  });
  const out = record(snapshot);
  expect(out.events.filter(e => e.kind === 'damage' || e.kind === 'heal' || e.kind === 'mana')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'status')).toEqual([
    expect.objectContaining({ target: 'hero', statusId: 'amplify-damage', simClockMs: 1780 })
  ]);
  const state = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1780);
  if (!state || state.kind !== 'status-state') throw new Error('Missing Curse status state');
  expect(state.statuses).toContainEqual(expect.objectContaining({ id: 'amplify-damage',
    sourceId: 'enemy', appliedAtMs: 1780, expiresAtMs: 4780, physicalResistReductionPct: 50 }));
  expect(out.result.playerTeam[0]).toMatchObject({ life: 100_000, mana: 100 });
  for (const draw of draws) expect(draw.mock.calls).toEqual([]);
});

it('curses exactly one living party member and leaves every other body untouched', () => {
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const out = record({ ...input, playerTeam: [{ ...hero, id: 'dead', life: 0 }, hero,
    { ...hero, id: 'merc', kind: 'merc' }, { ...hero, id: 'summon', kind: 'summon', summon: true }] });
  const statuses = out.events.filter(e => e.kind === 'status');
  expect(statuses).toHaveLength(1);
  expect(statuses[0]).toMatchObject({ statusId: 'amplify-damage', simClockMs: 1780 });
  expect(statuses[0]?.kind === 'status' && ['hero', 'merc', 'summon'].includes(statuses[0].target)).toBe(true);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([]);
  expect(out.result.playerTeam.map(u => [u.id, u.life, u.mana])).toEqual([
    ['dead', 0, 100], ['hero', 100_000, 100], ['merc', 100_000, 100], ['summon', 100_000, 100]
  ]);
});

it('uses the native four-second cooldown with two ordinary attacks between Ghost casts', () => {
  const out = record(fixture(false));
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'enemy').slice(0, 7)).toEqual([
    expect.objectContaining({ skillId: 'monster.curse', simClockMs: 1780 }),
    expect.objectContaining({ skillId: null, simClockMs: 3560 }),
    expect.objectContaining({ skillId: null, simClockMs: 5340 }),
    expect.objectContaining({ skillId: 'monster.curse', simClockMs: 7120 }),
    expect.objectContaining({ skillId: null, simClockMs: 8900 }),
    expect.objectContaining({ skillId: null, simClockMs: 10680 }),
    expect.objectContaining({ skillId: 'monster.curse', simClockMs: 12460 })
  ]);
  expect(out.events.filter(e => e.kind === 'damage').every(e => e.damageType === 'physical')).toBe(true);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'enemy',
    target: 'hero', amount: 111, dodged: false, crit: false, simClockMs: 3560 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'enemy',
    target: 'hero', amount: 74, dodged: false, crit: false, simClockMs: 10680 }));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 4780 &&
    e.statuses.every(status => status.id !== 'amplify-damage'))).toBe(true);
  const damage = out.events.reduce((sum, e) => sum + (e.kind === 'damage' && e.target === 'hero' ? e.amount : 0), 0);
  expect(out.result.playerTeam[0]?.life).toBe(100_000 - damage);
});

it('respects target status immunity without introducing damage or retargeting the curse', () => {
  const input = fixture();
  const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statusImmunities: ['all-except-stun'] })) });
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'damage')).toEqual([]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy',
    skillId: 'monster.curse', simClockMs: 1780 }));
  expect(out.result.playerTeam[0]?.life).toBe(100_000);
});

it('keeps the existing native Mana Burn skill lock and ordinary-attack fallback', () => {
  const input = fixture();
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] })) });
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'enemy')).toEqual([
    expect.objectContaining({ skillId: null, simClockMs: 1780 })
  ]);
  expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'damage').every(e => e.damageType === 'physical')).toBe(true);
});
