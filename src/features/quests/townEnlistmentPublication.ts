import { loadMercPool } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { TOWN_ENLISTMENTS, hasTownEnlistmentPrerequisite, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import type { Mercenary } from '@/engine/types/entities';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { verifyQuestCurrencyPublication, type QuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { captureTownEnlistmentMercParticipant } from './townEnlistmentMercRollback';

/** Ordinary Normal readiness is shared by action and separate historical Claim. */
export function ordinaryTownEnlistmentContext(): boolean {
  return useHydrationStore.getState().status === 'ready' && !isReplacingSave()
    && !!usePlayerStore.getState().player && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat
    && useMapStore.getState().selectedDifficulty === 'normal';
}
/** Finite authored source/reward identities, without granting arbitrary hire authority. */
export function hasCanonicalTownEnlistment(key: TownEnlistmentKey): boolean {
  const c = TOWN_ENLISTMENTS[key], row = loadQuests().find(quest => quest.id === c.quest), objective = row?.objectives[0];
  const rewardField = row && Object.getOwnPropertyDescriptor(row, 'rewards');
  const rewards: unknown = rewardField && Object.hasOwn(rewardField, 'value') ? rewardField.value as unknown : undefined;
  const reward = rewards !== null && typeof rewards === 'object' ? Object.getOwnPropertyDescriptor(rewards, 'mercenaryUnlock') : undefined;
  const wishes = rewards !== null && typeof rewards === 'object' ? Object.getOwnPropertyDescriptor(rewards, 'wishstones') : undefined;
  return loadMercPool().pool.some(merc => merc.id === c.mercId) && row?.type === 'side'
    && row.actId === c.actId && row.giver === c.npc
    && (c.prerequisite ? row.prerequisites?.length === 1 && row.prerequisites[0] === c.prerequisite.quest : !row.prerequisites?.length)
    && row.objectives.length === 1 && objective?.id === c.objective && objective.type === 'hire-mercenary'
    && objective.mercId === c.mercId && rewardField?.enumerable === true && rewards !== null && typeof rewards === 'object'
    && Reflect.ownKeys(rewards).length === 2 && reward?.enumerable === true && Object.hasOwn(reward, 'value') && reward.value === c.mercId
    && wishes?.enumerable === true && Object.hasOwn(wishes, 'value') && wishes.value === 10;
}
/** Source graph validation remains shared with save and other current campaign grants. */
export function validTownEnlistmentSource(): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame);
    return true;
  } catch { return false; }
}
interface Publication {
  readonly key: TownEnlistmentKey;
  readonly kind: 'enlist' | 'claim';
  readonly currencyOwner?: QuestCurrencyPublication;
  readonly recruit: Mercenary | null;
  readonly selected: Mercenary | null;
  readonly context: () => boolean;
}
/**
 * Under the shared quest lease, verify actual merc publication before side/proof,
 * or mark claimed last. Restore only owned source/actual participant writes;
 * prerequisite, hero, remembered location and unrelated roster are witnesses.
 */
export function publishTownEnlistmentChange(input: Publication): 'ok' | 'grant-failed' {
  const currencyOwner = input.currencyOwner;
  if ((input.kind === 'claim') !== (currencyOwner !== undefined)) return 'grant-failed';
  let currencyGranted = false;
  const c = TOWN_ENLISTMENTS[input.key], map = useMapStore.getState(), mercs = useMercStore.getState(), hero = usePlayerStore.getState().player;
  const row = map.questProgress[c.quest]; if (!hero || !row) return 'grant-failed';
  const before = structuredClone({ hero, roster: mercs.ownedMercs, equipment: mercs.mercEquipment, progress: mercs.mercProgress,
    field: mercs.fieldedMercId, rows: pick(map.questProgress, [c.quest]), proofs: pick(map.questReceipts, [c.proof]),
    prerequisite: c.prerequisite ? pick(map.questProgress, [c.prerequisite.quest]) : {},
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  const participant = input.recruit ?? input.selected;
  const journal = participant ? captureTownEnlistmentMercParticipant(participant, input.recruit !== null) : null;
  const field = input.kind === 'enlist' ? participant?.id ?? null : before.field;
  const expected = structuredClone({
    roster: input.recruit ? [...before.roster, input.recruit] : before.roster,
    equipment: input.recruit ? { ...before.equipment, [input.recruit.id]: {} } : before.equipment,
    progress: input.recruit ? { ...before.progress, [input.recruit.id]: { experience: 0, experienceToNextLevel: mercXpForLevel(input.recruit.level) } } : before.progress,
    rows: { [c.quest]: input.kind === 'enlist' ? { ...row, status: 'completed' as const, objectives: { [c.objective]: true } } : { ...row, rewardClaimed: true } },
    proofs: input.kind === 'enlist' ? { [c.proof]: true as const } : before.proofs
  });
  const references = input.recruit ? [...mercs.ownedMercs, input.recruit] : mercs.ownedMercs;
  const check = (mercPublished: boolean, sourcePublished: boolean): void => {
    const live = useMapStore.getState(), current = useMercStore.getState();
    if (currencyOwner) verifyQuestCurrencyPublication(currencyOwner, useInventoryStore.getState().currencies, currencyGranted);
    if (!input.context() || usePlayerStore.getState().player !== hero || !sameData(hero, before.hero)
      || !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
      || !sameData(c.prerequisite ? pick(live.questProgress, [c.prerequisite.quest]) : {}, before.prerequisite)
      || !hasTownEnlistmentPrerequisite(live.questProgress, c)
      || !sameData(current.ownedMercs, mercPublished ? expected.roster : before.roster)
      || current.ownedMercs.some((merc, index) => merc !== (mercPublished ? references : mercs.ownedMercs)[index])
      || !sameData(current.mercEquipment, mercPublished ? expected.equipment : before.equipment)
      || !sameData(current.mercProgress, mercPublished ? expected.progress : before.progress)
      || current.fieldedMercId !== (mercPublished ? field : before.field)
      || !sameData(pick(live.questProgress, [c.quest]), sourcePublished ? expected.rows : before.rows)
      || !sameData(pick(live.questReceipts, [c.proof]), sourcePublished ? expected.proofs : before.proofs)
      || !validTownEnlistmentSource()) throw new Error('Town enlistment publication postcondition failed');
    journal?.checkUnchanged();
  };
  try {
    check(false, false);
    if (input.recruit !== null || input.kind === 'enlist') {
      if (input.kind === 'enlist' && field) journal?.beginFieldPublication(field);
      useMercStore.setState(state => ({
        ...(input.recruit ? { ownedMercs: [...state.ownedMercs, input.recruit],
          mercEquipment: { ...state.mercEquipment, [input.recruit.id]: {} },
          mercProgress: { ...state.mercProgress, [input.recruit.id]: { experience: 0, experienceToNextLevel: mercXpForLevel(input.recruit.level) } } } : {}),
        ...(input.kind === 'enlist' ? { fieldedMercId: field } : {})
      }));
    }
    check(true, false);
    if (currencyOwner) {
      useInventoryStore.getState().addQuestCurrency(currencyOwner); currencyGranted = true;
      check(true, false);
    }
    useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), [c.quest]),
      questReceipts: replace(state.questReceipts, structuredClone(expected.proofs), [c.proof]) }));
    check(true, true);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (fn: () => void): void => { try { fn(); } catch (error) { errors.push(error); } };
    // Currency rollback observers run before source/physical restoration and its final checks.
    if (currencyOwner) attempt(() => { useInventoryStore.getState().restoreQuestCurrency(currencyOwner); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [c.quest]),
      questReceipts: replace(state.questReceipts, structuredClone(before.proofs), [c.proof]) })); });
    if (journal) attempt(() => { journal.restore(); });
    attempt(() => {
      const live = useMapStore.getState();
      if (!sameData(pick(live.questProgress, [c.quest]), before.rows) || !sameData(pick(live.questReceipts, [c.proof]), before.proofs)) {
        throw new Error('Town enlistment source restoration postcondition failed');
      }
    });
    if (currencyOwner) attempt(() => { verifyQuestCurrencyPublication(currencyOwner, useInventoryStore.getState().currencies, false); });
    if (errors.length) throw new AggregateError([cause, ...errors], 'Town enlistment restoration failed');
    return 'grant-failed';
  } finally { journal?.dispose(); }
}
