# BUG-042 — Stop Flee from starting a hidden battle

Status: Reproduced in production discovery and routed real-store regression; source unchanged.
Severity: High — the next encounter can retain the equipment and seed from
before leaving, undermining ordinary equipment/cast authority.
Owner: frontend-dev / engine-store integration; producer and QA review.
Input: 8f54cf0, isolated human worktree2, feat/playable-foundations.
Environment: Playwright Chromium desktop1280×800, en, production PWA;
Date-only fixture with native timers. Browser version is in native report.

## Reproduction

1. Create fresh Amazon, configure sole Magic Arrow, hire free Inner Sight merc.
2. At Date2026-10-20T12:00:00.000Z enter Blood Moor. The inferred run seed is
   2330410254; observe actual26arcane opening and win wave1 through Skip.
3. Observe actual wave2, Pause, Flee to map. Export earned inventory via UI.
4. Set Date-only fixture to2026-10-20T12:00:00.055Z (inferred intended new
   run seed2330410414), Enter Blood Moor again, inspect rendered enemy IDs,
   win wave1, observe wave2, Pause/Flee, export again.

Expected: Flee ends the active run and recording; a later Enter creates the
new encounter using current Date, canonical equipment and player configuration.
Actual: Date is1792497600055 but second encounter retains initial-seed enemy IDs
including fallen-0-db2c/quill-rat-0-0de0. Second award appends new IDs suffix6..a
whose RNG prefixes/base/roll repeat original suffix1..5, plus new bootb.
First reward160XP, second180XP proves the ordinal progressed despite oldseed.
These are distinct newly appended items, not merely retained backpack contents.

## Evidence

Root-owned raw discovery directory, retained for independent consumers:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-browser-iq1z4j5d

- discovery-dates-report.json and discovery-dates-earned.json: exact two wins
  and exported11items; amazon-discovery-dates-result.json exit0.
- discovery-diagnose-report.json: read-only second-start attachment confirms
  Date1792497600055 and oldseed enemy IDs; corresponding command exit0,
  wall29.458s,1passed/0skip/retry. Discovery success is not defect acceptance.

## Suspected root cause and planned regression

CombatScreen.handleFlee aborts then synchronously clears Zustand combat state
before navigating. BrowserRouter's v7_startTransition defers route unmount,
allowing still-mounted auto-start effect to see inCombat=false and create
another run with the old Date/config. Stop Idle uses the same exit sequence.
Confirm with real MemoryRouter future flags, mounted CombatScreen/MapScreen,
real stores/engine and ordinary Flee/Stop controls. Assert inactive/empty state
after map navigation; subsequent Enter reflects changed Date/canonical weapon.
No runtime fix before genuine RED and independent approval. Preserve intentional
idle restart and Continue-to-next-area behavior. Security check PASS: local
combat lifecycle only; no external/credential/save-format/dependency changes.

Focused routed initial3tests fail genuinely. Expanded test has5defect cases
(four explicit exits plus next Enter) and5preservation controls. Initial
expanded run6fail/4pass included an incorrect next-area oracle (Cold Plains);
authored ActI order is Blood Moor→Den of Evil, so that control is corrected
before freezing. This is a test oracle correction, not changed runtime behavior.
Terminal-control cases inject only victory flags to isolate lifecycle; initial
recordings, stores, engine and router are real. No campaign acceptance claim.

Revised fix scope: synchronous explicit-exit intent before first abort/reset,
checked by auto-start effect; covers Flee, Stop Idle and both terminal returns.
No generic unmount cleanup; ordinary Skills/Inventory navigation retains active
recording. Intentional next-area/manual-idle/timed-idle continuations must pass.

Independent Date oracle refinement before freeze: differing enemy arrays alone
is insufficient because ordinal changes count. First Fallen index0 always uses
third wave RNG draw. Manual arithmetic (no production imports): hash(area|Date)
2330410414 at.055; wave seed349193247; draw3=.038852124474942684,
floor(draw3*65536)=2546=0x09f2. Assert exact fallen-0-09f2 rather than array
inequality; .000 control fallen-0-db2c. Unsupported RTL exact option removed
(string role names are already exact); TSC rerun required before freeze.

## Frozen RED

No runtime source changes at8f54cf0. Exact regression SHA256:
d5417929e6d98cc0db44c457d3febf709cedc67021aa831f4b0ac8f66a7a899c.
`npx vitest run --project ui src/features/combat/CombatScreen.lifecycle.test.tsx --reporter=verbose`:
exit1,5failed/5passed10,1file,0skip,runner5.25s/wall6.514s
(lifecycle-exact-red.log/result). All5failures are genuine lifecycle cases;
exact Date suffix additionally fails. Frozen `npm run typecheck` exit0wall9.752s;
scoped `npx eslint src/features/combat/CombatScreen.lifecycle.test.tsx --max-warnings=0`
exit0wall5.511s. Producer refinement adopted; independent QA exactRED
APPROVE/ADEQUATE. Root agrees with small explicit-exit guard, no source yet.

## Source and final validation for review

Frozen test commitca99f7b; only runtime CombatScreen.tsx changed (SHA256
 d708f8d0917f3988eb96339c386060c29ad2a830c5841bdf2548859b695d7b72).
Synchronous per-mounted-instance exitingref gates auto-start and is set before
any mutation in4explicit exits. Fresh mount initializesfalse; intentional
continuation and ordinary navigation code remain unchanged. Independent
producer and QA source/focused APPROVE/ADEQUATE; root agrees.

Commands below run through root-owned check.py in raw directory above; each
has exact argv/exit/time in <label>-result.json and stdout/stderr in <label>.log.

| Label | Command | Exit and results | Wall seconds |
| --- | --- | --- | --- |
| lifecycle-focused-green | npx vitest run --project ui src/features/combat/CombatScreen.lifecycle.test.tsx src/features/combat/CombatScreen.test.tsx src/stores/weapon-authority.test.tsx --reporter=verbose | 0;41/3,0skip;runner5.02 |6.332|
| lifecycle-related | npm run test:related -- src/features/combat/CombatScreen.tsx |0;22/2,0skip;runner7.79|8.901|
| lifecycle-full-coverage | npm run test:cov -- --coverage.reportsDirectory=<raw-root>/lifecycle-coverage |0;2216/133,0skip;runner39.57|43.266|
| lifecycle-final-typecheck | npm run typecheck |0|18.916|
| lifecycle-final-lint | npm run lint |0;purity51|46.979|
| amazon-discovery-lifecycle-green | env PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4392 PLAYWRIGHT_JSON_OUTPUT_NAME=<raw-root>/discovery-lifecycle-green-report.json npx playwright test --config tests/pwa/playwright.config.ts amazon-weapon-authority --project pwa-desktop --grep ' en$' --output <raw-root>/discovery-lifecycle-green-results --trace off --reporter=line,json |0;1passed/0skip/retry;runner29.1|30.348|

Native command owns/stops its production server and runs fresh bridge-shaken
production rebuild. Read-only second-start DOM attachment now matches exact
Date1792497600055/Fallen0-09f2. Second earned wave produces new gear sequence:
cap it-8pq11-6, sword it-87zeo-7 attack8, cap it-66y85-8,8totalbackpack,
L2XP240,158shards. This confirms the stale-seed discovery no longer occurs,
but it is en/desktop discovery, not fullG acceptance.

Coverage:63enginefiles,8102/8582statements,1892/2105branches,296/315functions;
unchanged80%gate. CombatScreen is outside engine instrumentation. Full unit
suite still emits pre-existing unknownID/no-player/persistence fault logs,
ReactRouter futureflag and Reactact warnings; none in focused lifecycle or
production browser error collector. Related/full timings exceed prescribed
5s/15s budgets; no timing/performance acceptance. Build retains Browserslist,
largechunk, oversized generated-manifest precache and NO_COLOR warnings.

Raw log SHA256 (order matches command table):
ca37abc8c7717771d8cc9a2d2e264726519fb314c6c9d55c0a2514671ef6b89a
a19b7bb1a7c479ce8829a47e36d53ab5c25ac4227110b5a2d7afe893c75223c0
b1b10fcb30c740a0aff5582aa9808d997ee733c41f50ba411af34c2e5a6685ec
53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47
64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f
b44033feb923b0064277105f73cf0e19d983d37a539b4e035211fc2a0ac915cc
NativeJSON bb59308f76f4ecd1b79515e40a94685767c169b1790c0d4565d952d2620d05ca.

RawGroot, taskdist and local.vite remain required by ongoingG consumers and
root; root will remove after allG reviews. Do not clean shared evidence early.
No new dependencies, saveformat/migration changes, debugbridge or grants.

Final root, producer and QA APPROVE/ADEQUATE for bounded BUG042. Native
current-seed rerun and all10frozen lifecycle cases pass. CoverageJSON SHA256
682db49705a19cab6f2f4400e0d164d362a4c3c87372cb86f873c6bca52aa975.
Status: Fixed by the source commit containing this evidence (testca99f7b).
SharedGraw retained for ongoingG; root owns final verified cleanup.
