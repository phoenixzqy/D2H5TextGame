# BUG-051 — Make quest action targets at least 44px

Status: Resolved (ee18ea9)
Severity: Medium
Date: 2026-10-20
Owner: frontend-dev / accessibility-specialist

## Reproduction

- Build: `6ecfd80` production (`VITE_E2E` unset; bridge absent), Playwright1.59.1, Chromium headless-shell147.0.7727.15 (Playwright pinned revision1217).
- Viewports: 360×640, 412×915, 640×360, 1280×800, 1920×1080.
- Seed: not applicable to UI defect; quest progress imported through public Settings UI only. This is claim wiring, not earned victory.
- Locale: zh-CN and en.

1. Create a fresh Sorceress through UI; set the locale in Settings.
2. Export a save. Import it with only `quests/act1-sisters-to-the-slaughter` completed and `obj-kill-andariel:true`.
3. Open Quests and locate the canonical main quest; inspect its text and claim control.
4. Run `npx playwright test --config tests/pwa/quest-unique-reward.config.ts` against production with an isolated output directory.

## Expected

Quest action targets are at least44px high and wide.

## Actual

Claim is40px high in all10 production browser cases.

## Evidence

Initial frozen run: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-andariel-browser-j0mql7lv/red.report.json`, `red.log`, `red-summary.json` and `red-output/` (task-owned, retained until independent review).
Durable outcome: `docs/plans/evidence/p04a07d-production-quest-claim.md` and linked fixtures.
Regression: `tests/pwa/quest-unique-reward.spec.ts`; original assertions retained, approved additive Save-status wait before reload.
Original host lacks CJK/emoji fonts: initial screenshots have tofu and cannot establish Chinese visual readability. DOM comparisons remain valid; strengthened run uses task-local fontconfig without application changes.

## Affected systems and root cause

frontend-dev / accessibility-specialist. Four quest-local action controls specify min-h-[40px] with text-xs, yielding40px including shared padding.

## Workaround

Pointer input still works; larger desktop does not increase this target.

## Resolution

Fixed in ee18ea9. Independently approved production10/10 across zh-CN/en×5viewports; all assertions and prior failed attempts preserved in P04a07d outcome. QA and producer final APPROVE / ADEQUATE, exact cleanup verified.
