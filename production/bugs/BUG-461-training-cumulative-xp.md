# BUG-461 — Use cumulative XP for campaign training checkpoints

Status: fixed locally and verified; uncommitted. Severity: Medium (QA accounting).

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local
changes; Node24.21.0/Vitest1.6.1 in WSL. Browser/viewport/locale/seed: not
applicable; disclosed constructed admissions use no engine simulation.

## Reproduction

1. Run the `four declared` case in `tests/campaign/act5-dispatch.regression.test.ts`
   through the campaign-regression workspace, cache disabled.
2. Earn the native quest prefix and have the constructed training award use
   `xpTotal(target) - player.experience`.
3. Observe the reported training terminal levels.

Expected: the constructed exact-threshold awards reach L14/26/40/55, and
checkpoint differences use cumulative XP to conserve native reward deltas.

Actual: the third/fourth awards overshoot to L42/60. `player.experience` is XP
within the current level. The new preparation checkpoint also initially copied
that remainder, which cannot reconcile cumulative native wave income.

Evidence: retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-fresh-training-dispatch-green-v1.log`
and its exit receipt (1failed/3passed, finished with no owned descendants alive).

Root cause: omitted `xpTotal(player.level)` in the new fixture/checkpoint.
Existing `campaignEconomy` and production XP settlement already use the correct
conversion; no gameplay XP formula change is needed. Affected systems: fresh
campaign QA preparation and its independent accounting; root remains sole writer.

Workaround: use `xpTotal(player.level) + player.experience` before subtracting
the target threshold. Local fixture/checkpoint correction passes the four
targeted dispatch checks, then all45 integrated dispatch checks and12 independent
preparation-audit checks. Scoped TypeScript/lint pass. Production XP formulas
are unchanged; retained `p15-fresh-training-dispatch-green-v2` and
`p15-fresh-training-dispatch-integrated-v1` receipts bind the local fix. No commit.
