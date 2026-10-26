import { expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { applyStatus, expireStatuses, rebaseStatusClock, shortenCleansingStatuses } from '@/engine/combat/status';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';

function target(tier: MonsterTier = 'trash'): CombatUnit {
  return { id: 'target', name: 'Synthetic prison target', side: 'enemy', kind: 'monster', tier, level: 30,
    life: 100000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [], enraged: false,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function paid(tier: MonsterTier = 'trash', start = 400.1) {
  return applyStatus(target(tier), { id: 'bone-prison', sourceId: 'paid-owner', bonePrison: true,
    simClockMs: start }, createRng(1));
}
it('adapts only complete authored player Prison into finite paid control', () => {
  const row = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === 'skills-necromancer-bone-prison');
  if (!row) throw new Error('Missing typed Prison');
  expect(registeredSkillFromJson(row).effects).toEqual([
    { kind: 'debuff', statusId: 'bone-prison', durationMs: 2000, bonePrison: true }
  ]);
  expect(registeredSkillFromJson({ ...row, statusEffect: { durationMs: 2000 } }).effects)
    .toEqual([{ kind: 'debuff', statusId: 'bone-prison' }]);
});
it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
  'records exact finite %s expiry and rebases its paid trap without renewal', tier => {
    const unit = paid(tier), end = tier === 'boss' || tier === 'chapter-boss' ? 1400.1 : 2400.1;
    expect(unit.statuses).toEqual([expect.objectContaining({ id: 'bone-prison', stacks: 1,
      bonePrison: true, sourceId: 'paid-owner', appliedAtMs: 400.1, expiresAtMs: end })]);
    expect(expireStatuses(unit, end - .01).statuses).toHaveLength(1);
    expect(expireStatuses(unit, end).statuses).toEqual([]);
    const rebased = rebaseStatusClock(unit, 500.2);
    expect(rebased.statuses[0]).toMatchObject({ bonePrison: true,
      appliedAtMs: 400.1 - 500.2, expiresAtMs: end - 500.2 });
    expect(expireStatuses(rebased, end - 500.2).statuses).toEqual([]);
  });
it('replaces trap source/interval without stacking or inheriting a malformed marker', () => {
  const first = paid(), before = structuredClone(first);
  const again = applyStatus(first, { id: 'bone-prison', sourceId: 'second-owner', bonePrison: true,
    simClockMs: 800, durationMs: 2000 }, createRng(1));
  expect(first).toEqual(before);
  expect(again.statuses).toEqual([expect.objectContaining({ sourceId: 'second-owner', bonePrison: true,
    stacks: 1, appliedAtMs: 800, expiresAtMs: 2800 })]);
  const bare = applyStatus(again, { id: 'bone-prison', sourceId: 'unpaid-marker',
    simClockMs: 900 }, createRng(1));
  expect(bare.statuses).toHaveLength(1);
  expect(bare.statuses[0]?.bonePrison).toBeUndefined();
});
it('is not a Cleansing-sensitive curse, and cannot give another status its paid authority', () => {
  const unit = paid('boss'), before = structuredClone(unit);
  expect(shortenCleansingStatuses(unit, 600, .5)).toBe(unit);
  expect(unit).toEqual(before);
  const applied = applyStatus(target('boss'), { id: 'bone-prison', sourceId: 'owner', bonePrison: true,
    simClockMs: 400.1, cleansingDurationMultiplier: .5 }, createRng(1));
  expect(applied.statuses[0]?.expiresAtMs).toBe(1400.1);
  const other = applyStatus(target(), { id: 'stun', sourceId: 'owner', bonePrison: true,
    simClockMs: 400 }, createRng(1));
  expect(other.statuses[0]?.bonePrison).toBeUndefined();
});
