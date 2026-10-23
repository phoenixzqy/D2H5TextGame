import { materialCatalog } from '../../data/loaders/materials';
import type { Item } from '../types/items';
import type { KillRewards } from './award';
import { MaterialRewardError, mergeMaterials, type MaterialLedger } from './materials';

function safeCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new MaterialRewardError('Invalid reward count');
  return value;
}

function materialTotals(materials: MaterialLedger): { runes: number; gems: number } {
  let runes = 0, gems = 0;
  for (const [id, amount] of Object.entries(materials)) {
    const kind = materialCatalog.get(id)?.kind;
    if (kind === 'rune') runes = safeCount(runes + amount);
    if (kind === 'gem') gems = safeCount(gems + amount);
  }
  return { runes, gems };
}

function checkedItemId(item: unknown): string {
  if (typeof item !== 'object' || item === null || !('id' in item) ||
    typeof item.id !== 'string' || item.id.length === 0) throw new MaterialRewardError('Invalid reward item');
  return item.id;
}

function appendItems(owned: readonly Item[], additions: readonly Item[], otherOwned: readonly Item[] = []): Item[] {
  const ids = new Set<string>();
  const items = [...owned, ...additions];
  for (const item of [...otherOwned, ...items]) {
    const id = checkedItemId(item);
    if (ids.has(id)) throw new MaterialRewardError('Duplicate reward item');
    ids.add(id);
  }
  return items;
}

/** Validate and merge whole generated bags; rune/gem scalars describe exact concrete holdings. */
export function mergeRewards(...rewards: readonly KillRewards[]): KillRewards {
  let result: KillRewards = { items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 0, materials: {} };
  for (const reward of rewards) {
    const materials = mergeMaterials(reward.materials);
    const totals = materialTotals(materials);
    for (const field of ['runeShards', 'wishstones', 'runes', 'gems'] as const) safeCount(reward[field]);
    if (totals.runes !== reward.runes || totals.gems !== reward.gems) {
      throw new MaterialRewardError('Material totals disagree with reward summaries');
    }
    result = {
      items: appendItems(result.items, reward.items),
      runeShards: safeCount(result.runeShards + reward.runeShards),
      wishstones: safeCount(result.wishstones + reward.wishstones),
      runes: safeCount(result.runes + reward.runes), gems: safeCount(result.gems + reward.gems),
      materials: mergeMaterials(result.materials, materials)
    };
  }
  return result;
}

/** Current ownership across every gear location; legacy currency keys remain opaque and conserved. */
export interface RewardDestination {
  readonly backpack: readonly Item[];
  readonly stash: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly mercEquipment: Readonly<Record<string, Readonly<Record<string, Item | null>>>>;
  readonly currencies: Readonly<Record<string, number>>;
  readonly materials: MaterialLedger;
}

/** A privately prepared inventory patch suitable for a single guarded publication. */
export interface RewardGrant {
  readonly backpack: Item[];
  readonly currencies: Record<string, number>;
  readonly materials: MaterialLedger;
}

/** Preflight the whole bag and destination arithmetic; earned gear may use visible overflow. */
export function planRewardGrant(rewards: KillRewards, destination: RewardDestination): RewardGrant {
  const bag = mergeRewards(rewards);
  const materials = mergeMaterials(destination.materials, bag.materials);
  const currencies = { ...destination.currencies };
  for (const [id, amount] of [['rune-shard', bag.runeShards], ['wishstone', bag.wishstones]] as const) {
    if (amount === 0) continue;
    const previous = Object.hasOwn(currencies, id) ? currencies[id] : 0;
    currencies[id] = safeCount(safeCount(previous ?? 0) + amount);
  }
  const otherOwned = [...destination.stash,
    ...Object.values(destination.equipped).filter((item): item is Item => item !== null),
    ...Object.values(destination.mercEquipment).flatMap(equipment =>
      Object.values(equipment).filter((item): item is Item => item !== null))];
  return { backpack: appendItems(destination.backpack, bag.items, otherOwned), currencies, materials };
}
