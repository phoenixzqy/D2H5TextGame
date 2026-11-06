# BUG-779 — Retain installed encounter plans for every retry attempt

Status: fixed locally, uncommitted; validation and limits recorded below.
Severity: Medium — diagnostic encounter coverage; no production save defect.
Owner: root, solo, acting as qa-engineer/engine-dev.

## Reproduction

Base HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited dirty
`feat/playable-foundations`, Linux/WSL, 2026-11-05. Node/Vitest native transport;
browser/viewport/locale not applicable. Constructed Sorceress, canonical Act I
Catacombs at clock `1793304051000`, at most two contiguous losses. Separate
constructed powerful Sorceress, Blood Moor at `1793304052000`, stops at the
first complete victory. Seeds are the native area/clock-derived seeds; no seed
override, earned campaign, population sample or historical retry is run.

1. Call `measureCampaignRetries` with the declared finite adaptation policy.
2. Read and independently copy `combatRunLifecycle.activeRun.plan` inside each
   `retry-admission` callback, before any playback.
3. Complete the attempt(s), then compare the journal and returned attempt plan
   to the exact installed native plan, including unreached suffix waves.

Expected: every returned attempt and admission journal retains a detached full
installed plan, independent of consumer edits and native run disposal.

Actual: both `attempt.plan` and admission `plan` are absent. First-wave defeat
loses the planned suffix, so reports cannot distinguish absent enemies from
unreached enemies. Victory disposal likewise leaves only observed waves.

## Evidence and repair contract

Both new `[plan]` controls in
`tests/campaign/retry-measurement.regression.test.ts` fail with missing plans.
The six older cases are filtered out, not rerun. RED completes in 8.344 seconds;
its exact JSON/log, prospective scope/budgets and source preimages are retained:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retry-plan-8q3eyxos`.

Capture the actual installed plan immediately after native admission, validate
seed/area/length identity and retain it before publishing admission. Never
reconstruct historical plans. Preserve request-policy version, clocks, native
admission, adaptation, settlement and stop-at-victory semantics. Test journal
mutation isolation through losses and complete victory; scoped types/lint only.

Security check: pass; local diagnostics only, no credential/network/CI,
dependency, permission or production save change. Plan self-review: ready.
Formal balance acceptance and full private v1 remain incomplete.

## Resolution

The harness copies the active native plan immediately after admission, validates
its native seed, canonical area and total wave count, then retains it on each
attempt and publishes a detached copy with `retry-admission`. No plan is
regenerated. Both causal REDs become GREEN: first-wave losses retain their full
unreached suffix across two contiguous admissions; a complete victory retains
its plan after native disposal and stops without adaptation or another entry.
Adversarial edits to published area/waves change neither playback nor results.
Scoped strict TypeScript (957 imported files, zero diagnostics) and explicit
two-file lint pass. Only the two new controls run; six older cases and all spent
campaign/sample/retry budgets stay closed. See
[evidence](../../docs/plans/evidence/p15-retry-plan-capture.md).
Review is root self-review only; no formal balance or full-v1 acceptance claim.
