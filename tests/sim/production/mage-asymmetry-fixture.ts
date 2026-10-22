import Ajv from 'ajv';
import { createHash } from 'node:crypto';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMitigationFixture, type MageMitigationFixture } from './mage-mitigation-fixture';

/** Fixed one-knob interventions; every cell is synthetic and unearned. */
export const MAGE_ASYMMETRY_CASES = {
  neutral: { physicalResist: 0, elementalResist: 0, physDodge: 0.05, magicDodge: 0.05 },
  'physical-resist': { physicalResist: 75, elementalResist: 0, physDodge: 0.05, magicDodge: 0.05 },
  'elemental-resist': { physicalResist: 0, elementalResist: 75, physDodge: 0.05, magicDodge: 0.05 },
  'physical-dodge': { physicalResist: 0, elementalResist: 0, physDodge: 0.35, magicDodge: 0.05 },
  'magical-dodge': { physicalResist: 0, elementalResist: 0, physDodge: 0.05, magicDodge: 0.35 }
} as const;
export type MageAsymmetryCase = keyof typeof MAGE_ASYMMETRY_CASES;
export const MAGE_ASYMMETRY_RECIPE = { version: 'mage-asymmetry-family-v1', origin: 'unearned-controlled-counterfactual',
  sourceHash: 'e3eb0805ba668583a8f2d26d986071aab9ede8d68c7cbe7a70702302c4d537dd',
  sourceBytesHash: '5efa93aa26fb17572bd5c4bd1ec4b99871cb20f12f0b4c6d4244e224be6bb2f2' } as const;
export type MageAsymmetryRecipe = typeof MAGE_ASYMMETRY_RECIPE & { readonly caseId: MageAsymmetryCase };
const validate = new Ajv({ strict: true }).compile<MageAsymmetryRecipe>({ type: 'object',
  required: [...Object.keys(MAGE_ASYMMETRY_RECIPE), 'caseId'], additionalProperties: false,
  properties: { ...Object.fromEntries(Object.entries(MAGE_ASYMMETRY_RECIPE).map(([key, value]) => [key, { const: value }])),
    caseId: { type: 'string', enum: Object.keys(MAGE_ASYMMETRY_CASES) } } });

/** Reject custom stats, build, encounter and seed knobs. */
export function parseMageAsymmetryRecipe(input: unknown): MageAsymmetryRecipe {
  if (!validate(input)) throw new Error('Invalid Mage asymmetry recipe');
  return structuredClone(input);
}
type Resistance = 'physical' | 'fire' | 'cold' | 'lightning' | 'poison';
export interface MageAsymmetryFixture {
  readonly recipe: MageAsymmetryRecipe;
  readonly source: { readonly hash: string; readonly sha256: string; readonly mastery: MageMitigationFixture['source'] };
  readonly snapshot: MageMitigationFixture['snapshot'];
  readonly allocation: MageMitigationFixture['allocation'];
  readonly overrides: readonly { readonly unitId: string; readonly field: `resistances.${Resistance}` | 'physDodge' | 'magicDodge';
    readonly before: number; readonly after: number }[];
  readonly hash: string;
}

/** Reconstruct the exact zero-mitigation source, preserving every undeclared field. */
export function buildMageAsymmetryFixture(caseId: unknown): MageAsymmetryFixture {
  const recipe = parseMageAsymmetryRecipe({ ...MAGE_ASYMMETRY_RECIPE, caseId });
  const source = buildMageMitigationFixture('d00-m00');
  const sha256 = createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex');
  if (source.hash !== recipe.sourceHash || sha256 !== recipe.sourceBytesHash) throw new Error('Mage asymmetry frozen source mismatch');
  const values = MAGE_ASYMMETRY_CASES[recipe.caseId];
  const overrides: MageAsymmetryFixture['overrides'][number][] = [];
  const enemyTeam = source.snapshot.enemyTeam.map(enemy => {
    const resistances = { ...enemy.stats.resistances };
    for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison'] as const) {
      const before = enemy.stats.resistances[type], after = type === 'physical' ? values.physicalResist : values.elementalResist;
      if (before !== after) overrides.push({ unitId: enemy.id, field: `resistances.${type}`, before, after });
      resistances[type] = after;
    }
    for (const field of ['physDodge', 'magicDodge'] as const) {
      if (enemy.stats[field] !== values[field]) overrides.push({ unitId: enemy.id, field, before: enemy.stats[field], after: values[field] });
    }
    return { ...structuredClone(enemy), stats: { ...structuredClone(enemy.stats), resistances,
      physDodge: values.physDodge, magicDodge: values.magicDodge } };
  });
  const snapshot = { ...structuredClone(source.snapshot), enemyTeam };
  const value = { recipe, source: { hash: source.hash, sha256, mastery: source.source }, snapshot, allocation: source.allocation, overrides };
  return { ...value, hash: mageJsonHash(value) };
}

/** Expected case is external; matching forged metadata cannot establish semantic identity. */
export function assertMageAsymmetryFixture(fixture: MageAsymmetryFixture, expectedCase: MageAsymmetryCase): void {
  parseMageAsymmetryRecipe(fixture.recipe);
  if (mageJsonHash(fixture) !== mageJsonHash(buildMageAsymmetryFixture(expectedCase))) throw new Error('Mage asymmetry full semantic/identity mismatch');
}
