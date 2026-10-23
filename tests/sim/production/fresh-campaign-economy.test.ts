import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { economyPolicy as policy, parseEconomyExperiment } from './fresh-campaign-economy-policy';
import { collectSourceState, validateOutputPath } from './provenance';
import type { FreshNativeArtifacts } from './fresh-campaign-save';

const selected = parseEconomyExperiment(process.env.EARNED_ECONOMY);

it.skipIf(selected === null)('runs one bounded authenticated earned farming policy and restores its caller', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.EARNED_ECONOMY_REPORT_PATH;
  if (output === undefined) throw new Error('Native continuation requires a new external output path');
  for (const path of [output, `${output}.native-export.json`, `${output}.native-capture.json`]) validateOutputPath(root, path);
  const beforeImport = collectSourceState(root);
  const { observeEarnedState } = await import('./earned-state');
  const { useCombatStore } = await import('@/stores/combatStore');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { hasActiveSubAreaRun } = await import('@/stores/combatHelpers');
  const { getIdleEliteMisses } = await import('@/stores/idleElitePity');
  const { runEconomyScreen } = await import('./fresh-campaign-economy');
  const { publishFreshNativeCapture, publishFreshCampaignReport } = await import('./fresh-campaign-save');
  const caller = observeEarnedState();
  const combat = useCombatStore.getState();
  const hydration = useHydrationStore.getState();
  const now = Date.now;
  const pity = getIdleEliteMisses();
  let artifacts: FreshNativeArtifacts | undefined;
  const report = runEconomyScreen(beforeImport, (capture, context) => {
    artifacts = publishFreshNativeCapture(root, output, capture, context);
  }, event => { console.info(JSON.stringify(event)); });
  publishFreshCampaignReport(root, output, report, artifacts);
  expect(report.executionFailure).toBeNull();
  expect(report.provenanceFailure).toBeNull();
  expect(report.cleanupFailures).toEqual([]);
  expect(report.nativePublicationFailure).toBeNull();
  expect(report.nativeSaveCapture.status, report.nativeSaveCapture.failure ?? undefined).toBe('captured');
  expect(report.nativeSaveCapture.beforeHash).toBe(report.nativeSaveCapture.afterHash);
  expect(observeEarnedState()).toEqual(caller);
  expect(useCombatStore.getState()).toEqual(combat);
  expect(useHydrationStore.getState()).toEqual(hydration);
  expect(Date.now).toBe(now);
  expect(getIdleEliteMisses()).toBe(pity);
  expect(hasActiveSubAreaRun()).toBe(false);
  expect(report.farmWaves).toBeLessThanOrEqual(policy.maxFarmWaves);
  expect(report.runs.filter(run => run.phase === 'farm').length).toBeLessThanOrEqual(policy.maxFarmLaunches);
  expect(report.runs.filter(run => run.phase === 'target').length).toBeLessThanOrEqual(1);
  expect(report.activePlaybackMs).toBeLessThanOrEqual(policy.totalBudgetMs);
  const nonwins = report.runs.flatMap(run => run.waves).filter(wave => wave.played && wave.opening.outcome.winner !== 'player');
  expect(nonwins).toHaveLength(report.status === 'campaign-nonwin' ? 1 : 0);
  if (report.status === 'target-complete') {
    expect(report.runs.at(-1)?.phase).toBe('target');
    expect(report.runs.at(-1)?.waves.at(-1)?.advanceResult).toBe('victory');
    expect(report.terminal.map.questProgress[policy.radament]?.rewardClaimed).toBe(true);
  }
  console.info(JSON.stringify({ experiment: selected, status: report.status, runs: report.runs.length,
    farmWaves: report.farmWaves, activePlaybackMs: report.activePlaybackMs, wallSeconds: report.wallSeconds }));
}, 1_800_000);

it('rejects undeclared saved-domain continuation variants before runtime imports', () => {
  expect(() => parseEconomyExperiment('retry-radament')).toThrow('Unknown earned farming experiment');
  expect(parseEconomyExperiment(undefined)).toBeNull();
});
