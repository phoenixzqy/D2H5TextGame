# Current-source fresh introduction screen

2026-10-30, HEADb5a0898 + private-v1 source after BUG426. Root sole writer; retained human worktree2. Local only, no CI/owner playtest dependency.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Recipe: `p15-current-payloads-intro-v1-recipe.json`. Wrapper: `p15-current-payloads-intro-v1-run-exit.json`, exit0/216.543s, no timeout or living descendants. Per-profile reports/journals under `p15-current-payloads-intro-v1/`; execution.json preserves all14 process results. All14 technical checks completed. None cleared BloodMoor.

| Profile | Result | Combat ms | Earned XP |
| --- | --- | ---: | ---: |
| sorceress-cold | W1 defeat |6960|0|
| sorceress-fire | W1 defeat |6960|0|
| amazon-bow | W1 win/W2 defeat |10740|160|
| amazon-javelin | W1 defeat |8700|0|
| assassin-martial | W1 defeat |8700|0|
| assassin-traps | W1 win/W2 defeat |8096|160|
| necromancer-summon | W1 defeat |10440|0|
| necromancer-bone | W1 defeat |7700|0|
| barbarian-double-swing | W1 defeat |8700|0|
| barbarian-double-throw | W1 defeat |8700|0|
| paladin-zeal | W1 win/W2 defeat |12520|160|
| paladin-holy-bolt | W1 win/W2 defeat |12520|160|
| druid-fire | W1 win/W2 defeat |6354|160|
| druid-summon | W1 defeat |6960|0|

Original native runSeed2601641432, ordinal0, fixedDate1793304000000. Actual starter state, free first merc, legal allocation, no gear/XP/unlock injection or seed substitution. First BloodMoor challenge only; stop first nonwin, no retries. Export/decode round trip and native economy/quest audit retained per report. Source/data manifests and campaign file hashes unchanged within/across all14 cases. Full sourceBefore/sourceAfter equality for13; amazon-javelin differs only in Git porcelain inventory gaining prior docs/plans/evidence/p15-monster-bone-prison.md while runtime manifest stayed equal. Do not misreport that metadata difference as a production change or a failed technical test.

The input set predates any BUG427 tuning. Nine W1 failures prevent a claim that every class can earn its first power. Five W1 wins do not establish introductory affordability: all five lose the next wave. Filed BUG427 before any fix. One native stream per profile is diagnosis, not statistical balance, 14 distinct mature builds, five-act viability or pacing acceptance. No favorable reruns.
