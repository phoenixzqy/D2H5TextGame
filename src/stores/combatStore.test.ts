import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './combatStore';
import type { CombatUnit } from '@/engine/combat/types';

function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return {
    id, name: id, side, level: 1, tier: 'trash',
    stats: {
      life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 10, defense: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    life: 100, mana: 0, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    enraged: false, summonedAdds: false, kind: side === 'player' ? 'hero' : 'monster'
  };
}

describe('combatStore — Bug #1 (reset on second battle)', () => {
  beforeEach(() => { useCombatStore.getState().reset(); });

  it('endCombat clears runVictory/runDefeat/subAreaRunId/runRewards/log', () => {
    useCombatStore.setState({
      inCombat: true, playerTeam: [unit('p1', 'player')], enemyTeam: [unit('e1', 'enemy')],
      log: [{ id: 'l1', timestamp: 1, type: 'system', actorId: 's', actorName: 's', message: 'm' }],
      currentWave: 4, totalWaves: 4, runVictory: true,
      subAreaRunId: 'areas/a1-blood-moor',
      runRewards: { items: [], runeShards: 9, runes: 0, gems: 0, wishstones: 0 },
      outcome: { winner: 'player', finalPlayerTeam: [], finalEnemyTeam: [] }
    });
    useCombatStore.getState().endCombat();
    const s = useCombatStore.getState();
    expect(s.inCombat).toBe(false);
    expect(s.runVictory).toBe(false);
    expect(s.runDefeat).toBe(false);
    expect(s.subAreaRunId).toBeNull();
    expect(s.runRewards.runeShards).toBe(0);
    expect(s.runRewards.items).toEqual([]);
    expect(s.log).toEqual([]);
    expect(s.playerTeam).toEqual([]);
    expect(s.enemyTeam).toEqual([]);
    expect(s.currentWave).toBe(1);
    expect(s.outcome).toBeNull();
  });

  it('endCombat after a defeat also clears runDefeat/subAreaRunId', () => {
    useCombatStore.setState({ inCombat: true, runDefeat: true, subAreaRunId: 'areas/a1-cold-plains' });
    useCombatStore.getState().endCombat();
    const s = useCombatStore.getState();
    expect(s.runDefeat).toBe(false);
    expect(s.subAreaRunId).toBeNull();
  });

  it('starting a second battle (setRecordedBattle) resets log/waves/units', () => {
    useCombatStore.setState({
      inCombat: true,
      log: [{ id: 'old', timestamp: 1, type: 'damage', actorId: 'a', actorName: 'a', message: 'old' }],
      runVictory: true, currentWave: 4, totalWaves: 4, eventCursor: 99, playbackComplete: true
    });
    useCombatStore.getState().endCombat();
    const np = unit('p2', 'player'); const ne = unit('e2', 'enemy');
    useCombatStore.getState().setRecordedBattle({
      initialPlayerTeam: [np], initialEnemyTeam: [ne], events: [],
      unitNameMap: new Map([['p2', 'p2'], ['e2', 'e2']]),
      outcome: { winner: null, finalPlayerTeam: [np], finalEnemyTeam: [ne] },
      currentWave: 1, totalWaves: 4, subAreaRunId: 'areas/a1-cold-plains'
    });
    const s = useCombatStore.getState();
    expect(s.inCombat).toBe(true);
    expect(s.runVictory).toBe(false);
    expect(s.runDefeat).toBe(false);
    expect(s.log).toEqual([]);
    expect(s.eventCursor).toBe(0);
    expect(s.playerTeam.map((u) => u.id)).toEqual(['p2']);
    expect(s.enemyTeam.map((u) => u.id)).toEqual(['e2']);
    expect(s.currentWave).toBe(1);
    expect(s.totalWaves).toBe(4);
    expect(s.subAreaRunId).toBe('areas/a1-cold-plains');
  });

  it('positions recorded battle initial teams for grid rendering before playback finishes', () => {
    const player = unit('p1', 'player');
    const enemies = [unit('e1', 'enemy'), unit('e2', 'enemy'), unit('e3', 'enemy')];

    useCombatStore.getState().setRecordedBattle({
      initialPlayerTeam: [player],
      initialEnemyTeam: enemies,
      events: [],
      unitNameMap: new Map(),
      outcome: { winner: null, finalPlayerTeam: [player], finalEnemyTeam: enemies }
    });

    const state = useCombatStore.getState();
    expect(state.playerTeam[0]?.gridPosition).toEqual({ row: 1, col: 1 });
    expect(state.enemyTeam.map((enemy) => enemy.gridPosition)).toEqual([
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 }
    ]);
  });
});
