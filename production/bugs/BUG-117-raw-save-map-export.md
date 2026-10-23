# BUG-117 — Raw disk export drops legacy affix Maps

Status: Fixed; raw v17/v18 exports and validated reimport preserve affix Maps.
Severity: High (saved item payload loss on backup/reimport).
Owner: engine-dev.

## Reproduction

Environment: native v18 store snapshot, Dexie-compatible memory adapter, Vitest.
Baseline: `40c5ee3` with material/socket prerequisites, 2026-10-23.

Save an identified item containing a legacy affix values Map, then call the
low-level `save-adapter.exportSave`. Its plain JSON.stringify converts the Map
to `{}`. Reimporting this backup loses the actual affix modifiers. The live
`exportCurrentSave` already uses Map-aware encoding, so these two export paths
disagree. The approved caster recipe also requires a fixed legacy affix Map.

Expected: both export paths preserve every Map entry as JSON entry arrays;
raw disk export preserves the stored version and does not migrate it.

Root cause: the disk export bypasses the shared engine JSON-safe serializer.
Regression: `persistence.materials.test.ts`, raw current and historical Map
exports, native readback and exact source/disk conservation.

Validation: the regression first failed both historical/current export cases;
the persistence material suite now passes8/8. The shared Map-aware serializer
encodes raw stored data without migrating or mutating it. Independent QA
approves the export correction.
