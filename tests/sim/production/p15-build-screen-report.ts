import { assertSourceStable, type SourceState } from './provenance';

/** Retain observations before propagating a failed screen contract. */
export function finishP15ScreenReport<
  T extends { sourceBefore: SourceState; sourceAfter: SourceState }
>(
  report: T,
  publish: (result: T & { status: string; failure: string | null }) => void,
  executionFailure?: { error: unknown }
) {
  const failures: unknown[] = executionFailure ? [executionFailure.error] : [];
  try {
    assertSourceStable(report.sourceBefore, report.sourceAfter);
  } catch (error) {
    failures.push(error);
  }
  const result = {
    ...report,
    status: failures.length ? 'stopped' : 'complete',
    failure: failures.length
      ? failures.map((error) => String(error instanceof Error ? error.stack : error)).join('\n')
      : null
  };
  try {
    publish(result);
  } catch (error) {
    if (failures.length)
      throw new AggregateError(
        [...failures, error],
        'P15 report publication failed; original failures retained'
      );
    throw error;
  }
  if (failures.length > 1) throw new AggregateError(failures, 'P15 screen contracts failed');
  if (failures.length === 1) throw failures[0];
  return result;
}
