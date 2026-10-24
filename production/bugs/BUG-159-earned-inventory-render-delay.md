# BUG-159 — Bound earned inventory rendering

Status: Fixed in `bee76a4`; observed during genuine Act III continuation on 2026-10-24.
Independent acceptance and the broader performance budget remain open.
Severity: Medium. Waiting allows the action; navigation and feedback budgets fail.
Owner: root, frontend/performance responsibility; no delegation.

## Reproduction

- Production source `b0059af`; documentation HEAD `102a52e`.
- Playwright bundled headless Chromium, 360×640, English.
- Actual earned level30 export: `khalim-actions/stopped-native.json.gz` under
  `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/level30-travincal`.
- Backpack18116 items;18136 total unique owned gear. No injected items or seed.

1. Import that actual recovered-Flail export using Settings.
2. Save, close the page, Continue and verify the exact export.
3. Click the ordinary Inventory navigation link.
4. Measure from completed navigation click until `inventory-screen` is visible.

Expected: Critical inventory/quest-item controls render promptly with bounded
work, while every saved item remains accessible and ownership is unchanged.

Actual: The original5-second visibility assertion fails. Resuming the exact
stopped export with a longer observation deadline succeeds after10661.325ms.
Assembly, Claim and Orb subsequently succeed; zero console/page errors.
This measurement is a single headless runtime observation, not a device
benchmark or broad performance certification.

## Evidence and diagnosis

Raw reports/scripts/logs remain in `khalim-actions/`, `khalim-actions-v2/`,
`khalim-actions.mjs`, `khalim-actions-v2.mjs` and their matching logs in the
task directory above. The initial stopped export exactly equals the actual
Flail-recovered export; no assembly, Claim or combat entry was repeated.

`src/features/inventory/BackpackGrid.tsx` maps every item to a complete card
and tooltip. `InventoryScreen.tsx` also calculates upgrade comparisons for
every backpack item before rendering. Both grow with all18116 retained items.
These are candidate costs; a reduced causal measurement is still needed
before selecting a source fix. Crafting, selection, stash and overflow
accessibility must be preserved.

Workaround: Wait for navigation to finish. The resumed harness observes up to
60seconds and preserves actual state on failure. This is an observation
deadline, not a product fix or performance acceptance.

Root retains the raw evidence through dependent campaign/full-v1 consumers
and owns its eventual cleanup. Genuine saves and this report are retained.

## Resolution

`useInventoryPage.tsx` bounds backpack/stash rendering and backpack upgrade
comparisons to100 visible items, with bilingual first/previous/direct/next/last
controls. Each container retains its own page across tabs and clamps after
removal/import. Full ownership, bulk counts and selected-item actions retain
their existing store boundaries; paging never mutates save data.

The six new integration regressions fail before the change and pass after it.
Together with the seven existing grid tests,13/2files pass. Full11664/450 passes
with two existing skips; typecheck, lint and production build pass.

Production Chromium, en/zh-CN at all five required sizes, verifies100-card
pages, middle/last item access,44px controls, no horizontal overflow and10exact
Save-close-Continue pairs. The original Chinese harness locale-equality failure
is preserved; its correction permits only the actual settings locale change.
All captured page/console errors are empty. Navigation post-click observations
are321.4–1119.1ms on the larger18214-item backpack. This is an improvement from
the historical10661.3ms observation, not a controlled device benchmark or proof
of the0.5s feedback budget. See [complete evidence](../../docs/plans/evidence/p16-inventory-pagination.md).
