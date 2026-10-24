# D05 — Barbarian endurance passives, BUG166/167

2026-10-24. Implementation `99a3733`, base `f7718ac`; root sole writer in the existing claimed
`feat/playable-foundations` worktree. Local functional delivery;
independent review/QA, earned Barbarian builds and full C3 acceptance remain open.
[Contract](../decisions/D05-barbarian-endurance-v1.md).

## Delivered behavior

The exact three authored passives now compose once from current player
allocations after fresh equipment/quest stats. Increased Stamina adds3% combat
max life per rank; Increased Speed adds1% attack speed and0.5pp physical dodge;
Natural Resistance adds2pp to each of six resistances and0.5pp magical dodge.
JSON values, unlocks12/24/30, caps20 and native prerequisites are unchanged.
Other classes, mercs/summons and combat formulas receive no new shared bonus.

Rank resolution accepts only the exact authored/canonical aliases, takes their
maximum once and ignores malformed allocations. Strict exact-row schema and
copied/frozen definitions prevent contradictory metadata/extra coefficients.
No persisted derived-stat change, cost, combo slot, passive cast or RNG draw.
Ordinary learning preserves the current recording; next waves apply the bonus
without healing. Reset/replay removes it, clamps original pools and grants no
new rewards. Fresh encounter full-pool entry follows the existing policy.

Both locales describe the authored adaptation rather than nonexistent stamina,
movement speed or fixed30% resistance. Production visual inspection found
BUG167: utility rows rounded0.5% to1%. Both shared utility value/delta formatters
now retain the display resolver's fractional precision. Current0.5%, next1%
(+0.5%) are asserted and visually confirmed. Integer utility rows stay stable.

## Verification

- Corrected causal factory/battle reproducer:9RED/6controls before implementation.
  Includes rank1/20, actual action cadence, cold mitigation and magical dodge.
- Strict schema REDs cover exact metadata and malformed/extra coefficients.
  Initial UI fixture labels/next-rank delta expectations were incorrect; their
  failures are retained and are not credited as causal description proof.
- BUG167 adds4causal bilingual RED cases/2controls before the formatter fix.
- Final focused:100PASS/6files,11.96s. Includes all56new tests plus44existing
  Skills cases; native allocate, resource carry, reset/replay, cap/prerequisite
  refusals and actual serialization/import all use production code.
- Engine:5823PASS/180files,131.05s. Final formatting correction changes UI only.
- Full final suite:11778PASS/460files, two existing skips,599.47s, exit0.
- Final typecheck/lint and explicit `VITE_E2E=false` production build PASS.
  All4emitted asset JS chunks are bridge-free. Existing chunk/PWA-manifest
  warnings and repository timing-budget breaches remain unresolved.
- Final production Chromium:4/4 en/zh-CN×1280×800/360×640, zero retries,
  skips or flaky results;72.62s total. Ordinary Settings imports explicitly
  constructed L30 eligibility, followed by three real allocations. Both
  fractional rows,44px allocation controls, no horizontal overflow, passive
  combo exclusion and four exact Save→close→Continue pairs pass. Player,
  inventory,map,mercs,formation match; zero captured page/console errors.
  This is functional eligibility, not earned progression, balance or full a11y.

The first production pass caught BUG167 by screenshot inspection after its
coarser assertions passed. Both original and corrected evidence are retained.
The earlier full unit run was gracefully interrupted via SIGINT to its exact
task-owned Vitest PID, verified by CWD and stdout path, before correcting
runtime. It receives no full-pass credit. Initial six lint errors are corrected.

## Evidence and continuity

[Fixture directory](fixtures/barbarian-endurance/) retains source/build hashes,
exact browser save pairs, summaries, causal/final logs and before/after images.
The14named source inputs and all4built JS hashes matched before cleanup.
Both disposable builds are removed, preview4451closed, cleanup failures[].
Raw logs/reports remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-barbarian-passives-b9aMY6`;
root owns retention through full-v1 consumers and removes them afterward.

The genuine claimed Rite save is unchanged: L33/XP149261/23682gear/nextNormal402,
rawSHA `c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine reset/allocation/EveStart/402 attempt. The preceding ranked-Ice
diagnostic finished25/32+15/16, unqualified; its failed report is retained
separately and further same-purpose build screening stopped.

Self-review covers fresh-stat ordering, units/eligibility, immutable recording,
resource clamps, consumer outcomes and truthful UI. Independent sign-offs remain
missing, so this group is locally verified rather than fully accepted. C2–C4,
all213skills/two-build matrix, economy/pacing/endgame and fullG0–G7 remain open.
Next bounded candidate is Sword/Axe/Mace Mastery, with explicit canonical
weapon eligibility before composition. Read-only follow-up found those types
have authored bases; Spear Mastery currently has zero `weaponType: spear`
bases (War Pike is authored as polearm), so its availability needs separate
reconciliation before acceptance. Do not resume speculative Baal screens or
promote diagnostic saves. No push, PR, merge or deployment.
