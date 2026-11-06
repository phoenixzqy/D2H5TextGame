# Double Throw Barbarian Act IV: owned defense and retained failures

Status: unresolved. One owned ring clears one of two retained seeds; neither
the three-slot defense policy nor removing Howl from late-pack priority works.
Six bounded diagnostic areas /34 waves preserve all five failures and one win.
No production code/data or authoritative campaign save changed. Full v1 stays open.

## Exact source and complete native composition

Source `p15-barbarian-double-throw-izual-proof-v1.json`, SHA256
`6211fed05abb777d07c9d2aebfa8520abe019606ecdbb6c2a7ca5590dd19d096`,
retains level35 /XP221361 /ordinal886. Original seeds1/8 die at Chaos Sanctuary
wave5, the mega-demon pack before Diablo, entering257/395HP. Incoming direct
Physical325/460 plus Fire22/86 and periodic41/150 are recorded separately.
Howl already casts. Shout/BattleOrders are automatic personal passives, not
missing active buffs. All43 allocated ranks, zero free points, core and both
three-use reset allowances remain unchanged throughout these controls.

Pure projection1 compares equipment-sheet stats; projection2 corrects the
comparison to call native `playerToCombatUnit` after restoring the exact source
and temporarily projecting canonical equipment in memory. All stores restore
in `finally`; no battle ran with sheet-only preflight. Native endurance,
mastery, warcries and IronSkin are included. Baseline combat stats are788.59HP,
Defense390.55 and16%crit, versus737HP /365Defense /9%crit on the equipment sheet.
Future Barbarian comparisons must preserve this distinction.

All62 unused items are compared through native eligibility/slot rules,18 hero
eligible. Native sockets, uniques and partial sets apply; neither owned partial
set is complete. Proposed hero gear preserves both swords. Reserve its three
items before mercenary comparison:59 remaining /11 eligible. The mercenary
proposal remains unexecuted. Scores and fixed-hit probes describe tradeoffs;
they do not forecast whole-area survival.

## Three frozen controls

| Policy | Seed | Result | Last wave | Last-wave time | Final hero HP |
| --- | ---: | --- | ---: | ---: | ---: |
| Owned boots and both rings |1|Defeat|3, Oblivion Knights|14.100s|0|
| Owned boots and both rings |8|Defeat|4, Venom Lords|25.398s|0|
| Owned left ring only, Howl first |1|Victory|6, Diablo|23.760s|55.35|
| Owned left ring only, Howl first |8|Defeat|5, mega-demons|48.230s|0|
| Same ring, DoubleThrow first from wave5 |1|Defeat|5, mega-demons|19.440s|0|
| Same ring, DoubleThrow first from wave5 |8|Defeat|5, mega-demons|16.200s|0|

Control1 equips source-owned boots `it-10643-2rz` and rings `it-3rf6z-6z2` /
`it-9wqfx-6z0`. Physical29→39 and Fire55→60 improve its physical/fire score,
but flatMR16→8 and Arcane35→27 regress the earlier knights: Arcane incoming
761/891 versus baseline542/499. Keep this failure; the last fatal pack alone
is an inadequate preparation objective.

Control2 uses only left ring `it-3rf6z-6z2`; keep the original Diamond boots
and right ring. Native stats:754.35HP /338MP, Defense390.55, flatMR16, AS164,
crit16% /2.83, physical dodge23.8%, magic dodge18%; Physical39, Arcane52,
Lightning110, Fire55, Cold63, Poison0. The life and physical-dodge reductions
remain explicit. A raw935 Physical probe falls273→179. Its seed1 boss enters
at39.35HP and clears, so the win is narrow; seed8 still dies before Diablo.
Minimum mana across its areas168/197. Do not treat mana depletion as the diagnosis.

Control3 freezes the same ring and Howl-first waves0–4, then stages native
DoubleThrow-first order for waves5–6. Removing Howl's control causes both
deaths sooner. The first five waves match control2 semantically, including
rewards apart from generated item IDs. Reject this order policy and preserve
the original Howl-first configuration for further work. No reset, farming,
materials, currencies, socket changes, mercenary changes or new ranks were used.

## Audit, cleanup and next action

Separate author readback `p15-double-throw-act4-owned-readback-v1.json` passes
all6 areas /34 waves without combat replay: source pins, complete canonical
party item custody, only declared native equips, unchanged skills/core/points/
reset/currency/material boundaries, native sheet/combat projections, stream and
enemy identity, damage events, rewards, aggregate XP/items/materials/currencies/
mercXP/clears and cross-wave HP/MP/cooldown carry. Twelve altered-point/equipment
controls are rejected. The reached Diablo matches canonical level61 /44800HP.
All diagnostic income is discarded and saved ordinal886 stays unchanged.

Battle execution totals19.473 wall seconds. Fourteen scoped receipts all pass;
gameplay losses above remain failures. Scoped strict types/no-any/unused lint
pass; control3 changes only control2's checked version literal and frozen spec.
Reuse210 BUG552 /112 BUG553 checks, with no broad/earlier-act replay or larger
seed study. Five exact temporary configs are archived and removed; all five
exact Vite caches are absent and owned processes are terminal.

`p15-double-throw-act4-adaptation-overlay-v1.json` records the unresolved split;
it does not replace the original110 boss trials or58 accumulated ready inputs.
Accepted balance cells remain0. Explicit seeds1/8 are conditional diagnostics,
not population, first-attempt, within-three, acquisition, point-history, holdout
or independent/final acceptance. Closure `p15-double-throw-act4-artifacts-v1.json`
chains to the TrapIII closure. Retain the required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
and live human2 claim with root for umbrella acceptance and eventual cleanup.

Next diagnosis `p15-double-throw-act4-next-defense-v1.json` pins the exact
ring-only seed8 failure and remaining skill resets3. Compare native legal
reallocation of the existing43-rank budget: remove excess Bash ranks and trade
some SwordMastery for IronSkin. Measure the offense/crit/armor tradeoff and
retain earlier Arcane/Poison carry before freezing a reset control. Do not
repeat rejected gear/order policies or run a larger seed study. Full v1,
intended-power/economy/pacing and final integration remain open; browser works,
CI is excluded and no answer or external blocker is pending.
