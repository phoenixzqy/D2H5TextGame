import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { statusActiveAt } from '@/engine/combat/status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { getSkill, registerSkill } from '@/engine/skills/registry';

type Attack = 'concentrate' | 'berserk' | 'stun';
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
/** Legal native configuration; explicitly synthetic level, pools and combat stats. */
function fixture(skill: Attack, rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Barbarian attack', 'barbarian'),
    id: 'hero', level: 30, skillLevels: { 'skills-barbarian-bash': 1,
      'skills-barbarian-stun': skill === 'stun' ? rank : 1,
      'skills-barbarian-concentrate': skill === 'concentrate' ? rank : 1,
      ...(skill === 'berserk' ? { 'skills-barbarian-berserk': rank } : {}) },
    comboOrder: ['skills-barbarian-' + skill] });
  const hero: CombatUnit = { ...native, life: 1000000, mana: 100, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 100, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: [{ ...hero, id: 'enemy', kind: 'monster', side: 'enemy',
    skillOrder: [], skillLevels: {}, statuses: [],
    stats: { ...hero.stats, attack: 200, attackSpeed: 50, defense: 0 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('Concentrate rank%i actually reduces incoming damage during its paid defense', rank => {
  for (const seed of [7, 19, 41, 97]) {
    const input = fixture('concentrate', rank, seed), out = record(input);
    const incoming = out.events.flatMap(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged ? [e] : []);
    const protectedHit = out.events.find(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 2000);
    expect(protectedHit?.kind).toBe('damage');
    if (protectedHit?.kind === 'damage') {
      // Existing flat Defense subtraction includes ordinary IEEE-754 flooring at rank2.
      expect(protectedHit.amount).toBe(protectedHit.dodged ? 0 : rank === 1 ? 95 : rank === 2 ? 89 : 1);
    }
    expect(incoming.length).toBeGreaterThan(0);
    expect(incoming.filter(e => e.simClockMs >= 2700).every(e => e.amount === 100)).toBe(true);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(90);
    expect(out.result.playerTeam[0]?.stats.defense).toBe(100);
  }
});
it.each([1, 2, 20])('Berserk rank%i converts the snapshot Attack contribution into Arcane HP loss', rank => {
  let landed = 0;
  for (const seed of [7, 19, 41, 97]) {
    const input = fixture('berserk', rank, seed);
    const low = record(input), high = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      stats: { ...u.stats, attack: 1100 } })) });
    const hits = (o: typeof low) => o.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits(low)).toHaveLength(1); expect(hits(high)).toHaveLength(1);
    expect(hits(high)[0]?.dodged).toBe(hits(low)[0]?.dodged);
    if (!hits(low)[0]?.dodged) {
      landed++;
      expect(hits(high)[0]?.amount).toBe((hits(low)[0]?.amount ?? 0) + 1000);
    }
    expect(hits(low)[0]?.damageType).toBe('arcane');
    expect(low.result.playerTeam[0]?.mana).toBe(80);
  }
  expect(landed).toBeGreaterThanOrEqual(3);
});
it.each(['trash', 'boss'] as const)('Stun damages its %s target and interrupts actual scheduled actions', tier => {
  const input = fixture('stun'), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    tier, stats: { ...u.stats, attackSpeed: 250 } })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.stun')).toBe(true);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'stun' && e.target === 'enemy')).toBe(true);
  expect(out.events.some(e => e.kind === 'stunned' && e.target === 'enemy' &&
    e.simClockMs > 1700 && e.simClockMs < (tier === 'boss' ? 2200 : 2700))).toBe(true);
  expect(out.result.playerTeam[0]?.mana).toBe(92);
});

it('Concentrate pays for defense even on a miss and expires at2700ms despite Stun', () => {
  const out = record(fixture('concentrate', 20, 41));
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ dodged: true, amount: 0 });
  expect(out.events.filter(e => e.kind === 'buff' && e.buffId === 'concentrate')).toHaveLength(1);
  const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700);
  expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'concentrate') : undefined)
    .toMatchObject({ id: 'concentrate', concentrate: { rank: 20, defensePct: 1 }, expiresAtMs: 2700 });
  const expired = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 2700);
  expect(expired?.kind).toBe('status-state');
  if (expired?.kind === 'status-state') expect(expired.statuses.some(s => s.id === 'concentrate')).toBe(false);
});
it.each(['concentrate', 'berserk', 'stun'] as const)('rejects %s without MP or with cooldown before paying', skill => {
  const cost = skill === 'concentrate' ? 10 : skill === 'berserk' ? 20 : 8;
  for (const patch of [{ mana: cost - 1 }, { cooldowns: { ['barbarian.' + skill]: 100000 } }]) {
    const base = fixture(skill), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...patch })) });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.' + skill)).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  }
});
it('rejects incomplete or altered Concentrate registry contracts without payment', () => {
  const original = getSkill('barbarian.concentrate');
  if (!original) throw new Error('Missing native Concentrate');
  for (const patch of [{ effects: original.effects.slice(1) }, { effects: original.effects.slice(0, 1) },
    { manaCost: 0 }, { target: 'all-enemies' as const }]) {
    registerSkill({ ...original, ...patch });
    const out = record(fixture('concentrate'));
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.concentrate')).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  }
});
it('Berserk uses magical defenses and ignores Physical bonuses/Defense/resistance', () => {
  const input = fixture('berserk'), plain = record(input);
  const hits = (out: typeof plain) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e.amount] : []);
  const physical = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    increasedDamagePct: { physical: 100 } })), enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, defense: 10000, resistances: { ...u.stats.resistances, physical: 75 } } })) });
  expect(hits(physical)).toEqual(hits(plain));
  const resistant = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, resistances: { ...u.stats.resistances, arcane: 50 } } })) });
  expect(hits(resistant)).toEqual(hits(plain).map(n => Math.floor(n / 2)));
  const defended = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, magicResist: 10 } })) });
  expect(hits(defended)).toEqual(hits(plain).map(n => n - 10));
});
it.each([1, 2, 20])('Stun rank%i preserves damage, miss rules and exact ordinary/boss expiry', rank => {
  let landed = 0, misses = 0;
  for (const tier of ['trash', 'boss'] as const) for (const seed of [7, 19, 41, 97]) {
    const input = fixture('stun', rank, seed), out = record({ ...input,
      enemyTeam: input.enemyTeam.map(u => ({ ...u, tier })) });
    const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero');
    if (hit?.kind !== 'damage') throw new Error('Missing native Stun hit');
    if (hit.dodged) {
      misses++;
      expect(out.events.some(e => e.kind === 'status' && e.statusId === 'stun')).toBe(false);
    } else {
      landed++;
      expect(hit.amount).toBeGreaterThanOrEqual(45 + 4 * (rank - 1));
      expect(hit.amount).toBeLessThanOrEqual(65 + 4 * (rank - 1));
      const state = out.events.find(e => e.kind === 'status-state' && e.target === 'enemy' && e.simClockMs === 1700);
      expect(state?.kind === 'status-state' ? state.statuses.find(s => s.id === 'stun') : undefined)
        .toMatchObject({ id: 'stun', expiresAtMs: tier === 'boss' ? 2200 : 2700 });
    }
  }
  expect(landed).toBeGreaterThan(0); expect(misses).toBeGreaterThan(0);
});
it('never repays an active Concentrate stance and honors its cooldown between hasted actions', () => {
  const input = fixture('concentrate'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: 20, statuses: [], stats: { ...u.stats, attackSpeed: 250 } })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold()] })) });
  expect(out.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs <= 1700
    ? [[e.simClockMs, e.skillId]] : [])).toEqual([
      [500, 'barbarian.concentrate'], [1000, null], [1500, 'barbarian.concentrate']]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
