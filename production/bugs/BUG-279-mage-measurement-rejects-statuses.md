# BUG-279 — Measure Mage signatures without discarding periodic damage

- Severity: Medium — historical simulation consumers reject valid new combat.
- Status: Reproduced; repair pending.
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
