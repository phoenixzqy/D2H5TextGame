# Intended Double Throw Barbarian — earned Act IV failed checkpoint

The accepted [Act III checkpoint](2026-11-03-double-throw-act3-completion.md)
continues from level 47 / next Normal ordinal 677 to level 49 / next ordinal 709.
After 29 cleared-Travincal training admissions, all three permitted Plains of
Despair attempts (706–708) draw against Izual at 60 seconds. He retains
8556/9657/4863 Life respectively. The hero and Prayer mercenary survive.
No Act IV route clears or reward claims occur; Act V remains unattempted.

The 32 admissions settle 186 victories and three draws. There is no interrupted
or unplayed suffix. Earned XP 3,281,776, item additions 2,010,
salvage 2,008; no socket insertion. The native successor retains
all lawful rewards/costs and every failed attempt. Original profile, equipment
selection, Prayer and training/retry/global limits remain; no reset, earlier
route replay, additional seed, renewed attempt or gameplay-source edit occurs.

## Verification and diagnosis

Scoped strict TypeScript, explicit lint and no-gameplay preflight pass. The
separate reader frozen before gameplay passes its first readback and nine
negative accounting controls. Complete native save, ordered item custody,
currencies/materials/XP/points, quests, living party/resource continuity,
clocks/seeds/ordinals and direct authored level projection reconcile. All
2,151 production / 131 campaign inputs remain
unchanged; tree `e22230c8f60e9cbc105e894e1127c6cd4b049eab164299a4a9575884e351213d`.

Retained failures narrow the issue to throughput: hero minimum mana is 450/450/450
of 462 and Double Throw is cast 32/29/32 times. Hero direct damage is
21,288/21,468/20,418; Prayer contributes 15,780/18,666/19,662. No starvation,
party death or implementation defect is established. The authored two-attempt
Throw model, paid-rank Attack curve and Throwing Mastery's lack of a critical
bonus agree with the inspected design. No numeric fix is inferred from this
accounting. [BUG656](../../production/bugs/BUG-656-double-throw-act4-throughput.md)
records the open progression failure; attempts 706–708 remain exhausted.

New logical combat: 2556142.8068256713 ms; driver / measured launcher:
28364.714789 / 33971.98920790106 ms. Cumulative costs: 709
admissions, 39755773.739506066 logical combat ms, 418008.614374 driver ms,
446020.7703576889 measured execution ms. Original global envelope
remains 1,800 admissions / 216M logical combat ms / 1.5M execution ms.

## Evidence and cleanup

Root-owned packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`. Prefix `p15-throw-earned-act4-v1` retains the frozen
plan/driver/reader, manifests, scoped checks, single launch, report/journal/native
save, first readback, failure extraction/analysis and closure. Export is
309,442 bytes, SHA256 `7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`.
All recorded wrapper/child processes are absent; exact owned compiler config
and cache are removed and config contents/hash archived. Required evidence and
claimed human2 stay with root through umbrella review; root owns eventual
cleanup/release. No disposable task paths remain for the completed slice.

This turn completes unfinished Act III and establishes the Act IV failure.
Intended five-act completions remain three; formal balance remains 0/210.
Private v1, remaining campaigns/populations/holdouts, acquisition/economy/
fairness/pacing, broader idle/retry, performance, later difficulty/endgame,
integrated review/soak and later owner playtest remain open. Next investigate
retained Act IV throughput or another unfinished implementation slice without
replaying routes or renewing exhausted budgets. Browser works; CI is excluded;
no user answer or external blocker is pending.
