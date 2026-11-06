# Owned Bow defense diagnostic — 2026-11-02

Status: policy implemented locally; fresh pilot failed. Full private v1 remains
unfinished and accepted balance remains 0/210.

The opt-in `amazon-bow-survival-owned-v1` policy uses the existing native owned
survival selector for hero then merc while Act II is the latest unlocked act,
including returns to Act I training. It preserves the original survival profile,
weapon/attack/speed floors and min(entry mana capacity,150). It introduces no
purchases, sockets, healing, grants or engine/data changes. The shared Act II
threat probes are unchanged; this is a declared evaluation policy, not an engine
balance fix. See [contract](../plans/decisions/P15-bow-owned-survival-v1.md).

Five new cases pass on the final files, including actual hero/merc stash transfers,
no income/healing, bow retention, idempotence and inactive stages. Together with
the retained affected runs, 93 distinct assertions have passing evidence; this is
not a claim that one 93-case final run passed. Scoped strict types and explicit
`eslint --no-ignore` pass. Earlier fixture/boundary/lint failures remain recorded.

Authority69 freezes 2,141 production and106 campaign inputs. Exactly five campaign
inputs change from67; production, authored data and the old survival profile are
unchanged. Authority68 records the intermediate pre-lint files and was not used
for gameplay. Both exact collector caches are removed and verified absent.

The fresh pilot uses the same predetermined creation clock1793304000000 and native
advancing seeds, existing admission/training/wall budgets, and terminal route loss.
It is separate from all previously exhausted histories. It records134 admissions,
419 played waves,417 wins/two defeats,264,620XP,4,135 acquired/3,899 salvaged items,
and4,407,370.808892848 simulated combat milliseconds. Terminal level14/nextNormal134
loses Rocky Waste133 wave4. There are no engine exceptions, unobserved or unmeasured
waves. This policy did not improve the declared diagnostic; it is not promoted
to the standard Bow policy or population acceptance.

Independent readback covers all419 summaries, advancing clocks/ordinals/native
seeds, all intrinsic items/currencies/materials/XP, zero nonwin awards, native
export/report/checkpoint equality and the actual gear transfers/resource floors.
The report and runner finish normally despite the gameplay loss. No combat replay
was used for readback. The three defensive trades are native; broader average
mitigation can still trade away lightning protection, and changed combat clocks
produce different native seeds. One pair cannot establish a population regression
or justify an invented damage/targeting/mercenary/paralyze fix.

Evidence retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-bow-owned-fresh-act2-v1-plan.json` (SHA256
`28022a8a5ad46ea096caa739cc5c74630a0ebe31c568ba179431f78f8a28c305`),
`p15-bow-owned-fresh-act2-v1/amazon-bow-survival-owned-v1.json` (SHA256
`7238304c250ad9bee2aec35d21f2d169d8b286f6e07e04a889f4ee03d258798e`),
its journal (SHA256
`05436abf0aefafff2a3453673ad8cf52f8861bf3f9302b2010a1cbe947fd34e2`),
`p15-bow-owned-fresh-act2-v1-readback-v1.{py,json,log,exit.json}`,
`p15-bow-owned-{before-manifest,after,green,types,lint,source}` evidence,
and `*-rocky-wave4-diagnosis-v2.json`. The v1 wave diagnostic used incorrect
nested-stat/damage keys; its zero-damage display is invalid and superseded.
All drivers/checks are terminal; required evidence/worktree remain with root
through umbrella review. No source clone edits, installs, commits or publication.

Next address BUG592 using existing browser profiles, then continue build cohorts,
funding/recruitment/Hell economics, retry/manual-idle,30–50 active-hour calibration,
integrated G0–G7, two-hour soak/review and owner playtest. Historical clears do not
accept current populations. Browser works; CI excluded; no pending user question.
