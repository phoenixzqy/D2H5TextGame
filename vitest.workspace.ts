/**
 * Vitest workspace — splits the unit suite into two cleanly-bounded projects:
 *
 *   - `engine`: pure TypeScript, runs in Node, no DOM/RTL/setup. Honors the
 *     P05a audit verdict (`docs/perf/p05a-engine-state-audit.md` §5):
 *     `isolate: false` is empirically safe for `src/engine/**`.
 *   - `ui`:     React/JSX, jsdom + RTL setup, isolated workers.
 *
 * Coverage thresholds and `coverage.include` (rooted at `src/engine/**`)
 * stay on the root `vitest.config.ts` so `npm run test:cov` reports a single
 * unified coverage view across both projects.
 *
 * @see docs/perf/p05a-engine-state-audit.md
 */
import { defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcAlias = { '@': path.resolve(__dirname, './src') };

export default defineWorkspace([
  {
    // ---- Engine project --------------------------------------------------
    // Pure engine code under src/engine/**: deterministic, no DOM, no React.
    // P05a audit verified zero DIRTY module state and empirical pass-count
    // parity between isolate:true and isolate:false → adopt isolate:false
    // for the cold-start CI win.
    resolve: { alias: srcAlias },
    test: {
      name: 'engine',
      globals: true,
      environment: 'node',
      include: ['src/engine/**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      pool: 'threads',
      isolate: false,
      // No setupFiles — the engine has no DOM/RTL surface.
    },
  },
  {
    // ---- UI project ------------------------------------------------------
    // React components, hooks, stores, and any test that needs jsdom + RTL.
    // Stays isolated to avoid DOM/leak surprises between component tests.
    plugins: [react()],
    resolve: { alias: srcAlias },
    test: {
      name: 'ui',
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/e2e/**',
        'src/engine/**',
      ],
      pool: 'threads',
      isolate: true,
      poolOptions: {
        threads: { maxThreads: 4 },
      },
    },
  },
]);
