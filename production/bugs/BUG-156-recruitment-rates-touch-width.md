# BUG-156 — Give the rates control a full touch target

Severity: Medium. Status: Fixed in `b2ed62b` locally; independent acceptance pending. Owner: frontend-dev.
Chromium headless360×640, zh-CN, local BUG154/155 production build.

Open Mercs → wishstone recruitment. The rates control measures39.828125×44px;
the mobile acceptance floor is44×44px. Expected: width and height at least44px.
Actual: Chinese copy produces a narrower control because only height is bounded.

Evidence: screenshot `bug154-earned-integrated/failure.png` and exact measurement
in its `report.json`, retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/`.
No pull/campaign attempt was consumed; console/page errors are empty.
Workaround: keyboard focus. Correction: minimum width44px on the existing button.
Security check: pass. Plan review: ready; verify the actual production dimensions
in both locales and all five prescribed viewport sizes. No RNG applies.

## Verified correction

Implementation `b2ed62b`; full11550 tests/441 files pass with2 existing skips,
types/lint/build pass, production en/zh×five viewport sizes10/10 and two exact
Save-close-Continue pairs pass. [Earned evidence](../../docs/plans/evidence/d10-earned-recruitment.md).
Regression coverage: `src/stores/gachaActions.test.ts`,
`src/features/gacha/GachaScreen.test.tsx`, `src/app/gacha-route.test.tsx`;
BUG156 also has the measured production touch-target matrix.
