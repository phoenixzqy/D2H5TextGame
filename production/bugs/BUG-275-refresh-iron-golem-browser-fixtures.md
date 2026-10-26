# BUG-275 — Refresh Iron Golem native browser fixtures

- Severity: Medium — stale QA fixtures prevent current production verification.
- Status: Reproduced; repository test correction pending.
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
