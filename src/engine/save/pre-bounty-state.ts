/** Literal reservation through accepted31; no live bounty/content dependency. */
const futureBountyQuestIds = Object.freeze([
  'quests/bounty-act1-moor-cull',
  'quests/bounty-act2-waste-cull',
  'quests/bounty-act3-forest-cull',
  'quests/bounty-act4-steppes-cull',
  'quests/bounty-act5-foothills-cull'
]);

/** Inspect container descriptors, including inherited ones, without executing getters. */
function dataField(value: object, key: string): unknown {
  let owner: object | null = value;
  while (owner !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    if (descriptor) {
      if (!Object.hasOwn(descriptor, 'value')) throw new Error('Invalid save: bounty container accessor');
      return descriptor.value;
    }
    owner = Object.getPrototypeOf(owner) as object | null;
  }
  return undefined;
}

/** Refuse future state before historical normalization/migration can hide or drop it.
 * Other extension keys remain governed by their existing historical validators.
 */
export function rejectPreBountyState(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 31) return;
  const map = dataField(value, version === 1 ? 'mapProgress' : 'map');
  if (map === null || typeof map !== 'object') return;
  // Presence is forbidden even for undefined, hidden, inherited or accessor values.
  if ('bounties' in map || (map instanceof Map && Map.prototype.has.call(map, 'bounties'))) {
    throw new Error('Invalid save: reserved bounty state');
  }
  const progress = dataField(map, 'questProgress');
  if (progress === null || typeof progress !== 'object') return;
  if (futureBountyQuestIds.some(id => id in progress ||
    (progress instanceof Map && Map.prototype.has.call(progress, id)))) {
    throw new Error('Invalid save: reserved bounty quest');
  }
}
