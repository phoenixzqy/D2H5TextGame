import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { nativeContinuationPolicy as policy, parseNativeContinuation } from './fresh-campaign-continuation-policy';
import { collectSourceState, validateOutputPath } from './provenance';
import type { FreshNativeArtifacts } from './fresh-campaign-save';

const selected = parseNativeContinuation(process.env.EARNED_NATIVE_CONTINUATION);

it.skipIf(selected === null)('runs one declared authentic saved-domain Rocky Waste continuation and restores its caller', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.EARNED_NATIVE_CONTINUATION_REPORT_PATH;
  if (output === undefined) throw new Error('Native continuation requires a new external output path');
  for (const path of [output, `${output}.native-export.json`, `${output}.native-capture.json`]) validateOutputPath(root, path);
  const beforeImport = collectSourceState(root);
  const { observeEarnedState } = await import('./earned-state');
  const { useCombatStore } = await import('@/stores/combatStore');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { hasActiveSubAreaRun } = await import('@/stores/combatHelpers');
  const { getIdleEliteMisses } = await import('@/stores/idleElitePity');
  const { runNativeContinuationScreen } = await import('./fresh-campaign-continuation');
  const { publishFreshNativeCapture, publishFreshCampaignReport } = await import('./fresh-campaign-save');
  const caller = observeEarnedState();
  const combat = useCombatStore.getState();
  const hydration = useHydrationStore.getState();
  const now = Date.now;
  const pity = getIdleEliteMisses();
  let artifacts: FreshNativeArtifacts | undefined;
  const report = runNativeContinuationScreen(beforeImport, (capture, context) => {
    artifacts = publishFreshNativeCapture(root, output, capture, context);
  });
  publishFreshCampaignReport(root, output, report, artifacts);
  expect(report.executionFailure).toBeNull();
  expect(report.provenanceFailure).toBeNull();
  expect(report.cleanupFailures).toEqual([]);
  expect(report.nativePublicationFailure).toBeNull();
  expect(report.nativeCaptureFailure).toBeNull();
  expect(report.nativeSaveCapture?.status, report.nativeSaveCapture?.failure ?? undefined).toBe('captured');
  expect(report.nativeSaveCapture?.beforeHash).toBe(report.nativeSaveCapture?.afterHash);
  expect(observeEarnedState()).toEqual(caller);
  expect(useCombatStore.getState()).toEqual(combat);
  expect(useHydrationStore.getState()).toEqual(hydration);
  expect(Date.now).toBe(now);
  expect(getIdleEliteMisses()).toBe(pity);
  expect(hasActiveSubAreaRun()).toBe(false);
  expect(report.waves.length).toBeLessThanOrEqual(policy.maxWaves);
  expect(report.waves.filter(wave => wave.opening.outcome?.winner !== 'player')).toHaveLength(report.status === 'campaign-nonwin' ? 1 : 0);
  if (report.handle) expect(report.handle.challengeOrdinal).toBe(policy.expectedOrdinal);
  if (report.status === 'stage-complete') {
    expect(report.waves).toHaveLength(policy.maxWaves);
    expect(report.waves.at(-1)?.advanceResult).toBe('victory');
  }
  console.info(JSON.stringify({ experiment: selected, status: report.status, waves: report.waves.length,
    ordinal: report.handle?.challengeOrdinal, wallSeconds: report.wallSeconds }));
}, 30_000);

it('rejects undeclared saved-domain continuation variants before runtime imports', () => {
  expect(() => parseNativeContinuation('retry-radament')).toThrow('Unknown earned native continuation experiment');
  expect(parseNativeContinuation(undefined)).toBeNull();
});
