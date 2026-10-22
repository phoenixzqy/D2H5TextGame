import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composePoisonExplosion } from '../skills/poison-explosion';
import type { SkillEffect } from '../skills/effects';

// Structural view permits a genuine collected RED before the production union exists.
interface Observation {
  readonly kind: 'status-state'; readonly target: string;
  readonly statuses: readonly ActiveStatus[]; readonly initial?: true; readonly simClockMs: number;
}
function views(events: readonly { readonly kind: string }[]): Observation[] {
  return events.filter((event): event is Observation => event.kind === 'status-state');
}
function status(id: string, extra: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, ...extra };
}
function unit(id: string, side: 'player' | 'enemy', extra: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 18, tier: 'trash',
    life: 100_000, mana: 15, stats: { life: 100_000, lifeMax: 100_000, mana: 15, manaMax: 15,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [status('stun')], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...extra };
}
function snapshot(hero = unit('hero', 'player'), enemy = unit('target', 'enemy')): CombatSnapshot {
  return { seed: 1, playerTeam: [hero], enemyTeam: [enemy] };
}
function skill(effects: readonly SkillEffect[], startup = false): string {
  const id = 'fixture.lifecycle';
  registerSkill({ id, archetype: 'fixture', target: startup ? 'self' : 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 0, effects, ...(startup ? { summonOnStart: true } : {}) });
  return id;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D04 authoritative engine status lifecycle', () => {
  it('prefixes the effective Map roster in registration order, including overwritten IDs and dead-empty views', () => {
    const duplicate = status('burn', { dotPerStack: 0, tags: ['fire'], appliedAtMs: -1 });
    const hero = unit('hero', 'player', { statuses: [status('stun'), duplicate, { ...duplicate },
      status('future', { appliedAtMs: 1000 }), status('expired', { expiresAtMs: 0 })] });
    const dead = unit('dead', 'enemy', { life: 0 });
    const replacement = unit('same', 'enemy', { statuses: [] });
    const input = { seed: 1, playerTeam: [hero, unit('same', 'player')], enemyTeam: [dead, replacement] };
    const out = runBattleRecorded(input), initial = views(out.events).filter(e => e.initial);
    expect(initial.map(e => [e.target, e.simClockMs, e.statuses])).toEqual([
      ['hero', 0, hero.statuses.slice(0, 3)], ['same', 0, []], ['dead', 0, []]
    ]);
    expect(out.events.slice(0, 3)).toEqual(initial);
    expect(out.events[3]).toMatchObject({ kind: 'turn-start', simClockMs: 0 });
    expect(initial[0]?.statuses[1]).not.toBe(duplicate);
    expect(initial[0]?.statuses[1]?.tags).not.toBe(duplicate.tags);
    expect(initial[0]?.statuses[1]).not.toBe(initial[0]?.statuses[2]);
  });

  it('observes fresh production Poison at1700 and exact6700 expiry on the same living unrefreshed target', () => {
    const pe = 'necromancer.poison_explosion';
    const projection = composePoisonExplosion({ id: 'hero', class: 'necromancer', level: 18,
      skillLevels: { [pe]: 1, 'necromancer.poison_dagger': 1 } });
    if (!projection) throw new Error('Missing production PE authority');
    const input: CombatSnapshot = { seed: 1,
      playerTeam: [unit('hero', 'player', { statuses: [status('stun', { appliedAtMs: 1701 })],
        skillOrder: [pe], skillLevels: { [pe]: 1 } })],
      enemyTeam: [unit('body', 'enemy', { life: 1, statuses: [status('stun'),
        status('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] }),
      unit('target', 'enemy', { life: 1000, statuses: [status('stun'), status('marker', { expiresAtMs: 2000 })] })],
      poisonExplosion: [projection] };
    const out = runBattleRecorded(input), target = views(out.events).filter(e => e.target === 'target');
    expect(out.events.filter(e => e.kind === 'damage' && e.target === 'target'))
      .toEqual([expect.objectContaining({ amount: 60, simClockMs: 1700, damageType: 'poison' })]);
    expect(out.events.flatMap(e => e.kind === 'dot' && e.target === 'target' ? [[e.simClockMs, e.amount]] : []))
      .toEqual([[3400, 5], [5100, 5], [6700, 5]]);
    expect(out.result.enemyTeam.find(u => u.id === 'target')?.life).toBe(925);
    expect(target.map(e => [e.simClockMs, e.statuses.map(s => s.id)])).toEqual([
      [0, ['stun', 'marker']], [1700, ['stun', 'marker', 'poison']], [2000, ['stun', 'poison']], [6700, ['stun']]
    ]);
    expect(target[1]?.statuses[2]).toEqual({ id: 'poison', stacks: 1, remaining: 5, sourceId: 'hero',
      appliedAtMs: 1700, expiresAtMs: 6700, dotPerStack: 3, damageType: 'poison' });
    const removed = out.events.indexOf(target[3] as typeof out.events[number]);
    expect(out.events.slice(0, removed).at(-1)).toMatchObject({ kind: 'dot', target: 'target', amount: 5, simClockMs: 6700 });
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toEqual([]);
  });

  it('observes fractional future and expiry boundaries without inventing gameplay at those instants', () => {
    const marker = status('future', { appliedAtMs: 1300.25, expiresAtMs: 1400.5 });
    const out = runBattleRecorded(snapshot(undefined, unit('target', 'enemy', { statuses: [status('stun'), marker] })));
    expect(views(out.events).filter(e => e.target === 'target').map(e => [e.simClockMs, e.statuses]))
      .toEqual([[0, [status('stun')]], [1300.25, [status('stun'), marker]], [1400.5, [status('stun')]]]);
    expect(out.events.filter(e => e.simClockMs === 1300.25 || e.simClockMs === 1400.5)).toHaveLength(2);
    expect(out.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 60000 });
  });

  it('retains two same-time writes after their cues and suppresses unchanged capped indefinite refreshes', () => {
    const id = skill([{ kind: 'damage', damageType: 'thorns', base: [1, 1],
      applyStatuses: [{ id: 'poison' }, { id: 'poison' }] }]);
    const input = snapshot(unit('hero', 'player', { statuses: [], skillOrder: [id] }),
      unit('target', 'enemy', { statuses: [status('stun'), status('poison', { stacks: 8, remaining: 5,
        dotPerStack: 0, tags: ['fire', 'poison'], appliedAtMs: -100 })] }));
    const out = runBattleRecorded(input), target = views(out.events).filter(e => e.target === 'target');
    expect(target.map(e => [e.simClockMs, e.statuses.at(-1)?.stacks])).toEqual([[0, 8], [1700, 9], [1700, 10]]);
    for (const event of target.slice(1)) {
      expect(out.events[out.events.findIndex(e => Object.is(e, event)) - 1])
        .toMatchObject({ kind: 'status', target: 'target', statusId: 'poison', simClockMs: 1700 });
    }
    expect(out.events.filter(e => e.kind === 'status')).toHaveLength(58);
    expect(out.events.filter(e => e.kind === 'damage' && !e.dodged)).toHaveLength(29);
    expect(target[1]?.statuses.at(-1)).toMatchObject({ sourceId: 'fixture', appliedAtMs: -100,
      remaining: 5, dotPerStack: 0, tags: ['fire', 'poison'] });
    expect(target[1]?.statuses.at(-1)?.tags).not.toBe(target[2]?.statuses.at(-1)?.tags);
  });

  it('copies marker promotion and finite extension while retaining the first valid rate/source/start', () => {
    const id = 'fixture.promote', extend = skill([{ kind: 'debuff', statusId: 'poison' }]);
    registerSkill({ id, archetype: 'fixture', target: 'all-enemies', minLevel: 1, manaCost: 0, cooldown: 100,
      effects: [{ kind: 'damage', damageType: 'thorns', base: [10, 10],
        applyStatus: { id: 'poison', dotPctOfDamage: 0.5 } }] });
    const input = snapshot(unit('hero', 'player', { statuses: [status('stun', { appliedAtMs: 3401 })], skillOrder: [id, extend] }),
      unit('target', 'enemy', { statuses: [status('stun'), status('poison', {
        appliedAtMs: -20, expiresAtMs: 4000, dotPerStack: 0, stacks: 9 })] }));
    const out = runBattleRecorded(input), target = views(out.events).filter(e => e.target === 'target');
    expect(target.slice(0, 3).map(e => [e.simClockMs, e.statuses.at(-1)])).toEqual([
      [0, input.enemyTeam[0]?.statuses[1]],
      [1700, status('poison', { sourceId: 'hero', stacks: 10, remaining: 5,
        appliedAtMs: -20, expiresAtMs: 6700, dotPerStack: 5, damageType: 'thorns' })],
      [3400, status('poison', { sourceId: 'hero', stacks: 10, remaining: 5,
        appliedAtMs: -20, expiresAtMs: 8400, dotPerStack: 5, damageType: 'thorns' })]
    ]);
    expect(target.at(-1)).toMatchObject({ simClockMs: 8400, statuses: [status('stun')] });
  });

  it.each([false, true])('observes a new empty summon after its registration cue (startup=%s)', startup => {
    const id = skill([{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }], startup);
    const out = runBattleRecorded(snapshot(unit('hero', 'player', { statuses: [], skillOrder: [id] })));
    const spawn = out.events.findIndex(e => e.kind === 'summon');
    const event = out.events[spawn];
    expect(event).toMatchObject({ kind: 'summon', simClockMs: startup ? 0 : 1700 });
    if (event?.kind !== 'summon') throw new Error('Expected real registered summon');
    expect(out.events[spawn + 1]).toMatchObject({ kind: 'status-state', target: event.unit.id, statuses: [] });
    expect(views(out.events).filter(e => e.target === event.unit.id && e.initial)).toEqual([]);
  });

  it('keeps lethal on-hit Poison raw for spread while publishing only empty corpse and orphan views', () => {
    const id = skill([{ kind: 'damage', damageType: 'poison', base: [10, 10],
      applyStatus: { id: 'poison', dotPctOfDamage: 0.5 } }]);
    const input: CombatSnapshot = { seed: 1,
      playerTeam: [unit('hero', 'player', { statuses: [status('stun', { appliedAtMs: 1701 })], skillOrder: [id] })],
      enemyTeam: [unit('dying', 'enemy', { life: 1 }), unit('child', 'enemy', { summonOwnerId: 'dying' }),
        unit('target', 'enemy')] };
    const out = runBattleRecorded(input), all = views(out.events);
    expect(all.filter(e => ['dying', 'child'].includes(e.target) && !e.initial)
      .map(e => [e.target, e.statuses])).toEqual([['dying', []], ['child', []]]);
    expect(out.result.enemyTeam.find(u => u.id === 'dying')?.statuses.at(-1)).toMatchObject({ id: 'poison', stacks: 1 });
    const spread = all.find(e => e.target === 'target' && e.simClockMs === 1700 && e.statuses.at(-1)?.stacks === 1);
    expect(spread?.statuses.at(-1)).toMatchObject({ id: 'poison', sourceId: 'dying', dotPerStack: 5 });
    expect(out.events.findIndex(e => Object.is(e, spread))).toBeLessThan(
      out.events.findIndex(e => e.kind === 'damage' && e.target === 'target'));
    const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'child');
    expect(out.events[death - 1]).toMatchObject({ kind: 'status-state', target: 'child', statuses: [] });
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['dying', 'child']);
  });

  it('observes Frozen Armor retaliation after its existing Chill cue', () => {
    const id = skill([{ kind: 'damage', damageType: 'physical', base: [10, 10] }]);
    const out = runBattleRecorded(snapshot(unit('hero', 'player', { activeBuffIds: ['frozen-armor'],
      frozenArmor: { rank: 1, defensePct: 0.03 } }), unit('target', 'enemy', {
      skillOrder: [id], statuses: [status('stun', { appliedAtMs: 1701 })] })));
    const cue = out.events.findIndex(e => e.kind === 'status' && e.statusId === 'chill');
    expect(cue).toBeGreaterThan(-1);
    expect(out.events[cue + 1]).toMatchObject({ kind: 'status-state', target: 'target', simClockMs: 1700,
      statuses: [expect.objectContaining({ id: 'chill', sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: 3700 })] });
  });

  it('settles final-interval spread after all primary and orphan clears without altering the death tail', () => {
    const poison = status('poison', { dotPerStack: 1, expiresAtMs: 1000 });
    const out = runBattleRecorded({ seed: 1, playerTeam: [unit('hero', 'player')], enemyTeam: [
      unit('a', 'enemy', { life: 1, statuses: [poison] }), unit('child', 'enemy', { summonOwnerId: 'a' }),
      unit('b', 'enemy', { life: 1, statuses: [poison] }), unit('target', 'enemy') ] });
    expect(out.events.filter(e => e.kind === 'death').map(e => [e.target, e.simClockMs]))
      .toEqual([['a', 1000], ['child', 1000], ['b', 1000]]);
    expect(views(out.events).filter(e => !e.initial && e.simClockMs === 1000)
      .map(e => [e.target, e.statuses.at(-1)?.stacks])).toEqual([
        ['a', undefined], ['child', undefined], ['b', undefined], ['target', 1], ['target', 2] ]);
    expect(out.result.enemyTeam.find(u => u.id === 'a')?.statuses).toEqual([poison]);
  });

  it('copies every present optional field and isolates events, inputs, outcomes and repeated runs', () => {
    const payload = status('amp-damage', { appliedAtMs: -3, dotPerStack: 0,
      remaining: NaN, physicalResistReductionPct: Infinity, tags: ['cold', 'fire', 'cold'] });
    // Legacy runtime input can own undefined optional fields despite strict TS callers.
    expect(Reflect.set(payload, 'expiresAtMs', undefined)).toBe(true);
    expect(Reflect.set(payload, 'damageType', undefined)).toBe(true);
    const input = snapshot(unit('hero', 'player', { statuses: [status('stun'), payload,
      status('marker', { expiresAtMs: 500 })] }));
    const before = structuredClone(input), out = runBattleRecorded(input), expected = structuredClone(out);
    expect(runBattle(input)).toEqual(out.result);
    expect(runBattleRecorded(input)).toEqual(out);
    runBattleRecorded({ ...input, seed: 19 });
    expect(runBattleRecorded(input)).toEqual(out);
    expect(input).toEqual(before);
    const initial = views(out.events)[0], later = views(out.events).find(e => e.target === 'hero' && !e.initial);
    expect(initial?.statuses[1]).toEqual(payload);
    expect(Object.keys(initial?.statuses[1] ?? {})).toEqual(Object.keys(payload));
    expect(later?.statuses[1]).not.toBe(initial?.statuses[1]);
    const tags = initial?.statuses[1]?.tags;
    if (!tags || !later) throw new Error('Expected copied optional tags and later expiry');
    // Simulate an external consumer that disregards the readonly contract.
    Reflect.set(tags, 0, 'poison');
    Reflect.set(initial.statuses[1] ?? {}, 'sourceId', 'consumer');
    expect(later).toEqual(views(expected.events).find(e => e.target === 'hero' && !e.initial));
    expect(out.result.playerTeam).toEqual(expected.result.playerTeam);
    expect(out.result.enemyTeam).toEqual(expected.result.enemyTeam);
    expect(out.result.winner).toEqual(expected.result.winner);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(expected);
  });

  it('keeps end last for immediate victory and never fabricates a later status boundary', () => {
    const input = snapshot(unit('hero', 'player', { statuses: [status('marker', { expiresAtMs: 1000 })] }),
      unit('target', 'enemy', { life: 0 }));
    const out = runBattleRecorded(input);
    expect(views(out.events).map(e => [e.target, e.simClockMs, e.initial])).toEqual([
      ['hero', 0, true], ['target', 0, true] ]);
    expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 0 });
  });

  it('settles deadline expiry before end but leaves future statuses untouched at the action cap', () => {
    const deadline = runBattleRecorded(snapshot(undefined, unit('target', 'enemy', {
      statuses: [status('stun'), status('marker', { expiresAtMs: 60000 })] })));
    expect(views(deadline.events).at(-1)).toMatchObject({ target: 'target', simClockMs: 60000,
      statuses: [status('stun')] });
    const fast = unit('hero', 'player');
    const crowd = Array.from({ length: 8 }, (_, i) => unit(`enemy-${String(i)}`, 'enemy', {
      stats: { ...fast.stats, attackSpeed: 263 },
      statuses: [status('stun'), status('marker', { expiresAtMs: 50000 })] }));
    const capped = runBattleRecorded({ seed: 1, playerTeam: [{ ...fast, stats: { ...fast.stats, attackSpeed: 263 } }], enemyTeam: crowd });
    expect(capped.events.filter(e => e.kind === 'stunned')).toHaveLength(1000);
    expect(capped.events.at(-1)?.simClockMs).toBeLessThan(50000);
    expect(views(capped.events)).toHaveLength(9);
    expect(capped.events.at(-1)?.kind).toBe('end');
  });
});
