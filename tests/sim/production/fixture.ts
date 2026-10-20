import Ajv from 'ajv';
import { createHash } from 'node:crypto';

/** Fresh production-creation recipe; no injected progression or combat statistics. */
export interface FreshFixture {
  readonly fixtureVersion: 1;
  readonly id: string;
  readonly origin: {
    readonly kind: 'new-character';
    readonly classId: string;
    readonly name: string;
    readonly policy: 'production-creation-defaults';
  };
  readonly scenario: {
    readonly act: 1;
    readonly subAreaId: 'areas/act1-blood-moor';
    readonly mode: 'manual';
    readonly challengeOrdinal: 0;
    readonly idleEliteMisses: 0;
  };
  readonly clockEpochMs: number;
  readonly seeds: readonly number[];
  readonly mercPolicy: 'none';
  readonly summonPolicy: 'production-default';
}

/** References come from production class/sub-area JSON, never resolver fallbacks. */
export interface FixtureReferences {
  readonly classes: readonly { readonly id: string }[];
  readonly areas: readonly { readonly id: string; readonly actId: string }[];
}

const ajv = new Ajv({ strict: true, strictNumbers: true });
const text = { type: 'string', minLength: 1 };
const strictObject = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
});
const validateFixture = ajv.compile<FreshFixture>(
  strictObject({
    fixtureVersion: { const: 1 },
    id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' },
    origin: strictObject({
      kind: { const: 'new-character' },
      classId: { type: 'string', pattern: '^[a-z]+$' },
      name: { ...text, maxLength: 40 },
      policy: { const: 'production-creation-defaults' }
    }),
    scenario: strictObject({
      act: { const: 1 },
      subAreaId: { const: 'areas/act1-blood-moor' },
      mode: { const: 'manual' },
      challengeOrdinal: { const: 0 },
      idleEliteMisses: { const: 0 }
    }),
    clockEpochMs: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
    seeds: {
      type: 'array',
      minItems: 1,
      maxItems: 256,
      uniqueItems: true,
      items: { type: 'integer', minimum: 0, maximum: 4294967295 }
    },
    mercPolicy: { const: 'none' },
    summonPolicy: { const: 'production-default' }
  })
);

/** Validate an untrusted recipe without constructing a character or mutating stores. */
export function parseFixture(input: unknown, references: FixtureReferences): FreshFixture {
  if (!validateFixture(input)) {
    throw new Error(`Invalid production fixture: ${ajv.errorsText(validateFixture.errors)}`);
  }
  if (!references.classes.some((entry) => entry.id === `classes/${input.origin.classId}`)) {
    throw new Error(`Unknown production class: ${input.origin.classId}`);
  }
  const area = references.areas.find((entry) => entry.id === input.scenario.subAreaId);
  if (!area || area.actId !== `acts/act${String(input.scenario.act)}`) {
    throw new Error('Unknown production area or mismatched act');
  }
  return structuredClone(input);
}

/** Exact source/data bytes supplied by the later runner's scoped file collector. */
export interface FingerprintEntry {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/** SHA-256 of path-sorted, length-delimited entries; no checkout path or mtime. */
export function fingerprintEntries(entries: readonly FingerprintEntry[]): string {
  if (entries.length === 0) throw new Error('Cannot fingerprint missing entries');
  const paths = new Set<string>();
  for (const { path } of entries) {
    if (
      /[:\\]/u.test(path) ||
      path.includes('\0') ||
      path.split('/').some((part) => ['', '.', '..'].includes(part))
    ) {
      throw new Error(`Noncanonical fingerprint path: ${path}`);
    }
    if (paths.has(path)) throw new Error(`Duplicate fingerprint path: ${path}`);
    paths.add(path);
  }
  const hash = createHash('sha256').update('d2h5-file-entries-v1\0');
  for (const { path, bytes } of [...entries].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0
  )) {
    // JSON header has an unambiguous end; its byte count delimits binary content.
    hash.update(JSON.stringify([path, bytes.byteLength]));
    hash.update(bytes);
  }
  return hash.digest('hex');
}

/** Recipe identity includes all values, independent of JSON object-key order. */
export function fingerprintFixture(fixture: FreshFixture): string {
  return fingerprintEntries([
    {
      path: 'fixture.json',
      bytes: new TextEncoder().encode(canonicalJson(fixture))
    }
  ]);
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  throw new Error('Fixture must contain finite JSON values');
}

/** Required measurement identity; the later runner computes these from its inputs. */
export interface RunProvenance {
  readonly sourceSha: string;
  readonly sourceTreeHash: string;
  readonly dataHash: string;
  readonly fixtureHash: string;
  readonly fixtureVersion: 1;
  readonly nodeVersion: string;
  readonly vitestVersion: string;
}

const sha256 = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const toolVersion = {
  type: 'string',
  pattern: '^v?[0-9]+\\.[0-9]+\\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$'
};
const validateProvenance = ajv.compile<RunProvenance>(
  strictObject({
    sourceSha: { type: 'string', pattern: '^(?:[a-f0-9]{40}|[a-f0-9]{64})$' },
    sourceTreeHash: sha256,
    dataHash: sha256,
    fixtureHash: sha256,
    fixtureVersion: { const: 1 },
    nodeVersion: toolVersion,
    vitestVersion: toolVersion
  })
);

/** Reject missing/placeholder provenance rather than silently inventing evidence. */
export function parseRunProvenance(input: unknown): RunProvenance {
  if (!validateProvenance(input)) {
    throw new Error(`Invalid run provenance: ${ajv.errorsText(validateProvenance.errors)}`);
  }
  return structuredClone(input);
}
