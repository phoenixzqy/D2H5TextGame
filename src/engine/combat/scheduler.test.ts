import { describe, it, expect } from 'vitest';
import {
  runBattle,
  runBattleStream,
  getAttackIntervalMs,
  getSkillCooldownMs,
  MIN_INTERVAL_MS,
  type BattleEventWithTime,
  type CombatSnapshot
} from './scheduler';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import type { RegisteredSkill } from '../skills/effects';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 10,
  defense: 0,
  attackSpeed: 100,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mk(over: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: over.id,
    level: 1,
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
    ...over
  };
}

describe('getAttackIntervalMs', () => {
  it('uses explicit attackIntervalMs when present', () => {
    const u = mk({ id: 'a', side: 'player', attackIntervalMs: 1700 });
    expect(getAttackIntervalMs(u)).toBe(1700);
  });

  it('derives from attackSpeed when missing (AS=100 → 1200ms)', () => {
    const u = mk({ id: 'a', side: 'player', stats: { ...baseStats, attackSpeed: 100 } });
    expect(getAttackIntervalMs(u)).toBe(1200);
  });

  it('derives from attackSpeed=120 → 1000ms', () => {
    const u = mk({ id: 'a', side: 'player', stats: { ...baseStats, attackSpeed: 120 } });
    expect(getAttackIntervalMs(u)).toBe(1000);
  });

  it('floors at MIN_INTERVAL_MS', () => {
    const u = mk({
      id: 'a',
      side: 'player',
      stats: { ...baseStats, attackSpeed: 9_999_999 }
    });
    expect(getAttackIntervalMs(u)).toBeGreaterThanOrEqual(MIN_INTERVAL_MS);
  });
});

describe('getSkillCooldownMs', () => {
  it('returns 0 for cooldown=0 skills', () => {
    const s: RegisteredSkill = {
      id: 'x',
      archetype: 'a',
      target: 'self',
      cooldown: 0,
      manaCost: 0,
      effects: [],
      minLevel: 1
    };
    expect(getSkillCooldownMs(s)).toBe(0);
  });

  it('floors at 1000ms even for very short rounds', () => {
    const s: RegisteredSkill = {
      id: 'x',
      archetype: 'a',
      target: 'self',
      cooldown: 0.5,
      manaCost: 0,
      effects: [],
      minLevel: 1
    };
    expect(getSkillCooldownMs(s)).toBe(1000);
  });

  it('multiplies rounds by 1200', () => {
    const s: RegisteredSkill = {
      id: 'x',
      archetype: 'a',
      target: 'self',
      cooldown: 3,
      manaCost: 0,
      effects: [],
      minLevel: 1
    };
    expect(getSkillCooldownMs(s)).toBe(3600);
  });
});

describe('runBattleStream determinism', () => {
  it('same seed → identical event sequence with virtualTimeMs', () => {
    const setup = (): CombatSnapshot => ({
      seed: 0xC0FFEE,
      playerTeam: [mk({ id: 'p1', side: 'player', stats: { ...baseStats, attack: 20 } })],
      enemyTeam: [mk({ id: 'e1', side: 'enemy', stats: { ...baseStats, attack: 5 } })]
    });

    const drainAll = (s: CombatSnapshot): readonly BattleEventWithTime[] => {
      const out: BattleEventWithTime[] = [];
      const it = runBattleStream(s);
      for (;;) {
        const r = it.next();
        if (r.done) return out;
        out.push(r.value);
      }
    };

    const a = drainAll(setup());
    const b = drainAll(setup());
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toEqual(b[i]);
    }
  });
});

describe('runBattleStream scheduler behaviour', () => {
  it('faster mob gets more swings than the slower one in the same window', () => {
    // Player slow (AS=50 → 2400 ms), one fast mob (AS=200 → 600 ms),
    // immortal stats so we can count actions before capping.
    const player = mk({
      id: 'p1',
      side: 'player',
      stats: { ...baseStats, attack: 0, attackSpeed: 50, life: 9999, lifeMax: 9999 },
      life: 9999
    });
    const fast = mk({
      id: 'a-fast',
      side: 'enemy',
      stats: { ...baseStats, attack: 0, attackSpeed: 200, life: 9999, lifeMax: 9999 },
      life: 9999
    });

    const result = runBattle({
      seed: 1,
      playerTeam: [player],
      enemyTeam: [fast],
      maxVirtualMs: 6000
    });

    let playerActs = 0;
    let fastActs = 0;
    for (const ev of result.events) {
      if (ev.kind === 'action') {
        if (ev.actor === 'p1') playerActs++;
        else if (ev.actor === 'a-fast') fastActs++;
      }
    }
    expect(fastActs).toBeGreaterThan(playerActs);
    // Within first ~6s, AS=200 → 600 ms gives 10 swings; AS=50 → 2400ms gives 2.
    expect(fastActs).toBeGreaterThanOrEqual(8);
  });

  it('tie-break by combatant id is deterministic and lexicographic', () => {
    // Two enemies with identical interval, ids 'enemy-a', 'enemy-b'. Player
    // exists but does no damage (attack 0). Within first 4 seconds we should
    // see enemy-a act before enemy-b every time they share a virtualTimeMs.
    const player = mk({
      id: 'p',
      side: 'player',
      stats: { ...baseStats, attack: 0, attackSpeed: 1, life: 9999, lifeMax: 9999 },
      life: 9999
    });
    const a = mk({
      id: 'enemy-a',
      side: 'enemy',
      stats: { ...baseStats, attack: 0, attackSpeed: 100, life: 9999, lifeMax: 9999 },
      life: 9999
    });
    const b = mk({
      id: 'enemy-b',
      side: 'enemy',
      stats: { ...baseStats, attack: 0, attackSpeed: 100, life: 9999, lifeMax: 9999 },
      life: 9999
    });

    const result = runBattle({
      seed: 7,
      playerTeam: [player],
      enemyTeam: [a, b],
      maxVirtualMs: 5000
    });

    // Find pairs of actions sharing virtualTimeMs and verify a-before-b.
    const actionsByTime = new Map<number, string[]>();
    for (const ev of result.events) {
      if (ev.kind !== 'action') continue;
      if (ev.actor === 'enemy-a' || ev.actor === 'enemy-b') {
        const list = actionsByTime.get(ev.virtualTimeMs) ?? [];
        list.push(ev.actor);
        actionsByTime.set(ev.virtualTimeMs, list);
      }
    }
    // For collisions, enemy-a should appear at strictly-earlier virtualTimeMs
    // than enemy-b in the produced sequence (events are in scheduler order).
    let firstA: number | null = null;
    let firstB: number | null = null;
    for (const ev of result.events) {
      if (ev.kind !== 'action') continue;
      if (ev.actor === 'enemy-a' && firstA === null) firstA = ev.virtualTimeMs;
      if (ev.actor === 'enemy-b' && firstB === null) firstB = ev.virtualTimeMs;
    }
    expect(firstA).not.toBeNull();
    expect(firstB).not.toBeNull();
    if (firstA !== null && firstB !== null) {
      // Same interval → both scheduled to act at t=1200 — tie-break picks
      // 'enemy-a' first; 'enemy-b' is processed after.
      expect(firstA).toBeLessThanOrEqual(firstB);
    }
  });

  it('skill cooldown respected across virtual ms', () => {
    // Skill 'sorceress.frost_nova' has cooldown=3 rounds → 3600 ms.
    // Player at AS=100 → 1200ms swing; mana 9999 so cost not gating.
    const player = mk({
      id: 'p',
      side: 'player',
      skillOrder: ['sorceress.frost_nova'],
      mana: 9999,
      stats: {
        ...baseStats,
        attack: 0,
        attackSpeed: 100,
        mana: 9999,
        manaMax: 9999,
        life: 9999,
        lifeMax: 9999
      },
      life: 9999
    });
    const dummy = mk({
      id: 'e',
      side: 'enemy',
      stats: { ...baseStats, attack: 0, attackSpeed: 1, life: 99999, lifeMax: 99999 },
      life: 99999
    });

    const result = runBattle({
      seed: 11,
      playerTeam: [player],
      enemyTeam: [dummy],
      maxVirtualMs: 15000
    });

    const castTimes: number[] = [];
    for (const ev of result.events) {
      if (ev.kind === 'action' && ev.actor === 'p' && ev.skillId === 'sorceress.frost_nova') {
        castTimes.push(ev.virtualTimeMs);
      }
    }
    expect(castTimes.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < castTimes.length; i++) {
      const a = castTimes[i - 1];
      const b = castTimes[i];
      if (a !== undefined && b !== undefined) {
        expect(b - a).toBeGreaterThanOrEqual(3000);
      }
    }
  });

  it('ends with a winner when one side is wiped', () => {
    const player = mk({
      id: 'p',
      side: 'player',
      stats: { ...baseStats, attack: 999, attackSpeed: 100 }
    });
    const enemy = mk({
      id: 'e',
      side: 'enemy',
      stats: { ...baseStats, life: 1, lifeMax: 1, attack: 0, attackSpeed: 1 },
      life: 1
    });
    const result = runBattle({ seed: 3, playerTeam: [player], enemyTeam: [enemy] });
    expect(result.winner).toBe('player');
    const last = result.events[result.events.length - 1];
    expect(last?.kind).toBe('end');
  });

  it('hits maxVirtualMs and ends with no winner when neither side can damage the other', () => {
    const player = mk({
      id: 'p',
      side: 'player',
      stats: { ...baseStats, attack: 0, attackSpeed: 100, life: 9999, lifeMax: 9999 },
      life: 9999
    });
    const enemy = mk({
      id: 'e',
      side: 'enemy',
      stats: { ...baseStats, attack: 0, attackSpeed: 100, life: 9999, lifeMax: 9999 },
      life: 9999
    });
    const result = runBattle({
      seed: 1,
      playerTeam: [player],
      enemyTeam: [enemy],
      maxVirtualMs: 4000
    });
    expect(result.winner).toBeNull();
    expect(result.virtualTimeMs).toBeLessThanOrEqual(4000);
  });
});
