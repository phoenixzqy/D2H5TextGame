# P02b00 — Post-MR Den source feasibility

2026-10-20; runtime accepted at0d21276, ledger1c55248. Game/technical source
review only: no simulation, test, native attempt, tuning or imported state.
Calculations below copy current formulas; they are not current-head gameplay
observations. Full balance, pacing, Den/campaign and C/G acceptance remain open.

## Historical context and legal candidates

The [failed native discovery](p04a04c-native-den-discovery.md) acquired40 Blood
Moor first-wave wins at source12105cd00a16e3be3de4368ea5071a1bd044872c. Its
[packet](fixtures/p04a04c-failed-discovery-outcome.json) SHA256 remains
`03b14e6dca3b65aa2db3cc9023cdb501356c7138e69d61a2e16d160c6093d7e3`.
Observed W1 victory and W2 draw do not establish W3/W4 access or a clear.

The packet's `earned-level-six` equals `prep-39`: save8, L6 XP67,25 attributes,
five available skill points,344 items,5157 shards and Inner Sight merc L9 XP249.
Its skill ranks already include Frost1/Ice1/Fire1. `prepared` spends the points,
attributes and three earned gear pieces; `tracked` additionally accepts Den.
`den-award-1` proves W1 progression but does not encode complete terminal combat
carry. Ordinary ordinal40 is acquisition context, not a persisted save8 field.

| Same40 build | Additional points after Fire1 | Assessment |
| --- | ---: | --- |
| Frost2 / Fire4 / Warmth1 |1+3+1=5 |Previously measured |
| Frost6 / Fire1 / Warmth0 |5 |Legal candidate |
| Frost5 / Fire1 / Warmth1 |4+1=5 |Legal candidate |
| Frost6 / Fire1 / Warmth1 |5+1=6 |Unaffordable |

Production allocation spends one point per rank. No candidate may assume an
extra point, quest reward, respec, additional farming or refill. Historical
values below must be observed anew by a current-head acquisition replay.

## Encounter arithmetic

This table uses ordinal40, epoch1792497600000 and Den seed2223645302. Other
seeds may change HP rolls and affixes. Den templates and forced packs resolve
through [sub-area-run.ts](../../../src/engine/combat/sub-area-run.ts), followed
by [monster-factory.ts](../../../src/engine/combat/monster-factory.ts) and
[mitigation.json](../../../src/data/combat/mitigation.json).

| Wave / body | Tier / effective level | Count | HP each; group total | Armor / MR | Cold / fire / physical resist | ATK fallback |
| --- | --- | ---: | --- | --- | --- | ---: |
| W1 Fallen |trash /3 |9 |36–60;324–540 |13/2 |0/0/0 |42 |
| W2 Fallen |champion /4 |6 |117–195;702–1170 |19/6 |0/0/0 |71 |
| W2 Shaman |champion /4 |2 |234–360;468–720 |32/6 |0/25/0 |71 |
| W2 Tainted |champion /4 |2 |195–273;390–546 |25/6 |0/0/0 |71 |
| W3 Dark Stalker leader |rare-elite /7 |1 |640–960;640–960 |77/9 |55/55/30 |124 |
| W3 Dark Stalker minions |rare-minion /7 |5 |320–480;1600–2400 |68/6 |25/25/0 |81 |
| W3 Fallen minions |rare-minion /7 |5 |96–160;480–800 |22/6 |0/0/0 |81 |
| W4 Carvers |boss /7 |3 |192–288;576–864 |36/18 |0/0/0 |99 |

Total HP: W1 324–540; W2 1560–2436; W3 2720–4160; W4 576–864. The enclosing
boss wave makes all three Carvers boss tier, including the two encounter
entries without an explicit boss flag. ATK fallback is not registered-skill damage.

Copied seeded-RNG arithmetic selects lightning-enchanted on both W2 and W3.
Actual ordered loadouts and registry effects matter more than authored monster
skill tuning, which does not define these registered stub ranges:

| Actors | Ordered skills |
| --- | --- |
| W1 Fallen |Weak melee → panic flee |
| W2 Fallen |Weak melee → panic flee → lightning |
| W2 Shaman |Fire Bolt → resurrect fallen → lightning |
| W2 Tainted |Weak melee → poison spit → lightning |
| W3 Dark Stalkers |Strong melee → charge → lightning |
| W3 Fallen |Weak melee → panic flee → lightning |
| W4 Carvers |Weak melee |

| Registered skill | Actual effect | Cooldown |
| --- | --- | ---: |
| Weak melee |Single physical10–15 |1s |
| Strong melee |Single physical30–50 |1s |
| Panic flee |Permanent self buff flag; no movement effect |4s |
| Fire Bolt |Single fire25–40; ignite flag without DoT payload |2s |
| Resurrect fallen |Permanent caster buff flag; no resurrection/summon |6s |
| Lightning |Single lightning40–60 |2s |
| Poison spit |Single poison20–30; two poison stacks,5%-of-hit DoT |2s |
| Charge |Single physical60–90 |4s |

All have mana0. See [builders](../../../src/engine/skills/builders.ts),
[aliases](../../../src/engine/skills/aliases.ts) and
[registry](../../../src/engine/skills/registry.ts). Frost Nova/Arcane Bolt are
other affix possibilities, not these seed-selected affixes. Stub behavior is
recorded as the current implementation, not accepted as complete monster design.

Fallen/Tainted/Dark Stalker/Carver action periods are1740/1780/1540/1700ms.
Their first1s melee remains ready and suppresses later ordered skills while
eligible. Shaman's1820ms period is shorter than Fire Bolt's2s cooldown, leaving
secondary opportunities: initially the resurrection flag, later lightning.
Freeze, interruptions and death change actual selection; spell spam is not assumed.

## Friendly offense and survival limits

| Historical reference, projected with current MR0 | HP | MP | ATK | Armor / MR | Period |
| --- | --- | --- | ---: | --- | ---: |
| Fresh hero L1 |120/120 |102/102 |22 |20/0 |1500ms |
| Unspent same40 hero L6 |120/160 |102/122 |32 |35/0 |1500ms |
| Prepared hero: +10 Energy/+15 Vitality and earned gloves/boots |120/190 |102/137 |32 |43/0 |1500ms |
| Fresh Inner Sight merc L3 |148/148 |79/79 |25 |26/0 |1524ms |
| Same40 merc L9 with earned gloves |196/196 |79/79 |25 |30/0 |1524ms |

All elemental/physical resistances are0; hero/merc crit chance5%, multiplier2.
These are historical comparison values, not injected current-head fixtures.
Hero Basic fallback is physical32 at L6,64 on crit before mitigation. Merc order
is Inner Sight → Basic Arrow → Pierce Arrow. Inner Sight is a permanent flag;
Basic Arrow uses physical15–25, CD1s/mana0 and then suppresses Pierce Arrow.
It does not use merc ATK25 as its registered-skill range. Single-target friendly
attacks select the earliest living enemy, so the W3 leader can hold Fire/merc
focus while Nova attacks the pack.

Successful noncritical Frost Nova damage per target, before any additional
combat modifiers, is calculated from actual rank scaling/resistance/MR:

| Target | Frost2 | Frost5 | Frost6 |
| --- | --- | --- | --- |
| W1 Fallen |26–36 |35–45 |38–48 |
| W2 bodies |22–32 |31–41 |34–44 |
| W3 leader |3–8 |7–12 |9–13 |
| W3 Dark minions |15–22 |21–29 |24–31 |
| W3 Fallen minions |22–32 |31–41 |34–44 |
| W4 Carvers |10–20 |19–29 |22–32 |

Frost6 trades Warmth's4% mana recovery and1% fire modifier for three more base
cold damage than Frost5. At Energy45 recovery is9MP/s versus9.36MP/s. A
conditional20-Frost/20-Fire sequence costs560MP per60s; recovery is540/561.6MP
plus initial102MP. This supports a resource-feasibility question, not a proved
cast sequence. See [Sorceress data](../../../src/data/skills/sorceress.json),
[Warmth](../../../src/engine/progression/warmth.ts) and
[combat timing/selection](../../../src/engine/combat/combat.ts).

The old armor-based cold impossibility bound is obsolete. Twenty successful
noncritical Frost6 hits deal only180–260 against the leader's640–960HP. Fire1,
Fire4 and merc attacks remain at the leader's one-damage floor, including the
merc's available physical critical/combo multipliers. Crits, misses, basic
fallback, statuses, targeting and exact cadence prevent a victory conclusion.

Incoming cold/lightning/arcane now subtract MR0 rather than armor43/30.
Unmodified successful noncritical strong melee deals hero1–7/merc1–20, while
lightning deals40–60 to either ally. Threat sharing, crits, misses, freeze,
enemy kill timing and HP/MP orbs determine survival. Champion/rare/boss kills
grant orbs to living allies; a dead merc gets none and does not carry forward.
There is no automatic inter-wave refill. Full timed events and resource/carry
state are needed; the old browser's200-entry log tail is insufficient.

## Reviewed next route

Producer P02-V2-ARCHITECTURE READY and game/technical source review favor an
additive fresh-earned recipev2. Strict fresh-only v1 remains unchanged. Historical
save hydration is deferred; replay current production creation and earned
actions instead, retaining source/data/recipe identity and original raw IDs.

Freeze schema/action/seed/gear contracts first, then independently review the
missing-capability RED. Separate cards implement acquisition, reporting and a
tiny screening experiment. No native retry, tuning or larger grid is authorized
by this source analysis. Each repetition must isolate meta as well as the six
existing stores: `readIdleBonus` influences victory XP.

The later adapter must validate the UI's roster act-unlock eligibility, rather
than merc `reqLevel`: an L1 hero legitimately hires the L3 Inner Sight merc.
Use actual production allocation/equipment actions and stop on missing items,
insufficient points or an attempted wave loss/draw, without substitutes.

W1 finalization awards once and synchronously installs W2. Capture that W1
award, then follow native flee semantics (abort, clear idle target, reset pity,
end combat). Preserve W2 as intentionally abandoned; never award/play it or
treat its already-computed outcome as an attempted-wave failure. Den continues
normally with living carry and stops on its first loss/draw.

Two repetitions per frozen seed must compare raw recordings/rewards/checkpoints
separately from narrowly declared item-ID semantics. Never reset the global
item allocator or erase original IDs to manufacture raw equality. No historical
equivalence, victory, 1000-seed balance, campaign or full-v1 acceptance follows.
