import { NIHLATHAK, hasNihlathakRelic, hasQualifiedNihlathakVictory } from '@/engine/map/nihlathak-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { hasCanonicalNihlathakDefinition } from './nihlathakContract';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
import type { RecoverToolResult } from './interactObject';

function liveLocation(): boolean {
  const map = useMapStore.getState();
  return map.currentAct === 5 && map.selectedDifficulty === 'normal' && map.isActUnlocked(5) &&
    resolveSubArea(5, map.currentSubAreaId)?.id === NIHLATHAK.areaId;
}

/** Durable source availability at the actual Crystalline Passage object; grants nothing. */
export function nihlathakRelicStatus(): 'ready' | 'owned' | 'unavailable' {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  try {
    if (!liveLocation() || !hasCanonicalNihlathakDefinition()) return 'unavailable';
    // Validate plain own data before reading a possibly malformed runtime row.
    validateQuestItemLedger(items, map.questProgress, map.questReceipts);
    if (!hasQualifiedNihlathakVictory(map.questProgress, map.questReceipts, items)) return 'unavailable';
    if (!Object.hasOwn(map.questProgress, NIHLATHAK.quest)) return 'unavailable';
    const row = map.questProgress[NIHLATHAK.quest];
    if (!row || row.id !== NIHLATHAK.quest ||
      (row.status !== 'inProgress' && row.status !== 'completed') ||
      Object.keys(row.objectives).length !== 1 || !Object.hasOwn(row.objectives, NIHLATHAK.objective) ||
      row.status === 'completed' && row.objectives[NIHLATHAK.objective] !== true) return 'unavailable';
    if (Object.hasOwn(items, NIHLATHAK.source)) return hasNihlathakRelic(map.questProgress, items, map.questReceipts) ? 'owned' : 'unavailable';
    if (row.rewardClaimed === true) return 'unavailable';
    return 'ready';
  } catch { return 'unavailable'; }
}

/**
 * Explicitly recover the archival relic and complete its single fetch under the
 * shared quest lease. No progression is awarded. Deep source rollback preserves
 * unrelated observer writes; failed restoration throws AggregateError.
 */
export function recoverNihlathakRelic(): RecoverToolResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<RecoverToolResult>(() => {
    const status = nihlathakRelicStatus();
    if (status === 'owned') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    const before = structuredClone({ rows: pick(map.questProgress, [NIHLATHAK.quest]), items: pick(inventory.questItems, [NIHLATHAK.source]) });
    const row = before.rows[NIHLATHAK.quest];
    if (!row) return 'not-eligible';
    const expected: typeof before = { rows: { [NIHLATHAK.quest]: { ...row, status: 'completed', objectives: { [NIHLATHAK.objective]: true } } },
      items: { [NIHLATHAK.source]: { itemId: NIHLATHAK.itemId, state: 'owned' as const } } };
    const context = () => hero !== null && usePlayerStore.getState().player === hero && liveLocation() &&
      hasCanonicalNihlathakDefinition() && useHydrationStore.getState().status === 'ready' && !isReplacingSave() &&
      !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat &&
      hasQualifiedNihlathakVictory(useMapStore.getState().questProgress, useMapStore.getState().questReceipts, useInventoryStore.getState().questItems);
    const exact = (rows: typeof before.rows, items: typeof before.items) => {
      const live = useMapStore.getState();
      return sameData(pick(live.questProgress, [NIHLATHAK.quest]), rows) &&
        sameData(pick(useInventoryStore.getState().questItems, [NIHLATHAK.source]), items);
    };
    try {
      if (!context()) return 'not-eligible';
      validateQuestItemLedger({ ...inventory.questItems, ...expected.items }, { ...map.questProgress, ...expected.rows }, map.questReceipts);
    } catch { return 'not-eligible'; }
    try {
      useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(expected.items), [NIHLATHAK.source]) }));
      if (!context() || !exact(before.rows, expected.items)) throw new Error('Nihlathak recovery item publication changed');
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), [NIHLATHAK.quest]) }));
      const live = useMapStore.getState(), items = useInventoryStore.getState().questItems;
      if (!context() || !exact(expected.rows, expected.items) || !hasNihlathakRelic(live.questProgress, items, live.questReceipts)) {
        throw new Error('Nihlathak recovery completion publication changed');
      }
      validateQuestItemLedger(items, live.questProgress, live.questReceipts);
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(before.items), [NIHLATHAK.source]) })); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [NIHLATHAK.quest]) })); });
      attempt(() => { if (!exact(before.rows, before.items)) throw new Error('Nihlathak recovery restoration postcondition failed'); });
      if (errors.length > 0) throw new AggregateError(errors, 'Nihlathak recovery restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
