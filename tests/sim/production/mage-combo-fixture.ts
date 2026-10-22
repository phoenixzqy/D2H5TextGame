import Ajv from 'ajv';
import { createHash } from 'node:crypto';
import type { ActiveStatus } from '@/engine/combat/types';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture, type MageMasteryFixture } from './mage-mastery-fixture';

/** Imposed initial conditions; the common six-second window is diagnostic and unearned. */
export const MAGE_COMBO_CASES = { none: null, chill: 'chill', ignite: 'ignite', paralyze: 'paralyze' } as const;
export type MageComboCase = keyof typeof MAGE_COMBO_CASES;
export const MAGE_COMBO_RECIPE = { version: 'mage-combo-family-v1', origin: 'unearned-controlled-counterfactual',
  sourceHash: '71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1',
  sourceBytesHash: 'af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c' } as const;
export type MageComboRecipe = typeof MAGE_COMBO_RECIPE & { readonly caseId: MageComboCase };
const validate = new Ajv({ strict: true }).compile<MageComboRecipe>({ type: 'object',
  required: [...Object.keys(MAGE_COMBO_RECIPE), 'caseId'], additionalProperties: false,
  properties: { ...Object.fromEntries(Object.entries(MAGE_COMBO_RECIPE).map(([key, value]) => [key, { const: value }])),
    caseId: { type: 'string', enum: Object.keys(MAGE_COMBO_CASES) } } });

/** Reject custom duration, status, build, encounter, stat and seed knobs. */
export function parseMageComboRecipe(input: unknown): MageComboRecipe {
  if (!validate(input)) throw new Error('Invalid Mage combo recipe');
  return structuredClone(input);
}
type OverrideValue = number | readonly ActiveStatus[];
export interface MageComboFixture {
  readonly recipe: MageComboRecipe;
  readonly source: { readonly hash: string; readonly sha256: string };
  readonly snapshot: MageMasteryFixture['snapshot'];
  readonly allocation: MageMasteryFixture['allocation'];
  readonly overrides: readonly { readonly unitId: string; readonly field: string;
    readonly before: OverrideValue; readonly after: OverrideValue }[];
  readonly hash: string;
}

/** Reconstruct M0 directly; neutralize only enemy mitigation/dodge and add the fixed initial record. */
export function buildMageComboFixture(caseId: unknown): MageComboFixture {
  const recipe = parseMageComboRecipe({ ...MAGE_COMBO_RECIPE, caseId }), source = buildMageMasteryFixture(0);
  const sha256 = createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex');
  if (source.hash !== recipe.sourceHash || sha256 !== recipe.sourceBytesHash) throw new Error('Mage combo frozen source mismatch');
  const overrides: MageComboFixture['overrides'][number][] = [];
  const enemyTeam = source.snapshot.enemyTeam.map(enemy => {
    const stats = structuredClone(enemy.stats);
    const change = (field: string, before: OverrideValue, after: OverrideValue) => {
      if (mageJsonHash(before) !== mageJsonHash(after)) overrides.push({ unitId: enemy.id, field, before, after });
    };
    for (const field of ['defense', 'magicResist'] as const) {
      change(field, stats[field], 0);
    }
    for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison'] as const) {
      change(`resistances.${type}`, stats.resistances[type], 0);
    }
    for (const field of ['physDodge', 'magicDodge'] as const) change(field, stats[field], 0.05);
    const statuses: readonly ActiveStatus[] = recipe.caseId === 'none' ? structuredClone(enemy.statuses) :
      [{ id: recipe.caseId, stacks: 1, remaining: 6, appliedAtMs: 0, expiresAtMs: 6000, sourceId: 'diagnostic-mage-combo-condition' }];
    change('statuses', enemy.statuses, statuses);
    return { ...structuredClone(enemy), stats: { ...stats, defense: 0, magicResist: 0, physDodge: 0.05, magicDodge: 0.05,
      resistances: { ...stats.resistances, physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0 } }, statuses };
  });
  const snapshot = { ...structuredClone(source.snapshot), enemyTeam };
  const value = { recipe, source: { hash: source.hash, sha256 }, snapshot, allocation: source.allocation, overrides };
  return { ...value, hash: mageJsonHash(value) };
}

/** Expected case comes from the caller; rehashed semantic and metadata forgeries reject. */
export function assertMageComboFixture(fixture: MageComboFixture, expectedCase: MageComboCase): void {
  parseMageComboRecipe(fixture.recipe);
  if (mageJsonHash(fixture) !== mageJsonHash(buildMageComboFixture(expectedCase))) throw new Error('Mage combo full semantic/identity mismatch');
}
