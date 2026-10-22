# P13c02 — Rogue weapons now improve named arrows

2026-10-22; local branch `feat/playable-foundations`; parent `ade07f3`;
implementation `f493d5e6dfb8f099f3686e6b50796fbbd7fc3c58`.
[Contract](../decisions/P13c02-rogue-arrow-attack-v1.md),
[BUG-085](../../../production/bugs/BUG-085-rogue-arrows-ignore-attack.md),
[machine summary](fixtures/p13c02-rogue-arrow.summary.json).

## Delivered behavior and review

Basic/Pierce use independently frozen, validated JSON definitions:16–26/CD1s
single enemy and26–42/CD3s all enemies, respectively, zero mana. Both opt into
100% of the equipment-composed combat snapshot's Attack. The shared damage
input adds that term once before increased damage/combo/crit/resistance/DEF.
Missing/zero coefficients preserve previous calculations. No rank/level growth,
global weapon bonus, new RNG draws or mercenary-ID branch is introduced.
The two obsolete placeholders are removed; other skills keep their registrations.
English/Chinese descriptions match the rule. No save migration is needed.

GD/TD APPROVE; independent frozen behavioral RED ADEQUATE; producer final source
APPROVE/security PASS. These are bounded implementation approvals, not campaign
or complete balance acceptance. Independent final slice QA: ADEQUATE, no
actionable gaps; evidence hashes, assertions and limitations verified.

## Validation

- Corrected frozen RED:14 genuine failures/14 controls. Actual sword+7 transfer
  produces old armed-minus-bare0 instead of7. The initial primitive RED also
  compared result skill-level metadata1/20; corrected to compare damage, making
  the rank case a passing compatibility control. Original logs are retained.
- Engine4043/100files pass; full unit8456/268files pass in181.80s; final focused
  52/3files pass after test-only import/narrowing corrections. Engine46.39s and
  focused6.12s exceed their3s/5s budgets. No timing/performance acceptance.
- Typecheck, lint, engine purity and explicit native-spec lint pass. Initial
  test import/non-null/narrowing lint errors and schema strictRequired failure
  were corrected without suppressions. Failed logs remain retained. Runtime
  sources did not change after the successful production screen/build.
- Production build with VITE_E2E unset passes; all four emitted JS chunks pass
  the repository's forbidden bridge patterns. Existing large-chunk, outdated
  Browserslist and unprecached2.57MB art-manifest warnings remain.
- Two production-browser cases pass in22.6s, no retries, English/Chinese: fresh
  Sorceress/free hire; ordinary keyboard priority change;360×640/1280×800
  geometry; Save→close-page→new-page Continue with full export equality; ordinary
  Blood Moor entry, two allies, Pierce cast and positive Rogue physical damage
  in localized logs. No window.__GAME__, hidden store writes or page errors.
  First browser attempt's Chinese damage selector used the English actor name;
  retained DOM proves actual Chinese positive damage. Corrected source-name
  regex requires the Rogue as attacker and both cases pass. This is desktop
  Chromium with viewport changes, not touch-device/process-restart proof or
  native earned Act I completion. Real weapon response is proved by store/engine
  regressions and the service route below, not by the weaponless fresh browser.

## Same-input retained W3 comparison

[Exact executed measurement script](fixtures/p13c02-rogue-arrow.measure.mjs).
The retained W3 opening, gear, paid skills/resources and Pierce-first order are
identical before/after; seeds0–999 were selected before candidate results. This
screen awards nothing and selects no seed for subsequent play. Both executions
verify source/input invariance; script and snapshot hashes match. Later source
differences are test-only import/narrowing/lint corrections, listed in the summary.

| Metric | Before | After |
| --- | ---: | ---: |
| Wins / draws |458 /542|989 /11|
| Hero deaths |0|0|
| Successful TTK p50 / p95 |57000 /60000ms|42672 /54000ms|
| Rogue logged DPS p50, including overkill |8.4629|32.4334|
| Minimum hero mana |168|168|

Exact retained route wave seed1579962213 changes from60s draw/421Rogue logged
damage to42.672s victory/1242damage; all enemies dead, zero hero death. This is
one bounded encounter screen, not seven-class/global/difficulty/economy balance.

## One earned route, next blocker retained

[Exact executed route script](fixtures/p13c02-rogue-arrow.route.mjs).
Restore original unique L12 saveSHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`;
clock1792497600000, seed2223645302, bonus1. Initial complete-save equality passes.
Select paid Frost Nova2/Ice Blast8 and Inner Sight/Pierce/Basic priority through
ordinary actions. Before combat project all1003 canonical backpack weapon-slot
candidates without combat/RNG; highest Attack, then lexical instance ID selects
`it-7is2r-10i`, normal great axeL7/rolledAttack18, composedAttack25→43. Production
merc transfer succeeds. Its existing eligibility checks base slot, not hero
weapon class/requirements; this evidence does not add those missing restrictions.
No gear search using combat results, farming, allocation, respec or refill.

| Area / ordinal | Wave terminal milliseconds | Result |
| --- | --- | --- |
| Blood Moor102 |4572 /9000 /15240|Victory|
| Cold Plains103 |9000 /3048 /33000 /12000|Victory|
| Burial Grounds104 |9144 /30000 /54864 /60000|Draw in final wave; run defeat|

Stop first nonwin. Dark Wood105 and Catacombs are not launched. Blood Raven
retains2241HP; three Bone Warriors retain454/384/487HP. Hero survives90HP;
Rogue is dead. The drawn wave grants zero items/heroXP/mercXP/currencies.
113 actual/raw item additions reconcile;3737→3850owned objects stay unique.
Initial full-save and source invariance pass. The final failed-state export
is diagnostic evidence, not permission to advance the route or claim a clear.

This fixes equipment response and advances the earned route beyond Cold Plains.
Blood Raven remains unresolved; Act I/C1 and every full checkpoint/gate stay open.

## Retention

Raw scripts, source hashes, complete recordings/summaries, saves, screenshots,
browser reports (including failed attempt), traces and validation logs remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-rogue-attack-mfx9_n49`.
Root owns their removal after Blood Raven/progression/C1/umbrella consumers finish.
After all readers and task processes exited, exact task-owned `dist`,
`baseline-cache`, `candidate-cache`, `route-cache` and `route-tmp` were removed.
Raw `cleanup.receipt.json` verifies remaining[]/failures[] and port60327closed;
its hash and final QA are bound in the machine summary. Pre-existing worktree
`node_modules/.vite` is a shared tool cache and remains. Required raw evidence
remains at the exact root above through Blood Raven/progression/C1/umbrella
consumers; root removes it afterward. No original-checkout mutation or external
publication.
