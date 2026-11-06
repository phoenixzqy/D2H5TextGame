import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/skeletal-mage-signatures.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { OnHitStatus } from './effects';
import type { SkeletalMageElement } from './skeletal-mage';

/** Immutable authored payload indexed by an already authenticated Mage element. */
export type SkeletalMageSignatures = Readonly<Record<SkeletalMageElement, OnHitStatus>>;
interface AuthoredSignatures {
  readonly id: 'summons/skeletal-mage-signatures';
  readonly effects: SkeletalMageSignatures;
}
const validate = compileAuthoredValidator<AuthoredSignatures>(new Ajv2020({ strict: true, allErrors: true }), 'mageSignatures');

/** Validate all four matching payloads and copy them without retaining or freezing caller data. */
export function resolveSkeletalMageSignatures(input: unknown): SkeletalMageSignatures {
  if (!validate(input)) throw new Error('Invalid authored Mage signature effects');
  return Object.freeze({
    fire: Object.freeze({ ...input.effects.fire }),
    cold: Object.freeze({ ...input.effects.cold }),
    lightning: Object.freeze({ ...input.effects.lightning }),
    poison: Object.freeze({ ...input.effects.poison })
  });
}

/** No fallback effects or grant of summon authority; consumed only for paid battle-local bindings. */
export const SKELETAL_MAGE_SIGNATURES = resolveSkeletalMageSignatures(authored);
