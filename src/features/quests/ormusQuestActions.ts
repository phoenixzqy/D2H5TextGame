import { loadTownNpcs } from '@/data/loaders/towns';
import { ORMUS, canTalkToOrmus, hasOrmusClear } from '@/engine/map/ormus-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
import { pick, replace, sameCainData as sameData } from './cainPublication';

export type OrmusTalkResult = 'ok' | 'already-read' | 'not-eligible' | 'not-ready' | 'no-player'
  | 'combat-active' | 'claim-in-progress' | 'grant-failed';

/** Actual Act III town presence; remembered field selection is not a town identity. */
export function isOrmusTownPresent(): boolean {
  const map = useMapStore.getState();
  return map.currentAct === 3 && map.isActUnlocked(3) && loadTownNpcs(3).some(npc => npc.id === ORMUS.npc);
}
/** Read-only ordered Talk availability; proofless legacy history remains inert. */
export function ormusTalkStatus(): 'ready' | 'completed' | 'unavailable' {
  const map = useMapStore.getState();
  if (!isOrmusTownPresent() || map.selectedDifficulty !== 'normal') return 'unavailable';
  try { validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts); }
  catch { return 'unavailable'; }
  if (canTalkToOrmus(map.questProgress, map.questReceipts)) return 'ready';
  return map.questProgress[ORMUS.quest]?.rewardClaimed !== true && hasOrmusClear(map.questProgress, map.questReceipts) &&
    map.questProgress[ORMUS.quest]?.status === 'completed' ? 'completed' : 'unavailable';
}

/** Protected current-town Talk completes the source-bound graph without income or automatic Claim. */
export function talkToOrmus(): OrmusTalkResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<OrmusTalkResult>(() => {
    const status = ormusTalkStatus();
    if (status === 'completed') return 'already-read';
    if (status !== 'ready') return 'not-eligible';
    const map = useMapStore.getState(), row = map.questProgress[ORMUS.quest], heroId = usePlayerStore.getState().player?.id;
    if (!row || !heroId) return 'not-eligible';
    const before = structuredClone({ rows: pick(map.questProgress, [ORMUS.quest]), proofs: pick(map.questReceipts, [ORMUS.proof]) });
    const expected = { ...structuredClone(row), status: 'completed' as const,
      objectives: { ...structuredClone(row.objectives), [ORMUS.talk]: true } };
    const location = { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty };
    const check = () => {
      const live = useMapStore.getState();
      if (!isOrmusTownPresent() || live.selectedDifficulty !== 'normal' || usePlayerStore.getState().player?.id !== heroId ||
        useHydrationStore.getState().status !== 'ready' || isReplacingSave() || hasActiveSubAreaRun() || useCombatStore.getState().inCombat ||
        !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, location) ||
        !sameData(pick(live.questProgress, [ORMUS.quest]), { [ORMUS.quest]: expected }) ||
        !sameData(pick(live.questReceipts, [ORMUS.proof]), before.proofs) || !hasOrmusClear(live.questProgress, live.questReceipts)) {
        throw new Error('Ormus Talk context/postcondition changed');
      }
      validateQuestItemLedger(useInventoryStore.getState().questItems, live.questProgress, live.questReceipts);
    };
    try {
      validateQuestItemLedger(useInventoryStore.getState().questItems, { ...map.questProgress, [ORMUS.quest]: expected }, map.questReceipts);
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [ORMUS.quest]: structuredClone(expected) } }));
      check();
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const restore = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
      restore(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [ORMUS.quest]),
        questReceipts: replace(state.questReceipts, structuredClone(before.proofs), [ORMUS.proof]) })); });
      restore(() => {
        const live = useMapStore.getState();
        if (!sameData(pick(live.questProgress, [ORMUS.quest]), before.rows) ||
          !sameData(pick(live.questReceipts, [ORMUS.proof]), before.proofs)) throw new Error('Ormus Talk restoration postcondition failed');
      });
      if (errors.length) throw new AggregateError(errors, 'Ormus Talk restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
