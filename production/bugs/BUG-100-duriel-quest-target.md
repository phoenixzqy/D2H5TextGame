# BUG-100 — Credit the actual Duriel encounter

- Severity: High — Seven Tombs' kill objective cannot match its actual encounter.
- Status: Fixed in `5d5f0d0`; full H3 validation records belong to
  `docs/plans/evidence/duriel-quest-cache.md`.
- Environment: Vitest source/data reproduction, locale-independent; no browser
  or combat seed needed for the static identifier mismatch.
- Owners: content-designer / engine-dev; D11 H3, producer-reviewed contract.

## Reproduction

1. Load Seven Tombs from `src/data/quests/main.json` at `31eccc7`.
2. Compare `obj-kill-duriel` with the actual Tomb of Tal Rasha area and boss in
   `src/data/maps/sub-areas/act2.json`.
3. Observe target `monsters/duriel` and area `areas/act2_duriels_lair` in the
   quest, versus `monsters/act2.duriel` and `areas/act2-tomb-of-tal-rasha` in
   the runtime encounter.

Expected: an opened, active quest receives a new qualified actual Duriel kill.
Actual: the authored kill objective references identifiers the encounter never
emits. No earned victory is claimed by this reduced data reproduction.

Evidence: task-owned `d2h5-duriel-v44tgpgo/duriel-data-ui-red.txt` under the
configured zai-temp directory records the failing canonical target/area tests.
Regression: `src/data/__tests__/duriel-contract.test.ts`; qualified runtime
settlement controls are also required before H3 acceptance.

Root cause: stale quest target/area identifiers. Preserve ordered opening,
qualified recorded-wave settlement and no-backfill semantics; do not weaken
the matcher or award a kill from encounter entry.
