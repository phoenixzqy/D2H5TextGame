# BUG-014 — Apply boss status duration multipliers in milliseconds

Severity: High (control timing and combat outcomes). Owner: engine/technical.
Card: P06c02. Status: fixed and independently source/contract reviewed, 2026-10-20.
Prepatch HEAD: `6c7f04944aae5e172211ba73c9e9774223db89d2`.
Environment: Node 24.21.0 / Vitest 1.6.1, Node engine project, seed 7;
no browser, viewport or locale involvement.

## Prepatch reproduction

Run `npm run test:engine -- src/engine/combat/boss-duration.test.ts --no-cache --reporter=dot`.
The initial 56 behavior cases produce **29 failed / 27 passed** (1.05 seconds).
This report and D04 v1c were written before the runtime source patch.

Observed exact failures at application clock 1700ms:

- Default freeze/stun on both boss tiers expires at 2700 instead of 2200ms.
- Three seconds expires at 2700 instead of 3200ms; 2.5 seconds at 2700
  instead of 2950ms, because the legacy duration floors whole turns first.
- Explicit 1501ms expires at 3201 instead of 2450ms; explicit 1501.5ms at
  3201.5 instead of 2450ms. The multiplier is bypassed entirely.
- Positive sub-millisecond seconds produce 1000ms instead of 1ms; explicit
  0.5ms produces 0.5 instead of the required positive minimum of 1ms.
- Zero/negative seconds incorrectly acquire the legacy minimum 1000ms.
- Configured ×0.25, finite refresh and inactive replacement cases also fail.
- Through both real damage-on-hit and debuff application paths, default
  freeze/stun applied at 1500ms still suppresses the boss's 2000ms action;
  that action is exactly the corrected expiry and must be eligible.

The eight inside-interval combat cases pass before the fix: applying at 1300ms
suppresses the 1700ms action under either the old or corrected duration. Together
with the eight failing exact-expiry cases they distinguish active control from
expiry without merely proving that control exists.

Root cause: `applyStatus` computes the legacy whole-turn `dur` before deriving
timed expiry. Its minimum-one turn stretches default half-second control to a
second and truncates longer fractional durations. Explicit `durationMs` skips
that calculation and therefore skips boss scaling too.

## Approved correction boundary

D04 v1c controls a separate timed duration derived from unrounded milliseconds,
explicit-ms precedence and one configured boss multiplier. Only strictly positive
scaled results get floor/minimum 1ms. Preserve nonpositive expiry, ordinary
fractional durations, current defaults, legacy `remaining` and untimed lifecycle,
P06c01 active maximum-expiry refresh and indefinite records. Inactive same-ID
records become fresh. No new malformed-input validation or scheduler/content,
alias, RNG, save, mitigation or scaling changes; P06c03 cross-wave clocks remain
separate. The implementation owns only status.ts, boss-duration.test.ts, D04
and this report.

Security check: pass; pure transient arithmetic with synthetic fixtures, no new
IO, credentials, permissions, persistence or agent-policy changes.

## Validation and review

All 56 focused regressions pass (1.01 seconds). Full engine suite: 40 files /
438 passed (3.44 seconds, above the 3-second budget). Full unit/contract suite:
99 files / 1039 passed / 1 existing skip (23.63 seconds, above the 15-second
budget). Typecheck, full lint/engine purity and `git diff --check` pass. Production
build passes with existing Browserslist age, large-chunk and PWA manifest-precache
advisories. No browser run is needed for this pure engine change.

Tests cover both boss tiers/default control IDs, every ordinary tier, fractional
seconds and explicit milliseconds, precedence, positive minimum, zero/negative
duration and multipliers, unrelated statuses, a custom configured multiplier,
legacy untimed lifecycle, active finite maximum/indefinite refresh and inactive
replacement. Sixteen real combat cases cover damage-on-hit and debuff effects,
inside and exact-expiry actions, repeated/normal recorded agreement and immutable
inputs. A helper test verifies no additional RNG draw. Synthetic skill registry
entries are reset after each case.

Root independent exact-four-file source/test/contract review: APPROVE, no findings.
Producer independent exact-four-file review: APPROVE; its nonblocking request to
describe preserved capped stacking behavior precisely was incorporated in D04.
No runtime or test changes followed those reviews. No scope expansion occurred.

Disposable task-owned `dist` build output was removed and absence verified;
coverage output and the local Vite cache were absent. The claimed worktree and
pre-existing dependencies remain. Cross-wave timestamp rebasing, seeded ties and
broader D04 dependencies remain open; no campaign balance acceptance is claimed.
