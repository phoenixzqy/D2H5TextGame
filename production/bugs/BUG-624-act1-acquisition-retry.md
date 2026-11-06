# BUG-624 — Bound intended-build post-Den acquisition retries

Status: Fixed and verified in working tree (uncommitted). Severity: Medium.
Owner: root (campaign policy).

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working production tree
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Environment: Node native campaign services; browser, viewport and locale do
not apply. This is orchestration, not a seeded engine defect.

1. Use an intended build that has earned level 6 and claimed the Den quest.
2. Select bounded campaign recovery and enter the post-quest Den farm loop.
3. Settle a defeat after winning some waves, retaining their native rewards.

Expected: an explicit intended-build acquisition policy may retain the loss and
earned income and retry within predeclared limits. Legacy screens still stop
on the first farming nonwin. Technical errors and outer budgets still stop.

Actual: `runActOne` calls `enter` directly in this farm loop. Its first nonwin
terminates acquisition regardless of route/opening recovery selection. Both
retained owned-defense Barbarian campaigns had claimed Den and lost their first
post-quest farm (ordinal 41). This does not establish a production balance bug.

## Evidence and correction

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
`p15-first-entry-owned-defense-v1-readback.json` and the complete campaign
journals retain the claims, wave identities, rewards and terminal saves.

Add the explicit profile option `den-bounded-v1`. Reuse `trainCampaignBuild`
with target level 12, maximum 99 admissions, 3 consecutive nonwins and 10 total
nonwins, matching existing training failure limits. Keep native Return, all
partial income, admission/time budgets and the Act I level-14 ceiling. Do not
change opening recovery or restart a closed controller. Constructed route tests
prove policy only; prospective native evidence is separately required before
claiming progression improvement or adopting the canonical default.

## Verified result — 2026-11-03

`tests/campaign/route.ts` now selects the shared bounded training helper only
with both the profile opt-in and selected recovery mode. Legacy first-loss
behavior, native Return, rewards and all declared ceilings remain covered by
`recovery.regression.test.ts` and `training.regression.test.ts` (50 affected
cases). Scoped strict types and explicit lint pass.

The two predeclared native campaigns both pass their previous ordinal-41 stop.
Double Swing reaches the first-boss checkpoint at ordinal 106 and completes
Act I at level 13; Double Throw stops at the declared three-consecutive-loss
limit at level 7. The frozen adoption criterion is met, so the canonical opt-in
is retained. This establishes diagnostic acquisition progress, not population
balance or a Double Throw solution; BUG611 remains open.

Whole-save/journal readback `p15-den-acquisition-readback-v1.json` passes.
Original screen assertions failed because acquisition losses lacked structured
accounting; BUG625 fixes that separately. Its final retained-journal audit
`bug625-retained-audit.json` passes without combat replay or replacement of the
original reports. Candidate gameplay source and final audit-code source remain
separate. No commit was created.
