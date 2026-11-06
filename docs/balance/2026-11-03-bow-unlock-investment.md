# Intended Bow unlock investment — 2026-11-03

The intended Bow policy now defers Critical Strike20 from level1 to20 while
retaining its early rank1. One prospective native campaign completes Act I at13.
This repairs premature passive investment; no production formula, item, stats,
rotation, equipment policy, training limit or other build changes.

## Diagnosis and change

The original intended cohort stopped at6 with Magic Arrow1, Critical Strike4,
Inner Sight1 and Multiple Shot1. Its paid level3–5 points went into the later
critical cap, leaving no Dodge point at6. The last loss (Blood Moor44 wave3)
enters162/210Life and25/92Mana. This evidence establishes the allocation problem,
not the sole cause of defeat. Existing continuous-growth Bow already defers its
critical cap to20. The intended policy adopts that one level gate, preserving
its original final ranks and bow identity. See [BUG630](../../production/bugs/BUG-630-bow-premature-passive-investment.md).

## Verification

Two new sequential/batched native-growth cases fail before the JSON edit on
premature Critical Strike ranks. After the change, six affected cases pass;
120 unrelated cases are excluded. Scoped strict TypeScript and explicit ESLint
`--no-ignore --max-warnings 0` pass. Tests verify three held points at5,
Multiple Shot3/Dodge1 at6, native passive projection, no reset, exact point
payment, monotone ranks, original final ranks through80, idempotence and
other-domain equality. Supplied test XP proves allocation only.

The prospective plan freezes one fresh native campaign at creation timestamp
1793469600000, using existing level-training, act1-training and bounded Den
acquisition. The adoption criterion requires independently reconciled Act I
completion. No additional candidate, native rerun, seed search or controller
extension was used.

| Observation | Result |
| --- | --- |
| Terminal state | Act I complete, level13, next ordinal117 |
| Admissions / waves | 117 /351 |
| Victories / defeats | 350 /1 |
| Den acquisition | 61 full wins, level6→12, ordinals41–101 |
| Retained defeat | Dark Wood105, wave5 |
| Existing recovery | Nine cleared Cold Plains admissions106–114 earn13 |
| Dark Wood retry | 115 wins |
| Catacombs | First admission116 wins all six waves |
| Final investment | Magic Arrow1, Critical Strike1, Inner Sight1, Dodge1, Multiple Shot11, Slow Missiles1; no spare points |
| Logical combat | 3,791,831.2312231716ms (~63.2minutes) |
| Native driver /launcher | 24,104.07801ms /37,120.13143580407ms |
| Earned XP /items added /removed | 222,886 /3,405 /3,258 |

Hero casts include1,067Multiple Shot and134Slow Missiles. Both Act I quest
rewards are claimed; original reset allowances remain. Human decision time is
unmeasured, so logical combat does not establish30–50-hour pacing.

The separate Python reader passes without replaying combat. It reconciles the
complete terminal native save/journal, admissions/seeds/clocks/costs, item payload
custody, XP/currency/material balances,12stat and15skill allocation transitions,
training accounting, and zero victory income on the retained defeat. It also
checks no pre20critical investment above rank1. Limitations: no independent
damage/drop-law, derived-stat or point-grant-provenance recomputation; no full
bag/per-slot transfer history, typical acquisition, browser persistence,
decision-adjusted pacing, holdouts or population acceptance.

## Authorities and retained artifacts

Root-owned packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Plan/check/source/closure prefix: `p15-bow-unlock-v1-*`;
report/journal/checkpoint/export directory: `p15-bow-unlock-native-v1/`;
independent reader/result: `p15-bow-unlock-readback-v1.{py,json}`.
Source authority SHA256 `7f79bf2373be179dc955608e292010f0347424a6a1299e9a1c15b5a66296e3c8`.
All2,151production inputs remain unchanged, tree
`3d965a5eb1179cf546d6ec3bc2bc7be51d5b838bc2e25efb68a8aeaba40bf850`.
Of131campaign inputs, exactly `intended-growth-v1.json` and
`intended-growth.regression.test.ts` change. Closure verifies the exact one-field
JSON delta, final source equality, all three native processes terminal, and the
external disposable type config absent. No cache or cleanup failure remains.
Required evidence and claimed human2 remain retained through umbrella review;
root owns their eventual cleanup/release. No agents/install/CI/commit/push/publication.

Separate earned Bow successor:
`p15-bow-unlock-native-v1/amazon-bow-intended-v1.native-export.json`,
99,321bytes, SHA256 `c55f62c61e47ef8edd4e634051b346583f7a308177ee42a6c092a13ca6e356e2`.
It does not replace the main Corpse/Bone successor75/NormalV19-of-19/next1658.

BUG630 is fixed/verified for this declared route in the uncommitted working tree.
BUG611/592, representative intended-build progression/populations/holdouts,
pacing/economy/recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining
Hell/endgame, integratedG0–G7/review/soak/later owner playtest remain. Formal0/210
is unchanged. Next inspect Javelin/Martial/Zeal/Traps retained failures before
selecting another bounded correction; no completed-build or earlier-act replay.
Browser works; no pending question or external blocker.
