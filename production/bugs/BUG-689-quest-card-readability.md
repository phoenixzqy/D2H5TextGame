# BUG689 — Keep quest instructions readable when a quest is locked

Status: Resolved locally, uncommitted, 2026-11-04. Severity: Medium.
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Chromium147.0.7727.15, ordinary Vite development server,
360×640, zh-CN; fresh disposable Sorceress created through the public UI.
Combat RNG does not apply; no earned campaign/save was used.
Owners: frontend-dev / accessibility-specialist.

## Reproduction

1. Create a fresh character, open Quests, and select Side Quests.
2. Read Charsi's Imbue or Cain's Gratitude before completing its prerequisite.
3. Inspect computed foreground/background colors and ancestor opacity.

Expected: P16 quest instructions and status meet 4.5:1 text contrast; mobile
body copy is at least14px. The Locked label and disabled action explain gating.
Actual: whole-card opacity0.6 compounds translucent text colors. Locked status
is2.093:1, descriptions2.971:1, captions2.497:1, headings3.544:1. Body copy is12px.
The focused main/side browser check finds50 contrast failures on locked cards
and252 undersized description/objective/reward elements. No overflow or nav
overlap reproduces; no console/page errors. Zoom does not repair contrast.

Evidence: root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-quest-readability-per9dcp4`:
`red-browser.json`, `red-browser.log`, `red-zh-CN-360-side.png`, executable
`check-quests.cjs`, exact baseline files/hashes. RED exits1 for actual computed
contrast and body font failures. Native localization resources are already
repaired under BUG358; production-bundle verification remains separate.

## Fix plan

Remove opacity at the card root; use the existing status/disabled action to
communicate locking. Use existing text-sm body/button tokens and readable
Locked status color. Preserve completed border, all gameplay/reward handlers,
IDs, localization, prerequisites and disabled behavior. No global palette change.

Plan review: ready. Contrast must composite foreground alpha and ancestor
opacity; the runtime check does so. Confirm all46 main/side cards in both locales
at360×640,412×915,640×360,1280×800,1920×1080; check scroll reachability, keyboard
tabs and native locked/in-progress actions. Run only the existing six-case
localization regression and scoped types/lint. Reserve production build for
the final combined source per the owner override in work-plan.md.
Security check: pass. Local presentation only; no new dependencies, permissions,
network, data handling, saves, CI or publication. No new agents/installs/commits.

## Resolution

QuestsScreen removes whole-card opacity, uses14px body/status text and gives the
Locked badge a readable existing color. Same executable GREEN exits0 across20
locale/viewport/tab cases: minimum contrast4.955760:1,46 canonical quest cards
per locale, zero measured font/overflow/overlap/scroll failures or page/console
errors. Disabled locking and start/in-progress/keyboard behavior remain intact.
Six existing localization cases and scoped strict types/lint pass. Local
implementer review only; final production/whole-app acceptance is separate.
See [evidence](../../docs/plans/evidence/p16-quest-readability.md).
