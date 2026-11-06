import type { Player, Unit } from '@/engine/types/entities';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { sameCountedData, snapshotCountedData } from './countedQuestContract';
import { beginCountedQuestAllocationFence } from './countedQuestAllocationGuard';

const progressionKeys = ['level', 'experience', 'experienceToNextLevel', 'statPoints', 'skillPoints'] as const;
type Progression = Pick<Player, typeof progressionKeys[number]>;
function progression(player: Player): Progression {
  return Object.fromEntries(progressionKeys.map(key => [key, player[key]])) as Progression;
}
interface ProgressionStep {
  from: Player; to: Player; before: Progression; after: Progression; own?: Progression; xpAward: boolean;
}

/** Replay an independent XP award at its original amount, without the aborted quest award. */
function replayProgression(current: Progression, step: ProgressionStep): Progression {
  const { before, after } = step;
  const amount = xpTotal(after.level) + after.experience - xpTotal(before.level) - before.experience;
  if (step.xpAward && amount >= 0) {
    const actual = awardXp(xpTotal(before.level) + before.experience, amount);
    if (after.level === actual.level && after.statPoints - before.statPoints === actual.statPointsGranted
      && after.skillPoints - before.skillPoints === actual.skillPointsGranted) {
      const replayed = awardXp(xpTotal(current.level) + current.experience, amount);
      const experience = replayed.totalXp - xpTotal(replayed.level);
      return { level: replayed.level, experience,
        experienceToNextLevel: replayed.level >= LEVEL_CAP ? Math.max(1, experience) : xpRequired(replayed.level),
        statPoints: current.statPoints + replayed.statPointsGranted, skillPoints: current.skillPoints + replayed.skillPointsGranted };
    }
  }
  return Object.fromEntries(progressionKeys.map(key => [key, current[key] + after[key] - before[key]])) as Progression;
}

/** Actual references and conservative immutable-spread continuity authorize restoration. */
export function countedActorContinuity(actor: Unit, original: Unit, originalId = original.id): boolean {
  return actor.id === originalId && actor.type === original.type && actor.team === original.team &&
    [actor.skills === original.skills, actor.statusEffects === original.statusEffects,
      actor.cooldowns === original.cooldowns].filter(Boolean).length >= 2;
}

/** Journal progression only; current equipment, raw investments and independent actors survive failure. */
export function captureCountedHeroParticipant(hero: Player) {
  const before = snapshotCountedData(hero), refs = new Set([hero]);
  const initialInventory = useInventoryStore.getState(), initialMap = useMapStore.getState();
  const beforeComposition = snapshotCountedData({ equipped: initialInventory.equipped,
    derivedStats: deriveEquippedPlayerStats(before, before.level, initialInventory.equipped,
      initialMap.questProgress, initialInventory.questItems, initialMap.questReceipts) });
  let releaseAllocationFence: (() => void) | undefined;
  const steps = new Map<Player, ProgressionStep>();
  let publication: { from: Player; before: Progression; expected: Progression; edges: ProgressionStep[] } | undefined;
  let restoring = false;
  const owns = (actor: Player | null): actor is Player => actor !== null &&
    (refs.has(actor) || countedActorContinuity(actor, hero, before.id));
  const stop = usePlayerStore.subscribe((next, previous) => {
    if (restoring) return;
    for (const actor of [previous.player, next.player]) if (owns(actor)) refs.add(actor);
    if (owns(previous.player) && owns(next.player) && previous.player !== next.player) {
      const step = { from: previous.player, to: next.player, before: progression(previous.player), after: progression(next.player),
        xpAward: previous.player.derivedStats !== next.player.derivedStats };
      if (!steps.has(step.from)) steps.set(step.from, step);
      publication?.edges.push(step);
    }
  });
  const begin = (): void => { releaseAllocationFence ??= beginCountedQuestAllocationFence(); };
  const publish = (expected: Player, operation: () => void): void => {
    const current = usePlayerStore.getState().player;
    if (!owns(current)) throw new Error('Counted hero publication owner changed');
    const active = { from: current, before: progression(current), expected: progression(expected), edges: [] as ProgressionStep[] };
    publication = active;
    try { operation(); } finally {
      const direct = steps.get(active.from);
      // Zustand can deliver the current nested state as the outer callback's
      // next argument. Reconstruct the first actual actor from nested edges.
      const nested = active.edges.filter(step => step.from !== active.from);
      const destinations = new Set(nested.map(step => step.to));
      const first = nested.find(step => !destinations.has(step.from));
      if (first) {
        steps.set(active.from, { from: active.from, to: first.from, before: active.before,
          after: first.before, own: active.expected, xpAward: false });
      } else if (direct) {
        // Pin the actual outer edge by reference even if an earlier listener
        // mutated its next object. Only the planned progression belongs to Claim.
        direct.before = active.before; direct.own = active.expected;
      } else {
        // A throwing earlier listener may prevent every outer notification.
        const actor = usePlayerStore.getState().player;
        if (owns(actor) && actor !== active.from) steps.set(active.from, {
          from: active.from, to: actor, before: active.before, after: progression(actor),
          own: active.expected, xpAward: false
        });
      }
      publication = undefined;
    }
  };
  const restoration = (): Player | null => {
    const current = usePlayerStore.getState().player;
    if (!owns(current)) return current;
    let restoredProgression = progression(before), actor = hero, last = progression(before), independentRecomposition = false;
    const visited = new Set<Player>();
    while (actor !== current && !visited.has(actor)) {
      visited.add(actor);
      const step = steps.get(actor); if (!step) break;
      if (!step.own && step.xpAward) independentRecomposition = true;
      restoredProgression = replayProgression(restoredProgression, step.own
        ? { ...step, before: step.own, xpAward: false } : step);
      actor = step.to; last = step.after;
    }
    if (actor !== current || !sameCountedData(last, progression(current))) restoredProgression = replayProgression(restoredProgression,
      { from: actor, to: current, before: last, after: progression(current), xpAward: false });
    const restored = { ...current, ...restoredProgression };
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const derivedStats = deriveEquippedPlayerStats(restored, restored.level, inventory.equipped,
      map.questProgress, inventory.questItems, map.questReceipts);
    // Undo our cache normalization only when its original inputs still apply.
    // An independent XP recomposition or changed loadout keeps the fresh result.
    const originalComposition = !independentRecomposition && restored.level === before.level
      && sameCountedData(restored.coreStats, before.coreStats) && sameCountedData(inventory.equipped, beforeComposition.equipped)
      && sameCountedData({ ...derivedStats, life: beforeComposition.derivedStats.life, mana: beforeComposition.derivedStats.mana }, beforeComposition.derivedStats);
    return { ...restored, derivedStats: originalComposition ? { ...before.derivedStats,
      life: Math.min(before.derivedStats.life, current.derivedStats.life, before.derivedStats.lifeMax),
      mana: Math.min(before.derivedStats.mana, current.derivedStats.mana, before.derivedStats.manaMax) } : derivedStats };
  };
  let expected: Player | null = null;
  const restore = (): void => {
    const restored = restoration();
    expected = snapshotCountedData(restored);
    if (owns(restored)) {
      refs.add(restored); restoring = true;
      try { usePlayerStore.setState({ player: restored }); } finally { restoring = false; }
    }
  };
  const verifyRestored = (): void => {
    if (!sameCountedData(usePlayerStore.getState().player, expected)) throw new Error('Counted hero restoration changed');
  };
  return { before, owns, begin, publish, restore, verifyRestored, dispose: () => { try { stop(); } finally { releaseAllocationFence?.(); } } };
}
