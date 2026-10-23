# BUG-110 — Enlarge the inventory detail Close touch target

- Status: Corrected; bilingual production checks pass at all five viewports.
- Severity: Medium (mobile accessibility; backdrop dismissal is available).
- Owner: frontend-dev / root.
- Runtime: `69828f682684ce5fd737bdff801619a57bdadb29`; production Chromium,
  360×640, en and zh-CN.
- Reproduction: open any selected inventory item in the mobile detail sheet;
  inspect the `inv-detail-close` bounding box. The extended Act V browser
  test does this after showing a newly socketed ordinary combat drop.
- Expected: the explicit Close control is keyboard accessible, visible, and
  at least 44×44 CSS pixels, as required by the mobile acceptance contract.
- Actual: both locales measure width27.734375px. The browser's existing
  `usable()` assertion fails before clicking Close. Current padding on the
  native button supplies no minimum target size.
- Evidence: `/tmp/d2h5-a5-integration-650ka_is/browser-prison-final/` contains
  both failures, screenshots, complete report and traces; sibling
  `browser-prison-final-inputs/` freezes the exact spec/config and
  `browser-prison-final.log` records the failing assertion.
- Affected source: `src/features/inventory/ItemDetailPanel.tsx`, native
  `inv-detail-close` button. Keep the existing localized name, native button,
  focus ring, dismissal handler, and the browser's 44px assertion.

Set a 44px minimum in each dimension on this shared detail control; validate
the actual sheet at all five required viewports and both locales. This is a
presentation correction, with no inventory, equipment, save or reward changes.
Root retains the exact diagnostic evidence until Act V/umbrella consumers
finish and owns its eventual removal after compact evidence is preserved.

The shared native Close button now has44px minimum width/height. The rebuilt
production scenario passes both locale measurements and ordinary dismissal
after each service, followed by exact Save/Continue. Independent QA accepts
the bounded source/report evidence. Full unit10070/352files, typecheck,
full lint, explicit PWA lint, production build and four-chunk bridge scan pass.
The other four viewport projects pass8/8, giving10/10 across both locales and
all five sizes, retry/skips/flaky/errors0. Independent QA verifies all staged
service/owned-item/save boundaries and the unchanged frozen source/build/input
hashes. Matrix report SHA256:
`e542b535a02b3e005737750cd3a062332b1ea399386b2cd50aa674b22badbffc`.
The passing assertions enforce44px minima; no separate per-case dimension log
is claimed. [Evidence](../../docs/plans/evidence/act5-prison-services.md).
