import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { applyEventToTeams } from './combatPlayback';
import { runBattle, runBattleRecorded, type BattleEvent, type CombatSnapshot } from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 25,
  defense: 0, magicResist: 0,
  attackSpeed: 30,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mk(id: string, side: 'player' | 'enemy', overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id,
    name: id,
    side,
    level: 1,
    tier: 'trash',
    stats: baseStats,
    life: 100,
    mana: 50,
    statuses: [] as readonly ActiveStatus[],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...overrides
  };
}

describe('combatPlayback.applyEventToTeams', () => {
  it('subtracts life on damage', () => {
    const p = [mk('p1', 'player')];
    const e = [mk('e1', 'enemy')];
    const res = applyEventToTeams(p, e, {
      kind: 'damage',
      source: 'p1',
      target: 'e1',
      damageType: 'physical',
      amount: 30,
      crit: false,
      dodged: false
    });
    expect(res.enemyTeam[0]?.life).toBe(70);
    expect(res.playerTeam[0]?.life).toBe(100);
  });

  it('ignores damage when dodged', () => {
    const e = [mk('e1', 'enemy')];
    const res = applyEventToTeams([], e, {
      kind: 'damage',
      source: 'p1',
      target: 'e1',
      damageType: 'physical',
      amount: 999,
      crit: false,
      dodged: true
    });
    expect(res.enemyTeam[0]?.life).toBe(100);
  });

  it('clamps heal to lifeMax', () => {
    const p = [mk('p1', 'player', { life: 90 })];
    const res = applyEventToTeams(p, [], { kind: 'heal', target: 'p1', amount: 999 });
    expect(res.playerTeam[0]?.life).toBe(100);
  });

  it('death sets life to 0', () => {
    const e = [mk('e1', 'enemy', { life: 5 })];
    const res = applyEventToTeams([], e, { kind: 'death', target: 'e1' });
    expect(res.enemyTeam[0]?.life).toBe(0);
  });

  it('buff appends without duplicates', () => {
    const p = [mk('p1', 'player')];
    const r1 = applyEventToTeams(p, [], { kind: 'buff', target: 'p1', buffId: 'fortitude' });
    expect(r1.playerTeam[0]?.activeBuffIds).toEqual(['fortitude']);
    const r2 = applyEventToTeams(
      r1.playerTeam as CombatUnit[],
      [],
      { kind: 'buff', target: 'p1', buffId: 'fortitude' }
    );
    expect(r2.playerTeam[0]?.activeBuffIds).toEqual(['fortitude']);
  });

  it('keeps status events transient because playback lacks expiry snapshots', () => {
    const statuses: readonly ActiveStatus[] = [
      { id: 'poison', stacks: 1, remaining: 2, sourceId: 'p1' }
    ];
    const e = [mk('e1', 'enemy', { statuses })];
    const res = applyEventToTeams([], e, { kind: 'status', target: 'e1', statusId: 'burning' });
    expect(res.enemyTeam[0]?.statuses).toBe(statuses);
  });

  it('replaying all events ends with same final HP as runBattle', () => {
    const player = mk('p1', 'player', { stats: { ...baseStats, attack: 40, attackSpeed: 20 } });
    const enemy = mk('e1', 'enemy', {
      life: 25,
      stats: { ...baseStats, life: 25, lifeMax: 25, attackSpeed: 5 }
    });
    const { events, result } = runBattleRecorded({
      seed: 42,
      playerTeam: [player],
      enemyTeam: [enemy]
    });
    let teams: { playerTeam: readonly CombatUnit[]; enemyTeam: readonly CombatUnit[] } = {
      playerTeam: [player],
      enemyTeam: [enemy]
    };
    for (const ev of events) {
      teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, ev);
    }
    expect(teams.enemyTeam[0]?.life).toBe(result.enemyTeam[0]?.life);
    expect(teams.playerTeam[0]?.life).toBe(result.playerTeam[0]?.life);
  });
});

/** Imported engine fixtures isolate MP transport; no recovery rate is supplied. */
describe('authoritative absolute mana recording and playback', () => {
  beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
  afterEach(() => { resetRegistry(); loadDefaultSkills(); });

  const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', stacks: 1,
    remaining: -1, sourceId: 'fixture', appliedAtMs });
  const bleed = (rate: number): ActiveStatus => ({ id: 'bleed', stacks: 1,
    remaining: -1, sourceId: 'fixture', dotPerStack: rate, expiresAtMs: 1000 });
  function held(id: string, side: CombatUnit['side'], over: Partial<CombatUnit> = {}): CombatUnit {
    return mk(id, side, { kind: side === 'player' ? 'hero' : 'monster', level: 30,
      mana: 90, stats: { ...baseStats, mana: 100, manaMax: 100, attackSpeed: 100 },
      statuses: [hold()], ...over });
  }
  function spells(skill: string, mana: number, rank = 1, speed = 100): CombatSnapshot {
    return { seed: 7,
      playerTeam: [held('caster', 'player', { mana, skillOrder: [skill],
        skillLevels: { [skill]: rank }, statuses: [hold(speed === 263 ? 401 : 1701)],
        stats: { ...baseStats, mana: 100, manaMax: 100, attackSpeed: speed } })],
      enemyTeam: [held('target', 'enemy', { life: 500,
        stats: { ...baseStats, life: 500, lifeMax: 500, attackSpeed: 100 } })] };
  }
  function mpEvents(recorded: ReturnType<typeof runBattleRecorded>) {
    return recorded.events.filter(event => String(event.kind) === 'mana');
  }
  function stepped(input: CombatSnapshot, events: readonly BattleEvent[]) {
    let teams = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam };
    for (const event of events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
    return teams;
  }
  function expectRepeatable(input: CombatSnapshot, recorded: ReturnType<typeof runBattleRecorded>, before: CombatSnapshot) {
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(input).toEqual(before);
    const teams = stepped(input, recorded.events.filter(event => event.kind !== 'end'));
    for (const side of ['playerTeam', 'enemyTeam'] as const) {
      expect(teams[side].map(unit => [unit.id, unit.mana]))
        .toEqual(recorded.result[side].map(unit => [unit.id, unit.mana]));
    }
  }

  it.each([
    ['skills-sorceress-fire-bolt', 1, 8, 100, 1700],
    ['skills-necromancer-amplify-damage', 20, 11, 263, 400]
  ] as const)('records actual %s rank %s cost and steps MP before the final snap', (skill, rank, mana, speed, at) => {
    const input = spells(skill, mana, rank, speed);
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect.soft(mpEvents(recorded)).toEqual([
      { kind: 'mana', target: 'caster', mana: 0, reason: 'cast', simClockMs: at, uiDelayMs: 50 }
    ]);
    const action = recorded.events.findIndex(event => event.kind === 'action' && event.actor === 'caster');
    expect(recorded.events[action]).toMatchObject({ skillId: skill === 'skills-sorceress-fire-bolt'
      ? 'sorceress.fire_bolt' : 'necromancer.amplify_damage', simClockMs: at });
    expect.soft(recorded.events[action + 1]).toMatchObject({ kind: 'mana', target: 'caster', mana: 0 });
    expect.soft(stepped(input, recorded.events.slice(0, action + 2)).playerTeam[0]?.mana).toBe(0);
    expectRepeatable(input, recorded, before);
  });

  it('records initial actual Raise Skeleton spending before its spawn without inventing newborn recovery', () => {
    const input = spells('necromancer.raise_skeleton', 15);
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect.soft(mpEvents(recorded)).toEqual([
      { kind: 'mana', target: 'caster', mana: 0, reason: 'cast', simClockMs: 0, uiDelayMs: 50 }
    ]);
    const action = recorded.events.findIndex(event => event.kind === 'action' && event.actor === 'caster');
    expect.soft(recorded.events.slice(action, action + 3).map(event => event.kind))
      .toEqual(['action', 'mana', 'summon']);
    expectRepeatable(input, recorded, before);
  });

  it.each([0, -5])('does not emit a change for normalized zero cost %s', manaCost => {
    registerSkill({ id: 'fixture.free', archetype: 'fixture', trigger: 'active', target: 'self',
      cooldown: 100, manaCost, minLevel: 1, effects: [{ kind: 'buff', id: 'fixture.free', duration: -1 }] });
    const input = spells('fixture.free', 10);
    const recorded = runBattleRecorded(input);
    expect(recorded.events.some(event => event.kind === 'action' && event.skillId === 'fixture.free')).toBe(true);
    expect(mpEvents(recorded)).toEqual([]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(10);
  });

  it('preserves fractional carry when a cast spends from full MP below cap', () => {
    const base = spells('skills-sorceress-fire-bolt', 100);
    const input = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      manaRegenCarry: 0.75, manaRegenCompensation: 0.125 })) };
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect.soft(mpEvents(recorded)).toEqual([
      { kind: 'mana', target: 'caster', mana: 92, reason: 'cast', simClockMs: 1700, uiDelayMs: 50 }
    ]);
    const caster = recorded.result.playerTeam[0];
    expect([caster?.mana, caster?.manaRegenCarry, caster?.manaRegenCompensation])
      .toEqual([92, 0.75, 0.125]);
    expectRepeatable(input, recorded, before);
  });

  it('clears existing carry for a zero-cost cast at cap without adding legacy fields', () => {
    registerSkill({ id: 'fixture.free', archetype: 'fixture', trigger: 'active', target: 'self',
      cooldown: 100, manaCost: 0, minLevel: 1, effects: [{ kind: 'buff', id: 'fixture.free', duration: -1 }] });
    const base = spells('fixture.free', 100);
    const input = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      manaRegenCarry: 0.75, manaRegenCompensation: 0.125 })) };
    const recorded = runBattleRecorded(input);
    expect(recorded.events.some(event => event.kind === 'action' && event.skillId === 'fixture.free')).toBe(true);
    expect(mpEvents(recorded)).toEqual([]);
    const caster = recorded.result.playerTeam[0];
    expect.soft([caster?.mana, caster?.manaRegenCarry, caster?.manaRegenCompensation]).toEqual([100, 0, 0]);
    const legacy = runBattleRecorded(base).result.playerTeam[0];
    expect(legacy).not.toHaveProperty('manaRegenCarry');
    expect(legacy).not.toHaveProperty('manaRegenCompensation');
  });

  it('does not spend MP for an unaffordable actual skill', () => {
    const recorded = runBattleRecorded(spells('skills-sorceress-fire-bolt', 7));
    expect(recorded.events.find(event => event.kind === 'action' && event.actor === 'caster'))
      .toMatchObject({ skillId: null });
    expect(mpEvents(recorded)).toEqual([]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(7);
  });

  function refund(mana: number, deadOwner = false, carry = false, side: CombatUnit['side'] = 'enemy'): CombatSnapshot {
    // Explicit legacy control: canonical Skeleton preparation has no death refund.
    const skeleton = getSkill('necromancer.raise_skeleton');
    if (!skeleton) throw new Error('Missing actual Skeleton source');
    registerSkill({ ...skeleton, id: 'fixture.legacy-refund-skeleton', archetype: 'fixture' });
    const owner = held('owner', side, { mana, skillOrder: ['fixture.legacy-refund-skeleton'],
      ...(carry ? { manaRegenCarry: 0.75, manaRegenCompensation: 0.125 } : {}),
      ...(deadOwner ? { life: 1, statuses: [hold(), bleed(2)] } : {}) });
    const child = held('child', side, { kind: 'summon', summonOwnerId: 'owner',
      summonTemplateId: 'skeleton', life: 1, statuses: [hold(), bleed(2)] });
    // Friendly positive controls keep the opponent alive and inert: no terminal orb can
    // mask a missing refund or clear carry. Hostile/dead-owner controls keep their old scene.
    return side === 'player'
      ? { seed: 7, playerTeam: [owner, child], enemyTeam: [held('sentinel', 'enemy')] }
      : { seed: 7, playerTeam: [held('hero', 'player', { life: 1, statuses: [hold(), bleed(1)] })],
          enemyTeam: [owner, child] };
  }

  it.each([[0, 15], [98, 100]] as const)('records a living owner refund %s→%s after summon death', (mana, expected) => {
    const input = refund(mana, false, true, 'player');
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect.soft(mpEvents(recorded)).toEqual([
      { kind: 'mana', target: 'owner', mana: expected, reason: 'summon-refund', simClockMs: 500, uiDelayMs: 50 }
    ]);
    const death = recorded.events.findIndex(event => event.kind === 'death' && event.target === 'child');
    expect.soft(recorded.events[death + 1]).toMatchObject({ kind: 'mana', target: 'owner', mana: expected });
    const owner = recorded.result.playerTeam.find(unit => unit.id === 'owner');
    expect.soft([owner?.manaRegenCarry, owner?.manaRegenCompensation])
      .toEqual(expected === 100 ? [0, 0] : [0.75, 0.125]);
    expectRepeatable(input, recorded, before);
  });

  it('clears carry on a full refund without a fake MP event and preserves absent carry shape', () => {
    const full = runBattleRecorded(refund(100, false, true, 'player'));
    expect(mpEvents(full)).toEqual([]);
    const owner = full.result.playerTeam.find(unit => unit.id === 'owner');
    expect.soft([owner?.mana, owner?.manaRegenCarry, owner?.manaRegenCompensation]).toEqual([100, 0, 0]);
    const legacy = runBattleRecorded(refund(100, false, false, 'player')).result.playerTeam.find(unit => unit.id === 'owner');
    expect(legacy).not.toHaveProperty('manaRegenCarry');
    expect(legacy).not.toHaveProperty('manaRegenCompensation');
  });

  it.each([0, 98, 100])('does not refund hostile summon death at MP%s or reset its carry', mana => {
    const recorded = runBattleRecorded(refund(mana, false, true));
    expect(recorded.events.some(event => event.kind === 'death' && event.target === 'child')).toBe(true);
    expect(mpEvents(recorded)).toEqual([]);
    const owner = recorded.result.enemyTeam.find(unit => unit.id === 'owner');
    expect([owner?.mana, owner?.manaRegenCarry, owner?.manaRegenCompensation]).toEqual([mana, .75, .125]);
  });

  it('cannot refund an owner in the simultaneous periodic death set', () => {
    const recorded = runBattleRecorded(refund(0, true));
    expect(recorded.result.enemyTeam.find(unit => unit.id === 'owner')?.life).toBe(0);
    expect(recorded.result.enemyTeam.find(unit => unit.id === 'owner')?.mana).toBe(0);
    // The dead enemy owner still drops ordinary seed7 orbs for the living hero.
    expect(mpEvents(recorded)).toEqual([
      { kind: 'mana', target: 'hero', mana: 95, reason: 'orb', simClockMs: 500, uiDelayMs: 50 }
    ]);
    expect(recorded.events.filter(event => event.kind === 'mana' &&
      (event.target === 'owner' || event.reason === 'summon-refund'))).toEqual([]);
  });

  function orb(mana: number, max = 100): CombatSnapshot {
    const hero = held('hero', 'player', { mana, life: 90,
      manaRegenCarry: 0.75, manaRegenCompensation: 0.125,
      stats: { ...baseStats, mana: max, manaMax: max, attackSpeed: 100 } });
    return { seed: 7, playerTeam: [hero, { ...hero, id: 'merc', name: 'merc', kind: 'merc' }],
      enemyTeam: [held('boss', 'enemy', { tier: 'boss', life: 1, statuses: [hold(), bleed(2)] })] };
  }

  it.each([[90, 95], [98, 100]] as const)('records orb restoration %s→%s after the unchanged cue batch', (mana, expected) => {
    const input = orb(mana);
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    const death = recorded.events.findIndex(event => event.kind === 'death');
    expect.soft(recorded.events.slice(death + 1).map(event => [event.kind,
      'target' in event ? event.target : null, event.kind === 'orb' ? event.orb.kind : null]))
      .toEqual([['orb', 'hero', 'hp'], ['orb', 'merc', 'hp'], ['orb', 'hero', 'mp'], ['orb', 'merc', 'mp'],
        ['mana', 'hero', null], ['mana', 'merc', null], ['end', null, null]]);
    expect.soft(mpEvents(recorded)).toEqual(['hero', 'merc'].map(target => ({ kind: 'mana', target,
      mana: expected, reason: 'orb', simClockMs: 500, uiDelayMs: 50 })));
    expect(recorded.result.playerTeam.map(unit => unit.life)).toEqual([95, 95]);
    expect.soft(recorded.result.playerTeam.map(unit => [unit.manaRegenCarry, unit.manaRegenCompensation]))
      .toEqual(expected === 100 ? [[0, 0], [0, 0]] : [[0.75, 0.125], [0.75, 0.125]]);
    expectRepeatable(input, recorded, before);
  });

  it.each([[100, 100], [5, 19]] as const)('omits unchanged orb MP events for MP%s/max%s', (mana, max) => {
    const input = orb(mana, max);
    const recorded = runBattleRecorded(input);
    expect(recorded.events.filter(event => event.kind === 'orb')).toHaveLength(4);
    expect(mpEvents(recorded)).toEqual([]);
    expect.soft(recorded.result.playerTeam.map(unit => [unit.mana, unit.manaRegenCarry, unit.manaRegenCompensation]))
      .toEqual(mana === max ? [[mana, 0, 0], [mana, 0, 0]] : [[mana, 0.75, 0.125], [mana, 0.75, 0.125]]);
  });

  it.each(['player', 'enemy'] as const)('sets trusted absolute %s MP including zero, idempotently and immutably', side => {
    const unit = held('recipient', side, { mana: 40, stats: { ...baseStats, manaMax: 2 } });
    const input = { playerTeam: side === 'player' ? [unit] : [], enemyTeam: side === 'enemy' ? [unit] : [] };
    const before = structuredClone(input);
    for (const mana of [73, 0]) {
      const event: BattleEvent = { kind: 'mana', target: 'recipient', mana, reason: 'regeneration' };
      const once = applyEventToTeams(input.playerTeam, input.enemyTeam, event);
      const twice = applyEventToTeams(once.playerTeam, once.enemyTeam, event);
      expect.soft(twice[side === 'player' ? 'playerTeam' : 'enemyTeam'][0]?.mana).toBe(mana);
      expect(twice).toEqual(once);
      expect(input).toEqual(before);
    }
  });

  it('ignores an absent absolute-mana target without creating a unit', () => {
    const hero = held('hero', 'player');
    const result = applyEventToTeams([hero], [], { kind: 'mana', target: 'unknown', mana: 0, reason: 'cast' });
    expect(result).toEqual({ playerTeam: [hero], enemyTeam: [] });
    expect(result.playerTeam[0]).toBe(hero);
  });
});
