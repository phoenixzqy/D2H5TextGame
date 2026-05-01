import { describe, it, expect } from 'vitest';
import { applyEventToTeams } from './combatPlayback';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 25,
  defense: 0,
  attackSpeed: 30,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mk(id: string, side: 'player' | 'enemy', overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id,
    name: id,
    side,
    level: 1,
    tier: 'trash',
    stats: baseStats,
    life: 100,
    mana: 50,
    statuses: [] as readonly ActiveStatus[],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...overrides
  };
}

describe('combatPlayback.applyEventToTeams', () => {
  it('subtracts life on damage', () => {
    const p = [mk('p1', 'player')];
    const e = [mk('e1', 'enemy')];
    const res = applyEventToTeams(p, e, {
      kind: 'damage',
      source: 'p1',
      target: 'e1',
      damageType: 'physical',
      amount: 30,
      crit: false,
      dodged: false
    });
    expect(res.enemyTeam[0]?.life).toBe(70);
    expect(res.playerTeam[0]?.life).toBe(100);
  });

  it('ignores damage when dodged', () => {
    const e = [mk('e1', 'enemy')];
    const res = applyEventToTeams([], e, {
      kind: 'damage',
      source: 'p1',
      target: 'e1',
      damageType: 'physical',
      amount: 999,
      crit: false,
      dodged: true
    });
    expect(res.enemyTeam[0]?.life).toBe(100);
  });

  it('clamps heal to lifeMax', () => {
    const p = [mk('p1', 'player', { life: 90 })];
    const res = applyEventToTeams(p, [], { kind: 'heal', target: 'p1', amount: 999 });
    expect(res.playerTeam[0]?.life).toBe(100);
  });

  it('death sets life to 0', () => {
    const e = [mk('e1', 'enemy', { life: 5 })];
    const res = applyEventToTeams([], e, { kind: 'death', target: 'e1' });
    expect(res.enemyTeam[0]?.life).toBe(0);
  });

  it('buff appends without duplicates', () => {
    const p = [mk('p1', 'player')];
    const r1 = applyEventToTeams(p, [], { kind: 'buff', target: 'p1', buffId: 'fortitude' });
    expect(r1.playerTeam[0]?.activeBuffIds).toEqual(['fortitude']);
    const r2 = applyEventToTeams(
      r1.playerTeam as CombatUnit[],
      [],
      { kind: 'buff', target: 'p1', buffId: 'fortitude' }
    );
    expect(r2.playerTeam[0]?.activeBuffIds).toEqual(['fortitude']);
  });

  it('keeps status events transient because playback lacks expiry snapshots', () => {
    const statuses: readonly ActiveStatus[] = [
      { id: 'poison', stacks: 1, remaining: 2, sourceId: 'p1' }
    ];
    const e = [mk('e1', 'enemy', { statuses })];
    const res = applyEventToTeams([], e, { kind: 'status', target: 'e1', statusId: 'burning' });
    expect(res.enemyTeam[0]?.statuses).toBe(statuses);
  });

  it('replaying all events ends with same final HP as runBattle', () => {
    const player = mk('p1', 'player', { stats: { ...baseStats, attack: 40, attackSpeed: 20 } });
    const enemy = mk('e1', 'enemy', {
      life: 25,
      stats: { ...baseStats, life: 25, lifeMax: 25, attackSpeed: 5 }
    });
    const { events, result } = runBattleRecorded({
      seed: 42,
      playerTeam: [player],
      enemyTeam: [enemy]
    });
    let teams: { playerTeam: readonly CombatUnit[]; enemyTeam: readonly CombatUnit[] } = {
      playerTeam: [player],
      enemyTeam: [enemy]
    };
    for (const ev of events) {
      teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, ev);
    }
    expect(teams.enemyTeam[0]?.life).toBe(result.enemyTeam[0]?.life);
    expect(teams.playerTeam[0]?.life).toBe(result.playerTeam[0]?.life);
  });
});
