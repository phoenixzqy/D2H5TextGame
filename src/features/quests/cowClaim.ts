import type { Player } from '@/engine/types/entities';
import { COW, hasCowCompletion } from '@/engine/map/cow-quest';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore, MERC_XP_SHARE } from '@/stores/mercStore';
import { captureCowAuthority, cowOrdinaryReady, sameCowAuthority, validateLiveCowGraph } from './cowContract';
import { captureCountedHeroParticipant } from './countedQuestRollback';
import { captureAct2CacheMercParticipant, planAct2CacheMercAward } from './act2CacheMercRollback';
import { assertCountedData, sameCountedData as sameData, replaceCountedDataKeys as replace, snapshotCountedData } from './countedQuestContract';
import { pick } from './cainPublication';
import type { ClaimResult } from './claimReward';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

export function safeCowCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Unsafe Cow reward arithmetic'); return value;
}
export function safeCowNumbers(value: unknown): void {
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) throw new Error('Unsafe Cow statistic');
  if (value !== null && typeof value === 'object') for (const child of value instanceof Map ? value.values() : Object.values(value)) safeCowNumbers(child);
}
/** Use the real public XP policy and current equipment/quest composition, with no healing. */
export function planCowHeroExperience(hero: Player, amount: number): Player {
  assertCountedData(hero); safeCowCount(amount); safeCowCount(hero.level);
  if (hero.level < 1 || hero.level > LEVEL_CAP) throw new Error('Invalid Cow hero level');
  safeCowCount(hero.experience); safeCowCount(hero.statPoints); safeCowCount(hero.skillPoints);
  const total = safeCowCount(xpTotal(hero.level) + hero.experience); safeCowCount(total + amount);
  const growth = awardXp(total, amount), experience = safeCowCount(growth.totalXp - xpTotal(growth.level));
  const inventory = useInventoryStore.getState(), map = useMapStore.getState();
  const expected = { ...snapshotCountedData(hero), level: growth.level, experience,
    experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, experience) : xpRequired(growth.level),
    statPoints: safeCowCount(hero.statPoints + growth.statPointsGranted), skillPoints: safeCowCount(hero.skillPoints + growth.skillPointsGranted),
    derivedStats: deriveEquippedPlayerStats(hero, growth.level, inventory.equipped, map.questProgress, inventory.questItems, map.questReceipts) };
  safeCowNumbers(expected); return expected;
}
/** First Claim has ordinary readiness and full victory proof, without a source-location gate. */
export function hasCowClaimCompletion(questId: string): boolean {
  if (questId !== COW.quest || !cowOrdinaryReady()) return false;
  try {
    captureCowAuthority(); validateLiveCowGraph(); const map = useMapStore.getState();
    return map.questProgress[COW.quest]?.rewardClaimed !== true && hasCowCompletion(map.questProgress, useInventoryStore.getState().questItems, map.questReceipts);
  } catch { return false; }
}
/** Exactly 6000/4500 XP under the public Claim caller's existing quest lease. */
export function publishCowClaim(): ClaimResult {
  const hero = usePlayerStore.getState().player; if (!hero) return 'no-player'; if (!cowOrdinaryReady()) return 'not-ready';
  let authority: ReturnType<typeof captureCowAuthority>;
  try { authority = captureCowAuthority(); validateLiveCowGraph(); } catch { return 'unsupported-rewards'; }
  const map = useMapStore.getState(), inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  if (map.questProgress[COW.quest]?.rewardClaimed === true) return 'already-claimed';
  if (!hasCowClaimCompletion(COW.quest)) return 'not-completed';
  const sources = [COW.legSource, COW.tomeSource], proofs = [COW.tomeSource, COW.openProof, COW.victoryProof];
  const prepare = () => {
    assertCountedData({ roster: mercs.ownedMercs, progress: mercs.mercProgress, equipped: inventory.equipped });
    if (new Set(mercs.ownedMercs.map(row => row.id)).size !== mercs.ownedMercs.length || Math.floor(6000 * MERC_XP_SHARE) !== 4500) throw new Error('Invalid Cow recipient/share');
    const recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
    if (mercs.fieldedMercId !== null && !recipient) throw new Error('Missing Cow actual recipient');
    const expectedHero = planCowHeroExperience(hero, 6000), recipientAward = recipient ? planAct2CacheMercAward(recipient, mercs.getMercProgress(recipient.id), 4500) : null;
    safeCowNumbers(recipientAward);
    const before = snapshotCountedData({ rows: pick(map.questProgress, [COW.quest]), items: pick(inventory.questItems, sources),
      receipts: pick(map.questReceipts, proofs), hero, recipient, progress: recipient ? pick(mercs.mercProgress, [recipient.id]) : {},
      field: mercs.fieldedMercId, equipped: inventory.equipped });
    const row = before.rows[COW.quest]; if (!row) throw new Error('Missing Cow Claim row');
    return { before, recipient, recipientAward, expectedHero, claimedRows: { [COW.quest]: { ...row, rewardClaimed: true } } };
  };
  let p: ReturnType<typeof prepare>; try { p = prepare(); } catch { return 'unsupported-rewards'; }
  let heroJournal: ReturnType<typeof captureCountedHeroParticipant> | undefined;
  let mercJournal: ReturnType<typeof captureAct2CacheMercParticipant> | undefined;
  let wishes: FiniteSideWishParticipant | undefined;
  let heroPublished = false, mercPublished = false, claimed = false;
  try {
    try { heroJournal = captureCountedHeroParticipant(hero); if (p.recipient) mercJournal = captureAct2CacheMercParticipant(p.recipient);
      wishes = captureFiniteSideWishParticipant(COW.quest); }
    catch { return 'unsupported-rewards'; }
    const participant = heroJournal, wishParticipant = wishes;
    const exactGraph = (claimedRow = claimed) => sameData(pick(useMapStore.getState().questProgress, [COW.quest]), claimedRow ? p.claimedRows : p.before.rows) &&
      sameData(pick(useMapStore.getState().questReceipts, proofs), p.before.receipts) && sameData(pick(useInventoryStore.getState().questItems, sources), p.before.items);
    const check = () => {
      const current = usePlayerStore.getState().player, currentMercs = useMercStore.getState();
      if (!cowOrdinaryReady() || !sameCowAuthority(authority) || !participant.owns(current) || !sameData(current, heroPublished ? p.expectedHero : p.before.hero) ||
        !exactGraph() || currentMercs.fieldedMercId !== p.before.field || !sameData(useInventoryStore.getState().equipped, p.before.equipped)) throw new Error('Cow Claim authority/publication changed');
      if (p.recipient) {
        const recipients = currentMercs.ownedMercs.filter(row => row.id === p.recipient?.id), recipient = recipients[0];
        if (recipients.length !== 1 || !recipient || !mercJournal?.owns(recipient) ||
          !sameData(recipient, mercPublished ? p.recipientAward?.actor : p.before.recipient) ||
          !sameData(pick(currentMercs.mercProgress, [p.recipient.id]), mercPublished ? { [p.recipient.id]: p.recipientAward?.progress } : p.before.progress)) throw new Error('Cow Claim actual recipient changed');
      }
      validateLiveCowGraph(); wishParticipant.check();
    };
    try {
      participant.begin(); check(); participant.publish(p.expectedHero, () => { usePlayerStore.getState().gainExperience(6000); }); heroPublished = true; check();
      if (p.recipient && p.recipientAward && mercJournal) mercJournal.publish(p.recipientAward, () => { useMercStore.getState().shareExperienceWithFielded(6000, p.recipient?.id); });
      mercPublished = true; check(); wishParticipant.publish(); check();
      useMapStore.getState().markQuestRewardClaimed(COW.quest); claimed = true; check(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { wishParticipant.restore(); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(p.before.rows), [COW.quest]), questReceipts: replace(state.questReceipts, snapshotCountedData(p.before.receipts), proofs) })); });
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(p.before.items), sources) })); });
      if (mercJournal) attempt(() => { mercJournal?.restore(); }); attempt(() => { participant.restore(); });
      attempt(() => { if (!exactGraph(false)) throw new Error('Cow Claim source restoration changed'); validateLiveCowGraph(); });
      if (mercJournal) attempt(() => { mercJournal?.verifyRestored(); }); attempt(() => { participant.verifyRestored(); });
      attempt(() => { wishParticipant.verifyRestored(); });
      if (failures.length) throw new AggregateError(failures, 'Cow Claim scoped restoration failed', { cause }); return 'grant-failed';
    }
  } finally { try { mercJournal?.dispose(); } finally { try { heroJournal?.dispose(); } finally { wishes?.dispose(); } } }
}
