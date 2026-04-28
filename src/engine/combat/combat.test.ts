import { describe, it, expect } from 'vitest';
import { runBattle, type CombatSnapshot } from './combat';
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

describe('runBattle', () => {
  it('player wins when enemy has 1 HP and no defenses', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      stats: { ...baseStats, attack: 50, attackSpeed: 20 }
    });
    const enemy = mkUnit({ id: 'e1', side: 'enemy', life: 1, stats: { ...baseStats, life: 1, lifeMax: 1, attackSpeed: 1 } });
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
    expect(a.rounds).toBe(b.rounds);
  });

  it('summon-on-start fires once at most', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      skillOrder: ['necromancer.raise_skeleton'],
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
      maxRounds: 10
    });
    const summons = result.events.filter(
      (e) => e.kind === 'summon' && e.owner === 'p1'
    );
    expect(summons.length).toBe(1);
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
      enemyTeam: [enemy],
      maxRounds: 5
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
      stats: { ...baseStats, attack: 999 }
    });
    const enemy = mkUnit({ id: 'e1', side: 'enemy', life: 5, stats: { ...baseStats, life: 5, lifeMax: 5 } });
    const result = runBattle({ seed: 3, playerTeam: [player], enemyTeam: [enemy] });
    expect(result.events.find((e) => e.kind === 'turn-start')).toBeTruthy();
    expect(result.events.find((e) => e.kind === 'action')).toBeTruthy();
    expect(result.events[result.events.length - 1]?.kind).toBe('end');
  });

  it('basic attack fires when no skill is available', () => {
    const player = mkUnit({
      id: 'p1',
      side: 'player',
      skillOrder: [],
      stats: { ...baseStats, attack: 999 }
    });
    const enemy = mkUnit({ id: 'e1', side: 'enemy', life: 1, stats: { ...baseStats, life: 1, lifeMax: 1 } });
    const result = runBattle({ seed: 5, playerTeam: [player], enemyTeam: [enemy] });
    const action = result.events.find((e) => e.kind === 'action');
    expect(action).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (action && action.kind === 'action') {
      expect(action.skillId).toBeNull();
    }
  });
});
