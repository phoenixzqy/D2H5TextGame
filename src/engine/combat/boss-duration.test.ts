import { afterEach, describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import type { SkillEffect } from '../skills/effects';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded } from './combat';
import { applyStatus, expireStatuses, statusActiveAt, tickStatuses, type ApplyStatusInput } from './status';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

function unit(id = 'boss', side: CombatUnit['side'] = 'enemy', tier: MonsterTier = 'boss', speed = 100): CombatUnit {
  return {
    id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier,
    life: 100_000, mana: 0,
    stats: {
      life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 10, defense: 0, attackSpeed: speed, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false
  };
}

function timed(input: Partial<ApplyStatusInput> = {}, tier: MonsterTier = 'boss'): ActiveStatus | undefined {
  return applyStatus(unit('boss', 'enemy', tier),
    { id: 'freeze', sourceId: 'hero', simClockMs: 1700, ...input }, createRng(7)).statuses[0];
}

afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('boss control duration in simulation milliseconds', () => {
  for (const tier of ['boss', 'chapter-boss'] as const) {
    it.each(['freeze', 'stun'])('halves default %s on ' + tier + ' to 500ms', id => {
      const s = timed({ id }, tier);
      expect(s).toMatchObject({ appliedAtMs: 1700, expiresAtMs: 2200, remaining: 1 });
      if (!s) throw new Error('missing status');
      expect(statusActiveAt(s, 2199)).toBe(true);
      expect(statusActiveAt(s, 2200)).toBe(false);
    });
  }

  it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion'] as const)(
    'keeps ordinary default control duration on %s', tier => {
      expect(timed({}, tier)?.expiresAtMs).toBe(2700);
    });

  it.each([[3, 1500], [2.5, 1250], [1.5015, 750], [0.001, 1], [0.0005, 1], [0, 0], [-0.5, -250]])(
    'scales unrounded seconds %s into %sms', (duration, expectedMs) => {
      expect(timed({ duration })?.expiresAtMs).toBe(1700 + expectedMs);
    });

  it.each([[1501, 750], [1501.5, 750], [1, 1], [0.5, 1], [0, 0], [-2, -1]])(
    'gives explicit %sms precedence and scales it once to %sms', (durationMs, expectedMs) => {
      expect(timed({ duration: 99, durationMs })?.expiresAtMs).toBe(1700 + expectedMs);
    });

  it.each([0, -2])('does not revive a fresh nonpositive duration %sms', durationMs => {
    const result = applyStatus(unit(), { id: 'stun', sourceId: 'hero', durationMs, simClockMs: 1700 }, createRng(7));
    expect(result.statuses.every(s => !statusActiveAt(s, 1700))).toBe(true);
    expect(expireStatuses(result, 1700).statuses).toEqual([]);
  });

  it('uses the configured multiplier for any status without turn rounding', () => {
    expect(timed({ id: 'chill', duration: 3.007,
      config: { duration: 9, maxStacks: 1, bossDurationMult: 0.25 } })?.expiresAtMs).toBe(2451);
  });

  it.each([0, -0.5])('preserves a nonpositive configured multiplier %s', bossDurationMult => {
    expect(timed({ durationMs: 2, config: { duration: 1, maxStacks: 1, bossDurationMult } })?.expiresAtMs)
      .toBe(1700 + 2 * bossDurationMult);
  });

  it.each([['chill', 2000], ['poison', 5000], ['paralyze', 1000]] as const)(
    'does not add boss scaling to %s', (id, durationMs) => {
      expect(timed({ id })?.expiresAtMs).toBe(1700 + durationMs);
    });

  it('keeps ordinary fractional milliseconds and seconds without quantization', () => {
    expect(timed({ durationMs: 1501.5 }, 'trash')?.expiresAtMs).toBe(3201.5);
    expect(timed({ duration: 1.5015 }, 'trash')?.expiresAtMs).toBe(3201.5);
    expect(timed({ id: 'poison', durationMs: 1501.5 })?.expiresAtMs).toBe(3201.5);
  });

  it('preserves the untimed legacy remaining lifecycle, including an ignored ms override', () => {
    const result = applyStatus(unit(), { id: 'freeze', sourceId: 'hero', duration: 4, durationMs: 1 }, createRng(7));
    expect(result.statuses[0]).toEqual({ id: 'freeze', stacks: 1, remaining: 2, sourceId: 'hero' });
    expect(tickStatuses(result).statuses[0]?.remaining).toBe(1);
    expect(tickStatuses(tickStatuses(result)).statuses).toEqual([]);
  });

  it.each([0, -2, 500, 5000])('refreshes active control with maximum absolute expiry for %sms', durationMs => {
    const old: ActiveStatus = { id: 'freeze', stacks: 1, remaining: 5, sourceId: 'original',
      appliedAtMs: 500, expiresAtMs: 3000, dotPerStack: 3, damageType: 'cold' };
    const target = { ...unit(), statuses: [old] };
    const result = applyStatus(target, { id: 'freeze', sourceId: 'new', simClockMs: 1700,
      durationMs, dotPerStack: 99 }, createRng(7));
    expect(result.statuses[0]).toEqual({ ...old, expiresAtMs: Math.max(3000, 1700 + durationMs * 0.5) });
    expect(target.statuses).toEqual([old]);
  });

  it('keeps existing indefinite control indefinite on a timed refresh', () => {
    const old: ActiveStatus = { id: 'stun', stacks: 1, remaining: -1, sourceId: 'original' };
    const result = applyStatus({ ...unit(), statuses: [old] },
      { id: 'stun', sourceId: 'new', simClockMs: 1700 }, createRng(7));
    expect(result.statuses[0]).toEqual({ ...old, remaining: 1 });
  });

  it.each([['expired', 500, 1700], ['future', 3000, 4000]] as const)(
    'replaces %s control with a fresh scaled lifecycle', (_, appliedAtMs, expiresAtMs) => {
      const old: ActiveStatus = { id: 'freeze', stacks: 1, remaining: 5, sourceId: 'old',
        appliedAtMs, expiresAtMs, dotPerStack: 99 };
      const result = applyStatus({ ...unit(), statuses: [old] },
        { id: 'freeze', sourceId: 'new', simClockMs: 1700 }, createRng(7));
      expect(result.statuses[0]).toEqual({ id: 'freeze', stacks: 1, remaining: 1, sourceId: 'new',
        appliedAtMs: 1700, expiresAtMs: 2200 });
    });

  it('consumes no extra RNG and leaves the application input immutable', () => {
    const rng = createRng(7);
    const control = createRng(7);
    const target = unit();
    const input = { id: 'freeze', sourceId: 'hero', durationMs: 1501, simClockMs: 1700 };
    const before = structuredClone({ target, input });
    applyStatus(target, input, rng);
    expect(rng.next()).toBe(control.next());
    expect({ target, input }).toEqual(before);
  });
});

describe('boss control through actual combat application paths', () => {
  for (const tier of ['boss', 'chapter-boss'] as const) {
    for (const id of ['freeze', 'stun']) {
      for (const path of ['damage', 'debuff'] as const) {
        it.each([['inside', 150, 100, 1300, 1700], ['expiry', 125, 62, 1500, 2000]] as const)(
          `${tier} ${id} via ${path} acts correctly at %s`, (boundary, heroSpeed, bossSpeed, application, action) => {
            const effects: readonly SkillEffect[] = path === 'damage'
              ? [{ kind: 'damage', damageType: 'physical', base: [10, 10], applyStatus: { id } }]
              : [{ kind: 'debuff', statusId: id }];
            const skill = 'fixture.boss-duration';
            registerSkill({ id: skill, archetype: 'fixture', target: 'single-enemy', cooldown: 100,
              manaCost: 0, minLevel: 1, effects });
            const snapshot = { seed: 7,
              playerTeam: [{ ...unit('hero', 'player', 'trash', heroSpeed), skillOrder: [skill] }],
              enemyTeam: [unit('boss', 'enemy', tier, bossSpeed)] };
            const before = structuredClone(snapshot);
            const recorded = runBattleRecorded(snapshot);
            expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: id,
              target: 'boss', simClockMs: application }));
            if (boundary === 'inside') {
              expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'boss', simClockMs: action }));
              expect(recorded.events.some(e => e.kind === 'action' && e.actor === 'boss' && e.simClockMs === action)).toBe(false);
            } else {
              expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'boss', simClockMs: action }));
              expect(recorded.events.some(e => e.kind === 'stunned' && e.target === 'boss' && e.simClockMs === action)).toBe(false);
            }
            expect(runBattle(snapshot)).toEqual(recorded.result);
            expect(runBattleRecorded(snapshot)).toEqual(recorded);
            expect(snapshot).toEqual(before);
          });
      }
    }
  }
});
