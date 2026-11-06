# Intended Double Throw: priority correction and Normal completion

Status: preparation defect fixed locally; earned five-act Normal completion
reconciled, 2026-11-04. Full private v1 and wider acceptance remain incomplete.

## Established cause and change

The [previous checkpoint](p15-double-throw-act5-checkpoint.md) stopped at
Crystalline Passage714 wave1. Retained events show 11 of12 Find Potion casts
consumed a turn while Double Throw was ready and affordable. The shared
`earnedDoubleThrowProfile` preparation placed recovery ahead of the learned
primary at growth and area boundaries. Find Potion eligibility agrees with the
[D06 contract](../decisions/D06-find-potion-v1.md); engine eligibility and damage
formulas are unchanged.

One isolated recorded-wave diagnostic changed only those priority entries,
keeping seed, equipment, ranks, resources and enemies: player victory at
51211.8780789454ms, hero1612.24HP/450MP, no survivors. No baseline replay, native
admission/reward or balance credit. Diagnostic closure SHA256
`e627ff34458824578d953c8cba5954152df50ee2a631bb1614357f913909ec0c`.
The diagnostic is closed and must not be replayed.

`tests/campaign/throw-progression.ts` now places Double Throw before Find Potion,
preserving buffs, useful recovery before fallback and the paid early bridge/reset.
Six new native-delivery regressions cover levels11/12/49 plus ready/cooldown/
low-MP actions; six selected existing reset checks also pass. Final result:
**12passed/182unrelated skipped**; strict scoped types and explicit two-file lint
pass. Original fixture corrections/RED failures and default-ignore lint failure
remain retained. No engine/data/UI change, broad suite/build or earlier-act replay.

## Earned suffix

The actual49/next715 native save is authenticated against the original report,
journal, readback and closure. The canonical `resumeActFiveMain` carries13ActV
and13earlier actions separately. The frozen bound permits one corrective
Crystalline admission after the established fix, then first Ancients/Throne only
on victory; stop first nonwin. No farming/training/extra retry/controller renewal.
Original ActIV706–708 draws and all preparation limits remain spent/closed.

All **21waves win**: Crystalline715(6), Ancients716(7), Throne717(8).
Terminal **level50/next718**. Six new quest actions finish all19ActV actions and
five main claims; source-bound potion/scroll, receipts, Baal title and Nightmare
unlock reconcile. Earned deltas:1029912XP,202added items,106salvaged,0socket
insertions. Two recorded merc deaths and one wave without the merc are preserved;
no cross-wave resurrection. Normal completions now **7/14**: Corpse/Bone,
Summon Necromancer, Fire Druid, Fire Sorceress, Bow Amazon, Traps Assassin and
Double Throw. **14/14** cleared ActI; formal balance **0/210**, not failed tests.

Combat498536.77873636724ms, driver5964.045967999999ms,
launch11103.938477113843ms. Cumulative718admissions,
41068937.24463572combatms,436593.143203driverwallms and
480966.05435200036executionwallms fit the unchanged1800admissions/
216Mcombatms/1.5Mexecutionwallms envelope. Diagnostic/preparation/check costs
are separate, including the failed preflight; no closed allowance renewed.

The first no-gameplay preflight caught an evidence-shape mismatch: Throw's
predecessor closure uses `verifiedArtifacts`/`readbackSha256`, while the adapted
Bow driver expected top-level receipts. Failed v1 plan/source/check evidence is
retained unchanged. v2 validates the actual schema, passes scoped driver checks,
five negative accounting controls and native preflight, then launches gameplay
once. No admission/action was repeated for the correction.

## Verification and retained evidence

A separate Python retained-output reader passes exact native exports, ordered
item custody, currencies/materials/XP/points, living party/resources, all quests,
clocks/seeds/ordinals and authored area projection. Source/capture review is local,
not independent final balance acceptance. No population, pacing, matched-level,
whole-app or full-v1 credit beyond the demonstrated earned route.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Successful suffix prefix `p15-throw-post-priority-act5-suffix-v2`;
failed preflight prefix `p15-throw-post-priority-act5-suffix-v1`;
regressions `p15-throw-priority-fix*`;
closed diagnostic `p15-throw-crystalline-order-diagnostic-v1`.

| Artifact | SHA256 |
| --- | --- |
| Native export | `445c67a10749feb2d6df47639b5822c597e445fc51372dea06b2ae6bc253843a` |
| Report | `f94b1a6af51caeaacbe6aea86c920e466f9460f86ab8db9692e0331be0630a35` |
| Journal | `896c2a6db065654a609e5a02a46ec90f085257c1e7beefc7f77592162aed8f87` |
| Plan | `3abe6a36f518051a446bbfa1291ca2a15470332acab7f945c4678114caa7adaf` |
| Reader | `70180c34b4ed6bb4b757e800bc550eb94f383afb24114efcf7dc1673109ee1bc` |
| Readback | `29e611bb9b03c7f7562692944c81d86eebbb05b946a8d05ec9a5094dc547e0f7` |
| Closure | `ba1f6c4cb0c35daacac3a71d8228aa5cbd57cbf73c6f07aaaf60287fbec78042` |

Closure verifies2204production/134campaign inputs, all34recorded task PIDs absent
and exact runtime caches/compiler configs absent. Remaining disposables[] and
cleanup failures[]. Root retains this required external packet/source/history and
the claimed human2 worktree through umbrella review; root owns eventual cleanup
and release. No new agents, dependencies, CI, commit, push or publication.
Browser works; no pending answer/external blocker. Human extended playtest remains
reserved for the user after implementation.

Remaining seven intended routes: Cold Sorceress, Summon Druid, Holy Bolt, Zeal,
Double Swing, Javelin Amazon and Martial Assassin. Acquisition/economy/pacing,
higher difficulties/endgame integration, wider accessibility/performance/PWA
and final review also remain; do not renew exhausted route/diagnostic budgets.
