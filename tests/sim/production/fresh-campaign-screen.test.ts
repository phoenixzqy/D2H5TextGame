import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { parseFreshCampaignStage } from './fresh-campaign-policy';
import { assertSourceStable, collectSourceState, validateOutputPath } from './provenance';
import type { FreshNativeArtifacts } from './fresh-campaign-save';

it('runs the declared fresh preparation stage once and restores its production realm', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const stage = parseFreshCampaignStage(process.env.FRESH_CAMPAIGN_STAGE);
  const output = process.env.FRESH_CAMPAIGN_REPORT_PATH;
  if (stage === 'native17-v2-far-oasis') {
    if (output === undefined) throw new Error('Fresh v2 requires a new external report path for native capture evidence');
    for (const path of [output, `${output}.native-export.json`, `${output}.native-capture.json`])
      validateOutputPath(root, path);
  }
  if (output !== undefined) validateOutputPath(root, output);
  const beforeImport = collectSourceState(root);
  const { publishFreshNativeCapture, publishFreshCampaignReport } = await import('./fresh-campaign-save');
  const { captureEarnedRestorers, observeEarnedState } = await import('./earned-state');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { getIdleEliteMisses } = await import('@/stores/idleElitePity');
  const { hasActiveSubAreaRun } = await import('@/stores/combatHelpers');
  const { runFreshCampaignScreen } = await import('./fresh-campaign-screen');
  const caller = observeEarnedState();
  const hydration = useHydrationStore.getState().status;
  const pity = getIdleEliteMisses();
  const now = Date.now;
  const restorers = captureEarnedRestorers();
  try {
    let artifacts: FreshNativeArtifacts | undefined;
    const report = runFreshCampaignScreen(stage, beforeImport, output === undefined ? undefined : (capture, context) => {
      artifacts = publishFreshNativeCapture(root, output, capture, context);
    });
    if (output !== undefined) publishFreshCampaignReport(root, output, report, artifacts);
    expect(report.kind).toBe('fresh-production-service-screen');
    expect(report.created.player.player).toMatchObject({ name: 'Earned Act I', class: 'sorceress',
      level: 1, experience: 0, statPoints: 0, skillPoints: 1 });
    expect(report.created.inventory.backpack).toEqual([]);
    expect(report.created.map.challengeOrdinals).toEqual({ normal: 0, nightmare: 0 });
    expect(report.waves.length).toBeGreaterThan(0);
    expect(report.waves.length).toBeLessThanOrEqual(stage === 'native17-act2' || stage === 'native17-v2-far-oasis'
      ? 492 : stage === 'accepted-preparation' ? 40 : 1);
    const ordinals = [...new Set(report.waves.map(wave => wave.handle.challengeOrdinal))];
    expect(ordinals).toEqual(ordinals.map((_, index) => index));
    expect(report.waves.filter(wave => !wave.wonAlive)).toHaveLength(report.firstNonwin ? 1 : 0);
    if (report.firstNonwin) expect(report.waves.at(-1)?.wonAlive).toBe(false);
    if (stage === 'one-preparation-wave') expect(report.status).toBe('stage-complete');
    expect(observeEarnedState()).toEqual(caller);
    expect(useHydrationStore.getState().status).toBe(hydration);
    expect(getIdleEliteMisses()).toBe(pity);
    expect(Date.now).toBe(now);
    expect(hasActiveSubAreaRun()).toBe(false);
    assertSourceStable(beforeImport, report.sourceAfter);
    if (stage === 'native17-v2-far-oasis') {
      // Preserve the primary route evidence and partial native capture before this contract fails.
      expect(report.nativePublicationFailure).toBeNull();
      expect(report.nativeSaveCapture?.status, report.nativeSaveCapture?.failure ?? undefined).toBe('captured');
      expect(report.nativeSaveCapture?.beforeHash).toBe(report.nativeSaveCapture?.afterHash);
    }
    console.info(JSON.stringify({ stage, status: report.status, waves: report.waves.length,
      level: report.terminal.player.player?.level, wallSeconds: report.wallSeconds }));
  } finally { for (const restore of restorers) restore(); }
}, 120_000);

it('rejects an undeclared campaign stage before gameplay can start', () => {
  expect(() => parseFreshCampaignStage('retry-until-win')).toThrow('Unknown fresh campaign stage');
});
