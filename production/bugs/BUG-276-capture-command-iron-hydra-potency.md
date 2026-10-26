# BUG-276 — Capture paid Command potency for Iron Golem and Hydra

- Severity: Medium — summons work, but ignore a legitimately paid rank bonus.
- Status: Reproduced; regression and production fix pending.
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
