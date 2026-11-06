# BUG-777 — Distinguish absent and unplayed checkpoint roles

Status: fixed locally, uncommitted; documentation and validation recorded below.
Severity: Medium — diagnostic coverage can be misread; no gameplay/save defect.
Owner: root, solo, acting as qa-engineer/engine-dev.

## Reproduction

Base HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited dirty
`feat/playable-foundations`, Linux/WSL, 2026-11-05. Node/Vitest pure reporter;
browser/viewport/locale not applicable. Constructed screening seeds 1–4,
no native gameplay or retained save is needed to reproduce.

1. Report a victorious two-wave trash/elite plan with target role boss.
2. Report a second attempt which loses its trash prefix before a planned boss.
3. Include a historical observation without the original plan.

Expected: absent, planned-but-unplayed and unknown-plan cases remain separate;
each started area attempt stays in the area denominator. If a role occurs
multiple times, preserve later unplayed occurrences even after reaching it once.

Actual: the reporter calls all observations without a target wave unreached.
The adapter records total waves but omits the installed plan, so a report cannot
establish whether an unobserved role was ever present. Reconstructing the plan
later would invent historical source/RNG/pity authority.

## Repair and validation contract

Capture a detached copy of the exact native installed plan immediately after
entry, before playback/settlement. Retain all spawn/source/level/tier/affix/loot
metadata. Consume it optionally in the pure reporter, validate length and the
observed prefix's complete presentations, and emit version 2 coverage semantics.
Historical missing plans remain explicitly unknown; never replan them.

Regression cases: `tests/sim/production/checkpoint-population.test.ts`.
Adapter integration: exactly two new constructed manual/idle cases, outside
earned/screening/holdout populations. Existing adapter controls are not rerun.
Prospective budgets, preimages, causal output and cleanup are retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-role-coverage-woptphej`.
Security check: pass; local diagnostics only, no credentials/network/CI or
dependency changes. Plan self-review: ready; no campaign/balance credit.

## Resolution

`runCheckpointAttempt` now captures the exact installed native plan before
playback. Population report v2 separates absent, planned-but-unplayed and
historically unknown roles, validates plan identity and observed presentations,
and preserves later unplayed occurrences after an earlier role was reached.
Six causal reporter failures become green; all 22 reporter cases and two new
constructed native manual/idle cases pass. Scoped TypeScript and lint pass.
See [evidence](../../docs/plans/evidence/p15-checkpoint-role-coverage.md) for
semantics, finite budgets, retained-output readback and exact custody/cleanup.
Self-review only; formal balance acceptance remains 0/210.
