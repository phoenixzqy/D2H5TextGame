#!/usr/bin/env node
/**
 * scripts/check-bench-vs-baseline.mjs — P12 perf gate (warn-only)
 *
 * Compares the median wall-clock of a fresh `bench-tests.mjs` JSON output
 * against the OS-keyed baseline in `docs/perf/test-bench.baseline.json`,
 * then emits a markdown table to stdout AND $GITHUB_STEP_SUMMARY.
 *
 * CLI:
 *   node scripts/check-bench-vs-baseline.mjs \
 *     --bench <bench-output.json> \
 *     --baseline docs/perf/test-bench.baseline.json \
 *     --os <ubuntu|windows|macos> \
 *     [--threshold-pct 20] \
 *     [--summary-out <path>]
 *
 * Behavior (Wave C, P12):
 *   - WARN-ONLY. Always exits 0. The hard-fail flip is a future PR after
 *     ≥10 CI runs of variance characterization (see docs/perf/perf-gate.md).
 *   - Joins by suite name. The bench JSON may be either:
 *       (a) a single-suite report (the default `--json` shape, with `rows`
 *           keyed by `<os>::<suite>`), or
 *       (b) a flat report `{ suite, median, ... }` (the in-memory shape
 *           that bench-tests.mjs prints to stdout but does NOT write to
 *           disk in v1 — included here for forward-compat).
 *   - Threshold default: 20%. Regression is `(current - baseline) / baseline * 100`.
 *   - Missing baseline row → `::notice ::`, continue without comparison.
 *   - Missing/unreadable bench file → `::warning ::`, exit 0.
 *   - Null baseline median (failed bench, e.g. windows::unit-engine in the
 *     stub baseline) → treated like missing row: notice, no compare.
 *
 * E2E exclusion: this gate intentionally only covers `unit-full` and
 *   `unit-engine`. E2E suites are too noisy on cross-OS GitHub runners and
 *   would generate false-positive warnings (see docs/perf/perf-gate.md §3).
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---- CLI -----------------------------------------------------------------
function parseArgs(argv) {
  const out = {
    bench: null,
    baseline: null,
    os: null,
    thresholdPct: 20,
    summaryOut: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bench') out.bench = argv[++i];
    else if (a === '--baseline') out.baseline = argv[++i];
    else if (a === '--os') out.os = argv[++i];
    else if (a === '--threshold-pct') out.thresholdPct = Number(argv[++i]);
    else if (a === '--summary-out') out.summaryOut = argv[++i];
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  if (!out.bench || !out.baseline || !out.os) {
    console.error('Missing required --bench / --baseline / --os. Try --help.');
    process.exit(2);
  }
  if (!Number.isFinite(out.thresholdPct) || out.thresholdPct <= 0) {
    console.error('--threshold-pct must be a positive number.');
    process.exit(2);
  }
  return out;
}

function printHelp() {
  console.log(`check-bench-vs-baseline.mjs — perf gate (warn-only)

Usage:
  node scripts/check-bench-vs-baseline.mjs \\
    --bench <bench-output.json> \\
    --baseline docs/perf/test-bench.baseline.json \\
    --os <ubuntu|windows|macos> \\
    [--threshold-pct 20] [--summary-out <path>]
`);
}

// ---- Helpers -------------------------------------------------------------
function safeReadJson(path) {
  if (!existsSync(path)) return { ok: false, reason: 'missing', data: null };
  try {
    return { ok: true, data: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (err) {
    return { ok: false, reason: `parse: ${err.message}`, data: null };
  }
}

/**
 * Extract { suite, median } pairs from bench JSON.
 * Supports both bench-tests.mjs's on-disk shape (with `rows`) and a flat
 * single-suite shape.
 */
function extractCurrent(benchJson, osKey) {
  const out = [];
  if (benchJson && benchJson.rows && typeof benchJson.rows === 'object') {
    for (const [key, row] of Object.entries(benchJson.rows)) {
      // Only consider rows for THIS os (writers may carry both)
      if (!key.startsWith(`${osKey}::`)) continue;
      out.push({ suite: row.suite ?? key.split('::')[1], median: row.median ?? null, runs: row.runs ?? [], okCount: row.okCount ?? null, failCount: row.failCount ?? null });
    }
  } else if (benchJson && benchJson.suite) {
    out.push({ suite: benchJson.suite, median: benchJson.median ?? null, runs: benchJson.runs ?? [], okCount: benchJson.okCount ?? null, failCount: benchJson.failCount ?? null });
  }
  return out;
}

function pickBaseline(baselineJson, osKey, suite) {
  if (!baselineJson || !baselineJson.rows) return null;
  const row = baselineJson.rows[`${osKey}::${suite}`];
  return row ?? null;
}

function fmtMs(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(Number(n))} ms`;
}
function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// ---- Main ----------------------------------------------------------------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const benchPath = resolve(opts.bench);
  const baselinePath = resolve(opts.baseline);

  const benchRead = safeReadJson(benchPath);
  if (!benchRead.ok) {
    const msg = `bench file ${opts.bench} ${benchRead.reason}`;
    console.log(`::warning ::perf-gate: ${msg}`);
    console.log(`# Perf gate (warn-only)\n\n⚠️ Could not read bench file: \`${opts.bench}\` (${benchRead.reason}). Skipping comparison.`);
    if (opts.summaryOut) {
      try { appendFileSync(opts.summaryOut, `\n## Perf gate (warn-only)\n\n⚠️ Could not read bench file: \`${opts.bench}\` (${benchRead.reason}). Skipping comparison.\n`); } catch {}
    }
    process.exit(0);
  }

  const baselineRead = safeReadJson(baselinePath);
  if (!baselineRead.ok) {
    const msg = `baseline file ${opts.baseline} ${baselineRead.reason}`;
    console.log(`::warning ::perf-gate: ${msg}`);
    console.log(`# Perf gate (warn-only)\n\n⚠️ Could not read baseline file: \`${opts.baseline}\` (${baselineRead.reason}). Skipping comparison.`);
    if (opts.summaryOut) {
      try { appendFileSync(opts.summaryOut, `\n## Perf gate (warn-only)\n\n⚠️ Could not read baseline file: \`${opts.baseline}\` (${baselineRead.reason}). Skipping comparison.\n`); } catch {}
    }
    process.exit(0);
  }

  const current = extractCurrent(benchRead.data, opts.os);
  if (current.length === 0) {
    console.log(`::warning ::perf-gate: no rows for os=${opts.os} in ${opts.bench}`);
  }

  // Build comparison rows
  const rows = current.map((cur) => {
    const base = pickBaseline(baselineRead.data, opts.os, cur.suite);
    const baseMedian = base && typeof base.median === 'number' ? base.median : null;
    const stub = !!(base && base._stub);
    const curMedian = typeof cur.median === 'number' ? cur.median : null;

    let deltaMs = null, deltaPct = null, status = 'ok';
    let note = '';
    if (curMedian == null) {
      status = 'no-current';
      note = `current run has no successful timings (okCount=${cur.okCount ?? '?'}, failCount=${cur.failCount ?? '?'})`;
    } else if (base == null) {
      status = 'missing-baseline';
      note = `no baseline row for ${opts.os}::${cur.suite}`;
    } else if (baseMedian == null) {
      status = 'null-baseline';
      note = stub ? 'baseline row is a stub (TBD); not comparing yet' : 'baseline median is null (no successful runs); not comparing yet';
    } else {
      deltaMs = curMedian - baseMedian;
      deltaPct = (deltaMs / baseMedian) * 100;
      if (deltaPct > opts.thresholdPct) status = 'regress';
    }
    return { suite: cur.suite, curMedian, baseMedian, deltaMs, deltaPct, status, note };
  });

  // ---- Markdown rendering ------------------------------------------------
  const lines = [];
  lines.push(`## Perf gate (warn-only) — ${opts.os}`);
  lines.push('');
  lines.push(`Threshold: regress if median > **+${opts.thresholdPct}%** vs OS-keyed baseline. This gate is **warn-only** (never fails CI). See \`docs/perf/perf-gate.md\` for the rollout plan.`);
  lines.push('');
  lines.push('| Suite | Current median | Baseline median | Δ ms | Δ % | Status |');
  lines.push('|---|---:|---:|---:|---:|---|');
  for (const r of rows) {
    let statusCell;
    switch (r.status) {
      case 'regress': statusCell = `⚠️ regress`; break;
      case 'ok': statusCell = `✅ ok`; break;
      case 'missing-baseline': statusCell = `ℹ️ no baseline`; break;
      case 'null-baseline': statusCell = `ℹ️ baseline pending`; break;
      case 'no-current': statusCell = `⚠️ no current data`; break;
      default: statusCell = r.status;
    }
    lines.push(
      `| \`${r.suite}\` | ${fmtMs(r.curMedian)} | ${fmtMs(r.baseMedian)} | ${r.deltaMs == null ? '—' : `${Math.round(r.deltaMs)}`} | ${fmtPct(r.deltaPct)} | ${statusCell}${r.note ? ` — _${r.note}_` : ''} |`,
    );
  }
  lines.push('');

  // ---- GitHub annotations + log ------------------------------------------
  for (const r of rows) {
    if (r.status === 'regress') {
      console.log(`::warning ::perf-gate: ${opts.os}::${r.suite} regressed ${fmtPct(r.deltaPct)} (current ${fmtMs(r.curMedian)} vs baseline ${fmtMs(r.baseMedian)}, threshold +${opts.thresholdPct}%)`);
    } else if (r.status === 'missing-baseline' || r.status === 'null-baseline') {
      console.log(`::notice ::perf-gate: ${opts.os}::${r.suite}: ${r.note}`);
    } else if (r.status === 'no-current') {
      console.log(`::warning ::perf-gate: ${opts.os}::${r.suite}: ${r.note}`);
    }
  }

  // Always print the markdown table to stdout (job log)
  const md = lines.join('\n');
  console.log(md);

  // And to the summary, if provided
  if (opts.summaryOut) {
    try {
      appendFileSync(opts.summaryOut, `\n${md}\n`);
    } catch (err) {
      console.log(`::warning ::perf-gate: failed to append summary: ${err.message}`);
    }
  }

  // Warn-only: always exit 0.
  process.exit(0);
}

main();
