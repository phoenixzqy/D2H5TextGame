# BUG-103 — Accept valid absent unclaimed flags in Act IV browser checks

Status: fixed in `409f091`; complete production flow verified.
Severity: Low (test harness; no observed player-facing defect).
Owner: root / QA.

## Reproduction

Revision `1180e80103ff45f96de27f21ef6ff0756f9c1905`, production Chromium
1280×800, both en and zh-CN. Import the exact exported constructed A3 Soulstone
fixture, start Fallen Angel through the ordinary quest UI, win the actual
Plains of Despair encounter, then export the save. This is a functional fixture,
not earned campaign or balance proof. No combat seed adjustment is involved.

Command: `npx playwright test --config tests/pwa/act4-delivery.config.ts --project=desktop`
with the task-owned ACT4 input/build/output variables recorded in diagnostics.

## Expected and actual

The browser should verify completed quest status, qualified victory proof and
an unclaimed reward. The UI intentionally starts quests without the optional
`rewardClaimed` property; absence and false both mean unclaimed. Both cases
reached completed status but the new browser assertion demanded literal false
and failed before Claim. The quest state was valid; no product fix is indicated.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a4-delivery-lsw5xgtt/browser-desktop.log`
and retained report/screenshots/trace under that diagnostic packet. Frozen
source/build/HEAD verification passed with no drift.

## Correction and guard

Keep exact completed status and actual receipt assertions. Check that the
optional reward flag is not true at each unclaimed boundary; keep exact XP,
once-only Claim and duplicate-refusal assertions. The same false assumption
appears at Forge and Diablo boundaries and is corrected together. Verify the
complete production flow before marking fixed.

## Verification

The corrected desktop rerun passes2/2. The final frozen production matrix at
`e6474b7` passes10/10, en/zh-CN at all five sizes, retry0/skips0/errors[].
Actual unclaimed receipts, exact rewards, once-only Claim and staged
Save-close-new-page Continue pass. Source2545/build760 hashes remain unchanged.
Independent QA approves the narrow functional evidence; no product fix was
needed. [Delivery evidence](../../docs/plans/evidence/act4-main-flows.md).
