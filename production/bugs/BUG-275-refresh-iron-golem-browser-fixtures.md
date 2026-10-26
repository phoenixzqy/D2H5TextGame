# BUG-275 — Refresh Iron Golem native browser fixtures

- Severity: Medium — stale QA fixtures prevent current production verification.
- Status: Fixed locally in `0fddb877`; broader Iron acceptance remains open.
- Owner: root, frontend/QA; no delegation or independent acceptance.
- Baseline: `4b1b22cc2d1cb8dd5a213c0f2ba7e975d8cf1783` plus BUG273/274 runtime.
- Environment: Linux, Node v24.21.0, Playwright Chromium, production bridge-free
  build; en/zh-CN, 360x640 through desktop layout controls. No earned campaign.
- Seed: browser native encounter seed; no fixed engine-seed claim.

## Reproduction

1. Serve the frozen production build with the existing Iron native browser test.
2. Create a Necromancer, export through Settings, and inspect the assertion.
3. After updating only the external fixture for current saves/prerequisites/items,
   execute its 18-case matrix, including startup with imported34MP and35MP.

Expected: current version22 exports and legal prerequisite/item fixtures reach
the actual Iron controls; fresh challenge entry refills resources before payment.
The preview includes the selected learned Golem Mastery effect.

Actual: the original test fails expecting version11 instead of22. Subsequent
external fixtures expose missing socket fields, incomplete transitive
prerequisites, obsolete preview life, and an obsolete34MP refusal expectation.
Fresh entry lawfully prepares Iron and consumes the sword in both MP cases.

## Evidence and correction

Root-owned task directory:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-command-lq57fr2h`.
`iron-original.log/json`: one failed test,7.009s. `iron-public-matrix.log/json`:
16passed/2failed,166.630s; both failures are the34MP expectation.
`iron-refill.log/json`: four corrected startup Save/Continue cases pass48.241s.
These separate commands are not one successful18-case execution.

Correct the repository test to current fixtures, add a compile-time SaveVersion
guard, and rerun its canonical matrix. Keep exact insufficient-MP refusal at the
engine boundary: `combatHelpers.ts` fresh-entry refill and GDD5.4 mean an imported
34MP save cannot establish insufficient MP at startup. Do not change production
resource behavior to satisfy the obsolete test. No skill credit follows this
test maintenance; Iron's Command-potency defect remains separate.

Security check: pass. Scope: local browser fixture/test maintenance; no new
dependency, credential, network destination, permission or CI bypass.

## Local correction and verification

`0fddb877` updates only the native test: current version22 plus compile-time
SaveVersion guard, socket fields, full learned prerequisite chain, Mastery1
preview Life360.4/377.36 and fresh-entry refill expectations. Production behavior
was not altered to accommodate the stale fixture.

Canonical matrix:18/18pass139.651s, zero retries, against frozen runtime
`142f847dfefb77ef4ecffa55feb73f02109cc2b165ab2fc4d699c73be3aa0acf`.
Its receipt reports changed repository inputs because the separate BUG276 source
fix occurred while the browser served the unchanged old build; all762 build
hashes were independently checked exact. This is not a latest-runtime18-case claim.

After rebuilding BUG276's runtime, the final four native startup Save/Continue
cases pass48.766s in en/zh-CN at360x640, with both34/35MP initial saves. Final
types126.237s, full lint241.448s and focused final-test lint9.345s pass. Six
canonical mobile originals were individually inspected; whole-matrix visual,
physical-device/accessibility/earned/balance acceptance is not claimed.
Root retains the task artifacts through the fresh full-unit run and owns final
archive verification and exact cleanup. No inventory credit at this checkpoint.
