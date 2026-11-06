# P16 — Main and side quest readability

Verified2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
retained changes. BUG689 resolved locally, uncommitted. BUG358 now has current
development-browser evidence; its final production-bundle check remains open.

Locked cards previously combined root opacity0.6 with translucent labels:
status2.093:1, description2.971:1, captions2.497:1, heading3.544:1. Body text was
12px. The public-UI RED reproduction exits1, with50 contrast failures on10 locked
side cards and252 undersized description/objective/reward elements. Root
opacity is removed, Locked status uses the existing white/70 token, status and
quest body use14px text. Existing locking, completed border, IDs, handlers,
gameplay and locale resources are preserved.

## Focused verification

The same browser executable compares actual computed text colors, backgrounds,
foreground alpha and ancestor opacity using WCAG relative luminance. It excludes
disabled controls from the contrast check, as WCAG permits. Body font checks
cover descriptions, objectives and reward chips. It verifies all24 main and22
side quests against their own locale resources, including ordered objectives.
It uses fresh disposable characters and public controls only; no bridge, save
injection, combat, earned campaign or fixture mutation.

| Check | Result |
| --- | --- |
| RED: zh-CN,360×640, main+side | Exit1; actual contrast/font failures, zero page/console errors |
| GREEN: zh-CN/en × five sizes × main/side | Exit0;20 view/tab cases, all46 canonical cards per locale, zero measured failures |
| Smallest text contrast in GREEN | 4.955760:1; descriptions/objectives/reward body at least14px |
| Layout | No horizontal document overflow or main/navigation overlap; last quest heading scrolls into view at every size |
| Status and keyboard | Public start→in-progress persists across tab changes;10 locked side actions stay disabled; ArrowRight/Home tabs focus/select correctly |
| Existing `QuestsScreen.localization.test.tsx` | Six passed in one explicit file; no new native tests or changed assertions |
| Scoped strict types | Exit0; QuestsScreen.tsx and its dependency graph |
| Scoped ESLint | Exit0; QuestsScreen.tsx only |

Sizes:360×640,412×915,640×360,1280×800,1920×1080. Chromium147.0.7727.15,
ordinary Vite development mode with VITE_E2E unset. Before/after mobile and
desktop screenshots were captured; mobile zh-CN locked and en available cards
were visually inspected. The development-only navigation link is present;
this evidence does not substitute for production/PWA geometry or device tests.

Local review: the baseline-relative patch changes only presentation in one
source file. Removing opacity fixes the cause rather than compensating child
colors. The completed border/disabled semantics and all quest operations are
unchanged. No dependency, data/schema, persistence, network, CI or permission
change. Review is by the implementing agent; no independent approval is claimed.

## Evidence and limits

Root-owned required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-quest-readability-per9dcp4`.
It retains exact baseline/source hashes and patch, browser executable,
RED/GREEN JSON/logs/screenshots, native/types/lint logs and the review/cleanup
receipt. Root retains it through umbrella review and owns eventual cleanup.
The task-owned development server/browser processes are stopped and the exact
external Vite cache removed; see the receipt. No new agents, installs, commits,
pushes, publication, broad suites, campaigns or renewed closed budgets.

Per work-plan.md's owner override, no production build is run for this
presentation slice. BUG358's production-bundle verification, completed/claimed
quest browser states, whole-app accessibility/performance, campaign/build
viability, economy/pacing and final review/soak remain pending. Current counts
stay14 intended Act I clears,3 all-Normal completions and formal balance0/210.
Full private v1 remains active and incomplete.
