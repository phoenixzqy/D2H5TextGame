# BUG-614 — Reconcile progression XP references with the retained engine formula

Status: fixed locally in the retained worktree (uncommitted). Severity: Medium.
Found:2026-11-03. Owner:root (progression documentation/game design/QA).
Build:feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus accumulated changes. Environment:WSL/Linux, installed Node/TypeScript;
browser/viewport/locale/seed do not apply to deterministic formula arithmetic.

## Reproduction

1. Read `docs/design/progression-curve.md` §§2,8,11 and D02 in
   `docs/plans/design-decisions.md`.
2. Execute retained `d02-native-xp-reference-v1.mjs`. It imports the installed
   TypeScript-transpiled native `src/engine/progression/xp.ts` without a build,
   game-state mutation or combat, and independently computes each cost with
   integer square root of `10000 * L^5` and cumulative integer addition.
3. Compare all90 exact levels, inverse threshold boundaries and the specification.
4. Inspect the winning-wave XP settlement in `src/stores/combatHelpers.ts`.

Expected: exact formula/table agreement; current reward behavior distinguished
from unselected proposals; owner30–50 active-hour first clear controls pacing.
Actual: the document labels an incorrect table locked. It claims L40 costs
7.569M cumulative XP versus native11064193; L70≈83M versus79955041;
L90≈206M versus193772764. Its16h first-clear commitment is superseded.
It also describes tier/difficulty/overlevel reward multipliers that the actual
winning-wave path does not apply. Handoff asserts an incorrect L70 reference.

## Evidence and cause

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`d02-native-xp-reference-v1.mjs/.json` and
`d02-native-xp-reference-table-v1.md` reproduce the discrepancy in under1s;
all90 native costs/totals and inverse boundaries match independent arithmetic.
The JSON fingerprints native XP and settlement source. No combat replay,
admissions, installs, caches or game-state mutations.

Root cause: approximate/stale reference and earlier reward/pacing proposals
were presented as one locked implemented contract. D02 already requires exact
regeneration before selecting chapter levels and reward rates together.
Affected systems:progression specification and future balance decisions;
no native XP arithmetic defect is established. Workaround:use the native formula.

## Correction boundary

Correct the exact table and reference checks, label production reward behavior,
and replace superseded campaign time promises with the controlling checkpoints.
Keep the formula and all runtime rewards unchanged. Chapter levels, late-game
timing and whole-campaign reward tuning remain open under D02; a corrected
reference cannot establish earned reachability or accepted balance.

Plan review:ready for reference correction; includes L90 cap semantics and
separates illustrative income requirements from selected/observed rates.
Security check:pass; local source arithmetic and documentation only, no network,
credentials, installs, CI, permissions, publication or external save operations.

## Verified correction, 2026-11-03

The specification now publishes all 90 exact rows, the current reward path and
the controlling 30–50 active-hour campaign targets. It distinguishes unapplied
reward proposals and unresolved chapter/maturity levels. Stale handoff assertions
now use native API names and exact L70/L90 totals, including cap boundaries.

`d02-reference-document-check-v1.json` verifies every published row against the
native/independent reference, local report links, exact handoff values and
unchanged XP/settlement source hashes. The scoped documentation whitespace check
passes. No production code, runtime rewards, game saves or earned outcomes change;
no combat replay or broad test rerun. The reproduction scripts and failed first
rate-reader receipt remain in the evidence packet. D02 reward/level/pacing
selection and BUG613 remain open; this closes the reference defect only.
