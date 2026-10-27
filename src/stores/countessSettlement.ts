import { COUNTESS, hasOriginalCountessVictory, isCountessAdmissionEligible } from '@/engine/map/countess-admission';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { mergeRewards, planRewardGrant } from '@/engine/loot/reward-plan';
import type { KillRewards } from '@/engine/loot/award';
import type { Item } from '@/engine/types/items';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { pick, replace, sameCainData as sameData } from '@/features/quests/cainPublication';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import type { RecordedWaveBinding } from './recordedWaveReceipt';
import { usePlayerStore } from './playerStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';

/**
 * Prepare the finite Countess source and native-income transaction under both
 * the caller's wave and quest leases. Replays retain the same transaction scope
 * but have no admission. Witness each native publication before awarding proof;
 * restore deep owned values without replacing unrelated store data.
 */
export function prepareCountessSettlement(run: ActiveRun, binding: RecordedWaveBinding) {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState();
  if (!hero || hero.id !== binding.heroId || binding.origin.kind !== 'area' ||
    binding.origin.questEncounter !== COUNTESS.encounter || binding.origin.replayProfileId !== 'normal' ||
    run.mode !== 'manual' || run.act !== 1 || map.currentAct !== 1 || map.currentSubAreaId !== COUNTESS.area ||
    map.selectedDifficulty !== 'normal' || !map.isActUnlocked(1) ||
    (binding.countessEncounter !== undefined && !isCountessAdmissionEligible(map.questProgress, map.questReceipts))) {
    throw new Error('Countess settlement source is no longer eligible');
  }
  const mercs = useMercStore.getState(), combat = useCombatStore.getState();
  const recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
  const recipientId = recipient?.id ?? null;
  const recipientIndex = mercs.ownedMercs.findIndex(row => row === recipient);
  const recipientReferences = new Set<NonNullable<typeof recipient>>();
  if (recipient) recipientReferences.add(recipient);
  const before = structuredClone({ hero, recipient,
    mercProgress: recipientId === null ? {} : pick(mercs.mercProgress, [recipientId]),
    recipientProgress: recipientId === null ? undefined : mercs.getMercProgress(recipientId),
    rows: pick(map.questProgress, [COUNTESS.quest]), receipts: pick(map.questReceipts, [COUNTESS.receipt]),
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty },
    combat: { runRewards: combat.runRewards, runVictory: combat.runVictory, runDefeat: combat.runDefeat, log: combat.log }
  });
  let expectedHero = before.hero, expectedRecipient = before.recipient;
  let expectedProgress = before.mercProgress, expectedRows = before.rows, expectedReceipts = before.receipts;
  let expectedCombat = { runRewards: before.combat.runRewards, runVictory: before.combat.runVictory, runDefeat: before.combat.runDefeat };
  // Only actual native bag participants are owned. Other materials, currencies,
  // backpack entries and every stash/equipment entry remain observer-owned.
  let inventoryWitness: { itemIds: string[]; materialKeys: string[]; currencyKeys: string[];
    before: { materials: Record<string, number>; currencies: Record<string, number>;
      equipped: ReturnType<typeof useInventoryStore.getState>['equipped'];
      mercEquipment: ReturnType<typeof useMercStore.getState>['mercEquipment'] };
    after: { materials: Record<string, number>; currencies: Record<string, number>; items: KillRewards['items'] } } | undefined;
  const grantedReferences = new Set<Item>();
  const owns = (item: Item | null | undefined): item is Item => item !== null && item !== undefined &&
    (grantedReferences.has(item) || inventoryWitness?.itemIds.includes(item.id) === true);
  const ownedGear = (): Item[] => {
    const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
    return [...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
      ...Object.values(mercs.mercEquipment).flatMap(equipment => Object.values(equipment))].filter(owns);
  };
  const removedPlayerSlots: string[] = [], removedMercSlots = new Map<string, string[]>();
  const restoreSlots = <T extends Record<string, Item | null>>(current: T, previous: T, removed: string[]): T => {
    const next = { ...current };
    for (const [slot, item] of Object.entries(current)) {
      if (!owns(item)) continue;
      removed.push(slot);
      if (Object.hasOwn(previous, slot)) Reflect.set(next, slot, structuredClone(previous[slot]));
      else Reflect.deleteProperty(next, slot);
    }
    return next;
  };

  const check = (restoring = false): void => {
    const live = useMapStore.getState(), currentCombat = useCombatStore.getState();
    if ((!restoring && useHydrationStore.getState().status !== 'ready') || combatRunLifecycle.activeRun !== run ||
      !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId,
        selectedDifficulty: live.selectedDifficulty }, before.location) ||
      !sameData(pick(live.questProgress, [COUNTESS.quest]), expectedRows) ||
      !sameData(pick(live.questReceipts, [COUNTESS.receipt]), expectedReceipts) ||
      !sameData(usePlayerStore.getState().player, expectedHero) ||
      !sameData({ runRewards: currentCombat.runRewards, runVictory: currentCombat.runVictory,
        runDefeat: currentCombat.runDefeat }, expectedCombat)) throw new Error('Countess settlement context/postcondition changed');
    if (recipientId !== null) {
      const current = useMercStore.getState(), rows = current.ownedMercs.filter(row => row.id === recipientId);
      const references = current.ownedMercs.filter(row => recipientReferences.has(row));
      if (rows.length !== 1 || !sameData(rows[0], expectedRecipient) ||
        (restoring ? references.length !== 0 : references.length !== 1 || references[0] !== rows[0]) ||
        !sameData(pick(current.mercProgress, [recipientId]), expectedProgress)) {
        throw new Error('Countess settlement recipient postcondition changed');
      }
    }
    if (inventoryWitness) {
      const current = useInventoryStore.getState(), witness = inventoryWitness;
      const items = current.backpack.filter(owns), allOwned = ownedGear();
      if (!sameData(pick(current.materials, witness.materialKeys), restoring ? witness.before.materials : witness.after.materials) ||
        !sameData(pick(current.currencies, witness.currencyKeys), restoring ? witness.before.currencies : witness.after.currencies) ||
        !sameData(items, restoring ? [] : witness.after.items) || allOwned.length !== items.length ||
        (restoring && (!sameData(pick(current.equipped, removedPlayerSlots), pick(witness.before.equipped, removedPlayerSlots)) ||
          [...removedMercSlots].some(([id, slots]) => !sameData(pick(useMercStore.getState().mercEquipment[id] ?? {}, slots),
            pick(witness.before.mercEquipment[id] ?? {}, slots)))))) throw new Error('Countess settlement inventory postcondition changed');
    }
    if (!restoring) validateQuestActionReceipts(live.questReceipts, live.questProgress, useInventoryStore.getState().questItems);
  };

  return {
    recipientId,
    check,
    prepareHeroExperience(xp: number): void {
      check();
      const growth = awardXp(xpTotal(before.hero.level) + before.hero.experience, xp);
      const intoLevel = Math.max(0, growth.totalXp - xpTotal(growth.level));
      const inventory = useInventoryStore.getState(), currentMap = useMapStore.getState();
      expectedHero = { ...before.hero, level: growth.level, experience: intoLevel,
        experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
        statPoints: before.hero.statPoints + growth.statPointsGranted, skillPoints: before.hero.skillPoints + growth.skillPointsGranted,
        derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inventory.equipped,
          currentMap.questProgress, inventory.questItems, currentMap.questReceipts) };
    },
    grantMercExperience(xp: number): void {
      check();
      if (!before.recipient || recipientId === null || !before.recipientProgress || Math.floor(xp * MERC_XP_SHARE) <= 0) return;
      let progress = before.recipientProgress, level = before.recipient.level;
      let remaining = progress.experience + Math.floor(xp * MERC_XP_SHARE);
      while (remaining >= progress.experienceToNextLevel) {
        remaining -= progress.experienceToNextLevel; level++;
        progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
      }
      expectedProgress = { [recipientId]: { experience: remaining, experienceToNextLevel: progress.experienceToNextLevel } };
      expectedRecipient = growMercenary(repairMercenaryGrowth(structuredClone(before.recipient)), level - before.recipient.level);
      // Own the exact published result before any setter observer can rename it.
      const publishedRecipient = structuredClone(expectedRecipient);
      recipientReferences.add(publishedRecipient);
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row === recipient ? publishedRecipient : row),
        mercProgress: replace(state.mercProgress, structuredClone(expectedProgress), [recipientId]) }));
    },
    prepareInventory(rewards: KillRewards): void {
      check();
      const current = useInventoryStore.getState();
      const grant = planRewardGrant(rewards, { ...current, mercEquipment: useMercStore.getState().mercEquipment });
      const materialKeys = Object.keys(rewards.materials), currencyKeys = [
        ...(rewards.runeShards > 0 ? ['rune-shard'] : []), ...(rewards.wishstones > 0 ? ['wishstone'] : [])
      ];
      inventoryWitness = structuredClone({ itemIds: rewards.items.map(row => row.id), materialKeys, currencyKeys,
        before: { materials: pick(current.materials, materialKeys), currencies: pick(current.currencies, currencyKeys),
          equipped: current.equipped, mercEquipment: useMercStore.getState().mercEquipment },
        after: { materials: pick(grant.materials, materialKeys), currencies: pick(grant.currencies, currencyKeys), items: rewards.items } });
      for (const item of rewards.items) grantedReferences.add(item);
    },
    prepareRunRewards(rewards: KillRewards): void {
      check(); expectedCombat = { ...expectedCombat, runRewards: mergeRewards(expectedCombat.runRewards, rewards) };
    },
    prepareResult(result: 'victory' | 'defeat'): void {
      check(); expectedCombat = { ...expectedCombat, runVictory: result === 'victory', runDefeat: result === 'defeat' };
    },
    publishVictory(): void {
      check();
      if (!binding.countessEncounter || !hasOriginalCountessVictory(binding.countessEncounter, binding.recording.outcome)) return;
      const row = before.rows[COUNTESS.quest];
      if (!row) throw new Error('Countess settlement lost its tracked row');
      expectedRows = { [COUNTESS.quest]: { ...row, status: 'completed', objectives: { ...row.objectives, [COUNTESS.objective]: true } } };
      expectedReceipts = { [COUNTESS.receipt]: true };
      const current = useMapStore.getState();
      validateQuestActionReceipts({ ...current.questReceipts, ...expectedReceipts },
        { ...current.questProgress, ...expectedRows }, useInventoryStore.getState().questItems);
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expectedRows), [COUNTESS.quest]),
        questReceipts: replace(state.questReceipts, structuredClone(expectedReceipts), [COUNTESS.receipt]) }));
      check();
    },
    rollback(cause: unknown): unknown {
      const errors: unknown[] = [];
      const restore = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
      expectedHero = before.hero; expectedRecipient = before.recipient; expectedProgress = before.mercProgress;
      expectedRows = before.rows; expectedReceipts = before.receipts;
      expectedCombat = { runRewards: before.combat.runRewards, runVictory: before.combat.runVictory, runDefeat: before.combat.runDefeat };
      restore(() => { usePlayerStore.setState({ player: structuredClone(before.hero) }); });
      if ((recipientId !== null && before.recipient !== undefined) || inventoryWitness !== undefined) {
        restore(() => { useMercStore.setState(state => {
          const ownedMercs = recipientId === null ? state.ownedMercs : state.ownedMercs.filter(row => row.id !== recipientId && !recipientReferences.has(row));
          if (recipientId !== null && before.recipient) ownedMercs.splice(Math.min(recipientIndex, ownedMercs.length), 0, structuredClone(before.recipient));
          const mercEquipment = { ...state.mercEquipment };
          if (inventoryWitness) for (const [id, equipment] of Object.entries(state.mercEquipment)) {
            const removed: string[] = [];
            mercEquipment[id] = restoreSlots(equipment, inventoryWitness.before.mercEquipment[id] ?? {}, removed);
            if (removed.length > 0) {
              removedMercSlots.set(id, removed);
              if (!Object.hasOwn(inventoryWitness.before.mercEquipment, id) && Object.keys(mercEquipment[id] ?? {}).length === 0) {
                Reflect.deleteProperty(mercEquipment, id);
              }
            }
          }
          return { ownedMercs, mercEquipment, ...(recipientId === null ? {} : {
            mercProgress: replace(state.mercProgress, structuredClone(before.mercProgress), [recipientId]) }) };
        }); });
      }
      if (inventoryWitness) {
        const witness = inventoryWitness;
        restore(() => { useInventoryStore.setState(state => ({
          backpack: state.backpack.filter(row => !owns(row)), stash: state.stash.filter(row => !owns(row)),
          equipped: restoreSlots(state.equipped, witness.before.equipped, removedPlayerSlots),
          materials: replace(state.materials, structuredClone(witness.before.materials), witness.materialKeys),
          currencies: replace(state.currencies, structuredClone(witness.before.currencies), witness.currencyKeys)
        })); });
      }
      restore(() => { useCombatStore.setState(structuredClone(before.combat)); });
      restore(() => { useMapStore.setState(state => ({ ...before.location,
        questProgress: replace(state.questProgress, structuredClone(before.rows), [COUNTESS.quest]),
        questReceipts: replace(state.questReceipts, structuredClone(before.receipts), [COUNTESS.receipt]) })); });
      restore(() => { combatRunLifecycle.activeRun = run; check(true); });
      return errors.length > 0 ? new AggregateError(errors, 'Countess settlement restoration failed', { cause }) : cause;
    }
  };
}
