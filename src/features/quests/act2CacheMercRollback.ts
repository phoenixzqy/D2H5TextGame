import type { Mercenary } from '@/engine/types/entities';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { countedActorContinuity } from './countedQuestRollback';
import { sameCountedData as sameData, replaceCountedDataKeys as replace, snapshotCountedData } from './countedQuestContract';

type MercProgress = ReturnType<typeof useMercStore.getState>['mercProgress'][string];
export interface Act2CacheMercJournal {
  readonly before: { readonly actor: Mercenary; readonly progress: MercProgress; readonly progressWasOwn: boolean };
  owns(actor: Mercenary): boolean;
  publish(expected: { readonly actor: Mercenary; readonly progress: MercProgress }, operation: () => void): void;
  /** Attribute only cleanup's direct cache edge; nested real XP stays independent. */
  publishPhysicalCleanup(operation: () => void): void;
  restore(): void;
  verifyRestored(): void;
  dispose(): void;
}

function safe(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Unsafe cache merc progression');
  return value;
}
/** Real current merc growth/threshold policy; no custom healing or level formula. */
export function planAct2CacheMercAward(actor: Mercenary, progress: MercProgress, amount: number) {
  safe(actor.level); if (actor.level < 1) throw new Error('Invalid cache recipient level');
  let threshold = safe(progress.experienceToNextLevel), remaining = safe(safe(progress.experience) + safe(amount));
  let level = actor.level;
  if (threshold === 0) throw new Error('Invalid cache recipient threshold');
  while (remaining >= threshold) {
    remaining -= threshold; level = safe(level + 1); threshold = safe(mercXpForLevel(level));
    if (threshold === 0) throw new Error('Invalid cache recipient threshold');
  }
  return { actor: growMercenary(repairMercenaryGrowth(snapshotCountedData(actor)), level - actor.level),
    progress: { experience: remaining, experienceToNextLevel: threshold } };
}

type MercState = ReturnType<typeof useMercStore.getState>;
interface Frame { actor: Mercenary; progress: MercProgress; present: boolean }
interface Edge { from: MercState; to: MercState; before: Frame; after: Frame; own?: Frame }

/** Numeric progression/growth deltas preserve independent damage and investments. */
function numericDelta(current: unknown, before: unknown, after: unknown): unknown {
  if (typeof current === 'number' && typeof before === 'number' && typeof after === 'number') {
    if (before === after) return current;
    const value = current + (after - before);
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new Error('Unsafe cache merc delta');
    return value;
  }
  if (current !== null && before !== null && after !== null && typeof current === 'object' && typeof before === 'object' && typeof after === 'object') {
    const values: Record<string, unknown> = { ...current };
    for (const key of Object.keys(current)) {
      const a = Object.getOwnPropertyDescriptor(before, key), b = Object.getOwnPropertyDescriptor(after, key);
      if (a && b) values[key] = numericDelta(Object.getOwnPropertyDescriptor(current, key)?.value as unknown,
        a.value as unknown, b.value as unknown);
    }
    return values;
  }
  return current;
}
/** Damage caps the surviving resource; it must not debit removed level growth twice. */
function resourceDelta(current: number, before: number, after: number): number {
  return after < before ? Math.min(current, after) : numericDelta(current, before, after) as number;
}
function rawDelta(current: Frame, before: Frame, after: Frame): Frame {
  return { actor: { ...current.actor, level: safe(current.actor.level + after.actor.level - before.actor.level),
    coreStats: numericDelta(current.actor.coreStats, before.actor.coreStats, after.actor.coreStats) as Mercenary['coreStats'],
    derivedStats: { ...numericDelta(current.actor.derivedStats, before.actor.derivedStats, after.actor.derivedStats) as Mercenary['derivedStats'],
      life: resourceDelta(current.actor.derivedStats.life, before.actor.derivedStats.life, after.actor.derivedStats.life),
      mana: resourceDelta(current.actor.derivedStats.mana, before.actor.derivedStats.mana, after.actor.derivedStats.mana) } },
    progress: { experience: safe(current.progress.experience + after.progress.experience - before.progress.experience),
      experienceToNextLevel: safe(current.progress.experienceToNextLevel + after.progress.experienceToNextLevel - before.progress.experienceToNextLevel) },
    present: before.present !== after.present ? after.present : current.present };
}
function progressionShape(frame: Frame) {
  return { level: frame.actor.level, coreStats: frame.actor.coreStats, derivedStats: frame.actor.derivedStats, progress: frame.progress };
}
/** Identify an actual supported addExperience edge, then replay its amount without our share. */
function replayIndependent(current: Frame, before: Frame, after: Frame): Frame {
  const levels = after.actor.level - before.actor.level;
  if (Number.isSafeInteger(levels) && levels >= 0 && levels <= 128) {
    let amount = after.progress.experience - before.progress.experience;
    if (levels > 0) {
      amount = before.progress.experienceToNextLevel - before.progress.experience + after.progress.experience;
      for (let level = before.actor.level + 1; level < after.actor.level; level++) amount += mercXpForLevel(level);
    }
    if (Number.isSafeInteger(amount) && amount > 0) {
      const actual = planAct2CacheMercAward(before.actor, before.progress, amount);
      if (sameData(progressionShape({ ...before, ...actual }), progressionShape(after))) {
        return { ...planAct2CacheMercAward(current.actor, current.progress, amount), present: true };
      }
    }
  }
  return rawDelta(current, before, after);
}

/**
 * Journal this actual recipient's state edges. Unlike a roster snapshot, replay
 * keeps independent real awards at their original amounts across level thresholds.
 * State references (not actor references) distinguish below-level XP updates.
 */
export function captureAct2CacheMercParticipant(recipient: Mercenary): Act2CacheMercJournal {
  const initial = useMercStore.getState(), originalId = recipient.id;
  if (initial.fieldedMercId !== originalId || initial.ownedMercs.filter(actor => actor.id === originalId).length !== 1 ||
    !initial.ownedMercs.includes(recipient)) throw new Error('Invalid actual cache recipient');
  const before = { actor: snapshotCountedData(recipient), progress: snapshotCountedData(initial.getMercProgress(originalId)),
    progressWasOwn: Object.hasOwn(initial.mercProgress, originalId) };
  const refs = new Set([recipient]), edges = new Map<MercState, Edge>();
  const owns = (actor: Mercenary) => refs.has(actor) || countedActorContinuity(actor, recipient, originalId);
  const actorIn = (state: MercState) => {
    const matches = state.ownedMercs.filter(owns);
    if (matches.length > 1) throw new Error('Ambiguous cache recipient lineage');
    return matches[0];
  };
  const ownedProgress = (state: MercState): Record<string, MercProgress> => {
    if (!Object.hasOwn(state.mercProgress, originalId)) return {};
    const progress = state.mercProgress[originalId];
    if (!progress) throw new Error('Missing owned cache merc progress');
    return { [originalId]: progress };
  };
  const read = (state: MercState, actor: Mercenary): Frame => {
    const stored = ownedProgress(state);
    return snapshotCountedData({ actor, progress: stored[originalId] ?? { experience: 0, experienceToNextLevel: mercXpForLevel(actor.level) },
      present: Object.hasOwn(stored, originalId) });
  };
  const initialFrame: Frame = { actor: before.actor, progress: before.progress, present: before.progressWasOwn };
  let publication: { from: MercState; before: Frame; expected: Frame; edges: Edge[] } | undefined;
  let restoring = false, disposed = false;
  const stop = useMercStore.subscribe((next, previous) => {
    if (restoring) return;
    for (const state of [previous, next]) for (const actor of state.ownedMercs) if (owns(actor)) refs.add(actor);
    const old = actorIn(previous), current = actorIn(next);
    if (!old || !current || next === previous) return;
    const edge: Edge = { from: previous, to: next, before: read(previous, old), after: read(next, current) };
    if (!edges.has(previous)) edges.set(previous, edge);
    publication?.edges.push(edge);
  });
  const publish = (expected: { readonly actor: Mercenary; readonly progress: MercProgress }, operation: () => void): void => {
    const state = useMercStore.getState(), actor = actorIn(state);
    if (!actor) throw new Error('Actual cache recipient was removed');
    const active = { from: state, before: read(state, actor),
      expected: snapshotCountedData({ ...expected, present: true }), edges: [] as Edge[] };
    publication = active;
    try { operation(); } finally {
      const nested = active.edges.filter(edge => edge.from !== active.from), destinations = new Set(nested.map(edge => edge.to));
      const first = nested.find(edge => !destinations.has(edge.from));
      const direct = edges.get(active.from), currentState = useMercStore.getState(), current = actorIn(currentState);
      if (first) edges.set(active.from, { from: active.from, to: first.from, before: active.before, after: first.before, own: active.expected });
      else if (direct) { direct.before = active.before; direct.own = active.expected; }
      else if (current && (currentState !== active.from || !sameData(read(currentState, current), active.before))) {
        edges.set(active.from, { from: active.from, to: currentState, before: active.before, after: read(currentState, current), own: active.expected });
      }
      publication = undefined;
    }
  };
  let expectedActor: Mercenary | undefined, expectedProgress: Record<string, MercProgress> = {};
  let expectedSurvivor: Mercenary | undefined;
  const restore = (): void => {
    const state = useMercStore.getState(), current = actorIn(state);
    if (!current) {
      const foreign = state.ownedMercs.some(actor => actor.id === originalId);
      expectedProgress = foreign ? snapshotCountedData(ownedProgress(state)) : {};
      expectedActor = undefined; expectedSurvivor = undefined;
      if (!foreign && Object.hasOwn(state.mercProgress, originalId)) {
        restoring = true;
        try { useMercStore.setState(live => ({ mercProgress: replace(live.mercProgress, {}, [originalId]) })); }
        finally { restoring = false; }
      }
      return;
    }
    let projected = snapshotCountedData(initialFrame), last = initialFrame, cursor = initial;
    const visited = new Set<MercState>();
    while (cursor !== state && !visited.has(cursor)) {
      visited.add(cursor); const edge = edges.get(cursor); if (!edge) break;
      projected = edge.own ? rawDelta(projected, edge.own, edge.after) : replayIndependent(projected, edge.before, edge.after);
      cursor = edge.to; last = edge.after;
    }
    const actual = read(state, current);
    if (cursor !== state || !sameData(progressionShape(last), progressionShape(actual)) || last.present !== actual.present) {
      projected = replayIndependent(projected, last, actual);
    }
    const restored = { ...current, level: projected.actor.level, coreStats: projected.actor.coreStats,
      derivedStats: { ...projected.actor.derivedStats,
        life: Math.max(0, Math.min(projected.actor.derivedStats.life, current.derivedStats.life, projected.actor.derivedStats.lifeMax)),
        mana: Math.max(0, Math.min(projected.actor.derivedStats.mana, current.derivedStats.mana, projected.actor.derivedStats.manaMax)) } };
    expectedActor = snapshotCountedData(restored); expectedSurvivor = restored;
    expectedProgress = projected.present ? { [originalId]: snapshotCountedData(projected.progress) } : {};
    refs.add(restored); restoring = true;
    try { useMercStore.setState(live => ({ ownedMercs: live.ownedMercs.map(actor => actor === current ? restored : actor),
      mercProgress: replace(live.mercProgress, expectedProgress, [originalId]) })); }
    finally { restoring = false; }
  };
  const verifyRestored = (): void => {
    const state = useMercStore.getState(), actor = actorIn(state);
    const actorChanged = expectedActor === undefined ? actor !== undefined
      : actor === undefined || actor !== expectedSurvivor || !sameData(actor, expectedActor);
    if (actorChanged || !sameData(Object.hasOwn(state.mercProgress, originalId)
        ? { [originalId]: state.mercProgress[originalId] } : {}, expectedProgress)) {
      throw new Error('Cache actual-recipient restoration changed');
    }
  };
  return { before, owns, publish, publishPhysicalCleanup: operation => { operation(); }, restore, verifyRestored,
    dispose: () => { if (!disposed) { disposed = true; stop(); } } };
}
