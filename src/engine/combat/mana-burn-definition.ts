import Ajv2020 from 'ajv/dist/2020';
import data from '../../data/combat/mana-burn.json';
import { compileAuthoredValidator } from '../../data/authored-validators';

/** Shared direct-hit mana debit, zero-MP Arcane amplification and restoration lifetime. */
export interface ManaBurnDefinition {
  readonly id: 'combat/mana-burn';
  readonly drainFraction: number;
  readonly zeroManaArcaneMultiplier: number;
  /** The marker persists until actual MP increases. */
  readonly durationSeconds: -1;
}

const validate = compileAuthoredValidator<ManaBurnDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'manaBurn');

/** Validate and copy authored policy without retaining or freezing caller data. */
export function resolveManaBurnDefinition(source: unknown): ManaBurnDefinition {
  if (!validate(source)) throw new Error('Invalid combat Mana Burn definition');
  return Object.freeze({ id: source.id, drainFraction: source.drainFraction,
    zeroManaArcaneMultiplier: source.zeroManaArcaneMultiplier, durationSeconds: source.durationSeconds });
}

/** Validated immutable policy shared by combat, status lifetime and skill previews. */
export const MANA_BURN_DEFINITION = resolveManaBurnDefinition(data);
