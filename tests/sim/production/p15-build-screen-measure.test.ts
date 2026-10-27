import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { closeSync, fsyncSync, openSync, writeFileSync } from 'node:fs';
import type { P15Attempt, P15Wave } from './p15-build-screen';
import { collectSourceState, validateOutputPath, writeNewReport } from './provenance';
import { finishP15ScreenReport } from './p15-build-screen-report';

it('measures frozen paid Cold/Fire candidates, keeping native nonwins and raw reward identities', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const stage = process.env.P15_SCREEN_STAGE ?? 'benchmark';
  if (stage !== 'benchmark' && stage !== 'screen') throw new Error('Invalid P15 stage');
  const output = process.env.P15_SCREEN_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const sourceBefore = collectSourceState(root);
  const { P15_POLICY: policy } = await import('./p15-build-screen-policy');
  const { runP15Attempt, compareP15Attempts } = await import('./p15-build-screen');
  const { encodeObservation, hashObservation } = await import('./earned-report');
  const { observeEarnedState, observeStore } = await import('./earned-state');
  const { useCombatStore } = await import('@/stores/combatStore');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { getIdleEliteMisses } = await import('@/stores/idleElitePity');
  const caller = observeEarnedState(),
    combat = observeStore(useCombatStore);
  const now = Date.now,
    pity = getIdleEliteMisses(),
    hydration = useHydrationStore.getState().status;
  const seeds = stage === 'benchmark' ? [policy.seeds[0]] : [...policy.seeds];
  const attempts: (P15Attempt & { repetition: number })[] = [];
  const comparisons: ReturnType<typeof compareP15Attempts>[] = [];
  let pending: { build: string; seed: number; repetition: number; waves: P15Wave[] } | null = null;
  const started = performance.now();
  // An exclusive external journal survives interruption before the final report.
  const journal =
    output === undefined
      ? undefined
      : openSync(validateOutputPath(root, `${output}.waves.jsonl`), 'wx');
  const record = (entry: unknown) => {
    if (journal === undefined) return;
    writeFileSync(journal, `${JSON.stringify(encodeObservation(entry))}\n`, 'utf8');
    fsyncSync(journal);
  };
  let failed = false,
    originalFailure: unknown;
  try {
    record({ kind: 'p15-screen-header', stage, policy, sourceBefore });
    for (const seed of seeds) {
      for (const repetition of [1, 2])
        for (const build of ['cold', 'fire'] as const) {
          if (performance.now() - started > (stage === 'benchmark' ? 120_000 : 600_000))
            throw new Error('P15 declared batch wall budget reached; retain partial cohort');
          pending = { build, seed, repetition, waves: [] };
          const partial = pending;
          const attempt = runP15Attempt(build, seed, (wave) => {
            partial.waves.push(wave);
            record({ kind: 'settled-wave', build, seed, repetition, wave });
          });
          attempts.push({ ...attempt, repetition });
          pending = null;
          expect(isDeepStrictEqual(observeEarnedState(), caller)).toBe(true);
          expect(isDeepStrictEqual(observeStore(useCombatStore), combat)).toBe(true);
          expect(useHydrationStore.getState().status).toBe(hydration);
          expect(getIdleEliteMisses()).toBe(pity);
          expect(Date.now).toBe(now);
        }
      for (const build of ['cold', 'fire'] as const) {
        const rows = attempts.filter((attempt) => attempt.seed === seed && attempt.build === build);
        const first = rows[0],
          second = rows[1];
        if (!first || !second) throw new Error('P15 missing repeated attempt');
        const comparison = compareP15Attempts(first, second);
        comparisons.push(comparison);
        expect(comparison.preparationEqual).toBe(true);
        expect(comparison.rawRecordingsEqual).toBe(true);
        expect(comparison.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(true);
      }
    }
    expect(attempts).toHaveLength(seeds.length * 4);
  } catch (error) {
    failed = true;
    originalFailure = error;
  } finally {
    if (journal !== undefined) {
      try {
        closeSync(journal);
      } catch (error) {
        originalFailure = failed
          ? new AggregateError([originalFailure, error], 'P15 journal close failed')
          : error;
        failed = true;
      }
    }
  }
  const sourceAfter = collectSourceState(root);
  const report = finishP15ScreenReport(
    {
      version: 1,
      kind: 'diagnostic-two-build-late-campaign-service-screen',
      stage,
      limitation:
        'Mature earned gear, isolated paid candidate respecs; no genuine successors, fresh acquisition, matched-level viability, fourteen-build, pacing, browser or human acceptance.',
      resourcePolicy:
        'Preserve saved pools through setup; native admission refills combat pools; no harness healing or carry writes.',
      allocatorPolicy:
        'Process-global item allocator is not reset; raw identities retained; only top-level new Item.id omitted for semantic reward comparison.',
      policy,
      policyHash: hashObservation(policy),
      sourceBefore,
      sourceAfter,
      attempts,
      comparisons,
      pending,
      wallSeconds: (performance.now() - started) / 1000
    },
    (result) => {
      if (output !== undefined) writeNewReport(root, output, encodeObservation(result));
    },
    failed ? { error: originalFailure } : undefined
  );
  console.info(
    JSON.stringify({
      stage,
      attempts: attempts.length,
      wallSeconds: report.wallSeconds,
      outcomes: attempts.map((attempt) => ({
        build: attempt.build,
        seed: attempt.seed,
        repetition: attempt.repetition,
        wins: attempt.waves.filter((wave) => wave.metrics.outcome === 'victory').length,
        total: attempt.handle.totalWaves,
        terminal: attempt.waves.at(-1)?.metrics.outcome
      }))
    })
  );
}, 660_000);
