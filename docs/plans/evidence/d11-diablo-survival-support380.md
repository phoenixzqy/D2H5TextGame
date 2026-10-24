# D11 — Diablo survival, crafting and mercenary support diagnosis

2026-10-24; production mechanics `a1c5bfc`. Root diagnostic execution and
self-audit; no independent acceptance or earned campaign action.

All six frozen policies start from the exact genuine through379 save, SHA256
`b0972bad81133bba925939ed6c412307e2338df2e65795a2f6b48fa70735a64f`.
They require26/32 full Chaos clears and12/16 second-half clears, followed by
the same thresholds in River. Every policy fails Chaos, so River is not run.
Each two-policy screen uses a new frozen32-seed paired set. No failed build is
applied to the genuine character; no thresholds or combat numbers are changed.

| Diagnostic policy | Chaos clears | Final Diablo draws | Diablo HP remaining |
| --- | ---: | ---: | ---: |
| Owned survival gear, retained stats | 0/32 | 32/32 | 6049–8218 |
| Owned survival gear, balanced stat reset | 0/32 | 32/32 | 9681–11639 |
| Strength + defensive sockets, survival floor80 | 0/32 | 32/32 | 4915–8275 |
| Strength + defensive sockets, survival floor160 | 0/32 | 32/32 | 5241–7746 |
| First crafted build + Holy Freeze | 0/32 | 32/32 | 5230–7229 |
| Second crafted build + Holy Freeze | 0/32 | 32/32 | 5080–7245 |

All192 projections reach Diablo and survive the60-second cap. This establishes
that the inspected survival solutions still lack finishing damage/time; it
does not establish a global balance defect or a globally optimal build.
Some policies also finish with little Mana. The unsupported priority-only
hypothesis remains ruled out by the previous diagnosis.

Crafted hero copies use exactly one earned Amn, one Tir and two Nef. The
selected two-socket owned Long Sword becomes Strength. Native socket previews
select gear, then actual prepare/preview/execute material actions construct
the diagnostic stores, asserting exact costs and action ordinals. Explicit
slot transfers and stat/skill allocation use native store APIs.

The handoff summary's claim that only one mercenary is owned was incorrect.
The genuine export owns eleven; the original level26 Rogue is fielded. None
is deleted, reset or overwritten. The ordinary Mercenaries screen exposes
Holy Freeze as a free level12 hire; the level31 hero is eligible. Diagnostic
copies append the fresh level12 hire, preserve all eleven existing mercs,
equipment and XP, and equip only legally eligible unused owned backpack gear.
The additional native crafts cost five Nef and one Shael, within actual
holdings. Eligibility uses the native item/base requirements, not the dropped
item's displayed level. Holy Freeze remains alive at the end in64/64 runs,
yet neither policy qualifies. No real hire, craft, reset or point spend follows.

The [audited archive](fixtures/diablo-survival-support380/manifest.json) retains
all policies, scripts, paired seeds, results, original logs and diagnostic-only
prepared snapshots. The [summary](fixtures/diablo-survival-support380/summary.json)
checks all192 terminal results. All911 frozen source/config hashes match the
historical mechanics; the later mercenary UI change is separately identified.
These snapshots must never replace a genuine campaign save.

Next is bounded earned River farming using the unchanged genuine build toward
the authored Act IV level band, rather than more variants of these failed
level31 policies. Diablo375 remains a loss, Act V remains locked, and C2–C4,
all213-skill acceptance,30–50-hour pacing and fullG0–G7 remain incomplete.
All screen processes are terminal. Root retains raw evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/survival-preparation380`
through campaign/full-v1 consumers and then removes exact task-owned paths.
Disposable build/cache cleanup is recorded in the subsequent slice's cleanup
receipt. Work remains local; the goal and claimed worktree remain active.
