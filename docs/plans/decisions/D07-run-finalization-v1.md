# D07 v1b — Qualified wave finalization

Status: accepted scoped contract, 2026-10-20; P11a only.
Producer independently reviewed the implementation plan as ready.
Extends [replay inputs](D07-run-replay-inputs-v1.md); full D07 remains open.

An installed recorded outcome is precomputed. It becomes eligible for run
progression only after playback completes. An early call returns `idle` with
no mutation and leaves the active run intact. Installing the next wave resets
playback completion, preventing an immediate repeated call from awarding it.

Each completed wave must have `winner === 'player'` and the original hero
alive before it grants XP/loot or advances the plan. Any other outcome ends
the run through the existing `defeat`/`runDefeat` contract and removes the
active run. This means a failed clear; it does not rewrite the actual engine
winner. Preserve null and its draw event. Do not infer timeout from null,
because the engine does not expose its end reason. Hero death takes priority
over a contradictory player-win field.

Retain existing completed-wave idle-pity bookkeeping and earlier wave rewards.
A failed wave grants no new rewards, clear, unlock or quest event. After the
last qualifying victory call `markCleared` exactly once with the plan's
canonical area ID, then mark run victory and remove the active run. Terminal
repeated calls return `idle` without mutation. No new persistent state or
terminal return variant is introduced.

The existing draw locale key can identify a failed draw in the terminal UI;
return controls and idle-stop behavior use the existing failed-run branch.
Detailed time/death/effect ordering, recoverable awards, idle eligibility and
full-run raw reward replay remain separate contracts.

Proof: `src/stores/combatHelpers.outcomes.test.ts` and BUG-008. One actual
production first-wave draw, true full-wave victories, controlled final outcome
boundaries, early/repeated calls and earlier-reward preservation are covered.
Deliberately modified integration heroes do not establish fresh-game balance.
