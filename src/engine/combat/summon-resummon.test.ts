/** Bug #3 (P0) — necromancer re-summons skeleton after death. */
import { describe, it, expect, beforeEach } from 'vitest';
import { runBattle, type BattleEvent } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';

const baseStats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 200, manaMax: 200, attack: 1, defense: 0,
  attackSpeed: 10, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(over: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: over.id, level: 5, tier: 'trash', stats: baseStats,
    life: 200, mana: 200, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, summonedAdds: false, ...over
  };
}

beforeEach(() => { resetSummonCounters(); });

describe('Bug #3 — re-summon after summon death', () => {
  it('necromancer re-casts raise_skeleton after a skeleton dies', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['necromancer.raise_skeleton'],
      stats: { ...baseStats, mana: 200, manaMax: 200 }
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 5000, lifeMax: 5000, attack: 80, attackSpeed: 100 },
      life: 5000
    });
    const result = runBattle({
      seed: 1234, playerTeam: [necro], enemyTeam: [enemy], maxRounds: 30, maxActions: 200
    });
    const summons = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'summon' }> => e.kind === 'summon'
    );
    const skeletonDeaths = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'death' }> =>
        e.kind === 'death' && e.target.startsWith('necro-summon-skeleton-')
    );
    expect(summons.length).toBeGreaterThanOrEqual(2);
    expect(skeletonDeaths.length).toBeGreaterThanOrEqual(1);

    // Critical regression: at least one summon AFTER the first death.
    const firstDeathIdx = result.events.findIndex(
      (e) => e.kind === 'death' && e.target.startsWith('necro-summon-skeleton-')
    );
    const summonAfterDeath = result.events.findIndex(
      (e, i) => i > firstDeathIdx && e.kind === 'summon'
    );
    expect(firstDeathIdx).toBeGreaterThanOrEqual(0);
    expect(summonAfterDeath).toBeGreaterThan(firstDeathIdx);
  });

  it('refunds mana when a summon dies so a mana-tight necro can re-cast', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['necromancer.raise_skeleton'],
      stats: { ...baseStats, mana: 15, manaMax: 15 }, mana: 15
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 5000, lifeMax: 5000, attack: 200, attackSpeed: 100 },
      life: 5000
    });
    const result = runBattle({
      seed: 7, playerTeam: [necro], enemyTeam: [enemy], maxRounds: 30, maxActions: 200
    });
    const summons = result.events.filter((e) => e.kind === 'summon');
    expect(summons.length).toBeGreaterThanOrEqual(2);
  });

  it('caps active summons at the skill spec (max 5)', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['necromancer.raise_skeleton'],
      stats: { ...baseStats, mana: 9999, manaMax: 9999 }, mana: 9999
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 100 },
      life: 1_000_000
    });
    const result = runBattle({
      seed: 42, playerTeam: [necro], enemyTeam: [enemy], maxRounds: 30, maxActions: 200
    });
    const liveSkeletons = result.playerTeam.filter(
      (u) => u.id.startsWith('necro-summon-skeleton-') && u.life > 0
    );
    expect(liveSkeletons.length).toBeLessThanOrEqual(5);
  });
});