import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFreshLifetime, createFreshPolicy, exactFreshTasks, freshVitestOptions, verifyFreshSources, withFreshAdmission, type FreshRegistration, type FreshManifest } from './fresh-lineage-policy';

const owned: string[] = [];
function fixture() {
  const packet = mkdtempSync(join(tmpdir(), 'd2h5-lineage-contract-'));
  owned.push(packet);
  const registration: FreshRegistration = { policyId: 'fresh-native-normal-blood-moor-once-v1', lineageId: 'contract-only', packet };
  const manifest: FreshManifest = { ...registration, parent: null, sources: { 'src/contract.ts': 'a'.repeat(64) } };
  return { registration, manifest, marker: join(packet, 'attempt.consumed.json') };
}
afterEach(() => {
  for (const packet of owned.splice(0)) {
    for (const name of readdirSync(packet)) {
      expect(['attempt.consumed.json', 'contract.ts']).toContain(name);
      unlinkSync(join(packet, name));
    }
    rmdirSync(packet);
    console.info(JSON.stringify({ disposableFreshContractDirectoryRemoved: packet }));
  }
});

describe('fresh-lineage admission without native gameplay', () => {
  it('durably consumes the registered attempt before invoking the callback', () => {
    const { registration, manifest, marker } = fixture();
    const value = withFreshAdmission(registration, manifest, () => {
      expect(JSON.parse(readFileSync(marker, 'utf8'))).toMatchObject({ ...registration, status: 'consumed' });
      return 23;
    });
    expect(value).toBe(23);
    expect(() => withFreshAdmission(registration, manifest, () => 99)).toThrow();
  });

  it('refuses an empty existing marker and never invokes gameplay', () => {
    const { registration, manifest, marker } = fixture();
    writeFileSync(marker, '');
    let calls = 0;
    expect(() => withFreshAdmission(registration, manifest, () => calls++)).toThrow();
    expect(calls).toBe(0);
    expect(readFileSync(marker, 'utf8')).toBe('');
  });

  it('admits only one of concurrently requested callbacks', async () => {
    const { registration, manifest } = fixture();
    let calls = 0;
    const results = await Promise.allSettled([0, 1].map(() => Promise.resolve().then(() =>
      withFreshAdmission(registration, manifest, () => ++calls))));
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(calls).toBe(1);
  });

  it('retains the consumed attempt after synchronous and asynchronous callback failure', async () => {
    for (const asynchronous of [false, true]) {
      const { registration, manifest, marker } = fixture();
      const failure = new Error('owned synthetic callback failure');
      if (asynchronous) await expect(withFreshAdmission(registration, manifest, () => Promise.reject(failure))).rejects.toBe(failure);
      else expect(() => withFreshAdmission(registration, manifest, () => { throw failure; })).toThrow(failure);
      expect(JSON.parse(readFileSync(marker, 'utf8')).status).toBe('consumed');
      expect(() => withFreshAdmission(registration, manifest, () => undefined)).toThrow();
    }
  });

  it.each(['policyId', 'lineageId', 'packet', 'parent', 'sources'] as const)('rejects invalid %s before consuming an attempt', field => {
    const { registration, manifest } = fixture();
    const invalid = { ...manifest, [field]: field === 'sources' ? { '../escape': 'invalid' } : 'unregistered' };
    let calls = 0;
    expect(() => withFreshAdmission(registration, invalid, () => calls++)).toThrow();
    expect(calls).toBe(0);
    expect(readdirSync(registration.packet)).toEqual([]);
  });
});

describe('finite fresh policy with harmless callbacks only', () => {
  it('permits one creation, one launch and three settlements', () => {
    const policy = createFreshPolicy();
    const actions: string[] = [];
    for (const kind of ['creation', 'launch', 'settlement', 'settlement', 'settlement'] as const)
      policy.act(kind, () => actions.push(kind));
    expect(actions).toEqual(['creation', 'launch', 'settlement', 'settlement', 'settlement']);
    expect(policy.snapshot()).toEqual({ creations: 1, launches: 1, settlements: 3, stopped: null });
    expect(() => policy.act('settlement', () => actions.push('fourth'))).toThrow();
    expect(actions).toHaveLength(5);
  });

  it('stops permanently on first nonwin, preserving counts and original reason', () => {
    const policy = createFreshPolicy();
    policy.act('creation', () => undefined); policy.act('launch', () => undefined);
    policy.act('settlement', () => undefined);
    policy.stop('nonwin'); policy.stop('later reason');
    expect(() => policy.act('settlement', () => { throw new Error('must never run'); })).toThrow('nonwin');
    expect(policy.snapshot()).toEqual({ creations: 1, launches: 1, settlements: 1, stopped: 'nonwin' });
  });

  it('consumes and stops a failed action instead of retrying it', () => {
    const policy = createFreshPolicy();
    const failure = new Error('synthetic refusal');
    expect(() => policy.act('creation', () => { throw failure; })).toThrow(failure);
    expect(policy.snapshot()).toEqual({ creations: 1, launches: 0, settlements: 0, stopped: 'synthetic refusal' });
    expect(() => policy.act('creation', () => undefined)).toThrow();
  });

  it.each(['launch', 'settlement'] as const)('refuses premature %s without invoking it', kind => {
    const policy = createFreshPolicy();
    let calls = 0;
    expect(() => policy.act(kind, () => calls++)).toThrow();
    expect(calls).toBe(0);
    expect(policy.snapshot().stopped).not.toBeNull();
  });
});

it('refuses source drift before any native callback is admitted', () => {
  const { registration, manifest } = fixture();
  const file = join(registration.packet, 'contract.ts');
  const source = 'export const harmless = 1;\n';
  writeFileSync(file, source);
  const registered = { ...manifest, sources: { 'contract.ts': createHash('sha256').update(source).digest('hex') } };
  expect(() => verifyFreshSources(registration.packet, registered)).not.toThrow();
  writeFileSync(file, source + '// drift\n');
  expect(() => verifyFreshSources(registration.packet, registered)).toThrow('source drift');
  expect(readdirSync(registration.packet)).toEqual(['contract.ts']);
});

it('isolates opt-in discovery and preserves installed default timeouts', () => {
  const options = freshVitestOptions('/owned/repository');
  expect(options).toMatchObject({ root: '/owned/repository/tests/sim/production/one-shot', config: false,
    include: ['fresh-lineage.once.ts'], alias: { '@': '/owned/repository/src' }, setupFiles: [], globalSetup: [],
    run: true, watch: false, retry: 0, segfaultRetry: 0, fileParallelism: false, maxConcurrency: 1,
    pool: 'forks', poolOptions: { forks: { singleFork: true, isolate: true } },
    dangerouslyIgnoreUnhandledErrors: false, passWithNoTests: false });
  for (const timeout of ['testTimeout', 'hookTimeout', 'teardownTimeout']) expect(options).not.toHaveProperty(timeout);
});

it('requires exactly one passed ordinary case, refusing green-looking incomplete task trees', () => {
  const test = { type: 'test', name: 'native prefix', mode: 'run', state: 'pass' };
  const file = { type: 'suite', name: '/owned/fresh-lineage.once.ts', mode: 'run', state: 'pass', tasks: [test] };
  expect(exactFreshTasks([file])).toBe(true);
  expect(exactFreshTasks([])).toBe(false);
  expect(exactFreshTasks([file, file])).toBe(false);
  for (const patch of [{ state: 'fail' }, { mode: 'skip' }, { concurrent: true }, { errors: ['unhandled'] }])
    expect(exactFreshTasks([{ ...file, tasks: [{ ...test, ...patch }] }])).toBe(false);
  expect(exactFreshTasks([{ ...file, name: '/unexpected.test.ts' }])).toBe(false);
  expect(exactFreshTasks([{ ...file, mode: 'skip' }])).toBe(false);
  expect(exactFreshTasks([{ ...file, tasks: [{ type: 'test', name: 'unfinished', mode: 'run' }] }])).toBe(false);
  expect(exactFreshTasks([{ ...file, tasks: [] }])).toBe(false);
  expect(exactFreshTasks([{ ...file, errors: ['worker failure'] }])).toBe(false);
});

it.each(['deadline', 'runner-failure'] as const)('refuses a resumed async action permanently after %s', async reason => {
  let now = 0, failed = false, calls = 0;
  const lifetime = createFreshLifetime(49, () => now, () => failed);
  let resume = () => {};
  const suspended = new Promise<void>(done => { resume = done; });
  const pending = (async () => {
    lifetime.check(); calls++;
    await suspended;
    lifetime.check(); calls++;
  })();
  if (reason === 'deadline') now = 49;
  else failed = true;
  resume();
  await expect(pending).rejects.toThrow();
  expect(calls).toBe(1);
  now = 0; failed = false;
  expect(() => lifetime.check()).toThrow();
});

it('retains explicit runner completion even before the deadline', () => {
  const lifetime = createFreshLifetime(49, () => 0, () => false);
  lifetime.check(); lifetime.stop('runner finished'); lifetime.stop('later reason');
  expect(() => lifetime.check()).toThrow('runner finished');
});
