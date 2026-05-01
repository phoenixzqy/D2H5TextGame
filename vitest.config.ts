import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Root vitest config.
 *
 * With `vitest.workspace.ts` present, project-level `test` config (env,
 * setupFiles, isolate, include) is owned by each project. This root file
 * holds only **shared** concerns: coverage thresholds + the alias resolver.
 *
 * Coverage rooted at `src/engine/**`: the Wave A baseline gate (80% across
 * lines/functions/branches/statements). The UI project is intentionally
 * excluded from coverage — it has its own E2E + manual gating.
 *
 * @see vitest.workspace.ts
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
