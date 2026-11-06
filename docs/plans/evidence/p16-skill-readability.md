# P16 — Skill-screen readability

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
retained changes. BUG692 resolved locally, uncommitted. Full P16/private-v1
and independent acceptance remain incomplete.

The original fresh Sorceress shows 65 text nodes at 10–12px in the tree/detail
view, two 12px labels in the combo view, and nine 14px selectors. Eleven local
presentation class changes restore 14px text and 16px inputs; rank badges get
opaque black surfaces. All handlers, game data, skill formulas and persistence
remain unchanged relative to the retained source baseline.

## Verification

Ordinary Vite development mode with VITE_E2E unset; Chromium 147.0.7727.15.
Disposable fresh Sorceress per locale through public UI. Mature cases import
the exact retained Cold backup through Settings' file input. Its SHA256 remains
`4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a`.
No bridge, injected state, combat, campaign admission, skill-point allocation,
economic action or balance/pacing credit.

| Check | Result |
| --- | --- |
| Original zh-CN 360×640 tree/combo | Both fail readability; no captured page/console errors |
| Final browser layout/readability | 26 cases pass; min text 14px, inputs 16px, measured contrast 5.706012:1 |
| Mature layout matrix | zh-CN/en × 360×640, 412×915, 640×360, 1280×800, 1920×1080 × tree/combo |
| Other layout states | Fresh tree/combo and unlearned Frozen Orb detail in both locales at 360×640 |
| Controls/layout | Measured controls ≥44×44px; no document/main overflow or navigation overlap; final requirements/selector reachable |
| Keyboard, both locales | Node preview/commit, arrow-key tabs, reorder/restore, select→Tab and navigation retention pass |
| Browser diagnostics | Zero captured page errors or console warnings/errors |
| Existing native tests | Six selected SkillsScreen tests pass; 38 outside this selection |
| Scoped strict types / source ESLint | Both exit 0 |

Readability/control measurement covers the screen's main content. Shared shell
navigation/HUD and other screens are outside this typography proof. Global
overflow/navigation-overlap checks remain included. DOM contrast composites
flat background colors and ancestor opacity; opaque rank badges avoid image
dependence. Disabled controls are excluded from contrast, included in size.
The existing intentional horizontal scrolling within tree panels remains.

Local screenshot review covers English/Chinese mobile and desktop detail,
English mobile combo and Chinese fresh tree. Text and rank badges remain
readable; larger content uses the existing detail scroll area. Local implementer
review finds presentation literals only. No native test/assertion changes,
broad suite, build, earlier-act replay or new balance trial was needed for this
styling slice under the user's affected-checks instruction.

## Failed observer attempts

Initial observer included shared navigation because ScreenShell owns the test
ID. Its v1 source/results/log remain. Corrected reproduction restricts font and
control ownership to main while retaining global layout checks; source had not
yet changed. The first green mature English check then expected Ice Blast after
import had correctly restored the backup's zh-CN setting. Its v2 executable,
result and log remain. Final observer reselects each case locale using Settings
after exact import. Neither correction changes the fixture or production code.
Final counts exclude these intermediate runs.

## Evidence and cleanup

Root retains required packet through full-v1 integration review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-skill-readability-5357g9g2`.
It contains source baseline/patch/hashes, executable, screenshots, browser JSON,
native/types/lint logs, observer amendments, verification and cleanup receipts.
Root owns eventual removal after evidence consumers finish.

Task server PID3600884 is absent and port42629 closed. Exact task Vite cache
and temporary type config were removed and absence verified. All browser/check
sessions completed; no cleanup failures. Shared caches were not purged. The
claimed human2 worktree remains held for the active umbrella goal.

14/14 intended builds cleared Act I; 4/14 complete five-act Normal; formal
balance 0/210. Those counts and outstanding gameplay/economy/difficulty/app
acceptance remain unchanged. Human soak stays reserved for the user. Browser
works; CI excluded; no pending answer/external blocker or renewed closed limit.
