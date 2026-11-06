# BUG-630 — Preserve Bow points for level-six unlocks

Status: Fixed/verified for one earned Act I route in the working tree
(uncommitted; no fixed commit SHA). Severity: Medium.
Owner: root (campaign policy).

## Verified resolution — 2026-11-03

Only the Critical Strike20 level gate changes1→20. Six affected cases, scoped
strict types and explicit lint pass. Native growth preserves three points at5,
then pays for Multiple Shot3/Dodge1 at6; original final targets through80 remain.
One prospective campaign completes Act I13:117admissions/351waves/350wins.
Dark Wood105 loses wave5; existing recovery earns13, retry115 wins, and first
Catacombs116 wins all six waves. Independent complete native-save/journal/
economy/training/clock/point readback passes without replay. Retain the change
under the predeclared criterion; no production balance tuning. See the
[result](../../docs/balance/2026-11-03-bow-unlock-investment.md).
BUG611 remains open for representative intended-build acquisition/populations.

## Reproduction

Working-tree build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current source
manifest pinned by `p15-bow-unlock-v1-baseline.json`. Native Node campaign in
WSL; browser, viewport and locale do not apply. Creation timestamp
`1793469600000`; final admission seed `1032359055`.

1. Grow `amazon-bow-intended-v1` consecutively from level1 to6.
2. Inspect paid ranks and the declared Multiple Shot/Dodge unlock priorities.
3. Read the retained native acquisition ending at Blood Moor admission44 wave3.

Expected: retain rank1 Critical Strike early, then invest spare points in the
newly available bow attack and Dodge before maximizing the later passive.

Actual: Critical Strike20 at level1 consumes levels3–5. At6, Magic Arrow1,
Critical Strike4, Inner Sight1 and Multiple Shot1 leave no point for Dodge.
The run stops at6 after a Den loss and opening-training retry limit. Its last
wave enters at162/210Life and25/92Mana; this does not prove allocation is the
sole cause of defeat.

## Evidence and proposed repair

Root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Report/journal: `p15-first-entry-intended-act1-v1/amazon-bow-intended-v1.json`
and `.json.journal.jsonl.gz`. Existing continuous-growth Bow already gates
Critical Strike20 at20 (`tests/campaign/profiles.ts`).

Plan `p15-bow-unlock-v1-plan.json`: defer only intended Bow Critical Strike20
from1 to20. Keep rank1, all original final targets and native payments; verify
sequential/batched growth and one bounded earned Act I campaign. Retain only
on independently reconciled completion; otherwise restore exact baselines.
No production formula, item, stats, recovery budget or other build change.
