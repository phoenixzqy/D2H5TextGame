import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { collectSourceState } from './provenance';
import { finishP15ScreenReport } from './p15-build-screen-report';

const source = collectSourceState(fileURLToPath(new URL('../../../', import.meta.url)));

it('publishes source drift as stopped with all observations preserved before rethrowing', () => {
  const input = {
    sourceBefore: source,
    sourceAfter: { ...source, sourceTreeHash: '0'.repeat(64) },
    attempts: [{ build: 'cold', seed: 1 }],
    pending: { build: 'fire', waves: [{ index: 0 }] }
  };
  const published: { status: string; failure: string | null }[] = [];
  expect(() => finishP15ScreenReport(input, (result) => published.push(result))).toThrow(
    'source/data drift'
  );
  expect(published).toHaveLength(1);
  expect(published[0]).toMatchObject({ ...input, status: 'stopped' });
  expect(published[0]?.failure).toContain('source/data drift');
});

it('preserves both execution and source-validation failures in the report and thrown error', () => {
  const original = new Error('injected execution failure');
  const published: { status: string; failure: string | null }[] = [];
  let caught: unknown;
  try {
    finishP15ScreenReport(
      { sourceBefore: source, sourceAfter: { ...source, dataHash: 'f'.repeat(64) } },
      (result) => published.push(result),
      { error: original }
    );
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AggregateError);
  expect((caught as AggregateError).errors[0]).toBe(original);
  expect((caught as AggregateError).errors[1]).toMatchObject({
    message: 'Production source/data drift during measurement'
  });
  expect(published[0]?.status).toBe('stopped');
  expect(published[0]?.failure).toContain('injected execution failure');
  expect(published[0]?.failure).toContain('source/data drift');
});

it('publishes complete only for stable source, and preserves an execution error identity', () => {
  const report = { sourceBefore: source, sourceAfter: source, attempts: [1, 2], pending: null };
  const published: { status: string; failure: string | null }[] = [];
  expect(finishP15ScreenReport(report, (result) => published.push(result))).toMatchObject({
    ...report,
    status: 'complete',
    failure: null
  });
  const original = new Error('injected failure with stable source');
  expect(() =>
    finishP15ScreenReport(report, (result) => published.push(result), { error: original })
  ).toThrow(original);
  expect(published[1]?.status).toBe('stopped');
  expect(published[1]?.failure).toContain(original.message);
});
