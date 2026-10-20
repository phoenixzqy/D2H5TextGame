# BUG-011 — Settle periodic effects at shared simulation boundaries

Severity: High (combat outcome, fractional damage and measurement integrity).
Owner: engine/technical. Card: P06c01.
Status: fixed and independently source/contract reviewed, 2026-10-20.
Prepatch HEAD: `da8b504`. Environment: Node 24.21.0 / Vitest 1.6.1,
Node engine project, seed 7; no browser/viewport/locale involvement.

## Prepatch reproduction

Run `npm run test:engine -- src/engine/combat/periodic-timing.test.ts --no-cache --reporter=dot`.
The initial 23 behavior cases produce **21 failed / 2 passed** (1.28 seconds).
This report and accepted D04 v1b were written before any runtime source patch.

Observed exact failures include:

- 10 DPS expiring at 1000ms, before first 1700ms action: 0 instead of 10.
- Actual application at 1700ms: immediately ticks 17 retrospective damage.
- 10 DPS for 5000ms: AS63 gets 38 and AS263 gets 48 instead of exactly 50.
- 1 HP at 2 or 3 DPS dies at 1700ms instead of 500 or 334ms.
- 0.5 DPS legacy indefinite: 35 damage instead of 30 through the deadline.
- Future freeze grants physical combo 15 instead of 10 before its start.
- Inactive same-ID poison retains four old stacks/potency and becomes five,
  rather than fresh one stack at new potency/start/source.
- A final-half-second future DoT damages before its start and totals 105
  rather than 1. Its deadline lethal fixture dies at 400 rather than 60000ms.
- Final-interval source spread and simultaneous hero/boss/owner death cases fail.

Root cause: actor-only ticking uses the actor's entire time since its last tick
with its current statuses, drops expiry first, ignores application times, floors
each chunk with minimum one, and runs each death's healing/spread before other
units' lethal periodic intervals. The action-only scheduler cannot observe lethal,
start or expiry instants between actions, nor settle the final deadline interval.

## Approved correction boundary

D04 v1b controls shared action/start/expiry/lethal/deadline boundaries, interval
overlap, pooled battle-local fractional carry, simultaneous death/orphan marking
before ordinary effects, final-interval source snapshots and fresh inactive
recipient application. Keep cadence/insertion ties, immutable inputs and seeded
RNG. No status numeric tuning, save fields, boss millisecond multiplier or
cross-wave rebase in this child. Cross-wave absolute timestamps remain explicit
debt under P06c03; future records must remain supported.

Security check: pass; pure transient engine change with no new IO, credentials,
permissions, persistence or policy bypass. Regression fixtures use synthetic data.

## Validation and review

Final focused regressions: 31 passed (1.07 seconds). Full engine suite:
39 files / 382 passed (3.18 seconds, above the 3-second budget). Final full
unit/contract suite: 97 files / 970 passed / 1 existing skip (22.81 seconds,
above the 15-second budget). Typecheck, full lint/engine purity, targeted lint
and `git diff --check` pass. Build passes; existing Browserslist age, large
bundle and PWA manifest-precache advisories remain. No browser run is needed
for this pure engine child. V8 focused combat coverage (147 tests) is 95.52%
lines / 83.92% branches for combat.ts and 99.02% / 93.61% for status.ts;
both report 100% function coverage.

The accepted test additions also cover legacy indefinite refresh vs untimed
finite-lifecycle compatibility, inactive paralyze markers without RNG draws,
finite spread timestamps, living-owner refunds, independently lethal orphan
overlap, reverse-insertion grandchild/child/owner closure and the action cap.
Two supplementary test fixtures initially let valid orb healing change their
intended stop; limiting their max HP made the expected orb heal floor to zero.
No runtime change was needed for those fixture corrections.

Root independent source/test review: APPROVE after the transitive-closure test.
Producer independent source/contract review: APPROVE after the precise legacy
lifecycle wording/assertion. Both reviewed all six owned files; no remaining
finding within this child. The compensating binary search verifies analytic
lethal estimates using the same overlap integrator, without per-ms polling.

Production screening used the default fresh sorceress/Blood Moor/seed1 recipe,
twice, against the approved runtime source with dirty provenance at base
`da8b504`. Both repetitions win wave 1 then lose wave 2 of 3: 48.96 logical
seconds / 62.82 UI-delay-hint seconds; XP160, three items, 80 rune shards and
one gem shard retained, no clear, no diagnostics. Raw recordings and semantic
rewards match; process-global raw item IDs differ as already documented by
P02a03. Both contain zero DoT events, so this sample screens production
compatibility but does not certify the periodic contract or campaign balance.
Wave 1's 297-event digest is
`21df75abe7e9f9a412dcaaff2123f05a2be15fe607da904e0f15435435e57351`;
wave 2's 63-event digest is
`3357e5b7b771c0012bff7eb5531d22f532667a5c07c535197d072f9d90a3236a`.
The first digest differs from the earlier prechild report despite zero DoT;
new global status boundaries can shift presentation-marker/status clocks,
but the exact first changed event was not compared because the earlier raw
report had already been consumed and removed. Do not attribute the difference
to periodic damage or claim unchanged raw replay across source versions.

Remaining scope debt: boss duration multipliers still require millisecond
application in P06c02; cross-wave absolute status timestamps still need rebasing
in P06c03. Full D04/P06 temporal acceptance remains partial. No numeric tuning,
alias/scaling/mitigation or save changes are claimed here. Disposable build and
coverage outputs were removed after use; measurement artifacts are removed
after all review consumers finish.
