import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  runFreshMeasurement,
  compareRepetitions,
  diagnoseNonwinningAdvance,
  hashRecordedEvents,
  semanticItem
} from './adapter';
import { canonicalJson } from './fixture';
import {
  assertSourceStable,
  buildRunProvenance,
  collectSourceState,
  validateOutputPath,
  writeNewReport
} from './provenance';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';

const recipe = {
  fixtureVersion: 1,
  id: 'fresh-sorceress-blood-moor-v1',
  origin: {
    kind: 'new-character',
    classId: 'sorceress',
    name: 'SimSorceress',
    policy: 'production-creation-defaults'
  },
  scenario: {
    act: 1,
    subAreaId: 'areas/act1-blood-moor',
    mode: 'manual',
    challengeOrdinal: 0,
    idleEliteMisses: 0
  },
  clockEpochMs: 1792454400000,
  seeds: [1],
  mercPolicy: 'none',
  summonPolicy: 'production-default'
};
const stores = [
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useCombatStore
];
const data = () =>
  stores.map((store) =>
    structuredClone(
      Object.fromEntries(
        Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function')
      )
    )
  );
const scratch: string[] = [];
afterEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
  setIdleEliteMisses(0);
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true });
});

describe('fresh production adapter', () => {
  it('temporarily becomes ready for real playback and restores the non-ready caller', () => {
    useHydrationStore.getState().setStatus('loading', 'caller-loading-marker');
    const before = useHydrationStore.getState();
    const observed = new Set<string>();
    const advance = useCombatStore.getState().advanceEvent;
    useCombatStore.setState({ advanceEvent: () => {
      observed.add(useHydrationStore.getState().status);
      advance();
    } });
    try {
      const report = runFreshMeasurement(recipe);
      expect(report.runs).toHaveLength(2);
      expect(observed).toEqual(new Set(['ready']));
      expect(useHydrationStore.getState()).toEqual(before);
    } finally {
      useCombatStore.setState({ advanceEvent: advance });
    }
  });

  it('retains real complete recordings, build, timings and distinct repeat assessments', () => {
    const before = data();
    const clock = Date.now;
    setIdleEliteMisses(7);
    const report = runFreshMeasurement(recipe);
    expect(report.runs).toHaveLength(2);
    expect(report.comparisons).toHaveLength(1);
    expect(report.comparisons[0]?.rawWaveRecordingsEqual).toBe(true);
    expect(report.comparisons[0]).toMatchObject({
      rawRewardsEqual: false,
      semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true,
      itemIdentityAssessment: 'different',
      rewardPathCoverage: 'exercised',
      fullRawReplayEqual: false
    });
    for (const run of report.runs) {
      expect(run.initialPlayer).toEqual({
        ...createMockPlayer('SimSorceress', 'sorceress'),
        id: `player-${String(recipe.clockEpochMs)}`
      });
      expect(run.waves.length).toBeGreaterThan(0);
      expect(run.logicalSimSeconds).toBe(
        run.waves.reduce((sum, wave) => sum + wave.terminalSimClockMs / 1000, 0)
      );
      expect(run.uiDelayHintSeconds).toBe(
        run.waves.reduce(
          (sum, wave) => sum + wave.events.reduce((n, event) => n + event.uiDelayMs / 1000, 0),
          0
        )
      );
      expect(run.wallSeconds).toBeGreaterThan(0);
      for (const wave of run.waves) {
        expect(wave.events.at(-1)?.kind).toBe('end');
        expect(wave.eventCount).toBe(wave.events.length);
        expect(wave.eventHash).toBe(
          createHash('sha256').update(canonicalJson(wave.events)).digest('hex')
        );
        expect(wave.eventHashAlgorithm).toBe('sha256-canonical-json-v1');
        expect(wave.initialEnemyTeam.length).toBeGreaterThan(0);
        expect(wave.outcome.finalEnemyTeam.length).toBeGreaterThan(0);
        expect(wave.enemyGenerationSeed).toBe(wave.battleSeed);
        expect(wave.actualDelta.addedItems).toEqual(wave.rawRewardDelta.items);
        expect(wave.actualDelta.currencies['rune-shard'] ?? 0).toBe(
          wave.rawRewardDelta.runeShards + wave.rawRewardDelta.runes
        );
        expect(wave.actualDelta.currencies['gem-shard'] ?? 0).toBe(wave.rawRewardDelta.gems);
        expect(wave.actualDelta.currencies.wishstone ?? 0).toBe(wave.rawRewardDelta.wishstones);
      }
      const wonWave = run.waves[0];
      const lostWave = run.waves[1];
      if (!wonWave || !lostWave) throw new Error('Missing natural seed-1 win/loss sequence');
      expect(wonWave.outcome.winner).toBe('player');
      expect(wonWave.rewardApplied).toBe(true);
      expect(wonWave.actualDelta.before.xp).toEqual({ level: 1, intoLevel: 0, cumulative: 0 });
      expect(wonWave.actualDelta.after.xp).toEqual({ level: 2, intoLevel: 60, cumulative: 160 });
      expect(wonWave.actualDelta.xp).toBe(160);
      expect(wonWave.rawRewardDelta.items).toHaveLength(3);
      expect(lostWave.outcome.winner).toBe('enemy');
      expect(lostWave.rewardApplied).toBe(false);
      expect(lostWave.actualDelta.xp).toBe(0);
      expect(lostWave.rawRewardDelta.items).toEqual([]);
      expect(run.actualDelta.xp).toBe(160);
      expect(run.rawRunRewards).toEqual(wonWave.rawRewardDelta);
      expect(run.actualDelta.addedItems).toEqual(run.rawRunRewards.items);
      expect(run.productionTerminalStatus).toBe('defeat');
      expect(run.productionRunVictory).toBe(false);
      expect(run.productionMarkedClear).toBe(false);
      expect(run.actualDelta.addedClears).toEqual([]);
    }
    expect(report.itemAllocator).toEqual({
      scope: 'process-global',
      resetPerformed: false,
      initialSequence: 'not-observed'
    });
    expect(report.idleComparison.eligible).toBe(false);
    expect(data()).toEqual(before);
    expect(Date.now).toBe(clock);
    expect(getIdleEliteMisses()).toBe(7);
    expect(hasActiveSubAreaRun()).toBe(false);
  });

  it('restores every store, pity and exact clock after injected playback failure', () => {
    const original = useCombatStore.getState().advanceEvent;
    const failure = new Error('injected playback failure');
    let observedStatus: string | undefined;
    useHydrationStore.getState().setStatus('error', 'caller-load-failed');
    const hydration = useHydrationStore.getState();
    useCombatStore.setState({
      advanceEvent: () => {
        observedStatus = useHydrationStore.getState().status;
        throw failure;
      }
    });
    const before = data();
    const clock = Date.now;
    setIdleEliteMisses(9);
    try {
      let caught: unknown;
      try { runFreshMeasurement(recipe); } catch (error) { caught = error; }
      expect(caught).toBe(failure);
      expect(observedStatus).toBe('ready');
      expect(useHydrationStore.getState()).toEqual(hydration);
      expect(data()).toEqual(before);
      expect(Date.now).toBe(clock);
      expect(getIdleEliteMisses()).toBe(9);
      expect(hasActiveSubAreaRun()).toBe(false);
    } finally {
      useCombatStore.setState({ advanceEvent: original });
    }
  });

  it('restores hydration after an earlier restorer fails and retains error order', () => {
    const original = new Error('primary playback failure');
    const cleanup = new Error('inventory restore failure');
    const advance = useCombatStore.getState().advanceEvent;
    const clock = Date.now;
    let observedStatus: string | undefined;
    useHydrationStore.getState().setStatus('error', 'caller-cleanup-marker');
    const hydration = useHydrationStore.getState();
    useCombatStore.setState({ advanceEvent: () => {
      observedStatus = useHydrationStore.getState().status;
      throw original;
    } });
    const restore = vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => {
      throw cleanup;
    });
    try {
      let caught: unknown;
      try { runFreshMeasurement(recipe); } catch (error) { caught = error; }
      expect(caught).toBeInstanceOf(AggregateError);
      if (!(caught instanceof AggregateError)) throw new Error('Missing cleanup aggregate');
      expect(caught.errors).toEqual([original, cleanup]);
      expect(caught.errors[0]).toBe(original);
      expect(caught.errors[1]).toBe(cleanup);
      expect(observedStatus).toBe('ready');
      expect(useHydrationStore.getState()).toEqual(hydration);
      expect(Date.now).toBe(clock);
      expect(hasActiveSubAreaRun()).toBe(false);
    } finally {
      restore.mockRestore();
      useCombatStore.setState({ advanceEvent: advance });
    }
  });

  it('rejects an active production run atomically', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Existing', 'sorceress'));
    useHydrationStore.getState().setStatus('ready');
    startSubAreaRun({ runSeed: 13, challengeOrdinal: 0 });
    useHydrationStore.getState().setStatus('error', 'active-caller-marker');
    const hydration = useHydrationStore.getState();
    const before = data();
    const clock = Date.now;
    expect(() => runFreshMeasurement(recipe)).toThrow(/active/u);
    expect(data()).toEqual(before);
    expect(Date.now).toBe(clock);
    expect(hasActiveSubAreaRun()).toBe(true);
    expect(useHydrationStore.getState()).toBe(hydration);
  });

  it('validates actual class references and bounded screening seed count', () => {
    useHydrationStore.getState().setStatus('error', 'invalid-caller-marker');
    const hydration = useHydrationStore.getState();
    expect(() =>
      runFreshMeasurement({ ...recipe, origin: { ...recipe.origin, classId: 'invented' } })
    ).toThrow(/class/u);
    expect(() =>
      runFreshMeasurement({ ...recipe, seeds: Array.from({ length: 9 }, (_, i) => i) })
    ).toThrow(/8/u);
    expect(useHydrationStore.getState()).toBe(hydration);
  });

  it('diagnoses historical nonwinning progression without assigning an end reason', () => {
    expect(diagnoseNonwinningAdvance(null, 'next-wave', false)).toEqual([
      'non-player-wave-advanced'
    ]);
    expect(diagnoseNonwinningAdvance('enemy', 'victory', true)).toEqual([
      'non-player-wave-advanced'
    ]);
    expect(diagnoseNonwinningAdvance(null, 'defeat', false)).toEqual([]);
    expect(diagnoseNonwinningAdvance('player', 'victory', true)).toEqual([]);
  });

  it('hashes every raw event value with stable key order and explicit SHA-256 semantics', () => {
    const expected = createHash('sha256')
      .update('[{"kind":"end","simClockMs":500,"uiDelayMs":80,"winner":null}]')
      .digest('hex');
    expect(
      hashRecordedEvents([{ kind: 'end', winner: null, simClockMs: 500, uiDelayMs: 80 }])
    ).toBe(expected);
    expect(
      hashRecordedEvents([{ uiDelayMs: 80, simClockMs: 500, winner: null, kind: 'end' }])
    ).toBe(expected);
    expect(
      hashRecordedEvents([{ kind: 'end', winner: 'player', simClockMs: 500, uiDelayMs: 80 }])
    ).not.toBe(expected);
    expect(
      hashRecordedEvents([{ kind: 'end', winner: null, simClockMs: 500, uiDelayMs: 81 }])
    ).not.toBe(expected);
  });

  it('semantic item comparison omits only the top-level identity', () => {
    const item: Item = {
      id: 'first',
      baseId: 'base',
      rarity: 'magic',
      level: 1,
      identified: true,
      equipped: false,
      affixes: [{ id: 'nested-affix', tier: 1, rolledValue: 2 }]
    };
    expect(semanticItem(item)).toEqual(semanticItem({ ...item, id: 'second' }));
    expect(semanticItem(item)).not.toEqual(
      semanticItem({ ...item, affixes: [{ id: 'other-nested', tier: 1, rolledValue: 2 }] })
    );
    expect(item.id).toBe('first');
  });

  it('labels unexercised reward/identity paths and never promotes semantic equality to raw replay', () => {
    const report = runFreshMeasurement(recipe);
    const first = report.runs[0];
    const second = report.runs[1];
    if (!first || !second) throw new Error('Missing fresh repetitions');
    const noRewards = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0 };
    const noWin = {
      ...first,
      rawRunRewards: noRewards,
      waves: first.waves.map((wave) => ({
        ...wave,
        rewardApplied: false,
        rawRewardDelta: noRewards,
        actualDelta: { ...wave.actualDelta, xp: 0, addedItems: [], currencies: {} },
        outcome: { ...wave.outcome, winner: null }
      }))
    };
    expect(compareRepetitions(noWin, noWin)).toMatchObject({
      itemIdentityAssessment: 'unexercised',
      rewardPathCoverage: 'unexercised'
    });
    const zeroSlayWin = {
      ...noWin,
      waves: noWin.waves.map((wave) => ({
        ...wave,
        outcome: { ...wave.outcome, winner: 'player' as const }
      }))
    };
    expect(compareRepetitions(zeroSlayWin, zeroSlayWin).rewardPathCoverage).toBe('unexercised');
    const anomalousAward = {
      ...first,
      waves: first.waves.map((wave) => ({
        ...wave,
        outcome: { ...wave.outcome, winner: 'enemy' as const }
      }))
    };
    expect(compareRepetitions(anomalousAward, anomalousAward).rewardPathCoverage).toBe('exercised');
    const item: Item = {
      id: 'one',
      baseId: 'base',
      rarity: 'normal',
      level: 1,
      identified: true,
      equipped: false
    };
    const assessment = compareRepetitions(
      { ...first, rawRunRewards: { ...noRewards, items: [item] } },
      { ...second, rawRunRewards: { ...noRewards, items: [{ ...item, id: 'two' }] } }
    );
    expect(assessment).toMatchObject({
      semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true,
      rawRewardsEqual: false,
      fullRawReplayEqual: false,
      itemIdentityAssessment: 'different'
    });
  });
});

function sourceSandbox(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'd2h5-provenance-test-'));
  scratch.push(root);
  for (const dir of ['src/data', 'tests/sim/production', 'scripts'])
    mkdirSync(path.join(root, dir), { recursive: true });
  for (const [name, contents] of Object.entries({
    'src/data/a.json': '{}',
    'src/main.ts': 'source',
    'tests/sim/production/a.ts': 'adapter',
    'scripts/a.mjs': 'script',
    'package.json': '{}',
    'package-lock.json': '{}',
    'vitest.config.ts': 'config',
    'tsconfig.json': '{}'
  }))
    writeFileSync(path.join(root, name), contents);
  execFileSync('git', ['init', '-q', root]);
  execFileSync('git', ['-C', root, 'add', '.']);
  execFileSync('git', [
    '-C',
    root,
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-qm',
    'fixture'
  ]);
  return root;
}

describe('actual source provenance and external report boundary', () => {
  it('hashes tracked/untracked add edit delete bytes, records SHA/tools and excludes fixed caches', () => {
    const root = sourceSandbox();
    const a = collectSourceState(root);
    expect(a.sourceSha).toBe(
      execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    );
    expect(a.nodeVersion).toBe(process.version);
    expect(a.vitestVersion).toMatch(/^\d+\.\d+\.\d+/u);
    expect(a.dirty.isDirty).toBe(false);
    writeFileSync(path.join(root, 'src/data/new.json'), 'new');
    const b = collectSourceState(root);
    expect(b.sourceTreeHash).not.toBe(a.sourceTreeHash);
    expect(b.dataHash).not.toBe(a.dataHash);
    expect(b.dirty.isDirty).toBe(true);
    writeFileSync(path.join(root, 'src/data/new.json'), 'edit');
    const c = collectSourceState(root);
    expect(c.dataHash).not.toBe(b.dataHash);
    unlinkSync(path.join(root, 'src/data/new.json'));
    expect(collectSourceState(root).sourceTreeHash).toBe(a.sourceTreeHash);
    mkdirSync(path.join(root, 'src/.cache'));
    writeFileSync(path.join(root, 'src/.cache/ignored'), 'ignored');
    expect(collectSourceState(root).sourceTreeHash).toBe(a.sourceTreeHash);
    expect(a.manifest.map((entry) => entry.path)).toEqual(
      a.manifest.map((entry) => entry.path).sort()
    );
    writeFileSync(path.join(root, 'src/main.ts'), 'changed');
    const sourceEdit = collectSourceState(root);
    expect(sourceEdit.sourceTreeHash).not.toBe(a.sourceTreeHash);
    expect(sourceEdit.dataHash).toBe(a.dataHash);
    expect(() => {
      assertSourceStable(a, sourceEdit);
    }).toThrow(/drift/u);
    unlinkSync(path.join(root, 'src/main.ts'));
    expect(collectSourceState(root).sourceTreeHash).not.toBe(sourceEdit.sourceTreeHash);
    writeFileSync(path.join(root, 'src/main.ts'), 'source');
    expect(collectSourceState(root).sourceTreeHash).toBe(a.sourceTreeHash);
    expect(() => {
      assertSourceStable(a, { ...a, sourceSha: '0'.repeat(40) });
    }).toThrow(/drift/u);
  });

  it('rejects symlinked source inputs and existing/internal/output symlinks', () => {
    const root = sourceSandbox();
    const out = mkdtempSync(path.join(tmpdir(), 'd2h5-report-test-'));
    scratch.push(out);
    const destination = path.join(out, 'report.json');
    expect(validateOutputPath(root, destination)).toBe(destination);
    writeNewReport(root, destination, { valid: true });
    expect(JSON.parse(readFileSync(destination, 'utf8')) as unknown).toEqual({ valid: true });
    expect(() => {
      writeNewReport(root, destination, {});
    }).toThrow(/exist/u);
    expect(readFileSync(destination, 'utf8')).toContain('true');
    expect(() => {
      writeNewReport(root, path.join(out, 'unserializable.json'), {
        toJSON() {
          throw new Error('serialize failed');
        }
      });
    }).toThrow(/serialize/u);
    expect(() => {
      readFileSync(path.join(out, 'unserializable.json'));
    }).toThrow();
    expect(() => validateOutputPath(root, path.join(root, 'report.json'))).toThrow(/outside/u);
    expect(() => validateOutputPath(root, 'relative.json')).toThrow(/absolute/u);
    symlinkSync(root, path.join(out, 'inside'));
    expect(() => validateOutputPath(root, path.join(out, 'inside/report.json'))).toThrow(
      /outside/u
    );
    symlinkSync(destination, path.join(root, 'src/escape'));
    expect(() => collectSourceState(root)).toThrow(/symlink/u);
  });

  it('validates provenance rather than accepting placeholder fields', () => {
    const root = sourceSandbox();
    const state = collectSourceState(root);
    const report = runFreshMeasurement(recipe);
    const provenance = buildRunProvenance(state, report.fixture);
    expect(provenance.fixtureHash).toBe(report.provenance.fixtureHash);
    expect(() =>
      buildRunProvenance({ ...state, sourceSha: 'placeholder' }, report.fixture)
    ).toThrow(/provenance/u);
  });
});
