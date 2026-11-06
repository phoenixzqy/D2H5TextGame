import { findRegionalBounty, REGIONAL_BOUNTY_DOMAIN, regionalBountyState, validateRegionalBountyGraph } from '@/engine/map/regional-bounties';
import { pick, replace, sameCainData as sameData } from '@/features/quests/cainPublication';
import { captureBountyAuthorityRollback, prepareBountyAdvance } from './bountyRunAuthority';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import type { RecordedWaveBinding } from './recordedWaveReceipt';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';

/** Capture only this native bounty's row, entry and cursor; unrelated journal changes survive. */
export function captureBountySettlementRollback(run: ActiveRun, binding: RecordedWaveBinding): () => void {
  const definition = REGIONAL_BOUNTY_DOMAIN.find(candidate => candidate.area === run.plan.subAreaId);
  if (!binding.bountyWitness || !definition) return () => undefined;
  const map = useMapStore.getState(), originalRow = map.questProgress[definition.quest], originalEntry = map.bounties[definition.quest];
  validateRegionalBountyGraph(map.questProgress, map.bounties, REGIONAL_BOUNTY_DOMAIN);
  const before = structuredClone({ rows: pick(map.questProgress, [definition.quest]), entries: pick(map.bounties, [definition.quest]) });
  const restoreAuthority = captureBountyAuthorityRollback(run);
  return () => {
    const errors: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
    attempt(restoreAuthority);
    const restoreIdentity = (original: object | undefined, saved: object | undefined) => {
      if (!original || !saved || sameData(original, saved)) return;
      for (const key of Reflect.ownKeys(original)) {
        if (!Object.hasOwn(saved, key) && !Reflect.deleteProperty(original, key)) throw new Error('Bounty participating value restoration failed');
      }
      Object.defineProperties(original, Object.getOwnPropertyDescriptors(structuredClone(saved)));
    };
    attempt(() => { restoreIdentity(originalRow, before.rows[definition.quest]); });
    attempt(() => { restoreIdentity(originalEntry, before.entries[definition.quest]); });
    attempt(() => {
      const current = useMapStore.getState();
      const rows = originalRow && sameData(originalRow, before.rows[definition.quest]) ? { [definition.quest]: originalRow } : structuredClone(before.rows);
      const entries = originalEntry && sameData(originalEntry, before.entries[definition.quest]) ? { [definition.quest]: originalEntry } : structuredClone(before.entries);
      useMapStore.setState({ questProgress: replace(current.questProgress, rows, [definition.quest]),
        bounties: replace(current.bounties, entries, [definition.quest]) });
    });
    attempt(() => {
      const current = useMapStore.getState();
      if (!sameData(pick(current.questProgress, [definition.quest]), before.rows) ||
        !sameData(pick(current.bounties, [definition.quest]), before.entries)) throw new Error('Bounty restoration postcondition failed');
    });
    if (errors.length) throw new AggregateError(errors, 'Bounty settlement restoration failed');
  };
}

/** Prepare before native income; accepted settlement alone advances the original consecutive cursor. */
export function prepareBountySettlement(binding: RecordedWaveBinding): { readonly publishVictory: () => void } | undefined {
  const map = useMapStore.getState(), advance = prepareBountyAdvance(binding, map.questProgress, map.bounties);
  if (!advance) return undefined;
  const run = binding.candidateRun, definition = findRegionalBounty(advance.definition.quest);
  if (!definition) return undefined;
  const checkContext = () => {
    const combat = useCombatStore.getState();
    if (useHydrationStore.getState().status !== 'ready' || combatRunLifecycle.activeRun !== run ||
      usePlayerStore.getState().player?.id !== binding.heroId || run.origin !== binding.origin ||
      run.playerUnit.id !== binding.heroId || run.waveIdx !== binding.targetWaveIdx || run.recording !== binding.recording ||
      combat.outcome !== binding.recording.outcome || combat.recordedEvents !== binding.recording.events ||
      combat.currentWave !== binding.publication.currentWave || combat.totalWaves !== binding.publication.totalWaves ||
      combat.subAreaRunId !== binding.publication.subAreaRunId || !combat.playbackComplete) throw new Error('Bounty settlement authority changed');
  };
  return { publishVictory: () => {
    checkContext();
    const live = useMapStore.getState();
    if (!prepareBountyAdvance(binding, live.questProgress, live.bounties)) throw new Error('Bounty accepted cycle changed during settlement');
    advance.commit();
    if (advance.final) {
      const row = { ...structuredClone(advance.row), status: 'completed' as const,
        objectives: { [definition.objective]: true }, rewardClaimed: false };
      const entry = { claims: advance.entry.claims, victoryOrdinal: advance.entry.claims + 1 };
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [definition.quest]: structuredClone(row) },
        bounties: { ...state.bounties, [definition.quest]: structuredClone(entry) } }));
      checkContext(); advance.checkCommitted();
      const published = useMapStore.getState();
      if (!sameData(published.questProgress[definition.quest], row) || !sameData(published.bounties[definition.quest], entry) ||
        regionalBountyState(definition.quest, published.questProgress, published.bounties, REGIONAL_BOUNTY_DOMAIN) !== 'completed') {
        throw new Error('Bounty publication postcondition failed');
      }
    } else { checkContext(); advance.checkCommitted(); }
  } };
}
