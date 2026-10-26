import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { activeTargetCurse, type TargetCurseId } from './target-curse-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses } from './status';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

function unit(tier: MonsterTier = 'trash'): CombatUnit {
  return { id: 'target', name: 'Synthetic curse target', side: 'enemy', kind: 'monster', tier, level: 30,
    life: 10000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [], enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function paid(id: TargetCurseId, tier: MonsterTier = 'trash', start = 400.1): CombatUnit {
  return applyStatus(unit(tier), { id, sourceId: 'absent-paid-caster', targetCurse: id,
    simClockMs: start }, createRng(1));
}
describe.each(['confuse', 'attract'] as const)('%s paid finite status', id => {
  it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
    'uses JSON duration on %s, exact onset/expiry and fractional wave rebasing without a live caster', tier => {
      const target = paid(id, tier), before = structuredClone(target);
      expect(target.statuses).toEqual([{ id, targetCurse: id, sourceId: 'absent-paid-caster', stacks: 1,
        remaining: 3, appliedAtMs: 400.1, expiresAtMs: 3400.1 }]);
      expect(activeTargetCurse(target, id, 400.099)).toBe(false);
      expect(activeTargetCurse(target, id, 400.1)).toBe(true);
      expect(activeTargetCurse(target, id, 3400.099)).toBe(true);
      expect(activeTargetCurse(target, id, 3400.1)).toBe(false);
      expect(activeTargetCurse(rebaseStatusClock(target, 1000.2), id, 0)).toBe(true);
      expect(target).toEqual(before);
    });
  it('replaces duplicate records/source/interval without stacking or mutating inputs', () => {
    const original = paid(id), before = structuredClone(original);
    const duplicate = { ...original, statuses: [...original.statuses, ...original.statuses] };
    const next = applyStatus(duplicate, { id, sourceId: 'new-caster', targetCurse: id,
      simClockMs: 1000, durationMs: 3000 }, createRng(1));
    expect(next.statuses).toEqual([{ id, targetCurse: id, sourceId: 'new-caster', stacks: 1,
      remaining: 3, appliedAtMs: 1000, expiresAtMs: 4000 }]);
    expect(original).toEqual(before); expect(duplicate.statuses).toHaveLength(2);
  });
  it('shortens a paid interval once with Cleansing and independently shortens each replacement', () => {
    const first = paid(id), shortened = shortenCleansingStatuses(first, 600.1, .5);
    expect(shortened.statuses[0]?.expiresAtMs).toBe(2000.1);
    expect(activeTargetCurse(shortened, id, 2000.099)).toBe(true);
    expect(activeTargetCurse(shortened, id, 2000.1)).toBe(false);
    expect(shortenCleansingStatuses(shortened, 700, .5)).toBe(shortened);
    const next = applyStatus(shortened, { id, sourceId: 'second-caster', targetCurse: id,
      simClockMs: 1000, cleansingDurationMultiplier: .5 }, createRng(1));
    expect(next.statuses).toEqual([expect.objectContaining({ targetCurse: id, sourceId: 'second-caster',
      appliedAtMs: 1000, expiresAtMs: 2500, cleansingShortened: true, stacks: 1 })]);
    expect(activeTargetCurse(next, id, 2499.9)).toBe(true);
    expect(activeTargetCurse(next, id, 2500)).toBe(false);
  });
  it.each<Partial<ActiveStatus>>([
    { id: 'terror' }, { stacks: 0 }, { stacks: 2 }, { appliedAtMs: NaN }, { appliedAtMs: Infinity },
    { expiresAtMs: NaN }, { expiresAtMs: Infinity }, { expiresAtMs: -Infinity },
    { appliedAtMs: 501 }, { expiresAtMs: 400.1 }, { expiresAtMs: 399 }, { expiresAtMs: 3400.11 }
  ])('rejects invalid/future/expired/overlong record %#', patch => {
    const target = paid(id);
    expect(activeTargetCurse({ ...target, statuses: target.statuses.map(s => ({ ...s, ...patch })) }, id, 500)).toBe(false);
  });
  it.each(['targetCurse', 'appliedAtMs', 'expiresAtMs'] as const)('rejects missing %s', key => {
    const target = paid(id), status = { ...target.statuses[0] } as ActiveStatus;
    Reflect.deleteProperty(status, key);
    expect(activeTargetCurse({ ...target, statuses: [status] }, id, 500)).toBe(false);
  });
  it('rejects cross-identity capabilities and nonfinite clocks', () => {
    const target = paid(id), other: TargetCurseId = id === 'confuse' ? 'attract' : 'confuse';
    expect(activeTargetCurse(target, other, 500)).toBe(false);
    const crossed = applyStatus(unit(), { id, targetCurse: other, sourceId: 'caster', simClockMs: 400 }, createRng(1));
    expect(crossed.statuses[0]).not.toHaveProperty('targetCurse');
    expect(activeTargetCurse(crossed, id, 500)).toBe(false);
    for (const clock of [NaN, Infinity, -Infinity]) expect(activeTargetCurse(target, id, clock)).toBe(false);
  });
  it('refresh with a bare marker removes the prior paid capability', () => {
    const refreshed = applyStatus(paid(id), { id, sourceId: 'marker', simClockMs: 800 }, createRng(1));
    expect(refreshed.statuses).toHaveLength(1);
    expect(refreshed.statuses[0]).not.toHaveProperty('targetCurse');
    expect(activeTargetCurse(refreshed, id, 900)).toBe(false);
  });
});
