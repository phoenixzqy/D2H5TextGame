#!/usr/bin/env node
/**
 * scripts/check-engine-purity.mjs — CI grep guard for engine test purity.
 *
 * Wave B / P05b: the engine vitest project runs under `environment: 'node'`
 * with no `setupFiles`. Any engine test that imports React / RTL / Dexie
 * would silently break the engine project (or worse, silently force the
 * UI project to pick it up). This guard fails fast on those imports.
 *
 * Scope: `src/engine/**\/*.{test,spec}.ts`
 * Forbidden import sources (regex): `react`, `react-dom`, `@testing-library/*`, `dexie`.
 *
 * Exit codes:
 *   0 — clean
 *   1 — at least one violation; offending matches printed to stderr
 *
 * Process safety: read-only file walker, no spawn.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(__filename, '..', '..');
const engineDir = join(repoRoot, 'src', 'engine');

/**
 * Forbidden module specifiers. Matches as written in `import … from '<x>'`
 * or `await import('<x>')` strings. Anchored to whole-module specifier so
 * that e.g. `react-foo` (a hypothetical local pkg) doesn't false-positive.
 */
const FORBIDDEN = [
  /^react$/,
  /^react-dom(\/.*)?$/,
  /^@testing-library\/.*/,
  /^dexie$/,
  /^dexie-react-hooks$/,
];

const IMPORT_RE = /(?:^|\W)(?:import\s[^'"`]*from\s*|import\s*|await\s+import\s*\(|require\s*\()\s*['"`]([^'"`]+)['"`]/g;

/** @returns {string[]} flat list of *.test.ts / *.spec.ts under src/engine */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      out.push(...walk(p));
    } else if (/\.(test|spec)\.ts$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(engineDir);
const violations = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(src))) {
    const spec = m[1];
    if (FORBIDDEN.some((re) => re.test(spec))) {
      // 1-based line number for human grep
      const upTo = src.slice(0, m.index);
      const line = upTo.split('\n').length;
      violations.push({
        file: relative(repoRoot, file).split(sep).join('/'),
        line,
        spec,
      });
    }
  }
}

if (violations.length > 0) {
  console.error('[check-engine-purity] FAIL — forbidden imports under src/engine/**:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  imports '${v.spec}'`);
  }
  console.error(
    '\nEngine tests must run in `environment: \'node\'` (see vitest.workspace.ts).\n' +
      'Move React/RTL/Dexie tests under src/components, src/ui, or src/stores instead.',
  );
  process.exit(1);
}

console.log(
  `[check-engine-purity] OK — ${String(files.length)} engine test file(s) scanned, no forbidden imports.`,
);
