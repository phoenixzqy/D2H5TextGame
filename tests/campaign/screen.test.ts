import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { collectSourceState, assertSourceStable, validateOutputPath, writeNewReport } from '../sim/production/provenance';
import { encodeObservation } from '../sim/contracts/observation-codec';
import { campaignRequest, campaignRecoveryMode } from './policy';
import { assertCampaignRecovery } from './recovery-audit';
import { collectCampaignManifest } from './manifest';
import { openCampaignJournal } from './journal';
import { resolveActFiveRoute } from './act5-route';
import { campaignExecution, assertCampaignExecutionProfile } from './execution';
import { campaignInventoryPolicy } from './inventory-policy';
import { campaignTimestampArgument } from './online-clock';

const execution = campaignExecution(process.env.CAMPAIGN_EXECUTION);

it('records a fresh bounded campaign without promoting nonwins to viability', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const phase = process.env.CAMPAIGN_PHASE, id = process.env.CAMPAIGN_PROFILE;
  campaignRequest(phase, id);
  if (phase && id) assertCampaignExecutionProfile(execution, phase, id);
  const recovery = campaignRecoveryMode(process.env.CAMPAIGN_RECOVERY);
  const inventoryPolicy = campaignInventoryPolicy(process.env.CAMPAIGN_INVENTORY);
  const creationTimestamp = campaignTimestampArgument(process.env.CAMPAIGN_TIMESTAMP);
  const act5Route = resolveActFiveRoute(process.env.CAMPAIGN_ACT5_ROUTE);
  if (phase !== 'act5' && act5Route !== 'minimum')
    throw new Error('Full Act V route requires the Act V campaign phase');
  if (!phase || !id || !process.env.CAMPAIGN_REPORT) throw new Error('Campaign requires an exclusive external report');
  const output = validateOutputPath(root, process.env.CAMPAIGN_REPORT);
  const sourceBefore = collectSourceState(root);
  const campaignBefore = collectCampaignManifest(root);
  const journal = openCampaignJournal(validateOutputPath(root, `${output}.journal.jsonl.gz`));
  try {
    const { runCampaign } = await import('./native-runner');
    const report = runCampaign(phase, id, record => { journal.append(record); }, recovery, act5Route, execution.mode, inventoryPolicy, creationTimestamp);
    const sourceAfter = collectSourceState(root);
    const campaignAfter = collectCampaignManifest(root);
    writeNewReport(root, output, encodeObservation({ ...report, sourceBefore, sourceAfter,
      campaignBefore, campaignAfter, journalFormat: 'gzip-jsonl-members-v1',
      journalBytes: journal.bytes, journalUncompressedBytes: journal.uncompressedBytes }));
    assertSourceStable(sourceBefore, sourceAfter);
    expect(campaignAfter).toEqual(campaignBefore);
    expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
    expect(report.waves.length).toBeGreaterThan(0);
    expect(report.preparationAudit).not.toBeNull();
    expect(report.openingAudit).not.toBeNull();
    expect(report.acquisitionAudit).not.toBeNull();
    expect(report.javelinTrainingAudit).not.toBeNull();
    expect(report.javelinAcquisitionAudit).not.toBeNull();
    if (report.actTwoAreaPreparation) expect(report.actTwoAreaPreparationAudit).not.toBeNull();
    if (report.actThreeAreaPreparation) expect(report.actThreeAreaPreparationAudit).not.toBeNull();
    if (report.actFourAreaPreparation) expect(report.actFourAreaPreparationAudit).not.toBeNull();
    if (report.actFiveAreaPreparation) expect(report.actFiveAreaPreparationAudit).not.toBeNull();
    assertCampaignRecovery(report.recovery, report.waves, report.gameplayStatus,
      new Set([...(report.preparationAudit?.nonwinOrdinals ?? []), ...(report.novaActThreeAudit?.nonwinOrdinals ?? []),
        ...(report.javelinTrainingAudit?.nonwinOrdinals ?? []),
        ...(report.javelinAcquisitionAudit?.nonwinOrdinals ?? []),
        ...(report.acquisitionAudit?.nonwinOrdinals ?? [])]), report.openingAudit ?? undefined,
      report.actTwoAreaPreparationAudit ?? report.novaActTwoAudit ?? undefined, [
        ...(report.actThreeAreaPreparationAudit ? [{ act: 3 as const,
          nonwinOrdinals: report.actThreeAreaPreparationAudit.nonwinOrdinals }] : []),
        ...(report.actFourAreaPreparationAudit ? [{ act: 4 as const,
          nonwinOrdinals: report.actFourAreaPreparationAudit.nonwinOrdinals }] : []),
        ...(report.actFiveAreaPreparationAudit ? [{ act: 5 as const,
          nonwinOrdinals: report.actFiveAreaPreparationAudit.nonwinOrdinals }] : [])
      ]);
    console.info(JSON.stringify({ phase, id, status: report.gameplayStatus, totals: report.totals }));
  } finally { journal.close(); }
}, execution.maxWallMs + 60_000);
