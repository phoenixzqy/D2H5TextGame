# BUG-274 — Retain Command-boosted summon effect authority

- Severity: High — paid party potency strips Raven blind, Poison Creeper poison
  and Fire Golem fire/burn behavior from freshly prepared bodies.
- Status: Fixed locally in `49dea62a`; independent acceptance open.
- Owner: root, engine/QA; no delegation or independent acceptance.
- Environment: Linux/Node, Vitest pure-engine fixtures. Browser/viewport/locale
  do not apply. Synthetic units; no earned campaign action.
- Baseline: `4b1b22cc2d1cb8dd5a213c0f2ba7e975d8cf1783` plus the uncommitted
  BUG-273 Mage/capacity correction. Family RED source snapshots are retained.
- Seeds:7 actual Command payment;19 recipient wave.

## Reproduction

1. Pay actual registered rank1 Command and obtain its opaque carry for hero.
2. Prepare Raven, Poison Creeper or Fire Golem at learned rank1 in a fresh wave
   with that carry and valid native rank projection. Use one held living target.
3. Compare the same snapshot without carry, which produces the promised status.
4. Require the carried branch to produce the status too, including after8000ms,
   and confirm source identity using `status-state` observations.

Expected: preparation captures effective body stats; learned authority continues
to enable the body's special effect throughout its paid lifetime.

Actual: all three carried branches produce zero matching statuses. The unboosted
positive controls pass. Fifteen other Mage/capacity/negative cases pass.

## Cause and evidence

`prepareSummons` passes effective rank to `qualifyDruidSummon` and
`qualifyFireGolem`, which correctly require current learned allocation/native
projection equality. Store learned rank in the authority binding; keep effective
stats on the paid body. This is the same learned-versus-paid distinction required
by Command rules5/7 and already used by Blood Golem.

Root owns original logs/sources under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-command-lq57fr2h`.
`family-corrected-red.log/json/test.ts` contains the valid RED:3failed/15passed,
exit1/4.159s. Earlier `family-red` and `family-control-red` attempts used an invalid
`source` property on the compact status event. Those attempts are preserved but
do not independently prove the runtime defect. The corrected observer filters
target/status and gets source identity from `status-state`.

Workaround: omit the intended party buff. Regression coverage lives in
`src/engine/combat/skeletal-mage-command.test.ts`. No new balance numbers, save
format, inventory credit or full-skill/independent acceptance is claimed.

## Local implementation checks

Druid and Fire authority bindings now capture the learned rank, while staged
body stats retain their effective paid rank. Corrected family regressions and
existing preparation/Mage/Druid/Fire coverage pass399tests/6files in8.878s.
The first GREEN attempt preserved in `family-green.log/json` failed only its new
Fire source-observer assertion: compact status events say `burn`, while the
existing status engine normalizes the stored status to `ignite`. Correcting
that independently verified alias preserves source attribution and all positive
effect/after-expiry checks. No production alias behavior changed.
The first full lint run fails with five `no-unnecessary-condition` findings in
the new tests (253.578s): filtered summon events are already narrowed by the
current TypeScript version. Remove only redundant discriminant guards/ternary;
retain every count, stat, type, payment, HP, source and replay assertion. Original
full-start test bytes and failed lint receipt remain preserved. Production bytes
stay frozen while the full suite finishes; final focused tests/types/lint follow
the test-only correction. Final commit/closure will follow verification.

## Final bounded verification

Runtime and regressions are committed in `49dea62a`. Full units pass18401/848
with two existing opt-in skips in997.951s; production is byte-identical throughout.
The full receipt reports changed inputs because only the two new test files'
redundant guards changed. Exact old/new bytes and diff are retained. Their final
21tests/2files pass13.402s; final full types156.877s/lint259.384s pass.
Build/bridge/precache also pass. This closes the reproduced effect-authority
defect locally, with earned balance, independent acceptance and full-v1 open.
Root retains the active task evidence until remaining consumers finish and owns
its final archive/verification/cleanup.


## Superseding terminal closeout

The [unified final evidence](../../docs/plans/evidence/d06-command-summon-capture.md)
records the later unchanged-input full pass of 18,414 tests / 849 files (two
existing opt-in skips), plus eight separately checked native Iron cases. Its
canonical earlier-build 18-case browser matrix and latest-build four startup
cases remain distinct. Original failures and observer corrections are retained.
The task-directory references above are historical: the directory and task-owned
`dist/` were archived, read-back verified and removed. Root retains only the
three exact archive/sidecar paths listed in that report through BUG273–276 and
full-v1 evidence consumers, then owns their removal. Independent acceptance,
earned balance, Mage signature effects and full private v1 remain open.
