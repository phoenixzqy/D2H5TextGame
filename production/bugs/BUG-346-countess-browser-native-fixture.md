# BUG-346 — Give constructed Countess gear native socket capacity

Status: Harness corrected; final production browser8/8 PASS; independent artifact review APPROVE.
Severity: Medium — constructed import refuses before the encounter.
Owner: root / QA harness.
Affected systems: disposable browser fixture; no production defect established.

## Reproduction

Base b7bf3595 plus the frozen Countess implementation. Headless Chromium,
en at360×640, production preview39651. No combat seed applies: failure precedes
combat. Run final-browser using browser-final/check.mjs in the Countess task root.

1. Create a Sorceress and export a native23 save through Settings.
2. Add the constructed strong cap without socketCapacity.
3. Import through Settings. The dialog remains because native decoding refuses.

Expected: a valid constructed native fixture imports, allowing the ordinary
Countess path to be tested. Actual: decodeSave throws Invalid native item socket
capacity. A gear item in native23 must explicitly carry its capacity.

## Evidence and correction

final-browser.log, browser-final/en-360-fresh-input.json, the failure screenshot,
and browser-fixture-decode.json retain the failure. Add explicit socketCapacity0
to the constructed cap in a separate browser-corrected output directory. Preserve
the product, original harness and all assertions. This is not a production save
validator defect and gives no earned gameplay credit.

Evidence is owned by root at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo
through final review, verified archival and exact cleanup.

## Follow-up: pre-victory Claim representation

The valid corrected import passed, then the harness expected a disabled Claim
button for an in-progress quest. QuestsScreen renders that button only for a
completed row. Preserve this product behavior and assert absence before fresh
victory, disabled for already-completed claimed legacy rows. All post-victory
Claim/reward assertions remain. Original final-browser-corrected failure and
browser-corrected/en-360-failure artifacts are retained. The next harness setup
assertion failed before script creation; its runner failure is retained too.

## Follow-up: native IndexedDB Maps

The next run reaches native victory/proof and first Save. Its cross-browser
serialization lost native Map affix values as empty objects while the exported
JSON uses entry arrays. Serialize native Maps to their exact ordered entries
inside page.evaluate before comparing; preserve every stat/value and the original
failed log. No production persistence change or assertion removal.

## Follow-up: authored private rune table

Native victory, Save/Continue and exact hero3000/merc2250 Claim deltas pass.
The next assertion used an incorrect low-rune whitelist. The unchanged authored
private Countess table is Ral/Ort/Thul/Amn/Sol/Shael/Dol/Io/Lum, not El through
Ort. Correct only the harness whitelist to those nine existing exact IDs; keep
the one-rune/no-other-inventory-change assertions. Preserve the original failure.
