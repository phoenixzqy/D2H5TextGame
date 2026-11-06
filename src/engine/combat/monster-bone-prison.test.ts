import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageEffect } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { ActiveStatus, CombatUnit } from './types';

const id = 'monster.bone_prison', statusId = 'monster-bone-prison';
const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: start });
function input(): CombatSnapshot {
  const def = monsters.find(r => r.id === 'monsters/act1.bone-ash'); if (!def) throw new Error('Missing native monster');
  const base = buildMonsterUnit({ def, level: 20, tier: 'boss', id: 'enemy', rng: rngModule.createRng(7) });
  const enemy: CombatUnit = { ...base, life: 100_000, mana: 0, skillOrder: [statusId], attackRange: [100, 100],
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 0, manaMax: 0, attack: 100, attackSpeed: 187,
      critChance: 0, physDodge: 0, magicDodge: 0, defense: 0, magicResist: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player', skillOrder: [],
    stats: { ...enemy.stats, attackSpeed: 100 }, statuses: [] };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [{ ...enemy, statuses: [hold(1005)] }] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out); expect(runBattle(snapshot)).toEqual(out.result);
  return out;
}
function damage(out: ReturnType<typeof runBattleRecorded>, source: string) {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === source);
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills(); const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed); vi.spyOn(rng, 'nextInt').mockImplementation(min => min);
    vi.spyOn(rng, 'chance').mockImplementation(p => p > .5); return rng;
  });
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('preserves rank-one direct range, native cooldown, zero mana, scope, spell delivery and aliases', () => {
  const skill = getSkill(id); expect(getSkill(statusId)).toBe(skill);
  expect(skill).toMatchObject({ archetype: 'monster', target: 'single-enemy', cooldown: 4, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'arcane', base: [10, 20] }] });
  if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing prison');
  expect(getSkillDamageDelivery(skill)).toBe('spell');
  expect(skill.effects[0].applyStatus).toBeUndefined(); expect(skill.effects[0].tags).toBeUndefined();
  expect(skill.effects[0].projectileFlightMs).toBeUndefined();
});
it('applies one source-owned two-second prison on a landed hit, removes exactly at expiry and grants no Stun', () => {
  const out = record(input()); expect(damage(out, 'enemy')).toEqual([expect.objectContaining({ amount: 10, dodged: false, simClockMs: 1004 })]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 1004,
    statuses: [expect.objectContaining({ id: statusId, sourceId: 'enemy', appliedAtMs: 1004, expiresAtMs: 3004, stacks: 1 })] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 3004, statuses: [] }));
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1700)).toBe(false);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 3400)).toBe(true);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'stun')).toBe(false);
  expect(out.result.playerTeam[0]?.statuses).toEqual([]);
});
it('allows the exact action boundary at expiry', () => {
  const s = input(), hero = s.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const enemy = s.enemyTeam[0]; if (!enemy) throw new Error('Missing enemy');
  const out = record({ ...s, playerTeam: [{ ...hero, stats: { ...hero.stats, attackSpeed: 250 } }],
    enemyTeam: [{ ...enemy, stats: { ...enemy.stats, attackSpeed: 250 }, statuses: [hold(501)] }] });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 2000)).toBe(false);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 2500)).toBe(true);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 2500, statuses: [] }));
});
it('does not imprison a dodged hit or a dead target', () => {
  const s = input(); const miss = record({ ...s, playerTeam: s.playerTeam.map(h => ({ ...h, stats: { ...h.stats, magicDodge: 1 } })) });
  expect(damage(miss, 'enemy')[0]).toMatchObject({ dodged: true });
  const dead = record({ ...s, playerTeam: s.playerTeam.map(h => ({ ...h, life: 1 })) });
  for (const out of [miss, dead]) expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(false);
});
it.each(['physical', 'arcane'] as const)('sets composed %s dodge to zero only inside its paid interval, retaining normal accuracy', damageType => {
  const s = input(), enemy = s.enemyTeam[0]; if (!enemy) throw new Error('Missing source');
  const hit: DamageEffect = { kind: 'damage', damageType, base: [100, 100] };
  registerSkill({ id: 'fixture.attack', archetype: 'monster', target: 'single-enemy', cooldown: 1, manaCost: 0, minLevel: 1, effects: [hit] });
  const shooter: CombatUnit = { ...enemy, id: 'shooter', skillOrder: ['fixture.attack'], stats: { ...enemy.stats, attackSpeed: 100 }, statuses: [] };
  const create = vi.mocked(rngModule.createRng).getMockImplementation(); if (!create) throw new Error('Missing fixture RNG');
  vi.mocked(rngModule.createRng).mockImplementation(seed => { const rng = create(seed); let draws = 0;
    vi.spyOn(rng, 'chance').mockImplementation(p => ++draws === 1 || p >= .85); return rng; });
  const out = record({ ...s, playerTeam: s.playerTeam.map(h => ({ ...h, stats: { ...h.stats, physDodge: .8, magicDodge: .8 } })), enemyTeam: [enemy, shooter] });
  expect(damage(out, 'shooter').slice(0, 3).map(e => [e.simClockMs, e.dodged])).toEqual([[1700, false], [3400, true], [5100, true]]);
  expect(out.result.playerTeam[0]?.stats.physDodge).toBe(.8);
});
it('a clone replacement cannot pay for native control', () => {
  const skill = getSkill(id); if (!skill) throw new Error('Missing skill'); registerSkill({ ...skill });
  const out = record(input()); expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(false);
});
it.each<Partial<CombatUnit>>([{ kind: 'hero' }, { kind: 'merc' }, { summon: true }, { ownerId: 'other' },
  { summonOwnerId: 'other' }, { monsterArchetypeId: 'fake' }, { mana: NaN }, { level: 0 }])('refuses foreign or invalid native sources %j', patch => {
  const s = input(), out = record({ ...s, enemyTeam: s.enemyTeam.map(e => ({ ...e, ...patch })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(false);
});
it('strips imported presentation markers before they can lock a new wave or remove dodge', () => {
  const s = input(), out = record({ ...s, playerTeam: s.playerTeam.map(h => ({ ...h,
    statuses: [{ id: statusId, sourceId: 'absent', stacks: 1, remaining: -1, appliedAtMs: 0, expiresAtMs: 60000 }] })),
    enemyTeam: s.enemyTeam.map(e => ({ ...e, skillOrder: [] })) });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1700)).toBe(true);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.statuses.some(t => t.id === statusId))).toBe(false);
});
it.each(['monsters/act1.bone-ash', 'monsters/act4.diablo'])('retains the native %s bar and reaches actual prison without player ranks', monsterId => {
  const s = input(), def = monsters.find(r => r.id === monsterId); if (!def) throw new Error('Missing real consumer');
  const base = buildMonsterUnit({ def, id: 'enemy', level: 20, tier: 'boss', rng: rngModule.createRng(7) });
  const out = record({ ...s, enemyTeam: [{ ...base, life: 100_000, stats: { ...base.stats, lifeMax: 100_000, critChance: 0 } }] });
  expect(base.skillOrder).toEqual(def.skills);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.skillId === id)).toBe(true);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(true);
});

it('retains the ordinary 85% hit check while a target is imprisoned', () => {
  const s = input(), enemy = s.enemyTeam[0]; if (!enemy) throw new Error('Missing source');
  const create = vi.mocked(rngModule.createRng).getMockImplementation(); if (!create) throw new Error('Missing RNG');
  vi.mocked(rngModule.createRng).mockImplementation(seed => { const rng = create(seed); let draws = 0;
    vi.spyOn(rng, 'chance').mockImplementation(p => ++draws === 1 || p > .9); return rng; });
  const shooter = { ...enemy, id: 'shooter', skillOrder: [], statuses: [], stats: { ...enemy.stats, attackSpeed: 100 } };
  const out = record({ ...s, enemyTeam: [enemy, shooter] });
  expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(true);
  expect(damage(out, 'shooter')[0]).toMatchObject({ simClockMs: 1700, dodged: true, amount: 0 });
});
it.each(['monster-bone-prison', 'monster.bone_prison'])('shares cooldown and respects ManaBurn for native alias %s', alias => {
  const s = input(), enemy = s.enemyTeam[0]; if (!enemy) throw new Error('Missing source');
  const out = record({ ...s, enemyTeam: [{ ...enemy, skillOrder: [alias], statuses: [] }] });
  const casts = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy' && e.skillId === id);
  expect(casts.slice(0, 3).map(e => e.simClockMs)).toEqual([1004, 5020, 9036]);
  for (const patch of [{ statuses: [{ id: 'mana-burn', sourceId: 'fixture', stacks: 1, remaining: -1 }] },
    { cooldowns: { [alias]: 60000 } }]) {
    const denied = record({ ...s, enemyTeam: [{ ...enemy, skillOrder: [alias], ...patch }] });
    expect(denied.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  }
});
it('keeps independently sourced overlapping traps until each exact expiry', () => {
  const s = input(), enemy = s.enemyTeam[0]; if (!enemy) throw new Error('Missing source');
  const second = { ...enemy, id: 'second', stats: { ...enemy.stats, attackSpeed: 100 }, statuses: [hold(1701)] };
  const out = record({ ...s, enemyTeam: [enemy, second] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 1700,
    statuses: [expect.objectContaining({ sourceId: 'enemy', expiresAtMs: 3004 }), expect.objectContaining({ sourceId: 'second', expiresAtMs: 3700 })] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 3004,
    statuses: [expect.objectContaining({ sourceId: 'second', expiresAtMs: 3700 })] }));
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 3400)).toBe(false);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 3700, statuses: [] }));
});
it('does not withdraw a paid trap when its original source dies', () => {
  const s = input(), hero = s.playerTeam[0], enemy = s.enemyTeam[0]; if (!hero || !enemy) throw new Error('Missing fixture');
  registerSkill({ id: 'fixture.kill', archetype: 'fixture', target: 'single-enemy', cooldown: 1, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [200_000, 200_000], alwaysHits: true }] });
  const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', skillOrder: ['fixture.kill'], stats: { ...hero.stats, attackSpeed: 100 } };
  const reserve: CombatUnit = { ...enemy, id: 'reserve', skillOrder: [], statuses: [hold()] };
  const out = record({ ...s, playerTeam: [hero, ally], enemyTeam: [enemy, reserve] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'enemy', simClockMs: 1700 }));
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1700)).toBe(false);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 3004, statuses: [] }));
});
it.each(['inferno', 'fire-wall'] as const)('interrupts a real Inferno cast but preserves independent %s pulses', spell => {
  const s = input(), hero = s.playerTeam[0], enemy = s.enemyTeam[0]; if (!hero || !enemy) throw new Error('Missing fixture');
  const caster: CombatUnit = { ...hero, level: 30, mana: 1000, skillOrder: ['sorceress.' + spell.replaceAll('-', '_')],
    stats: { ...hero.stats, mana: 1000, manaMax: 1000, attackSpeed: 400 },
    periodicSpellRanks: { 'fire-wall': 0, 'thunder-storm': 0, [spell]: 1 } };
  const out = record({ ...s, playerTeam: [caster], enemyTeam: [{ ...enemy,
    stats: { ...enemy.stats, attackSpeed: 250 }, statuses: [hold(501)] }] });
  const baseline = record({ ...s, playerTeam: [caster], enemyTeam: [{ ...enemy, skillOrder: [], statuses: [hold()] }] });
  for (const result of [out, baseline]) expect(result.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero',
    skillId: 'sorceress.' + spell.replaceAll('-', '_'), simClockMs: 400 }));
  expect(damage(baseline, 'hero').some(e => e.damageType === 'fire' && e.simClockMs > 500 && e.simClockMs < 2500)).toBe(true);
  const fire = damage(out, 'hero').filter(e => e.damageType === 'fire' && e.simClockMs > 500 && e.simClockMs < 2500);
  if (spell === 'inferno') expect(fire).toEqual([]);
  else expect(fire.some(e => e.simClockMs > 500)).toBe(true);
});
it('lets an already launched ordinary projectile land during the trap', () => {
  const s = input(), hero = s.playerTeam[0], enemy = s.enemyTeam[0]; if (!hero || !enemy) throw new Error('Missing fixture');
  registerSkill({ id: 'fixture.projectile', archetype: 'fixture', target: 'single-enemy', cooldown: 10, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'arcane', base: [100, 100], projectileFlightMs: 1000 }] });
  const out = record({ ...s, playerTeam: [{ ...hero, skillOrder: ['fixture.projectile'], stats: { ...hero.stats, attackSpeed: 400 } }],
    enemyTeam: [{ ...enemy, stats: { ...enemy.stats, attackSpeed: 250 }, statuses: [hold(501)] }] });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 400)).toBe(true);
  expect(damage(out, 'hero')).toContainEqual(expect.objectContaining({ simClockMs: 1400, amount: 100 }));
});
it('real seeded hit/miss outcomes remain deterministic with no extra status roll', () => {
  vi.restoreAllMocks(); const s = input(), counts = [];
  for (let seed = 0; seed < 16; seed++) {
    const out = record({ ...s, seed }), landed = damage(out, 'enemy')[0]?.dodged === false;
    expect(out.events.filter(e => e.kind === 'status' && e.statusId === statusId)).toHaveLength(landed ? 1 : 0); counts.push(landed);
  }
  expect(counts).toContain(true); expect(counts).toContain(false);
});
it('Concentration does not protect actions from the dedicated monster trap', () => {
  const s = input(), out = record({ ...s, statAura: { selectedAuraId: 'paladin.concentration',
    sourceHeroId: 'hero', rank: 1, maxRank: 20, bonuses: { physicalDamagePct: .035 }, preventStunInterruption: true } });
  expect(out.events.some(e => e.kind === 'status' && e.statusId === statusId)).toBe(true);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1700)).toBe(false);
});
