# P13b — visible earned mercenary progression

Date:2026-10-20. Runtime base7e5dcf8, including reviewed P13a8e6076e.
Root developer/test review: ADEQUATE for this bounded card. Producer independent
source/final evidence review APPROVE, evidence ADEQUATE (read-only, no reruns).
This accepts neither
fullP13 nor D10/D11, campaign/idle balance, paid recruitment or actual merc damage
contribution. Current ordinary hire is free and immediately available.

## Reproduction and smallest fix

BUG027 records genuine mounted-store RED before runtime edits:2fail/1file3.70s
at07:01:56UTC. Known definition stayed STR12 after actual level4/core13/25/16/15;
unknown definition showed dashes for valid owned core stats. Explicit canonical
304XP progress isolates the defect from P13a. Existing stat cells now read
merc.coreStats; layout, metadata, equipment, XP/gains and save schema unchanged.
Both real-store mounted regressions pass without remount. Security check PASS:
local binding and isolated browser evidence, no policy/permission/network change.

## Ordinary production route and independent oracles

Fresh guarded no-bridge build, no server reuse, fresh contexts for en/zh-CN at
1280×800/360×640. A fixed Date2026-10-20T12:00:00Z precedes ordinary Druid creation;
native playback timers remain live. No bridge/store/storage writes, imports,
boosts, forced actions, injected lifecycle, manualXP, loss retries or soft skips.

Ordinary authored InnerSight hire plus unfield/re-field establishes exactly one
fielded L3 merc, XP0/304, core12/22/16/14, life148 and empty equipment. Currency
equality records current free-hire behavior, not economy acceptance. Activated
document service worker, no bridge/overflow/page errors required.

| BloodMoor entry | Authored L2 monster count | Hero award / resulting state | Merc resulting state |
| --- | --- | --- | --- |
|1|8|160 / L2 XP60/565|L3 XP120/304|
|2|9|180 / L2 XP240/565|L3 XP255/304|
|3|10|200 / L2 XP440/565|L4 XP101/527|

Compact enemy cards count representatives plus their +N badges; literal hero
awards independently check the authored level oracle, because compact cards
omit levels. Ordinary Skip requires dead displayed representatives and original hero alive.
Numeric wave2 then ordinary Pause (500ms action timeout, Resume/pressed=true)
and Flee bounds each award. Complete exact exported progress rejects extra-wave
grants. This is three first-wave victories, not a complete area clear.

After every win, localized live level/XP/STR/DEX/VIT and a complete independently
expected merc object must match. Final L4 core13/25/16/15, life/lifeMax156, residual
XP101/527; all other merc fields unchanged. Only after these earned assertions,
whole actual save becomes the persistence baseline. Ordinary Save, readonly
actual IDB, page close/new page/Continue retain complete IDB/export equality,
locale, fielded identity and visible stats. Downloads are deleted after reading.

## Commands and results

- Genuine RED: `npx vitest run --project ui src/features/mercs/MercsScreen.live-stats.test.tsx --reporter=dot --silent`:
  2failed/1file3.70s. Post-fix both MercsScreen UI suites:7pass/2files3.97s.
- `npm test`:113files1292pass/no skips32.31s, started07:04:25UTC; concurrent
  browser build/lint. Functional pass; existing15s full-unit budget unmet.
- `npm run typecheck`, `npm run lint`:pass. Forced ESLint of
  tests/pwa/playwright.config.ts, tests/pwa/merc-progression-earned.spec.ts and
  src/features/mercs/MercsScreen.live-stats.test.tsx:pass, including final source.
  `git diff --check`:pass. No engine edits requiring a new engine run.
- `PWA_PORT=4332 npx playwright test --config=tests/pwa/playwright.config.ts merc-progression-earned.spec.ts --output=/tmp/d2h5-p13b-earned-browser-1`:
  **4/4pass1.1m**,2workers,retries0. Fresh production guard/build passed. No
  browser failure/retry or changed outcome oracle in this acceptance attempt.

Ubuntu26.04 unsupported-host caveat; Node24.21.0/npm11.19.0,
Playwright1.59.1/shared Chromium147. Existing large-chunk/stale Browserslist and
optional art-manifest precache warnings persist. Full performance/PWA gates
remain open. Existing offline gameplay spec unchanged, only explicit discovery
extended; it was not rerun for this separate ordinary earned-state card.

## Artifact ownership and sign-off

After every process/reviewer finished, root verified no listener on4332 and
removed only its exact task-owned directories, verifying each absent:
dist, node_modules/.vite in the claimed worktree2 and
/tmp/d2h5-p13b-earned-browser-1. Downloads were deleted by the spec.
No remaining task processes/disposable artifacts or cleanup failures.
Shared tools/caches/dependencies, all source/history and claimed worktree stay.
