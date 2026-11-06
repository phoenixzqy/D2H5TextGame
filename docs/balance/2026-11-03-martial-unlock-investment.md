# Martial unlock investment trial — 2026-11-03

The two-gate Martial allocation candidate is rejected and restored. It learns
and casts Burst of Speed, but the one prospective native campaign still stops
at level6 before clearing the Den. This is evidence against treating missing
Burst investment as a sufficient progression correction, not an accepted fix.

## Change and focused checks

[BUG631](../../production/bugs/BUG-631-martial-level-six-unlock-investment.md)
records premature Talon investment and the second eligible sink, Tiger Strike.
Only the later Talon12/Tiger8 targets changed from level1 to6. Early rank1,
final ranks, stats, rotation, gear, training and reset allowances were preserved.
Sequential/batched cases reproduced Talon3 at5 before the fix. The separate
cast case initially used an overlong fixture name; its corrected RED reproduces
Burst rank0. Both original logs are retained.

Seven affected cases then pass: sequential/batched payments through80, held
points at5, Fists2/Burst1 at6, native buff projection/cast with mana payment,
idempotence, unchanged other save domains, original final ranks, existing
Martial signatures/growth and registry validity.122unrelated cases are excluded.
Scoped strict TypeScript and explicit zero-warning ESLint pass. Supplied test
XP establishes allocation only, not earned progression or balance.

## One native campaign

The plan fixes creation timestamp1793469600000 and the existing level-training,
Act I recovery and Den acquisition limits. Retention requires Act I completion
and full independent readback. No retry, extension or seed search was used.

| Observation | Result |
| --- | --- |
| Technical / gameplay result | Completed measurement / nonwin |
| Terminal level / next ordinal | 6 /44 |
| Admissions / waves / wins / defeats | 44 /52 /50 /2 |
| First failure | Den40, wave3, enters137Life/115Mana; dies at6800ms |
| Recovery | Blood Moor41–42 win;43 loses wave3; retry-limit stops |
| Final failure | Enters165Life/115Mana; dies at22500ms with four living enemies |
| Final-loss actions | Fists10, Burst2, Talon3 |
| Final-loss minimum Mana | 104; no resource starvation |
| Boss entry / Den acquisition | Neither reached |
| Logical combat / native driver / launcher | 877876.778849156ms /5441.780507ms /18480.808317ms |
| Earned XP / items added | 14990 /342 |

The retained failures contain Burst casts; the final hero has Fists2/Burst1/
Talon1/Tiger1/Claw1 and starter Shock Web1. Thus the intended unlock occurs,
but it does not supply enough survival/throughput for this route. No causal
balance or population conclusion follows from this single history.

The independent Python reader reconciles all admissions, seeds, clocks,
training transitions, full terminal save, item payload custody, XP/currencies/
materials and five stat/six skill payment transitions without combat replay.
Its original no-acquisition assertion expected null; source returns an empty
zero audit. Corrected reader v2 checks that exact audit and absence of Den
farming. Both readers and the original failed receipt remain retained.
It does not independently recompute damage/drop laws, point grants or derived
stats, or establish typical acquisition, browser persistence, decision-adjusted
pacing, holdouts or population acceptance.

## Restoration and handoff

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Exact authorities: `p15-martial-unlock-v1-plan.json`, `*-baseline.json`,
`*-source.json`, `*-rollback.json`; candidate/baseline files are retained there.
Report/journal: `p15-martial-unlock-native-v1/`; independent readback:
`p15-martial-unlock-readback-v2.{py,json}`. All2151production and131campaign
inputs authenticate against the exact restored baseline. Native processes
1323424/1323426/1323438 are terminal; the exact disposable scoped type config
is removed and absent. No task cache or cleanup failure remains. Root retains
the required packet and claimed human2 through umbrella review and owns their
eventual cleanup/release.

BUG631/611/592 and full privatev1 remain incomplete; formal balance0/210 means
14builds×5acts×3encounter roles (trash/elite/boss), not difficulty levels.
The main Corpse/Bone75/NormalV19-of-19/next1658 and accepted Bow/Fire/Throw
successors are unchanged. Next inspect Martial charge/finisher eligibility in
the retained failure before selecting another correction; do not rerun this
closed trial. Browser works/CI excluded/no pending question or external blocker.
No agents/install/commit/push/publication.
