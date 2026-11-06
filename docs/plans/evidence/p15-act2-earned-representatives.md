# P15 — Earned first-entry representatives and Double Swing Act II

2026-11-05. Three retained Act I completions qualify against the current decoder
and native stores without combat. One prospective, bounded Double Swing Act II
continuation completes with separate reward/save readback. This advances P15
diagnostics; it does not accept balance, active-hour pacing or full v1.

## Source qualification and historical policies

| Role | Actual Act I source | Next Normal ordinal | Current restoration | Continuation policy |
| --- | --- | --- | --- | --- |
| Melee | Double Swing Barbarian, level13/v33 | 118 | Exact, no migration | Current canonical intended profile exactly matches parent |
| Caster | Fire Sorceress, level13/v32 | 111 | Exact v33 migration and capture | Historical priority/targets differ; preserve manual preparation before any continuation |
| Summoner | Summon Druid, level13/v32 | 110 | Exact v33 migration and capture | Historical priority/targets differ; preserve manual preparation before any continuation |

All six Act I areas and the Sisters claim are present in every exact raw export.
The historical report's literal successor equals that raw export before
migration. Version32 adds exactly version33, empty `meta.recruitmentState`
(`srPityCounter:0,totalPulls:0,history:[]`) and empty
`mercs.recruitmentProgress`. Current decoded snapshots equal native restored,
captured and exported snapshots; outer stores and clock restore exactly. Seven
mutation controls per source reject changed XP/items/ordinal, changed defaults
and missing recruitment fields. No historical raw save was rewritten.

Fire retains its earned Blaze/Ball/Bolt allocation and paid `party-nine-el`
preparation; Druid retains Spirit Wolf/Raven and paid `mixed-Eld-wands2`.
Their current default targets/priority are not substituted. No new gameplay,
reset, currency payment or reward roll occurs for those two roles. Qualification
does not independently reconstruct every historical acquisition action or
authorize a canonical-profile continuation without explicit policy mapping.

[BUG739](../../../production/bugs/BUG-739-historical-source-qualification-version.md)
fixes the external historical/current equality assumption and compound manifest
access. Initial failed receipts/scripts and later rejected type drafts remain;
no failed attempt is hidden or counted as gameplay.

## Frozen Double Swing branch

The exact earned Act I source SHA256 is
`cd95e49f0724e40e3e273f9acce1acad6efa15fcdd88366856652bfec2b981fa`.
The unchanged profile is `barbarian-double-swing-intended-v1`. The frozen plan
permits one launch,100admissions,7,200,000combatms,90,000driver-wallms,
64MiB compressed journal and96MiB packet. A single-use launch claim prevents
relaunch even if setup fails. All started outcomes/rewards must be retained;
stopping occurs at native admission/settlement boundaries. Original aggregate
limits remain and all118parent admissions/3,388,035.782combatms/28,395.483driver
ms plus the full120,000ms parent reservation carry forward. The measured
33,780.606ms parent wrapper cost is reported separately, never used to renew
the reservation.

First attempts use actual earned power; training follows a settled loss only,
to the failed terminal level plus one, at most three route attempts per area.
The existing controller's eligible cleared-area and nonwin/training limits
apply. No boundary/max-level pretraining or Act I route replay occurs.

| Area | Route ordinal(s) | Entry → terminal levels before quest claims | Result |
| --- | --- | --- | --- |
| Rocky Waste | 118 | 13→13 | Win |
| Dry Hills | 119 | 13→13 | Win |
| Far Oasis | 120 | 13→13 | Win |
| Lost City | 121 | 13→14 | Win |
| Arcane Sanctuary | 122,127 | 14→14;15→15 | Defeat, then win |
| Tomb / Duriel | 128 | 15→15 | Win |

Four Burial Grounds admissions123–126 earn recovery from14to15. The final
quest claim takes the native successor to16/next Normal129. Eleven admissions
contain53waves:52victories/one defeat, seven route/four recovery admissions.
All five Act II quest claims occur exactly once. Native income is209,100XP/
461items;415items are salvaged and26owned socket materials inserted.

## Pressure and pacing findings

Branch combat is433,219.821ms(7.22minutes), including95,112.545ms(1.59minutes)
of recovery and338,107.276ms(5.64minutes) on route. Combined earned Acts I–II
combat is1.06146hours/129admissions. Driver/wrapper costs are11,261.137/
16,415.616ms for this branch and39,656.620/50,196.222ms cumulatively measured;
the prospective combined execution reservation is210,000ms.

Duriel takes32.550simulated seconds. Hero/Prayer levels are15/17. The hero
enters/finishes472.77HP, minimum416.77HP(88.15%);63physical+6cold incoming is
offset by69skill healing and0effective orb healing. Hero physical resistance
is57, defense170.98; Prayer deals39.23% of boss damage. The mercenary dies at
Arcane ordinal127/wave4 and native carry/save accounting reconciles.

Boss duration alone therefore does not demonstrate challenge. Bow's earlier
route-first branch required40admissions/26.07combat minutes and three defeats;
these are distinct earned lineages/policies, not paired populations. Neither
sample establishes class fairness or the12-hour cumulative Act II/30–50active
hour first-clear target. Combat excludes menus, reading and human decisions.
[BUG731](../../../production/bugs/BUG-731-duriel-earned32-screening-challenge.md)
remains open; do not buff all bosses from this one seed or silently add
mandatory planner-level grinding to make the pacing metric larger.

[BUG740](../../../production/bugs/BUG-740-health-orb-negative-control-at-full-life.md)
corrects a copied analysis control that expected removing a zero-effective orb
to change life. Retained version2 verifies four mutations on an effective-heal
fixture, the valid full-life no-op, and three real-sample mutations. Original
failure/script remain. No combat replay.

## Checks, artifacts and next action

Final scoped strict TypeScript has zero diagnostics across914 transitive files;
explicit ESLint, launcher/reader syntax and zero-gameplay preflight pass. The
previous controller tests remain valid: no repository controller/runtime edit
occurred. A separate streaming Python reader reconciles native export, ordered
item custody, materials/currencies/XP/points, claims, socket payments, companion
entry/death carry, all admissions/recovery, clock/seeds/ordinals and all
2252production/135campaign inputs. Nine admission/seven mercenary negative
controls pass. Historical/current source deltas and exact parent costs are
pinned. Separate analysis passes; this is root verification, not independent
final QA or independent damage/loot/planner/scoring/merc-XP derivation.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-earned-representatives-p_pqjbjf`.
Key files: `source-qualification.json`, `swing-route-first-v1-plan.json`,
`swing-route-first-v1.json`, `.journal.jsonl.gz`, `.native-export.json`,
`swing-route-first-v1-readback-v3.json`, `swing-route-first-v1-analysis-v2.json`,
`cleanup.json` and `artifact-manifest.json`. Report/journal/export SHA256:

- `247ea4868f69ee3a679a65c9a017ecb86317d426dd247a5108ac6764b65a9b45`
- `081bd9cb8a6de8d0812d5d97220b785c71b4d2c6f1f9926d778bbe0910cc77ab`
- `50341cd2f0c9e099e0437efc0bece7d3a4830445a8ee8235f07d1cd61ec89caf`

Final packet6,177,566bytes is below cap. All20receipt-owned PIDs are absent,
exact task cache is absent, temporary tsconfig was never created, no bytecode or
disposable paths remain. Root retains the required packet through unfinished
full-v1 acceptance and removes that exact path after all consumers finish.
Human2 remains claimed for the unfinished umbrella task.

Next preserve Fire/Druid's explicit manual-policy mapping and qualify ancestral
costs before bounded first-entry continuations, then choose acquisition/
mitigation/pacing changes from the representative results. No completed-act
replay, broad test suite, build, new agent, CI, commit or push occurred. Browser
works; owner playtest follows implementation; no pending question/user hold.
Counts remain14/14intended Normal,210/210supplemental source availability,
formal balance0/210. Full v1 remains active/incomplete.
