/**
 * Bug #2 (P0) — allies share threat / aggro.
 *
 * Before the fix, monsters always hit `targetPriority(...)[0]` which (with no
 * summons in play) resolved to the player hero every action, leaving mercs
 * effectively untargetable.
 */
import { describe, it, expect } from 'vitest';
import { runBattle, type BattleEvent } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';

const baseStats: DerivedStats = {
  life: 1000,
  lifeMax: 1000,
  mana: 0,
  manaMax: 0,
  attack: 25,
  defense: 0,
  attackSpeed: 60,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(over: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: over.id,
    level: 5,
    tier: 'trash',
    stats: baseStats,
    life: 1000,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...over
  };
}

function damageEvents(events: readonly BattleEvent[]): Extract<BattleEvent, { kind: 'damage' }>[] {
  return events.filter(
    (e): e is Extract<BattleEvent, { kind: 'damage' }> => e.kind === 'damage'
  );
}

describe('Bug #2 — monsters share threat across allies', () => {
  it('hero + 2 mercs vs 4 monsters: every ally takes hits, hero share < 80%', () => {
    const hero = mkUnit({ id: 'player-hero', side: 'player', kind: 'hero' });
    const mercA = mkUnit({ id: 'merc-a', side: 'player', kind: 'merc' });
    const mercB = mkUnit({ id: 'merc-b', side: 'player', kind: 'merc' });
    const m1 = mkUnit({ id: 'mon-1', side: 'enemy', kind: 'monster' });
    const m2 = mkUnit({ id: 'mon-2', side: 'enemy', kind: 'monster' });
    const m3 = mkUnit({ id: 'mon-3', side: 'enemy', kind: 'monster' });
    const m4 = mkUnit({ id: 'mon-4', side: 'enemy', kind: 'monster' });

    const result = runBattle({
      seed: 0xc0ffee,
      playerTeam: [hero, mercA, mercB],
      enemyTeam: [m1, m2, m3, m4]
    });

    const dmgToPlayers = damageEvents(result.events).filter(
      (e) => e.target === 'player-hero' || e.target === 'merc-a' || e.target === 'merc-b'
    );
    expect(dmgToPlayers.length).toBeGreaterThan(20);

    const counts = new Map<string, number>();
    for (const e of dmgToPlayers) counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
    const heroHits = counts.get('player-hero') ?? 0;
    const mercAHits = counts.get('merc-a') ?? 0;
    const mercBHits = counts.get('merc-b') ?? 0;

    expect(heroHits).toBeGreaterThan(0);
    expect(mercAHits).toBeGreaterThan(0);
    expect(mercBHits).toBeGreaterThan(0);

    const total = heroHits + mercAHits + mercBHits;
    expect(heroHits / total).toBeLessThan(0.8);
  });

  it('dead allies are filtered from monster target pool', () => {
    const hero = mkUnit({
      id: 'player-hero',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, lifeMax: 5_000_000, life: 5_000_000 },
      life: 5_000_000
    });
    // merc starts dead: life 0 — should never be targeted.
    const deadMerc = mkUnit({
      id: 'merc-dead',
      side: 'player',
      kind: 'merc',
      stats: { ...baseStats, lifeMax: 1, life: 0 },
      life: 0
    });
    const m1 = mkUnit({ id: 'mon-1', side: 'enemy', kind: 'monster' });
    const m2 = mkUnit({ id: 'mon-2', side: 'enemy', kind: 'monster' });

    const result = runBattle({
      seed: 1,
      playerTeam: [hero, deadMerc],
      enemyTeam: [m1, m2]
    });

    const hitsOnDead = damageEvents(result.events).filter((e) => e.target === 'merc-dead');
    expect(hitsOnDead.length).toBe(0);
  });

  it('summons receive a higher share than heroes (taunt bias preserved)', () => {
    const hero = mkUnit({ id: 'player-hero', side: 'player', kind: 'hero' });
    const skel = mkUnit({
      id: 'player-hero-summon-skeleton-1',
      side: 'player',
      kind: 'summon',
      summonOwnerId: 'player-hero',
      stats: { ...baseStats, lifeMax: 100_000, life: 100_000 },
      life: 100_000
    });
    const m1 = mkUnit({ id: 'mon-1', side: 'enemy', kind: 'monster' });
    const m2 = mkUnit({ id: 'mon-2', side: 'enemy', kind: 'monster' });
    const m3 = mkUnit({ id: 'mon-3', side: 'enemy', kind: 'monster' });

    const result = runBattle({
      seed: 7,
      playerTeam: [hero, skel],
      enemyTeam: [m1, m2, m3]
    });

    const dmg = damageEvents(result.events);
    const heroHits = dmg.filter((e) => e.target === 'player-hero').length;
    const skelHits = dmg.filter((e) => e.target === 'player-hero-summon-skeleton-1').length;

    expect(heroHits).toBeGreaterThan(0);
    expect(skelHits).toBeGreaterThan(heroHits);
  });

  it("merc death does not end the run (only the hero's death is sticky)", () => {
    const hero = mkUnit({
      id: 'player-hero',
      side: 'player',
      kind: 'hero',
      stats: { ...baseStats, lifeMax: 10_000_000, life: 10_000_000, attack: 50_000 },
      life: 10_000_000
    });
    // Glass-cannon merc that will die fast.
    const fragileMerc = mkUnit({
      id: 'merc-fragile',
      side: 'player',
      kind: 'merc',
      stats: { ...baseStats, lifeMax: 1, life: 1 },
      life: 1
    });
    const m = mkUnit({
      id: 'mon-1',
      side: 'enemy',
      kind: 'monster',
      stats: { ...baseStats, attack: 999 }
    });

    const result = runBattle({
      seed: 99,
      playerTeam: [hero, fragileMerc],
      enemyTeam: [m]
    });

    expect(result.winner).toBe('player');
  });
});
