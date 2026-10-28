/** Test-only finite policy and permanent admission. No game/store imports. */
import { createHash } from 'node:crypto';
import { closeSync, fsyncSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface FreshRegistration {
  readonly policyId: 'fresh-native-normal-blood-moor-once-v1';
  readonly lineageId: string;
  readonly packet: string;
}
export interface FreshManifest extends FreshRegistration {
  readonly parent: null;
  readonly sources: Readonly<Record<string, string>>;
}
/** Fixed reviewed experiment; changing source bytes never releases its marker. */
export const freshRegistration: FreshRegistration = Object.freeze({
  policyId: 'fresh-native-normal-blood-moor-once-v1',
  lineageId: 'd2h5-fresh-lineage-gxhxzxtj',
  packet: '/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-fresh-lineage-gxhxzxtj'
});

/** Dedicated discovery root keeps native gameplay outside all ordinary suites. */
export function freshVitestOptions(root: string) {
  return {
    root: join(root, 'tests/sim/production/one-shot'), config: false,
    include: ['fresh-lineage.once.ts'], environment: 'jsdom',
    alias: { '@': join(root, 'src') }, setupFiles: [], globalSetup: [],
    run: true, watch: false, retry: 0, segfaultRetry: 0,
    pool: 'forks', poolOptions: { forks: { singleFork: true, isolate: true } },
    fileParallelism: false, maxWorkers: 1, minWorkers: 1, maxConcurrency: 1,
    sequence: { concurrent: false }, coverage: { enabled: false }, cache: false,
    dangerouslyIgnoreUnhandledErrors: false, passWithNoTests: false, allowOnly: false
  } satisfies NonNullable<Parameters<typeof import('vitest/node').startVitest>[2]>;
}

export interface FreshTask {
  readonly type: string;
  readonly name: string;
  readonly mode: string;
  readonly concurrent?: boolean;
  readonly state?: string;
  readonly errors?: readonly unknown[];
  readonly tasks?: readonly FreshTask[];
}
/** Fail closed on missing, unexpected, skipped or failed runner tasks. */
export function exactFreshTasks(files: readonly FreshTask[]): boolean {
  const file = files[0], test = file?.tasks?.[0];
  return files.length === 1 && file?.name.endsWith('/fresh-lineage.once.ts') === true &&
    file.mode === 'run' && file.state === 'pass' && !file.errors?.length && file.tasks?.length === 1 &&
    test?.type === 'test' && test.mode === 'run' && test.state === 'pass' &&
    !test.concurrent && !test.errors?.length && !test.tasks?.length;
}

/** Async timeouts do not cancel callbacks: refuse every later native boundary. */
export function createFreshLifetime(deadline: number, now: () => number, failed: () => boolean) {
  let stopped: string | null = null;
  return {
    stop: (reason: string) => { stopped ??= reason; },
    check() {
      if (failed()) stopped ??= 'Runner already failed or finished';
      if (!Number.isFinite(deadline) || now() >= deadline) stopped ??= 'Fresh native action deadline elapsed';
      if (stopped) throw new Error(stopped);
    }
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** Validate identity and source paths before any permanent admission or native import. */
export function readFreshManifest(value: unknown, registration: FreshRegistration): FreshManifest {
  if (!record(value) || value.policyId !== registration.policyId || value.lineageId !== registration.lineageId ||
    value.packet !== registration.packet || value.parent !== null || !record(value.sources) || !Object.keys(value.sources).length)
    throw new Error('Unregistered fresh lineage manifest');
  for (const [name, hash] of Object.entries(value.sources)) {
    if (!/^(src\/|tests\/|scripts\/|\.github\/workflows\/|[^/]+$)/.test(name) ||
      name.split('/').some(part => part === '' || part === '.' || part === '..') || name.includes('/fixtures/') ||
      !/\.(?:ts|tsx|js|mjs|json|html|css|yml|yaml)$/.test(name) || typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash))
      throw new Error('Invalid fresh lineage source identity');
  }
  return value as unknown as FreshManifest;
}
/** Verify registered source bytes without reading any saved fixture or ancestor state. */
export function verifyFreshSources(root: string, manifest: FreshManifest): void {
  for (const [name, expected] of Object.entries(manifest.sources)) {
    const file = resolve(root, name);
    if (realpathSync(file) !== file || createHash('sha256').update(readFileSync(file)).digest('hex') !== expected)
      throw new Error(`Fresh lineage source drift: ${name}`);
  }
}
/**
 * Atomically and durably consume the sole registered attempt before invoking action.
 * The marker is never removed, including callback rejection, timeout or process failure.
 */
export function withFreshAdmission<T>(registration: FreshRegistration, value: unknown, action: () => T): T {
  const manifest = readFreshManifest(value, registration);
  if (realpathSync(registration.packet) !== registration.packet) throw new Error('Fresh packet must be canonical');
  const fd = openSync(join(registration.packet, 'attempt.consumed.json'), 'wx', 0o600);
  try {
    writeFileSync(fd, JSON.stringify({ ...manifest, status: 'consumed', admittedAt: Date.now() }) + '\n');
    fsyncSync(fd);
  } finally { closeSync(fd); }
  const directory = openSync(registration.packet, 'r');
  try { fsyncSync(directory); } finally { closeSync(directory); }
  return action();
}

type Action = 'creation' | 'launch' | 'settlement';
/** One synchronous creation/launch and at most three settlements; first stop is permanent. */
export function createFreshPolicy() {
  const state = { creations: 0, launches: 0, settlements: 0, stopped: null as string | null };
  const stop = (reason: string) => { state.stopped ??= reason; };
  return {
    stop,
    snapshot: () => ({ ...state }),
    act<T>(kind: Action, action: () => T): T {
      try {
        if (state.stopped) throw new Error(state.stopped);
        if (kind === 'creation') {
          if (state.creations || state.launches) throw new Error('Creation budget exhausted');
          state.creations++;
        } else if (kind === 'launch') {
          if (state.creations !== 1 || state.launches) throw new Error('Launch budget or ordering refused');
          state.launches++;
        } else {
          if (state.launches !== 1 || state.settlements === 3) throw new Error('Settlement budget or ordering refused');
          state.settlements++;
        }
        return action();
      } catch (error) {
        stop(error instanceof Error ? error.message : String(error));
        throw error;
      }
    }
  };
}
