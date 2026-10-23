import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { closeSync, openSync, unlinkSync, writeFileSync } from 'node:fs';
import { snapshotStores, exportCurrentSave } from '@/stores/persistence';
import { decodeSave } from '@/engine/save/validate';
import type { SaveCurrent } from '@/engine/types/save';
import { observeEarnedState } from './earned-state';
import { encodeObservation, hashObservation } from './earned-report';
import { validateOutputPath, writeNewReport } from './provenance';

/** Preflight every new leaf before a v2 route can start; never overwrite earlier evidence. */
export function validateFreshNativeOutputs(root: string, output: string) {
  return { report: validateOutputPath(root, output),
    nativeExport: validateOutputPath(root, `${output}.native-export.json`),
    nativeCapture: validateOutputPath(root, `${output}.native-capture.json`) };
}

/** Authentic live capture only: never accepts an observation, save or checkpoint input. */
export function captureFreshNativeSave() {
  const beforeHash = hashObservation(observeEarnedState());
  let snapshot: SaveCurrent | null = null;
  let exportedJson: string | null = null;
  let decoded: SaveCurrent | null = null;
  let failure: string | null = null;
  try {
    const live = snapshotStores();
    assert.ok(live, 'Native capture requires a live character');
    snapshot = structuredClone(live);
    exportedJson = exportCurrentSave();
    assert.ok(exportedJson, 'Native export requires a live character');
    decoded = decodeSave(JSON.parse(exportedJson) as unknown);
    assert.ok(isDeepStrictEqual(snapshot, decoded), 'Native decoder changed the captured save');
  } catch (error) {
    // Preserve the primary route result and any native payload already captured.
    // The opt-in driver publishes the report before failing its capture contract.
    failure = error instanceof Error ? error.message : String(error);
  }
  const afterHash = hashObservation(observeEarnedState());
  if (beforeHash !== afterHash) failure = `${failure ? `${failure}; ` : ''}Native capture changed earned state`;
  const idleMetadata = { snapshot: snapshot?.meta.idleState ?? null, exportedDecoded: decoded?.meta.idleState ?? null,
    matches: snapshot !== null && decoded !== null ? isDeepStrictEqual(snapshot.meta.idleState, decoded.meta.idleState) : null,
    equalOutsideIdleMetadata: snapshot !== null && decoded !== null ? isDeepStrictEqual(
      { ...snapshot, meta: { ...snapshot.meta, idleState: null } },
      { ...decoded, meta: { ...decoded.meta, idleState: null } }) : null };
  return {
    kind: 'live-production-snapshot-and-export' as const,
    status: failure === null ? 'captured' as const : 'failed' as const,
    beforeHash, afterHash, snapshot, exportedJson, decoded,
    snapshotHash: snapshot === null ? null : hashObservation(snapshot),
    exportedSha256: exportedJson === null ? null : createHash('sha256').update(exportedJson).digest('hex'),
    decodedHash: decoded === null ? null : hashObservation(decoded),
    failure, idleMetadata,
    limitations: ['Captured through production snapshot/export before realm cleanup; no observation reconstruction.',
      'Export projects idle metadata through readIdleBonus; snapshot retains raw idleState. Both are retained and compared separately.',
      'No IndexedDB write/read, browser Save/Continue, offline reconciliation or C2 acceptance is established.']
  };
}

export interface FreshNativeArtifacts { nativeExport: string | null; nativeCapture: string | null }

/** Exact bytes, exclusive leaf, with only our newly created partial file removed on failure. */
function writeExactExport(root: string, output: string, exportedJson: string) {
  const destination = validateOutputPath(root, output);
  const descriptor = openSync(destination, 'wx', 0o600);
  let closed = false;
  try {
    writeFileSync(descriptor, exportedJson, 'utf8');
    closeSync(descriptor);
    closed = true;
  } catch (error) {
    const failures: unknown[] = [error];
    if (!closed) try { closeSync(descriptor); } catch (closeError) { failures.push(closeError); }
    try { unlinkSync(destination); } catch (cleanupError) { failures.push(cleanupError); }
    throw new AggregateError(failures, 'Native export write failed; newly owned output cleanup attempted');
  }
}

/** Called while the stopped live realm still exists, before cleanup or report assertions. */
export function publishFreshNativeCapture(root: string, output: string,
  capture: ReturnType<typeof captureFreshNativeSave>, provenance: Record<string, unknown>) {
  const artifacts: FreshNativeArtifacts = {
    nativeExport: null, nativeCapture: null
  };
  try {
    const paths = validateFreshNativeOutputs(root, output);
    if (capture.exportedJson !== null) {
      // This is the exact production export string, not a serialized observation or rebuilt save.
      writeExactExport(root, paths.nativeExport, capture.exportedJson);
      artifacts.nativeExport = paths.nativeExport;
    }
    writeNewReport(root, paths.nativeCapture, encodeObservation({ capture, provenance }));
    artifacts.nativeCapture = paths.nativeCapture;
  } catch (error) {
    throw new Error(`Native capture publication failed; retained native evidence: ${JSON.stringify(artifacts)}`, { cause: error });
  }
  return artifacts;
}

/** Primary publication is separate so native evidence survives cleanup/provenance/assertion failures. */
export function publishFreshCampaignReport(root: string, output: string, report: Record<string, unknown>,
  artifacts: FreshNativeArtifacts = { nativeExport: null, nativeCapture: null }) {
  try {
    writeNewReport(root, output, encodeObservation({ ...report, nativeCaptureArtifacts: artifacts }));
  } catch (error) {
    const stopped = { status: report.status, refusal: report.refusal,
      nativePublicationFailure: report.nativePublicationFailure };
    throw new Error(`Fresh report publication failed; original stop: ${JSON.stringify(stopped)}; retained native evidence: ${JSON.stringify(artifacts)}`,
      { cause: { error, originalStop: stopped, nativeSaveCapture: report.nativeSaveCapture } });
  }
  return artifacts;
}
