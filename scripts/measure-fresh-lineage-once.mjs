/** Explicit single-use launcher. No CLI Vitest wrapper, restarts or installation. */
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, realpathSync, writeFileSync, writeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exactFreshTasks, freshRegistration, freshVitestOptions, readFreshManifest, verifyFreshSources } from '../tests/sim/production/fresh-lineage-policy.ts';

const script = fileURLToPath(import.meta.url);
const root = resolve(dirname(script), '..');
const packet = freshRegistration.packet;
function persist(name, value) {
  const fd = openSync(join(packet, name), 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fsyncSync(fd); }
  finally { closeSync(fd); }
  const directory = openSync(packet, 'r');
  try { fsyncSync(directory); } finally { closeSync(directory); }
}
function details(error) {
  return error instanceof Error ? { name: error.name, message: error.message, stack: error.stack, cause: String(error.cause ?? '') } : { value: String(error) };
}
function preflight() {
  if (realpathSync(root) !== root || realpathSync(packet) !== packet) throw new Error('Noncanonical registered paths');
  if (existsSync(join(packet, 'attempt.consumed.json'))) throw new Error('Fresh lineage attempt already consumed; never relaunch');
  const manifest = readFreshManifest(JSON.parse(readFileSync(join(packet, 'manifest.json'), 'utf8')), freshRegistration);
  verifyFreshSources(root, manifest);
  const runtime = JSON.parse(readFileSync(join(packet, 'runtime.json'), 'utf8'));
  if (runtime.node !== process.version || runtime.executable !== realpathSync(process.execPath)) throw new Error('Frozen runtime drift');
  for (const [name, expected] of Object.entries(runtime.files)) {
    const file = join(root, name);
    if (!name.startsWith('node_modules/') || realpathSync(file) !== file ||
      createHash('sha256').update(readFileSync(file)).digest('hex') !== expected) throw new Error(`Frozen installed API drift: ${name}`);
  }
  const approval = JSON.parse(readFileSync(join(packet, 'source-review.json'), 'utf8'));
  const sha = name => createHash('sha256').update(readFileSync(join(packet, name))).digest('hex');
  if (approval.verdict !== 'approve' || approval.security !== 'pass' || approval.manifestSha256 !== sha('manifest.json') ||
    approval.runtimeSha256 !== sha('runtime.json') || approval.planSha256 !== sha('plan.json')) throw new Error('Missing exact independent source/policy approval');
  return manifest;
}
function taskTree(task) {
  return { type: task.type, name: task.filepath ?? task.name, mode: task.mode,
    concurrent: task.concurrent === true, state: task.result?.state,
    errors: task.result?.errors ?? [], duration: task.result?.duration,
    tasks: task.tasks?.map(taskTree) ?? [] };
}
async function child() {
  const manifest = preflight();
  const { startVitest } = await import('vitest/node');
  let context;
  let closed = false;
  let error = null;
  const diagnostics = [];
  const reporter = {
    onInit(ctx) {
      // Capture even an early-return or throw before startVitest exposes its result.
      context = ctx;
      const config = ctx.config;
      persist('resolved-runner.json', { root: config.root, include: config.include, setupFiles: config.setupFiles,
        globalSetup: config.globalSetup, environment: config.environment, watch: config.watch, retry: config.retry,
        testTimeout: config.testTimeout, hookTimeout: config.hookTimeout, teardownTimeout: config.teardownTimeout,
        pool: config.pool, poolOptions: config.poolOptions, fileParallelism: config.fileParallelism,
        maxConcurrency: config.maxConcurrency, dangerouslyIgnoreUnhandledErrors: config.dangerouslyIgnoreUnhandledErrors });
      if (config.testTimeout !== 5000 || config.hookTimeout !== 10000 || config.teardownTimeout !== 10000 ||
        config.root !== freshVitestOptions(root).root || config.setupFiles.length || config.globalSetup.length ||
        config.watch || config.retry !== 0 || config.include.length !== 1 || config.include[0] !== 'fresh-lineage.once.ts')
        throw new Error('Resolved one-shot policy drift');
      // Installed close logs rejected allSettled callbacks without necessarily rejecting.
      for (const name of ['error', 'warn']) {
        const original = ctx.logger[name].bind(ctx.logger);
        ctx.logger[name] = (...args) => { diagnostics.push({ method: name, args: args.map(String) }); return original(...args); };
      }
    },
    onServerRestart(reason) { diagnostics.push({ method: 'server-restart', reason: String(reason) }); process.exitCode = 1; },
    onProcessTimeout() { diagnostics.push({ method: 'process-timeout' }); process.exitCode = 1; }
  };
  try {
    const returned = await startVitest('test', [], { ...freshVitestOptions(root), reporters: ['default', reporter] }, { cacheDir: join(packet, 'vite-cache') }, {
      packageInstaller: {
        async ensureInstalled(dependency) {
          // Resolution only, never npm install or interactive fallback.
          const names = Array.isArray(dependency) ? dependency : [dependency];
          for (const name of names) import.meta.resolve(name);
          return true;
        }
      }
    });
    context ??= returned;
  } catch (failure) { error = details(failure); process.exitCode = process.exitCode || 1; }
  finally {
    if (context) {
      try { await context.close(); closed = true; }
      catch (failure) { diagnostics.push({ method: 'close-rejected', error: details(failure) }); process.exitCode = process.exitCode || 1; }
    }
  }
  let sourceError = null;
  try { verifyFreshSources(root, manifest); } catch (failure) { sourceError = details(failure); }
  const files = context?.state.getFiles().map(taskTree) ?? [];
  const unhandled = context?.state.getUnhandledErrors().map(details) ?? [];
  const success = !error && !sourceError && closed && !diagnostics.length && !unhandled.length &&
    exactFreshTasks(files) && !process.exitCode && existsSync(join(packet, 'policy-result.json')) &&
    existsSync(join(packet, 'worker-finally.json')) && existsSync(join(packet, 'attempt.consumed.json'));
  if (!success) process.exitCode = process.exitCode || 1;
  persist('launcher-footer.json', { success, closed, error, sourceError, diagnostics, files, unhandled,
    exitCodeObserved: process.exitCode ?? 0, at: Date.now(), limits: 'Bounded prefix only; native terminal code/signal retained by parent' });
}
async function parent() {
  preflight();
  // This durable launcher record also prevents accidental parent restart before admission.
  persist('launcher-invoked.json', { at: Date.now(), pid: process.pid, node: process.version, command: [process.execPath, script] });
  const out = openSync(join(packet, 'native-stdout.log'), 'wx', 0o600);
  const err = openSync(join(packet, 'native-stderr.log'), 'wx', 0o600);
  let diagnostic = null;
  const began = performance.now();
  try {
    const processChild = spawn(process.execPath, [script, '--owned-launcher-child'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    persist('native-process.json', { pid: processChild.pid, parentPid: process.pid, at: Date.now() });
    processChild.stdout.on('data', bytes => { writeSync(out, bytes); process.stdout.write(bytes); });
    processChild.stderr.on('data', bytes => { writeSync(err, bytes); process.stderr.write(bytes); });
    processChild.on('error', failure => { diagnostic = details(failure); });
    const terminal = await new Promise(done => processChild.once('close', (code, signal) => done({ code, signal })));
    fsyncSync(out); fsyncSync(err);
    const footerPath = join(packet, 'launcher-footer.json');
    const footer = existsSync(footerPath) ? JSON.parse(readFileSync(footerPath, 'utf8')) : null;
    const stderr = readFileSync(join(packet, 'native-stderr.log'), 'utf8');
    const stdout = readFileSync(join(packet, 'native-stdout.log'), 'utf8');
    const closeDiagnostic = /error during close|teardown error|hanging process|close timed out/i.test(stderr + stdout);
    const success = terminal.code === 0 && terminal.signal === null && !diagnostic && footer?.success === true && !closeDiagnostic;
    persist('native-terminal.json', { ...terminal, diagnostic, success, closeDiagnostic, elapsedWallMs: performance.now() - began,
      humanActiveTime: 'unobserved', footer, at: Date.now() });
    if (!success) process.exitCode = terminal.code || 1;
  } finally { closeSync(out); closeSync(err); }
}

if (process.argv.length === 2) await parent();
else if (process.argv.length === 3 && process.argv[2] === '--owned-launcher-child') await child();
else throw new Error('No user-configurable one-shot arguments');
