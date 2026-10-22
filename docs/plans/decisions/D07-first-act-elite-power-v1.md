# D07 v1b — Bounded elite groups for Act I

Status: scoped game-design decision, 2026-10-22. Implementation and validation
evidence belong to P01/P02 in the execution ledger. This is a structural
composition decision; campaign balance, pacing and C1 remain unaccepted.

## Problem and decision

The earned Cold Plains pilot at `49af342` won two normal waves and lost the
first forced champion wave. At ordinal40 it faced eleven L8 champions: six
Dark Stalkers and five Zombies. The native terminal had both allies dead and
all eleven enemies alive. The factory's authored HP bounds jump from690–990
for W2 to4335–6375 for W3. Neither a runtime damage regression nor a winning
alternative build was established.

The planner promotes the entire target count, rather than a bounded group.
`encountersToSpawns` first applies the wave's elite fallback to all unflagged
entries; `forceElitePack` then makes every body champion, or one rare leader
and every other body a rare minion. This multiplies the elite group whenever
the ordinary8–20-monster wave size increases.

Choose a bounded group within that existing wave for **active Act I challenge
runs**, in both manual and idle mode. This replaces the current all-count
promotion policy. It deliberately preserves later acts until their own power
contracts are reviewed; it is not a global numerical balance acceptance.

| Promoted Act I wave | First fitted slots | Remaining fitted slots |
| --- | --- | --- |
| Champion | First3 champions, capped by actual wave size | Trash |
| Rare elite | First1 rare leader, next3 rare minions, capped by wave size | Trash |

Fit the existing ordered authored roster to the existing target count **before**
assigning these tiers. Retain archetypes and levels, and use the fitted roster's
per-archetype unique indices. Old rare guards used a global index across all
archetypes; their transient monster IDs/names may consequently change to the
fitted per-archetype sequence. Player/merc IDs and durable item IDs do not change.
The first slot leads a rare group. No extra monster, roster draw or affix draw is
introduced. Retain exactly one existing `rng.pick(config.affixes)` per promoted
wave. Its shared affix belongs only to the champion/rare group; filler receives
none. Later random decisions therefore consume the same planner RNG stream.

Within a promoted Act I wave this assignment supersedes wave-level elite
fallback and authored `elite:true`. Neither creates a second group outside
the cap. Cold Plains W4's authored Fallen flag is an explicit counterexample.
Unpromoted authored encounters keep their current flag interpretation.
Dedicated boss encounters and chapter-boss construction keep their current paths.
Embedded boss flags in promoted guards were already overwritten; this decision
does not introduce a new embedded-boss interpretation.

Keep forced-tail positions, wave labels, idle pity and promotion probabilities,
target counts, level offsets, loot-table routing and all tier numeric multipliers.
The XP/loot/orb services themselves remain unchanged; changing actual monster
tiers can change tier-dependent loot and orbs, which must be measured as actual
results rather than inherited from the failed recipe.

## Controlling sources and scope

[D07 active-mode measurement](D07-active-mode-measurement-v1.md) preserves forced
guards in both modes; this decision supplies their Act I cardinality rule.
For these promoted Act I waves it supersedes the all-count composition previously
observed by that measurement and the conflicting [maps-spec §10](../../design/maps-spec.md#10-wave-composition-rules)
upgrade/pack selection. It does not restore that older table's1.5×champion HP.
[D04 mitigation](D04-independent-magic-mitigation-v1.md) and current JSON tier
coefficients remain controlling for the stats of each actual tier.

Legacy `resolveWavePlan`, Acts II–V and dedicated boss paths retain their
existing composition. No save version, access gate, reward claim or currency
rule changes. [First-act access](D07-D11-first-act-route-v1.md) still permits
act-wide travel; Den full clear → Akara talk → explicit claim remains C1 work.

## Affordable screening ceiling

Use the already observed same40 earned checkpoint as an upper bound for the
next affordability screen. This does not endorse40 first-wave farms as final
onboarding or establish the30–50-hour campaign target.

| Input | Exact bounded policy |
| --- | --- |
| Acquisition | Fresh Sorceress, ordinary UI, at most40 Blood Moor W1 victories; no purchased/imported state, extra farm, refill or unearned quest award |
| Hero XP |11080 cumulative; L6 with67/8818 current XP; exactly25 earned attribute points |
| Skills |Starter Frost1/Ice1, earned Fire1, then five additional points: Fire+3/Frost+1/Warmth+1; final Fire4/Frost2/Ice1/Warmth1 |
| Attributes |Spend10 Energy and15 Vitality; Str10/Dex25/Vit25/Eng45; no remaining points or alternate allocation |
| Hero gear |Retained glove/boots plus earned cap `it-71emu-12` and bow `it-8n9ca-1b`; actual two-handed offhand:null; ATK49/DEF51 |
| Merc gear |Inner Sight Rogue; earned cap `it-71emu-1a`, glove `it-96fga-8`, boots `it-5iwwr-9`; displaced glove returned to bag |
| Merc power |L9 with249/4404 current XP; saved ATK25/DEF26 plus exact equipped items; source-derived combat DEF42; fixed Basic Arrow15–25 |
| Starting resources |Hero120/190 HP and102/137 MP; merc196/196 HP and79/79 MP; no inter-wave refill |
| Inventory |337 backpack items after exact transfers;5157 rune shards; no rare-item dependency or substitute drop |
| Execution |Fixed Date2026-10-20T12:00Z, ordinary ordinal40, native timers; first nonwin/refusal/missing prerequisite stops the declared screen |

The next joined Den witness must retain each actual award and living combat
carry. It may claim Den's500XP/+1skill only after the full clear/talk/claim.
Do not assume those points, Andariel XP, later quest rewards or restored HP
when deciding whether the ceiling can afford its first elite encounter.

## Required evidence and limits

First assert the new production planner policy before implementation, including
actual Den/Cold Plains, all thirteen default counts and the existing public
8–20 clamp (including requested bounds1–4, which still yield8). Do not add a
public helper solely to exercise unreachable small packs. Assert forced and idle
champion/rare cores; idle nonpromotion/disabled paths and exact pity metadata;
unchanged unpromoted authored flags; exact roster order, immutable inputs, fitted
indices and complete absence of eliteAffix on trash fillers. Multi-wave seeded
cases with randomized encounter counts, later affixes and dedicated-boss outputs
must prove unchanged planner RNG consumption and exactly one affix pick per
promoted wave. Record the genuine RED.
Then keep those tests unchanged while implementing the upstream composition
correction. Compare real planner/factory snapshots at the fixed historical
epoch/ordinal, including untouched later-act, legacy and boss controls.

At ordinal40 corrected Cold W3 has2Stalker/1Zombie champions and4Stalker/4Zombie
trash; W4 has1rare Fallen/3rare minions/8trash. W3 authored HP bounds become
2295–3383, still substantial. The surviving champion Stalkers keep their armor,
MR and resistances; this correction promises no victory. Final validation
requires focused engine/related checks, types, lint, production build and a
current-head serial full suite. A separate earned Den browser witness is still
required; source/factory snapshots are not gameplay or save/mobile acceptance.
