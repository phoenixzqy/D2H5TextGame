# D07 v1a — Explicit production run replay inputs

Status: accepted scoped contract, 2026-10-20; P02a02 only. Full D07/P02 remains open.
Owners: producer, game/technical design reviewer and store integrator.
Sources: D07 authoritative production combat/reward intent; P02 production-path
measurement requirement; existing `startSubAreaRun` and challenge-wave resolver.

## Contract

`startSubAreaRun` accepts independent optional readonly numeric inputs:

- `runSeed`: integer in [0, 4294967295]. Zero is valid.
- `challengeOrdinal`: integer in [0, 360360), matching the existing counter period.

Validate both provided inputs before any store, active-run or counter mutation.
Reject negative, fractional, nonfinite and out-of-range values with `RangeError`;
do not clamp, truncate, wrap, fall back or start a replacement run. Valid calls
without a player keep returning `null` without consuming the default ordinal.

An omitted seed retains exactly the historical
`hashSeed(resolvedAreaId + '|' + Date.now())` behavior, including the existing
synthetic area ID when no canonical area resolves. An omitted ordinal consumes
the existing counter once and increments it modulo 360360. An explicit ordinal
does not advance that counter. Seed-only and ordinal-only requests independently
retain the other input's normal default behavior.

Successful handles retain `runId` / `totalWaves` and also return the resolved
`runSeed` / `challengeOrdinal`. The supplied seed enters the existing wave-plan
resolver unchanged. Wave/combat seed derivation remains
`(runSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0`; reward derivation remains
`runSeed ^ 0x9e3779b1 ^ waveIndex`. No engine, reward, encounter, save, or UI
behavior is redefined by this boundary.

## Rationale and limits

The production entry point previously always derived a seed from the wall clock
and consumed a hidden counter. Exposing the two existing inputs at their origin
permits controlled production evaluation without resetting private module state,
changing ordinary callers or substituting a second combat engine. Returning
resolved values also makes default runs observable without a global reset API.

Replay requires the same starting player, formation, fielded merc, area/mode,
idle pity and production data, not just these two numbers. Character creation
still uses the clock for identity; pin creation time or retain unchanged starting
state. The fresh recipe schema remains ordinal zero even though this API accepts
the full production ordinal range.

This child proves only real first-wave recording/state repeatability. It does
not run to campaign completion, grant or certify rewards, accept all of P02,
resolve item allocator/raw reward identity, compare manual and idle paths, fix
the presumed-kill idle ticker discrepancy, or fix draw/advance/reward handling.
No private/global counter resets, ID stripping, boosted fixtures or proxy battles
may be used as replay evidence. Those limitations remain explicit downstream.

## Verification

New `src/stores/combatHelpers.replay.test.ts` uses production fresh sorceress
creation and canonical Blood Moor. With unchanged starting state, explicit seed
and ordinal reproduce complete initial teams, recorded events/timestamps and
outcome after the wall clock changes. The tests also cover zero/max seeds,
ordinal endpoints, default seed hash, ordinary → explicit → ordinary counter
continuity, partial options and no-player calls. Fourteen invalid-input cases
prove unchanged store references, retained active-run recording and an unconsumed
default ordinal. Cleanup uses public abort/store APIs and restores the clock;
no hidden counter or allocator resets are introduced.

Tests were added before implementation: all 20 failed at `2cd350b` because the
metadata/replay inputs were absent and invalid values were ignored. After the
boundary change, focused UI tests passed (46 passed / 1 existing skipped) and
all 35 simulation contract tests passed. Final `npm test -- --reporter=dot`
passed 89 files / 867 tests with one existing skip in 30.89 s (over the 15 s unit
budget). Typecheck, lint including engine purity, `git diff --check` and the
production build passed; build completed in 14.67 s. Existing React act/router,
Browserslist age, large-chunk and art-manifest precache warnings remain. No
standalone engine rerun was needed because no engine source changed. Final
commit evidence is reported to the integrating producer; this record makes no
broader acceptance.

Independent parent source review: APPROVE for this scoped replay-input boundary;
no blocker in validation ordering, zero/default/partial inputs or counter
preservation. Full-run and reward acceptance remains open.

Security check: pass; bounded in-memory inputs only. No dependency, network,
filesystem, credential, permission, save-schema or validation-policy changes.
