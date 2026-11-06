# P15 — Act III Summon Druid earned-power pilot

2026-11-05. **Incomplete: execution time limit, target not demonstrated.**
This closes out the consumed single launch; it does not restart or extend it.
Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act3-druid-attainment-rkl43ln1`
through full private-v1 acceptance, then removes it after all consumers finish.

## Scope and retained results

The pilot starts from the exact retained level25 Summon Druid, seeking earned
level47 before a boss diagnostic. Existing ancestry/acquisition unknowns remain
unknown. The frozen plan SHA256 is
`b90a59072616a48fc3d7a29f2cdc27e00ed968b4f190e23ccfa69fe8d372ce43`.
The controller selects cleared canonical ActI–III areas whose complete native
challenge maximum is at most hero level minus2; the reader authenticates this
controller but does not independently recalculate every maximum.

There are123 completely retained farming admissions, all victories, covering
676 settled waves and2,655,751 earnedXP. The last fully retained completed state
is **level31,376305XP within level**. Completed combat consumes2,080,782.642ms
(34.68 simulated minutes). Native allocations spend6skill/30stat points.
Sources: Far Oasis62, Lost City35, Arcane Sanctuary26. There are no grants,
purchases, recruitment, crafting, respec, quest actions, discards or resource
edits. This proves only the observed farming continuation, not a fresh-character
acquisition route or recommended-power population.

## Stop and partial admission

`supervisor-result.json` reports `stopReason:native-time-budget`, child381732
returncode-15, native180.0168s and process190.5787s. Both child381732 and
supervisor381731 were verified absent during closeout. The task cache is removed.

Admission124 retains preparation, its installed plan and one victory wave
(4440XP,3480ms). Progress counts one further settled wave with no retained
observation:678 counted versus677 retained/journaled overall. The last full save
is **before admission124, after preparation**, not the actual stopped state.
The actual stopped snapshot, native `result.json`, terminal record, prepared
save and native after-manifest are missing. No final stopped level is asserted.
**Level47 is not demonstrated and no boss diagnostic ran.**

## Readback and limits

Corrected `readback.json` passes source/hash custody, exact v32→v33 migration,
123 complete joins, XP/level grants/spending, item/currency/material conservation
and explicit partial124 reconciliation. The reader imports no gameplay module
and replays no combat. Initial readers/failures remain retained as
`readback-initial.py`, `readback-initial-failure.json`, `readback-second.py` and
`readback-second-failure.json`.

Its pass validates retained evidence only: `nativeStatus:supervisor-stopped`,
`targetEarned:false`, `actualStoppedSaveMissing:true`, `balanceAcceptance:false`.
It does not turn a stopped pilot into a completed progression proof. No rerun,
extended allowance, boss victory, statistical balance or30–50active-hour pacing
credit is granted. Historical14/14Normal/210contexts/formal0/210 stay unchanged;
full privatev1 remains active and unfinished.

For future independently authorized diagnostics, reserve finalization time
inside the hard watchdog and reduce repeated equipment receipt size. This
closeout changes no runner, production behavior or past executed artifact and
requires no tests or gameplay replay.
