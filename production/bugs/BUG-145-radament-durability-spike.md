# BUG-145 — Calibrate early Act II Radament durability

Severity: Medium (progression/balance; other ActII areas remain accessible).
Status: locally calibrated; independent design/source/QA acceptance pending.
Owners: game/level design, content, QA; root sole writer this session.

## Reproduction

Runtime3a6e050, production Chromium en360×640 actual attempt255 evidence at
`docs/plans/evidence/d11-owned-radament-adaptation.md`. Restore its exact earned
L24 final, next256, raw SHA256
`5105a89cc1584baa2a4aea3140147965d1c54bb2570c16e29d70512df7a32573`.
For deterministic diagnosis use native FarOasis/manual seed1, ordinal256 and
the unchanged earned equipment/points/priority. Native entry and settlement
win four waves, then draw against Radament at60000ms. Do not promote this
projection to the campaign or replay genuine255.

Expected: a calibrated early mini-boss under the existing deadline with a
reasonable margin for legal offensive adaptation; candidate's explicit local
targets and limits are in the decision below. No historical approved win rate
or on-level balance is inferred.

Actual: old source yields7626–9486HP at the native level22. The new fixed
64-native sample wins17/32 screen and17/32 holdout, all30failures boss draws,
zero deaths. The1000isolated optimistic full-pool sample wins515/1000;
victory p50/p9555.692/57.460s. Both new regression tests fail against old data.

Cause: archetype base/growth has not been calibrated for this named encounter
and60-second limit; growth plus the expected3× boss factor creates the life
spike. No formula defect claimed. StrongMelee's priority is a separate question.

Evidence: task-owned diagnostics
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-calibration-79tbdt04/`
(`before-native.json`, `before-isolated.json`, `red.log`, `calibrate.mjs`).
Contract: `docs/plans/decisions/D11-radament-durability-v1.md`.
Regression: `src/engine/combat/radament.test.ts`.

Workaround: no guaranteed legal boss clear established; legal gear/priority
adaptation helped but did not remove real255's draw. Other ActII areas are
accessible. Full campaign/balance and independent acceptance remain open.

## Local correction

Only the two authored life ranges change. Paired native full-area wins34/64→63/64,
isolated boss515/1000→991/1000; no deaths. Retain the remaining holdout55draw.
Regression2/2, engine5483/164, full11283/425+2existing skips, typecheck/lint/build
pass. Initial lint found a redundant test guard after a type assertion; checking
the optional lookup before its assertion corrects that setup without weakening
behavioral checks. Original failure logs remain. Production continuation is
separate; simulations do not establish an earned clear or full balance.
