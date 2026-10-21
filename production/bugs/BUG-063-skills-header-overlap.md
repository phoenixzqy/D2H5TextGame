# BUG-063 — Keep the fixed character header clear of Skills detail controls

- **Status:** Fixed in `5e4a038`; bounded production-browser collision acceptance approved on 2026-10-21.
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

## Root-cause investigation

The production regression in `tests/pwa/skills-header-layout.spec.ts` (test preparation commit `fdeb743`) measures actual edge/center hit owners, header containment, main placement and overflow, with ordinary pointer allocation followed by native Tab/Enter allocation. It covers both locales, a valid 16-character name, bonus absent/present, and nine viewports including 360×640, 375×667 and 915×412. The new baseline reproduces obstruction at 915×412; it does not newly reproduce the older 375×667 visual collision.

Two independent layout causes are proved. First, the fixed HUD and separately positioned bonus chip reserve no space in the shared shell. The baseline records HUD/chip obstruction at the Allocate edges and overlapping HUD/chip bounds. Moving both into the normal-flow shared header fixes their containment and reserves their actual height above main.

The partial repair remains RED at 915×412: the detail panel's `md:sticky md:bottom-2` positioning lifts its 336px height above main's available 317px (no bonus) or 285px (bonus). Its heading starts at y70 while main starts at y95/y127; hit owners are the header, HUD and bonus chip. All four locale/bonus cases fail the unchanged heading/action/native-target hit checks. Remove only the three desktop sticky/positioning classes, keeping both existing panel heights, internal overflow and ordinary scrolling. Technical/UX review accepts the resulting unpinned desktop preview.

The failed baseline, partial-repair reports, screenshots, exact source freezes and review records remain in the task evidence pending a durable acceptance index. No product acceptance is claimed until a fresh production build passes the unchanged browser regression and final gates.

## Resolution and acceptance

Source commit `5e4a038` fixes both proved layout causes; regression commit `fdeb743` retains the genuine RED preparation. [Acceptance evidence](../../docs/plans/evidence/p16-skills-header.md) preserves original RED, partial-repair RED, final GREEN and all independently reviewed corrections. Final serial gates pass: focused75, full4527/186files, typecheck, lint and fresh production bridge/build; four browser scenarios cover36 viewport samples, both locales and both bonus states. All648 heading/action hit points,54 modal-header points and36 Cancel points pass, with ordinary pointer rank1 and native Tab/Enter rank2 allocation. QA/producer approve bounded closure; technical/UX review accepts the unpinned desktop preview. The full-unit15s target remains missed (79.28s Vitest); imported eligibility and Chromium samples do not certify earned progression, all-device mobile/readability/accessibility, performance, balance or private-v1 completion. Existing icon glyph boxes remain outside scope.
