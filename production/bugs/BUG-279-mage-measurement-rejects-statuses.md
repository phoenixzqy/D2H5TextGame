# BUG-279 — Measure Mage signatures without discarding periodic damage

- Severity: Medium — historical simulation consumers reject valid new combat.
- Status: All identified consumers repaired; fresh full validation pending.
- Owner: root, QA/measurement; no delegation or independent acceptance.
- Baseline: `ccbf186c` plus uncommitted bilingual presentation. Linux, Vitest
  Node simulation project; no browser/locale/viewport dependency.

## Reproduction

1. Run the six `tests/sim/production/mage-{balance,mastery,rank,mixed,combo,mitigation}.test.ts`
   files through `vitest run --project sim-contracts`.
2. Their real seeded Mage recordings now contain on-hit statuses and periodic
   loss. The shared `measureMageBattle` throws on every `dot` event.
3. Mixed/condition strata also assume no enemy status changes during combat.

Expected: exact resource reconciliation with direct attribution kept distinct
from source-less periodic loss, actual status observations used for combo
exposure, and continued rejection of malformed/forged streams.
Actual:48 failed/64 passed across six files; terminal exit1,15.589s.
Evidence:`measurement-red.log/json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-signatures-kwew5kh6`.
The broad known-failing run was explicitly stopped at its verified task-owned
Vitest PID797160, terminal exit143; it is not counted as a full pass.

## Cause and correction

The old meters deliberately accepted direct-only Mage behavior. Preserve their
literal direct counters and scenario identities while adding periodic HP replay
and separate unattributed totals, rather than attributing aggregated DoT to a
particular Mage. Consume native status-state changes for exposure instead of
rejecting legitimate enemy controls. Keep timing, copies, final HP/MP, parity,
negative validation and sparse per-unit/per-species rows authoritative. Extend
meter tests with literal periodic/capped/heal/unknown-target/malformed cases.

Workaround: focused engine/native/mounted checks verify mechanics, but cannot
replace the repaired balance consumer or full unit acceptance.
Security check: pass for local first-party simulation/test changes; no save,
credential, network, dependency, permission or production runtime change.

## Local repair progress

`353f57a2` separates source-less periodic loss from direct attributed damage;
balance/rank/mastery checks pass63/63, with focused strict types passing.
`e6c79ed2` replays periodic HP loss in mitigation/mixed strata and actual status
observations in mixed controls. Its32/32 checks and focused strict types pass.
The independent mixed damage assertion now accounts for observed combo windows:
Chill enables the existing1.3 Lightning multiplier, rather than changing MR.

Explicit lint of the latter four paths still reports four existing errors and
nine warnings in historical mitigation code; these are outside the changed
lines. No lint pass or complete unit pass is claimed. The combo consumer still
rejects legitimate enemy status refreshes and needs the same measurement repair.
The earlier broad run remains interrupted, not passing. Receipts and the new
`strata-tsconfig.json` remain in the task directory above for the continuing
Mage/full-v1 work; root owns their eventual archive and cleanup. Skill inventory
credit remains unchanged173 bounded/38 unverified/one engine-only/one review.

`99654938` repairs observed combo windows. The first terminal full run then
finds nine failures in three further consumers: asymmetry strata and two native
store/playback tests. Its actual result is18452passed/9failed/two existing skips,
852files,exit1,977.071s; this is not a full pass. `71081cc7` repairs their periodic
HP accounting, status-dependent seeded traces and dead-card status projection.
The mixed paid/unpaid replay remains exact; final MP is182/117 and paid battle
ends5147ms under the current real recording. No resource/replay assertion is
removed. Four changed consumer inputs are enumerated against1660unchanged inputs.

All326tests/18Mage-related files now pass,27.621s; latest four-path strict types
and explicit playback lint pass. The fresh `full-retry-after-consumers` run is
active; poll its existing tool session29503 and terminal receipt before any
restart, inventory credit or task cleanup. Evidence remains in the same task
directory; root owns retention/cleanup after all consumers finish.
