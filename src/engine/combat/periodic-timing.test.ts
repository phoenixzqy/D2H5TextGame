import { afterEach, describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { SkillEffect } from '../skills/effects';
import { runBattle, runBattleRecorded, type RecordedBattleResult } from './combat';
import { applyStatus } from './status';
import type { ActiveStatus, CombatUnit } from './types';

function status(id: string, overrides: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id, stacks: 1, remaining: -1, sourceId: 'fixture', ...overrides };
}
const hold = status('stun');
function unit(id: string, side: CombatUnit['side'], overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 30, tier: 'trash', life: 100_000, mana: 0,
    stats: {
      life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 10, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    statuses: [hold], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false,
    ...overrides
  };
}
function run(enemy: CombatUnit, player = unit('hero', 'player'), rest: CombatUnit[] = []): RecordedBattleResult {
  return runBattleRecorded({ seed: 7, playerTeam: [player], enemyTeam: [enemy, ...rest] });
}
function dots(recorded: RecordedBattleResult, target = 'enemy'): number {
  return recorded.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === target ? e.amount : 0), 0);
}
function register(effects: readonly SkillEffect[], id = 'fixture.periodic'): string {
  registerSkill({ id, archetype: 'fixture', target: 'single-enemy', cooldown: 100,
    manaCost: 0, minLevel: 1, effects });
  return id;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('periodic global timing contract', () => {
  it.each(['burn', 'ignite'])('settles the final fire interval at 4700ms for a new %s application', (id) => {
    const input = applyStatus(unit('enemy', 'enemy', { life: 9 }), {
      id, sourceId: 'hero', simClockMs: 1700, dotPerStack: 3, damageType: 'fire'
    }, createRng(7));
    const before = structuredClone(input);
    const result = run(input);
    expect(dots(result)).toBe(9);
    expect(result.result.enemyTeam[0]?.life).toBe(0);
    expect(result.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 4700 });
    expect(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 5], [4700, 4]]);
    expect(run(input)).toEqual(result);
    expect(input).toEqual(before);
  });

  it('keeps a stored rate-less legacy burn rate-less through refresh and the whole battle', () => {
    const old = status('burn', { stacks: 2, remaining: 1 });
    const input = unit('enemy', 'enemy', { statuses: [hold, old] });
    const refreshed = applyStatus(input, {
      id: 'ignite', sourceId: 'new', simClockMs: 1700, dotPerStack: 99
    }, createRng(7));
    expect(refreshed.statuses).toEqual([hold, { ...old, stacks: 3, remaining: 3 }]);
    const result = run(refreshed);
    expect(dots(result)).toBe(0);
    expect(result.result.enemyTeam[0]?.life).toBe(100_000);
    expect(input.statuses).toEqual([hold, old]);
  });

  it('settles exactly 10 damage before a 1000ms expiry preceding every action', () => {
    const r = run(unit('enemy', 'enemy', { statuses: [hold,
      status('poison', { dotPerStack: 10, expiresAtMs: 1000 })] }));
    expect(dots(r)).toBe(10);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'dot', amount: 10, simClockMs: 1000 }));
  });

  it('only integrates a real 1700ms application for 300ms through 2000ms', () => {
    const skill = register([{ kind: 'damage', damageType: 'poison', base: [10, 10],
      applyStatus: { id: 'poison', dotPctOfDamage: 1 } }]);
    const r = run(unit('enemy', 'enemy', { life: 1_000_000 }),
      unit('hero', 'player', { statuses: [], skillOrder: [skill] }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status', simClockMs: 1700 }));
    const at2000 = r.events.filter(e => e.kind === 'dot' && e.target === 'enemy' && e.simClockMs <= 2000);
    // A control-only expiry creates the explicit 2000ms boundary below.
    expect(at2000.reduce((s, e) => s + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(0);
    const withBoundary = run(unit('enemy', 'enemy', { life: 1_000_000,
      statuses: [hold, status('marker', { expiresAtMs: 2000 })] }),
    unit('hero', 'player', { statuses: [], skillOrder: [skill] }));
    expect(withBoundary.events).toContainEqual(expect.objectContaining({ kind: 'dot', amount: 3, simClockMs: 2000 }));
  });

  it.each([63, 263])('integrates exactly 50 over 5 seconds at AS%s', speed => {
    const e = unit('enemy', 'enemy');
    expect(dots(run({ ...e, stats: { ...e.stats, attackSpeed: speed }, statuses: [hold,
      status('poison', { dotPerStack: 10, expiresAtMs: 5000 })] }))).toBe(50);
  });

  it('pools half-DPS carry across statuses, expiry and a gap', () => {
    const r = run(unit('enemy', 'enemy', { statuses: [hold,
      status('poison', { dotPerStack: 0.5, expiresAtMs: 1000 }),
      status('ignite', { dotPerStack: 0.5, appliedAtMs: 2000, expiresAtMs: 3000 })] }));
    expect(dots(r)).toBe(1);
    expect(r.events.filter(e => e.kind === 'dot')).toEqual([
      expect.objectContaining({ target: 'enemy', amount: 1, simClockMs: 3000 })
    ]);
  });

  it('preserves one DPS split at ten 100ms boundaries and an unsplit interval', () => {
    const poison = status('poison', { dotPerStack: 1, expiresAtMs: 1000 });
    const split = Array.from({ length: 9 }, (_, i) => status(`marker-${String(i)}`, { expiresAtMs: (i + 1) * 100 }));
    expect(dots(run(unit('enemy', 'enemy', { statuses: [hold, poison, ...split] })))).toBe(1);
    expect(dots(run(unit('enemy', 'enemy', { statuses: [hold, poison] })))).toBe(1);
  });

  it.each([[2, 500], [3, 334]])('kills one HP at the first supported ms for %s DPS', (rate, at) => {
    const r = run(unit('enemy', 'enemy', { life: 1, statuses: [hold,
      status('bleed', { dotPerStack: rate, expiresAtMs: 2000 })] }));
    expect(r.events.filter(e => e.kind === 'action')).toHaveLength(0);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: at });
  });

  it('uses pooled carry in the earliest lethal candidate', () => {
    const r = run(unit('enemy', 'enemy', { life: 1, statuses: [hold,
      status('poison', { dotPerStack: 0.5, expiresAtMs: 1000 }),
      status('ignite', { dotPerStack: 0.5, appliedAtMs: 2000, expiresAtMs: 5000 })] }));
    expect(r.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 3000 });
  });

  it('keeps future control inactive, retains its record, and expires it before the next action', () => {
    const future = status('freeze', { appliedAtMs: 2000, expiresAtMs: 3000 });
    const e = unit('enemy', 'enemy', { statuses: [future] });
    const r = run(e);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', simClockMs: 1700 }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', simClockMs: 3400 }));
    const stop = run({ ...e, life: 1, statuses: [future,
      status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] });
    expect(stop.result.enemyTeam[0]?.statuses).toContainEqual(future);
  });

  it('makes future stun active at its start and inactive at its exact expiry', () => {
    const r = run(unit('enemy', 'enemy', { statuses: [status('stun', { appliedAtMs: 1700, expiresAtMs: 3400 })] }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'enemy', simClockMs: 1700 }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', simClockMs: 3400 }));
  });

  it('does not apply a future frozen combo before its start', () => {
    const r = run(unit('enemy', 'enemy', { statuses: [hold,
      status('freeze', { appliedAtMs: 2000, expiresAtMs: 3000 })] }),
    unit('hero', 'player', { statuses: [] }));
    expect(r.events.find(e => e.kind === 'damage' && e.target === 'enemy')).toMatchObject({ amount: 10, simClockMs: 1700 });
  });

  it('marks simultaneous hero/boss deaths before orbs and cannot rescue the hero', () => {
    const lethal = status('bleed', { dotPerStack: 2, expiresAtMs: 1000 });
    const merc = unit('merc', 'player', { kind: 'merc', life: 50 });
    const r = runBattleRecorded({ seed: 7,
      playerTeam: [unit('hero', 'player', { life: 1, statuses: [hold, lethal] }), merc],
      enemyTeam: [unit('boss', 'enemy', { tier: 'boss', life: 1, statuses: [hold, lethal] })] });
    expect(r.result.winner).toBe('enemy');
    expect(r.result.playerTeam[0]?.life).toBe(0);
    const phase = r.events.filter(e => ['dot', 'death', 'orb'].includes(e.kind));
    expect(phase.map(e => e.kind)).toEqual(['dot', 'dot', 'death', 'death', 'orb', 'orb']);
    expect(phase.every(e => e.simClockMs === 500)).toBe(true);
    expect(r.events.filter(e => e.kind === 'orb').every(e => e.target === 'merc')).toBe(true);
  });

  it('closes owner death and overlapping summon death once before effects', () => {
    const lethal = status('bleed', { dotPerStack: 2, expiresAtMs: 1000 });
    const owner = unit('owner', 'enemy', { life: 1, tier: 'boss', statuses: [hold, lethal],
      skillOrder: ['necromancer.raise_skeleton'] });
    const child = unit('child', 'enemy', { kind: 'summon', summonOwnerId: 'owner', life: 1, statuses: [hold, lethal] });
    const orphan = unit('orphan', 'enemy', { kind: 'summon', summonOwnerId: 'owner' });
    const r = run(owner, unit('hero', 'player'), [child, orphan]);
    expect(r.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['owner', 'child', 'orphan']);
    expect(r.result.enemyTeam.find(e => e.id === 'owner')?.mana).toBe(0);
    const firstOrb = r.events.findIndex(e => e.kind === 'orb');
    expect(r.events.map((e, i) => e.kind === 'death' ? i : -1).filter(i => i >= 0).every(i => i < firstOrb)).toBe(true);
  });

  it('spreads final-interval poison at expiry, replacing expired recipient stacks', () => {
    const source = unit('source', 'enemy', { life: 4, tier: 'boss', statuses: [hold,
      status('poison', { stacks: 4, dotPerStack: 1, expiresAtMs: 1000 })] });
    const recipient = unit('recipient', 'enemy', { statuses: [hold,
      status('poison', { stacks: 4, dotPerStack: 0, expiresAtMs: 1000 })] });
    const r = run(source, unit('hero', 'player'), [recipient]);
    const first = r.events.find(e => e.kind === 'dot' && e.target === 'recipient');
    expect(first).toMatchObject({ amount: 1, simClockMs: 1700 });
    expect(dots(r, 'recipient')).toBe(10);
    expect(r.result.enemyTeam.find(e => e.id === 'recipient')?.statuses.some(s => s.id === 'poison')).toBe(false);
  });

  it('does not spread a pending future poison source at death', () => {
    const r = run(unit('source', 'enemy', { life: 1, statuses: [hold,
      status('bleed', { dotPerStack: 2, expiresAtMs: 1000 }),
      status('poison', { dotPerStack: 10, appliedAtMs: 1000, expiresAtMs: 3000 })] }),
    unit('hero', 'player'), [unit('recipient', 'enemy')]);
    expect(dots(r, 'recipient')).toBe(0);
  });

  it('settles the old aggregate rate before an action stacks the status', () => {
    const skill = register([{ kind: 'damage', damageType: 'physical', base: [10, 10],
      applyStatus: { id: 'poison', dotPctOfDamage: 1 } }]);
    const r = run(unit('enemy', 'enemy', { statuses: [hold,
      status('poison', { dotPerStack: 10, expiresAtMs: 2000 })] }),
    unit('hero', 'player', { statuses: [], skillOrder: [skill] }));
    expect(r.events.filter(e => e.kind === 'dot' && e.simClockMs <= 2000).map(e => [e.simClockMs, e.kind === 'dot' ? e.amount : 0]))
      .toEqual([[1700, 17]]);
    // The active refresh extends expiry to 6700; its next interval uses two original-potency stacks.
    expect(r.events.find(e => e.kind === 'dot' && e.simClockMs > 1700)).toMatchObject({ amount: 34, simClockMs: 3400 });
  });

  it.each([['expired', 0, 1000], ['future', 3000, 4000]] as const)('replaces an inactive %s same-ID record as a fresh timed application', (_, start, end) => {
    const old = status('poison', { appliedAtMs: start, expiresAtMs: end, stacks: 4, dotPerStack: 99 });
    const pending = status('freeze', { appliedAtMs: 5000, expiresAtMs: 6000 });
    const u = unit('enemy', 'enemy', { statuses: [old, pending] });
    const result = applyStatus(u, { id: 'poison', sourceId: 'new', dotPerStack: 2, simClockMs: 1700 }, createRng(7));
    expect(result.statuses.find(s => s.id === 'poison')).toMatchObject({ stacks: 1, dotPerStack: 2,
      sourceId: 'new', appliedAtMs: 1700, expiresAtMs: 6700 });
    expect(result.statuses).toContainEqual(pending);
    expect(u.statuses).toEqual([old, pending]);
  });

  it('keeps active refresh potency/start/source and maximum expiry', () => {
    const old = status('poison', { appliedAtMs: 500, expiresAtMs: 10_000, stacks: 4, dotPerStack: 3 });
    const r = applyStatus(unit('enemy', 'enemy', { statuses: [old] }),
      { id: 'poison', sourceId: 'new', simClockMs: 1700, dotPerStack: 99 }, createRng(7));
    expect(r.statuses[0]).toMatchObject({ appliedAtMs: 500, expiresAtMs: 10_000, stacks: 5, dotPerStack: 3, sourceId: 'fixture' });
  });

  it('preserves indefinite expiry and battle-entry start on active legacy refresh', () => {
    const old = status('poison', { stacks: 4, dotPerStack: 3, remaining: 1 });
    const refreshed = applyStatus(unit('enemy', 'enemy', { statuses: [old] }),
      { id: 'poison', sourceId: 'new', simClockMs: 1700, dotPerStack: 99 }, createRng(7));
    expect(refreshed.statuses[0]).toMatchObject({ stacks: 5, dotPerStack: 3, sourceId: 'fixture' });
    expect(refreshed.statuses[0]?.expiresAtMs).toBeUndefined();
    expect(refreshed.statuses[0]?.appliedAtMs).toBeUndefined();
    expect(dots(run({ ...refreshed, statuses: [hold, ...refreshed.statuses] }))).toBe(900);
    const finite = { ...old, expiresAtMs: 3000 };
    const legacy = applyStatus(unit('enemy', 'enemy', { statuses: [finite] }),
      { id: 'poison', sourceId: 'legacy' }, createRng(7));
    expect(legacy.statuses[0]?.expiresAtMs).toBe(3000);
    expect(legacy.statuses[0]?.appliedAtMs).toBeUndefined();
  });

  it('gives inactive paralyze cooldown markers no diminishing-return roll', () => {
    for (const marker of [status('paralyze-cd', { expiresAtMs: 1000 }),
      status('paralyze-cd', { appliedAtMs: 3000, expiresAtMs: 4000 })]) {
      const rng = createRng(7);
      const control = createRng(7);
      const applied = applyStatus(unit('enemy', 'enemy', { statuses: [marker] }),
        { id: 'paralyze', sourceId: 'new', simClockMs: 1700 }, rng);
      expect(applied.statuses.find(s => s.id === 'paralyze')).toMatchObject({ appliedAtMs: 1700, expiresAtMs: 2700 });
      expect(rng.next()).toBe(control.next());
    }
  });

  it('pools simultaneous fractional rates and matches half-DPS split/unsplit totals', () => {
    const markers = Array.from({ length: 9 }, (_, i) => status(`marker-${String(i)}`, { expiresAtMs: (i + 1) * 100 }));
    const half = status('poison', { dotPerStack: 0.5, expiresAtMs: 2000 });
    expect(dots(run(unit('enemy', 'enemy', { statuses: [hold, half, ...markers] })))).toBe(1);
    expect(dots(run(unit('enemy', 'enemy', { statuses: [hold, half] })))).toBe(1);
    const r = run(unit('enemy', 'enemy', { life: 1, statuses: [hold,
      status('poison', { dotPerStack: 0.5, expiresAtMs: 2000 }),
      status('ignite', { dotPerStack: 0.5, expiresAtMs: 2000 })] }));
    expect(r.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1000 });
  });

  it('stamps finite spread at death without retroactive damage or dead recipients', () => {
    const source = unit('source', 'enemy', { life: 4, statuses: [hold,
      status('poison', { stacks: 4, dotPerStack: 1, expiresAtMs: 1000 })] });
    const recipient = unit('recipient', 'enemy', { statuses: [hold,
      status('poison', { stacks: 4, dotPerStack: 0, expiresAtMs: 1000 })] });
    const deadRecipient = unit('dead-recipient', 'enemy', { life: 1, statuses: [hold,
      status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] });
    const r = run(source, unit('hero', 'player', { life: 2, stats: { ...unit('fixture', 'player').stats, life: 2, lifeMax: 2 }, statuses: [hold,
      status('bleed', { dotPerStack: 1, expiresAtMs: 2000 })] }), [recipient, deadRecipient]);
    expect(r.result.enemyTeam.find(u => u.id === 'recipient')?.statuses.find(s => s.id === 'poison'))
      .toMatchObject({ stacks: 2, dotPerStack: 1, appliedAtMs: 1000, expiresAtMs: 6000, sourceId: 'source' });
    expect(r.result.enemyTeam.find(u => u.id === 'dead-recipient')?.statuses.some(s => s.id === 'poison')).toBe(false);
    expect(r.events.filter(e => e.kind === 'dot' && e.target === 'recipient').every(e => e.simClockMs > 1000)).toBe(true);
    expect(dots(r, 'recipient')).toBe(2);
  });

  it('refunds a living owner once when its summon is independently periodic-lethal', () => {
    const owner = unit('owner', 'enemy', { skillOrder: ['necromancer.raise_skeleton'] });
    const child = unit('child', 'enemy', { kind: 'summon', summonOwnerId: 'owner', life: 1,
      statuses: [hold, status('bleed', { dotPerStack: 2, expiresAtMs: 1000 })] });
    const r = run(owner, unit('hero', 'player', { life: 1,
      statuses: [hold, status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] }), [child]);
    expect(r.events.filter(e => e.kind === 'death' && e.target === 'child')).toHaveLength(1);
    expect(r.result.enemyTeam.find(u => u.id === 'owner')?.mana).toBe(15);
  });

  it('runs ordinary spread for an independently lethal orphan overlap, but never orphan-only spread', () => {
    const owner = unit('owner', 'enemy', { life: 1, statuses: [hold,
      status('bleed', { dotPerStack: 2, expiresAtMs: 1000 })] });
    const child = unit('child', 'enemy', { kind: 'summon', summonOwnerId: 'owner', life: 1,
      statuses: [hold, status('poison', { stacks: 2, dotPerStack: 1, expiresAtMs: 500 })] });
    const orphan = unit('orphan', 'enemy', { kind: 'summon', summonOwnerId: 'owner',
      statuses: [hold, status('poison', { stacks: 10, dotPerStack: 0.1, expiresAtMs: 5000 })] });
    const r = run(owner, unit('hero', 'player', { life: 1, stats: { ...unit('fixture', 'player').stats, life: 1, lifeMax: 1 },
      statuses: [hold, status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] }),
    [child, orphan, unit('recipient', 'enemy')]);
    expect(r.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['owner', 'child', 'orphan', 'hero']);
    expect(r.result.enemyTeam.find(u => u.id === 'recipient')?.statuses.find(s => s.id === 'poison'))
      .toMatchObject({ stacks: 1, dotPerStack: 1, appliedAtMs: 500, expiresAtMs: 5500, sourceId: 'child' });
  });

  it('closes reverse-insertion transitive orphans before effects, without orphan-only spread/refunds/actions', () => {
    const owner = unit('owner', 'enemy', { life: 1, tier: 'boss',
      skillOrder: ['necromancer.raise_skeleton'], statuses: [hold,
        status('bleed', { dotPerStack: 2, expiresAtMs: 1000 })] });
    const orphanPoison = status('poison', { stacks: 10, dotPerStack: 0.1, expiresAtMs: 5000 });
    const child = unit('child', 'enemy', { kind: 'summon', summonOwnerId: 'owner',
      skillOrder: ['necromancer.raise_skeleton'], statuses: [hold, orphanPoison] });
    const grandchild = unit('grandchild', 'enemy', { kind: 'summon', summonOwnerId: 'child',
      statuses: [hold, orphanPoison] });
    // A single forward pass sees both dependants before their dying ancestor.
    const r = runBattleRecorded({ seed: 7, playerTeam: [unit('hero', 'player')],
      enemyTeam: [grandchild, child, owner, unit('recipient', 'enemy')] });
    const deaths = r.events.filter(e => e.kind === 'death');
    expect(deaths.map(e => e.target)).toEqual(['grandchild', 'child', 'owner']);
    expect(deaths.every(e => e.simClockMs === 500)).toBe(true);
    const closed = new Set(['grandchild', 'child', 'owner']);
    for (const u of r.result.enemyTeam.filter(u => closed.has(u.id))) {
      expect(u.life).toBe(0);
      expect(u.mana).toBe(0);
    }
    expect(r.events.some(e => e.kind === 'action' && closed.has(e.actor))).toBe(false);
    expect(dots(r, 'recipient')).toBe(0);
    expect(r.result.enemyTeam.find(u => u.id === 'recipient')?.statuses.some(s => s.id === 'poison')).toBe(false);
    const orbs = r.events.filter(e => e.kind === 'orb');
    expect(orbs).toHaveLength(2); // Only the primary boss death drops HP/MP.
    const firstOrb = r.events.findIndex(e => e.kind === 'orb');
    expect(r.events.map((e, i) => e.kind === 'death' ? i : -1).filter(i => i >= 0).every(i => i < firstOrb)).toBe(true);
  });

  it('does not fabricate deadline settlement after the action safety cap', () => {
    const player = unit('hero', 'player');
    const enemies = Array.from({ length: 10 }, (_, i) => unit(`enemy-${String(i)}`, 'enemy', {
      stats: { ...player.stats, attackSpeed: 263 }, statuses: [hold,
        status('poison', { dotPerStack: 1, appliedAtMs: 50_000, expiresAtMs: 60_000 })]
    }));
    const r = runBattleRecorded({ seed: 7, playerTeam: [{ ...player, stats: { ...player.stats, attackSpeed: 263 } }], enemyTeam: enemies });
    expect(r.events.at(-1)?.simClockMs).toBeLessThan(50_000);
    expect(r.events.some(e => e.kind === 'dot')).toBe(false);
  });

  it('settles the final 500ms to the deadline even with no eligible next action', () => {
    const r = run(unit('enemy', 'enemy', { statuses: [hold,
      status('bleed', { dotPerStack: 2, appliedAtMs: 59_500, expiresAtMs: 60_000 })] }));
    expect(dots(r)).toBe(1);
    expect(r.events.at(-1)).toMatchObject({ winner: null, simClockMs: 60_000 });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'dot', amount: 1, simClockMs: 60_000 }));
  });

  it('resolves deadline periodic lethal before tied actions', () => {
    const player = unit('hero', 'player', { statuses: [] });
    const enemy = unit('enemy', 'enemy', { life: 1, statuses: [hold,
      status('bleed', { dotPerStack: 2, appliedAtMs: 59_500, expiresAtMs: 60_000 })] });
    const r = run({ ...enemy, stats: { ...enemy.stats, attackSpeed: 263 } },
      { ...player, statuses: [hold], stats: { ...player.stats, attackSpeed: 263 } });
    expect(r.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 60_000 });
    expect(r.events.filter(e => e.kind === 'action' && e.simClockMs === 60_000)).toHaveLength(0);
  });

  it('terminates expired/zero-rate records, preserves legacy indefinite duration and repeats immutable input', () => {
    const input = { seed: 7, playerTeam: [unit('hero', 'player')], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold,
      status('poison', { dotPerStack: 0.5, remaining: 1 }),
      status('zero', { dotPerStack: 0, expiresAtMs: 0 }),
      status('expired', { dotPerStack: 99, expiresAtMs: 0 })] })] };
    const before = structuredClone(input);
    const first = runBattleRecorded(input);
    expect(dots(first)).toBe(30);
    expect(first.events.at(-1)).toMatchObject({ simClockMs: 60_000 });
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    expect(input).toEqual(before);
  });
});
