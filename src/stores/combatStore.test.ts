import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './combatStore';
import type { CombatUnit } from '@/engine/combat/types';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import i18n from '@/i18n';

function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return {
    id, name: id, side, level: 1, tier: 'trash',
    stats: {
      life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 10, defense: 0, magicResist: 0,
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


describe('actual recorded canonical Fire Bolt cast playback', () => {
  it.each(['en', 'zh-CN'])('localizes the %s log while preserving the real recording and resources', async locale => {
    const previous = i18n.language;
    useCombatStore.getState().reset();
    try {
      await i18n.changeLanguage(locale);
      const baseHero = unit('hero', 'player');
      const hero: CombatUnit = { ...baseHero, name: 'Hero', mana: 50,
        stats: { ...baseHero.stats, mana: 50, manaMax: 50, attackSpeed: 100 },
        skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'skills-sorceress-fire-bolt': 1 } };
      const enemy: CombatUnit = { ...unit('target', 'enemy'),
        statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture' }] };
      const input = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
      const before = structuredClone(input);
      const control = runBattle(input);
      const recorded = runBattleRecorded(input);
      const frozen = structuredClone(recorded);
      expect(recorded.result).toEqual(control);
      expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero', skillId: 'sorceress.fire_bolt' }));
      expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: 'hero', mana: 42, reason: 'cast' }));
      expect(recorded.events.some(event => event.kind === 'damage' && event.source === 'hero' && event.damageType === 'fire' && event.amount > 0)).toBe(true);
      const outcome = { winner: control.winner, finalPlayerTeam: control.playerTeam, finalEnemyTeam: control.enemyTeam };
      useCombatStore.getState().setRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
        events: recorded.events, outcome, unitNameMap: new Map([['hero', 'Hero'], ['target', 'Target']]) });
      for (const event of recorded.events) {
        const prior = useCombatStore.getState();
        const target = event.kind === 'damage' ? [...prior.playerTeam, ...prior.enemyTeam].find(unit => unit.id === event.target) : undefined;
        useCombatStore.getState().advanceEvent();
        const state = useCombatStore.getState();
        // Before final outcome publication, verify the actual event-by-event transport.
        if (!state.playbackComplete) {
          const teams = [...state.playerTeam, ...state.enemyTeam];
          if (event.kind === 'mana') expect(teams.find(unit => unit.id === event.target)?.mana).toBe(event.mana);
          if (event.kind === 'damage' && target) {
            expect(teams.find(unit => unit.id === event.target)?.life).toBe(Math.max(0, target.life - event.amount));
          }
        }
      }
      const state = useCombatStore.getState();
      expect(state.playbackComplete).toBe(true);
      expect(state.eventCursor).toBe(recorded.events.length);
      expect(state.recordedEvents).toEqual(frozen.events);
      expect(state.playerTeam).toEqual(control.playerTeam);
      expect(state.enemyTeam).toEqual(control.enemyTeam);
      expect(state.outcome).toEqual(outcome);
      expect(recorded).toEqual(frozen);
      expect(input).toEqual(before);
      expect(state.log.filter(entry => entry.type === 'skill' && entry.actorId === 'hero').map(entry => entry.message))
        .toEqual(recorded.events.filter(event => event.kind === 'action' && event.actor === 'hero')
          .map(() => locale === 'en' ? 'Hero casts Fire Bolt.' : 'Hero 施放了 火弹。'));
    } finally {
      useCombatStore.getState().reset();
      await i18n.changeLanguage(previous);
    }
  });
});
