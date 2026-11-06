# P16 — Character-sheet hero attributes

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes. BUG699 is fixed locally, uncommitted. Full private-v1, production-build and independent whole-app acceptance remain open.

The character-sheet hero card now shows existing translated attribute names in four readable label/value rows. Its parent owns a fluid card's 26rem height and maximum 16rem width. Full hero names and class names wrap, class metadata uses 14px text, and labels use stronger contrast. Numeric values, effective Vitality composition, allocation behavior, portraits, shared-card API, formulas and save schema are unchanged.

## Verification

Native Vite development application, installed Chromium 147.0.7727.15. Fresh browser contexts choose language in Settings, create a Necromancer and open the character sheet through the HUD. No state injection, save import, combat, campaign admission or economic action occurs.

| Check | Result |
| --- | --- |
| Original 360×640, both locales | Four hardcoded STR/DEX/VIT/ENG labels at 10px |
| Final browser geometry | 14 unique cases pass: two locales × seven viewports |
| Viewports | 360×640, 412×915, 640×360, 768×1024, 1280×800, 1920×1080; additional 320×640 narrow reflow |
| Names | Complete 16-character English/Chinese names and translated Necromancer class name fit by wrapping in the hero card |
| Attributes | Four translated labels at 14px; exact fresh values 15/25/15/25 match authored class data |
| Label contrast | Minimum 8.398672:1, compositing flat ancestor backgrounds |
| Internal layout | Label/value glyphs and plates remain contained; no measured overlap; portrait height ≥64px; both resource bars inside card |
| Reflow and controls | No document/main horizontal overflow; measured sheet buttons ≥44×44px |
| Keyboard | Two HUD entries pass, one per locale: Tab/Shift+Tab and Enter open the sheet |
| Existing affected tests | Nine pass: base stat-group rendering and eight effective-Vitality boundary cases across both locales; 17 unrelated cases not selected |
| Test timing | 594ms test execution; 7.41s total startup/collection |
| Explicit two-file ESLint | Exit0 |
| Browser diagnostics | Zero final page errors or console errors |

Only the existing Vitality test's label lookup changes from literal VIT to the translated label. Its numeric composition, cap, raw/effective distinction and unchanged-player/resource assertions remain. Browser geometry proves the changed hero card, not whole-sheet accessibility. Narrow reflow is measured, not a physical zoom claim. The ordinary main scroll continues to contain tall cards. No new implementation-mirroring test, broad suite, build, typecheck, engine test or earlier-act replay was run; no type interface changed.

Local screenshot review covers English mobile and Chinese desktop. Source review confirms the correction is local to the HeroStrip presentation and existing test lookup. This is implementer review, not independent signoff.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-character-sheet-c5oehy_d`.
It retains reproduction JSON/screenshots, before/after source, presentation-only patch, plan/security decision, eight source/input hashes, selected-check receipts, executable browser observer, final layout/keyboard JSON, captures and closure/cleanup receipts.

The exact owned server PID3656993 was verified by command/cwd and stopped with SIGTERM; server session81153 terminated with exit0. Browser sessions8389/18420 are terminal exit0 and close their browsers in finally. Process and port5173 are absent/closed. The exact task-local vite-cache (42files) was removed and absence verified. Remaining disposables[] and cleanup failures[]. Root retains this packet and claimed human2 worktree through umbrella review, then owns evidence cleanup/worktree release.

The preceding character-creation packet also now has its missing final closure receipt: five source inputs and37 retained artifacts reconcile, with no browser/check replay.

Counts remain14/14 intended ActI,7/14 five-act Normal and formal balance0/210. Full private-v1 remains active/incomplete. Seven remaining builds, economy/acquisition/pacing, higher difficulties/endgame, broader UI/accessibility/performance/PWA and final review remain. No new agent, installation, CI, commit, push or publication. Human extended playtest remains reserved for the user.
