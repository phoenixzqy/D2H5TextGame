# Javelin earned recovery reaches Act II

Private v1 remains incomplete. The retained fresh pilot now has an earned
successor at level 15, normal encounter ordinal 151, in Act II Dry Hills. No
opening replay, seed override, granted resources or paid preparation was used.

The first continuation started from the exact level-9/ordinal-74 save. It won
49 Blood Moor areas, earned level 12, used one native free skill reset, and
cleared the Den, Cold Plains and Burial Grounds before losing at Dark Wood.
Its 53 admissions/163 waves/one defeat and all economic, quest, point, clock,
export and training checks reconcile.

The next continuation used the same saved Dark Wood defeat. The route runner
now accepts a validated retained failure and resumes only remaining areas.
It refuses inconsistent quest, encounter-counter, location and route state
before mutation. Recovery keeps the existing two-cycle, twelve-admissions per
cycle, twenty-total and level-14 limits.

Eight Burial Grounds wins earned level 13 and a successful Dark Wood retry.
An Andariel defeat then led to five Dark Wood training wins, level 14 and a
successful Catacombs retry. Sisters was claimed once, unlocking Act II.
Dry Hills training made eight admissions: three wins and five defeats, earning
level 15 before the three-consecutive-loss stop. Far Oasis was not admitted.
Those defeats ended with 237–246 mana; this trace does not establish a mana
shortage. The new segment contains 24 admissions, 108 waves, six defeats,
182910 earned XP and 644917.249 ms of combat, taking 32.22 seconds in the runner.

BUG-561 corrected an exact-equality audit of differently accumulated
floating-point durations. Its regression failed before the fix and rejects a
one-millisecond discrepancy after it. Only one nanosecond of comparison noise
is allowed; combat-budget and admission limits stay exact. The original native
receipt preserves both audit errors. Readback passes training/recovery/quests,
export, ordinal and clock checks without new combat; economy had already passed.

Validation: 48 affected recovery/dispatch checks and nine Javelin checks pass,
with scoped strict types and explicit lint. These orchestration fixtures do
not establish earned viability. No unaffected build, later act, broad suite,
browser or CI replay was performed. Production and game data remain unchanged.

The complete retained chain contains 151 admissions, 430 waves and ten defeats.
Full balance acceptance, representative earned campaigns, disjoint holdouts,
14-build/five-act pacing, economy/retry/manual-idle integration and final gates
remain open. Browser works; CI is excluded; no user answer is pending.

Evidence is retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-javelin-opening-continuation-v1.json`,
`p15-javelin-route-continuation-v2.json`, their policies/drivers/journals,
`p15-javelin-route-continuation-readback-v1.json`, focused test reports and
`p15-campaign-harness-source-audit-v6.json`.

Next: inspect the exact level-15/ordinal-151 save for bounded, safer native
training and continue the existing Act II quest prefix. Keep all failures;
do not repeat Act I. Integrating the proven opening acquisition into the fresh
Javelin runner also remains unfinished.
