# Intended Javelin: earned Act II checkpoint

Status: partial progression verified; Act II and formal balance acceptance remain open.

The unchanged intended Javelin profile continued its independently verified Act I
export (level 14, next Normal ordinal 132; SHA256
`713d8536a8d0b61d3aad28f88b380c41080256075fca39114c3e73fd3a545da1`).
One native invocation reached level 23 / next ordinal 291. It admitted 159
challenges and settled 760 waves, all victories. Three route areas cleared:
Rocky Waste, Dry Hills and Far Oasis. The other 156 admissions were training,
including 26 toward Lost City's level-26 entry target. Training uses previously
cleared Act I and II areas; there was no repeat Act I route or Act I test suite.

Cube and staff shaft are owned, Radament's reward was claimed once, and its
Book of Skill was consumed. The exact ten-action quest prefix is retained.
The run stopped at the between-wave execution limit during training admission
290. One additional wave was staged but unplayed. The native export preserves
settled rewards and progression, not an active resumable battle; resumption must
use a new admission and retain all incurred costs and training limits.

New costs: 8,627,559.133095257 combat ms and 120,832.744844 driver wall ms
(126,382.32707302086 launcher elapsed ms), 1,394,166 XP, 7,718 added items,
7,724 salvaged owned items, and 26 socket insertions. Carried Act I costs remain
132 admissions / 3,514,234.937276794 combat ms / 33,196.145126999996 driver wall ms.
These are deterministic diagnostic costs, not player active-hour acceptance.

## Evidence and limits

Evidence root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files share prefix `p15-javelin-earned-act2-v1`: plan, driver, native report,
compressed journal, native export, process receipts, preflight, and versioned readers.
The successor export SHA256 is
`0414f8efafbba5c25ecdb80661c4a8c3b4116a4a69eefadc5e30d5eb2e57e721`.
The V2 readback (`-readback-v2.json`) passes exact exported-state equality,
ordered backpack/stash/hero/merc custody, salvage/socket costs, currencies,
materials, XP, points, original staged/settled wave identity, quest prefix,
clock/seed/ordinal continuity, and source stability. All 2,151 production and
131 canonical campaign inputs matched the pre-run manifests. No production or
canonical campaign source was changed for this run.

V1 failed because its reader assumed salvaged items must be in the backpack;
the exact item was in stash, which native salvage and the canonical policy
support. V2 changes only removal custody to require exactly one owned container.
V1 failure and the versioned amendment remain. No combat was replayed.
This reader does not independently derive damage/drop laws, spawn planning,
equipment scoring, or training-source maxima. It establishes retained-output
accounting, not population, pacing or prospective balance acceptance.

All 14 intended builds have individual Act I clears. Main Corpse/Bone remains
75 / Normal Act V 19-of-19 / next1658. Formal balance acceptance remains 0/210.
BUG611/592, later intended progression/acquisition, populations/holdouts,
economy/recruitment/fairness/adaptation/manual-idle/defeat-retry/pacing,
remaining Hell/endgame, integrated G0–G7/review/soak and later owner playtest
remain. Browser works; CI is excluded; no pending answer or external blocker.

Native process and launcher are terminal. The exact disposable compiler config
and cache were removed and absence checked. Root retains the required evidence
packet and claimed human2 worktree through umbrella review, and owns eventual
cleanup/release. Next implement the missing ten-action resume boundary and
preserve cumulative preparation limits before any new native continuation.
