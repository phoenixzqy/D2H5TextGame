# D04 — Amazon seeking arrow, cone and repeated volley

Root implementation contract,2026-10-26. Repairs existing advertised identities;
independent design/QA and earned balance remain open. BUG284–286 reproduce six
native failures with one ordinary-miss control against runtime121fd691.

| Skill | Existing numbers preserved | Required correction |
| --- | --- | --- |
| Guided Arrow | Physical70–100,+6/rank;20MP/2s;unlock18,Multiple Shot prerequisite,cap20 | Explicit JSON-owned always-hit capability bypasses ordinary hit/dodge/Blind, retaining resistance,Defense,critical,personal shields and reflection; one living hostile target,never spill on lethal. |
| Multiple Shot | Physical40–60,+4/rank;15MP/2s;unlock6,Magic Arrow prerequisite,cap20 | Three-row widening cone1/3/5,maximum5living hostiles; independent ordinary hit rolls. |
| Strafe | Physical35–55,+4/rank;20MP/2s;unlock24,Guided Arrow prerequisite,cap20 | Two ordered passes over the original living all-enemy pool using existing each-original hitSequence. |

Only Magic Arrow in the relevant prerequisite chain has an authored equipment
gate. Do not invent bow/javelin gates for the other three. No additional
statuses,weapon Attack scaling,save fields or global hit-chance change.

The cone uses existing unbounded nonnegative grid coordinates, widening toward
increasing row: anchor;next row col−1..+1;third row col−2..+2. Clip negative
coordinates using existing position validity. Retain the shared maximum-coverage
anchor choice,tie order and row/column target order,then apply cap5. Dead and
friendly units never enter the candidate pool; sparse cones do not fill from
elsewhere. This adds no movement/range stats and leaves existing cone-2 intact.

Two Strafe passes are the smallest repeated volley compatible with the
unspecified rapid multi-hit promise. They are provisional design potency,
not earned balance approval. Each attempt keeps normal hit/critical/resistance/
Defense,absorption/reflection and seeded RNG. Misses consume attempts,dead
original targets are skipped without redistributed attempts,stop immediately
on caster death. Charge mana/cooldown once per cast. No new scheduler or delayed
projectile system is needed for this text-combat abstraction.

TDD acceptance: actual native class/level/allocation/prerequisites and canonical
inventory equip;rank1/20 literal HP/MP plus negative controls;new cone geometry/
clipping/ties/cap;guaranteed hit under natural misses/high dodge/Blind with
ordinary controls;payment/cooldown,dead/lethal,reflection and deterministic replay;
truthful bilingual unlearned/current/next/MAX descriptions;public allocation,
priority,actual cast/hits,online/offline seven-domain restoration and mobile.

Source remains frozen until tool77646 terminates and its1677inputs read back
exact. Then implement bounded source increments,run focused checks through the
batch and one applicable integrated checkpoint. Preserve every original failure;
do not broaden pass thresholds or weaken assertions. The first off-repo draft
used seed7 for a 100%dodge miss control incorrectly: the shared5% minimum hit
floor lets seed7 land. Seed41 correctly establishes ordinary-miss controls;
that draft is retained separately and is not a product bug.

Root plan-review: ready with exact cone/cap,Strafe count,dead/caster lifecycle,
mitigation,source-freeze and public acceptance specified. Security check: pass
for first-party local gameplay/content/UI/tests;no remote/dependency/credential/
CI or genuine-campaign action. This is author planning,not independent approval.

## Off-repository implementation experiment

After correcting three draft native-ID oracles (projection keeps data IDs,
recorded actions use runtime IDs), the unchanged source reproduces11failures/
13controls across24cases in9.101s. A five-file Vite load overlay implements
the planned hit flag,cone3,cap5 and two-pass sequence without changing any
repository file. The same24native cases pass9.339s,including real HP/payment,
Blind,ordinary mitigation,dead targets,lethal reflection and shield depletion.
This is an experimental GREEN,not a branch implementation or typecheck result.

Root retains original drafts,all RED/GREEN receipts and
`overlay-mapping.json`/`overlay-base-hashes.json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6`.
After tool77646 terminates,apply the verified mechanics in bounded increments
with effect/public types,schema regressions and actual branch tests,then finish
bilingual previews and public acceptance. No skill credit yet.
