import Ajv from 'ajv';
import type { FixtureReferences } from './fixture';

/** One prospectively selected diagnostic sample; no progression or equipment overrides. */
export interface CheckpointFixture {
  readonly fixtureVersion: 3;
  readonly id: string;
  readonly checkpoint: {
    readonly kind: 'retained-earned' | 'constructed-control';
    readonly sha256: string;
    /** Acquisition evidence is supplied by the study; a hash alone does not establish earnedness. */
    readonly evidence: string;
  };
  readonly build: { readonly id: string; readonly classId: string; readonly level: number };
  readonly scenario: {
    readonly act: 1 | 2 | 3 | 4 | 5;
    readonly subAreaId: string;
    readonly mode: 'manual' | 'idle';
    readonly difficulty: 'normal' | 'nightmare' | 'hell';
    readonly challengeOrdinal: number;
    readonly idleEliteMisses: number;
  };
  readonly sample: {
    readonly stage: 'benchmark' | 'screening' | 'tuning' | 'holdout';
    readonly seed: number;
  };
  readonly clockEpochMs: number;
}

/** Shared partitions for fixture admission and population reporting. */
export const CHECKPOINT_SEED_PARTITIONS = {
  benchmark: [1, 1], screening: [1, 100], tuning: [1, 1000], holdout: [10001, 11000]
} as const;

const text = { type: 'string', minLength: 1 };
const slug = { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' };
const integer = (minimum: number, maximum: number) => ({ type: 'integer', minimum, maximum });
const object = (properties: Record<string, object>) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false
});
const ajv = new Ajv({ strict: true, strictNumbers: true });
const validate = ajv.compile<CheckpointFixture>(object({
  fixtureVersion: { const: 3 }, id: slug,
  checkpoint: object({ kind: { enum: ['retained-earned', 'constructed-control'] },
    sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' }, evidence: text }),
  build: object({ id: slug, classId: { type: 'string', pattern: '^[a-z]+$' }, level: integer(1, 99) }),
  scenario: object({ act: { enum: [1, 2, 3, 4, 5] }, subAreaId: text,
    mode: { enum: ['manual', 'idle'] }, difficulty: { enum: ['normal', 'nightmare', 'hell'] },
    challengeOrdinal: integer(0, 360359), idleEliteMisses: integer(0, Number.MAX_SAFE_INTEGER) }),
  sample: object({ stage: { enum: ['benchmark', 'screening', 'tuning', 'holdout'] },
    seed: integer(1, 11000) }),
  clockEpochMs: integer(0, Number.MAX_SAFE_INTEGER)
}));

/** Reject unsupported fields, unknown canonical contexts and overlapping holdout seeds. */
export function parseCheckpointFixture(input: unknown, references: FixtureReferences): CheckpointFixture {
  if (!validate(input)) throw new Error(`Invalid checkpoint fixture: ${ajv.errorsText(validate.errors)}`);
  if (!references.classes.some(entry => entry.id === `classes/${input.build.classId}`))
    throw new Error('Unknown checkpoint class');
  if (!references.areas.some(entry => entry.id === input.scenario.subAreaId &&
    entry.actId === `acts/act${String(input.scenario.act)}`))
    throw new Error('Unknown canonical checkpoint area or mismatched act');
  const { stage, seed } = input.sample;
  const [minimum, maximum] = CHECKPOINT_SEED_PARTITIONS[stage];
  if (seed < minimum || seed > maximum) throw new Error('Seed outside declared checkpoint sample partition');
  return structuredClone(input);
}
