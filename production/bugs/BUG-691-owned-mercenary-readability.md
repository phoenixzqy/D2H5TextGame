# BUG691 — Make owned mercenary details readable

Status: Resolved locally, uncommitted, 2026-11-04. Severity: Medium.
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Chromium147.0.7727.15, ordinary Vite development server,
360×640, zh-CN. Disposable Sorceress created through the public UI.
Owners: frontend-dev / accessibility-specialist. Combat RNG does not apply.

## Reproduction

1. Create a character and open Mercenaries.
2. Hire Fire Rogue and Inner Sight Rogue through the Act I roster.
3. Read their owned cards: rarity/fielded badges, class/level, stats, XP,
   signature heading and ability description.

Expected: P16 body text at least14px and normal-text contrast at least4.5:1.
Actual:17 labels use10–12px; eight stat labels have3.332844:1 contrast and
four signature/description text nodes have4.406302:1 contrast. All measured
buttons already meet44×44px; no document overflow, navigation overlap or
captured page/console errors. Zoom enlarges text but cannot restore contrast.

Evidence: root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-owned-readability-7hohedcq`:
`red-browser.json`, `red-browser.log`, `red-zh-CN-360.png`, executable
`check-owned.cjs`, exact baseline source and metadata. RED exits1 on21
distinct text nodes. No earned save used. The DOM color calculation accounts
for flat CSS backgrounds/opacity; portrait pixels/gradients are not sampled.

## Fix plan

Change owned rarity/fielded/class/level/stat/XP labels to the existing14px
token. Increase stat/signature/description color to white/70. Put portrait
labels on opaque black surfaces so their contrast is independent of artwork.
Keep the existing layout and controls. One production source file:
`src/features/mercs/MercsScreen.tsx`.

Plan review: ready; no business logic or shared token change. Verify the same
browser reproduction across both locales/five target sizes, keyboard fielding,
priority and dialogs, then existing native rendering tests and scoped strict
types/lint. Reserve production and whole-app acceptance for integration.
Security check: pass; presentation-only task with no actionable concern;
no dependency, CI, permission, save, network or gameplay changes.
No agents, installs, commits, pushes or publication.

## Local visual review finding

The first corrected English captures (`green-en-360-portrait.png` and
`green-en-1280.png`) show the existing owned name ellipsized as
`Rogue Scout — Fi…`. The `truncate` class hides the identifying suffix.
Let the name wrap inside its existing footer and explicitly check title
clipping at all target sizes before accepting the card correction.

## Resolution

Nine presentation-only class changes in MercsScreen restore14px labels,
readable colors, opaque portrait text surfaces and wrapping full names.
Final browser run passes10 locale/size cases plus two keyboard flows:
minimum font14px, contrast4.955760:1,20 unclipped/non-overlapping title
checks, all measured buttons44×44px or larger, no measured overflow or
navigation overlap, and zero captured page/console errors. Field/unfield,
priority reorder, equipment/dismiss dialog keyboard focus/escape/return and
navigation retention pass in both languages. Five unchanged native tests
pass; final scoped strict types/lint pass. No production/whole-app acceptance.

The initial GREEN observer incorrectly expected the first hire to stay
fielded after the second hire. Its failure and explicit correction are
retained; no game behavior was changed to satisfy that assumption.
See [focused evidence](../../docs/plans/evidence/p16-owned-merc-readability.md).
Local implementer review only. Required packet remains root-owned through
umbrella review; task server stopped and exact Vite cache removed/verified.
