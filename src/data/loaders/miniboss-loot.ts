import Ajv2020 from 'ajv/dist/2020';
import type { MinibossLootPolicy } from '@/engine/loot/miniboss-equipment';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/miniboss-loot.json';

/** Validate closed rules and five distinct act/table bindings before sharing data. */
export function validateMinibossLoot(value: unknown): MinibossLootPolicy {
  const validate = compileAuthoredValidator<MinibossLootPolicy>(new Ajv2020({ strict: true, allErrors: true }), 'minibossLoot');
  if (!validate(value)) throw new Error('Invalid miniboss loot policy');
  if (new Set(value.acts.map(row => row.act)).size !== 5 ||
    new Set(value.acts.map(row => row.treasureClassId)).size !== 5) {
    throw new Error('Duplicate miniboss loot binding');
  }
  for (const row of value.acts) Object.freeze(row);
  Object.freeze(value.acts); Object.freeze(value.rarityMultipliers);
  return Object.freeze(value);
}

/** Validated live miniboss rules; references are checked at pool assembly. */
export const MINIBOSS_LOOT = validateMinibossLoot(raw);
