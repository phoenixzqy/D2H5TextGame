# tests/

End-to-end (Playwright) and integration test specs for the D2 H5 Text Game.

## Project layout

- `tests/e2e/**/*.spec.ts` — Playwright specs. Run via `npx playwright test`.
  Two Playwright projects are configured in `playwright.config.ts`:
  - `chromium-desktop` (1280×800)
  - `mobile-portrait` (Pixel 5, 360×640)
- `tests/sim/` — deterministic balance simulations (Vitest harness).
- Unit tests live next to engine code in `src/engine/**/*.test.ts` (Vitest).

## E2E tag taxonomy (P04 — `playwright-project-grep-tags`)

Every spec is tagged with **one** of `@desktop-only`, `@mobile-only`, or
`@responsive`. The tag goes in the `test()` title or in a `test.describe()`
title and is used by the per-project `grepInvert` matcher in
`playwright.config.ts`:

| Project           | `grepInvert`        | Effective set                          |
| ----------------- | ------------------- | -------------------------------------- |
| `chromium-desktop`| `/@mobile-only/`    | `@desktop-only` + `@responsive` + (untagged) |
| `mobile-portrait` | `/@desktop-only/`   | `@mobile-only`  + `@responsive` + (untagged) |

> Untagged specs match neither inversion pattern and therefore run in both
> projects. The conservative default for new specs is **untagged** (i.e.
> implicit `@responsive`) — when in doubt, leave the tag off.

### When to use which

- **`@desktop-only`** — pick this when any of the following is true:
  - The test depends on `hover`, keyboard focus on a button, or any
    interaction that does not exist on touch viewports.
  - The assertion is about a layout invariant that only manifests on a
    large viewport (e.g. side-by-side hero strip + attributes panel).
  - The test uses dev tooling routes (`/dev/**`) — those are
    desktop-shaped operator UIs.
  - The spec self-overrides its own viewport via `test.use({ viewport })`
    or `page.setViewportSize(...)` — running once on either project is
    sufficient. We default these to `@desktop-only` so the desktop
    project owns them.
  - The test asserts an engine-level invariant (combat log content, drop
    rate, XP gain) where layout is irrelevant — running it twice wastes
    wall time.

- **`@mobile-only`** — pick this when:
  - The test asserts a 360×640-specific layout (bottom-nav, bottom
    sheet, no-horizontal-overflow at narrow widths).
  - The test asserts touch-target sizing (≥44 px).
  - The bug under test was specifically a mobile bug.

- **`@responsive`** — pick this when:
  - The test takes screenshots in *both* viewports as evidence.
  - The test asserts a property whose correct value differs (or must
    be re-verified) between desktop and mobile shapes.
  - The test exercises a flow where regression risk is independent at
    each viewport (e.g. modal stack-on-mobile + open-correctly-on-desktop
    invariants).

## `@responsive` allow-list

The following specs run in **both** Playwright projects. Each entry has a
one-line justification — please update this list (and the equivalent
comment in `playwright.config.ts`) when adding or removing a member.

| Spec                                            | Reason it must run in both projects |
| ----------------------------------------------- | ---- |
| `e2e/affix-rolls.spec.ts`                       | Loot/affix compare flow per locale; screenshots tagged by viewport. |
| `e2e/card-ui.spec.ts`                           | Class-select / character / mercs cards — render correctness on both layouts. |
| `e2e/combat-map-flow.spec.ts`                   | Combat ↔ Map navigation + idle gating; spec comment explicitly states "runs on both". |
| `e2e/equip-compare-table-layout.spec.ts`        | 3-col table layout captured at 1280×800 *and* 360×640. |
| `e2e/equip-compare-ux-v2.spec.ts`               | Bug-evidence screenshots taken at both viewports. |
| `e2e/i18n.spec.ts`                              | Locale switch + missing-key check must hold in both layouts. |
| `e2e/playthrough.spec.ts`                       | Captures all 11 screens at desktop *and* mobile (`testInfo.project.name`-prefixed filenames). |
| `e2e/save-load.spec.ts`                         | Save/load round-trip integrity is a viewport-independent invariant we still verify in both shapes. |
| `e2e/smoke.spec.ts` (default test only)         | Home page loads + title — basic reachability for both projects. The `responsive on mobile` test inside is `@mobile-only`. |
| `e2e/tooltip-edge-clip.spec.ts` (top-level)     | Tooltip-stays-inside-viewport invariant explicitly asserted at *both* 360×640 and 1280×800. |
| `e2e/visual-fixes.spec.ts` — Issues 3, 4a, 5    | Combat layout: per-VP branches assert different invariants on each shape; both must run. |
| `e2e/welcome-gate.spec.ts`                      | Settings-from-welcome routing + screenshot evidence per project. |

Specs not on the list are either `@desktop-only` or `@mobile-only`. See the
top-of-config comment in `playwright.config.ts` for the canonical taxonomy.

## Running locally

```pwsh
# All projects
npx playwright test

# Single project (no need for grep — `grepInvert` is per-project)
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-portrait

# Subset by tag (additive grep)
npx playwright test -g "@responsive"
npx playwright test -g "@desktop-only"
```

## Process safety

Do **NOT** run `taskkill /IM node.exe`, `npx kill-port`, `pkill node`, etc.
The Copilot CLI itself runs on Node. If port 4173 is busy, set
`$env:E2E_PORT = '4179'` and re-run. See `.github/copilot-instructions.md`
for the full list.
