import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import type { CombatUnit } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
import {
  activeFrenzy,
  composeFrenzyRank,
  copyFrenzyStatuses,
  gainFrenzyStack,
  resolveFrenzyDefinition
} from './frenzy';

function hero(): CombatUnit {
  return {
    id: 'hero',
    name: 'Synthetic Frenzy owner',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 100,
    mana: 100,
    frenzyRank: 1,
    stats: {
      life: 100,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false
  };
}
describe('immutable authored Frenzy tuning and native configured authority', () => {
  it('copies validated data independently and rejects absent/duplicate definitions', () => {
    const rows = structuredClone(skills),
      d = resolveFrenzyDefinition(rows);
    expect(d).toEqual({
      attackSpeedPctPerStack: 0.05,
      maxStacks: 5,
      durationMs: 6000,
      requiredLevel: 24,
      maxRank: 20
    });
    expect(Object.isFrozen(d)).toBe(true);
    const row = rows.find((s) => s.id === 'skills-barbarian-frenzy');
    if (!row?.frenzy) throw new Error('Missing Frenzy fixture');
    row.frenzy.attackSpeedPctPerStack = 0.2;
    expect(d.attackSpeedPctPerStack).toBe(0.05);
    expect(() => resolveFrenzyDefinition([])).toThrow('Invalid authored');
    expect(() => resolveFrenzyDefinition([...skills, row])).toThrow('Invalid authored');
  });
  it('uses maximum valid exact aliases without rewriting configuration', () => {
    const owner = {
      classId: 'barbarian',
      level: 30,
      skillOrder: ['skills-barbarian-frenzy'],
      skillLevels: { 'barbarian.frenzy': 2, 'skills-barbarian-frenzy': 20 }
    };
    const before = structuredClone(owner);
    expect(composeFrenzyRank(owner)).toBe(20);
    expect(owner).toEqual(before);
    for (const patch of [
      { classId: 'sorceress' },
      { level: 23 },
      { level: 24.5 },
      { skillOrder: [] },
      { skillOrder: ['barbarian.fren-zy'] },
      { skillLevels: { 'barbarian.frenzy': 1.5 } },
      { skillLevels: { 'barbarian.frenzy': 21 } }
    ]) {
      expect(composeFrenzyRank({ ...owner, ...patch })).toBe(0);
    }
  });
});
describe('finite authenticated Frenzy speed lifecycle', () => {
  it('grants one stack, caps five, refreshes at cap and never mutates base stats', () => {
    let unit = hero();
    const before = structuredClone(unit);
    for (let n = 1; n <= 7; n++) {
      unit = gainFrenzyStack(unit, n * 100);
      expect(activeFrenzy(unit, n * 100)?.stacks).toBe(Math.min(5, n));
      expect(activeFrenzy(unit, n * 100)?.expiresAtMs).toBe(n * 100 + 6000);
    }
    expect(unit.stats).toEqual(before.stats);
    expect(activeFrenzy(unit, 6699.999)?.stacks).toBe(5);
    expect(activeFrenzy(unit, 6700)).toBeUndefined();
    expect(activeFrenzy(gainFrenzyStack(unit, 6700), 6700)?.stacks).toBe(1);
    expect(before.statuses).toEqual([]);
  });
  it('rebases only remaining duration, copies input and removes lost next-wave authority', () => {
    const paid = gainFrenzyStack(hero(), 1000),
      original = structuredClone(paid);
    const carried = copyFrenzyStatuses(rebaseStatusClock(paid, 3500));
    expect(activeFrenzy(carried, 0)).toMatchObject({ appliedAtMs: -2500, expiresAtMs: 3500 });
    expect(activeFrenzy(carried, 3500)).toBeUndefined();
    expect(carried.statuses[0]).not.toBe(paid.statuses[0]);
    expect(copyFrenzyStatuses({ ...carried, frenzyRank: 0 }).statuses).toEqual([]);
    expect(rebaseStatusClock(paid, 9000).statuses).toEqual([]);
    expect(paid).toEqual(original);
    expect(hero().statuses).toEqual([]);
  });
  it('counts one valid record rather than adding duplicate potency', () => {
    const unit = gainFrenzyStack(hero(), 0),
      status = unit.statuses[0];
    if (!status) throw new Error('Missing Frenzy status');
    const duplicate = { ...unit, statuses: [status, { ...status }] };
    expect(activeFrenzy(duplicate, 1)?.stacks).toBe(1);
    expect(gainFrenzyStack(duplicate, 1).statuses).toHaveLength(1);
    expect(activeFrenzy(gainFrenzyStack(duplicate, 1), 1)?.stacks).toBe(2);
  });
  it('rejects bare, hostile, foreign-owner and malformed stack or clock records', () => {
    const unit = gainFrenzyStack(hero(), 0),
      status = unit.statuses[0];
    if (!status) throw new Error('Missing Frenzy status');
    for (const patch of [
      { sourceId: 'other' },
      { stacks: 0 },
      { stacks: 6 },
      { stacks: 1.5 },
      { remaining: -1 },
      { appliedAtMs: NaN },
      { expiresAtMs: Infinity },
      { expiresAtMs: 8001 },
      { dotPerStack: 10 }
    ]) {
      const invalid = { ...unit, statuses: [{ ...status, ...patch }] };
      expect(activeFrenzy(invalid, 1)).toBeUndefined();
      expect(copyFrenzyStatuses(invalid).statuses).toEqual([]);
    }
    const { frenzy, ...marker } = status;
    void frenzy;
    expect(activeFrenzy({ ...unit, statuses: [marker] }, 1)).toBeUndefined();
    for (const patch of [
      { side: 'enemy' as const },
      { kind: 'merc' as const },
      { kind: 'summon' as const },
      { summon: true },
      { ownerId: 'other' },
      { summonOwnerId: 'other' },
      { life: 0 },
      { life: NaN },
      { level: 23 },
      { frenzyRank: 0 },
      { frenzyRank: 1.5 },
      { frenzyRank: 21 }
    ]) {
      expect(activeFrenzy({ ...unit, ...patch }, 1)).toBeUndefined();
      expect(gainFrenzyStack({ ...unit, ...patch }, 1)).toEqual({ ...unit, ...patch });
    }
    expect(activeFrenzy(unit, NaN)).toBeUndefined();
    expect(gainFrenzyStack(unit, Infinity)).toBe(unit);
  });
});
