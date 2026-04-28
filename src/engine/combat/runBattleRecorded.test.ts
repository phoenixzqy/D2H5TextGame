import { describe, it, expect } from 'vitest';
import { runBattle, runBattleRecorded } from './combat';
import type { CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 10,
  defense: 0,
  attackSpeed: 10,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(
  overrides: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>
): CombatUnit {
  return {
    name: overrides.id,
    level: 10,
    tier: 'trash',
    stats: baseStats,
    life: 100,
    mana: 50,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...overrides
  };
}

function snapshot(): CombatSnapshot {
  const player = mkUnit({
    id: 'p1',
    side: 'player',
    kind: 'hero',
    stats: { ...baseStats, attack: 50, attackSpeed: 20 }
  });
  const enemy = mkUnit({
    id: 'e1',
    side: 'enemy',
    life: 30,
    stats: { ...baseStats, life: 30, lifeMax: 30, attackSpeed: 5 }
  });
  return { seed: 7, playerTeam: [player], enemyTeam: [enemy] };
}

describe('runBattleRecorded', () => {
  it('produces same events and outcome as runBattle (deterministic)', () => {
    const snap = snapshot();
    const a = runBattle(snap);
    const b = runBattleRecorded(snap);
    expect(b.events.length).toBe(a.events.length);
    expect(b.result.winner).toBe(a.winner);
    // Each recorded event matches the underlying event structure 1:1
    // when stripping the timing annotations.
    for (let i = 0; i < a.events.length; i++) {
      const ev = a.events[i];
      const rec = b.events[i];
      expect(rec).toBeDefined();
      const { uiDelayMs: _u, simClockMs: _s, ...rest } =
        rec ?? { uiDelayMs: 0, simClockMs: 0 };
      expect(rest).toEqual(ev);
      expect(typeof _u).toBe('number');
      expect(typeof _s).toBe('number');
    }
  });

  it('attaches simClockMs and uiDelayMs annotations within bounds', () => {
    const snap = snapshot();
    const { events } = runBattleRecorded(snap);
    expect(events.length).toBeGreaterThan(0);
    for (const ev of events) {
      expect(ev.simClockMs).toBeGreaterThanOrEqual(0);
      expect(ev.uiDelayMs).toBeGreaterThanOrEqual(50);
      expect(ev.uiDelayMs).toBeLessThanOrEqual(3000);
    }
    expect(events[0]?.uiDelayMs).toBe(200);
  });
});
