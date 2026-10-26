# BUG-276 — Capture paid Command potency for Iron Golem and Hydra

- Severity: Medium — summons work, but ignore a legitimately paid rank bonus.
- Status: Fixed locally in `7628e872`; full regression passed, independent acceptance open.
- Owner: root, engine/QA; no delegation or independent acceptance.
- Baseline: `4b1b22cc2d1cb8dd5a213c0f2ba7e975d8cf1783` plus BUG273/274 runtime.
- Environment: Linux, Node v24.21.0, pure TypeScript engine; browser/viewport/
  locale not applicable. Explicit synthetic units and selected item contributions.
- Seeds:7 for actual Command payment,19 for the recipient wave.

## Reproduction

1. Pay registered rank1 Battle Command with exactly11MP and a living recipient.
2. End that wave before expiry and retain the actual opaque engine carry.
3. Prepare learned rank1 or20 Iron with a selected synthetic metal item giving
   Attack8, or Hydra with matching native learned projection, in the next wave.
4. Compare actual body stats and noncritical direct hits against an unboosted run.

Expected: valid learned authority remains1/20; paid captured potency becomes2/21
under D06 Battle Command rules5/7. Iron Life276/580 and Attack46/84 include the
selected item. Hydra's corresponding first noncritical Fire bolt is119/290.
Captured potency persists after Command expires; payment/item rules stay atomic.

Actual: Iron remains Life260/564, Attack44/82; Hydra remains110/281 Fire.
The real Command payment and carry checks pass, so the discrepancy occurs after
valid paid authority reaches preparation.

## Cause and evidence

`prepareIronGolem` uses qualified learned rank for both authority and body stats.
`prepareHydra` captures `hydraRank(owner)` directly into its bolt binding.
Qualify learned authority first, then add only the authenticated battle-local
paid bonus to the captured rank. Preserve the existing MAX alias resolver;
generic first-positive rank lookup is not equivalent.

Root retains `next-summon-probe.ts` and `next-summon-probe.log` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-command-lq57fr2h`.
The diagnostic command exits0 in4.272s and prints discrepancies; it is not a
passing behavior test. Its report filename collided with the runner receipt,
so the full report is retained in the log rather than credited from that JSON.
Add failing Vitest cases before production changes. Workaround: omit Command
and accept unboosted summons. No inventory credit, balance acceptance, campaign
action, save migration or remote publication follows this bounded repair.

Security check: pass. Scope: local summon capture and regressions. Genuine
battle-local carry may grant potency; imported markers/copied carry must not.
No credential, dependency, filesystem-access, permission or CI changes.

## Local repair and verification

The actual regression reproduces7failed/6passed in4.505s before runtime changes.
`7628e872` retains each dedicated MAX learned-authority resolver, then applies the
existing effective-rank helper with only authenticated battle-local paid bonus.
Iron body stats/payment and Hydra bolt bindings capture that effective rank.
No changed allocation, new stat formula, save field or forged-marker authority.

All13tests pass4.261s; final literal-typed tables pass3.855s. Coverage includes
Iron ranks1/6/20, Hydra1/20, actual outgoing damage and final target HP (including
Hydra DoT), after-expiry potency, exact payment/attestation, MAX aliases,
insufficient resources, invalid learned21, copied carry, replay and input purity.
Fixtures remain synthetic party-engine evidence, not ordinary campaign proof.

Engine9413/354passes178.851s. Initial full types fail149.678s because three test
tables widened literal skill IDs to string. Adding only `as const` to those
tables fixes the diagnostic; original bytes/diff/failure remain retained.
Final full types126.237s pass. Full lint241.448s passes with inputsUnchanged:false
from that type-only correction; final changed-test lint9.345s passes unchanged.
Production build/bridge16.732s,756URLprecache0.292s and final native Iron startup
Save/Continue4/4pass48.766s. The earlier18401 full pass predates this runtime and
is not carried over. That checkpoint is superseded by the terminal full run:
18,414 tests / 849 files pass, with two existing opt-in skips, in 979.723s;
its inputsUnchanged receipt is true. The eight native Iron item/damage tests in
`be6e436c` pass separately and are excluded from that full count. Focused strict
compilation and lint pass for that new file; no later full typecheck is claimed.

[Final evidence](../../docs/plans/evidence/d06-command-summon-capture.md) records
the distinct browser build boundaries, all original failures, exact retained
archive/sidecars and verified cleanup. The earlier task-directory references are
historical: that directory and task-owned dist are removed. Root retains the
archive and sidecars through BUG273–276/full-v1 consumers, then removes those exact
paths. Only Iron receives bounded functional credit; earned balance, independent
acceptance, Mage signature effects and the full private v1 remain open.
