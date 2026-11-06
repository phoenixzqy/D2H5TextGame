# P16 — Recruitment readability

Date:2026-11-04. Local implementation/verification complete; broader acceptance open.

[BUG700](../../../production/bugs/BUG-700-recruitment-readability.md) reproduced
five recruitment fields at12px in both languages. Local presentation now uses
14px helper/history/result text, readable existing colors, wrapping banner and
result rows, and constrained widths. TypeScript AST comparison after removing
JSX className attributes is identical: no recruitment behavior/data/save change.

Ten existing affected tests and one-file lint pass without rerunning broad
checks. Native source-browser verification passes24 unique English/Chinese
screen/dialog layouts at360×640,412×915,640×360,1280×800,1920×1080 and320×640.
Changed text meets14px/4.5:1 contrast, controls44×44px and no horizontal overflow
or escaped glyphs. Keyboard disclosure, paid action, Escape/focus return and
Chinese reduced-motion flow pass; captures/accessibility snapshots retained.

An untouched earned Fire Sorceress export supplies the continuous journey:
import→ten pulls90→single pull10→Save→restart→Continue. Wishstones1031→941→931;
history0→10→11. Final gameplay survives Continue exactly; other inventory,
player/map/formation/endgame stay unchanged. Normal next921 never advances.
These economic checks cover this journey, not population balance or pacing.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-recruit-readability-7xyumven`.
Reports, exports, captures, original observer failure, source comparison,
check receipts and closure hashes are retained. The initial observer assumed a
global recruitment link; corrected observation enters through Mercs. It caused
no recruitment/economic action. Source/captures received implementer review.

Server PID3667066/session35057 exited0; child3667074 and port5173 are absent.
Only the packet's task-owned vite-cache was removed and verified. Disposables[];
cleanup failures[]. Root retains packet and claimed human2 worktree through
umbrella review, then owns cleanup/release.

This uses the native Vite source app with NODE_ENV=production, not a production
bundle/PWA or independent whole-app acceptance. No campaign replay, broad
suite/build, new agents/install/CI/commit/push/publication or renewed closed
allowance. Counts remain14/14ActI,7/14Normal,formal0/210; full privatev1 incomplete.
