import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, listSkills, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageEffect } from '../skills/effects';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded, type BattleEvent, type CombatSnapshot, type RecordedBattleEvent, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

function status(id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id, sourceId: 'cold-source', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs === undefined ? {} : { expiresAtMs }) };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100, mana: 0,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 1, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function actor(): CombatUnit { return { ...unit('actor', 'player'), statuses: [status('stun', 1701)] }; }
function target(life = 19): CombatUnit {
  return { ...unit('target', 'enemy'), life, statuses: [status('stun'), status('freeze')] };
}
function input(defender = target(), attacker = actor(), seed = 7): CombatSnapshot {
  return { seed, playerTeam: [attacker], enemyTeam: [defender] };
}
function replay(snapshot: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone(snapshot);
  const result = runBattleRecorded(snapshot);
  expect(runBattle(snapshot)).toEqual(result.result);
  expect(runBattleRecorded(snapshot)).toEqual(result);
  expect(snapshot).toEqual(before);
  return result;
}
function hits(result: RecordedBattleResult): Extract<RecordedBattleEvent, { kind: 'damage' }>[] {
  return result.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage');
}
function deaths(result: RecordedBattleResult): string[] {
  return result.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'death' }> => e.kind === 'death')
    .map(e => e.target);
}
function damageSkill(type: DamageType, extra: Partial<DamageEffect> = {}, all = false): string {
  const id = 'fixture.shatter-hit';
  registerSkill({ id, archetype: 'fixture', minLevel: 1, target: all ? 'all-enemies' : 'single-enemy',
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: type, base: [1, 1], ...extra }] });
  return id;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('Shatter direct physical execution', () => {
  it.each(['hero', 'merc', 'summon'] as const)('executes a frozen 19/100 target with a landed %s basic attack', kind => {
    const attacker: CombatUnit = { ...actor(), kind,
      ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}) };
    const snapshot = input(target(), attacker);
    const r = replay(kind === 'hero' ? snapshot : { ...snapshot,
      playerTeam: [{ ...unit('hero', 'player'), statuses: [status('stun')] }, attacker] });
    expect(hits(r)).toEqual([expect.objectContaining({ source: 'actor', target: 'target',
      amount: 19, damageType: 'physical', dodged: false, crit: false, simClockMs: 1700 })]);
    expect(deaths(r)).toEqual(['target']);
    expect(r.result.enemyTeam[0]?.life).toBe(0);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 1700 });
  });

  it.each([[20, 1, 19], [21, 2, 18]] as const)('does not execute pre-hit life %s even when the hit crosses below 20 percent', (life, attack, remaining) => {
    const base = actor();
    const r = replay(input(target(life), { ...base, stats: { ...base.stats, attack } }));
    expect(hits(r)).toHaveLength(1);
    expect(hits(r)[0]).toMatchObject({ amount: life - remaining, dodged: false });
    expect(r.result.enemyTeam[0]?.life).toBe(remaining);
    expect(deaths(r)).toEqual([]);
  });

  it('keeps a natural seed4 miss at 19 HP alive without execution', () => {
    const r = replay(input(target(), actor(), 4));
    expect(hits(r)).toEqual([expect.objectContaining({ amount: 0, dodged: true, crit: false })]);
    expect(deaths(r)).toEqual([]);
    expect(r.result.enemyTeam[0]?.life).toBe(19);
  });

  it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    'does not execute a direct %s hit', type => {
      const r = replay(input(target(), { ...actor(), skillOrder: [damageSkill(type)] }));
      expect(hits(r)).toEqual([expect.objectContaining({ amount: 1, damageType: type, dodged: false })]);
      expect(deaths(r)).toEqual([]);
      expect(r.result.enemyTeam[0]?.life).toBe(18);
    }
  );

  it('does not execute on a periodic physical bleed tick', () => {
    const base = target();
    const r = replay(input({ ...base, statuses: [...base.statuses,
      { ...status('bleed', 0, 1000), dotPerStack: 1, damageType: 'physical' }] },
    { ...actor(), statuses: [status('stun')] }));
    expect(hits(r)).toEqual([]);
    expect(r.events.filter(e => e.kind === 'dot')).toEqual([
      expect.objectContaining({ target: 'target', amount: 1, simClockMs: 1000 })]);
    expect(deaths(r)).toEqual([]);
    expect(r.result.enemyTeam[0]?.life).toBe(18);
  });

  it.each([
    { label: 'exact onset', freeze: status('freeze', 1700, 1701), amount: 19 },
    { label: 'exact expiry', freeze: status('freeze', 0, 1700), amount: 1 },
    { label: 'future onset', freeze: status('freeze', 1700.25, 2000), amount: 1 },
    { label: 'legacy indefinite', freeze: { id: 'freeze', sourceId: 'cold-source', stacks: 1, remaining: 2 }, amount: 19 }
  ])('honors $label with half-open Freeze activity', ({ freeze, amount }) => {
    const r = replay(input({ ...target(), statuses: [status('stun'), freeze] }));
    expect(hits(r)[0]).toMatchObject({ amount, simClockMs: 1700, dodged: false });
    expect(deaths(r)).toEqual(amount === 19 ? ['target'] : []);
    expect(r.result.enemyTeam[0]?.life).toBe(amount === 19 ? 0 : 18);
  });

  it('does not let Freeze applied by the current hit enable that same hit', () => {
    const r = replay(input({ ...target(), statuses: [status('stun')] },
      { ...actor(), skillOrder: [damageSkill('physical', { applyStatus: { id: 'freeze', chance: 1 } })] }));
    expect(hits(r)[0]).toMatchObject({ amount: 1, dodged: false });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'freeze', simClockMs: 1700 }));
    expect(r.result.enemyTeam[0]?.life).toBe(18);
    expect(deaths(r)).toEqual([]);
  });

  it.each(['boss', 'chapter-boss'] as const)('executes below threshold on %s and retains ordinary reduced amplification above it', tier => {
    const attacker = actor();
    const below = replay(input({ ...target(), tier }, attacker));
    expect(hits(below)[0]).toMatchObject({ amount: 19, dodged: false });
    expect(deaths(below)).toEqual(['target']);
    const above = replay(input({ ...target(100), tier }, { ...attacker, stats: { ...attacker.stats, attack: 4 } }));
    expect(hits(above)[0]).toMatchObject({ amount: 5, dodged: false });
    expect(above.result.enemyTeam[0]?.life).toBe(95);
    expect(deaths(above)).toEqual([]);
  });

  it('also executes a frozen player hero hit by an enemy', () => {
    const attacker = { ...actor(), side: 'enemy' as const, kind: 'monster' as const };
    const defender = { ...target(), side: 'player' as const, kind: 'hero' as const };
    const r = replay({ seed: 7, playerTeam: [defender], enemyTeam: [attacker] });
    expect(hits(r)[0]).toMatchObject({ amount: 19, source: 'actor', target: 'target' });
    expect(deaths(r)).toEqual(['target']);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'enemy', simClockMs: 1700 });
  });

  it('retains ordinary crit metadata and ordinary overkill without reducing damage', () => {
    const base = actor();
    const critical = replay(input(target(), { ...base, stats: { ...base.stats, critChance: 1 } }));
    expect(hits(critical)[0]).toMatchObject({ amount: 19, crit: true, dodged: false });
    const overkill = replay(input(target(), { ...base, stats: { ...base.stats, attack: 100 } }));
    expect(hits(overkill)[0]).toMatchObject({ amount: 150, crit: false, dodged: false });
    expect(deaths(critical)).toEqual(['target']);
    expect(deaths(overkill)).toEqual(['target']);
  });

  it('reuses one owner death closure before orphan orbs, refunds or status spread', () => {
    const first = { ...target(), tier: 'elite' as const, statuses: [...target().statuses,
      { ...status('poison'), dotPerStack: 0, damageType: 'poison' as const }] };
    const child = { ...unit('child', 'enemy'), kind: 'summon' as const, summonOwnerId: 'target', statuses: [status('stun')] };
    const grandchild = { ...unit('grandchild', 'enemy'), kind: 'summon' as const, summonOwnerId: 'child', statuses: [status('stun')] };
    const r = replay({ ...input(first, { ...actor(), skillOrder: [damageSkill('physical', {}, true)] }),
      enemyTeam: [first, child, grandchild] });
    expect(hits(r).map(e => [e.target, e.amount, e.dodged])).toEqual([
      ['child', 1, false], ['grandchild', 0, true], ['target', 19, false]]);
    expect(deaths(r)).toEqual(['target', 'child', 'grandchild']);
    expect(r.result.enemyTeam.map(e => e.life)).toEqual([0, 0, 0]);
    expect(r.result.enemyTeam.slice(1).some(e => e.statuses.some(s => s.id === 'poison'))).toBe(false);
    const orbAt = r.events.findIndex(e => e.kind === 'orb');
    const lastDeathAt = r.events.reduce((last, e, index) => e.kind === 'death' ? index : last, -1);
    expect(orbAt).toBeGreaterThan(lastDeathAt);
    expect(r.events.filter(e => e.kind === 'orb')).toHaveLength(2);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
  });

  it.each([[0, 7], [98, 100]] as const)('refunds the living summon owner once from mana%s to%s', (mana, expected) => {
    registerSkill({ id: 'fixture.owner-summon', archetype: 'fixture', minLevel: 1, target: 'self',
      manaCost: 7, cooldown: 100, effects: [{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }] });
    const owner = { ...unit('owner', 'enemy'), mana, skillOrder: ['fixture.owner-summon'], statuses: [status('stun')] };
    const child = { ...target(), kind: 'summon' as const, summonOwnerId: 'owner' };
    const r = replay({ ...input(child), enemyTeam: [owner, child] });
    expect(hits(r)[0]).toMatchObject({ target: 'target', amount: 19 });
    expect(deaths(r)).toEqual(['target']);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([
      expect.objectContaining({ target: 'owner', mana: expected, simClockMs: 1700 })]);
    expect(r.events.filter(e => e.kind === 'orb')).toEqual([]);
    expect(r.result.enemyTeam.find(e => e.id === 'owner')?.mana).toBe(expected);
  });

  it('preserves ordinary on-hit poison potency, status rolls and downstream RNG versus an ordinary lethal hit', () => {
    const skill = damageSkill('physical', { applyStatus: { id: 'poison', chance: 1, dotPctOfDamage: 1 } }, true);
    const spectator = { ...unit('spectator', 'enemy'), statuses: [status('stun')] };
    const make = (life: number, lifeMax: number): CombatSnapshot => {
      const defender = { ...target(life), stats: { ...target().stats, lifeMax } };
      return { ...input(defender, { ...actor(), skillOrder: [skill] }, 5), enemyTeam: [defender, spectator] };
    };
    const executed = replay(make(19, 100));
    const ordinary = replay(make(1, 5)); // Exact 20%: ordinary lethal damage, ineligible for Shatter.
    expect(hits(executed)[0]).toMatchObject({ target: 'target', amount: 19, dodged: false });
    expect(hits(ordinary)[0]).toMatchObject({ target: 'target', amount: 1, dodged: false });
    expect(executed.result.enemyTeam[0]?.statuses.find(s => s.id === 'poison')?.dotPerStack).toBe(1);
    expect(ordinary.events.filter(e => e.kind === 'orb').map(e => e.orb.kind)).toEqual(['mp']);
    const normalizeEvents = <T extends BattleEvent>(events: readonly T[]): readonly T[] => events.map(e =>
      e.kind === 'damage' && e.target === 'target' ? { ...e, amount: 1 } : e);
    const normalizeResult = (result: RecordedBattleResult['result']): RecordedBattleResult['result'] => ({
      ...result,
      events: normalizeEvents(result.events),
      enemyTeam: result.enemyTeam.map(e => e.id === 'target' ? { ...e, stats: { ...e.stats, lifeMax: 100 } } : e)
    });
    expect(normalizeEvents(executed.events)).toEqual(ordinary.events);
    expect(normalizeResult(executed.result)).toEqual(normalizeResult(ordinary.result));
  });

  it('executes a real seed5 Frost Nova target with a later basic attack inside Freeze', () => {
    const base = actor();
    const hero = { ...base, mana: 20, stats: { ...base.stats, attack: 10, attackSpeed: 250 },
      statuses: [status('stun', 1001)], skillOrder: ['skills-sorceress-frost-nova'] };
    const defender = { ...target(190), stats: { ...target().stats, life: 1000, lifeMax: 1000 }, statuses: [status('stun')] };
    const r = replay(input(defender, hero, 5));
    expect(hits(r).map(e => [e.damageType, e.amount, e.simClockMs])).toEqual([
      ['cold', 33, 500], ['physical', 157, 1000]]);
    expect(r.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill', 'freeze']);
    expect(r.events.filter(e => e.kind === 'action').map(e => e.skillId)).toEqual(['sorceress.frost_nova', null]);
    expect(deaths(r)).toEqual(['target']);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 1000 });
  });

  it('keeps current default physical skills separate from their Freeze-producing skills', () => {
    let physical = 0;
    for (const id of listSkills()) {
      const skill = getSkill(id);
      if (!skill?.effects.some(e => e.kind === 'damage' && e.damageType === 'physical')) continue;
      physical++;
      expect(skill.effects.some(e => e.kind === 'debuff' && e.statusId === 'freeze' ||
        e.kind === 'damage' && (e.applyStatus?.id === 'freeze' || e.applyStatuses?.some(s => s.id === 'freeze'))), id).toBe(false);
    }
    expect(physical).toBeGreaterThan(0);
  });

  it('preserves the complete no-Freeze control and its ordinary 19 to18 HP result', () => {
    const snapshot = input({ ...target(), statuses: [status('stun')] });
    const r = replay(snapshot);
    console.log('SHATTER_NO_FREEZE_CONTROL', JSON.stringify(r));
    expect(hits(r)).toEqual([expect.objectContaining({ amount: 1, dodged: false, simClockMs: 1700 })]);
    expect(r.result.enemyTeam[0]?.life).toBe(18);
    expect(deaths(r)).toEqual([]);
  });
});
