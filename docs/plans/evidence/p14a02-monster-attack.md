# P14a02 — Authored monster attack progression

Implementation `e3bf53a`; [approved contract](../decisions/P14a02-monster-attack-growth-v1.md)
and BUG087. Shared paired finite/nonnegative/ordered attack/growth ranges now
resolve through the production factory and ordinary combat. Endpoints round
after level/tier scaling; scalar consumers use their resolved midpoint. Exact
overrides, Might, active spells, fixed Raven arrows and unmigrated fallbacks
retain their contracts. The eight approved archetypes are authored in JSON;
the remaining101 definitions still require numeric migration.

Producer source/security APPROVE/pass; GD/TD APPROVE; independent QA ADEQUATE
for test quality, measurement fidelity and final evidence, with no actionable
evidence gaps. All readers released.

## Verification

Genuine frozen RED:47failures/5compatibility controls. All52pass after the fix;
four supplementary tests cover standalone pairing, resolved overflow before RNG
and Might projection. Only the original Raven fixture's stale Zombie Attack87
changes to78: `round(28.8 + 11*4.5)`. The first typecheck failed on a test's
widened array; readonly tuple annotations correct it without changing assertions.
The frozen pre-annotation source and both failed typecheck logs are retained.

Final engine4121/104files, full8536/272files, typecheck, lint and production build
pass. Engine29.94s/full169.88s exceed3s/15s budgets. Build has VITE_E2E unset;
all four emitted JS chunks pass the repository bridge-token patterns. Existing
chunk/Browserslist/art-manifest build warnings remain; no performance acceptance.

The existing Blood Raven native spec passes four production Chromium cases:
en/zh-CN ×360×640/1280×800, zero skips/retries/flaky/page errors. Ordinary
Import/Export equality, encounter playback and Save/page-close/Continue/full
export equality pass against the changed production data. This proves imported
checkpoint integration, not fresh acquisition or Shaman-specific browser damage.

## Matched Catacombs wave4 cohort

[Exact executed measurement](fixtures/p14a02-monster-attack.measure.mjs) retains
the original allies/resources and all13enemies. The production planner/factory
rebuild at original spawn seed4233610418 matches every nonattack field, including
HP/level/tier/affix/ID. The harness restores the original presentation grids;
the first failed grid-equality attempt is retained. Baseline exactly reproduces
the old recording. Each package runs all combat seeds0–999 with no rewards,
continuation or selected winner; source/input immutability and exact replay pass.

| Metric | Before | After |
| --- | ---: | ---: |
| Wins / draws / losses |1 /1 /998|14 /13 /973|
| Hero deaths / merc deaths |998 /606|973 /754|
| All-outcome duration p50 / p95 ms |7653.85 /13100|15073.03 /28565.93|
| Successful TTK p50 / p95 ms |48000 /48000|48768 /60000|

Paired transitions:973loss→loss,13loss→win,12loss→draw,1draw→draw,1win→win.
Original seed still loses at15456.04ms versus7653.85ms. Longer fights increase
mercenary deaths. This supports the authored correction, not balance acceptance.

## Single original earned route

[Exact executed route](fixtures/p14a02-monster-attack.route.mjs) restores only the
original unique L12 fixtureSHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
Complete initial save equality passes. Same clock1792497600000/seed2223645302,
bonus1, predeclared existing weapon `it-7is2r-10i`/mercAttack43 and skill orders.
No further gear search, farming, point spending, refill or failed-reward financing.

| Area / ordinal | Combat ms | Earned XP | Result |
| --- | ---: | ---: | --- |
| Blood Moor102 |28812|1460|Victory,3waves|
| Cold Plains103 |57048|3100|Victory,4waves|
| Burial Grounds104 |112296|3130|Victory,4waves|
| Dark Wood105 |127008|6600|Victory,5waves|
| Catacombs106 |82248.04|4860|Defeat,W4; stop|

Catacombs W1–3 win; W4 opens hero122/262HP,175MP and merc181/252HP,79MP.
The result matches the candidate exact wave. Of339incoming damage, Bone Warrior
Strong Melee deals179, Shaman Fire Bolt15, ordinary attacks30, lightning affix115.
Hero casts5Frost Nova/5Ice Blast; three surviving champions hold1282of1968remaining
enemyHP. These observations do not alone establish another defect or numeric fix.
Andariel is never reached. Failed wave awards zero XP/items/currencies/mercXP;
earlier guard wins retain actual awards. All173item additions reconcile with
3737→3910unique IDs. Final diagnostic exportSHA
`3065a41613e3b7c35c963d12d7a037d45ee51f2d10b217d638580366d99da6d1`.
Do not use this failed export to fund a stronger retry.

GD/TD's bounded diagnosis accepts the failed observation, not campaign balance.
The legal L12 build faces the authored L17 roster, three champions and MR32;
Nova2's raw28–38 and concentrated IceBlast8 damage do not establish a resolver
defect. Control operates and mana remains. No contract promises this fixed,
sparsely equipped recipe a victory, so another numeric nerf is unsupported.

Next reconcile `docs/design/combat-formulas.md` §10.1 (full HP/MP at combat
start) with accepted new-run/recovery contracts and the production new-challenge
entry boundary. The hero projects persisted resources while the mercenary is
recreated full. This is a policy discrepancy to resolve before a fix or another
route attempt; it does not authorize per-wave refills or output persistence.
The separate authored Ice Blast secondary-chill gap has no established material
contribution to this failure because Nova already supplies chill.

## Artifacts and scope

[Summary and hashes](fixtures/p14a02-monster-attack.summary.json). Raw root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-monster-attack-m031y930`.
Root retains raw rows, recordings, saves, logs, scripts and browser attachments
through dependent progression/C1, then removes them after consumers release.
Exact disposable build/cache/tmp/browser-output/snapshot cleanup is complete;
`cleanup.receipt.json` records remaining[]/failures[]. Required raw evidence
remains at the exact root above under root ownership through progression/C1.
No push/PR/deploy. C0–C4/G0–G7,
ActI completion, campaign pacing and full-v1 acceptance remain open.
