import assert from 'node:assert/strict';
import { emptyEndgameState } from '@/engine/endgame/state';
import type { SaveCurrent, SaveV17 } from '@/engine/types/save';
import type { HistoricalItem } from '@/engine/save/historical-items';
import { restoreEquipment, restoreItem, restoreUnit } from '@/engine/save/restore';
import { hashObservation } from './earned-report';
import type { EarnedState } from './earned-state';

/**
 * Restore only historical Map representations after the caller authenticates raw
 * bytes. The independently pinned observation hash authenticates this witness;
 * current decoding/migration must never supply the historical cache arrays.
 */
export function authenticateHistoricalV17(original: unknown, expectedHash: string): SaveV17 {
  assert.ok(typeof original === 'object' && original !== null && 'version' in original && original.version === 17);
  const raw = structuredClone(original) as SaveV17;
  const witness: SaveV17 = { ...raw, player: restoreUnit(raw.player),
    inventory: { ...raw.inventory, backpack: raw.inventory.backpack.map(restoreItem),
      stash: raw.inventory.stash.map(restoreItem), equipped: restoreEquipment(raw.inventory.equipped),
      legacyGearQuarantine: raw.inventory.legacyGearQuarantine.map(entry => ({ ...entry, item: restoreItem(entry.item) })) },
    mercs: { ...raw.mercs, ownedMercs: raw.mercs.ownedMercs.map(restoreUnit),
      mercEquipment: Object.fromEntries(Object.entries(raw.mercs.mercEquipment)
        .map(([id, equipment]) => [id, restoreEquipment(equipment)])) } };
  assert.equal(hashObservation(witness), expectedHash, 'Historical witness hash differs from pinned source');
  return witness;
}

/** Declarative forward expectation for the two authenticated, unsocketed v17 ancestries. */
export function expectedCurrentV20(witness: SaveV17): SaveCurrent {
  assert.equal(witness.version, 17, 'Historical projection requires an explicit native17 witness');
  const present = (item: HistoricalItem | null | undefined): item is HistoricalItem => item != null;
  const items = [...witness.inventory.backpack, ...witness.inventory.stash,
    ...Object.values(witness.inventory.equipped).filter(present), ...witness.player.equipment,
    ...Object.values(witness.mercs.mercEquipment).flatMap(slots => Object.values(slots).filter(present)),
    ...witness.mercs.ownedMercs.flatMap(merc => merc.equipment)];
  for (const item of items) assert.ok(!('runes' in item) && !('socketContents' in item) && !('runewordId' in item),
    'Historical lineage adapter supports only original unsocketed gear');
  return structuredClone({ ...witness, version: 20, endgame: emptyEndgameState(),
    inventory: { ...witness.inventory, materials: {}, socketQuarantine: [], materialActionOrdinal: 0 },
    player: { ...witness.player, equipment: Object.values(witness.inventory.equipped).filter(present) },
    mercs: { ...witness.mercs, ownedMercs: witness.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: Object.values(witness.mercs.mercEquipment[merc.id] ?? {}).filter(present) })) } });
}

/** Prove the complete current save before recovering authenticated original mirrors. */
export function historicalV17Save(save: SaveCurrent, witness: SaveV17): SaveV17 {
  assert.deepEqual(save, expectedCurrentV20(witness), 'Current save differs from the complete historical forward expectation');
  return structuredClone(witness);
}

/** Preserve all observed runtime fields; prove saved domains before removing empty additions. */
export function historicalV17EarnedState(state: EarnedState, witness: SaveV17) {
  assert.ok(state.player.player, 'Historical lineage requires a live hero');
  assert.equal(state.inventory.latestMaterialAction, null, 'Historical lineage cannot discard a live material receipt');
  const { latestMaterialAction: _receipt, ...inventory } = state.inventory;
  assert.deepEqual(state.map.endgame, emptyEndgameState(), 'Historical lineage cannot discard endgame progress');
  const { endgame, ...map } = state.map;
  const historical = historicalV17Save({ version: 20, endgame, timestamp: witness.timestamp,
    player: state.player.player, inventory, mercs: state.merc, map,
    meta: { settings: state.meta.settings, idleState: state.meta.idleState, gachaState: state.meta.gachaState },
    formation: state.formation }, witness);
  const { materials: _materials, socketQuarantine: _quarantine, materialActionOrdinal: _ordinal,
    ...oldInventory } = inventory;
  return structuredClone({ ...state, map, inventory: oldInventory,
    player: { ...state.player, player: historical.player },
    merc: { ...state.merc, ownedMercs: historical.mercs.ownedMercs } });
}
