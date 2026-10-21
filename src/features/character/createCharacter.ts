/** New-character preparation and canonical equipment transfer. */
import type { Player } from '@/engine/types/entities';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { assertIronGolemOwnershipMutationAllowed, assertWaveSnapshotAllowed } from '@/stores/waveTransitionGuard';
import { CHARACTER_CLASSES, createMockPlayer, type CharacterClass } from './createMockPlayer';

/** Refusals leave the prior player and inventory data intact. */
export type CreateCharacterResult =
  | { readonly ok: true; readonly player: Player }
  | {
    readonly ok: false;
    readonly reason: 'not-ready' | 'existing-player' | 'invalid-input' | 'invalid-starter' | 'item-id-conflict' | 'equip-failed';
    readonly cause?: unknown;
  };

/**
 * Create once after hydration, preserving retained inventory and save imports.
 * Complete synchronously before navigation; restore exact data on equip failure.
 * Ordinary debounced autosave observes the completed or restored state.
 * Throws WaveGuardError before reads, preparation or rollback during an exact Iron debit,
 * wave transition or pending restore.
 */
export function createCharacter(name: string, cls: CharacterClass): CreateCharacterResult {
  assertIronGolemOwnershipMutationAllowed();
  assertWaveSnapshotAllowed();
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) {
    return { ok: false, reason: 'not-ready' };
  }
  const previousPlayer = usePlayerStore.getState().player;
  if (previousPlayer) return { ok: false, reason: 'existing-player' };
  const trimmedName = name.trim();
  if (!CHARACTER_CLASSES.includes(cls) || trimmedName.length < 1 || trimmedName.length > 16) {
    return { ok: false, reason: 'invalid-input' };
  }

  let prepared: Player;
  try {
    prepared = createMockPlayer(trimmedName, cls);
  } catch (cause) {
    return { ok: false, reason: 'invalid-starter', cause };
  }
  const inventory = useInventoryStore.getState();
  const { backpack, stash, equipped, currencies } = inventory;
  const mercs = useMercStore.getState();
  const retainedIds = new Set<string>();
  for (const item of [
    ...backpack, ...stash, ...Object.values(equipped),
    ...Object.values(mercs.mercEquipment).flatMap((slots) => Object.values(slots)),
    ...mercs.ownedMercs.flatMap((merc) => merc.equipment)
  ]) {
    if (item) retainedIds.add(item.id);
  }
  for (const item of prepared.equipment) {
    if (retainedIds.has(item.id)) return { ok: false, reason: 'item-id-conflict' };
    retainedIds.add(item.id);
  }

  const restore = () => {
    useInventoryStore.setState({ backpack, stash, equipped, currencies });
    usePlayerStore.setState({ player: previousPlayer });
  };
  try {
    usePlayerStore.getState().setPlayer({ ...prepared, equipment: [] });
    for (const item of prepared.equipment) {
      inventory.addItem({ ...item, equipped: false });
      if (!inventory.equipItem(item).ok) {
        restore();
        return { ok: false, reason: 'equip-failed' };
      }
    }
    if (prepared.equipment.length === 0) {
      usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    }
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Created player was removed during equipment transfer');
    return { ok: true, player };
  } catch (cause) {
    restore();
    return { ok: false, reason: 'equip-failed', cause };
  }
}
