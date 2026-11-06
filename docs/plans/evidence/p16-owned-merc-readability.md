# P16 — Owned mercenary card readability

Verified2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
retained changes. BUG691 resolved locally, uncommitted. Owned-card scope;
F15 and full privatev1 remain incomplete.

Public-UI reproduction on two owned Rogues finds17 labels at10–12px and12
contrast failures: eight stat labels at3.332844:1 and four signature/ability
text nodes at4.406302:1. These overlap across21 failing nodes. All measured
buttons already meet44×44px. Nine class changes in MercsScreen use14px
labels, readable colors, opaque portrait text surfaces and wrapping names.
The last change follows actual screenshot review showing the identifying
English name suffix elided on mobile and desktop.

## Focused verification

Ordinary Vite development mode with VITE_E2E unset; Chromium147.0.7727.15.
Disposable Sorceress per locale through public UI; hire Fire/Inner Sight
Rogues. No earned save, injected state, bridge, combat or campaign replay.

| Check | Result |
| --- | --- |
| RED zh-CN360×640 | Exit1;21 failing text nodes, screenshot/source retained |
| Final zh-CN/en × five sizes | Exit0;10 layout/readability cases, min font14px and contrast4.955760:1 |
| Card identity | All20 title measurements unclipped and clear of badges; mobile/desktop screenshots show full English names |
| Controls/layout | All measured buttons at least44×44px; no document overflow, navigation overlap or unreachable final dismiss action |
| Keyboard, both locales | Field/unfield/refield; reorder secondary skill; equipment/dismiss dialogs open/escape/return focus; field and priority persist across town/merc navigation |
| Diagnostics | Zero captured page errors or console warnings/errors |
| Existing MercsScreen.test.tsx | Five passed; no new native tests or changed assertions |
| Final scoped strict types / ESLint | Both exit0; MercsScreen/dependency graph and explicit source file |

Sizes:360×640,412×915,640×360,1280×800,1920×1080. DOM contrast calculation
composites flat background colors and ancestor opacity; portrait text now has
opaque black surfaces, removing dependency on the image/gradient pixels.
Disabled controls are excluded from contrast, included in size checks.

Initial GREEN observer failed after five passing Chinese metrics because it
assumed the first hire remains fielded. The actual hire operation fields the
second mercenary. Original executable/result/failure and correction are
retained as `v1-*` plus `observer-amendment.json`. V2 verifies remaining
English metrics/both keyboard flows; its screenshot review identifies name
truncation. After fixing names, the final executable repeats only this
affected card scope and passes all10 metrics/two keyboard cases. Intermediate
runs are retained and are not added to final acceptance counts.

Local implementer review finds only nine class changes relative to the
preserved source. Production build/PWA, save reload, all mercenary variants,
equipment picker/shared dialogs, whole-app accessibility/performance and
independent acceptance remain outside this proof. No production build or
broad suite repeated for this presentation slice under the owner override.

## Evidence and cleanup

Root retains required packet through full-v1 integration review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-owned-readability-7hohedcq`.
It contains executables, source baseline/patch/hashes, browser JSON/logs/
screenshots, native/types/lint logs and `review-cleanup.json`. Root owns eventual
removal after evidence consumers finish. All browser/check/server sessions
terminal; verified task server PID3585985 absent, port4494 closed and exact
external Vite cache removed/absence verified. No cleanup failure. Claimed
human2 remains with the active umbrella goal.

14/14 intended builds cleared Act I;4/14 complete five-act Normal; formal
balance0/210. Continue unfinished gameplay/build viability, acquisition/
economy/pacing, difficulty/endgame integration, whole-app accessibility/
performance and final review/soak. Browser works; CI excluded; no pending
answer/external blocker. No new agents, installs, commits, pushes or publication.
