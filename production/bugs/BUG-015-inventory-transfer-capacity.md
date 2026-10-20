# BUG-015 — Manual transfers ignore the displayed capacity and lose selection

Severity: Major (inconsistent capacity contract and missing refusal feedback).
Status: fixed scoped P03b03 guarded transfers,2026-10-20.
Base:`0a84010`; owner store/frontend/QA. Node24.21.0/Vitest1.6.1/Playwright1.59.1.

## Reproduction

1. Import or retain a backpack with100 items and stash with500. Displayed limits
   agree with accepted ADR-002, but store transfers still use500/2000.
2. Transfer a selected stash item into backpack100, or backpack item into
   stash500. Current store accepts it despite the displayed full destination.
3. At the old hard limit, transfer silently refuses, returns void and closes
   the selected detail panel anyway. No actionable message appears.
4. Run `npx vitest run --project ui src/stores/inventory-capacity.test.tsx --reporter=dot`.

Expected: normal player transfers respect shared100/500 capacities. Full-target
or missing-source refusal returns its reason without publishing/mutating state,
preserves selection, and explains how to retry. An overflow source can transfer
out when its destination has room. Earned/returned ingress remains lossless.

Actual: all12 new cases fail before production source changes,4.46s. Eight
store boundary/missing-source cases return undefined; four rendered bilingual
cases receive an empty toast. Existing code confirms higher store limits and
unconditional selection clearing. No item truncation is an acceptable fix.

## Controlling plan and scope

Producer independent plan READY; six-file exception covers store, screen,
combined tests, existing browser regression, this required bug and D09 control.
Separate reviewed prep owns shared constants and bilingual keys. This child
only guards transfers; equipment net displacement/merc/crafting transaction
guards and full P03b remain open. `addItem` stays unbounded and saved arrays
retain every legacy overflow item. No migration or duplicate-award policy.

Browser proof must begin at legacy101/501, refuse both directions unchanged,
explicitly discard only S500/S499/B99, then make the planned successful moves;
all other IDs/contents, equipment, currencies and player survive export/reload.
Security check PASS: local authoritative state guards, no new external IO,
permissions, save schema or credential handling. No public deployment.

## Validation and review

Producer independent exact six-file source/test review APPROVE. Twelve focused
cases pass4.24s after the patch. Full101files/1019passed/1 existing merc-XP skip,
31.45s (>15s budget). Typecheck and lint pass; explicit forced lint includes the
normally ignored browser spec. Production build passes5.65s with existing chunk and
manifest precache warnings, not PWA/performance acceptance.

Before source changes the new desktop English browser assertion also failed:
full stash transfer produced no message within5s. Final browser matrix4/4pass,
42.2s, en/zh-CN×1280×800/360×640. Forced lint then exposed existing download-stream
typing; the helper now uses the same typed file-read approach as the town spec.
Forced lint passes and the complete browser matrix passes again4/4,26.1s.
The final test refuses both directions with
selection retained, proves exact exported state unchanged, then explicitly
discards only S500/S499/B99 and successfully transfers B100 out and back. Final
full inventory/player/map equality survives ordinary Save/reload/export.

Command: `E2E_PORT=4298 npx playwright test tests/e2e/inventory-overflow-recovery.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p03b03-browser`.
Final helper rerun uses port4299/output`/tmp/d2h5-p03b03-browser-final` with the
same spec/projects/workers/reporter.
Source removes one matching source index instead of filtering all matching IDs;
the complete moved item object retains its Maps/flags. No ingress/equipment
change belongs to this slice. Full D09/P03b acceptance remains open.
