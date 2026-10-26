import { afterEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { activeDimVision, paidDimVision } from './dim-vision-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses } from './status';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { stageStatusPlayback, applyEventToTeams, type PlaybackStepResult } from '../../stores/combatPlayback';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: start });
function curse(start = 400, end = start + 3000): ActiveStatus {
  return { id: 'dim-vision', sourceId: 'absent-paid-caster', stacks: 1, remaining: 3,
    appliedAtMs: start, expiresAtMs: end, dimVision: paidDimVision() };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    life: 100000, mana: 0, skillOrder: [], activeBuffIds: [], cooldowns: {}, statuses: [], enraged: false,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 100, attackSpeed: 250,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function fixture(statuses: ActiveStatus[] = [curse()]): CombatSnapshot {
  return { seed: 1, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold()] }],
    enemyTeam: [{ ...unit('target', 'enemy'), statuses: [...statuses, hold(4501)] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function hits(out: ReturnType<typeof record>) {
  return out.events.filter(e => e.kind === 'damage' && e.source === 'target');
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each([1, 7, 19, 42, 991, 123456789, 0xdeadbeef, 0xffffffff])(
  'seed%i proves the literal50-point probability at onset and ordinary probability before/at expiry', seed => {
    for (const [status, probability] of [[curse(500), .35], [curse(500.25), .85], [curse(-2500, 500), .85]] as const) {
      const input = { ...fixture([status]), seed }, first = record(input).events.find(e => e.kind === 'damage' && e.source === 'target');
      // One living defender, no prior actions/procs: the independent first seeded draw is the hit decision.
      expect(first).toMatchObject({ simClockMs: 500, dodged: createRng(seed).next() >= probability });
    }
  });
it.each(['physical', 'thorns', 'fire', 'cold', 'lightning', 'poison', 'arcane'] as const)(
  'changes only Physical/Thorns accuracy for direct %s attacks, preserving successful-hit damage and cadence', damageType => {
    const typed = (statuses: ActiveStatus[]) => {
      const input = fixture(statuses);
      return { ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
        basicAttack: { damageType, damage: [100, 100] as const } })) };
    };
    const paid = record(typed([curse()])), control = record(typed([]));
    const loss = (out: typeof paid) => 100000 - (out.result.playerTeam[0]?.life ?? 0);
    if (damageType === 'physical' || damageType === 'thorns') expect(loss(paid)).toBeLessThan(loss(control));
    else expect(hits(paid)).toEqual(hits(control));
    expect(hits(paid).every(e => e.kind === 'damage' && (e.dodged ? e.amount === 0 : e.amount === 100))).toBe(true);
    const times = (out: typeof paid) => out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
    expect(times(paid)).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
    expect(times(paid)).toEqual(times(control));
    expect(paid.result.enemyTeam[0]?.stats).toEqual(control.result.enemyTeam[0]?.stats);
  });
it('uses exact onset/expiry, permits Cleansing and fractional native rebasing, and requires no living caster', () => {
  const base = { ...unit('target', 'enemy'), statuses: [curse(400.1)] };
  expect(activeDimVision(base, 400.099)).toBeUndefined();
  expect(activeDimVision(base, 400.1)).toEqual(paidDimVision());
  expect(activeDimVision(base, 3400.1)).toBeUndefined();
  const carried = rebaseStatusClock(base, 1000.2);
  expect(activeDimVision(carried, 0)).toEqual(paidDimVision());
  const shortened = shortenCleansingStatuses(base, 400.1, .5);
  expect(shortened.statuses[0]?.expiresAtMs).toBe(1900.1);
  expect(activeDimVision(shortened, 1900.099)).toEqual(paidDimVision());
  expect(activeDimVision(shortened, 1900.1)).toBeUndefined();
  for (const clock of [NaN, Infinity, -Infinity]) expect(activeDimVision(base, clock)).toBeUndefined();
});
it.each<Partial<ActiveStatus>>([
  { dimVision: { physicalHitChanceReductionPct: 49 } },
  { dimVision: { physicalHitChanceReductionPct: NaN } }, { dimVision: { physicalHitChanceReductionPct: Infinity } },
  { id: 'blind' }, { stacks: 0 }, { stacks: 2 },
  { appliedAtMs: NaN }, { expiresAtMs: NaN }, { expiresAtMs: Infinity },
  { appliedAtMs: 1000 }, { expiresAtMs: 0 }, { expiresAtMs: 3400.01 }
])('bare/invalid/future/overlong payload %# confers no accuracy power at this clock', patch => {
  const status = { ...curse(), ...patch }, target = { ...unit('target', 'enemy'), statuses: [status] };
  expect(activeDimVision(target, 500)).toBeUndefined();
});
it.each(['dimVision', 'appliedAtMs', 'expiresAtMs'] as const)('missing %s grants no paid power', key => {
  const status = { ...curse() }; Reflect.deleteProperty(status, key);
  expect(activeDimVision({ ...unit('target', 'enemy'), statuses: [status] }, 500)).toBeUndefined();
});
it('a bare Dim Vision marker cannot change actual hit outcomes', () => {
  const status = { ...curse() }; Reflect.deleteProperty(status, 'dimVision');
  expect(hits(record(fixture([status])))).toEqual(hits(record(fixture([]))));
});
it('uses the strongest overlapping Raven blind, never adding or stacking duplicate Dim Vision packets', () => {
  const dim = record(fixture()), blind: ActiveStatus = { id: 'blind', sourceId: 'raven', stacks: 1,
    remaining: 3, appliedAtMs: 400, expiresAtMs: 3400 };
  expect(hits(record(fixture([curse(), curse()])))).toEqual(hits(dim));
  expect(hits(record(fixture([blind, curse()])))).toEqual(hits(dim));
});
it('refreshes exactly one copied immutable packet and applies the existing Cleansing duration once', () => {
  const input = { ...unit('target', 'enemy'), statuses: [curse()] }, payload = { physicalHitChanceReductionPct: 50 };
  const next = applyStatus(input, { id: 'dim-vision', sourceId: 'new-caster', simClockMs: 1000,
    durationMs: 3000, dimVision: payload, cleansingDurationMultiplier: .5 }, createRng(1));
  payload.physicalHitChanceReductionPct = 10;
  expect(next.statuses).toEqual([expect.objectContaining({ sourceId: 'new-caster', stacks: 1,
    appliedAtMs: 1000, expiresAtMs: 2500, cleansingShortened: true, dimVision: paidDimVision() })]);
  expect(Object.isFrozen(next.statuses[0]?.dimVision)).toBe(true);
  expect(input.statuses).toEqual([curse()]);
});
it('preserves exact playback HP/status outcomes and deterministic A/B/A recordings', () => {
  const input = fixture(), first = record(input), authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, first.events);
  let playback: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of first.events) playback = applyEventToTeams(playback.playerTeam, playback.enemyTeam, event, playback.statusPlayback);
  expect(playback.playerTeam[0]?.life).toBe(first.result.playerTeam[0]?.life);
  expect(playback.enemyTeam[0]?.statuses).toEqual(first.result.enemyTeam[0]?.statuses);
  record({ ...input, seed: 991 }); expect(record(input)).toEqual(first);
});
it('registered canonical payment captures the finite payload without inventing a damage effect', () => {
  resetRegistry(); loadDefaultSkills();
  const skill = getSkill('necromancer.dim_vision');
  expect(skill?.effects).toEqual([{ kind: 'debuff', statusId: 'dim-vision', durationMs: 3000, dimVision: true }]);
});
it('preserves the existing periodic HP integral across additional curse boundaries', () => {
  const periodic = (statuses: ActiveStatus[]) => {
    const input = fixture(statuses);
    return record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'poison', sourceId: 'target', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000,
        dotPerStack: 50, damageType: 'poison' as const }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [...statuses, hold()] })) });
  };
  const paid = periodic([curse()]), control = periodic([]);
  expect(paid.result.playerTeam[0]?.life).toBe(99850);
  const damageAt = (out: typeof paid, clock: number) => out.events.reduce((sum, e) =>
    sum + (e.kind === 'dot' && e.target === 'hero' && e.simClockMs <= clock ? e.amount : 0), 0);
  for (const clock of [500, 1000, 1500, 2000, 2500, 3000]) {
    expect(damageAt(paid, clock)).toBe(clock * .05);
    expect(damageAt(control, clock)).toBe(clock * .05);
  }
});
it('does not add a blind accuracy roll to actual Physical reflection', () => {
  const input = fixture(), reflected = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [hold(501)] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1, statuses: [curse(), hold()] })) });
  expect(reflected.events.find(e => e.kind === 'damage' && e.damageType === 'thorns'))
    .toMatchObject({ source: 'target', target: 'hero', amount: 100, dodged: false });
});
