# Retained Act IV Barbarian damage attribution

2026-11-03. Both progression failures remain open. This read-only investigation
reconciles all six previously recorded Izual draws without running combat,
changing native saves, earning income or renewing any preparation/attempt budget.

## Observed contribution

Izual has363 Defense and50% physical resistance in all six openings. Each fight
lasts60seconds with both allies alive and ample hero mana. Every source's direct
damage total matches native settled metrics; all boss Life deltas reconcile
exactly, with zero boss healing or periodic damage.

| Build / ordinal | Hero damage to Izual | Prayer damage to Izual | Boss Life remaining |
| --- | ---: | ---: | ---: |
| Throw706 |18,628|13,505|8,556|
| Throw707 |20,070|13,983|9,657|
| Throw708 |20,378|15,109|4,863|
| Swing708 |7,123|12,586|17,724|
| Swing709 |6,109|15,349|21,600|
| Swing710 |6,551|11,362|24,628|

These are boss-targeted totals. Earlier whole-wave totals also include damage
to the two Oblivion Knights; they must not be used as boss DPS.

Throw casts its intended throwing skill32/29/32times and its learned-rank-one
Swing filler16/21/13times. That filler consumes24.1–35.6% of hero actions, yet all
79landed boss hits deal exactly1damage, including its three critical hits.
Double Throw itself deals18,606/20,033/20,358boss damage. Both two-strike
implementations are active; this is not evidence that the extra strike is absent.

Swing casts its intended attack24/26/24times, Howl14/13/14times and Bash8times
each. Howl consumes24.1–26.4% of hero actions and is a control action, not damage.
Bash contributes6/3/7boss damage. Swing contributes7,117/6,106/6,544. Its current
Attack is199, the retained early sword is still equipped and Sword Mastery is
unlearned. No stronger owned sword was equipped by the separately exhausted
32-action staging check; that incomplete preparation remains unchanged.

Hero Chill durations are23.5/18/27.5seconds for Throw and16/13.5/16seconds for
Swing, derived from native status snapshots. These are observed intervals, not a
counterfactual claim about throughput without Chill.

## Production cause and decision

The production pipeline in `src/engine/combat/combat.ts` applies the authored
per-rank Attack contribution, then physical damage increases, critical/combo
multipliers, resistance and flat Defense (`src/engine/combat/damage.ts`). The
Barbarian JSON already gives both skills20% Attack per rank above one.
Do not add that scaling a second time.

For Throw's filler, even the maximum effective-rank-two base64 plus20% of208
Attack, multiplied by1.475physical damage and2.54critical damage, falls below
363Defense after50% resistance. Its observed floor hits follow the authored
rules. For Swing at effective rank21, the noncritical range is
`((40..60 + 20*4) + 199*4)*0.5 - 363 = 95..105`, matching retained hits while
Battle Command is active. The logs do not expose raw rolls; this arithmetic
checks the source envelope, not exact RNG reconstruction.

No engine defect or numeric nerf/buff is established. The next comparison should
focus on attainable offensive equipment and rotation preparation, with both
identities retained, before evaluating any global monster or skill correction.
Throw still lacks a stronger eligible *owned* throwing weapon; newly authored
loot tiers are availability evidence only. Swing has stronger owned candidates,
but a projection is not a native equip or successful encounter. Do not reopen
original route/preparation limits, replay completed campaigns, supply upgrades,
or count a hypothetical damage improvement as a victory.

## Evidence and validation limits

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-act4-damage-attribution-v1`.
`plan.json` predates execution and authenticates both original journals, saves,
failure analyses and the relevant production sources. `attribute.py` streams
those journals and emits `attribution.json`; all allied direct events share their
source action's timestamp. No delayed allied event is silently attributed.
`source-readback.json` verifies unchanged inputs, the six health identities,
all79filler hits at the floor and the source damage envelopes. Full action,
miss/crit/floor-hit and status-duration breakdowns are retained.

Two diagnostic script failures are preserved as `attribute-initial.py` and
`attribute-zero-source.py`, explained in `corrections.md`: native metrics omit
zero-only damage sources; basic actions use a null skill ID. Neither was a game
failure. The corrected attribution exits0. No production source changed, and
no unit/browser/build suites were needed for this retained-data investigation.
No process/config/cache was created. Exact source/projection hashes and closure
are retained; root owns the required packet through umbrella review and eventual
cleanup/release.

Counts remain14intended Act I clears,3five-act Normal completions, formal0/210.
Private v1, BUG592, remaining viability/economy/pacing, offline/PWA/endgame and
final integration/review/soak/later owner playtest remain incomplete. Root's
self-review does not replace independent final acceptance.
