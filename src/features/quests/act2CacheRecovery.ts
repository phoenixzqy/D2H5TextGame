import { ACT2_CACHES, ACT2_CACHE_DOMAINS, hasAct2CacheRetainedProof, type Act2CacheKey } from '@/engine/map/act2-cache-quests';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import { captureAct2CacheAuthority, sameAct2CacheAuthority, validateLiveAct2CacheGraphs } from './act2CacheContract';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
import type { RecoverToolResult } from './interactObject';

function readyLocation(key: Act2CacheKey): boolean {
  const map = useMapStore.getState(), hero = usePlayerStore.getState().player;
  return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' && !isReplacingSave() &&
    !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat && map.currentAct === 2 &&
    map.selectedDifficulty === 'normal' && map.isActUnlocked(2) &&
    resolveSubArea(2, map.currentSubAreaId)?.id === ACT2_CACHES[key].areaId;
}

/** Read-only availability at this exact live cache, with no income or auto-recovery. */
export function act2CacheStatus(key: Act2CacheKey): 'ready' | 'owned' | 'unavailable' {
  try {
    if (!readyLocation(key)) return 'unavailable';
    captureAct2CacheAuthority(key); validateLiveAct2CacheGraphs();
    const map = useMapStore.getState(), items = useInventoryStore.getState().questItems, tuple = ACT2_CACHES[key];
    const row = snapshotCountedData(pick(map.questProgress, [tuple.quest]))[tuple.quest];
    if (hasAct2CacheRetainedProof(key, map.questProgress, items, ACT2_CACHE_DOMAINS)) return 'owned';
    if (!row || row.id !== tuple.quest || row.rewardClaimed === true ||
      (row.status !== 'inProgress' && row.status !== 'completed') ||
      !sameData(Object.keys(row.objectives), [tuple.objective]) || typeof row.objectives[tuple.objective] !== 'boolean' ||
      row.status === 'completed' && row.objectives[tuple.objective] !== true) return 'unavailable';
    return 'ready';
  } catch { return 'unavailable'; }
}

/** Own one quest lease and publish exactly one retained proof plus terminal row. */
export function recoverAct2Cache(key: Act2CacheKey): RecoverToolResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<RecoverToolResult>(() => {
    const status = act2CacheStatus(key);
    if (status === 'owned') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const authority = captureAct2CacheAuthority(key), tuple = authority.tuple;
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    const before = snapshotCountedData({ rows: pick(map.questProgress, [tuple.quest]),
      items: pick(inventory.questItems, [tuple.source]), hero });
    const row = before.rows[tuple.quest]; if (!row || !hero) return 'not-eligible';
    const expected = { rows: { [tuple.quest]: { ...row, status: 'completed' as const, objectives: { [tuple.objective]: true } } },
      items: { [tuple.source]: { itemId: tuple.itemId, state: 'owned' as const } } };
    const context = () => readyLocation(key) && sameAct2CacheAuthority(authority) &&
      usePlayerStore.getState().player === hero && sameData(usePlayerStore.getState().player, before.hero);
    const exact = (rows: typeof before.rows, items: typeof before.items) =>
      sameData(pick(useMapStore.getState().questProgress, [tuple.quest]), rows) &&
      sameData(pick(useInventoryStore.getState().questItems, [tuple.source]), items);
    try {
      if (!context()) return 'not-eligible';
      validateQuestItemLedger(replace(inventory.questItems, expected.items, [tuple.source]),
        replace(map.questProgress, expected.rows, [tuple.quest]), map.questReceipts);
    } catch { return 'not-eligible'; }
    try {
      useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(expected.items), [tuple.source]) }));
      if (!context() || !exact(before.rows, expected.items)) throw new Error('Cache retained proof publication changed');
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(expected.rows), [tuple.quest]) }));
      if (!context() || !exact(expected.rows, expected.items)) throw new Error('Cache completion publication changed');
      validateLiveAct2CacheGraphs();
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(before.items), [tuple.source]) })); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [tuple.quest]) })); });
      attempt(() => { if (!exact(before.rows, before.items)) throw new Error('Cache recovery restoration changed'); });
      if (errors.length) throw new AggregateError(errors, 'Cache recovery restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
