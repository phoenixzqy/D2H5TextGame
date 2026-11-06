# P16 — Item details and equipment comparison readability

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
retained changes. BUG694–696 are fixed locally, uncommitted. Full private-v1,
production acceptance and independent review remain open.

Item details and comparisons now use 14px minimum text, stronger inactive labels
and wrapping names/affixes. Shared StatSheet uses fixed columns and displays
deltas below values. The mobile sheet retains its original opener through
StrictMode effect replay. Tall tablet/desktop details use ordinary page scrolling
so their final actions stay reachable. Only four presentation components and the
existing focus test setup change; data, formulas and save behavior do not change.

## Verification

Native Vite development app, `VITE_E2E` unset; Chromium 147.0.7727.15. Both
locales import the unchanged retained Cold native export through Settings:
`d2-counted-source-z3jj3xa1/p15-cold-direct-act5-suffix-v1.native-export.json`,
SHA256 `4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a`.
No bridge, injected state, combat, campaign admission or economic action occurs.

| Check | Result |
| --- | --- |
| Original zh-CN 360×640 detail | 84 nodes below 14px; 20 below 4.5:1 contrast |
| Final layout matrix | 84 unique cases pass: two locales × six sizes × seven views |
| Sizes | 360×640, 412×915, 640×360, 768×1024, 1280×800, 1920×1080 |
| Views | Backpack inactive/active sets, socketed unique and six-affix rare; stash; equipped single StatSheet; picker comparison |
| Typography and controls | Minimum 14px; contrast ≥4.955760:1; measured controls ≥44×44px |
| Layout and reachability | No measured clipping or document/main overflow; final actions reachable |
| Keyboard, both locales | Forward/reverse mobile trapping, Escape and opener restoration pass |
| Native save comparisons | All gameplay domains and 410 owned items unchanged; only export timestamp and `meta.idleState.lastOnline` differ |
| Browser diagnostics | Zero captured page errors or console warnings/errors |
| Affected native tests | 41 cases/four files pass; final eight focus cases rerun under StrictMode, included in 41 |
| Scoped strict types and five-file ESLint | Both exit 0 |

Readability measurement covers the selected panels, not shared shell navigation
or item-card tooltips. Contrast composites flat ancestor colors/opacity. Local
capture review covers both languages on mobile and desktop. Task-only source
review across correctness/readability/architecture/security/performance found no
required issue. These are local implementer checks, not independent sign-off.
No broad suite/build, completed campaign replay or balance/pacing credit.

## Reproductions and observer corrections

The original mobile focus defect was card → dialog → BODY. Strengthening the
existing focus mount with StrictMode produced six failures/two passes; preserving
the original opener produces eight passes. The tablet sticky defect left the
Discard action at y1057–1105 outside viewport1024; ordinary scrolling fixes it.

Original failures and executable versions remain in the packet. Observer-only
corrections cover entry-animation timing, fixed-ancestor clipping, layered
tooltip Escape dismissal, moving the pointer away from stash content, keyboard
entry into the equipment picker and the canonical Chinese Eld name
(`艾尔德符文`, not the script's original `艾德`). One immediate focus assertion
sampled a boundary guard before Floating UI's scheduled animation-frame transfer;
the corrected assertion waits for the same containment condition. A separate
16-transition diagnostic records three guard events, settled containment and
opener restoration. No production change was made for these observer errors.

Completed records were retained across runs: 31 → 46 → 68, then only the
remaining checks ran. Final aggregate is 84 layout + two keyboard + two save
records = 88; intermediate captures are not counted as additional acceptance.

## Evidence and cleanup

Root retains required packet through umbrella review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-item-readability-vl3d6whv`.
It includes original sources/hashes, task-only patch, red/green logs, preserved
failed attempts, observer amendments, final exports/captures, `verification.json`
and `cleanup.json`. Root owns eventual removal after evidence consumers finish.

Owned server PID3623169 and child3623177 are absent; port40219 is closed.
Exact task-local Vite cache and temporary type config were removed and absence
verified. Remaining disposables and cleanup failures are empty. Shared caches
were preserved. The human2 worktree remains held for the active umbrella goal.

Counts remain 14/14 intended Act I, 6/14 five-act Normal and formal balance
0/210. Eight builds, economy/acquisition/pacing, higher difficulties/endgame,
wider UI/accessibility/performance/PWA acceptance and final review remain.
