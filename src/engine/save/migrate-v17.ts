import { historicalSocketBases as itemBases } from './historical-sockets';
import { migrateLegacyItemSocketState } from './historical-sockets';
import { deriveHistoricalV16PlayerStats } from './historical-player-stats';
import type { HistoricalItem as Item } from './historical-items';
import type { EquipmentSlot } from '../types/items';
import type { SaveV16, SaveV17, LegacyGearQuarantineEntry, LegacyGearOrigin } from '../types/save';
/** Migrate validated16 only, preserving exact incompatible payloads outside active ownership. */
export function migrateSaveV17(old: SaveV16): SaveV17 {
  const bases = new Map(itemBases.map(base => [base.id, base]));
  const quarantine: LegacyGearQuarantineEntry[] = [];
  const counts = new Map<string, number>();
  const count = (item: Item | null | undefined) => { if (item) counts.set(item.id, (counts.get(item.id) ?? 0) + 1); };
  old.inventory.backpack.forEach(count); old.inventory.stash.forEach(count);
  Object.values(old.inventory.equipped).forEach(count);
  Object.values(old.mercs.mercEquipment).forEach(equipment => { Object.values(equipment).forEach(count); });
  const convert = (item: Item, origin: LegacyGearOrigin): Item | null => {
    const base = bases.get(item.baseId);
    const converted = base && counts.get(item.id) === 1 ? migrateLegacyItemSocketState(item, base) : null;
    if (!converted) quarantine.push({ item, origin });
    return converted;
  };
  const bag = (container: 'backpack' | 'stash') => old.inventory[container].flatMap((item, index) => {
    const converted = convert(item, { container, index }); return converted ? [converted] : [];
  });
  const slots = (equipment: Readonly<Record<string, Item | null | undefined>>, mercId?: string) =>
    Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, item ? convert(item,
      mercId === undefined ? { container: 'equipped', slot: slot as EquipmentSlot }
        : { container: 'mercEquipment', mercId, slot: slot as EquipmentSlot }) : null]));
  const backpack = bag('backpack'), stash = bag('stash'), equipped = slots(old.inventory.equipped);
  const mercEquipment = Object.fromEntries(Object.entries(old.mercs.mercEquipment).map(([id, equipment]) => [id, slots(equipment, id)]));
  const playerEquipment = Object.values(equipped).filter((item): item is Item => item !== null);
  const lostPlayerGear = quarantine.some(entry => entry.origin.container === 'equipped');
  const player = { ...old.player, equipment: playerEquipment,
    ...(lostPlayerGear ? { derivedStats: deriveHistoricalV16PlayerStats(old, equipped) } : {}) };
  return { ...old, version: 17, player, inventory: { ...old.inventory, backpack, stash, equipped,
    questServices: {}, legacyGearQuarantine: quarantine },
  mercs: { ...old.mercs, mercEquipment, ownedMercs: old.mercs.ownedMercs.map(merc => ({ ...merc,
    equipment: Object.values(mercEquipment[merc.id] ?? {}).filter((item): item is Item => item !== null) })) },
  map: { ...old.map, questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
    nightmareClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0 } } };
}
