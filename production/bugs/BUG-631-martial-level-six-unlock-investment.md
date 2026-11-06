# BUG-631 — Reserve Martial points for level-six unlocks

Status: Fixed/verified for the declared Act I route (uncommitted working tree). Severity: Medium. Owner: root (campaign policy).

## Accepted integrated correction — 2026-11-03

[Final evidence](../../docs/balance/2026-11-03-martial-finisher-investment.md):
paid prerequisite/Web, unlock reservation and early Talon investment together
complete the predeclared one-route Act I criterion. Eight affected checks,
scoped strict types and explicit lint pass. One fresh native campaign completes
at13 with117admissions/351waves/350wins; full journal/save/economy/clock/payment
readback passes without combat replay. A transparent125→131manifest supplement
repairs six omitted evidence inputs; original records/failure remain preserved.
No production change or later-act/population acceptance. The earlier failed
trial below is retained as history; its rejection is not reversed.

## Trial result — candidate rejected and restored

[Recorded result](../../docs/balance/2026-11-03-martial-unlock-investment.md):
seven affected checks/scoped types/explicit lint pass, including native paid
Burst casting. One declared campaign stops at6 after44admissions/52waves/
50wins/two defeats, with no boss entry. The full independent native-save/
journal/economy/training/point readback passes. Missing unlock investment is
real, but correcting it does not meet the frozen Act I adoption criterion.
Both campaign files are restored to exact pre-trial bytes; this bug stays open.
No additional run, limit extension, production tuning or seed search follows.

## Reproduction

Working-tree build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, source pinned
by `p15-martial-unlock-v1-baseline.json` in the root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Native Node campaign in WSL; browser/viewport/locale do not apply.
Creation timestamp `1793469600000`; final Blood Moor admission45 seed
`999172032`. Retained report/journal:
`p15-first-entry-intended-act1-v1/assassin-martial-intended-v1.json`
and `.json.journal.jsonl.gz`.

1. Grow `assassin-martial-intended-v1` consecutively from level1 through6.
2. Observe the paid Talon ranks at4–5 and remaining points at6.
3. Inspect the retained Den40 wave3 and Blood Moor45 wave3 defeats.

Expected: preserve the declared early rank1 foundation and reserve points for
both Fists of Fire and Burst of Speed at their level-six unlock.

Actual: Talon12 at1 consumes levels4–5; the sole level-six point buys Fists1.
Talon3/Tiger1/Claw1/Fists1 and starter Shock Web1 leave no Burst or spare point.
Neither defeat casts Burst; the last enters141Life/114Mana and casts Fists14,
Talon3. This establishes missing unlock investment, not the sole defeat cause.

## Proposed correction and verification

Gate only the later Talon12 and Tiger8 targets at6 instead of1. Tiger must also
be gated because it would otherwise consume the freed points. Retain the
separate rank1 targets, original final ranks, stats, rotation and native limits.
Sequential/batched native growth must preserve two points at5, learn/cast Burst
at6, conserve points without reset, and retain final targets through80.
One prospective native Act I campaign; retain on independently reconciled
completion, otherwise restore exact two-file baseline. See
`p15-martial-unlock-v1-plan.json`. No production balance changes.
