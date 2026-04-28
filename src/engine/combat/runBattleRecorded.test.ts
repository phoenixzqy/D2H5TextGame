import { describe, it, expect } from 'vitest';
import { runBattle, runBattleRecorded, computeUiDelayMs, type BattleEvent } from './combat';
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

function mkUnit(overrides: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
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
    expect(b.result.rounds).toBe(a.rounds);
    // Each recorded event matches the underlying event structure 1:1.
    for (let i = 0; i < a.events.length; i++) {
      const ev = a.events[i] as BattleEvent;
      const rec = b.events[i];
      expect(rec).toBeDefined();
      // strip uiDelayMs and compare
      const { uiDelayMs: _ignored, ...rest } = rec ?? { uiDelayMs: 0 };
      expect(rest).toEqual(ev);
      expect(typeof _ignored).toBe('number');
    }
  });

  it('attaches uiDelayMs in expected ranges', () => {
    const snap = snapshot();
    const { events } = runBattleRecorded(snap);
    expect(events.length).toBeGreaterThan(0);
    for (const ev of events) {
      expect(ev.uiDelayMs).toBeGreaterThanOrEqual(100);
      expect(ev.uiDelayMs).toBeLessThanOrEqual(2000);
    }
    const turnStart = events.find((e) => e.kind === 'turn-start');
    expect(turnStart?.uiDelayMs).toBe(200);
    const death = events.find((e) => e.kind === 'death');
    if (death) expect(death.uiDelayMs).toBe(400);
  });

  it('action delay derives from attackSpeed and is clamped', () => {
    const speeds = new Map([['fast', 1000], ['slow', 0], ['mid', 100]]);
    expect(computeUiDelayMs({ kind: 'action', actor: 'fast', skillId: null }, speeds)).toBe(400);
    expect(computeUiDelayMs({ kind: 'action', actor: 'slow', skillId: null }, speeds)).toBe(2000);
    // 2500 - 100*8 = 1700
    expect(computeUiDelayMs({ kind: 'action', actor: 'mid', skillId: null }, speeds)).toBe(1700);
  });

  it('default delay for unknown actor falls back to 2000 (clamped from 2500)', () => {
    expect(
      computeUiDelayMs({ kind: 'action', actor: 'ghost', skillId: null }, new Map())
    ).toBe(2000);
  });
});
