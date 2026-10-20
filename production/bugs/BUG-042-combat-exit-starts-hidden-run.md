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
