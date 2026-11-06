import Ajv2020 from 'ajv/dist/2020';
import type { NonbossLootPolicy } from '@/engine/loot/nonboss-equipment';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/nonboss-loot.json';

/** Validate closed tier/act rules and unique bindings before sharing authored data. */
export function validateNonbossLoot(value: unknown): NonbossLootPolicy {
  const validate = compileAuthoredValidator<NonbossLootPolicy>(new Ajv2020({ strict: true, allErrors: true }), 'nonbossLoot');
  if (!validate(value)) throw new Error('Invalid nonboss loot policy');
  const ids = value.acts.flatMap(row => row.tableIds);
  if (new Set(value.acts.map(row => row.act)).size !== 5 || new Set(ids).size !== ids.length) {
    throw new Error('Duplicate nonboss loot binding');
  }
  for (const tier of Object.values(value.tiers)) {
    Object.freeze(tier.noDrop); Object.freeze(tier.rarityMultipliers); Object.freeze(tier);
  }
  for (const row of value.acts) { Object.freeze(row.tableIds); Object.freeze(row); }
  Object.freeze(value.tiers); Object.freeze(value.acts);
  return Object.freeze(value);
}

/** Validated live tier rules; actual source references checked when assembling pools. */
export const NONBOSS_LOOT = validateNonbossLoot(raw);
