import type { Item } from '../../src/engine/types/items';
import type { HistoricalItem } from '../../src/engine/save/historical-items';
import type { SaveCurrent, SaveV23, LegacyGearQuarantineEntry, HistoricalPlayer, CampaignMapSaveData } from '../../src/engine/types/save';
import { emptyEndgameState } from '../../src/engine/endgame/state';
import type { PlayerAuraId } from '../../src/engine/types/auras';
import type { HistoricalQuestServiceId, HistoricalQuestServiceLedger, QuestServiceEntry } from '../../src/engine/services/quest-services';

/** Construct a predecessor map only when no native Hell selection or history is lost. */
export function withoutV24Fields<T extends { map: SaveCurrent['map'] | SaveV23['map'] }>(save: T):
  Omit<T, 'map'> & { map: SaveV23['map'] } {
  const { hellClearedSubAreas, selectedDifficulty, challengeOrdinals, ...map } = save.map as SaveCurrent['map'];
  if (selectedDifficulty === 'hell' || (hellClearedSubAreas?.length ?? 0) !== 0 ||
    (challengeOrdinals.hell ?? 0) !== 0) throw new Error('Hell state has no historical representation');
  const { map: _map, ...rest } = save;
  return { ...rest, map: { ...map, selectedDifficulty,
    challengeOrdinals: { normal: challengeOrdinals.normal, nightmare: challengeOrdinals.nightmare } } };
}

/** Historical save roots never contain the new durable endgame namespace. */
export function withoutV20Fields<T extends { endgame?: unknown; inventory: Pick<SaveCurrent['inventory'], 'questServices'>; map: SaveCurrent['map'] | SaveV23['map']; player: { respecsRemaining?: unknown; selectedAuraId?: PlayerAuraId } }>(save: T):
  Omit<T, 'endgame' | 'player' | 'map' | 'inventory'> & {
    inventory: Omit<T['inventory'], 'questServices'> & { questServices: HistoricalQuestServiceLedger };
    player: Omit<T['player'], 'respecsRemaining' | 'selectedAuraId'> & Pick<HistoricalPlayer, 'selectedAuraId'>;
    map: CampaignMapSaveData;
  } {
  const { endgame: _endgame, player: _player, map: _map, inventory: _inventory, ...historical } = save;
  const currentInventory: T['inventory'] = save.inventory;
  const { questServices, ...inventory } = currentInventory;
  const historicalServices: Record<string, QuestServiceEntry<HistoricalQuestServiceId>> = {};
  for (const [source, entry] of Object.entries(questServices)) {
    const serviceId = entry.serviceId;
    if (serviceId === 'imbue_item') throw new Error('Service has no historical representation');
    historicalServices[source] = { ...entry, serviceId };
  }
  const selectedTitle = save.map.selectedTitle;
  if (selectedTitle !== null && selectedTitle !== 'titles/slayer_of_baal') {
    throw new Error('An achievement title has no historical representation');
  }
  const { respecsRemaining: _counts, selectedAuraId, ...player } = save.player as T['player'];
  if (selectedAuraId !== undefined && selectedAuraId !== 'paladin.might' && selectedAuraId !== 'paladin.meditation') {
    throw new Error('Aura selection has no historical representation');
  }
  return { ...historical, inventory: { ...inventory, questServices: historicalServices },
    player: { ...player, ...(selectedAuraId !== undefined ? { selectedAuraId } : {}) },
    map: { ...withoutV24Fields(save).map, selectedTitle } };
}

/** Remove current-only state before constructing a genuine v18 or earlier fixture. */
export function withoutV19Fields<T extends Omit<SaveCurrent, 'inventory' | 'map' | 'version'> & {
  version: number; map: SaveCurrent['map'] | SaveV23['map'];
  inventory: Omit<SaveCurrent['inventory'], 'questItems'> & { questItems?: unknown }
}>(save: T) {
  const predecessor = withoutV20Fields(save);
  const { materialActionOrdinal: _ordinal, latestMaterialAction: _receipt,
    socketQuarantine: _quarantine, ...inventory } = predecessor.inventory;
  const item = (value: Item): HistoricalItem => {
    const { socketContents, ...historical } = value;
    if (socketContents === undefined) return historical;
    if (socketContents.some(content => content.kind !== 'rune')) {
      throw new Error('A gem socket fixture has no historical rune representation');
    }
    return { ...historical, runes: socketContents.map(content => content.id) };
  };
  const equipment = (slots: Readonly<Record<string, Item | null | undefined>>) =>
    Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, value ? item(value) : null]));
  return { ...predecessor, inventory: { ...inventory,
    backpack: inventory.backpack.map(item), stash: inventory.stash.map(item),
    equipped: equipment(inventory.equipped) },
  player: { ...predecessor.player, equipment: save.player.equipment.map(item) },
  mercs: { ...save.mercs,
    ownedMercs: save.mercs.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.map(item) })),
    mercEquipment: Object.fromEntries(Object.entries(save.mercs.mercEquipment)
      .map(([id, slots]) => [id, equipment(slots)])) } };
}

/** Construct genuine predecessor fixtures before adding deliberate corruption. */
export function withoutV17Fields<T extends Omit<SaveCurrent, 'inventory' | 'map' | 'version'> & {
  version: number; map: SaveCurrent['map'] | SaveV23['map'];
  inventory: Omit<SaveCurrent['inventory'], 'questItems'> & { questItems?: unknown }
}>(save: T) {
  const predecessor = withoutV19Fields(save);
  const { materials: _materials, questServices: _services, legacyGearQuarantine: _quarantine, ...inventory } = predecessor.inventory;
  const { questTitles: _titles, questDifficulties: _difficulties, selectedTitle: _title,
    selectedDifficulty: _difficulty, nightmareClearedSubAreas: _nightmare,
    challengeOrdinals: _ordinals, ...map } = predecessor.map;
  const item = (value: HistoricalItem): HistoricalItem => {
    const { socketCapacity: _capacity, personalizedBy: _identity, ...historical } = value;
    return historical;
  };
  const equipment = (slots: Readonly<Record<string, HistoricalItem | null | undefined>>) =>
    Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, value ? item(value) : null]));
  return { ...predecessor, map, inventory: { ...inventory,
    backpack: inventory.backpack.map(item), stash: inventory.stash.map(item),
    equipped: equipment(inventory.equipped) },
  player: { ...predecessor.player, equipment: predecessor.player.equipment.map(item) },
  mercs: { ...predecessor.mercs,
    ownedMercs: predecessor.mercs.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.map(item) })),
    mercEquipment: Object.fromEntries(Object.entries(predecessor.mercs.mercEquipment)
      .map(([id, slots]) => [id, equipment(slots)])) } };
}

/** Explicit empty native17 state expected when historical saves acquire no new entitlements. */
export function withV17Defaults<T extends { inventory: object; map: object }>(save: T) {
  return { ...save, version: 17,
    inventory: { questServices: {}, legacyGearQuarantine: [] as LegacyGearQuarantineEntry[], ...save.inventory },
    map: { questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal' as const,
      nightmareClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0 }, ...save.map } };
}

/** Explicit v17→v18 expectation: one empty ledger, no reconstruction of old rewards. */
export function withV18Defaults<T extends { inventory: object; map: object }>(save: T) {
  const v17 = withV17Defaults(save);
  return { ...v17, version: 18, inventory: { ...v17.inventory, materials: {} } };
}

/** Empty v19 action/socket state; unchanged gear and validated actor caches stay exact. */
export function withV19Defaults<T extends { inventory: object; map: object }>(save: T) {
  const v18 = withV18Defaults(save);
  return { ...v18, version: 19,
    inventory: { ...v18.inventory, socketQuarantine: [], materialActionOrdinal: 0 } };
}

/** Exact v19→20 expectation: preserve all holdings and add only empty endgame. */
export function withV20Defaults<T extends { version: number }>(save: T) {
  const { version: _version, ...unchanged } = save;
  return { ...unchanged, version: 20 as const, endgame: emptyEndgameState() };
}

/** Explicit v20→21 expectation; no inferred investment or rewards. */
export function withV21Defaults<T extends { version: number; player: object }>(save: T) {
  const { version: _version, player, ...rest } = save;
  return { ...rest, version: 21 as const, player: { ...player, respecsRemaining: { stat: 3, skill: 3 } } };
}

/** v21→22 changes only the version; no inferred selection, resources or allowances. */
export function withV22Defaults<T extends { version: number }>(save: T) {
  const { version: _version, ...unchanged } = save;
  return { ...unchanged, version: 22 as const };
}

/** v22→23 registers current authority without inferred quest actions or services. */
export function withV23Defaults<T extends { version: number }>(save: T) {
  const { version: _version, ...unchanged } = save;
  return { ...unchanged, version: 23 as const };
}

/** v23→24 preserves historical ownership and adds only empty Hell history. */
export function withV24Defaults<T extends { version: number; map: { challengeOrdinals: CampaignMapSaveData['challengeOrdinals'] } }>(save: T) {
  const { version: _version, map: _map, ...unchanged } = save;
  const map: T['map'] = save.map;
  return { ...unchanged, version: 24 as const, map: { ...map,
    hellClearedSubAreas: [], challengeOrdinals: { ...map.challengeOrdinals, hell: 0 } } };
}

/** Older fixture expectations explicitly compose every added empty ownership domain. */
export function withCurrentDefaults<T extends { inventory: object; map: object; player: object }>(save: T) {
  return withV24Defaults(withV23Defaults(withV22Defaults(withV21Defaults(withV20Defaults(withV19Defaults(save))))));
}
