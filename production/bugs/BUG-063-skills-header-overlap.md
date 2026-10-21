# BUG-063 — Keep the fixed character header clear of Skills detail controls

- **Status:** Reproduced in production-browser screenshots; open follow-up.
- **Severity:** Medium — partial visual obstruction; native keyboard allocation succeeds.
- **Owner / affected systems:** frontend-dev; shared fixed character header and scrollable Skills detail layout. Producer prioritizes a bounded P16 collision fix after Lightning evidence closure, before further mobile acceptance.
- **Build:** `cf8e9fc`, production output from passing `check:test-bridge-shake`; no test bridge.
- **Environment:** Linux, Playwright Chromium (Desktop Chrome profile), CSS viewports 375×667 and 915×412; en and zh-CN. Seed not applicable to layout.

## Reproduction

1. Use a Sorceress save with explicit level30 eligibility and available skill points; open Skills and select Lightning Mastery.
2. Allocate rank1, set either viewport, then scroll the detail description into view.
3. Inspect the fixed top-right character header and the top of the detail panel/action.

The retained `tests/pwa/lightning-mastery.spec.ts` reproduces these exact scroll positions. Its passing bounding-box/visibility checks do not detect occlusion and are not an assertion that this overlay is fixed.

## Expected

The fixed character header leaves the selected skill heading and allocation control unobstructed at the recorded scroll positions.

## Actual

At 375×667 the header partially covers the panel heading/action; at 915×412 it overlaps the allocation control's upper edge. Both locales reproduce. The passive prose remains readable. Functional Tab/Enter allocation succeeds; pointer hit testing and a complete accessibility audit were not measured here. Existing navigation/skill icon glyph boxes are also visible but are not diagnosed by this report.

## Evidence

[Lightning acceptance index](../../docs/plans/evidence/p07a03-lightning-mastery.md), archived `browser-lightning-v3-report.json` (two passed cases, embedded PNGs), and its exact `browser-extracted-v3/{en,zh-CN}-layout-375x667.png` / `*-layout-915x412.png` attachments. Root visually inspected all18 screenshots; QA independently reviews before acceptance. `browser-final-gates.json` explicitly excludes full mobile/readability/accessibility certification.

## Suspected cause and workaround

The fixed character header can cover scrolled screen content; this is an observation, not a proved layout root cause. Scroll to a different position or use native keyboard traversal. No product fix is included in the Lightning browser increment. Producer identifies CharacterHud.tsx:56 (fixed z40 HUD) as the first source to inspect. A later surgical fix requires ordinary pointer and native keyboard access to unobscured heading/action at both cited sizes, both locales and a360×640 baseline, with no overflow or recording change. Do not bypass the overlay with force-click or pointer-events changes.
