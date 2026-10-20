/** Test-only loopback deployment server for two guarded same-schema builds. */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cpSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(repo, 'dist');
const port = Number(process.env.PWA_UPDATE_PORT ?? 4330);
let staging;
let ownsDist = false;
let active = 'A';
let server;
let stopping;
let buildChild;
let buildClosed;

function signalBuild(signal) {
  if (!buildChild?.pid) return;
  try {
    // On POSIX the guard and its npm/Vite descendants own this isolated group.
    if (process.platform !== 'win32') process.kill(-buildChild.pid, signal);
    else buildChild.kill(signal);
  } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

async function buildVersion(version) {
  buildChild = spawn(process.execPath, ['scripts/check-test-bridge-shaken.mjs'], {
    cwd: repo, stdio: 'inherit', detached: process.platform !== 'win32',
    env: { ...process.env, VITE_APP_VERSION: `p17b03a-${version}` }
  });
  process.stderr.write(`[pwa-update] Owned build PID/group: ${String(buildChild.pid)}\n`);
  buildClosed = new Promise(resolve => {
    buildChild.once('error', error => resolve({ error }));
    buildChild.once('close', (code, signal) => resolve({ code, signal }));
  });
  const result = await buildClosed;
  buildChild = undefined;
  buildClosed = undefined;
  if (result.error) throw result.error;
  if (stopping || result.code !== 0) {
    throw new Error(`Guarded build ${version} stopped: code=${String(result.code)} signal=${String(result.signal)}`);
  }
}

function exists(path) {
  try { lstatSync(path); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function removeDist() {
  if (!ownsDist) return;
  if (exists(dist)) {
    if (!lstatSync(dist).isDirectory()) throw new Error(`Unexpected owned output type: ${dist}`);
    rmSync(dist, { recursive: true });
  }
  ownsDist = false;
}

async function stop() {
  if (stopping) return stopping;
  stopping = (async () => {
    if (buildClosed) {
      signalBuild('SIGTERM');
      const escalation = setTimeout(() => signalBuild('SIGKILL'), 5000);
      try { await buildClosed; }
      finally { clearTimeout(escalation); }
    }
    if (server?.listening) {
      const closed = once(server, 'close');
      server.close();
      server.closeAllConnections();
      await closed;
    }
    removeDist();
    if (staging) {
      rmSync(staging, { recursive: true });
      process.stderr.write(`[pwa-update] Removed owned bundles: ${staging}\n`);
    }
  })();
  return stopping;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void stop().then(() => process.exit(0)).catch(error => {
      process.stderr.write(`[pwa-update] Cleanup failed: ${String(error)}\n`);
      process.exit(1);
    });
  });
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2'
};

function contained(root, path) {
  const suffix = relative(root, path);
  return !suffix.startsWith('..') && !isAbsolute(suffix);
}

function serve(request, response) {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
  response.setHeader('Cache-Control', 'no-store');
  if (path.startsWith('/__pwa-test/deploy/')) {
    request.resume();
    const version = path.slice('/__pwa-test/deploy/'.length);
    if (request.method !== 'POST') { response.writeHead(405).end(); return; }
    if (version !== 'A' && version !== 'B') { response.writeHead(400).end(); return; }
    active = version;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ version }));
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  const root = join(staging, active);
  let file = resolve(root, path === '/' ? 'index.html' : path.slice(1));
  if (!contained(root, file)) { response.writeHead(403).end(); return; }
  if (!exists(file) && extname(path) === '' && request.headers.accept?.includes('text/html')) {
    file = join(root, 'index.html');
  }
  if (!exists(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
  if (!contained(root, realpathSync(file))) { response.writeHead(403).end(); return; }
  response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
}

try {
  // lstat catches dangling symlinks too. Never clean a failed preflight blocker.
  if (exists(dist)) throw new Error(`Refusing pre-existing build output: ${dist}`);
  staging = mkdtempSync(join(tmpdir(), 'd2h5-p17b03a-bundles-'));
  process.stderr.write(`[pwa-update] Owned bundles: ${staging}\n`);
  for (const version of ['A', 'B']) {
    ownsDist = true;
    await buildVersion(version);
    cpSync(dist, join(staging, version), { recursive: true, errorOnExist: true, force: false });
    removeDist();
    process.stderr.write(`[pwa-update] Guarded build ${version} passed and copied\n`);
  }
  if (readFileSync(join(staging, 'A/sw.js')).equals(readFileSync(join(staging, 'B/sw.js')))) {
    throw new Error('A/B workers must differ to exercise a real update');
  }
  server = createServer((request, response) => {
    try { serve(request, response); }
    catch { response.writeHead(400).end(); }
  });
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
  process.stderr.write(`[pwa-update] Listening on http://127.0.0.1:${String(port)}\n`);
} catch (error) {
  process.stderr.write(`[pwa-update] Failed: ${String(error)}\n`);
  await stop();
  process.exitCode = 1;
}
