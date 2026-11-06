import { COW, captureCowEncounter, hasOriginalCowVictory, isCowAdmissionEligible } from '@/engine/map/cow-quest';
import { mergeRewards, planRewardGrant, type RewardGrant } from '@/engine/loot/reward-plan';
import type { KillRewards } from '@/engine/loot/award';
import { captureCowAuthority, sameCowAuthority, validateLiveCowGraph } from '@/features/quests/cowContract';
import { planCowHeroExperience, safeCowCount, safeCowNumbers } from '@/features/quests/cowClaim';
import { captureCountedHeroParticipant } from '@/features/quests/countedQuestRollback';
import { captureAct2CacheMercParticipant, planAct2CacheMercAward } from '@/features/quests/act2CacheMercRollback';
import { captureQuestRewardOwnership } from '@/features/quests/questRewardOwnership';
import { assertCountedData, sameCountedData as sameData, snapshotCountedData, replaceCountedDataKeys as replace } from '@/features/quests/countedQuestContract';
import { pick } from '@/features/quests/cainPublication';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import type { RecordedWaveBinding } from './recordedWaveReceipt';
import { usePlayerStore } from './playerStore';
import { useMercStore, MERC_XP_SHARE } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { hasCowNativeVictory } from './cowNativeWitness';

/**
 * One finite recorded Cow payout. Caller owns wave+quest leases and rejects an
 * unqualified outcome before rolling native income. Journals own only actual
 * native participants; independent XP, resources, equipment and bags survive.
 */
export function prepareCowSettlement(run: ActiveRun, binding: RecordedWaveBinding) {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState(), inventory = useInventoryStore.getState();
  const witness = binding.cowEncounter, wave = run.plan.waves[0];
  if (!hero || hero.id !== binding.heroId || !witness || !wave || binding.origin.kind !== 'area' ||
    binding.origin.questEncounter !== COW.encounter || binding.origin.replayProfileId !== 'normal' ||
    run !== binding.candidateRun || run.origin !== binding.origin || run.mode !== 'manual' || run.act !== 1 ||
    run.plan.waves.length !== 1 || binding.targetWaveIdx !== 0 || map.currentAct !== 1 || map.currentSubAreaId !== COW.area ||
    map.selectedDifficulty !== 'normal' || !map.isActUnlocked(1) || !isCowAdmissionEligible(map.questProgress, inventory.questItems, map.questReceipts) ||
    !sameData(witness, captureCowEncounter(run.act, run.plan.subAreaId, wave, binding.engineInput.playerTeam, binding.engineInput.enemyTeam)) ||
    binding.countessEncounter !== undefined || binding.councilEncounter !== undefined || binding.act4Encounter !== undefined ||
    binding.act5Encounter !== undefined || binding.guardianEncounter !== undefined || binding.endgameWave !== undefined) throw new Error('Cow settlement source is no longer eligible');
  const authority = captureCowAuthority(); validateLiveCowGraph();
  const nativeVictory = hasCowNativeVictory(binding);
  const mercs = useMercStore.getState(), combat = useCombatStore.getState();
  assertCountedData({ hero, roster: mercs.ownedMercs, progress: mercs.mercProgress });
  if (new Set(mercs.ownedMercs.map(row => row.id)).size !== mercs.ownedMercs.length) throw new Error('Duplicate Cow native recipient');
  const recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
  if (mercs.fieldedMercId !== null && !recipient) throw new Error('Missing Cow native recipient');
  const sources = [COW.legSource, COW.tomeSource], proofs = [COW.tomeSource, COW.openProof, COW.victoryProof];
  const before = snapshotCountedData({ hero, recipient, field: mercs.fieldedMercId,
    progress: recipient ? pick(mercs.mercProgress, [recipient.id]) : {}, rows: pick(map.questProgress, [COW.quest]),
    items: pick(inventory.questItems, sources), cube: pick(inventory.questItems, [COW.cubeSource]), receipts: pick(map.questReceipts, proofs),
    equipped: inventory.equipped, location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty },
    combat: { runRewards: combat.runRewards, runVictory: combat.runVictory, runDefeat: combat.runDefeat } });
  let expectedHero = before.hero, expectedRecipient = before.recipient, expectedProgress = before.progress;
  let expectedReceipts = before.receipts, expectedCombat = before.combat;
  let heroJournal: ReturnType<typeof captureCountedHeroParticipant> | undefined;
  let mercJournal: ReturnType<typeof captureAct2CacheMercParticipant> | undefined;
  const physical: ReturnType<typeof captureQuestRewardOwnership>[] = [];
  let recipientAward: ReturnType<typeof planAct2CacheMercAward> | undefined;
  let inventoryWitness: { currencyKeys: string[]; materialKeys: string[];
    currencies: Record<string, number>; materials: Record<string, number>; beforeCurrencies: Record<string, number>;
    beforeMaterials: Record<string, number>; rewards: KillRewards } | undefined;
  const numericRestored: { currencies?: Record<string, number>; materials?: Record<string, number> } = {};
  let rewardsPrepared = false, inventoryCommitted = false;
  const ownedLogs = new Set<CombatLogEntry>();
  const check = () => {
    const live = useMapStore.getState(), inv = useInventoryStore.getState(), currentMercs = useMercStore.getState(), currentCombat = useCombatStore.getState();
    if (nativeVictory && !hasCowNativeVictory(binding)) throw new Error('Cow native outcome changed during settlement');
    if (useHydrationStore.getState().status !== 'ready' || combatRunLifecycle.activeRun !== run || !sameCowAuthority(authority) ||
      !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location) ||
      !sameData(pick(live.questProgress, [COW.quest]), before.rows) || !sameData(pick(live.questReceipts, proofs), expectedReceipts) ||
      !sameData(pick(inv.questItems, sources), before.items) || !sameData(pick(inv.questItems, [COW.cubeSource]), before.cube) ||
      !sameData(usePlayerStore.getState().player, expectedHero) || currentMercs.fieldedMercId !== before.field ||
      !sameData(inv.equipped, before.equipped) || !sameData({ runRewards: currentCombat.runRewards, runVictory: currentCombat.runVictory,
        runDefeat: currentCombat.runDefeat }, expectedCombat)) throw new Error('Cow settlement context/postcondition changed');
    if (recipient) {
      const actors = currentMercs.ownedMercs.filter(row => row.id === recipient.id), actor = actors[0];
      if (actors.length !== 1 || !actor || (mercJournal ? !mercJournal.owns(actor) : actor !== recipient)) throw new Error('Cow actual recipient identity changed');
      if (!sameData(actor, expectedRecipient) || !sameData(pick(currentMercs.mercProgress, [recipient.id]), expectedProgress)) throw new Error('Cow actual recipient publication changed');
    }
    if (inventoryWitness) {
      if (!sameData(pick(inv.currencies, inventoryWitness.currencyKeys), inventoryWitness.currencies) ||
        !sameData(pick(inv.materials, inventoryWitness.materialKeys), inventoryWitness.materials)) throw new Error('Cow native numeric publication changed');
      physical.forEach(owner => { owner.checkPublished(); });
    }
    validateLiveCowGraph();
  };
  const prepareHeroExperience = (xp: number) => {
    check(); expectedHero = planCowHeroExperience(hero, xp);
    if (recipient) { recipientAward = planAct2CacheMercAward(recipient, mercs.getMercProgress(recipient.id), safeCowCount(Math.floor(xp * MERC_XP_SHARE))); safeCowNumbers(recipientAward); }
    heroJournal ??= captureCountedHeroParticipant(hero); if (recipient) mercJournal ??= captureAct2CacheMercParticipant(recipient);
  };
  const restoreNumbers = (current: Readonly<Record<string, number>>, original: Readonly<Record<string, number>>,
    deltas: Readonly<Record<string, number>>): Record<string, number> => {
    const next = { ...current };
    for (const [key, delta] of Object.entries(deltas)) {
      if (delta === 0) continue;
      const value = safeCowCount(safeCowCount(current[key] ?? 0) - delta);
      if (value === 0 && !Object.hasOwn(original, key)) Reflect.deleteProperty(next, key); else next[key] = value;
    }
    return next;
  };
  return {
    recipientId: recipient?.id ?? null,
    check, prepareHeroExperience,
    /** Surround the real public grant so nested supported XP is independently attributed. */
    grantHeroExperience(xp: number): ReturnType<ReturnType<typeof usePlayerStore.getState>['gainExperience']> {
      prepareHeroExperience(xp); const participant = heroJournal;
      if (!participant) throw new Error('Cow hero journal missing'); participant.begin();
      let result: ReturnType<ReturnType<typeof usePlayerStore.getState>['gainExperience']> | undefined;
      participant.publish(expectedHero, () => { result = usePlayerStore.getState().gainExperience(xp); });
      if (!result) throw new Error('Cow native hero grant produced no result'); return result;
    },
    grantMercExperience(xp: number): void {
      check(); if (!recipient || !recipientAward || !mercJournal || Math.floor(xp * MERC_XP_SHARE) === 0) return;
      expectedRecipient = recipientAward.actor; expectedProgress = { [recipient.id]: recipientAward.progress };
      mercJournal.publish(recipientAward, () => { useMercStore.getState().shareExperienceWithFielded(xp, recipient.id); });
    },
    prepareInventory(rewards: KillRewards): void {
      check(); const state = useInventoryStore.getState(); assertCountedData(rewards); safeCowNumbers(rewards);
      const grant = planRewardGrant(rewards, { ...state, mercEquipment: useMercStore.getState().mercEquipment });
      const currencyKeys = [...(rewards.runeShards > 0 ? ['rune-shard'] : []), ...(rewards.wishstones > 0 ? ['wishstone'] : [])], materialKeys = Object.keys(rewards.materials);
      for (const item of rewards.items) { const owner = captureQuestRewardOwnership(item); physical.push(owner); owner.preflight(); }
      inventoryWitness = { currencyKeys, materialKeys, currencies: pick(grant.currencies, currencyKeys), materials: pick(grant.materials, materialKeys),
        beforeCurrencies: snapshotCountedData(pick(state.currencies, currencyKeys)), beforeMaterials: snapshotCountedData(pick(state.materials, materialKeys)), rewards };
    },
    /** Own the actual fresh native output containers, never an unrelated state reference. */
    grantInventory(rewards: KillRewards): void {
      this.prepareInventory(rewards);
      let patch: RewardGrant | undefined;
      const observe = (state: ReturnType<typeof useInventoryStore.getState>) => {
        if (patch && (state.backpack === patch.backpack || state.currencies === patch.currencies || state.materials === patch.materials)) inventoryCommitted = true;
      };
      const stop = useInventoryStore.subscribe((next, previous) => { observe(previous); observe(next); });
      try {
        useInventoryStore.setState(current => {
          patch = planRewardGrant(rewards, { ...current, mercEquipment: useMercStore.getState().mercEquipment }); return patch;
        });
      } finally { observe(useInventoryStore.getState()); stop(); }
    },
    /** The existing public log publisher carries one private, transient identity handle. */
    addLevelUpLog(entry: Omit<CombatLogEntry, 'id' | 'timestamp'>): void {
      const marker = Symbol('Cow native level-up');
      const tagged = { ...entry, [marker]: true };
      try { useCombatStore.getState().addLogEntry(tagged); }
      finally {
        for (const row of useCombatStore.getState().log) if (Object.getOwnPropertyDescriptor(row, marker)?.value === true) {
          ownedLogs.add(row); Reflect.deleteProperty(row, marker);
        }
      }
    },
    prepareRunRewards(rewards: KillRewards): void { check(); expectedCombat = { ...expectedCombat, runRewards: mergeRewards(expectedCombat.runRewards, rewards) }; rewardsPrepared = true; },
    prepareResult(result: 'victory' | 'defeat'): void { check(); expectedCombat = { ...expectedCombat, runVictory: result === 'victory', runDefeat: result === 'defeat' }; },
    publishVictory(): void {
      check(); if (!hasCowNativeVictory(binding) || !hasOriginalCowVictory(witness, binding.recording.outcome)) throw new Error('Cow original victory qualification lost');
      expectedReceipts = { ...before.receipts, [COW.victoryProof]: true };
      useMapStore.setState(state => ({ questReceipts: replace(state.questReceipts, snapshotCountedData(expectedReceipts), proofs) })); check();
    },
    rollback(cause: unknown): unknown {
      const errors: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [COW.quest]), questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), proofs) })); });
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(before.items), sources) })); });
      // Only a witnessed fresh native patch owns positive numeric deltas.
      if (inventoryWitness && inventoryCommitted) {
        const w = inventoryWitness, currencyDelta = { ...(w.rewards.runeShards > 0 ? { 'rune-shard': w.rewards.runeShards } : {}), ...(w.rewards.wishstones > 0 ? { wishstone: w.rewards.wishstones } : {}) };
        attempt(() => { useInventoryStore.setState(state => {
          const currencies = restoreNumbers(state.currencies, w.beforeCurrencies, currencyDelta), materials = restoreNumbers(state.materials, w.beforeMaterials, w.rewards.materials);
          numericRestored.currencies = pick(currencies, w.currencyKeys); numericRestored.materials = pick(materials, w.materialKeys); return { currencies, materials };
        }); });
      }
      for (const owner of physical) attempt(() => {
        const current = usePlayerStore.getState().player, cleanup = () => { if (mercJournal) mercJournal.publishPhysicalCleanup(() => { owner.restore(); }); else owner.restore(); };
        if (heroJournal?.owns(current)) heroJournal.publish(current, cleanup); else cleanup();
      });
      if (mercJournal) attempt(() => { mercJournal?.restore(); }); if (heroJournal) attempt(() => { heroJournal?.restore(); });
      attempt(() => { useCombatStore.setState(state => ({ log: state.log.filter(row => !ownedLogs.has(row)), runVictory: before.combat.runVictory, runDefeat: before.combat.runDefeat,
        runRewards: rewardsPrepared ? snapshotCountedData(before.combat.runRewards) : state.runRewards })); });
      attempt(() => {
        const live = useMapStore.getState(), inv = useInventoryStore.getState();
        if (!sameData(pick(live.questProgress, [COW.quest]), before.rows) || !sameData(pick(live.questReceipts, proofs), before.receipts) ||
          !sameData(pick(inv.questItems, sources), before.items)) throw new Error('Cow native source restoration changed');
        // Positive independent additions during compensation survive the subtraction.
        for (const [key, value] of Object.entries(numericRestored.currencies ?? {})) if (safeCowCount(inv.currencies[key] ?? 0) < value) throw new Error('Cow currency restoration changed');
        for (const [key, value] of Object.entries(numericRestored.materials ?? {})) if (safeCowCount(inv.materials[key] ?? 0) < value) throw new Error('Cow material restoration changed');
        validateLiveCowGraph(); mercJournal?.verifyRestored(); heroJournal?.verifyRestored();
      });
      return errors.length ? new AggregateError(errors, 'Cow settlement scoped restoration failed', { cause }) : cause;
    },
    dispose(): void { try { physical.forEach(owner => { owner.dispose(); }); } finally { try { mercJournal?.dispose(); } finally { heroJournal?.dispose(); } } }
  };
}
