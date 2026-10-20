# BUG-002 — Recover image art when its source changes

- Status: Fixed; component and desktop/mobile browser regressions pass.
- Severity: Medium (visual failure; remounting the affected component recovers).
- Affected systems: shared `GameImage` / `GameCard` art; frontend-dev.
- Build: `9e0ef64cfba145c0e6a8493e5909d91d964f825f`.
- Environment: Linux, Node 24, Vitest 1.6.1 / jsdom. Browser desktop/mobile
  verification uses Chromium 147.0.7727.15 (Playwright revision 1217); this initial reproduction is a component test,
  not a campaign reproduction. Locale: existing test i18n defaults (`zh-CN`).
- Seed: not applicable (image-loading state, no engine RNG).

## Reproduction

1. Render either component with URL A, retaining its mounted parent.
2. Dispatch the image load error; confirm its icon/silhouette fallback.
3. Rerender with URL B, retaining the component instance.
4. Observe that no `img` is rendered, so B is never requested.

Expected: Changing source attempts B immediately. B can independently fail into
the existing fallback. Missing sources remain safe; portrait/item cropping and
stealth styles retain their behavior.

Actual: The boolean error flag survives the source change and permanently hides
replacement art until the component remounts.

## Evidence

Before source edits, `npx vitest run --project ui src/ui/GameImage.test.tsx
src/ui/GameCard.test.tsx --reporter=dot` reproduces missing replacement `img`
elements: **4 failed / 9 passed**. Regression assertions are checked in alongside the fix. The shared
cause is unscoped error state in `GameImage.tsx` and `GameCard.tsx:CardArt`.

## Resolution

Image error state now belongs to a keyed media child. Changing `GameImage.src`
or `GameCard.image` creates a fresh art attempt while retaining the image wrapper
or card shell. A replacement can fail independently; returning to an earlier URL
retries it. Missing sources keep their existing fallback.

Validation on the fixed source:

- Focused UI suite: **13 passed**. Covers A failure → B retry → B failure,
  returning to A, missing source recovery, crop classes, and loading attributes.
- `E2E_PORT=4393 npx playwright test tests/e2e/image-source-recovery.spec.ts
  --project=chromium-desktop --project=mobile-portrait --reporter=line
  --output=playwright-report/image-source-recovery`: **2 passed** at 1280×800
  and 360×640. The fixture imports the actual components and production CSS,
  aborts failed-art requests, and serves deterministic valid art. It verifies
  decoded replacement images, repeated fallback, missing-source safety,
  retained parent DOM, computed portrait/item crop, stealth visibility/opacity,
  and no horizontal overflow. This is shared-component proof, not campaign proof.
- `npm test -- --reporter=dot`: **84 files passed; 757 passed / 1 skipped**.
- `npm run typecheck`, `npm run lint`, and `npm run build`: **passed**.

Existing unrelated React `act(...)`, Browserslist freshness, large-bundle, and
oversized manifest precache warnings remain non-failing. No art assets, image resolver rules, or campaign
behavior changed.
