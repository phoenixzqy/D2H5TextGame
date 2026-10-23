# BUG-107 — Restore precise integration fixtures after native17

- Status: Fixed; full integrated unit suite passes at `69828f6`.
- Severity: Medium (validation failures; no player-facing failure inferred).
- Owner: producer / QA; root integrates.
- Build: `0d6d7b2`; Node/Vitest in the claimed Linux worktree. Browser,
  viewport and locale are not applicable to the unit runner; bilingual RTL
  cases include en and zh-CN. No new combat seed is introduced by this repair.

## Reproduction

1. Run the full non-watch unit suite at the above head.
2. Inspect the failed native inventory/save and historical migration fixtures.
3. Observe missing explicit socket capacity, a current snapshot retagged as a
   historical version while retaining reserved17 fields, and reused active item
   IDs in the current save-management fixture.

Expected: native fixtures satisfy current shape and unique ownership; predecessor
fixtures contain only their historical fields. Negative tests reach their
intended corruption boundary. Catalog/NPC expectations include authored Act V.

Actual: the full run reports 60 failures / 9974 passes. Some failures have separate
runtime causes covered by BUG-105/106. A source identity refusal and the new
persistent challenge ordinal also need diagnosis before changing assertions.

Evidence: root-owned `/tmp/d2h5-a5-integration-650ka_is/full-unit.json` and
`full-unit.log`. Preserve these diagnostics through integration. The report
records failures before repairs; it is not a claim of current-head acceptance.

Repair constraint: use historical-field removal only at genuine predecessor
construction boundaries, add explicit native capacity, and preserve validator,
provenance, ownership, transaction and negative-case assertions. Never relax the
production validator to accommodate a stale fixture.

## Integrated result

`ffb82ac` restores genuine historical shapes, explicit native capacity and
unique current ownership. `69828f6` repairs the remaining twelve store
fixtures, including persisted challenge ordinals and literal source identity.
The separate runtime causes remain attributed to BUG-105/106; no production
validator or negative assertion was weakened for this repair.

At `69828f682684ce5fd737bdff801619a57bdadb29`, the full non-watch unit run
passes **10068 tests / 351 files**, zero failures, in 230.30s. Engine tests
within that baseline pass 4692 tests / 129 files. Full typecheck, lint/engine
purity and production build pass. This closes the integration-fixture failure;
it does not establish earned campaign, browser or pacing acceptance. The test
runtime still exceeds the documented suite-time budget.

Final unit report: `/tmp/d2h5-a5-integration-650ka_is/full-unit-integrated.json`,
SHA256 `ec4f4ea3076d5bb77d4153f97181788cde46445c89d99e9a5626405ec7153fee`;
the sibling `.log` records file count and timing. Root retains the original
failed and final reports through Act V integration review and owns their
eventual removal after compact diagnostic evidence is preserved.
