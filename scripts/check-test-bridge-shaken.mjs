#!/usr/bin/env node
/**
 * F1 — Test bridge tree-shake regression guard.
 *
 * Runs a clean production `vite build` (with `VITE_E2E` explicitly cleared)
 * and asserts that none of the test-bridge identifiers appear in any emitted
 * JS chunk under `dist/assets/`.
 *
 * If this script fails, the test bridge has leaked into production. The fix
 * is almost always: ensure `src/app/main.tsx` only imports
 * `./test-bridge` from inside a build-time-replaced conditional over
 * `import.meta.env.{DEV,MODE,VITE_E2E}` so Vite/Rollup can statically elide
 * the branch.
 *
 * See `docs/perf/test-bridge-tree-shake.md` for context.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..');
const distDir = join(repoRoot, 'dist');
const assetsDir = join(distDir, 'assets');

/**
 * Forbidden tokens in any production JS chunk.
 *
 * Each entry is a regex. We use word-boundary / context anchors to avoid
 * false positives from minified one-letter identifiers — every token here is
 * distinctive and unlikely to collide with unrelated app code.
 *
 * If you intentionally rename or expand the test bridge surface, update both
 * this list AND `docs/perf/test-bridge-tree-shake.md`.
 */
const FORBIDDEN = [
  { name: '__GAME__', re: /__GAME__/ },
  { name: 'seedItem', re: /\bseedItem\b/ },
  { name: 'seedMerc', re: /\bseedMerc\b/ },
  { name: 'installTestBridge', re: /\binstallTestBridge\b/ },
  // `flushSave` is the test-bridge wrapper. The internal store helper is also
  // named `flushSave` and is legitimately shipped, so we look for the bridge's
  // distinctive *property* form: `flushSave:` inside an object literal next
  // to the bridge surface. Minifiers preserve property names on the bridge
  // because it's assigned to `window.__GAME__`.
  { name: 'flushSave property', re: /[,{]flushSave:/ },
];

function fail(msg) {
  process.stderr.write(`\u001b[31m[check:test-bridge-shake] ${msg}\u001b[0m\n`);
  process.exit(1);
}
function ok(msg) {
  process.stdout.write(`[check:test-bridge-shake] ${msg}\n`);
}

// 1. Clean dist for a deterministic build.
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

// 2. Build with VITE_E2E explicitly unset.
const env = { ...process.env };
delete env.VITE_E2E;
ok('Running production `vite build` (VITE_E2E unset)…');
const build = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build'],
  { cwd: repoRoot, env, stdio: 'inherit', shell: process.platform === 'win32' }
);
if (build.status !== 0) {
  fail(`vite build failed with exit code ${String(build.status)} (signal=${String(build.signal)})`);
}

// 3. Scan emitted JS chunks.
if (!existsSync(assetsDir)) {
  fail(`expected ${assetsDir} after build, but it does not exist`);
}
const chunks = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
if (chunks.length === 0) {
  fail(`no JS chunks in ${assetsDir}`);
}

const violations = [];
for (const chunk of chunks) {
  const path = join(assetsDir, chunk);
  const src = readFileSync(path, 'utf8');
  for (const { name, re } of FORBIDDEN) {
    if (re.test(src)) {
      const idx = src.search(re);
      const snippet = src.slice(Math.max(0, idx - 40), Math.min(src.length, idx + 80));
      violations.push({ chunk, name, snippet });
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    '\u001b[31m[check:test-bridge-shake] FAIL — test-bridge symbols leaked into production bundle:\u001b[0m\n'
  );
  for (const v of violations) {
    process.stderr.write(`  - ${v.chunk}: \`${v.name}\`\n      …${v.snippet}…\n`);
  }
  process.stderr.write(
    'Fix: ensure `src/app/main.tsx` imports `./test-bridge` only inside an\n' +
      '`if (import.meta.env.DEV || import.meta.env.MODE === "test" ||\n' +
      '    import.meta.env.VITE_E2E === "true")` block, using dynamic `import()`.\n' +
      'See docs/perf/test-bridge-tree-shake.md.\n'
  );
  process.exit(1);
}

ok(`PASS — ${String(chunks.length)} chunk(s) scanned, no test-bridge symbols present.`);
