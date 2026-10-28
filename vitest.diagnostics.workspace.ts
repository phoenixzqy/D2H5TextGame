/**
 * Retained production diagnostic definitions. Explicit invocation only.
 * These tests may run gameplay or read policy-selected saved fixtures. A unit
 * pass grants no permission to reopen a closed diagnostic or protected input.
 */
import { defineWorkspace } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineWorkspace([
  {
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    test: {
      name: 'sim-diagnostics',
      environment: 'node',
      include: ['tests/sim/production/**/*.test.ts'],
      pool: 'threads',
      isolate: true
    }
  }
]);
