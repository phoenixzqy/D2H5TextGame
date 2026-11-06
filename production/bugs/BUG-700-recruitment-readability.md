# BUG-700 — Make recruitment information readable

Status: Fixed and verified locally; independent/full-app acceptance remains open.
Severity: Medium. Owner: root / frontend. Found:2026-11-04.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes; native Vite source application with `NODE_ENV=production`, installed Chromium,360×640, en and zh-CN. No engine seed applies.

1. Create a character through the public UI.
2. Select either language in Settings.
3. Open Mercs and its recruitment banner link.
4. Inspect the banner label, wishstone label, pity counter and next-SR/SSR text.

Expected: recruitment body/helper text meets the project's14px minimum and readable contrast; translated content remains complete at mobile widths.
Actual: all five label/pity fields render at12px; three use60%-opacity body color and two use70%. History timestamps and reveal result labels use the same local12px classes in source. The banner title also uses truncation and reveal rows have no wrap/gap policy.

## Evidence and cause

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-recruit-readability-7xyumven`; `reproduction.json` and both locale screenshots reproduce the five recruitment fields. The broader ScreenShell observation also includes shared HUD/navigation text; those unrelated fields are outside this correction. No horizontal overflow reproduced in the empty banner state.

Root cause: local `GachaScreen.tsx` presentation classes retain the old12px/dim helper-text treatment. Change that local presentation, preserving all recruitment state, pool, costs, RNG, reveal behavior and save data. No formula/data/migration change is needed.

The first observer expected a global recruitment link; it timed out without recruitment or economic action. Corrected observation uses the actual Mercs entry link. Its terminal failure and original script remain retained.

Workaround: browser zoom. Affected system: recruitment UI (P16/F15). Independent/full-app acceptance remains open.

## Resolution and verification

Only local JSX presentation classes changed: 14px helper/history/result text,
readable existing color tokens, wrapping banner/results and bounded widths.
TypeScript AST comparison with JSX className attributes removed is identical;
recruitment logic, data, costs, RNG, timers and saves are unchanged.

Ten existing affected tests and one-file lint pass. Native source-browser checks
pass 24 English/Chinese screen/dialog layouts across six viewport sizes, with
readable contrast, no horizontal overflow and keyboard disclosure/modal focus.
An unchanged earned save buys ten pulls for90 wishstones, then one for10:
1031→941→931, history0→10→11. Save/restart/Continue preserves the final gameplay
state exactly. No campaign admission or population/balance acceptance is claimed.

See [P16 evidence](../../docs/plans/evidence/p16-recruitment-readability.md).
The packet retains browser reports, exports, captures, source review and check
receipts. Owned server/session exited0; exact PIDs/port/cache absence verified,
with no disposable paths or cleanup failures. Root retains evidence through
umbrella review and owns eventual deletion. This is native source-browser
verification, not production-bundle/PWA or independent whole-app signoff.
