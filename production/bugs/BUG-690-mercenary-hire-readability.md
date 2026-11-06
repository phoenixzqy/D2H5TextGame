# BUG690 — Make mercenary hiring details readable on mobile

Status: Resolved locally, uncommitted, 2026-11-04. Severity: Medium.
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Chromium147.0.7727.15, ordinary Vite development server,
360×640, zh-CN; fresh disposable Sorceress created through the public UI.
Owners: frontend-dev / accessibility-specialist. Combat RNG does not apply.

## Reproduction

1. Create a fresh character and open Mercenaries.
2. Read class/level and skill labels in the hire roster.
3. Scroll to Act II and read its required-level label.

Expected: P16 body text at least14px and normal-text contrast at least4.5:1.
Actual:48 class/level/skill labels use11–12px; three unlock labels use12px
and contrast3.818848:1. All12 hire buttons actually render44px high; their
source min-height40px is not a reproduced touch-target defect. No document
overflow, navigation overlap, console errors or page errors reproduced.
Zoom can enlarge labels but does not restore contrast.

Evidence: root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-hire-accessibility-_zi8c6s7`:
`red-browser.json`, `red-browser.log`, `red-zh-CN-360.png`, executable
`check-hire.cjs`, exact baseline source and metadata. RED exits1 for51
undersized labels, including three contrast failures. No earned save used.

## Fix plan

Use the existing14px body token for hire class/level, skills and unlock labels;
raise unlock text from white/50 to white/70. Preserve buttons, locked/owned
semantics, recruitment, fielding, saves, data, portraits and owned-merc UI.
Plan review: ready; minimal presentation-only change in the hire roster.
Verify the same browser executable in both locales at five target sizes,
keyboard hire and navigation, then scoped strict types/lint. No broad suite/build.
Security check: pass; no dependencies, network, permissions, CI or data changes.
No new agents, installs, commits, pushes or publication.

## Resolution

Three hire-roster style changes use14px text and a readable unlock color.
Same browser executable GREEN exits0 across10 locale/size cases, minimum
contrast5.023975:1 and font14px; zero measured layout/control failures or
page/console errors. Public keyboard Enter hires and fields the Fire Rogue,
changes the hire action to disabled Owned, and retains this across town/merc
navigation in both locales. Locked Act II remains disabled. Five unchanged
native merc UI tests and scoped strict types/lint pass. No production build,
save reload, combat or whole-app acceptance claimed. Local implementer review.
See [evidence](../../docs/plans/evidence/p16-merc-hire-readability.md).
