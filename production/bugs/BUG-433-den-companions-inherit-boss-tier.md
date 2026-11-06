# BUG-433 — Keep Den boss companions at ordinary tier

Status: fixed locally; full campaign and independent balance acceptance pending.
Severity: High (early challenge progression).
Build: b5a0898 plus local private-v1 work and BUG432; WSL/Node24.21.0.
Engine reproduction; locale/browser/viewport independent.

1. Follow `p15-elite-burst-preparation-v1`: fresh cold Sorceress, native earned
   hero/merc gear, forty first-wave farms to L6, then Den ordinal40.
2. Resolve native runSeed2494876480, final waveSeed3966315908.
3. Observe final encounter's three Carvers all have boss tier, Attack104,
   critDamage1.75 and boss life. The two unflagged companions inherit wave tier.
4. Hero enters at76/180HP; two ordinary43damage hits defeat her at1735.294ms.

Expected: one explicitly authored boss and two ordinary companions. Keep the
leader and the three-member roster. Use existing `boss:false` semantics already
used by Burial Grounds, Radament and the Summoner; leave engine fallback intact.
Actual: the second content entry omits the explicit flag and creates two extra
bosses. This is separate from the earlier rare/affix burst problem.

Root fix: author `boss:false` only on Den bossEncounter's two-companion entry.
Schema already permits boolean. No schema, save, factory, leader, level, count,
RNG or treasure-class change. Companion stats/XP/rewards follow ordinary tier.
Do not silently reclassify other regions' unflagged entries without review.

Evidence: retained packet `d2-counted-source-z3jj3xa1`, prefixes
`p15-elite-burst-preparation-v1`, `p15-den-boss-frozen-input-v1`,
`p15-den-boss-role-study-v1`. Study exactly replays native W4 and rebuilds the
same leader/IDs/RNG. Frozen76HP original seed still loses with ordinary companions
(3700ms), while32-seed isolated wins rise0→24. This is a role correction, not a
promise of native full clear or campaign balance acceptance.

Affected systems: content/planner/QA; root sole writer.
Plan review: ready; minimal existing content flag, RED before edit, native
earned retry and full consumer validation after. Security: pass; authorized
local gameplay work, no credentials/network/install/publication changes.

Fix: only the two-companion Den entry gains `boss:false`. Regression
`src/engine/combat/den-boss-companions.test.ts`: manual/idle RED2FAIL→GREEN,
combined480consumer cases/types/lint/build pass. Earned L6loss→five full training
challenges→L7whole-Den victory/Claim and actual earned browser retry/Claim/export/
reload pass. See [evidence](../../docs/plans/evidence/p15-elite-burst-budget.md).
No commit created; broad campaign and current integrated-suite acceptance open.
