import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold',
  stacks: 1, remaining: -1, appliedAtMs });
function fixture(rank: number): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Flight', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-dragon-flight'], skillLevels: {
      'assassin.dragon_talon': 1, 'assassin.dragon_claw': 1,
      'assassin.dragon_tail': 1, 'assassin.dragon_flight': rank } });
  const hero: CombatUnit = { ...native, life: 1000, mana: 15,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100, attackSpeed: 100,
      attack: 100, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(1701), { id: 'poison', sourceId: 'constructed-clock', stacks: 1,
      remaining: -1, dotPerStack: 200, damageType: 'poison' }] };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999, manaMax: 0 },
    skillOrder: [], cooldowns: {}, activeBuffIds: [], statuses: [hold()], enraged: false };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

import assassinRows from '@/data/skills/assassin.json';
import barbarianRows from '@/data/skills/barbarian.json';
import { captureBattleCommandPassiveProfile } from '@/engine/skills/battle-command';
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result); return out;
}
function commander(base: CombatUnit): CombatUnit {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed paid Commander', 'barbarian'),
    id: 'captain', level: 30, comboOrder: ['skills-barbarian-battle-command'],
    skillLevels: Object.fromEntries(barbarianRows.map(row => [row.id, 1])) });
  return { ...native, life: 1000, mana: 100, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...base.stats, attackSpeed: 200 }, statuses: [hold(901)] };
}
function withCommand(input: CombatSnapshot): CombatSnapshot {
  const hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const profile = captureBattleCommandPassiveProfile(hero);
  return { ...input, playerTeam: [{ ...hero, battleCommandPassives: { baseline: profile, boosted: profile } }, commander(hero)] };
}
function warrior(rank: number, commanded = false): CombatSnapshot {
  const levels: Record<string, number> = {};
  const learn = (id: string) => {
    const row = assassinRows.find(row => row.id === id); if (!row) throw new Error('Missing actual prerequisite');
    for (const p of row.prerequisites ?? []) learn(p); levels[id] = 1;
  };
  learn('skills-assassin-shadow-warrior'); learn('skills-assassin-dragon-flight');
  levels['skills-assassin-shadow-warrior'] = rank; levels['skills-assassin-dragon-flight'] = 20;
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed paid Warrior Flight', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-shadow-warrior', 'skills-assassin-dragon-flight'], skillLevels: levels });
  const input = fixture(20), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const result = { ...input, playerTeam: [{ ...hero, ...native, stats: hero.stats, life: 1000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold()] }] };
  return commanded ? withCommand(result) : result;
}
it.each([1, 20])('actual paid Warrior rank%i pays its own Flight MP and keeps its captured cap', rank => {
  const input = warrior(rank), out = record(input), spawn = out.events.find(e => e.kind === 'summon');
  if (!spawn) throw new Error('Missing paid Warrior');
  expect(spawn.unit.skillLevels).toEqual({ 'assassin.dragon_flight': rank });
  expect(out.events.find(e => e.kind === 'action' && e.actor === spawn.unit.id))
    .toMatchObject({ skillId: 'assassin.dragon_flight', simClockMs: 1860 });
  expect(out.events.find(e => e.kind === 'mana' && e.target === spawn.unit.id && e.reason === 'cast'))
    .toMatchObject({ mana: 85, simClockMs: 1860 });
  const hit = out.events.find(e => e.kind === 'damage' && e.source === spawn.unit.id);
  expect(hit?.kind === 'damage' && hit.damageType).toBe('physical');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing actual kick');
  expect(hit.amount).toBeGreaterThanOrEqual(80 + 7 * (rank - 1));
  expect(hit.amount).toBeLessThanOrEqual(115 + 7 * (rank - 1));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === spawn.unit.id &&
    e.statuses.some(s => s.id === 'dragon-flight' && s.appliedAtMs === 1860 && s.expiresAtMs === 2860))).toBe(true);
  expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toHaveLength(1);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(100 - (rank === 1 ? 22 : 18));
});
it('real paid Command20→21 applies once to a committed Warrior Flight', () => {
  const out = record(warrior(20, true)), spawn = out.events.find(e => e.kind === 'summon');
  if (!spawn) throw new Error('Missing paid Warrior');
  expect(spawn.unit.skillLevels).toEqual({ 'assassin.dragon_flight': 20 });
  expect(out.events.find(e => e.kind === 'mana' && e.target === 'captain' && e.reason === 'cast'))
    .toMatchObject({ mana: 89, simClockMs: 900 });
  const hit = out.events.find(e => e.kind === 'damage' && e.source === spawn.unit.id);
  if (!hit || hit.kind !== 'damage') throw new Error('Missing paid Command Flight kick');
  expect(hit.amount).toBeGreaterThanOrEqual(220); expect(hit.amount).toBeLessThanOrEqual(255);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === spawn.unit.id &&
    e.statuses.some(s => s.id === 'dragon-flight' && s.appliedAtMs === 1860))).toBe(true);
});
it('native Command increases paid Flight kick rank once and leaves learned allocations unchanged', () => {
  const out = record(withCommand(fixture(20)));
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing Command kick');
  expect(hit.amount).toBeGreaterThanOrEqual(220); expect(hit.amount).toBeLessThanOrEqual(255);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.skillLevels?.['assassin.dragon_flight']).toBe(20);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(0);
});
it.each([false, true])('reflection settles after payment and uses the existing finite shield (shield=%s)', shield => {
  const input = fixture(20), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing reflection units');
  const out = record({ ...input, playerTeam: [{ ...hero, life: 1,
    statuses: [hold(1701), ...(shield ? [{ id: 'bone-armor', sourceId: 'hero', stacks: 1,
      remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] : [])] }],
    enemyTeam: [{ ...target, physicalReflectionPct: 1 }] });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.simClockMs === 1700 && e.statuses.some(s => s.id === 'dragon-flight'))).toBe(true);
  const reflection = out.events.find(e => e.kind === 'damage' && e.target === 'hero' && e.simClockMs === 1700);
  if (!reflection || reflection.kind !== 'damage') throw new Error('Missing actual reflection');
  expect(reflection.absorbed ?? 0).toBe(shield ? 215 : 0);
  expect(reflection.amount).toBe(shield ? 0 : 215);
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: 215 });
  if (shield) {
    expect(out.result.playerTeam[0]?.life).toBe(1);
    expect(out.result.playerTeam[0]?.statuses.find(s => s.id === 'bone-armor')?.boneArmor?.remaining).toBe(25);
  }
  if (!shield || reflection.amount > 0) {
    expect(out.result.playerTeam[0]?.life).toBe(0);
    expect(out.events.filter(e => e.kind === 'status-state' && e.target === 'hero').at(-1))
      .toMatchObject({ statuses: [] });
  }
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});
it('target death preserves one paid kick without retargeting another enemy', () => {
  const input = fixture(20), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, life: 1 }, { ...target, id: 'other' }] });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
    expect.objectContaining({ target: 'target', simClockMs: 1700 })]);
  expect(out.result.enemyTeam.find(u => u.id === 'other')?.life).toBe(99999);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});

function incoming(seed: number): CombatSnapshot {
  const input = fixture(20), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  return { ...input, seed, enemyTeam: [{ ...target, stats: { ...target.stats, attackSpeed: 0 },
    basicAttack: { damageType: 'fire', damage: [100, 100] }, statuses: [hold(2001)] }] };
}
function incomingHit(input: CombatSnapshot) {
  const out = record(input), hit = out.events.find(e => e.kind === 'damage' && e.source === 'target');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing actual incoming hit'); return hit;
}
it('adds the paid blink to existing magical dodge instead of replacing it (seed5)', () => {
  const base = incoming(5), hero = base.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  expect(incomingHit(base)).toMatchObject({ amount: 100, dodged: false, simClockMs: 2000 });
  expect(incomingHit({ ...base, playerTeam: [{ ...hero, stats: { ...hero.stats, magicDodge: .1 } }] }))
    .toMatchObject({ amount: 0, dodged: true, simClockMs: 2000 });
});
it('actual paid Command20→21 increases magical evasion by one point (seed2)', () => {
  const input = incoming(2);
  expect(incomingHit(input)).toMatchObject({ amount: 100, dodged: false, simClockMs: 2000 });
  expect(incomingHit(withCommand(input))).toMatchObject({ amount: 0, dodged: true, simClockMs: 2000 });
});
it('keeps already-paid Flight potency after the real Command expires within its blink', () => {
  const input = withCommand(fixture(20)), hero = input.playerTeam[0], captain = input.playerTeam[1], target = input.enemyTeam[0];
  if (!hero || !captain || !target) throw new Error('Missing Command units');
  const out = record({ ...input, seed: 2, playerTeam: [{ ...hero, statuses: [
    { ...hold(), expiresAtMs: 8000 }, hold(8501)] }, captain], enemyTeam: [{ ...target,
      stats: { ...target.stats, attackSpeed: 200 }, basicAttack: { damageType: 'fire', damage: [100, 100] },
      statuses: [{ ...hold(), expiresAtMs: 8501 }, hold(9001)] }] });
  expect(out.events.find(e => e.kind === 'action' && e.actor === 'hero'))
    .toMatchObject({ skillId: 'assassin.dragon_flight', simClockMs: 8500 });
  const expired = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 8900);
  if (!expired || expired.kind !== 'status-state') throw new Error('Missing actual Command expiry');
  expect(expired.statuses.some(s => s.id === 'battle-command')).toBe(false);
  expect(expired.statuses.some(s => s.id === 'dragon-flight' && s.expiresAtMs === 9500)).toBe(true);
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target'))
    .toMatchObject({ amount: 0, dodged: true, simClockMs: 9000 });
});
it('removes a paid Warrior blink at original owner death before its natural expiry', () => {
  const input = warrior(20), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing owner');
  const out = record({ ...input, playerTeam: [{ ...hero, statuses: [hold(), { id: 'poison', sourceId: 'constructed-clock',
    stacks: 1, remaining: -1, dotPerStack: 500, damageType: 'poison' }] },
    { ...commander(hero), skillOrder: [], statuses: [hold()] }] });
  const spawn = out.events.find(e => e.kind === 'summon'); if (!spawn) throw new Error('Missing Warrior');
  expect(out.events.some(e => e.kind === 'status-state' && e.target === spawn.unit.id && e.simClockMs === 1860 &&
    e.statuses.some(s => s.id === 'dragon-flight' && s.expiresAtMs === 2860))).toBe(true);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 2000 });
  const removed = out.events.find(e => e.kind === 'status-state' && e.target === spawn.unit.id && e.simClockMs === 2000);
  if (!removed || removed.kind !== 'status-state') throw new Error('Missing early owner-death removal');
  expect(removed.statuses.some(s => s.id === 'dragon-flight')).toBe(false);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === spawn.unit.id && e.simClockMs >= 2000 &&
    e.statuses.some(s => s.id === 'dragon-flight'))).toBe(false);
});
