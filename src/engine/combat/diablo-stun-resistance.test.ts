import { expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { applyStatusWithResult, statusActiveAt, expireStatuses } from './status';
import type { MonsterTier } from './types';

function native(id = 'monsters/act4.diablo', tier: MonsterTier = 'chapter-boss') {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native monster');
  return buildMonsterUnit({ def, level: 70, tier, rng: createRng(13) });
}

it('projects Diablo’s authored quarter-duration Stun coefficient without changing native base stats', () => {
  const boss = native();
  expect(boss).toHaveProperty('stunDurationMultiplier', .25);
  expect(boss.stats.attackSpeed).toBe(140);
  expect(boss.statuses).toEqual([]);
});

it.each([1, 3, 1000, 3000, 3501])('reduces %ims Stun by75%% once, with a positive1ms floor', durationMs => {
  for (const tier of ['boss', 'chapter-boss'] as const) {
    const boss = native('monsters/act4.diablo', tier), before = structuredClone(boss);
    const rng = createRng(13), control = createRng(13);
    const result = applyStatusWithResult(boss, { id: 'stun', sourceId: 'hero', durationMs, simClockMs: 1000 }, rng);
    const duration = Math.max(1, Math.floor(durationMs * .25)), status = result.unit.statuses[0];
    expect(result.applied).toBe(true);
    expect(status).toMatchObject({ id: 'stun', sourceId: 'hero', appliedAtMs: 1000, expiresAtMs: 1000 + duration });
    if (!status) throw new Error('Missing accepted Stun');
    expect(statusActiveAt(status, 1000 + duration - 1)).toBe(true);
    expect(statusActiveAt(status, 1000 + duration)).toBe(false);
    expect(expireStatuses(result.unit, 1000 + duration).statuses).toEqual([]);
    expect(boss).toEqual(before);
    expect(rng.next()).toBe(control.next());
  }
});

it('uses authored reduction with legacy whole-turn rounding and refreshes timed Stun without stacking', () => {
  const boss = native(), rng = createRng(13);
  const legacy = applyStatusWithResult(boss, { id: 'stun', sourceId: 'hero', duration: 4 }, rng);
  expect(legacy.unit.statuses).toMatchObject([{ id: 'stun', remaining: 1 }]);
  const first = applyStatusWithResult(boss, { id: 'stun', sourceId: 'hero', durationMs: 4000, simClockMs: 1000 }, rng);
  const refreshed = applyStatusWithResult(first.unit, { id: 'stun', sourceId: 'merc', durationMs: 4000, simClockMs: 1500 }, rng);
  expect(refreshed.unit.statuses).toHaveLength(1);
  expect(refreshed.unit.statuses).toMatchObject([{ id: 'stun', expiresAtMs: 2500 }]);
});

it('preserves ordinary boss/Baal half-duration Stun, Diablo Freeze half-duration and ordinary Chill', () => {
  for (const id of ['monsters/act5.baal', 'monsters/act5.baal-minion']) {
    const unit = native(id);
    const result = applyStatusWithResult(unit, { id: 'stun', sourceId: 'hero', durationMs: 3000, simClockMs: 1000 }, createRng(13));
    expect(result.unit.statuses).toMatchObject([{ id: 'stun', expiresAtMs: 2500 }]);
  }
  for (const [id, expiresAtMs] of [['freeze', 2500], ['chill', 4000]] as const) {
    const result = applyStatusWithResult(native(), { id, sourceId: 'hero', durationMs: 3000, simClockMs: 1000 }, createRng(13));
    expect(result.applied).toBe(true);
    expect(result.unit.statuses).toMatchObject([{ id, expiresAtMs }]);
  }
});
