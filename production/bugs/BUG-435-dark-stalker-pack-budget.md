# BUG-435 — Late Act I Dark Stalker pack exceeds earned cold-party budget

Status: reproduced; bounded numerical diagnosis in progress, no gameplay edit.
Severity: High (earned progression); no universal impossibility claim.
Build: HEADb5a0898 plus local private-v1 work, WSL/Node24.21.0.

Reproduce the declared fresh `p15-earned-act1-route-recovery-v1` policy from
packet `d2-counted-source-z3jj3xa1`: original cold allocation, earned hero/merc
gear, native Den recovery and two later training/retry cycles up toL14. Dark
Wood eventually clears. Catacombs ordinal130 W1–W4 win, W5 defeats at23860ms
from112HP with no enemy deaths, before appended Andariel W6.

Expected: within the intended Act I power/pacing envelope, ordinary preparation
supports the advertised large-pack encounters and recoverable elite failures.
Actual: twelve L18 Dark Stalkers retain all twelve living bodies. The rare
leader has1134HP/193Attack/98Defense/26MR/55elemental resistance; minions have
570–725HP/87Defense and trash297–389HP/76Defense. The earned hero has355maxHP/
138Defense, the merc126Attack. Mana remains304or higher, excluding starvation.

Exact native replay of all five Catacombs recordings matches events/outcomes.
Frozen W5 seeds0–31: actual carry0wins/30losses/2draws; hypothetical full ally
HP0wins/3losses/29draws. That hypothetical is not proposed healing or earned
recovery. A separately declared fresh Nova5 policy still loses Dark WoodW5;
a one-point Static Field counterfactual wins only1/32 and loses the original.
Neither is accepted as a remedy. All failures and raw results remain retained.

Investigate upstream authored Dark Stalker durability: high armor, all-element
resistance, HP/growth and rare multipliers combine with large native packs and
the60s battle limit. Compare single-axis armor/HP candidates in frozen combat
before choosing a change. Preserve count/level/skill/cooldown/RNG/rewards and
all friendly power; no guaranteed wins, cap bypass or favorable retry. A frozen
screen cannot replace actual earned continuation, other builds or all-act QA.
Root sole writer; CI excluded/deleted and Chromium launch resolved.


### Follow-up diagnosis

Single-wave armor25 and HP60% candidates fail the declared original+26/32
criterion (2/32 and12/32; original loss for both). Five-wave carried-resource
chains also fail (1/32 and7/32); W4 contains a different monster family. Neither
candidate is adopted. A point-conserving Nova15/Blast1 frozen chain wins18/32
prefixes and the original, motivating a separately declared fresh native-point
allocation diagnostic. This challenges allocation policy before changing enemy
power. All hypothetical studies remain distinct from earned campaign acceptance.
See `docs/plans/evidence/p15-earned-catacombs-recovery.md` and the Nova-focused
diagnostic decision for complete scope, failures and limitations.
