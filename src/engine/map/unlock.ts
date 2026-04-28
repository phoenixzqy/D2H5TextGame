/**
 * Map / act unlock predicates.
 *
 * D2-style act gating: each act past the first is locked behind the previous
 * act's final main-quest. Within an unlocked act, all sub-areas are open.
 * The very first act is always unlocked.
 *
 * Source: `src/data/quests/main.json` — each main quest carries an
 * `unlocks` field; we mirror the act-gate quest ids here so the engine can
 * evaluate without hitting the data file at runtime.
 *
 * @module engine/map/unlock
 */

/**
 * Quest id whose completion unlocks the *target* act number.
 * Keys are act numbers (2..5); act 1 is always unlocked.
 */
export const ACT_GATE_QUESTS: Readonly<Record<number, string>> = {
  2: 'quests/act1-sisters-to-the-slaughter', // Andariel
  3: 'quests/act2-seven-tombs',              // Duriel
  4: 'quests/act3-guardian',                 // Mephisto
  5: 'quests/act4-terrors-end'               // Diablo
};

/**
 * Return `true` if the given act is currently unlocked.
 *
 * @param act              Act number (1..5).
 * @param completedQuestIds Set of completed quest ids.
 */
export function isActUnlocked(
  act: number,
  completedQuestIds: ReadonlySet<string>
): boolean {
  if (act <= 1) return true;
  const gate = ACT_GATE_QUESTS[act];
  if (!gate) return false;
  return completedQuestIds.has(gate);
}

/** Return the highest unlocked act (≥1). */
export function highestUnlockedAct(
  completedQuestIds: ReadonlySet<string>
): number {
  for (let a = 5; a >= 1; a--) {
    if (isActUnlocked(a, completedQuestIds)) return a;
  }
  return 1;
}

/**
 * Return `true` if a sub-area is unlocked. A sub-area is unlocked iff its
 * parent act is unlocked. Finer-grained per-area gating can be layered on
 * top by passing additional rules in the future.
 *
 * @param act              Parent act number.
 * @param completedQuestIds Completed quest ids.
 */
export function isSubAreaUnlocked(
  act: number,
  completedQuestIds: ReadonlySet<string>
): boolean {
  return isActUnlocked(act, completedQuestIds);
}

/**
 * Build the set of unlocked act numbers from a list of completed quest ids.
 */
export function getUnlockedActs(
  completedQuestIds: ReadonlySet<string>
): readonly number[] {
  const out: number[] = [1];
  for (let a = 2; a <= 5; a++) {
    if (isActUnlocked(a, completedQuestIds)) out.push(a);
  }
  return out;
}
