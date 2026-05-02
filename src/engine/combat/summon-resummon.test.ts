/** Bug #3 (P0) — necromancer re-summons skeleton after death. */
import { describe, it, expect, beforeEach } from 'vitest';
import { runBattle, type BattleEvent } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';
import { maxSkeletonsForLevel } from '../skills/scaling';

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
  it('computes D2-style Raise Skeleton breakpoints', () => {
    expect(
      [0, 1, 5, 6, 11, 12, 20, 99].map((level) => [level, maxSkeletonsForLevel(level)])
    ).toEqual([
      [0, 0],
      [1, 1],
      [5, 1],
      [6, 2],
      [11, 2],
      [12, 3],
      [20, 3],
      [99, 3]
    ]);
  });

  it('necromancer re-casts raise_skeleton after a skeleton dies', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['necromancer.raise_skeleton'],
      skillLevels: { 'necromancer.raise_skeleton': 2 },
      stats: { ...baseStats, life: 1000, lifeMax: 1000, mana: 200, manaMax: 200 },
      life: 1000
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 5000, lifeMax: 5000, attack: 300, attackSpeed: 100 },
      life: 5000
    });
    const result = runBattle({
      seed: 1234, playerTeam: [necro], enemyTeam: [enemy]
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
      seed: 11, playerTeam: [necro], enemyTeam: [enemy]
    });
    const summons = result.events.filter((e) => e.kind === 'summon');
    expect(summons.length).toBeGreaterThanOrEqual(2);
  });

  it('caps active summons at the Raise Skeleton spec (max 3)', () => {
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
      seed: 42, playerTeam: [necro], enemyTeam: [enemy]
    });
    const liveSkeletons = result.playerTeam.filter(
      (u) => u.id.startsWith('necro-summon-skeleton-') && u.life > 0
    );
    expect(liveSkeletons.length).toBeLessThanOrEqual(3);
  });

  it('uses canonical skillLevels for Raise Skeleton summon cap', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['necromancer.raise_skeleton'],
      skillLevels: { 'necromancer.raise_skeleton': 12 },
      stats: { ...baseStats, mana: 9999, manaMax: 9999, attackSpeed: 200 }, mana: 9999
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 100 },
      life: 1_000_000
    });
    const result = runBattle({
      seed: 42, playerTeam: [necro], enemyTeam: [enemy]
    });
    const liveSkeletons = result.playerTeam.filter(
      (u) => u.id.startsWith('necro-summon-skeleton-') && u.life > 0
    );
    expect(liveSkeletons).toHaveLength(3);
  });

  it('uses data skill ids for allocated Raise Skeleton summon cap', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero',
      skillOrder: ['skills-necromancer-raise-skeleton'],
      skillLevels: { 'skills-necromancer-raise-skeleton': 6 },
      stats: { ...baseStats, mana: 9999, manaMax: 9999, attackSpeed: 200 }, mana: 9999
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 100 },
      life: 1_000_000
    });
    const result = runBattle({
      seed: 43, playerTeam: [necro], enemyTeam: [enemy]
    });
    const liveSkeletons = result.playerTeam.filter(
      (u) => u.id.startsWith('necro-summon-skeleton-') && u.life > 0
    );
    expect(liveSkeletons).toHaveLength(2);
  });

  it('casts golem summon skills from data ids without skeletons blocking the cap', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero', level: 12,
      skillOrder: ['skills-necromancer-raise-skeleton', 'skills-necromancer-clay-golem'],
      skillLevels: {
        'skills-necromancer-raise-skeleton': 1,
        'skills-necromancer-clay-golem': 1
      },
      stats: { ...baseStats, mana: 9999, manaMax: 9999, attackSpeed: 200 }, mana: 9999
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 100 },
      life: 1_000_000
    });

    const result = runBattle({
      seed: 44, playerTeam: [necro], enemyTeam: [enemy]
    });

    const liveSummons = result.playerTeam.filter(
      (u) => u.summonOwnerId === 'necro' && u.life > 0
    );
    expect(liveSummons.map((u) => u.summonTemplateId).sort()).toEqual(['clay_golem', 'skeleton']);
  });

  it('respects mana gates while casting multiple summon-on-start skills', () => {
    const necro = mkUnit({
      id: 'necro', side: 'player', kind: 'hero', level: 12,
      skillOrder: ['skills-necromancer-raise-skeleton', 'skills-necromancer-clay-golem'],
      skillLevels: {
        'skills-necromancer-raise-skeleton': 1,
        'skills-necromancer-clay-golem': 1
      },
      stats: { ...baseStats, mana: 15, manaMax: 15, attackSpeed: 200 }, mana: 15
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 1_000_000, lifeMax: 1_000_000, attack: 0, attackSpeed: 100 },
      life: 1_000_000
    });

    const result = runBattle({
      seed: 45, playerTeam: [necro], enemyTeam: [enemy]
    });

    const summonIds = result.events
      .filter((e): e is Extract<BattleEvent, { kind: 'summon' }> => e.kind === 'summon')
      .map((e) => e.summonId);
    expect(summonIds).toContain('skeleton');
    expect(summonIds).not.toContain('clay_golem');
  });
});
