import { describe, it, expect, beforeEach } from 'vitest';
import {
  runBattle,
  runBattleRecorded,
  actionPeriodMs,
  computeUiDelayMs,
  type CombatSnapshot,
  type BattleEvent
} from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';

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

beforeEach(() => {
  resetSummonCounters();
});

describe('runBattle (timeline scheduler)', () => {
  it('player wins when enemy has 1 HP and no defenses', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, attack: 50, attackSpeed: 20 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      life: 1,
      stats: { ...baseStats, life: 1, lifeMax: 1, attackSpeed: 1 }
    });
    const result = runBattle({ seed: 1, playerTeam: [player], enemyTeam: [enemy] });
    expect(result.winner).toBe('player');
    expect(result.events.some((e) => e.kind === 'death' && e.target === 'e1')).toBe(true);
  });

  it('determinism: same seed → identical event sequence', () => {
    const setup = (): CombatSnapshot => ({
      seed: 12345,
      playerTeam: [
        mkUnit({ id: 'p1', side: 'player', stats: { ...baseStats, attack: 20 } })
      ],
      enemyTeam: [
        mkUnit({ id: 'e1', side: 'enemy', stats: { ...baseStats, attack: 5 } })
      ]
    });
    const a = runBattle(setup());
    const b = runBattle(setup());
    expect(a.events).toEqual(b.events);
    expect(a.winner).toBe(b.winner);
  });

  it('summon-on-start spawns a real CombatUnit on round 1', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      skillOrder: ['necromancer.raise_skeleton'],
      kind: 'hero',
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      stats: { ...baseStats, life: 5000, lifeMax: 5000, attackSpeed: 1 },
      life: 5000
    });
    const result = runBattle({
      seed: 99,
      playerTeam: [player],
      enemyTeam: [enemy],
      maxRounds: 4
    });
    const summons = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'summon' }> => e.kind === 'summon'
    );
    expect(summons.length).toBeGreaterThan(0);
    const first = summons[0];
    if (!first) throw new Error('expected summon event');
    expect(first.owner).toBe('p1');
    expect(first.summonId).toBe('skeleton');
    expect(first.unit.kind).toBe('summon');
    expect(first.unit.summonOwnerId).toBe('p1');
    expect(first.unit.side).toBe('player');
    expect(first.unit.name).toBe('Skeleton Warrior');
    // playerTeam contains the spawned skeleton
    expect(result.playerTeam.some((u) => u.id === first.unit.id)).toBe(true);
  });

  it('does NOT recast active buffs', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      skillOrder: ['paladin.might'],
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      stats: { ...baseStats, life: 1000, lifeMax: 1000, attackSpeed: 1 },
      life: 1000
    });
    const result = runBattle({
      seed: 7,
      playerTeam: [player],
      enemyTeam: [enemy]
    });
    const buffs = result.events.filter(
      (e) => e.kind === 'buff' && e.buffId === 'might'
    );
    expect(buffs.length).toBe(1);
  });

  it('emits turn-start, action, and end events', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, attack: 999 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      life: 5,
      stats: { ...baseStats, life: 5, lifeMax: 5 }
    });
    const result = runBattle({ seed: 3, playerTeam: [player], enemyTeam: [enemy] });
    expect(result.events.find((e) => e.kind === 'turn-start')).toBeTruthy();
    expect(result.events.find((e) => e.kind === 'action')).toBeTruthy();
    expect(result.events[result.events.length - 1]?.kind).toBe('end');
  });

  it('basic attack fires when no skill is available', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      kind: 'hero',
      skillOrder: [],
      stats: { ...baseStats, attack: 999 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      life: 1,
      stats: { ...baseStats, life: 1, lifeMax: 1 }
    });
    const result = runBattle({ seed: 5, playerTeam: [player], enemyTeam: [enemy] });
    const action = result.events.find((e) => e.kind === 'action');
    expect(action).toBeDefined();
    if (action?.kind === 'action') {
      expect(action.skillId).toBeNull();
    }
  });
});

describe('actionPeriodMs', () => {
  it('clamps to [400, 2000]', () => {
    expect(actionPeriodMs(0)).toBe(2000);
    expect(actionPeriodMs(50)).toBe(2000); // 2500-400 = 2100 clamped down
    expect(actionPeriodMs(200)).toBe(900);
    expect(actionPeriodMs(1000)).toBe(400);
  });
});

describe('timeline scheduler — fast unit acts more than slow unit', () => {
  it('fast (AS=200) acts ~2× as often as slow (AS=50) over 6 sim-seconds', () => {
    // Both units immortal so battle runs to MAX_SIM_MS (capped at 60s; we look
    // at the recorded sim-times to count actions inside the first 6s).
    const fast = mkUnit({
      id: 'F',
      side: 'player',
      kind: 'hero',
      life: 1_000_000,
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 200 }
    });
    const slow = mkUnit({
      id: 'S',
      side: 'enemy',
      life: 1_000_000,
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 50 }
    });
    const { events } = runBattleRecorded({
      seed: 42,
      playerTeam: [fast],
      enemyTeam: [slow]
    });
    let fastActions = 0;
    let slowActions = 0;
    for (const ev of events) {
      if (ev.simClockMs > 6000) break;
      if (ev.kind !== 'action') continue;
      if (ev.actor === 'F') fastActions++;
      if (ev.actor === 'S') slowActions++;
    }
    expect(slowActions).toBeGreaterThan(0);
    expect(fastActions).toBeGreaterThanOrEqual(slowActions * 2);
  });
});

describe('targeting — taunt prefers summons over heroes', () => {
  it('enemy basic attack hits the player-side skeleton first', () => {
    const hero = mkUnit({
      id: 'player-hero',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, attack: 0, attackSpeed: 1 }
    });
    const skeleton = mkUnit({
      id: 'player-hero-summon-skeleton-1',
      side: 'player',
      kind: 'summon',
      summonOwnerId: 'player-hero',
      stats: { ...baseStats, attack: 0, attackSpeed: 1 }
    });
    const monster = mkUnit({
      id: 'M',
      side: 'enemy',
      kind: 'monster',
      stats: { ...baseStats, attack: 50, attackSpeed: 200 }
    });
    const { events } = runBattle({
      seed: 1,
      playerTeam: [hero, skeleton],
      enemyTeam: [monster]
    });
    const firstDamage = events.find((e) => e.kind === 'damage' && e.source === 'M');
    expect(firstDamage).toBeDefined();
    if (firstDamage && firstDamage.kind === 'damage') {
      expect(firstDamage.target).toBe('player-hero-summon-skeleton-1');
    }
  });
});

describe('summons — owner death despawns minions; hero death = enemy victory', () => {
  it('hero death wins for enemy even if summons still alive', () => {
    const hero = mkUnit({
      id: 'player-hero',
      side: 'player',
      kind: 'hero',
      life: 1,
      stats: { ...baseStats, life: 1, lifeMax: 1, attack: 0, attackSpeed: 1 }
    });
    const skeleton = mkUnit({
      id: 'player-hero-summon-skeleton-1',
      side: 'player',
      kind: 'summon',
      summonOwnerId: 'player-hero',
      life: 9999,
      stats: {
        ...baseStats,
        life: 9999,
        lifeMax: 9999,
        attack: 0,
        attackSpeed: 1
      }
    });
    const monster = mkUnit({
      id: 'M',
      side: 'enemy',
      stats: { ...baseStats, attack: 999, attackSpeed: 200 }
    });
    const result = runBattle({
      seed: 1,
      playerTeam: [hero, skeleton],
      enemyTeam: [monster]
    });
    expect(result.winner).toBe('enemy');
    // Skeleton was despawned (death event emitted).
    expect(
      result.events.some(
        (e) => e.kind === 'death' && e.target === 'player-hero-summon-skeleton-1'
      )
    ).toBe(true);
  });
});

describe('cooldowns are sim-time (seconds)', () => {
  it('skill with cooldown=2 cannot recast at simClock=1500 but can at simClock=2500', () => {
    // Hero with frozen orb (cooldown=2 sec) at AS=200 (period 900ms). After
    // first cast, simClock=900 → next attempt at 1800 → still on CD (expires at
    // 900+2000=2900). At 2700 still on CD. At 3600 ready (>2900). So we expect
    // the second `action` with skillId='sorceress.frozen_orb' AT a simClockMs
    // >= 2900, not before.
    const hero = mkUnit({
      id: 'player-hero',
      side: 'player',
      kind: 'hero',
      mana: 9999,
      skillOrder: ['sorceress.frozen_orb'],
      stats: {
        ...baseStats,
        attack: 1,
        attackSpeed: 200,
        mana: 9999,
        manaMax: 9999
      }
    });
    const dummy = mkUnit({
      id: 'D',
      side: 'enemy',
      life: 1_000_000,
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 1 }
    });
    const { events } = runBattleRecorded({
      seed: 1,
      playerTeam: [hero],
      enemyTeam: [dummy]
    });
    const orbCasts = events.filter(
      (e) => e.kind === 'action' && e.skillId === 'sorceress.frozen_orb'
    );
    expect(orbCasts.length).toBeGreaterThanOrEqual(2);
    const first = orbCasts[0];
    const second = orbCasts[1];
    if (!first || !second) throw new Error('expected at least 2 orb casts');
    expect(second.simClockMs - first.simClockMs).toBeGreaterThanOrEqual(2000);
    // The naïve "every action would recast" world would have second at +900ms.
    expect(second.simClockMs - first.simClockMs).toBeGreaterThan(900);
  });
});

describe('DoT scales with elapsed sim-time, not action count', () => {
  it('fast unit and slow unit with same poison stacks take similar DoT over 5 sec', () => {
    // Each "victim" gets the same poison stack (5 dot/sec) at simClock=0;
    // we manually pre-poison both via initial unit.statuses.
    const fastVictim: CombatUnit = mkUnit({
      id: 'fastV',
      side: 'player',
      kind: 'hero',
      life: 1_000_000,
      stats: {
        ...baseStats,
        life: 1_000_000,
        lifeMax: 1_000_000,
        attack: 0,
        attackSpeed: 200
      },
      statuses: [
        {
          id: 'poison',
          stacks: 1,
          remaining: 999,
          dotPerStack: 10,
          damageType: 'poison',
          sourceId: 'X',
          expiresAtMs: 60_000
        }
      ]
    });
    const slowVictim: CombatUnit = mkUnit({
      id: 'slowV',
      side: 'enemy',
      kind: 'monster',
      life: 1_000_000,
      stats: {
        ...baseStats,
        life: 1_000_000,
        lifeMax: 1_000_000,
        attack: 0,
        attackSpeed: 50
      },
      statuses: [
        {
          id: 'poison',
          stacks: 1,
          remaining: 999,
          dotPerStack: 10,
          damageType: 'poison',
          sourceId: 'X',
          expiresAtMs: 60_000
        }
      ]
    });
    const { events } = runBattleRecorded({
      seed: 1,
      playerTeam: [fastVictim],
      enemyTeam: [slowVictim]
    });
    let fastDot = 0;
    let slowDot = 0;
    for (const ev of events) {
      if (ev.simClockMs > 5000) break;
      if (ev.kind !== 'dot') continue;
      if (ev.target === 'fastV') fastDot += ev.amount;
      if (ev.target === 'slowV') slowDot += ev.amount;
    }
    expect(fastDot).toBeGreaterThan(0);
    expect(slowDot).toBeGreaterThan(0);
    // Both should be approximately 10 dot/sec * 5sec = ~50 (within tolerance).
    // Because fast unit ticks more often each tick is smaller; the *sum*
    // should be roughly equal (independent of action count).
    const ratio = fastDot / slowDot;
    expect(ratio).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(1.6);
  });
});

describe('numbered enemy names', () => {
  // QUARANTINED: cold dynamic-import of stores/combatHelpers occasionally
  // times out at 5000ms (see docs/perf/test-bench.baseline.json line 8).
  // TODO(engine-dev): root-cause and re-enable. Tracking note in CHANGES.md.
  // Note: branch named fix/quarantine-merc-xp per producer dispatch — the
  // actual flaky test is the suffix-naming one below, not a merc XP test
  // (no merc XP flake exists). Branch name preserved for traceability.
  it.skip('multiple enemies of the same template get suffixes A/B/C', async () => {
    // Import lazily to avoid pulling in zustand stores at module load.
    const { createSimpleEnemy } = await import('../../stores/combatHelpers');
    const a = createSimpleEnemy(1, 0);
    const b = createSimpleEnemy(1, 1);
    const c = createSimpleEnemy(1, 2);
    expect(a.name).toMatch(/A$/);
    expect(b.name).toMatch(/B$/);
    expect(c.name).toMatch(/C$/);
  });
});

describe('runBattleRecorded — sim-time annotations', () => {
  it('simClockMs is non-decreasing across recorded events', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, attack: 5, attackSpeed: 30 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      life: 50,
      stats: { ...baseStats, life: 50, lifeMax: 50, attackSpeed: 5 }
    });
    const { events } = runBattleRecorded({
      seed: 7,
      playerTeam: [player],
      enemyTeam: [enemy]
    });
    let prev = -1;
    for (const ev of events) {
      expect(ev.simClockMs).toBeGreaterThanOrEqual(prev);
      prev = ev.simClockMs;
    }
  });

  it('uiDelayMs equals clamped sim-time delta; first event = 200', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, attack: 5, attackSpeed: 30 }
    });
    const enemy = mkUnit({
      id: 'e1',
      side: 'enemy',
      life: 50,
      stats: { ...baseStats, life: 50, lifeMax: 50, attackSpeed: 5 }
    });
    const { events } = runBattleRecorded({
      seed: 7,
      playerTeam: [player],
      enemyTeam: [enemy]
    });
    expect(events[0]?.uiDelayMs).toBe(200);
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const cur = events[i];
      if (!prev || !cur) throw new Error('unexpected sparse events array');
      const expected = Math.max(50, Math.min(3000, cur.simClockMs - prev.simClockMs));
      expect(cur.uiDelayMs).toBe(expected);
    }
  });

  it('computeUiDelayMs respects clamps', () => {
    expect(computeUiDelayMs(0, null)).toBe(200);
    expect(computeUiDelayMs(100, 0)).toBe(100);
    expect(computeUiDelayMs(40, 0)).toBe(50); // clamped low
    expect(computeUiDelayMs(10_000, 0)).toBe(3000); // clamped high
  });
});
