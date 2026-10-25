# D04 — Double Swing's missing second attempt

2026-10-25; [BUG214](../../../production/bugs/BUG-214-double-swing-single-attempt.md).
Root author investigation only; independent and earned acceptance remain open.

Actual native L30 Barbarian composition, including Bash1 prerequisite, selects
the real learned Double Swing at ranks1/2/20 ×seeds7/19/41/97 ×one/four enemies.
Synthetic100MP/100000HP, one1700ms hero action and subsequent holds isolate a
single paid cast. All enemy positions use the valid three-column grid:
`(floor(i/3),i%3)`. Inputs remain immutable and same-seed recordings agree exactly.

Each of24cases pays10MP once, ending at90MP, and acts once. All12single-enemy
cases resolve one attempt rather than two. All12four-enemy cases resolve one
attempt on each of the first two enemies, none on the remaining two. The real
registered effect has Physical40–60/+4rank, but no hitSequence, aoeShape or
maxTargets. Both existing locales promise two cleaving swings and up to three
enemies. Actual HP loss and complete events are retained; misses count as
attempts. No guaranteed hits or damage multiplication is inferred.

The first probe put its fourth enemy at column3, outside the standard
three-column arrangement. Source review shows `isValidGridPosition` accepts
nonnegative coordinates without a column cap; that position is not invalid to
the engine. The corrected24case run uses the standard layout to remove geometry
ambiguity. Both scripts/observations/terminal receipts are retained. The
corrected run intentionally exits1 after saving observations; runtime7.352s.
Do not treat that expected assertion failure as a passing suite.

The [Leap raw packet](fixtures/leap/raw.tar.gz) retains `double-swing-repro.ts`,
`double-swing-observations.json`, `double-swing-repro-corrected.ts`,
`double-swing-observations-corrected.json` and both `next-double-swing*` command
logs/live/terminal receipts. Source base is `059228dd` plus the frozen Leap
repair, whose exact committed bytes are audited by the delivery packet.

No Double Swing source patch or inventory credit. A repeated-attempt contract
must settle the target shape/cap, original pool, per-target attempt order,
miss/death/retargeting rules and truthful bilingual previews before repair.
Genuine L33/nextNormal402/Baal uncleared is unchanged. No genuine campaign or
remote action. C2–C4/fullG0–G7/all-class earned builds/30–50hour pacing/economy/
endgame and complete privatev1 remain unfinished.
