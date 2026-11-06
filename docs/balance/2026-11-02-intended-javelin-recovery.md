# Intended Javelin rotation and shared Act I recovery

The intended Javelin now holds three filler points through level5 and buys
Power Strike1, Poison Javelin2 and Dodge1 at6. Its order includes Lightning Bolt,
Charged Strike and Lightning Strike as they become available. Seven affected
native allocation/cast checks pass at6/12/18/24 and sequential/batched growth.
No historical profile or production skill definition changes.

All fourteen intended profiles share `cleared-level-margin-v1`: select the
previously cleared Act I challenge with the greatest full enemy-level maximum
at most hero level minus2; break ties by canonical ID. Retain the source for
the entire recovery cycle. Stop without an admission when none qualifies.
Keep two cycles, one earned level per cycle, level14 ceiling and immediate
stop on a training nonwin; allow40admissions per cycle/80total. Historical
profiles retain latest-cleared selection and12/20limits.

Fifty distinct affected recovery checks pass across the retained42-case run
and eight newly selected cases. The new cases cover limits, all14registrations,
prior clear, level margin, wrong act, missing source and truthful no-source
stops. The latter was reproduced RED before strengthening the auditor. Scoped
strict types and explicit lint pass; lint-only callback braces were corrected.
Constructed fixtures prove policy behavior, not earned viability.

## Fresh pilot result

The v2 pilot stopped at level12 after Dark Wood and Burial Grounds defeats.
With only the shared recovery-policy change, v3 retains that Dark Wood defeat,
earns level13 through ten Cold Plains challenges, wins its whole-area retry,
clears Act I and reaches level20 in Act II. It clears Rocky Waste on the third
route attempt, then loses all three Dry Hills attempts, terminal wave3.

V3:220admissions,837waves,830wins,seven defeats,173complete challenges;
955,300earnedXP and8,342acquired items. Combat8,149,543.123ms and process63.700s
are not active-player pacing. Native casts include814Charged Strikes and3,988
Lightning Bolts. Act II defeats retain mana; they do not establish mana
starvation or a production combat defect. No further admissions on this
exhausted history are authorized by its frozen bounds.

The separate journal readback reconciles every admission seed/clock/ordinal,
settlement/outcome, zero loss rewards, XP/currency/material balance, salvage,
intrinsic item custody across owners and exact native/exported terminal state.
It does not replay bag order or every slot transfer. All2,142production inputs
remain equal to source authority76. All111campaign inputs match the v3 freeze
at readback. The original pilots and failed checks remain retained.

## Evidence and remaining work

Required packet, retained by root through umbrella review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files: `p15-intended-javelin-held-green-v1.json`,
`p15-intended-act1-recovery-green-v1.json`,
`p15-intended-act1-recovery-new-v1.json` through `-v3.json`,
`p15-intended-act1-recovery-types-v1-exit.json`,
`p15-intended-act1-recovery-lint-v2-exit.json`,
`p15-intended-javelin-act2-pilot-v3.json` and its `.journal.jsonl.gz`,
`p15-intended-javelin-act2-pilot-check-v3.json`,
`p15-intended-javelin-pilot-readback-v3.json`,
`p15-intended-javelin-frozen-profiles-v3.json`,
`p15-intended-recovery-campaign-manifest-v1.json`.
Frozen pilot rules: [v3](../plans/decisions/P15-intended-act2-pilot-v3.json).

Full v1 remains unfinished; accepted balance cells0/210. Next finish remaining
intended role rotations and shared companion/training/funding policy before
fresh populations/holdouts. Economy, retry/manual-idle,30–50active-hour pacing,
BUG592,integratedG0–G7,soak/review and later ownerplaytest remain open. Browser
works;CI excluded;no pending user answer or external blocker. All drivers are
terminal; no task-local cache/build was created. Root retains the required
worktree and packet and owns eventual cleanup/release.
