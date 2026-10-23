# BUG-107 — Restore precise integration fixtures after native17

- Status: Reproduced; repairs in progress.
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
