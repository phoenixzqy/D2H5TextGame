---
name: smoke-check
description: Fast end-to-end sanity sweep across the running app — boot, town, combat, inventory, save/load, settings — at both mobile (360×640) and desktop (1280×800). Used after any non-trivial merge to catch obvious regressions before deeper QA. ~5-minute Playwright run.
---

# Skill: smoke-check

## When to use
- After any feature merge.
- Before opening a PR for review.
- Before tagging a build.

## When NOT to use
- For deep regression coverage — use `regression-suite` (TODO) or the
  full Playwright suite.
- For balance verification — use `balance-check`.

## Phase 1 — Boot
- Launch dev server (Playwright `webServer` block manages this; never
  manually kill node).
- Hard refresh, verify PWA service-worker installs cleanly.
- Verify zh-CN renders by default; switch to en, verify.

## Phase 2 — New character + town
- Create new character.
- Verify each class portrait renders (image-gen artifact loads).
- Enter town. Verify all 5 town panels (vendor / stash / waypoint /
  mercs / quest log) open and close cleanly.

## Phase 3 — Combat loop
- Enter act 1 zone.
- Trigger one trash fight; verify combat log auto-scrolls, attack
  button responsive, mob dies, XP/loot awarded.
- Verify save tick fires.

## Phase 4 — Inventory
- Open inventory at 360×640. Verify drag-drop or tap-to-equip works
  with touch.
- Verify item tooltip renders with rarity color, name, stats, flavor
  in correct locale.

## Phase 5 — Save / load
- Hard-refresh in middle of combat.
- Verify state restored: HP, mana, position, monster hp, log tail.

## Phase 6 — Settings
- Switch locale. Verify text re-renders.
- Toggle reduced-motion. Verify combat shake disabled.

## Phase 7 — Mobile + desktop pass
Run all phases at 360×640 (touch emulation) and 1280×800. No
horizontal scroll. No clipped text in either locale.

## Phase 8 — Verdict
```
SMOKE-CHECK: PASS | FAIL
```
- **Failures**: list with screenshot path.
- **Slow paths**: anything > 1 s perceived latency.
- **Recommendation**: ship / fix-and-retry.

## Tooling
Reuse the existing Playwright config. Do NOT spawn a new server with
`npm run dev` and forget to clean up — Playwright's `webServer`
already manages that. **Never `Get-Process node | Stop-Process` etc.**
(see `copilot-instructions.md` Process & shell safety).

## Owner
`qa-engineer`.
