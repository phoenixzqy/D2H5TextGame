# Javelin Act IV owned boss adaptation

Status: CONCERNS. A frozen phase adaptation improves conditional whole-area
success from 67/100 to 81/100. It also introduces regressions; no final balance
cell, chapter-boss role or three-attempt policy is accepted.

## Adaptation and controls

Continue the [owned defense/cadence study](2026-11-01-javelin-act4-owned-defense-and-cadence.md)
on the same earned level-46/ordinal-1024 source. Preserve rare arcane chest and
belt Shael through the first four recordings, nineteen earned skill points,
spear, mercenary, native carry and exact preparation costs.

First compare Impale / Lightning Strike priority against retained boss losses
4 and 7: one near-full-life entry, one low-life entry. Change the player's order
before settling already-recorded zero-based wave 3; native next-wave projection
applies it to Izual. Skills UI/store permit ordering during combat. The original
four recordings and reward semantics match exactly. Seed 4 wins with 621 HP;
seed 7 still dies, leaving Izual 7262 HP instead of the original 18402.

Freeze a second control: also equip the original Silks chest from the backpack
at that phase boundary. Inventory UI/store permit the ordinary equip action.
It raises defense 363→528 but lowers arcane resistance 45→31, physical resistance
16→9, lightning resistance 71→60 and magic dodge 10→8%. Maximum mana becomes
440; carried mana/health and cooldowns are unchanged. Spear and build stay intact.
No additional materials, currency, points, resets, healing or farming are used.

Both selected losses now win: seed 4 in 27.76 seconds with 190 HP; seed 7 in
44.87 seconds with 84 HP. Independent readers verify identical preparation,
first four recordings/reward semantics, boss enemies and carried resources.
At boss entry only owned equipment stats and skill order differ. Native equip
records authenticate the exact original item and unchanged remaining equipment.

## Frozen complete cohort

Reuse those two completed runs and add the other 98 seeds in 1–100 once.
Every start remains in the denominator; outcomes do not stop the cohort.
Native re-entry preserves private run carry; no mid-run save or combat unit is
fabricated. All projected preparation and income are discarded.

| Measurement | Result |
| --- | --- |
| Whole-area wins, old → new | 67/100 → 81/100 |
| New whole-area Wilson 95% interval | 72.22–87.49% |
| Old wins retained / regressed | 60 / 7 |
| Old losses rescued / still lost | 21 / 12 |
| Remaining losses | 13 at Izual; 6 before him |
| Successful Izual p50 / p95 | 33.83 / 44.72 seconds |
| Matched trash | Unchanged 100/100; p50/p95 19.655/23.100 seconds |

All 100 first-four-wave combat/reward comparisons pass. All 94 reached boss
inputs differ only in the declared gear stats/order; the six earlier losses
remain. Original target entries/timings and minimum mana 296 are unchanged.
This adds no trash recipe or exploration coverage. Later Izual is level 49 and
is not the chapter boss. His outcomes cannot accept the chapter-boss role.

Remaining boss losses still have no mercenary. Direct logged incoming damage
across them totals 5788 physical, 952 cold and 1665 arcane, excluding periodic
damage and allowing overkill. The seven regressions prevent declaring the
policy universally better or choosing between policies using future outcomes.
Review mercenary survival and freeze a reproducible retry/adaptation rule before
further acceptance. Do not prescribe more mana or farming from these traces alone.

The 98 new runs take 55.58 seconds against a frozen 497.83-second conservative
projection; complete adapted 100 takes 63.71 seconds / 493 waves. Together with
priority-only controls this increment adds 102 areas / 503 waves. Raw adapted
records occupy 4,710,449 bytes. Combat-only XP is 1.274M/hour, excluding gear/menu/
decision costs; it does not accept 30–50 active-hour pacing. No holdouts used.

## Evidence and remaining scope

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Aggregate: `p15-javelin-boss-adapt-aggregate-v1.json`; retained failure review:
`p15-javelin-boss-adapt-failures-v1.json`; closure:
`p15-javelin-boss-adapt-artifacts-v1.json`.

Three new drivers pass scoped strict types and focused lint. Independent native
readers verify all 102 trials, custody/costs, prefix equality, boss input changes,
events, streams, resources and settlement. All 2091 production inputs remain
unchanged; reuse 210 BUG552 and 112 BUG553 checks. No broad suite, agents,
installs, commits, pushes or publication. Disposable configs are archived/removed,
owned caches absent and processes terminal. Root retains the required packet/live
worktree claim; original checkout stays read-only.

Historical 14/14 routes, catalog 61 matched / 75 unmatched / 68 boss-review /
6 missing, 68/70 decoded cells and zero accepted balance cells remain unchanged.
Full 213-skill/build acceptance, remaining contexts/22 historical area cells,
disjoint tuning/holdouts, economy/fairness/pacing and final integration/mobile/
locales/accessibility/PWA/endgame/save stability/soak/review/owner playtest remain
open. Browser works; CI excluded; no pending answer/external blocker. Goal active.
