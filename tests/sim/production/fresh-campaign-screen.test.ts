import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { parseFreshCampaignStage } from './fresh-campaign-policy';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

it('runs the declared fresh preparation stage once and restores its production realm', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const stage = parseFreshCampaignStage(process.env.FRESH_CAMPAIGN_STAGE);
  const output = process.env.FRESH_CAMPAIGN_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const beforeImport = collectSourceState(root);
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
    const report = runFreshCampaignScreen(stage, beforeImport);
    expect(report.kind).toBe('fresh-production-service-screen');
    expect(report.created.player.player).toMatchObject({ name: 'Earned Act I', class: 'sorceress',
      level: 1, experience: 0, statPoints: 0, skillPoints: 1 });
    expect(report.created.inventory.backpack).toEqual([]);
    expect(report.created.map.challengeOrdinals).toEqual({ normal: 0, nightmare: 0 });
    expect(report.waves.length).toBeGreaterThan(0);
    expect(report.waves.length).toBeLessThanOrEqual(stage === 'accepted-preparation' ? 40 : 1);
    expect(report.waves.map(wave => wave.handle.challengeOrdinal)).toEqual(report.waves.map((_, index) => index));
    expect(report.waves.filter(wave => !wave.wonAlive)).toHaveLength(report.firstNonwin ? 1 : 0);
    if (report.firstNonwin) expect(report.waves.at(-1)?.wonAlive).toBe(false);
    if (stage === 'one-preparation-wave') expect(report.status).toBe('stage-complete');
    expect(observeEarnedState()).toEqual(caller);
    expect(useHydrationStore.getState().status).toBe(hydration);
    expect(getIdleEliteMisses()).toBe(pity);
    expect(Date.now).toBe(now);
    expect(hasActiveSubAreaRun()).toBe(false);
    assertSourceStable(beforeImport, report.sourceAfter);
    if (output !== undefined) {
      const { encodeObservation } = await import('./earned-report');
      writeNewReport(root, output, encodeObservation(report));
    }
    console.info(JSON.stringify({ stage, status: report.status, waves: report.waves.length,
      level: report.terminal.player.player?.level, wallSeconds: report.wallSeconds }));
  } finally { for (const restore of restorers) restore(); }
}, 30_000);

it('rejects an undeclared campaign stage before gameplay can start', () => {
  expect(() => parseFreshCampaignStage('retry-until-win')).toThrow('Unknown fresh campaign stage');
});
