/** Explicit single-checkpoint measurement. No default sample, batch or retry. */
import { createHash } from 'node:crypto';
import { closeSync, fsyncSync, lstatSync, mkdtempSync, openSync, readFileSync,
  readdirSync, realpathSync, rmSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argumentsList = process.argv.slice(2);
const names = ['--fixture', '--save', '--output'];
if (argumentsList.length !== 6 || names.some(name => argumentsList.filter(value => value === name).length !== 1))
  throw new Error('Usage: npm run sim:checkpoint -- --fixture /absolute/fixture.json --save /absolute/save.json --output /absolute/new-report.json');
const options = new Map();
for (let index = 0; index < argumentsList.length; index += 2) {
  const name = argumentsList[index], value = argumentsList[index + 1];
  if (!names.includes(name) || !value || !isAbsolute(value)) throw new Error('Each option requires an absolute local path');
  options.set(name, value);
}
const fixturePath = options.get('--fixture'), savePath = options.get('--save');
const fixtureBytes = readFileSync(fixturePath), saveBytes = readFileSync(savePath);
const fixture = JSON.parse(fixtureBytes.toString('utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// The shared collector deliberately covers production sources; include its
// diagnostic contracts as an additional manifest before loading gameplay.
function contracts() {
  const entries = [];
  function visit(path) {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error('Diagnostic contract symlinks are unsupported');
    if (stat.isDirectory()) for (const name of readdirSync(path).sort()) visit(join(path, name));
    else if (stat.isFile()) {
      const bytes = readFileSync(path);
      entries.push({ path: relative(root, path), byteLength: bytes.length, sha256: hash(bytes) });
    } else throw new Error('Unsupported diagnostic contract input');
  }
  visit(join(root, 'tests/sim/contracts'));
  return entries;
}
function errorDetails(error) {
  return error instanceof Error ? {
    name: error.name, message: error.message, stack: error.stack,
    ...(error instanceof AggregateError ? { errors: error.errors.map(errorDetails) } : {})
  } : { value: String(error) };
}

const cache = mkdtempSync(join(realpathSync(tmpdir()), 'd2-checkpoint-measure-'));
let server, journal, provenance, encodeObservation, output;
let sourceBefore, sourceAfter, contractsBefore, contractsAfter, attempt;
let closed = false;
let cacheRemoved = false;
const errors = [];
const started = performance.now();
const journalPath = `${options.get('--output')}.journal.jsonl`;
try {
  server = await createServer({
    root, configFile: false, cacheDir: cache, appType: 'custom',
    resolve: { alias: { '@': join(root, 'src') } },
    server: { middlewareMode: true, watch: null, hmr: false, preTransformRequests: false }
  });
  provenance = await server.ssrLoadModule('/tests/sim/production/provenance.ts');
  output = provenance.validateOutputPath(root, options.get('--output'));
  provenance.validateOutputPath(root, journalPath);
  sourceBefore = provenance.collectSourceState(root);
  contractsBefore = contracts();
  // Value encoding loads with the measured contracts, before production stores.
  ({ encodeObservation } = await server.ssrLoadModule('/tests/sim/contracts/observation-codec.ts'));
  journal = openSync(journalPath, 'wx', 0o600);
  function record(value) {
    writeSync(journal, `${JSON.stringify(encodeObservation(value))}\n`);
    fsyncSync(journal);
  }
  record({ phase: 'prepared', fixture, fixtureSha256: hash(fixtureBytes), saveSha256: hash(saveBytes),
    sourceBefore, contractsBefore, pid: process.pid });
  const { runCheckpointAttempt } = await server.ssrLoadModule('/tests/sim/production/checkpoint-attempt.ts');
  provenance.assertSourceStable(sourceBefore, provenance.collectSourceState(root));
  if (JSON.stringify(contractsBefore) !== JSON.stringify(contracts())) throw new Error('Contract source drift during import');
  attempt = runCheckpointAttempt(fixture, saveBytes, wave => record({ phase: 'settled-wave', wave }));
  record({ phase: 'native-terminal', completeVictory: attempt.completeVictory,
    unreachedWaveCount: attempt.unreachedWaveCount });
} catch (error) { errors.push(error); }
finally {
  if (sourceBefore) {
    try {
      sourceAfter = provenance.collectSourceState(root);
      contractsAfter = contracts();
      provenance.assertSourceStable(sourceBefore, sourceAfter);
      if (JSON.stringify(contractsBefore) !== JSON.stringify(contractsAfter)) throw new Error('Contract source drift during measurement');
    } catch (error) { errors.push(error); }
  }
  if (journal !== undefined) {
    try { closeSync(journal); } catch (error) { errors.push(error); }
  }
  if (server) {
    try { await server.close(); closed = true; } catch (error) { errors.push(error); }
  } else closed = true;
  if (closed) {
    try {
      if (realpathSync(cache) !== cache) throw new Error('Task cache identity changed; refusing cleanup');
      rmSync(cache, { recursive: true });
      cacheRemoved = true;
    } catch (error) { errors.push(error); }
  }
}
if (output && encodeObservation) {
  provenance.writeNewReport(root, output, encodeObservation({
    reportVersion: 3, observationEncoding: 'd2h5-observation-v1',
    status: errors.length ? 'failed' : 'completed',
    fixturePath, savePath, fixtureSha256: hash(fixtureBytes), saveSha256: hash(saveBytes),
    sourceBefore, sourceAfter, contractsBefore, contractsAfter, attempt,
    errors: errors.map(errorDetails), journalPath,
    cleanup: { serverClosed: closed, taskCache: cache, removed: cacheRemoved },
    wallSeconds: (performance.now() - started) / 1000,
    scope: { directService: true, campaignSuccessor: false, balanceAcceptance: false }
  }));
}
if (errors.length) throw new AggregateError(errors, `Checkpoint measurement failed; journal path: ${journalPath}; task cache removed: ${cacheRemoved}; cache path: ${cache}`);
console.log(JSON.stringify({ output, journalPath, waves: attempt.waves.length,
  outcomes: attempt.waves.map(wave => wave.metrics.outcome), logicalMs: attempt.logicalMs,
  wallSeconds: attempt.wallSeconds }));
