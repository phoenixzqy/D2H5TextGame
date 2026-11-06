import type { QuestItemLedger, QuestProgressData } from '../types/save';

export type Act2CacheKey = 'horazon' | 'elzix';
/** Durable authority only; historical readers supply their own explicit domain. */
export interface Act2CacheDomain {
  readonly key: Act2CacheKey;
  readonly quest: string;
  readonly objective: string;
  readonly source: string;
  readonly itemId: string;
}

/** Closed runtime tuples; no caller-selected reward, source or area. */
export const ACT2_CACHES = Object.freeze({
  horazon: Object.freeze({ key: 'horazon', quest: 'quests/side-act2-summoners-secret',
    objective: 'obj-find', source: 'quests/side-act2-summoners-secret#objective:obj-find',
    itemId: 'quest/horazon_lockbox', actId: 'acts/act2', npc: 'npc/atma',
    areaId: 'areas/act2-arcane-sanctuary', targetId: 'objects/horazon_lockbox_cache',
    xp: 5000, mercXp: 3750, uniqueId: 'items/unique/manald-heal', ilvl: 23 }),
  elzix: Object.freeze({ key: 'elzix', quest: 'quests/side-act2-lost-caravan',
    objective: 'obj-find-box', source: 'quests/side-act2-lost-caravan#objective:obj-find-box',
    itemId: 'quest/elzix_strongbox', actId: 'acts/act2', npc: 'npc/elzix',
    areaId: 'areas/act2-far-oasis', targetId: 'objects/elzix_strongbox_cache',
    xp: 3000, mercXp: 2250, uniqueId: 'items/unique/eye-of-etlich', ilvl: 18 })
} as const);

export const ACT2_CACHE_DOMAINS: readonly Act2CacheDomain[] = Object.freeze(
  (['horazon', 'elzix'] as const).map(key => {
    const { quest, objective, source, itemId } = ACT2_CACHES[key];
    return Object.freeze({ key, quest, objective, source, itemId });
  })
);

/** Routing identity remains closed even if loaded authoring is malformed. */
export function act2CacheKeyForQuest(questId: string): Act2CacheKey | undefined {
  if (questId === ACT2_CACHES.horazon.quest) return 'horazon';
  if (questId === ACT2_CACHES.elzix.quest) return 'elzix';
  return undefined;
}
/** An exact source match is the sole source routing authority. */
export function act2CacheKeyForSource(source: string): Act2CacheKey | undefined {
  if (source === ACT2_CACHES.horazon.source) return 'horazon';
  if (source === ACT2_CACHES.elzix.source) return 'elzix';
  return undefined;
}

function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) &&
    Reflect.ownKeys(value).every(key => {
      const field = Object.getOwnPropertyDescriptor(value, key);
      return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
    });
}
function ownData(value: Record<string, unknown>, key: string): unknown {
  return Object.getOwnPropertyDescriptor(value, key)?.value as unknown;
}
function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) &&
    Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function admittedDomains(domains: readonly Act2CacheDomain[]): ReadonlySet<Act2CacheKey> {
  if (!Array.isArray(domains) || Object.getPrototypeOf(domains) !== Array.prototype || domains.length > 2 ||
    Reflect.ownKeys(domains).some(key => key !== 'length' &&
      (typeof key !== 'string' || !['0', '1'].slice(0, domains.length).includes(key)))) {
    throw new Error('Invalid cache domain array');
  }
  const admitted = new Set<Act2CacheKey>();
  for (let index = 0; index < domains.length; index++) {
    const field = Object.getOwnPropertyDescriptor(domains, String(index));
    const domain: unknown = field && Object.hasOwn(field, 'value') && field.enumerable ? field.value as unknown : undefined;
    if (!jsonRecord(domain) || !exactKeys(domain, ['key', 'quest', 'objective', 'source', 'itemId'])) {
      throw new Error('Invalid cache domain descriptor');
    }
    const key = ownData(domain, 'key');
    if (key !== 'horazon' && key !== 'elzix') throw new Error('Unknown cache domain');
    const canonical = ACT2_CACHES[key];
    if (admitted.has(key) || !(['quest', 'objective', 'source', 'itemId'] as const)
      .every(name => ownData(domain, name) === canonical[name])) throw new Error('Changed or duplicate cache domain');
    admitted.add(key);
  }
  return admitted;
}
function completedRow(value: unknown, domain: Act2CacheDomain): value is QuestProgressData {
  if (!jsonRecord(value) || !exactKeys(value, ['id', 'status', 'objectives'], ['rewardClaimed']) ||
    ownData(value, 'id') !== domain.quest || ownData(value, 'status') !== 'completed' ||
    Object.hasOwn(value, 'rewardClaimed') && typeof ownData(value, 'rewardClaimed') !== 'boolean') return false;
  const objectives = ownData(value, 'objectives');
  return jsonRecord(objectives) && exactKeys(objectives, [domain.objective]) && ownData(objectives, domain.objective) === true;
}

/**
 * Validate only this two-source retained family. The outer save validator still
 * owns all unrelated rows/keys. Source-free historical flags earn nothing and are
 * left unchanged. A supplied empty domain rejects every new cache proof; there
 * is deliberately no default parameter or historical fallback to live authority.
 */
export function validateAct2CacheGraphs(progress: unknown, items: unknown,
  domains: readonly Act2CacheDomain[]): void {
  if (!jsonRecord(progress) || !jsonRecord(items)) throw new Error('Invalid save: cache maps require own JSON records');
  const admitted = admittedDomains(domains);
  for (const key of ['horazon', 'elzix'] as const) {
    const domain = ACT2_CACHES[key];
    // Prefixes only reject reserved unknown keys; they never grant authority.
    if (Object.keys(items).some(source => source.startsWith(`${domain.quest}#`) && source !== domain.source)) {
      throw new Error('Invalid save: unknown cache source');
    }
    if (!Object.hasOwn(items, domain.source)) continue;
    if (!admitted.has(key)) throw new Error('Invalid save: cache source outside supplied historical domain');
    const item = ownData(items, domain.source);
    if (!jsonRecord(item) || !exactKeys(item, ['itemId', 'state']) || ownData(item, 'itemId') !== domain.itemId ||
      ownData(item, 'state') !== 'owned' || !completedRow(ownData(progress, domain.quest), domain)) {
      throw new Error('Invalid save: cache proof requires its retained owned item and exact completed objective');
    }
  }
}

/** Exact proof remains owned after Claim; claimed status alone never earns it. */
export function hasAct2CacheRetainedProof(key: Act2CacheKey,
  progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  domains: readonly Act2CacheDomain[]): boolean {
  try {
    validateAct2CacheGraphs(progress, items, domains);
    return Object.hasOwn(items, ACT2_CACHES[key].source);
  } catch { return false; }
}
