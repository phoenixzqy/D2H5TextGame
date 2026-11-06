import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  fingerprintEntries,
  fingerprintFixture,
  parseRunProvenance,
  type FingerprintEntry,
  type FreshFixture,
  type RunProvenance
} from './fixture';

const excludedDirectories = [
  '.git',
  'node_modules',
  '.vite',
  'dist',
  'dist-ssr',
  'coverage',
  '.nyc_output',
  'test-results',
  'playwright-report',
  '.cache',
  'tmp',
  'temp',
  '__pycache__'
] as const;
const directoryRoots = ['src', 'tests/sim/production', 'scripts'] as const;
// Vite appends this suffix while importing an ESM config, then unlinks the bundle.
const generatedRootConfigModule =
  /^(?:vite|vitest)(?:[.-].+)?\.[cm]?[jt]s\.timestamp-\d+-[0-9a-f]*\.mjs$/u;
export const collectionPolicy = {
  version: 'production-source-v2',
  directoryRoots,
  requiredRootFiles: ['package.json', 'package-lock.json'],
  rootConfigPatterns: ['vite/vitest *.[cm]?[jt]s', 'tsconfig*.json'],
  excludedRootConfigPatterns: [generatedRootConfigModule.source],
  excludedDirectories,
  untrackedFiles: 'included',
  symlinks: 'rejected'
} as const;

export interface SourceState {
  readonly sourceSha: string;
  readonly sourceTreeHash: string;
  readonly dataHash: string;
  readonly nodeVersion: string;
  readonly vitestVersion: string;
  readonly collectionPolicy: typeof collectionPolicy;
  readonly manifest: readonly {
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
  }[];
  readonly dirty: { readonly isDirty: boolean; readonly porcelainEntries: readonly string[] };
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

/** Hash the actual selected filesystem bytes, including relevant untracked files. */
export function collectSourceState(repoRoot: string): SourceState {
  const root = realpathSync(repoRoot);
  const entries: FingerprintEntry[] = [];
  function visit(relative: string): void {
    const absolute = path.join(root, relative);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Source symlink is unsupported: ${relative}`);
    if (!isWithin(root, realpathSync(absolute)))
      throw new Error(`Source escapes repository: ${relative}`);
    if (stat.isDirectory()) {
      for (const child of readdirSync(absolute).sort()) {
        if (!(excludedDirectories as readonly string[]).includes(child))
          visit(`${relative}/${child}`);
      }
    } else if (stat.isFile()) {
      entries.push({ path: relative, bytes: readFileSync(absolute) });
    } else throw new Error(`Unreadable source input: ${relative}`);
  }
  for (const relative of directoryRoots) visit(relative);
  const rootFiles = new Set<string>(collectionPolicy.requiredRootFiles);
  for (const name of readdirSync(root)) {
    if (
      !generatedRootConfigModule.test(name) &&
      (/^(?:vite|vitest)(?:[.-].+)?\.[cm]?[jt]s$/u.test(name) || /^tsconfig.*\.json$/u.test(name))
    )
      rootFiles.add(name);
  }
  for (const relative of [...rootFiles].sort()) visit(relative);
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8'
  }).trim();
  const dirtyEntries = execFileSync(
    'git',
    ['status', '--porcelain=v1', '-z', '--untracked-files=all'],
    { cwd: root, encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean);
  const require = createRequire(import.meta.url);
  const installedPackage: unknown = JSON.parse(
    readFileSync(require.resolve('vitest/package.json'), 'utf8')
  );
  if (
    typeof installedPackage !== 'object' ||
    installedPackage === null ||
    !('version' in installedPackage) ||
    typeof installedPackage.version !== 'string'
  )
    throw new Error('Cannot read installed Vitest version');
  return {
    sourceSha,
    sourceTreeHash: fingerprintEntries(entries),
    dataHash: fingerprintEntries(entries.filter((entry) => entry.path.startsWith('src/data/'))),
    nodeVersion: process.version,
    vitestVersion: installedPackage.version,
    collectionPolicy,
    manifest: entries.map(({ path: relative, bytes }) => ({
      path: relative,
      byteLength: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex')
    })),
    dirty: { isDirty: dirtyEntries.length > 0, porcelainEntries: dirtyEntries }
  };
}

/** Validate complete actual source/tool identity together with the validated recipe. */
export function buildRunProvenance(state: SourceState, fixture: FreshFixture): RunProvenance {
  return parseRunProvenance({
    sourceSha: state.sourceSha,
    sourceTreeHash: state.sourceTreeHash,
    dataHash: state.dataHash,
    fixtureHash: fingerprintFixture(fixture),
    fixtureVersion: fixture.fixtureVersion,
    nodeVersion: state.nodeVersion,
    vitestVersion: state.vitestVersion
  });
}

/** Refuse a report when source identity changed while its production modules loaded/ran. */
export function assertSourceStable(before: SourceState, after: SourceState): void {
  if (
    before.sourceSha !== after.sourceSha ||
    before.sourceTreeHash !== after.sourceTreeHash ||
    before.dataHash !== after.dataHash
  )
    throw new Error('Production source/data drift during measurement');
}

/** Require a new absolute output leaf with an existing real parent outside the repo. */
export function validateOutputPath(repoRoot: string, outputPath: string): string {
  if (!path.isAbsolute(outputPath)) throw new Error('Report output must be absolute');
  const root = realpathSync(repoRoot);
  const parent = realpathSync(path.dirname(outputPath));
  const resolved = path.join(parent, path.basename(outputPath));
  if (isWithin(root, resolved)) throw new Error('Report output must be outside repository');
  try {
    lstatSync(resolved);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return resolved;
    throw error;
  }
  throw new Error('Report output already exists');
}

/** Serialize first, create exclusively, and remove only our newly created leaf on failure. */
export function writeNewReport(repoRoot: string, outputPath: string, report: unknown): void {
  const serialized: unknown = JSON.stringify(report, null, 2);
  if (typeof serialized !== 'string') throw new Error('Report is not serializable');
  const destination = validateOutputPath(repoRoot, outputPath);
  const descriptor = openSync(destination, 'wx');
  let closed = false;
  try {
    writeFileSync(descriptor, `${serialized}\n`, 'utf8');
    closeSync(descriptor);
    closed = true;
  } catch (error) {
    const failures: unknown[] = [error];
    if (!closed) {
      try {
        closeSync(descriptor);
      } catch (closeError) {
        failures.push(closeError);
      }
    }
    try {
      unlinkSync(destination);
    } catch (cleanupError) {
      failures.push(cleanupError);
    }
    throw new AggregateError(failures, 'Report write failed; newly owned output cleanup attempted');
  }
}
