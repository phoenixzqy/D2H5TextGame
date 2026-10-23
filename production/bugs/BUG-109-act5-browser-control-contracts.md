# BUG-109 — Match Act V browser assertions to actual control contracts

- Status: Corrected; full bounded bilingual mobile scenario passes.
- Severity: Low (incorrect browser assertions; no product defect established).
- Owner: root / QA.
- Runtime: `69828f682684ce5fd737bdff801619a57bdadb29`; test head `15cf9cd`.
- Environment: production Chromium, 360×640, en and zh-CN, zero retries.
- Input: constructed-power Act IV export, SHA256
  `08d2531df6df82f1c305b02136515b5bd8e97d368af14f9cd6e8b962f076eb79`.

## Reproduction

1. Run the extended `tests/pwa/act5-delivery.spec.ts` in both locales.
2. Complete actual Siege/Rescue, inspect Anya, receive the bound potion,
   win the Passage before thaw, then thaw Anya and Save→close→Continue.
3. Open Quests before a new post-thaw Nihlathak victory.
4. Observe the assertion expecting a disabled Prison Claim control.

Expected: Prison remains in progress with no eligible Claim and no backfilled
kill proof. The actual quest UI renders View Progress for unfinished quests;
Claim exists only for completed quests.

Actual: both cases fail at spec line228 because the Claim locator is absent.
The preceding exact continued-state assertions pass. The test assumes the
wrong rendering contract; `QuestsScreen.tsx` conditionally renders Claim only
when status is `completed`.

## Additional source-confirmed test issue

The later repeat-Read assertion calls Playwright `.click()` after asserting
`aria-disabled=true`. Playwright waits for enabled actionability and cannot
exercise that retained feedback handler through this call. The product's
consumed Read control is keyboard-focusable and intentionally reports repeat
consumption without changing state. Exercise focus→Enter, retaining the exact
unchanged-state assertion. Do not remove ARIA or change product behavior.
This issue was found by independent QA; the failed run did not reach it.

## Reproduced mobile sheet navigation issue

The first corrected run reaches actual Prison Claim, exact resistance Read,
repeat Read, actual socket service and its visible detail screenshot in both
locales. It then tries Settings navigation with the mobile item-details sheet
still open. The fixed sheet intentionally covers navigation; repeated click
actionability logs identify `inv-discard-action` intercepting the pointer.
`InventoryScreen.tsx` documents this bottom-sheet contract and
`ItemDetailPanel.tsx` provides `inv-detail-close`.

Root sent SIGINT only to its verified runner PID2400911 after inspecting both
live traces. Handle69869 terminated130 and the frozen corrected report records
two interrupted cases, not passes. The report and source remain under
`browser-prison-corrected/` and `browser-prison-corrected-inputs/` within the
same task root. Before Save/Continue, use the ordinary detail Close control and
assert the detail panel is gone. Do not force navigation through the overlay.

## Evidence and correction boundary

The frozen failed spec/config, two-locale report, screenshots and traces remain
under `/tmp/d2h5-a5-integration-650ka_is/browser-prison-inputs/` and
`/tmp/d2h5-a5-integration-650ka_is/browser-prison/`, with the sibling
`browser-prison.log`. Report SHA256:
`87c26a708d3f689388e6b1633471736c29a7777d68815ab9b6711b1ecbfdb87a`.
The report records two failures, no skips/retries/flaky cases and global
errors `[]`; it establishes no complete Prison/service acceptance.

Correct only these test assumptions: assert retained `inProgress` and false
kill objective, visible View Progress, absent Claim; activate consumed Read
with keyboard and compare all persisted domains unchanged. Preserve the
original report. Rerun the full bounded bilingual mobile scenario separately.
No runtime, game data, quest receipt, preparation power or balance change.
Root owns these diagnostic artifacts until the Act V/umbrella consumers finish.

## Verification

The separately rebuilt production run `browser-prison-close/report.json`
passes both locales at360×640, retry/skipped/unexpected/flaky0, global errors[];
SHA256 `79ae7a6b69b3d748405b2c7560fc0c5c40c93af28554b63e9f7bd7e86a60a50e`.
It reaches both consumed-service Save/Continue barriers. Independent QA
recomputed their exact state/provenance and returns ADEQUATE. The ordinary
Close action additionally exposed and now verifies the product correction
recorded separately in [BUG-110](BUG-110-inventory-detail-close-touch-target.md).
See [bounded evidence](../../docs/plans/evidence/act5-prison-services.md).
