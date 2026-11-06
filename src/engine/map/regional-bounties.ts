/** Finite format authority; quest copy and rewards remain JSON-authored. */
export const REGIONAL_BOUNTY_DOMAIN = Object.freeze([
  Object.freeze({ key: 'moor', quest: 'quests/bounty-act1-moor-cull', actId: 'acts/act1',
    area: 'areas/act1-blood-moor', objective: 'obj-cull' }),
  Object.freeze({ key: 'waste', quest: 'quests/bounty-act2-waste-cull', actId: 'acts/act2',
    area: 'areas/act2-rocky-waste', objective: 'obj-cull' }),
  Object.freeze({ key: 'forest', quest: 'quests/bounty-act3-forest-cull', actId: 'acts/act3',
    area: 'areas/act3-spider-forest', objective: 'obj-cull' }),
  Object.freeze({ key: 'steppes', quest: 'quests/bounty-act4-steppes-cull', actId: 'acts/act4',
    area: 'areas/act4-outer-steppes', objective: 'obj-cull' }),
  Object.freeze({ key: 'foothills', quest: 'quests/bounty-act5-foothills-cull', actId: 'acts/act5',
    area: 'areas/act5-bloody-foothills', objective: 'obj-cull' })
] as const);

export type RegionalBountyDefinition = (typeof REGIONAL_BOUNTY_DOMAIN)[number];
export type RegionalBountyQuestId = RegionalBountyDefinition['quest'];
/** Durable cycle sequence, independent of the cycling combat planner ordinal. */
export interface RegionalBountyEntry { readonly claims: number; readonly victoryOrdinal: number }
export type RegionalBountyLedger = Partial<Record<RegionalBountyQuestId, RegionalBountyEntry>>;
export type RegionalBountyState = 'never-accepted' | 'active' | 'completed' | 'paid';
export const REGIONAL_BOUNTY_MAX_CLAIMS = 1_000_000;

function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function own(value: object, key: string): unknown { return Object.getOwnPropertyDescriptor(value, key)?.value as unknown; }
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function canonicalDomain(domain: unknown): domain is readonly RegionalBountyDefinition[] {
  if (!Array.isArray(domain) || Object.getPrototypeOf(domain) !== Array.prototype ||
    own(domain, 'length') !== REGIONAL_BOUNTY_DOMAIN.length ||
    Reflect.ownKeys(domain).some(key => key !== 'length' && !REGIONAL_BOUNTY_DOMAIN.some((_, index) => String(index) === key))) return false;
  return REGIONAL_BOUNTY_DOMAIN.every((definition, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(domain, String(index)), candidate: unknown = descriptor?.value;
    return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value') && jsonRecord(candidate) &&
      exact(candidate, ['key', 'quest', 'actId', 'area', 'objective']) &&
      (['key', 'quest', 'actId', 'area', 'objective'] as const).every(key => own(candidate, key) === definition[key]);
  });
}
function counter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= REGIONAL_BOUNTY_MAX_CLAIMS;
}
function state(row: unknown, entry: unknown, definition: RegionalBountyDefinition): Exclude<RegionalBountyState, 'never-accepted'> | undefined {
  if (!jsonRecord(row) || !exact(row, ['id', 'status', 'rewardClaimed', 'objectives']) || own(row, 'id') !== definition.quest ||
    !jsonRecord(entry) || !exact(entry, ['claims', 'victoryOrdinal'])) return undefined;
  const objectives = own(row, 'objectives'), claims = own(entry, 'claims'), victory = own(entry, 'victoryOrdinal');
  if (!jsonRecord(objectives) || !exact(objectives, [definition.objective]) || !counter(claims) || !counter(victory)) return undefined;
  const status = own(row, 'status'), done = own(objectives, definition.objective), paid = own(row, 'rewardClaimed');
  if (claims < REGIONAL_BOUNTY_MAX_CLAIMS && victory === claims && status === 'inProgress' && done === false && paid === false) return 'active';
  if (claims < REGIONAL_BOUNTY_MAX_CLAIMS && victory === claims + 1 && status === 'completed' && done === true && paid === false) return 'completed';
  if (claims >= 1 && victory === claims && status === 'completed' && done === true && paid === true) return 'paid';
  return undefined;
}

/** Read-only finite identity lookup; it supplies no acceptance or victory authority. */
export function findRegionalBounty(questId: string): RegionalBountyDefinition | undefined {
  return REGIONAL_BOUNTY_DOMAIN.find(definition => definition.quest === questId);
}

/** Validate reciprocal own JSON rows/counters; absent domain disables all future bounty state. */
export function validateRegionalBountyGraph(progress: unknown, bounties: unknown,
  domain: readonly RegionalBountyDefinition[] | undefined): void {
  if (!jsonRecord(progress) || !jsonRecord(bounties)) throw new Error('Invalid save: bounty maps require own JSON records');
  if (domain !== undefined && !canonicalDomain(domain)) throw new Error('Invalid save: changed regional bounty domain');
  if (Object.keys(bounties).some(quest => !findRegionalBounty(quest))) throw new Error('Invalid save: unknown regional bounty');
  for (const definition of REGIONAL_BOUNTY_DOMAIN) {
    const hasRow = Object.hasOwn(progress, definition.quest), hasEntry = Object.hasOwn(bounties, definition.quest);
    if (!hasRow && !hasEntry) continue;
    if (domain === undefined || !hasRow || !hasEntry || !state(own(progress, definition.quest), own(bounties, definition.quest), definition)) {
      throw new Error('Invalid save: regional bounty requires its exact cycle state');
    }
  }
}

/** Pure validated journal state; neither prior area flags nor combat ordinals imply a cycle. */
export function regionalBountyState(questId: string, progress: unknown, bounties: unknown,
  domain: readonly RegionalBountyDefinition[] | undefined): RegionalBountyState | undefined {
  try {
    validateRegionalBountyGraph(progress, bounties, domain);
    const definition = findRegionalBounty(questId);
    if (!domain || !definition || !jsonRecord(progress) || !jsonRecord(bounties)) return undefined;
    return Object.hasOwn(progress, questId) ? state(own(progress, questId), own(bounties, questId), definition) : 'never-accepted';
  } catch { return undefined; }
}
