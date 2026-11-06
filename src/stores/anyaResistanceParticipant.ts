import type { Player } from '@/engine/types/entities';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { countedActorContinuity } from '@/features/quests/countedQuestRollback';
import { sameCainData as sameData } from '@/features/quests/cainPublication';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';

type Resistances = Player['derivedStats']['resistances'];
/** Own only a continuous hero's six resistance channels; independent progression and damage survive. */
export function captureAnyaResistanceParticipant(hero: Player) {
  const original = structuredClone(hero.derivedStats.resistances), references = new Set([hero]);
  const initialInventory = useInventoryStore.getState(), initialMap = useMapStore.getState();
  const initialInputs = structuredClone({ cores: hero.coreStats, equipped: initialInventory.equipped });
  const initialCanonical = deriveEquippedPlayerStats(hero, hero.level, initialInventory.equipped,
    initialMap.questProgress, initialInventory.questItems, initialMap.questReceipts).resistances;
  let published: Player | undefined, independentRecomposition = false, restoring = false;
  const quest = 'quests/side-act5-anyas-gift';
  let prospectiveRow: QuestProgressData | undefined;
  const owns = (actor: Player | null): actor is Player => actor !== null &&
    (references.has(actor) || countedActorContinuity(actor, hero));
  const stop = usePlayerStore.subscribe((next, previous) => {
    for (const actor of [previous.player, next.player]) if (owns(actor)) references.add(actor);
    if (!restoring && owns(next.player) && owns(previous.player) && next.player !== published &&
      next.player.derivedStats.resistances !== previous.player.derivedStats.resistances) independentRecomposition = true;
  });
  const current = (): Player => {
    const actor = usePlayerStore.getState().player;
    if (!owns(actor)) throw new Error('Anya resistance actor changed');
    return actor;
  };
  const plan = (progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
    receipts: QuestActionReceipts): Resistances => {
    const actor = current();
    prospectiveRow = structuredClone(progress[quest]);
    return deriveEquippedPlayerStats(actor, actor.level, useInventoryStore.getState().equipped, progress, items, receipts).resistances;
  };
  const check = (expected: Resistances): void => {
    const actor = current(), map = useMapStore.getState(), inv = useInventoryStore.getState();
    if (!sameData(actor.derivedStats.resistances, expected) ||
      !sameData(deriveEquippedPlayerStats(actor, actor.level, inv.equipped,
        prospectiveRow ? { ...map.questProgress, [quest]: prospectiveRow } : map.questProgress,
        inv.questItems, map.questReceipts).resistances, expected)) throw new Error('Anya resistance publication changed');
  };
  let restored: Player | null | undefined;
  return {
    owns, plan,
    publish: (expected: Resistances): void => {
      const actor = current();
      published = { ...actor, derivedStats: { ...actor.derivedStats, resistances: structuredClone(expected) } };
      references.add(published);
      usePlayerStore.setState({ player: published });
    },
    check,
    restore: (): void => {
      const actor = usePlayerStore.getState().player;
      if (!owns(actor)) { restored = actor; return; }
      const inv = useInventoryStore.getState(), map = useMapStore.getState();
      const canonical = deriveEquippedPlayerStats(actor, actor.level, inv.equipped,
        map.questProgress, inv.questItems, map.questReceipts).resistances;
      const originalComposition = !independentRecomposition &&
        sameData({ cores: actor.coreStats, equipped: inv.equipped }, initialInputs) && sameData(canonical, initialCanonical);
      const next = { ...actor, derivedStats: { ...actor.derivedStats,
        resistances: structuredClone(originalComposition ? original : canonical) } };
      restored = structuredClone(next); references.add(next); restoring = true;
      try { usePlayerStore.setState({ player: next }); } finally { restoring = false; }
    },
    verifyRestored: (): void => {
      if (restored === undefined || !sameData(usePlayerStore.getState().player, restored)) throw new Error('Anya resistance restoration changed');
    },
    dispose: stop
  };
}
