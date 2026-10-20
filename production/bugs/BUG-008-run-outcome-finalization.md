# BUG-008 — Finalize only completed, winning waves

Severity: High (false clears/unlocks and premature rewards).
Status: fixed and independently reviewed, 2026-10-20; P11a.
Reproduced at `e5428a2`; final integration SHA is in the execution ledger.
Owner/affected systems: engine/store integration, map progression, rewards.
Environment: Node 24.21.0, Vitest 1.6.1 UI workspace (jsdom); fixed run seed 7,
challenge ordinal 0, epoch 1792454400000. Browser/viewport/locale: not applicable
to this store regression; no player-facing text assertions.

## Reproduction

1. Run `npx vitest run --project ui src/stores/combatHelpers.outcomes.test.ts --reporter=dot`.
2. Start canonical Blood Moor with the production run planner and engine, using
   a deliberately durable, zero-attack integration hero (not a balance sample).
3. Drain recorded playback. The actual engine ends at 60,000 ms with a living
   hero and `winner: null`. Call `advanceWaveOrFinish`.
4. In separate controlled result-boundary cases, reach the last wave through
   real victories, then provide a null/enemy result or a dead original hero.

Expected: a non-winning wave ends the run without advancing, rewards for that
wave, a clear or idle unlock. Earlier earned rewards remain. A precomputed
outcome cannot commit until playback completes. Only all-wave actual victories
with the original hero alive clear an area, exactly once.

Actual: the real draw returns `next-wave`; final null/enemy outcomes with a
living hero return `victory`. A claimed player win with a dead hero grants
rewards before failure. Calling before playback finishes commits/advances, and
successful finalization invokes `markCleared` twice.

Evidence: all six focused regressions fail before the patch (2.97 s). Failures
are `next-wave` versus `defeat`, `next-wave` versus premature `idle`, two clear
calls versus one, final `victory` versus `defeat` (draw/enemy), and mutated reward
state for the dead hero. Regression source preserves the exact fixtures.

Root cause: finalization trusts hero survival rather than the actual winner,
awards before checking hero death, and never enforces its documented playback
precondition. The final branch repeats its map-clear action.

## Controlling correction

Use the shared finalization boundary for every caller. Before mutation require
completed playback. On completion retain existing idle-pity bookkeeping; then
require an actual player win and a living original hero before rewards,
advancement or clear. A failed clear uses the existing `defeat`/`runDefeat`
terminal contract; the raw engine winner remains unchanged, including null.
This denotes a failed run, not a claim that the engine selected the enemy.
Null alone does not identify an end reason. Remove duplicate/best-effort map
clear handling; call the real store once after the final qualifying win.

Producer independent plan review: ready. D04 already says a null result is not
victory and authorizes no victory rewards. Preserve current wave RNG, award
formulas, action cadence, prior rewards, and completed-wave idle pity. No new
save/API result variant or balance tuning. A following UI child will use the
existing localized draw text for a failed run whose actual winner is null.

Security check: pass; local game progression boundary only, with no network,
credentials, dependency, permissions, save shape or validation bypass changes.

## Validation

After correction, focused outcomes/replay/existing helper tests: 52 passed /
1 pre-existing skipped, 4.06 s. `npm test -- --reporter=dot`: 91 files / 882
passed / 1 pre-existing merc-XP skip, 38.60 s (over 15 s budget). Typecheck,
lint/engine purity, `git diff --check` and production build passed (18.54 s).
Build retains large-chunk/art-manifest-precache warnings; unit retains existing
React act/router warnings. No engine module changed, so no separate E run.

Independent QA source/test review: APPROVE, with no blocking finding. Actual
first-wave draw and full-run victories use the production planner/engine;
controlled final-result cases cover preservation/negative boundaries. Browser
draw wording and controls are the next scoped UI child, not claimed here.
