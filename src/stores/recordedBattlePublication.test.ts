import { beforeEach, describe, expect, it } from 'vitest';
import type { CombatUnit } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { useCombatStore } from './combatStore';
import { stageRecordedBattle, type RecordedBattleInput } from './recordedBattlePublication';

function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return {
    id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 1, tier: 'trash',
    stats: {
      life: 100, lifeMax: 100, mana: 50, manaMax: 50, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    life: 100, mana: 50, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    enraged: false, summonedAdds: false
  };
}

function input(): RecordedBattleInput {
  const hero = unit('hero', 'player');
  const enemy = unit('enemy', 'enemy');
  return {
    initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events: [{ kind: 'mana', target: 'hero', mana: 15, reason: 'cast', simClockMs: 0, uiDelayMs: 200 }],
    unitNameMap: new Map([['hero', 'Hero'], ['enemy', 'Enemy']]),
    outcome: { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [enemy] }
  };
}

const defaults = { currentWave: 3, totalWaves: 7, subAreaRunId: 'old-run' };

describe('recorded battle publication staging', () => {
  beforeEach(() => { useCombatStore.getState().reset(); });

  it('stages all existing playback resets and captured defaults without changing the store', () => {
    const before = useCombatStore.getState();
    const source = input();
    const staged = stageRecordedBattle(source, defaults);
    expect(staged).toEqual({
      inCombat: true,
      playerTeam: [{ ...source.initialPlayerTeam[0], gridPosition: { row: 1, col: 1 } }],
      enemyTeam: [{ ...source.initialEnemyTeam[0], gridPosition: { row: 1, col: 1 } }],
      recordedEvents: source.events, eventCursor: 0, playbackComplete: false,
      log: [], currentTurn: 0, isPaused: false, unitNameMap: source.unitNameMap,
      outcome: source.outcome, currentWave: 3, totalWaves: 7,
      currentWavePresentation: null, subAreaRunId: 'old-run', runVictory: false, runDefeat: false
    });
    expect(useCombatStore.getState()).toBe(before);
  });

  it('normalizes new team arrays once while preserving positioned units and caller data', () => {
    const source = input();
    const positioned = { ...unit('positioned', 'player'), gridPosition: { row: 1, col: 1 } };
    const hero = source.initialPlayerTeam[0];
    const team = [positioned, ...source.initialPlayerTeam];
    const staged = stageRecordedBattle({ ...source, initialPlayerTeam: team }, defaults);
    expect(staged.playerTeam).not.toBe(team);
    expect(staged.enemyTeam).not.toBe(source.initialEnemyTeam);
    expect(staged.playerTeam[0]).toBe(positioned);
    expect(staged.playerTeam[1]).toEqual({ ...hero, gridPosition: { row: 0, col: 1 } });
    expect(staged.playerTeam[1]).not.toBe(hero);
    expect(hero?.gridPosition).toBeUndefined();
    expect(team).toEqual([positioned, hero]);
    expect(Object.isFrozen(source)).toBe(false);
    expect(Object.isFrozen(team)).toBe(false);
    expect(Object.isFrozen(positioned)).toBe(false);
  });

  it('retains exact recording, outcome, names and presentation references', () => {
    const source = { ...input(), wavePresentation: { kind: 'trash' as const } };
    const staged = stageRecordedBattle(source, defaults);
    expect(staged.recordedEvents).toBe(source.events);
    expect(staged.outcome).toBe(source.outcome);
    expect(staged.unitNameMap).toBe(source.unitNameMap);
    expect(staged.currentWavePresentation).toBe(source.wavePresentation);
  });

  it.each([undefined, null, 'new-run'])('captures explicit versus omitted run id %s', subAreaRunId => {
    const staged = stageRecordedBattle({ ...input(), currentWave: 1, totalWaves: 4,
      ...(subAreaRunId === undefined ? {} : { subAreaRunId }) }, defaults);
    expect(staged.currentWave).toBe(1);
    expect(staged.totalWaves).toBe(4);
    expect(staged.subAreaRunId).toBe(subAreaRunId === undefined ? 'old-run' : subAreaRunId);
  });

  it('marks an empty recording complete while retaining its exact event array', () => {
    const events: readonly RecordedBattleEvent[] = [];
    const staged = stageRecordedBattle({ ...input(), events }, defaults);
    expect(staged.playbackComplete).toBe(true);
    expect(staged.recordedEvents).toBe(events);
    expect(staged.eventCursor).toBe(0);
  });

  it('installs captured values and references in one notification after defaults change', () => {
    const staged = stageRecordedBattle(input(), defaults);
    const rewards = { items: [], runeShards: 9, runes: 2, gems: 3, wishstones: 4 };
    useCombatStore.setState({
      currentWave: 99, totalWaves: 100, subAreaRunId: 'later-run', autoMode: false,
      runRewards: rewards, inCombat: false, runVictory: true, runDefeat: true,
      eventCursor: 20, playbackComplete: true, currentTurn: 9, isPaused: true,
      log: [{ id: 'old', timestamp: 1, type: 'system', actorId: '', actorName: '', message: 'old' }]
    });
    const observations: ReturnType<typeof useCombatStore.getState>[] = [];
    const release = useCombatStore.subscribe(state => { observations.push(state); });
    try {
      useCombatStore.getState().publishStagedRecordedBattle(staged);
      const state = useCombatStore.getState();
      expect(observations).toEqual([state]);
      expect(state).toMatchObject(staged);
      expect(state.playerTeam).toBe(staged.playerTeam);
      expect(state.enemyTeam).toBe(staged.enemyTeam);
      expect(state.recordedEvents).toBe(staged.recordedEvents);
      expect(state.log).toBe(staged.log);
      expect(state.unitNameMap).toBe(staged.unitNameMap);
      expect(state.outcome).toBe(staged.outcome);
      expect(state.currentWave).toBe(3);
      expect(state.totalWaves).toBe(7);
      expect(state.subAreaRunId).toBe('old-run');
      expect(state.autoMode).toBe(false);
      expect(state.runRewards).toBe(rewards);
    } finally { release(); }
  });

  it('keeps setRecordedBattle behavior, including current defaults and unrelated state', () => {
    const source = input();
    const rewards = { items: [], runeShards: 6, runes: 0, gems: 0, wishstones: 0 };
    useCombatStore.setState({ ...defaults, autoMode: false, runRewards: rewards });
    const observations: ReturnType<typeof useCombatStore.getState>[] = [];
    const release = useCombatStore.subscribe(state => { observations.push(state); });
    try {
      useCombatStore.getState().setRecordedBattle(source);
      const state = useCombatStore.getState();
      expect(observations).toEqual([state]);
      expect(state.currentWave).toBe(3);
      expect(state.totalWaves).toBe(7);
      expect(state.subAreaRunId).toBe('old-run');
      expect(state.playerTeam[0]?.gridPosition).toEqual({ row: 1, col: 1 });
      expect(state.recordedEvents).toBe(source.events);
      expect(state.outcome).toBe(source.outcome);
      expect(state.unitNameMap).toBe(source.unitNameMap);
      expect(state.runRewards).toBe(rewards);
      expect(state.autoMode).toBe(false);
    } finally { release(); }
  });

  it('leaves the exact old store untouched if team normalization throws', () => {
    const failure = new Error('normalization failed');
    const source = input();
    const enemy = source.initialEnemyTeam[0];
    if (!enemy) throw new Error('fixture missing enemy');
    Object.defineProperty(enemy, 'gridPosition', { get() { throw failure; } });
    const before = useCombatStore.getState();
    let notifications = 0;
    const release = useCombatStore.subscribe(() => { notifications++; });
    try {
      expect(() => { useCombatStore.getState().setRecordedBattle(source); }).toThrow(failure);
      expect(useCombatStore.getState()).toBe(before);
      expect(notifications).toBe(0);
    } finally { release(); }
  });

  it('retains an installed payload when a synchronous observer throws', () => {
    const staged = stageRecordedBattle(input(), defaults);
    const failure = new Error('observer failed after installation');
    const release = useCombatStore.subscribe(() => { throw failure; });
    try {
      expect(() => { useCombatStore.getState().publishStagedRecordedBattle(staged); }).toThrow(failure);
      const state = useCombatStore.getState();
      expect(state).toMatchObject(staged);
      expect(state.playerTeam).toBe(staged.playerTeam);
      expect(state.enemyTeam).toBe(staged.enemyTeam);
      expect(state.recordedEvents).toBe(staged.recordedEvents);
      expect(state.outcome).toBe(staged.outcome);
    } finally { release(); }
  });
});
