# P16 — Localized accessible resource names

2026-11-05; [BUG745](../../../production/bugs/BUG-745-statbar-accessible-resource-names.md)
is fixed locally, uncommitted, on human2 at
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes.

The shared `StatBar` rendered visual labels beside unnamed progress bars.
Its label is now required and supplies the progress bar's `aria-label`.
All four production usages already pass translated labels: character XP/Life/
Mana and combat Mana. Numeric behavior, styles and gameplay are unchanged.

Three focused tests fail before the two-line production fix and pass afterward:
Life/Mana/XP names in each locale, plus a locale/value rerender that rejects the
old name and verifies updated ARIA values with visual totals hidden. Scoped
strict TypeScript includes the production callers: 988 imported files, zero
diagnostics. Explicit two-file ESLint passes. Existing producer source review
approves without material findings or test false-positive concerns.

Chromium 147 verifies four cases: zh-CN/en × 360×640/1280×800. Ordinary UI creates
one fresh Necromancer per viewport, then changes language and opens the character
sheet. Named role queries and the actual CDP accessibility tree expose all three
names, including zero XP. Visible totals match current/min/max values; locale
changes preserve XP 0/100, Life 130/130 and Mana 87/87. Tracks are visible, with no
horizontal overflow or page/console errors or warnings. Screenshots of mobile
and desktop were inspected; mobile resources are below the initial viewport.
Combat was not replayed; its caller is covered by the shared-component test and
scoped types. This does not certify whole-app screen-reader compatibility,
contrast, focus, touch targets, performance or all required device sizes.

Three failed observer revisions are preserved: cold-start network-idle timeout,
zero-width fill mistaken for an invisible track, and a query that matched the
English HUD XP before character navigation committed. Final measurement awaits
the route and HUD removal, verifies the visible parent track, and reads semantic
names through CDP. No product changes were made to satisfy these observer errors.
The terminal log also contains a stale Browserslist database advisory; no package
or lockfile was changed to suppress it.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-statbar-accessibility-kd9doft3`.
Original/final component and test, incremental patch, RED/GREEN/type/lint receipts,
all browser revisions/results/screenshots and producer review remain there.
`completion.json` inventories the packet and source/document identities. Root
retains this exact packet through full-v1 acceptance, then removes it after all
consumers finish. All four browser PIDs are absent; owned `vite-cache` is removed
and both declared disposable cache paths are verified absent.

Previous goal turn was status-only/no progress. This continuation implements and
verifies a concrete G5/P16 defect. Counts remain 14/14 historical Normal builds,
210/210 supplemental sources and 0/210 formally accepted balance cases. Full v1,
economy/pacing, higher difficulties/endgame and wider acceptance remain open.
Browser works; CI remains excluded; no user answer or approval is pending.
