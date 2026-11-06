import { DROGNAN, hasDrognanTome } from '@/engine/map/drognan-quest';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { hasCanonicalDrognanDefinition } from './drognanContract';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

/** This exact retained source protects only Drognan's numeric journal reward. */
export function hasDrognanClaimCompletion(questId: string): boolean {
  if (questId !== DROGNAN.quest) return true;
  if (!usePlayerStore.getState().player || useHydrationStore.getState().status !== 'ready' || isReplacingSave() ||
    hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return false;
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    if (!hasCanonicalDrognanDefinition() || !hasDrognanTome(map.questProgress, inv.questItems)) return false;
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    return true;
  } catch { return false; }
}

/** Called after existing numeric preflight, under Claim's shared quest lease. */
export function publishDrognanClaim(): 'ok' | 'unsupported-rewards' | 'grant-failed' {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState(), inv = useInventoryStore.getState();
  if (!hero || !hasDrognanClaimCompletion(DROGNAN.quest) || map.questProgress[DROGNAN.quest]?.rewardClaimed === true) return 'unsupported-rewards';
  const mercs = useMercStore.getState(), recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
  const recipientId = recipient?.id, recipientReferences = new Set(recipient ? [recipient] : []);
  const before = structuredClone({ hero, recipient, rows: pick(map.questProgress, [DROGNAN.quest]),
    items: pick(inv.questItems, [DROGNAN.source]), progress: recipientId === undefined ? {} : pick(mercs.mercProgress, [recipientId]) });
  const row = before.rows[DROGNAN.quest]; if (!row) return 'unsupported-rewards';
  const claimedRows = { [DROGNAN.quest]: { ...row, rewardClaimed: true } };
  let xpHero = before.hero, expectedRecipient = before.recipient, expectedProgress = before.progress;
  try {
    const growth = awardXp(xpTotal(hero.level) + hero.experience, 4000), intoLevel = Math.max(0, growth.totalXp - xpTotal(growth.level));
    xpHero = { ...before.hero, level: growth.level, experience: intoLevel,
      experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
      statPoints: hero.statPoints + growth.statPointsGranted, skillPoints: hero.skillPoints + growth.skillPointsGranted,
      derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts) };
    if (recipient && recipientId !== undefined) {
      let progress = structuredClone(mercs.getMercProgress(recipientId)), level = recipient.level;
      let remaining = progress.experience + Math.floor(4000 * MERC_XP_SHARE);
      while (remaining >= progress.experienceToNextLevel) {
        remaining -= progress.experienceToNextLevel; level++;
        progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
      }
      expectedProgress = { [recipientId]: { experience: remaining, experienceToNextLevel: progress.experienceToNextLevel } };
      expectedRecipient = growMercenary(repairMercenaryGrowth(structuredClone(recipient)), level - recipient.level);
    }
  } catch { return 'unsupported-rewards'; }
  const expectedHero = { ...xpHero, skillPoints: xpHero.skillPoints + 1 };
  let wishes: FiniteSideWishParticipant;
  try { wishes = captureFiniteSideWishParticipant(DROGNAN.quest); } catch { return 'unsupported-rewards'; }
  const check = (phase: 'before' | 'xp' | 'merc' | 'point' | 'claimed'): void => {
    const live = useMapStore.getState(), inventory = useInventoryStore.getState(), current = useMercStore.getState();
    if (!hasDrognanClaimCompletion(DROGNAN.quest) ||
      !sameData(usePlayerStore.getState().player, phase === 'before' ? before.hero : phase === 'xp' || phase === 'merc' ? xpHero : expectedHero) ||
      !sameData(pick(live.questProgress, [DROGNAN.quest]), phase === 'claimed' ? claimedRows : before.rows) ||
      !sameData(pick(inventory.questItems, [DROGNAN.source]), before.items)) throw new Error('Drognan Claim source/hero publication changed');
    if (recipientId !== undefined) {
      const recipients = current.ownedMercs.filter(candidate => candidate.id === recipientId);
      if (recipients.length !== 1 || ((phase === 'before' || phase === 'xp') && recipients[0] !== recipient) ||
        !sameData(recipients[0], phase === 'before' || phase === 'xp' ? before.recipient : expectedRecipient) ||
        !sameData(pick(current.mercProgress, [recipientId]), phase === 'before' || phase === 'xp' ? before.progress : expectedProgress)) {
        throw new Error('Drognan Claim actual recipient changed');
      }
    }
    wishes.check();
  };
  try {
    check('before');
    usePlayerStore.getState().gainExperience(4000); check('xp');
    useMercStore.getState().shareExperienceWithFielded(4000, recipientId ?? null);
    if (recipientId !== undefined) {
      const published = useMercStore.getState().ownedMercs.find(candidate => candidate.id === recipientId);
      if (published) recipientReferences.add(published);
    }
    check('merc');
    usePlayerStore.setState(state => state.player ? { player: { ...state.player, skillPoints: state.player.skillPoints + 1 } } : state);
    check('point');
    wishes.publish(); check('point');
    useMapStore.getState().markQuestRewardClaimed(DROGNAN.quest); check('claimed');
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    attempt(() => { wishes.restore(); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [DROGNAN.quest]) })); });
    attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(before.items), [DROGNAN.source]) })); });
    // The reward owns progression, not equipment, fielding or independent roster edits.
    let restoredRecipient: typeof recipient, restoredProgress = before.progress;
    const savedRecipient = before.recipient;
    if (recipient && recipientId !== undefined && savedRecipient) attempt(() => { useMercStore.setState(state => {
      const current = state.ownedMercs.find(candidate => candidate.id === recipientId || recipientReferences.has(candidate));
      if (!current) { restoredProgress = {}; return { mercProgress: replace(state.mercProgress, {}, [recipientId]) }; }
      const restored = { ...current, level: savedRecipient.level,
        coreStats: structuredClone(savedRecipient.coreStats), derivedStats: structuredClone(savedRecipient.derivedStats) };
      restoredRecipient = structuredClone(restored);
      return { ownedMercs: state.ownedMercs.map(candidate => candidate === current ? restored : candidate),
        mercProgress: replace(state.mercProgress, structuredClone(before.progress), [recipientId]) };
    }); });
    let restoredHero: ReturnType<typeof usePlayerStore.getState>['player'] = before.hero;
    const restorationHero = () => {
      const current = usePlayerStore.getState().player, inventory = useInventoryStore.getState(), live = useMapStore.getState();
      if (!current || current.id !== before.hero.id) return current;
      const player = { ...current, level: before.hero.level, experience: before.hero.experience,
        experienceToNextLevel: before.hero.experienceToNextLevel, statPoints: before.hero.statPoints, skillPoints: before.hero.skillPoints };
      return { ...player, derivedStats: deriveEquippedPlayerStats(player, player.level, inventory.equipped,
        live.questProgress, inventory.questItems, live.questReceipts) };
    };
    attempt(() => {
      restoredHero = restorationHero();
      if (restoredHero?.id === before.hero.id) usePlayerStore.setState({ player: restoredHero });
    });
    attempt(() => {
      const live = useMapStore.getState(), inventory = useInventoryStore.getState(), current = useMercStore.getState();
      const progression = (merc: typeof recipient) => merc && ({ level: merc.level, coreStats: merc.coreStats, derivedStats: merc.derivedStats });
      if (!sameData(pick(live.questProgress, [DROGNAN.quest]), before.rows) || !sameData(pick(inventory.questItems, [DROGNAN.source]), before.items) ||
        !sameData(usePlayerStore.getState().player, restoredHero) || !sameData(restoredHero, restorationHero()) ||
        recipientId !== undefined && (!sameData(pick(current.mercProgress, [recipientId]), restoredProgress) ||
          !sameData(progression(current.ownedMercs.find(candidate => candidate.id === restoredRecipient?.id)), progression(restoredRecipient)))) {
        throw new Error('Drognan Claim restoration postcondition failed');
      }
      validateQuestItemLedger(inventory.questItems, live.questProgress, live.questReceipts);
      if (!hasDrognanTome(live.questProgress, inventory.questItems)) throw new Error('Drognan Claim restored source is invalid');
    });
    attempt(() => { wishes.verifyRestored(); });
    if (errors.length > 0) throw new AggregateError(errors, 'Drognan Claim restoration failed', { cause });
    return 'grant-failed';
  } finally { wishes.dispose(); }
}
