#!/usr/bin/env node
/**
 * scripts/bench-tests.mjs — P01 baseline benchmarking harness
 *
 * Contract (per perf-analyst §2 + plan.md §P01):
 *   node scripts/bench-tests.mjs --suite <name> --runs <N> [--json <path>] [--verbose]
 *
 * Suites (path-filter based; works before P05 split):
 *   - unit-full     : `vitest run` (entire unit suite)
 *   - unit-engine   : `vitest run src/engine`
 *   - unit-ui       : `vitest run src/ui src/components` (best-effort path filter)
 *   - e2e-smoke     : `playwright test tests/e2e/smoke.spec.ts` (or grep `@smoke`)
 *
 * Output:
 *   - stdout: human summary (median / min / max / stddev / runs)
 *   - --json <path>: structured JSON report (Windows or Ubuntu row); preserves
 *     the other-OS row if file already exists.
 *   - docs/perf/test-bench.trend.csv: append one CSV row per invocation.
 *
 * Process safety (BINDING):
 *   - PID-tracking only. We `spawn` children, store their PIDs in a Set, and on
 *     SIGINT / abnormal exit we ONLY `process.kill(pid)` PIDs we own.
 *   - We NEVER call taskkill /IM, pkill node, killall node, npx kill-port, etc.
 *   - Default `CI=` empty: local runs do not get forced-serial vitest behavior.
 *     Caller may set CI=1 explicitly to mirror CI lanes.
 *
 * Timing:
 *   - performance.now() before spawn → on `close` event. Wall-clock only;
 *     no per-test timing (that's vitest's job).
 *
 * Exit codes:
 *   - 0: all runs succeeded
 *   - 1: any run failed (still emits partial JSON for debugging)
 *   - 2: bad CLI usage
 */

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

// ---- CLI parsing -----------------------------------------------------------
function parseArgs(argv) {
  const out = { suite: null, runs: 3, json: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--suite') out.suite = argv[++i];
    else if (a === '--runs') out.runs = Number(argv[++i]);
    else if (a === '--json') out.json = argv[++i];
    else if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  if (!out.suite) {
    console.error('Missing --suite. Try --help.');
    process.exit(2);
  }
  if (!Number.isFinite(out.runs) || out.runs < 1) {
    console.error('--runs must be a positive integer.');
    process.exit(2);
  }
  return out;
}

function printHelp() {
  console.log(`bench-tests.mjs — measure test suite wall-clock time

Usage:
  node scripts/bench-tests.mjs --suite <name> --runs <N> [--json <path>] [--verbose]

Suites:
  unit-full     vitest run
  unit-engine   vitest run src/engine
  unit-ui       vitest run src/ui src/components
  e2e-smoke     playwright test tests/e2e/smoke.spec.ts
`);
}

// ---- Suite registry --------------------------------------------------------
function suiteCommand(name) {
  // Invoke JS entry points directly via `node` so that:
  //   1. The child PID *is* the node process we measure (no shell wrapper).
  //   2. We avoid Node's Windows .cmd spawn restriction (EINVAL without
  //      shell:true), which we can't safely use because it breaks PID
  //      tracking on Windows.
  const node = process.execPath;
  const vitestEntry = resolve(repoRoot, 'node_modules/vitest/vitest.mjs');
  const playwrightEntry = resolve(repoRoot, 'node_modules/@playwright/test/cli.js');

  switch (name) {
    case 'unit-full':
      return { cmd: node, args: [vitestEntry, 'run', '--reporter=basic'] };
    case 'unit-engine':
      return {
        cmd: node,
        args: [vitestEntry, 'run', '--reporter=basic', 'src/engine'],
      };
    case 'unit-ui':
      return {
        cmd: node,
        args: [vitestEntry, 'run', '--reporter=basic', 'src/ui', 'src/components'],
      };
    case 'e2e-smoke':
      // Wave B / P06: tag-based selection. Runs the chromium-desktop project
      // only (mobile smoke has its own script: `test:smoke-e2e:mobile`).
      // Replaces the old "smoke.spec.ts file path" approach now that the
      // smoke band is spread across ~6 specs by tag.
      return {
        cmd: node,
        args: [
          playwrightEntry,
          'test',
          '--grep',
          '@smoke',
          '--project=chromium-desktop',
        ],
      };
    default:
      console.error(`Unknown suite: ${name}`);
      process.exit(2);
  }
}

// ---- PID-tracked spawn -----------------------------------------------------
const livePids = new Set();

function timedRun(cmd, args, { verbose }) {
  return new Promise((resolveRun) => {
    const start = performance.now();
    const child = spawn(cmd, args, {
      cwd: repoRoot,
      // Default CI empty — do not inherit a CI=1 unless caller explicitly set it.
      env: { ...process.env },
      stdio: verbose ? 'inherit' : ['ignore', 'ignore', 'pipe'],
      shell: false,
    });
    if (typeof child.pid === 'number') livePids.add(child.pid);

    let stderrBuf = '';
    if (!verbose && child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderrBuf += chunk.toString();
        if (stderrBuf.length > 64 * 1024) {
          stderrBuf = stderrBuf.slice(-64 * 1024);
        }
      });
    }

    child.on('error', (err) => {
      const ms = performance.now() - start;
      livePids.delete(child.pid);
      resolveRun({ ok: false, ms, code: -1, error: String(err), stderr: stderrBuf });
    });

    child.on('close', (code) => {
      const ms = performance.now() - start;
      livePids.delete(child.pid);
      resolveRun({ ok: code === 0, ms, code, stderr: stderrBuf });
    });
  });
}

// Cleanup: only PIDs we tracked.
function cleanupOwnedPids() {
  for (const pid of livePids) {
    try {
      process.kill(pid);
    } catch {
      /* already gone */
    }
  }
  livePids.clear();
}

process.on('SIGINT', () => {
  cleanupOwnedPids();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanupOwnedPids();
  process.exit(143);
});

// ---- Stats ----------------------------------------------------------------
function stats(samples) {
  const xs = [...samples].sort((a, b) => a - b);
  const n = xs.length;
  const min = xs[0];
  const max = xs[n - 1];
  const median = n % 2 ? xs[(n - 1) >> 1] : (xs[n / 2 - 1] + xs[n / 2]) / 2;
  const mean = xs.reduce((s, v) => s + v, 0) / n;
  const variance = xs.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  return { median, min, max, mean, stddev, n };
}

// ---- Git / OS metadata -----------------------------------------------------
function getGitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim();
  } catch {
    return null;
  }
}
function osLabel() {
  const p = process.platform;
  if (p === 'win32') return 'windows';
  if (p === 'linux') return 'ubuntu';
  if (p === 'darwin') return 'macos';
  return p;
}

// ---- Main -----------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { cmd, args } = suiteCommand(opts.suite);

  console.log(
    `[bench] suite=${opts.suite} runs=${opts.runs} cmd=${cmd} ${args.join(' ')}`,
  );

  const runs = [];
  let anyFail = false;
  for (let i = 0; i < opts.runs; i++) {
    process.stdout.write(`  run ${i + 1}/${opts.runs} ... `);
    const r = await timedRun(cmd, args, { verbose: opts.verbose });
    runs.push({
      ms: Math.round(r.ms),
      ok: r.ok,
      code: r.code,
    });
    if (!r.ok) {
      anyFail = true;
      process.stdout.write(`FAIL (code=${r.code}, ${Math.round(r.ms)}ms)\n`);
      if (!opts.verbose && r.stderr) {
        console.error(`---- stderr (last 2KB) ----\n${r.stderr.slice(-2048)}\n----`);
      }
    } else {
      process.stdout.write(`ok ${Math.round(r.ms)}ms\n`);
    }
  }

  const okMs = runs.filter((r) => r.ok).map((r) => r.ms);
  const s = okMs.length ? stats(okMs) : { median: null, min: null, max: null, mean: null, stddev: null, n: 0 };

  const report = {
    suite: opts.suite,
    runs: runs.map((r) => r.ms),
    runDetail: runs,
    median: s.median,
    min: s.min,
    max: s.max,
    mean: s.mean,
    stddev: s.stddev,
    okCount: s.n,
    failCount: runs.length - s.n,
    os: osLabel(),
    osRelease: os.release(),
    arch: process.arch,
    nodeVersion: process.version,
    gitSha: getGitSha(),
    timestamp: new Date().toISOString(),
  };

  console.log('\n[bench] result:');
  console.log(JSON.stringify(report, null, 2));

  // ---- JSON output (per-OS row preserved) ---------------------------------
  if (opts.json) {
    const jsonPath = resolve(repoRoot, opts.json);
    mkdirSync(dirname(jsonPath), { recursive: true });
    let existing = {};
    if (existsSync(jsonPath)) {
      try {
        existing = JSON.parse(readFileSync(jsonPath, 'utf8'));
      } catch {
        existing = {};
      }
    }
    if (!existing.schema) existing.schema = 'd2h5-bench-tests/v1';
    if (!existing.rows) existing.rows = {};
    const rowKey = `${report.os}::${opts.suite}`;
    existing.rows[rowKey] = report;
    existing.updatedAt = report.timestamp;
    writeFileSync(jsonPath, JSON.stringify(existing, null, 2) + '\n');
    console.log(`[bench] wrote ${jsonPath} (row: ${rowKey})`);
  }

  // ---- CSV trend append ---------------------------------------------------
  const csvPath = resolve(repoRoot, 'docs/perf/test-bench.trend.csv');
  mkdirSync(dirname(csvPath), { recursive: true });
  const csvHeader =
    'timestamp,os,arch,nodeVersion,suite,runs,okCount,failCount,median_ms,min_ms,max_ms,stddev_ms,gitSha\n';
  if (!existsSync(csvPath)) {
    writeFileSync(csvPath, csvHeader);
  }
  const row = [
    report.timestamp,
    report.os,
    report.arch,
    report.nodeVersion,
    report.suite,
    runs.length,
    report.okCount,
    report.failCount,
    fmt(report.median),
    fmt(report.min),
    fmt(report.max),
    fmt(report.stddev),
    report.gitSha ?? '',
  ].join(',');
  appendFileSync(csvPath, row + '\n');
  console.log(`[bench] appended trend row → ${csvPath}`);

  cleanupOwnedPids();
  process.exit(anyFail ? 1 : 0);
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return '';
  return Number(n).toFixed(2);
}

main().catch((err) => {
  console.error('[bench] fatal:', err);
  cleanupOwnedPids();
  process.exit(1);
});
