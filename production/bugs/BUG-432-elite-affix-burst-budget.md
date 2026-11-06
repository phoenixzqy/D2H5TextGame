# BUG-432 — Bound elite spell concurrency and rare burst damage

Status: fixed locally; full campaign and independent balance acceptance pending.
Severity: High (early earned challenge progression).
Build: b5a0898 plus uncommitted private-v1 work, WSL/Node24.21.0; locale independent.
Seed: Date1793304000000, native Den ordinal40/runSeed2494876480, actual wave
seeds176403185/2832873506/1309845075. No manually selected native seed.

1. Follow retained fresh cold preparation:40native BloodMoor W1 wins toL6,
   legal skill/stat allocation and earned hero/merc gear.
2. Enter Den through native admission and settle each wave once.
3. W2 leaves77/180heroHP; W3 loses at5400ms. With the existing Nova5 policy and
   hero-only gear, W2 leaves24HP and W3 loses at1735.294ms.

Expected: earned recommended L4–6 early challenge supports recovery/advancement
with a combined spell/physical burst budget suitable for carried party health.
Actual: four rare affix casters multiply a single group's spell source; native
L7rareDarkOne124Attack/native1.5× crit produces125 through actual61Defense,
exceeding the77HP carried from W2. An ordinary63damage hit plus that critical
exceeds full180HP; a critical alone does not one-shot a full-health hero.
No missing recovery or mana shortage was found. All original failures retained.
Affected systems: planner/content/balance/QA; root sole writer.
Authority: [tuning contract](../../docs/plans/decisions/P15-elite-affix-burst-v1.md).
Evidence: retained packet p15-den-{cause,chain,tier,affix,affix-attack,minimal-tier}
studies and native-preparation-v2; original historical reports remain intact.
No all-class impossibility or campaign/pacing signoff is inferred.

Fix: shared rare/minion Attack1.5/1.1 and first-member-only Act I promoted affix.
Regressions: `src/engine/combat/elite-pack-budget.test.ts`, existing planner and
literal tier consumers. Corrected RED8FAIL→combined480PASS, strict types and
scoped lint/build pass. Earned Den recovery and two production browser contexts
pass after the separate companion fix. See
[evidence](../../docs/plans/evidence/p15-elite-burst-budget.md). No commit created.
