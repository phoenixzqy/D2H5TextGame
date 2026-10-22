import Ajv from 'ajv';
import { createHash } from 'node:crypto';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture, type MageMasteryFixture } from './mage-mastery-fixture';

/** The last cell is the authored-enemy anchor; the others are synthetic counterfactuals. */
export const MAGE_MITIGATION_CASES = {
  'd00-m00': { defense: 0, magicResist: 0 }, 'd65-m00': { defense: 65, magicResist: 0 },
  'd00-m23': { defense: 0, magicResist: 23 }, 'd65-m23': { defense: 65, magicResist: 23 }
} as const;
export type MageMitigationCase = keyof typeof MAGE_MITIGATION_CASES;
export const MAGE_MITIGATION_RECIPE = { version: 'mage-mitigation-family-v1', origin: 'unearned-controlled-counterfactual',
  sourceHash: '71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1',
  sourceBytesHash: 'af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c' } as const;
export type MageMitigationRecipe = typeof MAGE_MITIGATION_RECIPE & { readonly caseId: MageMitigationCase };
const validate = new Ajv({ strict: true }).compile<MageMitigationRecipe>({ type: 'object',
  required: [...Object.keys(MAGE_MITIGATION_RECIPE), 'caseId'], additionalProperties: false,
  properties: { ...Object.fromEntries(Object.entries(MAGE_MITIGATION_RECIPE).map(([key, value]) => [key, { const: value }])),
    caseId: { type: 'string', enum: Object.keys(MAGE_MITIGATION_CASES) } } });

/** Reject all custom build, encounter, seed and mitigation knobs. */
export function parseMageMitigationRecipe(input: unknown): MageMitigationRecipe {
  if (!validate(input)) throw new Error('Invalid Mage mitigation recipe');
  return structuredClone(input);
}
export interface MageMitigationFixture {
  readonly recipe: MageMitigationRecipe;
  readonly source: { readonly hash: string; readonly sha256: string };
  readonly snapshot: MageMasteryFixture['snapshot'];
  readonly allocation: MageMasteryFixture['allocation'];
  readonly overrides: readonly { readonly unitId: string; readonly field: 'defense' | 'magicResist';
    readonly before: number; readonly after: number }[];
  readonly hash: string;
}

/** Rebuild the frozen M0 source; only the two enemy stat fields may change. */
export function buildMageMitigationFixture(caseId: unknown): MageMitigationFixture {
  const recipe = parseMageMitigationRecipe({ ...MAGE_MITIGATION_RECIPE, caseId });
  const source = buildMageMasteryFixture(0);
  const sha256 = createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex');
  if (source.hash !== recipe.sourceHash || sha256 !== recipe.sourceBytesHash) throw new Error('Mage mitigation frozen source mismatch');
  const values = MAGE_MITIGATION_CASES[recipe.caseId];
  const overrides: MageMitigationFixture['overrides'][number][] = [];
  for (const enemy of source.snapshot.enemyTeam) {
    for (const field of ['defense', 'magicResist'] as const) {
      if (enemy.stats[field] !== values[field]) overrides.push({ unitId: enemy.id, field, before: enemy.stats[field], after: values[field] });
    }
  }
  const snapshot = { ...structuredClone(source.snapshot), enemyTeam: source.snapshot.enemyTeam.map(enemy =>
    ({ ...structuredClone(enemy), stats: { ...structuredClone(enemy.stats), ...values } })) };
  const value = { recipe, source: { hash: source.hash, sha256 }, snapshot, allocation: source.allocation, overrides };
  return { ...value, hash: mageJsonHash(value) };
}

/** Expected case comes from the caller, never from mutually agreeing input metadata. */
export function assertMageMitigationFixture(fixture: MageMitigationFixture, expectedCase: MageMitigationCase): void {
  parseMageMitigationRecipe(fixture.recipe);
  const expected = buildMageMitigationFixture(expectedCase);
  if (mageJsonHash(fixture) !== mageJsonHash(expected)) throw new Error('Mage mitigation full semantic/identity mismatch');
}
