import { REGIONAL_BOUNTY_DOMAIN, validateRegionalBountyGraph,
  type RegionalBountyDefinition, type RegionalBountyLedger } from '../map/regional-bounties';

/** Inspect the durable field before normalization can erase getters or hidden properties. */
export function readBountySaveField(map: unknown, allowAbsent: boolean,
  domain: readonly RegionalBountyDefinition[] | undefined = REGIONAL_BOUNTY_DOMAIN): RegionalBountyLedger {
  if (map === null || typeof map !== 'object') throw new Error('Invalid save: bounty map required');
  const field = Object.getOwnPropertyDescriptor(map, 'bounties');
  if (field === undefined && (!allowAbsent || 'bounties' in map)) throw new Error('Invalid save: own bounty field required');
  if (field && (field.enumerable !== true || !Object.hasOwn(field, 'value'))) throw new Error('Invalid save: bounty field requires own data');
  const progress = Object.getOwnPropertyDescriptor(map, 'questProgress');
  if (!progress || progress.enumerable !== true || !Object.hasOwn(progress, 'value')) throw new Error('Invalid save: own bounty progress required');
  const bounties: unknown = field ? field.value : {};
  validateRegionalBountyGraph(progress.value, bounties, domain);
  return bounties as RegionalBountyLedger;
}
