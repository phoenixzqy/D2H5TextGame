# P16 / F21 — Combat-log viewport virtualization

2026-11-04, `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree. [BUG719](../../../production/bugs/BUG-719-virtualize-combat-log.md)
is resolved locally; the private-v1 goal remains active.

`Diablo2TextGame.md` §4 requires virtualization. `CombatLog.tsx` now mounts only
visible/overscan rows while retaining all 200 messages in the store. A measured
hook preserves message identity and available within-row offset through eviction,
wrapping and width changes. Native keyboard scrolling, mouse/touch pause,
unpin/release/follow and empty/reset remain functional. New-message announcements
use a separate polite region; scrolling history is silent.

Required evidence packet, retained by root through umbrella acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-combat-log-virtual-5i3imfx1`.

| Evidence | Result / scope |
| --- | --- |
| `behavior-red`, `native-scroll-red`, `measured-end-red`, `shrunk-anchor-red` | Requirement, animated Home, estimated End and shrinking-row failures retained before repair |
| `final-component.log/json` | 45/45 affected component cases; no skips |
| `final-lint.log/json` | Five changed combat files pass, zero warnings |
| `final-typecheck.log/json` | Full strict app compiler passes; snapshot precedes the final shrinking-height condition |
| `final-hook-typecheck-corrected.log/json` | Final hook and imported production contracts pass strict compilation; initial missing Vite ambient config failure preserved |
| `browser-resize-red.json` | Both 360×640 locales passed before final shrinking-height refinement; subsequent larger-layout failure retained |
| `browser-check.json` | Final eight cases: en/zh-CN × 412×915, 640×360, 1280×800, 1920×1080; keyboard/history/eviction/reflow/oversized-tail/reset pass |
| `browser-gestures.json` | Final 360×640 mouse and CDP touch: pause/release, wheel/swipe, retained reader, viewport coverage and End pass |
| `browser-*.png` | Mobile, landscape and desktop inspected; actual production component/styles/i18n via a display-only Vite fixture |
| `closure.json` | Final six source/config SHA256s; owned server absent/port closed, disposable cache and active config absent |

Browser console collections contain no errors. The test observer's incorrect
8px clipping assumption and the intermediate synthetic-geometry failures remain
in the packet; neither is hidden by a relaxed production contract. No gameplay,
save or earned campaign action ran. No performance-budget comparison is claimed:
this completes an explicit presentation requirement, not whole-app runtime,
screen-reader/device, soak or independent final acceptance.

Root owns eventual exact packet cleanup and human2 release after umbrella work
and evidence consumers finish. **14/14 Act I; 11/14 intended Normal; formal 0/210**
remain unchanged. Zeal, Javelin, earned Double Swing ancestry and wider economy,
pacing, difficulty/endgame, PWA/device/a11y/performance and acceptance remain open.
