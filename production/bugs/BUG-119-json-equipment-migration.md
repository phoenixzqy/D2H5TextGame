# BUG-119 — Restore validated JSON affix Maps for migration stat composition

Status: Fixed in 6bbf505; native v19 rollout remains unregistered.
Severity: High.
Owner: engine-dev.

## Reproduction

Baseline: c031320 plus uncommitted native v19 boundary, 2026-10-23.
Environment: pure Vitest engine; locale, viewport and RNG not applicable.

1. Build valid18 with an equipped item carrying a legacy affix values Map.
2. Pass it through validateFrozenV18Save (or import its JSON entry-array form).
3. Invoke migrateSaveV19 with the validated predecessor.

Expected: migration computes surviving equipment modifiers from the same affix
entries while preserving exact source payload and the source object.

Actual: aggregateCanonicalEquipmentMods iterates Array.entries instead of
Map.entries and throws path.split is not a function. Native Map-only migration
tests miss this normal serialized import path.

Evidence: unknown-slot and empty-slot migration cases in
src/engine/save/native-v19.test.ts and native-review-corrected-red.log under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-v19-materials-rh7euwd2.

Root cause: stat composition assumes restored Maps although structural save
validation deliberately normalizes them to JSON entry arrays. Restore only the
composition view using the existing restoration helper; preserve exact payload.

Workaround: no runtime activation until validated JSON conversion succeeds.

## Fix and validation

Local commit `6bbf505` corrects the reproduced boundary/migration paths.
Regression tests: `src/engine/save/native-v19.test.ts` and
`src/engine/save/migrate-v19.test.ts`. Latest focused run passes183 tests/3files;
full unit10764/383PASS with2 existing opt-in skips, source freeze unchanged.
Engine5236/145, typecheck, full lint and production build pass. This is source
validation only; no native-v19 runtime or browser acceptance is claimed.
