# BUG-336 — Return to Cain after exporting browser evidence

- **Severity:** Low (browser harness)
- **Status:** Fixed locally; final combined full suite passed.
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus combined Cain/Identify source.
- **Environment:** Playwright Chromium, en, 360×640; no RNG or genuine campaign.
- **Affected systems:** QA / Identify browser evidence.

## Reproduction

1. Run the constructed fresh-save Recover → Give → Rescue → Claim → selected-item Identify browser path.
2. Save, close the page, open a new page and Continue; compare the exact retained payload.
3. Reopen Cain, export the save through Settings, then assert the town Identify panel is visible without navigating back.

## Expected

Export comparisons stay exact. Reopen Town and select Cain before checking the town panel and its disabled repeated-use state.

## Actual

The final panel assertion times out while the browser is on Settings. Identification and its persistence checks already succeeded. The failure body explicitly shows Settings/Save Management.

## Evidence

Cain task root `d2h5-cain-1sjuc_zy/combined-browser.log` and original receipt; Identify task root `d2h5-cain-identify-9029ruba/browser-combined/en-360-failure.txt`, failure screenshot, identified/stored/continued saves. Both roots are under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/`.

## Correction

Add ordinary Town navigation and Cain selection after the final export in a new retained browser runner. Preserve all original comparisons and the failed runner/output. No production changes or assertion/timeout weakening.

## Local correction and current validation

The separate final runner performs ordinary Town navigation and Cain selection after export. All8 final browser cases pass; independent review confirms exact item-only deltas and16 Continue comparisons. Original failed runner/output remain retained.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
