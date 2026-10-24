import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { CombatUnit } from './types';

function unit(id: string, side: CombatUnit['side'], speed = 100): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 25, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 10, defense: 0,
      magicResist: 0, attackSpeed: speed, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function source(): CombatUnit & { readonly holyFreezeAura: true } {
  return { ...unit('merc-source', 'player'), kind: 'merc', holyFreezeAura: true,
    statuses: [{ id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 }] };
}
function snapshot(merc: CombatUnit = source(), target = unit('target', 'enemy')): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'),
    statuses: [{ id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 }] }, merc], enemyTeam: [target] };
}
function replay(input: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone(input), recorded = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(recorded.result);
  expect(runBattleRecorded(input)).toEqual(recorded);
  return recorded;
}
function actions(result: RecordedBattleResult, id = 'target') {
  return result.events.filter(e => e.kind === 'action' && e.actor === id).map(e => e.simClockMs);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('living fielded mercenary Holy Freeze', () => {
  it('applies continuous Chill at entry without an aura cast or stat mutation', () => {
    const input = snapshot(), r = replay(input);
    expect(actions(r).slice(0, 3)).toEqual([2000, 4000, 6000]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', initial: true,
      statuses: [expect.objectContaining({ id: 'chill', sourceId: 'merc-source' })] }));
    expect(r.events.some(e => e.kind === 'action' && e.skillId === 'aura-holy-freeze')).toBe(false);
    expect(r.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
    expect(r.result.enemyTeam[0]?.statuses).toEqual([]);
  });
  it('does not stack its Chill with ordinary timed Chill or another source', () => {
    const target = { ...unit('target', 'enemy', 200), statuses: [
      { id: 'chill', stacks: 1, sourceId: 'spell', remaining: -1, appliedAtMs: 0, expiresAtMs: 2500 }] };
    const input = snapshot(source(), target), other = { ...source(), id: 'merc-other' };
    const r = replay({ ...input, playerTeam: [...input.playerTeam, other] });
    expect(actions(r).slice(0, 3)).toEqual([1700, 3400, 5100]);
    expect(r.events.filter(e => e.kind === 'status-state' && e.target === 'target')
      .every(e => e.kind === 'status-state' && e.statuses.filter(s => s.id === 'chill').length === 1)).toBe(true);
  });
  it('withdraws the aura at source death, preserving pending action progress and a timed Chill', () => {
    const merc = { ...source(), life: 1, statuses: [{ id: 'poison', stacks: 1, sourceId: 'fixture', remaining: -1, dotPerStack: 1 }] };
    const r = replay(snapshot(merc));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc-source', simClockMs: 1000 }));
    expect(actions(r).slice(0, 2)).toEqual([1850, 3550]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', statuses: [], simClockMs: 1000 }));
    const target = { ...unit('target', 'enemy'), statuses: [
      { id: 'chill', stacks: 1, sourceId: 'spell', remaining: -1, appliedAtMs: 0, expiresAtMs: 3000 }] };
    const retained = replay(snapshot(merc, target));
    expect(actions(retained).slice(0, 2)).toEqual([2000, 3850]);
    expect(retained.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target',
      statuses: [], simClockMs: 3000 }));
  });
  it.each(['stun', 'freeze'])('keeps the presence aura active while its living source is %s', id => {
    const merc = { ...source(), statuses: [{ id, sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    expect(actions(replay(snapshot(merc)))[0]).toBe(2000);
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'fixture' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { level: 0 }
  ])('refuses an ineligible aura source %j', patch => {
    expect(actions(replay(snapshot({ ...source(), ...patch })))[0]).toBe(1700);
  });
  it('does not infer ownership from a forged skill bar or buff marker', () => {
    const merc = { ...unit('merc-source', 'player'), kind: 'merc' as const,
      skillOrder: ['aura-holy-freeze'], activeBuffIds: ['holy_freeze', 'aura-holy-freeze'] };
    expect(actions(replay(snapshot(merc)))[0]).toBe(1700);
  });
  it('keeps rank-one/cap potency and never carries derived Chill into the next wave', () => {
    for (const rank of [1, 20]) {
      const first = replay(snapshot({ ...source(), skillLevels: { 'aura-holy-freeze': rank } }));
      const carried = first.result.enemyTeam[0];
      if (!carried) throw new Error('Missing carried target');
      expect(actions(first)[0]).toBe(2000);
      expect(carried.statuses).toEqual([]);
      const ordinary = { ...unit('merc-rogue', 'player'), kind: 'merc' as const };
      expect(actions(replay(snapshot(ordinary, carried)))[0]).toBe(1700);
    }
  });
  it('withdraws the cold bonus on source death and never grants it to enemies', () => {
    registerSkill({ id: 'fixture.cold', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'cold', base: [100, 100] }] });
    const deadSoon = { ...source(), life: 1, statuses: [
      { id: 'poison', stacks: 1, sourceId: 'fixture', remaining: -1, dotPerStack: 1 }] };
    const caster = { ...unit('hero', 'player'), skillOrder: ['fixture.cold'] };
    const r = replay({ ...snapshot(deadSoon), playerTeam: [caster, deadSoon] });
    expect(r.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: 100 });
    const enemy = { ...unit('target', 'enemy'), skillOrder: ['fixture.cold'] };
    const hostile = replay(snapshot(source(), enemy));
    expect(hostile.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({ amount: 100 });
  });
  it('adds the authored cold bonus before crit/resistance/MR, to every living party member', () => {
    registerSkill({ id: 'fixture.cold', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'cold', base: [100, 100] }] });
    const caster = { ...unit('hero', 'player', 200), skillOrder: ['fixture.cold'],
      increasedDamagePct: { cold: 0.25 }, stats: { ...unit('hero', 'player').stats, attackSpeed: 200, critChance: 1 } };
    const target = { ...unit('target', 'enemy'), statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
      stats: { ...unit('target', 'enemy').stats, magicResist: 7,
        resistances: { ...unit('target', 'enemy').stats.resistances, cold: 25 } } };
    for (const kind of ['hero', 'merc', 'summon'] as const) {
      const actor = { ...caster, id: 'actor', kind, ...(kind === 'summon' ? { summon: true, ownerId: 'hero' } : {}) };
      const input = snapshot(source(), target);
      const r = replay({ ...input, playerTeam: [input.playerTeam[0] ?? caster, source(), actor] });
      // floor(100 * (1 + .25 + .20) * 2 * .75 - 7) = 210.
      expect(r.events.find(e => e.kind === 'damage' && e.source === 'actor')).toMatchObject({ amount: 210, crit: true });
    }
  });
  it.each(['physical', 'fire', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    'does not add cold damage or increased damage to %s', damageType => {
      registerSkill({ id: 'fixture.other', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
        manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
      const input = snapshot(), hero = { ...unit('hero', 'player', 200), skillOrder: ['fixture.other'] };
      const r = replay({ ...input, playerTeam: [hero, source()] });
      // The aura's real Chill exposes the existing physical/lightning combo bonuses.
      const amount = damageType === 'physical' ? 110 : damageType === 'lightning' ? 130 : 100;
      expect(r.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ damageType, amount });
    });
});
