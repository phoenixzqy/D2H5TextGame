# BUG-001 — Preserve current progress across save and import

Severity: Critical (progress loss). Owner: store/frontend developer; QA reviewer.
Status: fixed in `6f1dafd` + `76db166`, independently source-reviewed and verified.
Reproduced before fix at `9e0ef64` on 2026-10-20.

Environment: Node 24.21.0, Vitest 1.6.1/jsdom, Linux; en locale.
Browser/viewport: unit reproducer plus 10 passing desktop/mobile Chromium cases.
Final evidence: `docs/plans/evidence/P03a-save-integrity.md`.
RNG seed: not applicable.

## Reproduction

1. Run `npx vitest run src/stores/save-management.test.tsx --reporter=dot`.
2. Create a live character and change currency before autosave; press Save.
3. Separately import another complete v7 character while autosave is pending.
4. Separately import `{ "version": 7 }`, or load a malformed current save.

Expected: Save captures every current slice, import immediately replaces live state,
old writes cannot overwrite import, invalid data leaves live and stored progress intact.

Actual: first Save reports nothing to save; later Save rewrites stale currency;
import leaves the old live character; malformed v7 import succeeds; malformed
hydration changes player before throwing on missing inventory.

Evidence: initial targeted run: 11 tests, 5 failed and 6 passed. Failures assert
Saved missing, undefined currency instead of 19, Current instead of Imported,
resolved malformed import, and Broken instead of the original player.
The first mock attempt failed on test-double initialization and was corrected
before recording these behavioral results.

Root cause: Settings reads stored snapshots; adapter treats migrations as validation;
persistence has no common ordering boundary and hydrates before validating all slices.
Workaround: none reliable for import; waiting for autosave can avoid stale export.
Regression: `src/stores/save-management.test.tsx` plus engine validation and browser tests.

Independent review also reproduced native IndexedDB Maps bypassing object-schema
entry validation: three new tests (string value, Infinity and numeric key) failed
before correction. Normalize Maps to entry arrays before validating, then restore
only validated legacy affix values and skill synergies.

Browser regression caught the initial fixed-position recovery banner intercepting
desktop Town navigation (9 passed, 1 failed). Reserve layout space for the notice
instead of covering game controls; retain the failed run as development evidence.
