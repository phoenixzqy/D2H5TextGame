# P16 — Mercenary hire roster readability

Verified2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
retained changes. BUG690 resolved locally, uncommitted. Hire-roster scope only.

The public-UI RED reproduction finds51 undersized labels:36 skill labels at11px,
12 class/level labels at12px and three unlock labels at12px. Unlock contrast
is3.818848:1. All12 hire buttons already measure44px high; no button defect was
reproduced. Three presentation changes in MercsScreen use the existing14px
token and white/70 unlock color. No logic, button, owned-roster, asset, data,
save, dependency, CI, permission or network changes.

## Focused verification

Ordinary Vite development mode with VITE_E2E unset; Chromium147.0.7727.15.
Fresh disposable Sorceress per locale through public UI; no injected saves,
bridges, earned campaigns, combat or store mutations through browser evaluate.
DOM evaluation measures computed styles, compositing colors/ancestor opacity
for WCAG luminance; disabled control text is excluded from contrast checks.

| Check | Result |
| --- | --- |
| RED: zh-CN,360×640 | Exit1;51 font failures including three contrast failures |
| GREEN: zh-CN/en × five sizes | Exit0;10 cases, minimum font14px and contrast5.023975:1 |
| Actual controls/layout | All12 hire buttons at least44×44px; no document overflow, navigation overlap or unreachable last hire control |
| Keyboard/gameplay affordance | Enter hires/fields Fire Rogue in both locales; action changes to disabled Owned and survives town/merc navigation; locked Act II remains disabled |
| Runtime diagnostics | Zero captured page errors or console warnings/errors |
| Existing `MercsScreen.test.tsx` | Five passed; no new native tests or changed assertions |
| Scoped strict types | Exit0; MercsScreen.tsx and its dependency graph |
| Scoped ESLint | Exit0; MercsScreen.tsx only |

Sizes:360×640,412×915,640×360,1280×800,1920×1080. Before/after mobile zh-CN
and after desktop en screenshots visually inspected. Existing portrait identity
and owned-roster typography are outside this correction. No production build
repeated for the styling slice, per work-plan.md's owner verification override.
No save-reload, device, production/PWA, whole-app or independent acceptance is
claimed. Local implementer review confirms only three baseline-relative class
changes; no underlying hire/field/locked/owned operation changes.

## Evidence and limits

Required packet retained through umbrella review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-hire-accessibility-_zi8c6s7`.
Includes baseline/source hashes and patch, executable browser checks, RED/GREEN
JSON/logs/screenshots, native/types/lint logs and review/cleanup receipt. Root
owns eventual removal. The task-owned server/browser is stopped and exact
external Vite cache removed, with absence/port closure verified in the receipt.
No new agents, installs, commits, pushes, publication, broad suites or campaigns.

Full v1 remains incomplete:14/14 intended builds cleared Act I,3/14 completed
all five Normal acts, formal balance0/210. Continue build viability, acquisition/
economy/pacing, difficulty/endgame integration, whole-app accessibility/performance
and final review/soak. Browser works; CI excluded; no pending answer.
