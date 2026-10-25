import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/druid.json';
import type { CombatUnit } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
import {
  activeFeralRage,
  composeFeralRageRank,
  copyFeralRageStatuses,
  gainFeralRageStack,
  resolveFeralRageDefinition
} from './druid-sustain';

function hero(): CombatUnit {
  return {
    id: 'hero',
    name: 'Synthetic Feral owner',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 100,
    mana: 100,
    feralRageRank: 1,
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
describe('immutable authored Feral tuning and native configured authority', () => {
  it('copies validated data independently and rejects absent/duplicate definitions', () => {
    const rows = structuredClone(skills),
      d = resolveFeralRageDefinition(rows);
    expect(d).toEqual({
      attackSpeedPctPerStack: 0.05,
      maxStacks: 5,
      durationMs: 8000,
      requiredLevel: 12,
      maxRank: 20
    });
    expect(Object.isFrozen(d)).toBe(true);
    const row = rows.find((s) => s.id === 'skills-druid-feral-rage');
    if (!row?.feralRage) throw new Error('Missing Feral fixture');
    row.feralRage.attackSpeedPctPerStack = 0.2;
    expect(d.attackSpeedPctPerStack).toBe(0.05);
    expect(() => resolveFeralRageDefinition([])).toThrow('Invalid authored');
    expect(() => resolveFeralRageDefinition([...skills, row])).toThrow('Invalid authored');
  });
  it('uses maximum valid exact aliases without rewriting configuration', () => {
    const owner = {
      classId: 'druid',
      level: 30,
      skillOrder: ['skills-druid-feral-rage'],
      skillLevels: { 'druid.feral_rage': 2, 'skills-druid-feral-rage': 20 }
    };
    const before = structuredClone(owner);
    expect(composeFeralRageRank(owner)).toBe(20);
    expect(owner).toEqual(before);
    for (const patch of [
      { classId: 'sorceress' },
      { level: 11 },
      { level: 12.5 },
      { skillOrder: [] },
      { skillOrder: ['druid.feral-rage'] },
      { skillLevels: { 'druid.feral_rage': 1.5 } },
      { skillLevels: { 'druid.feral_rage': 21 } }
    ]) {
      expect(composeFeralRageRank({ ...owner, ...patch })).toBe(0);
    }
  });
});
describe('finite authenticated Feral speed lifecycle', () => {
  it('grants one stack, caps five, refreshes at cap and never mutates base stats', () => {
    let unit = hero();
    const before = structuredClone(unit);
    for (let n = 1; n <= 7; n++) {
      unit = gainFeralRageStack(unit, n * 100);
      expect(activeFeralRage(unit, n * 100)?.stacks).toBe(Math.min(5, n));
      expect(activeFeralRage(unit, n * 100)?.expiresAtMs).toBe(n * 100 + 8000);
    }
    expect(unit.stats).toEqual(before.stats);
    expect(activeFeralRage(unit, 8699.999)?.stacks).toBe(5);
    expect(activeFeralRage(unit, 8700)).toBeUndefined();
    expect(activeFeralRage(gainFeralRageStack(unit, 8700), 8700)?.stacks).toBe(1);
    expect(before.statuses).toEqual([]);
  });
  it('rebases only remaining duration, copies input and removes lost next-wave authority', () => {
    const paid = gainFeralRageStack(hero(), 1000),
      original = structuredClone(paid);
    const carried = copyFeralRageStatuses(rebaseStatusClock(paid, 3500));
    expect(activeFeralRage(carried, 0)).toMatchObject({ appliedAtMs: -2500, expiresAtMs: 5500 });
    expect(activeFeralRage(carried, 5500)).toBeUndefined();
    expect(carried.statuses[0]).not.toBe(paid.statuses[0]);
    expect(copyFeralRageStatuses({ ...carried, feralRageRank: 0 }).statuses).toEqual([]);
    expect(rebaseStatusClock(paid, 9000).statuses).toEqual([]);
    expect(paid).toEqual(original);
    expect(hero().statuses).toEqual([]);
  });
  it('counts one valid record rather than adding duplicate potency', () => {
    const unit = gainFeralRageStack(hero(), 0),
      status = unit.statuses[0];
    if (!status) throw new Error('Missing Feral status');
    const duplicate = { ...unit, statuses: [status, { ...status }] };
    expect(activeFeralRage(duplicate, 1)?.stacks).toBe(1);
    expect(gainFeralRageStack(duplicate, 1).statuses).toHaveLength(1);
    expect(activeFeralRage(gainFeralRageStack(duplicate, 1), 1)?.stacks).toBe(2);
  });
  it('rejects bare, hostile, foreign-owner and malformed stack or clock records', () => {
    const unit = gainFeralRageStack(hero(), 0),
      status = unit.statuses[0];
    if (!status) throw new Error('Missing Feral status');
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
      expect(activeFeralRage(invalid, 1)).toBeUndefined();
      expect(copyFeralRageStatuses(invalid).statuses).toEqual([]);
    }
    const { feralRage, ...marker } = status;
    void feralRage;
    expect(activeFeralRage({ ...unit, statuses: [marker] }, 1)).toBeUndefined();
    for (const patch of [
      { side: 'enemy' as const },
      { kind: 'merc' as const },
      { kind: 'summon' as const },
      { summon: true },
      { ownerId: 'other' },
      { summonOwnerId: 'other' },
      { life: 0 },
      { life: NaN },
      { level: 11 },
      { feralRageRank: 0 },
      { feralRageRank: 1.5 },
      { feralRageRank: 21 }
    ]) {
      expect(activeFeralRage({ ...unit, ...patch }, 1)).toBeUndefined();
      expect(gainFeralRageStack({ ...unit, ...patch }, 1)).toEqual({ ...unit, ...patch });
    }
    expect(activeFeralRage(unit, NaN)).toBeUndefined();
    expect(gainFeralRageStack(unit, Infinity)).toBe(unit);
  });
});
