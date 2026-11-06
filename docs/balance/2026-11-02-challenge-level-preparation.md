# Whole-challenge preparation — 2026-11-02

Status: evaluation policy implemented; one Bow Act II continuation completes.
Full private v1 remains unfinished; accepted balance remains 0/210.

The [new explicit policy](../plans/decisions/P15-challenge-level-preparation-v1.md)
prepares for the highest enemy level in the whole native challenge, including
later waves and bosses. Current Act II targets are 18/20/22/26/28/32. The previous
area-entry policy ignored later-wave offsets. This corrects evaluation preparation;
no damage coefficients, game data or production gameplay changed in this increment.

Six campaign files implement the opt-in mode, controller, audit and CLI selection.
55 distinct affected cases pass across the retained runs; three initially incorrect
level expectations failed and were corrected against the native half-spread formula.
Scoped strict types and explicit lint pass. No unrelated suite or campaign replay.
The frozen source retains 2,141 production and 107 campaign inputs; authored data
and the managed Bow profile remain unchanged.

One declared branch starts from the authenticated managed pre-claim Act I source,
level 13/nextNormal 116. It earns level 14 in 17 admissions, claims the Act I reward,
then completes six Act II areas using native training, gear and quest actions.
This reuses the earned prefix; it is not a new fresh campaign or population sample.

| Area | Entry level | Route ordinals and outcomes |
| --- | ---: | --- |
| Rocky Waste | 18 | 179 win |
| Dry Hills | 20 | 215 loss, 216 loss, 217 win |
| Far Oasis | 22 | 261 win |
| Lost City | 26 | 386 loss, 387 loss, 388 win |
| Arcane Sanctuary | 28 | 424 win |
| Tal Rasha’s Tomb | 32 | 522 win |

Totals: 407 admissions, 2,131 waves, 2,124 wins and seven defeats; 4,834,990 XP,
21,240 acquired items and 20,228 salvaged items. Terminal level 32/nextNormal 523.
The Act II controller records 380 training admissions, three training defeats and
10 route attempts. No training occurs between route retries. All historical failed
branches stay retained and exhausted; this branch has a separate declared policy.

Combat duration is 18,377,117.0208338 ms (5.105 combat hours); external process time
is 223.883630 seconds. Neither is observed active-player pacing. Independent journal
readback verifies complete ordered item custody, currency/material/XP conservation,
advancing native seeds/clock/ordinals, per-wave rewards, exactly-once quest claims,
consumed quest items, native export/decoded snapshot equality and all declared bounds.
254 staging transfers and 11 successful retrievals retain 153 backpack-full refusals.

The first independent reader rejected legitimate negative-zero gear scores. Its
failure is retained. The corrected reader accepts only the native nonfinite tags
actually present (-Infinity and -0); all substantive assertions are unchanged.
Complete readback passes without replaying combat or changing the gameplay record.

Evidence root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Index: `p15-challenge-level-closure-v1.json`; gameplay/readback prefix:
`p15-bow-challenge-act2-v1`. Both exact collector/run caches are absent and all
consumers are terminal. Root retains required evidence and the claimed worktree
through umbrella review and owns eventual cleanup/release.

Remaining: intended-power/acquisition policies, 14 fresh build populations and
holdouts, funding fairness, recruitment/Hell economics, retry/manual-idle,
30–50 active-hour calibration, BUG592 performance, integrated G0–G7, two-hour
soak/review and later owner playtest. Browser works; CI excluded; no pending answer.
