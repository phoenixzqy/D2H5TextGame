# Martial Act I: owned equipment and earned skill redistribution

Status: CONCERNS. Six new native area trials / 30 waves identify a legal
preparation that clears the previously unreached elite. No final balance cell
or private-v1 gate is accepted. Production code and data are unchanged.

## Frozen source and comparisons

Reuse the [role screen](2026-11-01-build-act-role-screen.md)'s two original
failures, without replay: `p15-martial-capacity-native-v1.json`, SHA256
`c4d20fa7771099241e8f424f72768a5cf15a7c4e8ba09f87d255182a9fb8e72f`.
Hero18 / XP2210 / normal ordinal234 has Fists17, Talon1, Cobra1, Tiger1,
one unused earned skill point, five stat points and two skill resets remaining.
The matched level18 elite is Catacombs wave4 (zero-based). Baseline seeds1/8
both die in wave3, before that target, despite minimumMP174.

Before combat, enumerate eligible owned sets and unique families through the
canonical equipment projection. This source owns seven complete sets. The
complete Isenhart set is eligible and raises attack70→380, defense188→395,
speed136→176 and life capacity349→355. It replaces the source's8-attack throwing
knife, chest, head and shield. Exact native IDs are chest `it-7zj9m-5bb`,
head `it-6zye-5a9`, offhand `it-3d9ku-2e3`, weapon `it-3kbik-2ba`.

Freeze two controls at the same seeds1/8: Cobra/Fists/Talon/Tiger priority with
original gear; and Isenhart4 with original priority/ranks. Native transfers and
equips retain every displaced item. Both preserve points, resets, core stats,
mercenary, materials, currencies and ordinal. Four whole-area trials /18waves
finish in7.166wall seconds.

| Preparation | Elite reached | Elite wins | Area wins |
| --- | ---: | ---: | ---: |
| Original source, reused |0/2|0/2|0/2|
| Cobra-first, original gear |0/2|0/2|0/2|
| Isenhart4, original skills/order |2/2|0/2|0/2|
| Isenhart4 plus declared skill reset |2/2|2/2|2/2|

Cobra-first casts the learned recovery skill, but only5/4 total direct HP
healing is recorded across each attempted area. It dies in wave3 at14.240s
with minimumMP170. Isenhart clears that wave in48.048/52.416s and enters the
elite at231/355 or107/355HP, then dies after43.120/7.700s. Mana remains174+.
The original charge saturation/discharge implementation already works.

## Damage boundary and legal reset

The elite leader has defense98 and fire/physical resistance55/30. Fists17's
ordinary125–150 fire range remains below armor after resistance; Talon1's
40–60 physical strikes also remain at the one-damage floor, including critical
hits. The gear control records only one-damage non-dodged hero hits against
the leader. Sheet attack380 does not replace these authored skill bases.
The unused point can unlock Tail1, but its70–100 fire base, even at a2×critical,
also remains below the leader's armor. These facts identify allocation/power
as an unresolved preparation issue; they do not prove a global tuning defect
or justify more farming.

Freeze one additional equal-budget candidate before its two trials: native
Akara skill reset, refund20 plus the existing free point, then Tiger1/Fists1/
Cobra1/Talon10/Tail8. Priority is Tail/Fists/Talon/Cobra/Tiger. Keep Isenhart4,
core stats, all five stat points and the original Rogue unchanged. Akara charges
zero currency and consumes one existing skill-reset allowance,2→1; no stat reset,
materials, acquisition or extra farming. Every point is allocated through the
ordinary store action. The particular allocation is a declared sufficient
candidate, not a proven minimal or necessary distribution.

Both whole areas clear, including the actual matched elite. Elite durations
are10.920/10.920s, inside the proposed10–35s band. Entry life355/349 and exit
life355/345 retain native carry and orbs; minimumMP165. Area totals are29.484/
36.036s. Twelve waves take5.831wall seconds. Native rewards remain local and
are discarded after audit; no authoritative save or earned ordinal advances.

The reset trials cast Tail14/17 and Fists13/16 across each six-wave area.
Talon10, Cobra1 and Tiger1 never cast. Do not claim that those allocated ranks
are necessary, independently viable, or separately accepted. This Tail8 variant
does not validate the original Fists17 path. Later Andariel durations4.368/
6.552s are below the chapter-boss band. Exact source review confirms no
Catacombs clear, a false Andariel objective and no victory/Claim receipts: the
source is pre-victory. The earlier report incorrectly inferred boss history
from an act summary of ordinary area clears; [BUG555](../../production/bugs/BUG-555-act-clear-boss-provenance.md)
corrects that interpretation. Original first-ever attempt history, earlier
partial boss-area attempts, complete gear provenance and recommended power
remain unproven, so these are not final first-attempt balance acceptance.

## Evidence and limits

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- Pure owned projection: `p15-martial-act1-owned-projection-v3.json` and driver.
  V3 adds a checked optional-piece contract; its results exactly equal v2.
  Superseded v1's two-handed API assumption and the v2 typing failure remain.
- Controls: `p15-martial-act1-controls-v1.json`; passed independent raw reader
  `p15-martial-act1-controls-v1-readback-v3.json`.
- Reset: `p15-martial-act1-reset-v1.json`; passed independent raw reader
  `p15-martial-act1-reset-v1-readback-v1.json`.
- Readers verify source pins,2091 unchanged production inputs, exact inventory
  custody/costs/point budget/reset consumption, seeded enemy teams, native events,
  outcomes, XP/rewards and party life/mana/cooldown carry. Reader1 incorrectly
  compared changing documentation status as combat provenance; reader2 assumed
  an optional monster field. Both failures are retained; no combat was replayed.
- Final drivers pass scoped strict types and focused no-any/unused lint. Reuse
  unchanged210 BUG552 and112 BUG553 checks; no broad suite or campaign replay.
- Current decision: `p15-martial-act1-owned-adaptation-decision-v2.json`, with
  exact boss-history correction and unchanged trial outcomes. V1 and the prior
  report preimage remain immutable evidence. Original artifact
  closure: `p15-martial-act1-owned-adaptation-artifacts-v1.json`. Two disposable
  configs are archived/removed, task Vite caches are absent and processes terminal.
  The correction is closed by `p15-build-act-boss-source-artifacts-v1.json`.

All61 selected matched recipes now have target observations when this declared
adaptation is included; the original unchanged recipes remain60/61. Two seeds
do not establish population win rates, timing acceptance, build identity,
first-clear gear provenance, three-attempt recovery or full skill acceptance.
Recipe overlay2 stays61matched/75unmatched/68boss-review/6missing,68/70decoded,
accepted balance0. Keep every failure and the original measurement overlay.

Return to the broader75 unmatched/68 boss-context power and source review;
preserve this preparation for a later frozen exploration/adaptation policy.
Do not automatically extend this screen to100seeds or tune damage from it.
Full213skill/build/210role acceptance,22 historical area gaps, disjoint holdouts,
economy/fairness/30–50active-hour pacing and final integration/mobile/locales/
a11y/PWA/endgame/save stability/soak/review/owner playtest remain open. Browser
works; CI excluded; no pending answer/external blocker. Root retains the live
human2 claim and required packet; original checkout remains read-only.
