import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import { composePoisonExplosion } from '@/engine/skills/poison-explosion';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { inspectRecordedWaves, abandonRecordedWaves } from './recordedWaveReceipt';
import { decodeObservation, encodeObservation } from '../../tests/sim/contracts/observation-codec';
import { observeStore } from '../../tests/sim/contracts/store-observation';
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

const defaults = { currentWave: 3, totalWaves: 7, subAreaRunId: 'old-run',
  runRewards: { items: [], runeShards: 3, runes: 2, gems: 1, wishstones: 4, materials: { 'runes/el': 2, 'gems/ruby/chipped': 1 } } };

describe('recorded battle publication staging', () => {
  beforeEach(() => { useCombatStore.getState().reset(); });

  it('stages complete playback resets, reward baseline and unlocked defaults without changing the store', () => {
    const before = useCombatStore.getState();
    const source = input();
    const staged = stageRecordedBattle(source, defaults);
    expect(staged).toEqual({
      statusPlayback: null,
      inCombat: true,
      playerTeam: [{ ...source.initialPlayerTeam[0], gridPosition: { row: 1, col: 1 } }],
      enemyTeam: [{ ...source.initialEnemyTeam[0], gridPosition: { row: 1, col: 1 } }],
      recordedEvents: source.events, eventCursor: 0, playbackComplete: false,
      log: [], currentTurn: 0, isPaused: false, unitNameMap: source.unitNameMap,
      outcome: source.outcome, currentWave: 3, totalWaves: 7,
      currentWavePresentation: null, subAreaRunId: 'old-run', runVictory: false, runDefeat: false,
      ironGolemReplayLocked: false, runRewards: defaults.runRewards
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
    const rewards = { items: [], runeShards: 9, runes: 2, gems: 3, wishstones: 4, materials: { 'runes/el': 2, 'gems/ruby/chipped': 3 } };
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
      expect(state.runRewards).toBe(defaults.runRewards);
    } finally { release(); }
  });

  it('keeps setRecordedBattle behavior, including current defaults and unrelated state', () => {
    const source = input();
    const rewards = { items: [], runeShards: 6, runes: 0, gems: 0, wishstones: 0, materials: {} };
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
    const source = { ...input(), ironGolemReplayLocked: true, resetRunRewards: true };
    const enemy = source.initialEnemyTeam[0];
    if (!enemy) throw new Error('fixture missing enemy');
    Object.defineProperty(enemy, 'gridPosition', { get() { throw failure; } });
    useCombatStore.setState({ ironGolemReplayLocked: true, runRewards: defaults.runRewards });
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
    const staged = stageRecordedBattle({ ...input(), ironGolemReplayLocked: true, resetRunRewards: true }, defaults);
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
      expect(state.ironGolemReplayLocked).toBe(true);
      expect(state.runRewards).toBe(staged.runRewards);
    } finally { release(); }
  });

  it.each([undefined, false, true])('captures explicit or omitted replay lock %s', ironGolemReplayLocked => {
    const staged = stageRecordedBattle({ ...input(),
      resetRunRewards: false, ...(ironGolemReplayLocked === undefined ? {} : { ironGolemReplayLocked }) }, defaults);
    expect(staged.ironGolemReplayLocked).toBe(ironGolemReplayLocked === true);
    expect(staged.runRewards).toBe(defaults.runRewards);
    expect(Object.isFrozen(defaults.runRewards)).toBe(false);
  });

  it('stages a fresh zero reward value once without mutating caller rewards', () => {
    const before = structuredClone(defaults.runRewards);
    const source = { ...input(), resetRunRewards: true };
    const staged = stageRecordedBattle(source, defaults), second = stageRecordedBattle(source, defaults);
    expect(staged.runRewards).toEqual({ items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
    expect(staged.runRewards).not.toBe(defaults.runRewards);
    expect(staged.runRewards).not.toBe(second.runRewards);
    expect(staged.runRewards.items).not.toBe(defaults.runRewards.items);
    expect(defaults.runRewards).toEqual(before);
    expect(useCombatStore.getState().inCombat).toBe(false);
  });

  it('publishes recording, lock and new-run reward reset in one notification after live rewards change', () => {
    const staged = stageRecordedBattle({ ...input(), currentWave: 1, subAreaRunId: 'new-run',
      ironGolemReplayLocked: true, resetRunRewards: true }, defaults);
    useCombatStore.setState({ runRewards: defaults.runRewards, ironGolemReplayLocked: false });
    const observations: ReturnType<typeof useCombatStore.getState>[] = [];
    const release = useCombatStore.subscribe(state => { observations.push(state); });
    try {
      useCombatStore.getState().publishStagedRecordedBattle(staged);
      const state = useCombatStore.getState();
      expect(observations).toEqual([state]);
      expect(state.recordedEvents).toBe(staged.recordedEvents);
      expect(state.outcome).toBe(staged.outcome);
      expect(state.subAreaRunId).toBe('new-run');
      expect(state.ironGolemReplayLocked).toBe(true);
      expect(state.runRewards).toBe(staged.runRewards);
      expect(state.runRewards).toEqual({ items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
    } finally { release(); }
  });

  it.each(['start', 'end', 'reset', 'next', 'replace'] as const)('clears the transient lock for ordinary %s', action => {
    useCombatStore.setState({ ironGolemReplayLocked: true });
    const state = useCombatStore.getState();
    if (action === 'start') state.startCombat([], [], 1);
    else if (action === 'end') state.endCombat();
    else if (action === 'reset') state.reset();
    else if (action === 'next') state.nextWave([]);
    else state.setRecordedBattle(input());
    expect(useCombatStore.getState().ironGolemReplayLocked).toBe(false);
  });
});

/** Imported functional fixtures; native production PE is explicitly identified below. */
describe('authoritative recorded status lifecycle', () => {
  const mark = (id: string, extra: Partial<ActiveStatus> = {}): ActiveStatus =>
    ({ id, stacks: 1, remaining: -1, sourceId: 'fixture', ...extra });
  const view = (target: string, statuses: readonly ActiveStatus[], simClockMs = 0, initial = false): RecordedBattleEvent =>
    ({ kind: 'status-state', target, statuses, simClockMs, uiDelayMs: simClockMs || 200,
      ...(initial ? { initial: true as const } : {}) });
  const end = (simClockMs = 5000): RecordedBattleEvent =>
    ({ kind: 'end', winner: null, simClockMs, uiDelayMs: 1000 });
  const intro: RecordedBattleEvent = { kind: 'message', messageKey: 'combat:bossIntro',
    simClockMs: 0, uiDelayMs: 1200 };
  const prefix = (): [RecordedBattleEvent, RecordedBattleEvent] => [view('hero', [], 0, true), view('enemy', [], 0, true)];
  const source = (events: readonly RecordedBattleEvent[] = [...prefix(), end()]): RecordedBattleInput =>
    ({ ...input(), events });
  function through(at: number) {
    const events = useCombatStore.getState().recordedEvents;
    for (let remaining = events.length; remaining > 0; remaining--) {
      const before = useCombatStore.getState();
      const pending = events[before.eventCursor];
      if (!pending || pending.simClockMs > at || before.playbackComplete) break;
      before.advanceEvent();
      expect(useCombatStore.getState().eventCursor).toBeGreaterThan(before.eventCursor);
      expect(useCombatStore.getState().eventCursor).toBeLessThanOrEqual(events.length);
    }
  }
  beforeEach(() => {
    abandonRecordedWaves(); useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills();
  });
  afterEach(() => {
    abandonRecordedWaves(); useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills();
  });

  it('round-trips the complete transient store through lossless earned observations', () => {
    const poison = mark('poison', { tags: ['poison'], appliedAtMs: Number.NaN, expiresAtMs: Infinity });
    Reflect.set(poison, 'dotPerStack', undefined);
    const raw = { ...source([view('hero', [poison], 0, true), view('enemy', [], 0, true),
      view('hero', [], 1000), end()]), initialEnemyTeam: [{ ...unit('enemy', 'enemy'), life: 0 }] };
    const original = structuredClone(raw);
    useCombatStore.getState().setRecordedBattle(raw);
    const held = useCombatStore.getState();
    const data = observeStore(useCombatStore), frozen = structuredClone(data);
    expect(Array.from(data.statusPlayback?.deadIds ?? [])).toEqual(['enemy']);
    expect(data.statusPlayback?.byId.get('hero')).toStrictEqual([poison]);
    expect(held.playerTeam[0]?.statuses[0]).not.toBe(poison);
    expect(held.playerTeam[0]?.statuses[0]?.tags).not.toBe(poison.tags);
    const encoded = encodeObservation(data);
    expect(decodeObservation(JSON.parse(JSON.stringify(encoded)))).toStrictEqual(data);
    through(1000);
    expect(useCombatStore.getState().playerTeam[0]?.statuses).toEqual([]);
    expect(held.playerTeam[0]?.statuses).toStrictEqual([poison]);
    expect(held.statusPlayback?.byId.get('hero')).toStrictEqual([poison]);
    expect(data).toStrictEqual(frozen);
    expect(raw).toStrictEqual(original);
    expect(held.recordedEvents).toBe(raw.events);
    expect(held.outcome).toBe(raw.outcome);
  });

  it('seeds only the copied explicit prefix past one intro without executing startup gameplay', () => {
    const a = mark('poison', { stacks: 2, tags: ['poison'] });
    Reflect.set(a, 'dotPerStack', undefined);
    const b = mark('poison', { tags: ['fire', 'poison'], appliedAtMs: Number.NaN, expiresAtMs: Infinity });
    const raw = source([intro, view('hero', [a, b], 0, true), view('enemy', [], 0, true),
      { kind: 'turn-start', turn: 1, simClockMs: 0, uiDelayMs: 50 },
      { kind: 'mana', target: 'hero', mana: 15, reason: 'cast', simClockMs: 0, uiDelayMs: 50 },
      view('hero', [mark('future')], 1000), end()]);
    const frozen = structuredClone(raw);
    const before = useCombatStore.getState();
    const staged = stageRecordedBattle(raw, defaults);
    expect(useCombatStore.getState()).toBe(before);
    expect(staged).toMatchObject({ eventCursor: 0, currentTurn: 0, log: [], playbackComplete: false });
    expect(staged.recordedEvents).toBe(raw.events); expect(staged.outcome).toBe(raw.outcome);
    expect(staged.playerTeam[0]).toMatchObject({ mana: 50, statuses: [a, b] });
    expect(staged.enemyTeam[0]?.statuses).toEqual([]);
    const statuses = staged.playerTeam[0]?.statuses;
    expect(statuses).not.toBe((raw.events[1] as Extract<RecordedBattleEvent, {kind: 'status-state'}>).statuses);
    expect(statuses?.[0]).not.toBe(a); expect(statuses?.[0]?.tags).not.toBe(a.tags);
    expect(statuses?.[1]).not.toBe(b); expect(statuses?.[1]?.tags).not.toBe(b.tags);
    expect(Object.prototype.hasOwnProperty.call(statuses?.[0] ?? {}, 'dotPerStack')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(statuses?.[1] ?? {}, 'dotPerStack')).toBe(false);
    expect(staged.statusPlayback?.byId.get('hero')).toEqual([a, b]);
    expect(staged.statusPlayback?.byId.get('hero')?.[0]).not.toBe(statuses?.[0]);
    expect(staged.statusPlayback?.deadIds.length).toBe(0);
    expect(raw).toEqual(frozen);
    expect(Object.isFrozen(raw.initialPlayerTeam[0])).toBe(false);
    useCombatStore.getState().publishStagedRecordedBattle(staged);
    expect(useCombatStore.getState().statusPlayback).toBe(staged.statusPlayback);
    expect(useCombatStore.getState().playerTeam).toBe(staged.playerTeam);
    expect(useCombatStore.getState().log).toBe(staged.log);
  });

  const malformed: readonly [string, () => readonly RecordedBattleEvent[]][] = [
    ['no prefix', () => [{ kind: 'turn-start', turn: 1, simClockMs: 0, uiDelayMs: 200 }, view('hero', [], 1000), end()]],
    ['missing unit', () => [prefix()[0], end()]],
    ['duplicate unit', () => [prefix()[0], prefix()[0], end()]],
    ['wrong order', () => [prefix()[1], prefix()[0], end()]],
    ['nonzero initial clock', () => [view('hero', [], 1, true), prefix()[1], end()]],
    ['no initial marker', () => [view('hero', []), prefix()[1], end()]],
    ['gameplay before prefix', () => [{ kind: 'mana', target: 'hero', mana: 1, reason: 'cast', simClockMs: 0, uiDelayMs: 200 }, ...prefix(), end()]],
    ['later initial', () => [...prefix(), view('hero', [], 1000, true), end()]],
    ['extra initial', () => [...prefix(), view('unknown', [], 0, true), end()]],
    ['second leading intro', () => [intro, intro, ...prefix(), end()]]
  ];
  it.each(malformed)('rejects malformed transport: %s before any publication or receipt effect', (_name, events) => {
    const before = useCombatStore.getState(), receipt = inspectRecordedWaves();
    let publications = 0;
    const release = useCombatStore.subscribe(() => { publications++; });
    try {
      const raw = source(events()), frozen = structuredClone(raw);
      expect(() => stageRecordedBattle(raw, defaults)).toThrow();
      expect(() => { useCombatStore.getState().setRecordedBattle(raw); }).toThrow();
      expect(useCombatStore.getState()).toBe(before); expect(publications).toBe(0);
      expect(inspectRecordedWaves()).toBe(receipt); expect(raw).toEqual(frozen);
    } finally { release(); }
  });

  it('uses the effective registration Map but independently replaces every living displayed alias', () => {
    const a = mark('poison', { tags: ['poison'] }), b = { ...a };
    const deadShadow = { ...unit('same', 'player'), life: 0 };
    const liveShadow = unit('same', 'player'), other = unit('other', 'player');
    const effective = unit('same', 'enemy');
    const raw = { ...source([view('same', [a, b], 0, true), view('other', [], 0, true),
      view('same', [mark('burn', { stacks: 3 })], 1000), end()]),
      initialPlayerTeam: [deadShadow, liveShadow, other], initialEnemyTeam: [effective] };
    const staged = stageRecordedBattle(raw, defaults);
    expect([...(staged.statusPlayback?.byId.keys() ?? [])]).toEqual(['same', 'other']);
    expect(staged.statusPlayback?.deadIds.includes('same')).toBe(false);
    expect(staged.playerTeam[0]?.statuses).toEqual([]);
    expect(staged.playerTeam[1]?.statuses).toEqual([a, b]);
    expect(staged.enemyTeam[0]?.statuses).toEqual([a, b]);
    expect(staged.playerTeam[1]?.statuses).not.toBe(staged.enemyTeam[0]?.statuses);
    expect(staged.playerTeam[1]?.statuses[0]).not.toBe(staged.enemyTeam[0]?.statuses[0]);
    expect(staged.playerTeam[1]?.statuses[0]?.tags).not.toBe(staged.enemyTeam[0]?.statuses[0]?.tags);
    expect(staged.playerTeam[1]?.statuses[0]).not.toBe(staged.playerTeam[1]?.statuses[1]);
    useCombatStore.getState().publishStagedRecordedBattle(staged); through(1000);
    const state = useCombatStore.getState();
    expect(state.playerTeam.map(u => [u.life, u.statuses.map(s => s.id)])).toEqual([[0, []], [100, ['burn']], [100, []]]);
    expect(state.enemyTeam[0]?.statuses).toEqual([mark('burn', { stacks: 3 })]);
    expect(state.playerTeam[1]?.statuses).not.toBe(state.enemyTeam[0]?.statuses);
    expect(staged.playerTeam[1]?.statuses).toEqual([a, b]);
    expect(staged.statusPlayback?.byId.get('same')).toEqual([a, b]);
    expect(staged.statusPlayback?.deadIds.length).toBe(0);
  });

  it('tracks future and expiry observations before end, without wall-clock or duration inference', () => {
    const future = mark('poison', { appliedAtMs: 1300.25, expiresAtMs: 1400.5, remaining: 100 });
    const raw = { ...source([...prefix(), view('enemy', [future], 1300.25), view('enemy', [], 1400.5), end()]),
      outcome: { ...input().outcome, finalEnemyTeam: [{ ...unit('enemy', 'enemy'), life: 77, mana: 9, statuses: [future] }] } };
    const original = structuredClone(raw);
    useCombatStore.getState().setRecordedBattle(raw); through(0);
    expect(useCombatStore.getState().enemyTeam[0]?.statuses).toEqual([]);
    useCombatStore.getState().pausePlayback();
    const paused = useCombatStore.getState(); paused.advanceEvent();
    expect(useCombatStore.getState()).toBe(paused);
    useCombatStore.getState().resumePlayback(); through(1300.25);
    const active = useCombatStore.getState();
    expect(active.enemyTeam[0]?.statuses).toEqual([future]);
    expect(active.enemyTeam[0]?.life).toBe(100); expect(active.playbackComplete).toBe(false);
    expect(active.log).toEqual([]);
    through(1400.5);
    expect(useCombatStore.getState().enemyTeam[0]?.statuses).toEqual([]);
    expect(useCombatStore.getState().playbackComplete).toBe(false);
    expect(active.enemyTeam[0]?.statuses).toEqual([future]);
    expect(active.statusPlayback?.byId.get('enemy')).toEqual([future]);
    expect(raw.events[2]).toMatchObject({ statuses: [future] });
    through(Infinity);
    expect(useCombatStore.getState().enemyTeam).toEqual(raw.outcome.finalEnemyTeam.map(u => ({ ...u, statuses: [] })));
    expect(useCombatStore.getState().outcome).toBe(raw.outcome);
    expect(raw).toEqual(original);
  });

  it('keeps effective initial death empty and prevents late observations restoring logical death on aliases', () => {
    const poison = mark('poison');
    const dead = { ...unit('dead', 'enemy'), life: 0, statuses: [poison] };
    const hero = unit('same', 'player'), alias = unit('same', 'enemy');
    const events = [view('same', [poison], 0, true), view('dead', [poison], 0, true),
      { kind: 'death' as const, target: 'same', simClockMs: 1000, uiDelayMs: 1000 },
      { kind: 'death' as const, target: 'same', simClockMs: 1500, uiDelayMs: 500 },
      view('same', [poison], 2000), view('dead', [poison], 2000), end()];
    const raw = { ...source(events), initialPlayerTeam: [hero], initialEnemyTeam: [alias, dead],
      outcome: { winner: null, finalPlayerTeam: [{ ...hero, mana: 7, life: 70, statuses: [poison] }],
        finalEnemyTeam: [{ ...alias, life: 40, statuses: [poison] }, dead] } };
    const frozen = structuredClone(raw);
    useCombatStore.getState().setRecordedBattle(raw);
    const initial = useCombatStore.getState().statusPlayback;
    expect(initial?.deadIds).toEqual(['dead']);
    expect(useCombatStore.getState().enemyTeam[1]?.statuses).toEqual([]);
    through(2000);
    const died = useCombatStore.getState();
    expect(died.playerTeam[0]).toMatchObject({ life: 0, statuses: [] });
    expect(died.enemyTeam[0]).toMatchObject({ life: 100, statuses: [] });
    expect(died.statusPlayback?.deadIds).toEqual(['dead', 'same']);
    expect(initial?.deadIds).toEqual(['dead']);
    expect(died.playbackComplete).toBe(false);
    through(Infinity);
    const final = useCombatStore.getState();
    expect(final.playerTeam).toEqual([{ ...raw.outcome.finalPlayerTeam[0], statuses: [] }]);
    expect(final.enemyTeam).toEqual(raw.outcome.finalEnemyTeam.map(u => ({ ...u, statuses: [] })));
    expect(final.outcome).toBe(raw.outcome); expect(raw).toEqual(frozen);
  });

  it('overlays the last observation by ID rather than the first dead displayed alias at final snap', () => {
    const poison = mark('poison', { stacks: 3 });
    const deadShadow = { ...unit('same', 'player'), life: 0 }, live = unit('same', 'enemy');
    const raw = { ...source([view('same', [poison], 0, true), end()]),
      initialPlayerTeam: [deadShadow], initialEnemyTeam: [live],
      outcome: { winner: null, finalPlayerTeam: [deadShadow], finalEnemyTeam: [{ ...live, mana: 9, statuses: [] }] } };
    useCombatStore.getState().setRecordedBattle(raw); through(Infinity);
    const state = useCombatStore.getState();
    expect(state.playerTeam[0]?.statuses).toEqual([]);
    expect(state.enemyTeam[0]).toEqual({ ...raw.outcome.finalEnemyTeam[0], statuses: [poison] });
    expect(raw.outcome.finalEnemyTeam[0]?.statuses).toEqual([]);
  });

  it('ignores unknown later IDs, then accepts real summon entry and its copied observation', () => {
    const poison = mark('poison', { tags: ['poison'] });
    const summon = { ...unit('summon', 'player'), kind: 'summon' as const };
    const raw = source([...prefix(), view('unknown', [poison], 1000),
      { kind: 'summon', owner: 'hero', summonId: 'skeleton', unit: summon, simClockMs: 2000, uiDelayMs: 1000 },
      view('summon', [poison], 2000), view('enemy', [poison], 2500),
      view('enemy', [mark('poison', { stacks: 4, sourceId: 'refresh', tags: ['fire'] })], 3000), end()]);
    useCombatStore.getState().setRecordedBattle(raw); through(0);
    const before = useCombatStore.getState(); through(1000);
    expect(useCombatStore.getState().statusPlayback).toBe(before.statusPlayback);
    expect(useCombatStore.getState().playerTeam).toBe(before.playerTeam);
    expect(useCombatStore.getState().enemyTeam).toBe(before.enemyTeam);
    through(2000);
    const added = useCombatStore.getState().playerTeam.find(u => u.id === 'summon');
    expect(added).toMatchObject({ life: 100, statuses: [poison] });
    expect(added?.statuses[0]).not.toBe(poison); expect(added?.statuses[0]?.tags).not.toBe(poison.tags);
    through(2500); const old = useCombatStore.getState(); through(3000);
    expect(useCombatStore.getState().enemyTeam[0]?.statuses).toEqual([mark('poison', { stacks: 4, sourceId: 'refresh', tags: ['fire'] })]);
    expect(old.enemyTeam[0]?.statuses).toEqual([poison]); expect(summon.statuses).toEqual([]);
  });

  it('preserves exact legacy status/death/final teams and replaces authority on replay, new wave and exits', () => {
    const poison = mark('poison', { expiresAtMs: 1 });
    const authoritative = source([...prefix(), view('enemy', [poison], 1000), end()]);
    useCombatStore.getState().setRecordedBattle(authoritative); through(1000);
    useCombatStore.getState().setRecordedBattle(authoritative);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(useCombatStore.getState().enemyTeam[0]?.statuses).toEqual([]);
    through(Infinity); useCombatStore.getState().setRecordedBattle(authoritative); through(Infinity);
    const legacy = { ...input(), initialEnemyTeam: [{ ...unit('enemy', 'enemy'), statuses: [poison] }],
      events: [{ kind: 'status' as const, target: 'enemy', statusId: 'ignite', simClockMs: 0, uiDelayMs: 200 },
        { kind: 'death' as const, target: 'enemy', simClockMs: 1000, uiDelayMs: 1000 }, end()] };
    const staged = stageRecordedBattle(legacy, defaults); expect(staged.statusPlayback).toBeNull();
    useCombatStore.getState().publishStagedRecordedBattle(staged); through(1000);
    expect(useCombatStore.getState().statusPlayback).toBeNull();
    expect(useCombatStore.getState().enemyTeam[0]).toMatchObject({ life: 0, statuses: [poison] });
    through(Infinity);
    expect(useCombatStore.getState().playerTeam).toEqual(legacy.outcome.finalPlayerTeam);
    expect(useCombatStore.getState().enemyTeam).toEqual(legacy.outcome.finalEnemyTeam);
    for (const action of ['start', 'next', 'end', 'reset'] as const) {
      useCombatStore.getState().setRecordedBattle(authoritative);
      expect(useCombatStore.getState().statusPlayback).not.toBeNull();
      const state = useCombatStore.getState();
      if (action === 'start') state.startCombat([], [], 1);
      if (action === 'next') state.nextWave([]);
      if (action === 'end') state.endCombat();
      if (action === 'reset') state.reset();
      expect(useCombatStore.getState().statusPlayback).toBeNull();
    }
  });

  it('plays production Poison application1700, periodic damage and exact6700 expiry on the same surviving target', () => {
    const hold = (appliedAtMs = 0) => mark('stun', { appliedAtMs });
    const durable = (id: string, side: 'player' | 'enemy', extra: Partial<CombatUnit> = {}): CombatUnit => {
      const base = unit(id, side);
      return { ...base, level: 18, life: 100_000, mana: 15, statuses: [hold()],
        stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 15, manaMax: 15, attack: 1 }, ...extra };
    };
    const pe = 'necromancer.poison_explosion';
    const projection = composePoisonExplosion({ id: 'hero', class: 'necromancer', level: 18,
      skillLevels: { [pe]: 1, 'necromancer.poison_dagger': 1 } });
    if (!projection) throw new Error('Missing real production Poison authority');
    const initialPlayerTeam = [durable('hero', 'player', { statuses: [hold(1701)], skillOrder: [pe], skillLevels: { [pe]: 1 } })];
    const initialEnemyTeam = [durable('body', 'enemy', { life: 1, statuses: [hold(), mark('bleed', { dotPerStack: 1, expiresAtMs: 1000 })] }),
      durable('target', 'enemy', { life: 1000, statuses: [hold(), mark('marker', { expiresAtMs: 2000 })] })];
    const snapshot = { seed: 1, playerTeam: initialPlayerTeam, enemyTeam: initialEnemyTeam, poisonExplosion: [projection] };
    const original = structuredClone(snapshot), recording = runBattleRecorded(snapshot), frozen = structuredClone(recording);
    const outcome = { winner: recording.result.winner, finalPlayerTeam: recording.result.playerTeam, finalEnemyTeam: recording.result.enemyTeam };
    const rewards = useCombatStore.getState().runRewards;
    useCombatStore.getState().setRecordedBattle({ initialPlayerTeam, initialEnemyTeam, events: recording.events,
      outcome, unitNameMap: new Map() });
    const target = () => useCombatStore.getState().enemyTeam.find(u => u.id === 'target');
    expect(target()?.statuses.map(s => s.id)).toEqual(['stun', 'marker']);
    through(1700);
    expect(target()).toMatchObject({ life: 940, statuses: [hold(), mark('marker', { expiresAtMs: 2000 }),
      { id: 'poison', stacks: 1, remaining: 5, sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: 6700, dotPerStack: 3, damageType: 'poison' }] });
    through(3400); expect(target()?.life).toBe(935);
    through(5100); expect(target()?.life).toBe(930);
    expect(target()?.statuses.some(s => s.id === 'poison')).toBe(true);
    through(6700);
    expect(target()).toMatchObject({ life: 925, statuses: [hold()] });
    expect(useCombatStore.getState().playbackComplete).toBe(false);
    expect(recording.events.filter(e => e.kind === 'death' && e.target === 'target')).toEqual([]);
    expect(recording.events.flatMap(e => e.kind === 'dot' && e.target === 'target' ? [[e.simClockMs, e.amount]] : []))
      .toEqual([[3400, 5], [5100, 5], [6700, 5]]);
    through(Infinity);
    expect(useCombatStore.getState().outcome).toBe(outcome);
    expect(useCombatStore.getState().runRewards).toBe(rewards);
    expect(snapshot).toEqual(original); expect(recording).toEqual(frozen);
  });
});
