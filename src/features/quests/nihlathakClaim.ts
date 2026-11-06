import { NIHLATHAK, hasNihlathakRelic } from '@/engine/map/nihlathak-quest';
import type { Item } from '@/engine/types/items';
import type { Unit } from '@/engine/types/entities';
import { captureQuestRewardOwnership } from './questRewardOwnership';
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
import { hasCanonicalNihlathakDefinition } from './nihlathakContract';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

/** Source-bound Claim remains available away from the Recover location and difficulty. */
export function hasNihlathakClaimCompletion(questId: string): boolean {
  if (questId !== NIHLATHAK.quest) return true;
  if (!usePlayerStore.getState().player || useHydrationStore.getState().status !== 'ready' || isReplacingSave() ||
    hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return false;
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    if (!hasCanonicalNihlathakDefinition() || !hasNihlathakRelic(map.questProgress, inv.questItems, map.questReceipts)) return false;
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    return true;
  } catch { return false; }
}

/** Capture the actual claimant and source before the generic private constructor runs. */
export function captureNihlathakClaimWitness() {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState(), inv = useInventoryStore.getState();
  const mercs = useMercStore.getState(), recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
  return { heroReference: hero, recipientReference: recipient,
    data: structuredClone({ hero, recipient, rows: pick(map.questProgress, [NIHLATHAK.quest]),
      items: pick(inv.questItems, [NIHLATHAK.source]),
      progress: recipient ? pick(mercs.mercProgress, [recipient.id]) : {} }) };
}

/** Consume the sole item prepared by the existing deterministic unique pipeline. */
export function publishNihlathakClaim(item: Item, preflightInventory: () => void,
  witness: ReturnType<typeof captureNihlathakClaimWitness>): 'ok' | 'unsupported-rewards' | 'grant-failed' {
  const hero = witness.heroReference, recipient = witness.recipientReference, before = witness.data;
  if (!hero || !before.hero || !hasNihlathakClaimCompletion(NIHLATHAK.quest) ||
    useMapStore.getState().questProgress[NIHLATHAK.quest]?.rewardClaimed === true) return 'unsupported-rewards';
  const savedHero = before.hero;
  const inv = useInventoryStore.getState(), map = useMapStore.getState(), mercs = useMercStore.getState();
  const recipientId = recipient?.id, recipientReferences = new Set(recipient ? [recipient] : []);
  const heroReferences = new Set([hero]);
  if (usePlayerStore.getState().player !== hero || !sameData(hero, before.hero) ||
    !sameData(pick(map.questProgress, [NIHLATHAK.quest]), before.rows) ||
    !sameData(pick(inv.questItems, [NIHLATHAK.source]), before.items) ||
    recipientId !== undefined && (mercs.ownedMercs.find(row => row.id === recipientId) !== recipient ||
      !sameData(recipient, before.recipient) || !sameData(pick(mercs.mercProgress, [recipientId]), before.progress))) return 'grant-failed';
  const row = before.rows[NIHLATHAK.quest]; if (!row) return 'unsupported-rewards';
  const claimedRows = { [NIHLATHAK.quest]: { ...row, rewardClaimed: true } };
  let xpHero = before.hero, expectedRecipient = before.recipient, expectedProgress = before.progress;
  try {
    const growth = awardXp(xpTotal(hero.level) + hero.experience, 12000), intoLevel = Math.max(0, growth.totalXp - xpTotal(growth.level));
    xpHero = { ...before.hero, level: growth.level, experience: intoLevel,
      experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
      statPoints: hero.statPoints + growth.statPointsGranted, skillPoints: hero.skillPoints + growth.skillPointsGranted,
      derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts) };
    if (recipient && recipientId !== undefined) {
      let progress = structuredClone(mercs.getMercProgress(recipientId)), level = recipient.level;
      let remaining = progress.experience + Math.floor(12000 * MERC_XP_SHARE);
      while (remaining >= progress.experienceToNextLevel) {
        remaining -= progress.experienceToNextLevel; level++;
        progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
      }
      expectedProgress = { [recipientId]: { experience: remaining, experienceToNextLevel: progress.experienceToNextLevel } };
      expectedRecipient = growMercenary(repairMercenaryGrowth(structuredClone(recipient)), level - recipient.level);
    }
  } catch { return 'unsupported-rewards'; }
  const expectedHero = xpHero;
  /**
   * ID equality alone never authorizes actor restoration. Known publication refs
   * survive later mutation/rename. Independent spreads must retain at least two
   * captured skills/status-effects/cooldown array references. Fresh reconstructed
   * same-ID actors, or replacing two arrays at once, lose this conservative witness.
   */
  const continuous = (actor: Unit, original: Unit, originalId: string): boolean =>
    actor.id === originalId && actor.type === original.type && actor.team === original.team &&
    [actor.skills === original.skills, actor.statusEffects === original.statusEffects,
      actor.cooldowns === original.cooldowns].filter(Boolean).length >= 2;
  const ownsHero = (actor: typeof hero | null): actor is typeof hero => actor !== null &&
    (heroReferences.has(actor) || continuous(actor, hero, savedHero.id));
  const ownsRecipient = (actor: NonNullable<typeof recipient>): boolean => recipient !== undefined &&
    (recipientReferences.has(actor) || continuous(actor, recipient, recipientId ?? ''));
  let heroPublicationState: ReturnType<typeof usePlayerStore.getState> | undefined;
  let mercPublicationState: ReturnType<typeof useMercStore.getState> | undefined;
  // Nested notifications expose their previous actor before an earlier listener
  // resumes. Zustand's later outer listeners can receive the latest nested state.
  const stopHero = usePlayerStore.subscribe((next, previous) => {
    if (!heroPublicationState) return;
    for (const actor of [previous.player, next.player]) if (actor && ownsHero(actor)) heroReferences.add(actor);
  });
  const stopMerc = useMercStore.subscribe((next, previous) => {
    if (!mercPublicationState || !recipient) return;
    for (const actor of [...previous.ownedMercs, ...next.ownedMercs]) if (ownsRecipient(actor)) recipientReferences.add(actor);
  });
  const ownership = captureQuestRewardOwnership(item);
  const dispose = (): void => { ownership.dispose(); stopHero(); stopMerc(); };
  try { ownership.preflight(); preflightInventory(); } catch { dispose(); return 'unsupported-rewards'; }
  let wishes: FiniteSideWishParticipant;
  try { wishes = captureFiniteSideWishParticipant(NIHLATHAK.quest); } catch { dispose(); return 'unsupported-rewards'; }
  const check = (phase: 'before' | 'xp' | 'merc' | 'item' | 'claimed'): void => {
    const live = useMapStore.getState(), inventory = useInventoryStore.getState(), current = useMercStore.getState();
    if (!hasNihlathakClaimCompletion(NIHLATHAK.quest) || !ownsHero(usePlayerStore.getState().player) ||
      !sameData(usePlayerStore.getState().player, phase === 'before' ? before.hero : expectedHero) ||
      !sameData(pick(live.questProgress, [NIHLATHAK.quest]), phase === 'claimed' ? claimedRows : before.rows) ||
      !sameData(pick(inventory.questItems, [NIHLATHAK.source]), before.items)) throw new Error('Nihlathak Claim source/hero publication changed');
    if (recipientId !== undefined) {
      const recipients = current.ownedMercs.filter(candidate => candidate.id === recipientId);
      if (recipients.length !== 1 || !recipients[0] || !ownsRecipient(recipients[0]) || ((phase === 'before' || phase === 'xp') && recipients[0] !== recipient) ||
        !sameData(recipients[0], phase === 'before' || phase === 'xp' ? before.recipient : expectedRecipient) ||
        !sameData(pick(current.mercProgress, [recipientId]), phase === 'before' || phase === 'xp' ? before.progress : expectedProgress)) {
        throw new Error('Nihlathak Claim actual recipient changed');
      }
    }
    wishes.check();
  };
  try {
    check('before');
    try { heroPublicationState = usePlayerStore.getState(); usePlayerStore.getState().gainExperience(12000); } finally { heroPublicationState = undefined; }
    check('xp');
    try { mercPublicationState = useMercStore.getState(); useMercStore.getState().shareExperienceWithFielded(12000, recipientId ?? null); } finally { mercPublicationState = undefined; }
    check('merc');
    ownership.preflight(); preflightInventory();
    useInventoryStore.getState().addItem(item); ownership.checkPublished(); check('item');
    wishes.publish(); ownership.checkPublished(); check('item');
    useMapStore.getState().markQuestRewardClaimed(NIHLATHAK.quest); ownership.checkPublished(); check('claimed');
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    attempt(() => { wishes.restore(); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), [NIHLATHAK.quest]) })); });
    attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(before.items), [NIHLATHAK.source]) })); });
    attempt(() => { ownership.restore(); });
    // The reward owns progression, not fielding or independent roster edits.
    let restoredRecipient: typeof recipient, restoredProgress = before.progress;
    const savedRecipient = before.recipient;
    if (recipient && recipientId !== undefined && savedRecipient) attempt(() => { useMercStore.setState(state => {
      const current = state.ownedMercs.find(ownsRecipient);
      if (!current) {
        // A fresh actor reusing the old ID also owns its independent XP map.
        if (state.ownedMercs.some(candidate => candidate.id === recipientId)) {
          restoredProgress = structuredClone(pick(state.mercProgress, [recipientId])); return {};
        }
        restoredProgress = {}; return { mercProgress: replace(state.mercProgress, {}, [recipientId]) };
      }
      const restored = { ...current, level: savedRecipient.level,
        coreStats: structuredClone(savedRecipient.coreStats), derivedStats: { ...structuredClone(savedRecipient.derivedStats),
          life: Math.min(savedRecipient.derivedStats.life, current.derivedStats.life, savedRecipient.derivedStats.lifeMax),
          mana: Math.min(current.derivedStats.mana, savedRecipient.derivedStats.manaMax) } };
      restoredRecipient = structuredClone(restored);
      return { ownedMercs: state.ownedMercs.map(candidate => candidate === current ? restored : candidate),
        mercProgress: replace(state.mercProgress, structuredClone(before.progress), [recipientId]) };
    }); });
    let restoredHero: ReturnType<typeof usePlayerStore.getState>['player'] = before.hero;
    const restorationHero = () => {
      const current = usePlayerStore.getState().player, inventory = useInventoryStore.getState(), live = useMapStore.getState();
      if (!ownsHero(current)) return current;
      const player = { ...current, level: savedHero.level, experience: savedHero.experience,
        experienceToNextLevel: savedHero.experienceToNextLevel, statPoints: savedHero.statPoints, skillPoints: savedHero.skillPoints };
      return { ...player, derivedStats: deriveEquippedPlayerStats(player, player.level, inventory.equipped,
        live.questProgress, inventory.questItems, live.questReceipts) };
    };
    attempt(() => {
      restoredHero = restorationHero();
      if (ownsHero(restoredHero)) { heroReferences.add(restoredHero); usePlayerStore.setState({ player: restoredHero }); }
    });
    attempt(() => {
      const live = useMapStore.getState(), inventory = useInventoryStore.getState(), current = useMercStore.getState();
      const progression = (merc: typeof recipient) => merc && ({ level: merc.level, coreStats: merc.coreStats, derivedStats: merc.derivedStats });
      if (!sameData(pick(live.questProgress, [NIHLATHAK.quest]), before.rows) || !sameData(pick(inventory.questItems, [NIHLATHAK.source]), before.items) ||
        !sameData(usePlayerStore.getState().player, restoredHero) || !sameData(restoredHero, restorationHero()) ||
        recipientId !== undefined && (!sameData(pick(current.mercProgress, [recipientId]), restoredProgress) ||
          !sameData(progression(current.ownedMercs.find(candidate => candidate.id === restoredRecipient?.id)), progression(restoredRecipient)))) {
        throw new Error('Nihlathak Claim restoration postcondition failed');
      }
      validateQuestItemLedger(inventory.questItems, live.questProgress, live.questReceipts);
      if (!hasNihlathakRelic(live.questProgress, inventory.questItems, live.questReceipts)) throw new Error('Nihlathak Claim restored source is invalid');
    });
    attempt(() => { wishes.verifyRestored(); });
    if (errors.length > 0) throw new AggregateError(errors, 'Nihlathak Claim restoration failed', { cause });
    return 'grant-failed';
  } finally { try { dispose(); } finally { wishes.dispose(); } }
}
