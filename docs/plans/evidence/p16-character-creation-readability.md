# P16 — Character creation layout and starting-attribute readability

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes. BUG698 is fixed locally, uncommitted. Full private-v1, production-build and independent whole-app acceptance remain open.

The creation grid now owns 20rem row heights and uses two mobile / three wider columns. Existing fluid GameCards fit those columns. Local classes arrange translated attribute names and unchanged values in four readable rows, strengthen label contrast, and allow complete class names to wrap. All seven classes and existing portraits remain available. No shared-card API, game formula or save format changes.

## Verification

Native Vite development application, installed Chromium 147.0.7727.15, without native campaign imports or developer state injection. Fresh contexts select language through Settings and use ordinary Home/New Game navigation.

| Check | Result |
| --- | --- |
| Original 360×640 zh-CN | Fixed 160px cards overlap 4px and extend 8px past each grid edge; labels 10px |
| Final browser geometry | 14 unique cases pass: two locales × seven viewports |
| Viewports | 360×640, 412×915, 640×360, 768×1024, 1280×800, 1920×1080; additional 320×640 narrow reflow |
| Original mobile position after fix | First card x30–174, second x186–330; both 144px wide, gap12px |
| Starting attributes | Four translated labels per class, 14px; unchanged numeric values checked against pre-change capture |
| Label contrast | Minimum 8.398672:1, compositing flat ancestor backgrounds |
| Geometry and controls | Seven cards inside grid; no measured card/text overlap or clipping; controls ≥44×44px; input ≥16px; no document overflow |
| Keyboard creation, both locales | Tab to Necromancer, Space select, name entry, gender toggle, gated Enter and town navigation pass |
| Automatic save and reload, both locales | Readonly IndexedDB polling requires exact v33 name/class; reload → Home Continue → town → character HUD preserves each new character |
| Browser diagnostics | Zero captured page errors or console errors in final verification |
| Existing affected tests | Six selected CharacterCreate cases pass, 30 unrelated cases not selected; 268ms test execution, 7.99s total startup/collection |
| Explicit two-file ESLint | Exit0 |

Only the existing preview assertion changes: it queries the Vitality `dt` specifically because translated class cards now also display that label. No new implementation-mirroring unit test, broad suite, build, engine check or earlier-act replay was run. No type interfaces changed. Narrow320px reflow is measured, not a claim of physical browser zoom.

Local screenshot inspection covers English mobile and Chinese desktop. English long class names remain complete by wrapping. Typography/contrast proof concerns the creation cards and measured creation controls, not other character-sheet or shared-shell typography. This is local implementation review, not independent accessibility signoff.

## Observer corrections retained

The first observer compared number glyphs with their 18px inline line boxes despite visible overflow; actual glyphs fit the 26px plates. Corrected containment checks use the visible stat plate while retaining horizontal overlap, card and grid checks. Seven Chinese layout records then passed and were retained rather than repeated.

Subsequent supplemental reload observers assumed a particular return route, then prematurely treated an async read handle as a confirmed save. The failed durable receipt was literally `false`; it is not acceptance evidence. The final observer awaits each readonly database read, polls within5s, asserts both stored fields before reload, and follows the actual rendered return screen. Both final stored records match the created name/class and both reload checks pass. No source, save timing or acceptance criterion changed to accommodate these observer errors. Failed executables/results and page capture remain in the packet. Only the final two completed keyboard flows count.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-character-create-2ksokkfc`.
It retains the original reproduction/screenshot, source baseline and presentation diff, final source/input hashes, selected-check receipts, executable versions, failed observer records, final14-case JSON, two genuine stored-character receipts, screenshots and closure/cleanup receipts.

The exact owned server PID3650257 stopped; server tool session54057 terminated with exit0. Port5173 no longer accepts connections. The exact task-local `vite-cache` (42files) was removed and absence verified after all browser consumers ended. Remaining disposables[] and cleanup failures[]. Root retains this evidence and the claimed human2 worktree through umbrella review, and owns eventual evidence cleanup/worktree release.

No campaign admission, reward or new balance acceptance occurs. Counts remain14/14 intended ActI clears,7/14 five-act Normal completions, formal0/210. Full private-v1 remains active; remaining builds, economy/pacing, higher difficulties/endgame, broader UI/accessibility/performance/PWA and final review remain. No new agent, installation, CI, commit, push or publication.
