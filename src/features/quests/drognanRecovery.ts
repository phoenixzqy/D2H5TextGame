import { DROGNAN, hasDrognanTome } from '@/engine/map/drognan-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { hasCanonicalDrognanDefinition } from './drognanContract';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
import type { RecoverToolResult } from './interactObject';

function liveLocation(): boolean {
  const map = useMapStore.getState();
  return map.currentAct === 2 && map.selectedDifficulty === 'normal' && map.isActUnlocked(2) &&
    resolveSubArea(2, map.currentSubAreaId)?.id === DROGNAN.areaId;
}

/** Durable source availability at the actual Lost City object; grants nothing. */
export function drognanTomeStatus(): 'ready' | 'owned' | 'unavailable' {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  try {
    if (!liveLocation() || !hasCanonicalDrognanDefinition()) return 'unavailable';
    // Validate plain own data before reading a possibly malformed runtime row.
    validateQuestItemLedger(items, map.questProgress, map.questReceipts);
    if (!Object.hasOwn(map.questProgress, DROGNAN.quest)) return 'unavailable';
    const row = map.questProgress[DROGNAN.quest];
    if (!row || row.id !== DROGNAN.quest ||
      (row.status !== 'inProgress' && row.status !== 'completed') ||
      Object.keys(row.objectives).length !== 1 || !Object.hasOwn(row.objectives, DROGNAN.objective) ||
      row.status === 'completed' && row.objectives[DROGNAN.objective] !== true) return 'unavailable';
    if (Object.hasOwn(items, DROGNAN.source)) return hasDrognanTome(map.questProgress, items) ? 'owned' : 'unavailable';
    if (row.rewardClaimed === true) return 'unavailable';
    return 'ready';
  } catch { return 'unavailable'; }
}

/**
 * Explicitly recover the archival tome and complete its single fetch under the
 * shared quest lease. No progression is awarded. Deep source rollback preserves
 * unrelated observer writes; failed restoration throws AggregateError.
 */
export function recoverDrognanTome(): RecoverToolResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<RecoverToolResult>(() => {
    const status = drognanTomeStatus();
    if (status === 'owned') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    const before = structuredClone({ rows: pick(map.questProgress, [DROGNAN.quest]), items: pick(inventory.questItems, [DROGNAN.source]) });
    const row = before.rows[DROGNAN.quest];
    if (!row) return 'not-eligible';
    const expected: typeof before = { rows: { [DROGNAN.quest]: { ...row, status: 'completed', objectives: { [DROGNAN.objective]: true } } },
      items: { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' as const } } };
    const context = () => hero !== null && usePlayerStore.getState().player === hero && liveLocation() &&
      hasCanonicalDrognanDefinition() && useHydrationStore.getState().status === 'ready' && !isReplacingSave() &&
      !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
    const exact = (rows: typeof before.rows, items: typeof before.items) => {
      const live = useMapStore.getState();
      return sameData(pick(live.questProgress, [DROGNAN.quest]), rows) &&
        sameData(pick(useInventoryStore.getState().questItems, [DROGNAN.source]), items);
    };
    try {
      if (!context()) return 'not-eligible';
      validateQuestItemLedger({ ...inventory.questItems, ...expected.items }, { ...map.questProgress, ...expected.rows }, map.questReceipts);
    } catch { return 'not-eligible'; }
    try {
      useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(expected.items), [DROGNAN.source]) }));
      if (!context() || !exact(before.rows, expected.items)) throw new Error('Drognan recovery item publication changed');
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), [DROGNAN.quest]) }));
      const live = useMapStore.getState(), items = useInventoryStore.getState().questItems;
      if (!context() || !exact(expected.rows, expected.items) || !hasDrognanTome(live.questProgress, items)) {
        throw new Error('Drognan recovery completion publication changed');
      }
      validateQuestItemLedger(items, live.questProgress, live.questReceipts);
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(before.items), [DROGNAN.source]) })); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [DROGNAN.quest]) })); });
      attempt(() => { if (!exact(before.rows, before.items)) throw new Error('Drognan recovery restoration postcondition failed'); });
      if (errors.length > 0) throw new AggregateError(errors, 'Drognan recovery restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
