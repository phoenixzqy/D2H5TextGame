import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import { createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';
import { stringifySave } from '@/engine/save/serialize';
import { snapshotStores } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { captureEarnedRestorers, observeEarnedState, observeStore, resetEarnedStores } from './earned-state';
import { encodeObservation } from './earned-report';
import { runCheckpointAttempt, type CheckpointWave } from './checkpoint-attempt';
import type { CheckpointFixture } from './checkpoint-fixture';

const clockEpochMs = 1792497600000;
const sources = new Map<CharacterClass, Uint8Array>();
const journalPath = process.env.CHECKPOINT_CONTROL_JOURNAL;
if (journalPath) writeFileSync(journalPath, '', { flag: 'wx' });
function journal(value: unknown) {
  if (journalPath) appendFileSync(journalPath, `${JSON.stringify(encodeObservation(value))}\n`);
}
function recordedAttempt(fixture: CheckpointFixture, source: Uint8Array,
  onWave?: (wave: CheckpointWave) => void) {
  journal({ phase: 'started', fixture });
  try {
    const result = runCheckpointAttempt(fixture, source, wave => {
      journal({ phase: 'settled-wave', fixtureId: fixture.id, wave });
      onWave?.(wave);
    });
    journal({ phase: 'complete', result });
    return result;
  } catch (error) {
    journal({ phase: 'failed', fixtureId: fixture.id, error: String(error) });
    throw error;
  }
}
let restoreCaller: () => void;
beforeEach(() => {
  const selection = useIronGolemSelectionStore.getState(), pity = getIdleEliteMisses();
  restoreCaller = () => { useIronGolemSelectionStore.setState(selection, true); setIdleEliteMisses(pity); };
  useIronGolemSelectionStore.setState({ selection: Object.freeze({ heroId: 'caller-hero', itemId: 'caller-item' }) });
  setIdleEliteMisses(7);
});
afterEach(() => { restoreCaller(); });

// Constructed new-character controls only. No retained campaign input is loaded.
beforeAll(() => {
  const restorers = captureEarnedRestorers(), now = Date.now;
  try {
    Date.now = () => clockEpochMs;
    for (const classId of ['sorceress', 'barbarian'] as const) {
      resetEarnedStores();
      useHydrationStore.getState().setStatus('ready');
      usePlayerStore.getState().setPlayer(createMockPlayer('Checkpoint control', classId));
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      // Artificial clear is labeled constructed; it only permits the native idle comparison.
      useMapStore.getState().markCleared('areas/act1-blood-moor');
      const save = snapshotStores();
      assert.ok(save);
      sources.set(classId, new TextEncoder().encode(stringifySave(save)));
    }
  } finally { for (const restore of restorers) restore(); Date.now = now; }
});

function descriptor(classId: CharacterClass, mode: 'manual' | 'idle' = 'manual'): CheckpointFixture {
  const source = sources.get(classId);
  assert.ok(source);
  return {
    fixtureVersion: 3, id: `${classId}-${mode}-control`,
    checkpoint: { kind: 'constructed-control', sha256: createHash('sha256').update(source).digest('hex'),
      evidence: 'checkpoint-attempt.test.ts:new-character-with-synthetic-farm-clear' },
    build: { id: `${classId}-initial`, classId, level: 1 },
    scenario: { act: 1, subAreaId: 'areas/act1-blood-moor', mode, difficulty: 'normal',
      challengeOrdinal: 0, idleEliteMisses: 0 },
    sample: { stage: 'benchmark', seed: 1 }, clockEpochMs
  };
}

function caller() {
  return { domains: observeEarnedState(), combat: observeStore(useCombatStore),
    hydration: useHydrationStore.getState().status, selection: useIronGolemSelectionStore.getState(),
    pity: getIdleEliteMisses(), now: Date.now };
}

it('rejects source or checkpoint-context drift before any battle and preserves the caller', () => {
  const before = caller(), source = sources.get('sorceress');
  assert.ok(source);
  const fixture = descriptor('sorceress');
  const variants = [
    { ...fixture, checkpoint: { ...fixture.checkpoint, sha256: '0'.repeat(64) } },
    { ...fixture, build: { ...fixture.build, classId: 'barbarian' } },
    { ...fixture, build: { ...fixture.build, level: 2 } },
    { ...fixture, scenario: { ...fixture.scenario, difficulty: 'hell' } },
    { ...fixture, clockEpochMs: clockEpochMs - 1 },
    { ...fixture, scenario: { ...fixture.scenario, act: 5, subAreaId: 'areas/act5-bloody-foothills' } }
  ];
  for (const invalid of variants) {
    expect(() => runCheckpointAttempt(invalid, source)).toThrow();
    expect(caller()).toStrictEqual(before);
    expect(hasActiveSubAreaRun()).toBe(false);
  }
});

it('rejects malformed saved data and uncleared idle inputs without combat', () => {
  const before = caller(), source = sources.get('sorceress');
  assert.ok(source);
  const saved = JSON.parse(new TextDecoder().decode(source)) as { map: { clearedSubAreas: string[] } };
  saved.map.clearedSubAreas = [];
  const uncleared = new TextEncoder().encode(JSON.stringify(saved));
  const malformed = new TextEncoder().encode('{');
  for (const [bytes, mode] of [[uncleared, 'idle'], [malformed, 'manual']] as const) {
    const fixture = descriptor('sorceress', mode);
    expect(() => runCheckpointAttempt({ ...fixture, checkpoint: { ...fixture.checkpoint,
      sha256: createHash('sha256').update(bytes).digest('hex') } }, bytes)).toThrow();
    expect(caller()).toStrictEqual(before);
    expect(hasActiveSubAreaRun()).toBe(false);
  }
});

it('refuses an active caller before changing any caller state', () => {
  const combat = useCombatStore.getState(), source = sources.get('sorceress');
  assert.ok(source);
  try {
    useCombatStore.setState({ inCombat: true });
    const before = caller();
    expect(() => runCheckpointAttempt(descriptor('sorceress'), source)).toThrow(/quiescent/u);
    expect(caller()).toStrictEqual(before);
  } finally { useCombatStore.setState(combat, true); }
});

it.each(['manual', 'idle'] as const)('captures the installed native plan before %s prefix settlement', mode => {
  const before = caller(), source = sources.get('sorceress');
  assert.ok(source);
  const base = descriptor('sorceress', mode);
  const fixture = { ...base, scenario: { ...base.scenario, idleEliteMisses: mode === 'idle' ? 11 : 0 } };
  const result = runCheckpointAttempt(fixture, source);
  expect(result.plan).toMatchObject({ subAreaId: fixture.scenario.subAreaId, mode, seed: 1 });
  expect(result.plan.waves).toHaveLength(result.handle.totalWaves);
  expect(result.plan.waves.map(wave => wave.presentation?.kind))
    .toEqual([mode === 'idle' ? 'elite' : 'trash', 'elite', 'elite']);
  expect(result.plan.waves.map(wave => wave.source)).toEqual([
    { kind: 'wave', waveId: 'w1', encounterIds: ['act1-blood-moor-w1-e1'] },
    { kind: 'wave', waveId: 'w2', encounterIds: ['act1-blood-moor-w2-e1'] },
    { kind: 'wave', waveId: 'w3', encounterIds: ['act1-blood-moor-w3-e1'] }
  ]);
  if (mode === 'idle') expect(result.plan.waves[0]?.presentation)
    .toMatchObject({ isIdleElite: true, idleEliteMissesAfterWave: 0 });
  expect(result.unreachedWaveCount).toBeGreaterThan(0);
  for (const wave of result.waves) {
    const planned = result.plan.waves[wave.index];
    assert.ok(planned);
    expect(wave.presentation).toEqual(planned.presentation);
    expect(wave.enemyContexts.map(enemy => ({ level: enemy.level, tier: enemy.tier })))
      .toEqual(planned.spawns.map(spawn => ({ level: spawn.level, tier: spawn.tier })));
  }
  expect(result.plan.waves.flatMap(wave => wave.spawns).some(spawn => spawn.eliteAffix)).toBe(true);
  expect(caller()).toStrictEqual(before);
  expect(hasActiveSubAreaRun()).toBe(false);
  const directory = process.env.CHECKPOINT_PLAN_CONTROL_DIRECTORY;
  if (directory) writeFileSync(`${directory}/${mode}-plan-control.json`, JSON.stringify(encodeObservation({
    scope: result.scope, fixture, handle: result.handle, plan: result.plan,
    unreachedWaveCount: result.unreachedWaveCount,
    observed: result.waves.map(wave => ({ index: wave.index, presentation: wave.presentation,
      enemyContexts: wave.enemyContexts, advanceResult: wave.advanceResult, metrics: wave.metrics }))
  })), { flag: 'wx' });
});

it('observes two classes through native manual/idle combat without granting campaign or balance acceptance', () => {
  const before = caller();
  const attempts = [];
  for (const classId of ['sorceress', 'barbarian'] as const) {
    const source = sources.get(classId);
    assert.ok(source);
    for (const mode of ['manual', 'idle'] as const) {
      const fixture = descriptor(classId, mode);
      const attempt = recordedAttempt(fixture, source, wave => { wave.metrics.heroLife = -123456; });
      expect(attempt.scope).toEqual({ directService: true, campaignSuccessor: false, balanceAcceptance: false });
      expect(attempt.fixture).toEqual(fixture);
      expect(attempt.startingSave.player.class).toBe(classId);
      expect(attempt.startingSave.player.level).toBe(1);
      expect(attempt.handle.runSeed).toBe(1);
      expect(attempt.waves.length).toBeGreaterThan(0);
      expect(attempt.waves.at(-1)?.advanceResult).toMatch(/^(victory|defeat)$/u);
      expect(attempt.unreachedWaveCount).toBe(attempt.handle.totalWaves - attempt.waves.length);
      for (const wave of attempt.waves) {
        expect(wave.metrics.heroLife).not.toBe(-123456);
        expect(wave.engineInput?.seed).toBe(wave.streams.battleSeed);
        expect(wave.enemyContexts.length).toBe(wave.initialEnemyTeam.length);
        expect(wave.enemyContexts.every(enemy => enemy.level > 0 && enemy.tier.length > 0)).toBe(true);
      }
      expect(caller()).toStrictEqual(before);
      expect(hasActiveSubAreaRun()).toBe(false);
      attempts.push(attempt);
    }
  }
  const output = process.env.CHECKPOINT_CONTROL_REPORT;
  if (output) writeFileSync(output, JSON.stringify(encodeObservation({ kind: 'constructed-adapter-controls', attempts })), { flag: 'wx' });
});

it('retains the first observed wave and restores caller state when the output consumer fails', () => {
  const before = caller(), source = sources.get('sorceress');
  assert.ok(source);
  const failure = new Error('injected checkpoint output failure');
  const seen: unknown[] = [];
  expect(() => recordedAttempt(descriptor('sorceress'), source, wave => {
    seen.push(wave);
    throw failure;
  })).toThrow(failure);
  expect(seen).toHaveLength(1);
  expect(caller()).toStrictEqual(before);
  expect(hasActiveSubAreaRun()).toBe(false);
});
