# D08 — Finite Hell equipment and affix envelope

Status: accepted implementation contract, 2026-10-27. Design/technical/plan
reviews APPROVE; security PASS, recorded in the
[review evidence](../evidence/hell-replay-contract-review.md). Extends the accepted
[campaign/replay equipment bands](D08-campaign-replay-equipment-bands-v1.md)
and [Nightmare affix envelope](D08-nightmare-affix-envelope-v1.md) for the
[Hell replay contract](../../design/hell-replay-contract.md). No runtime/content change or
acquisition/balance acceptance is claimed here.

## Source domain

The existing native challenge planners for all29 canonical areas resolve
Normal monster levels through82. Hell adds40 once, so the finite supported
maximum is122. Count fitting over8..20 monsters (all13 count residues),
manual/idle mode and challenge tier promotion do not increase those levels:
each canonical nonboss wave has one fixed-count encounter with at most6 source
members, and promotion changes tier/count only. Chapter bosses retain their
separate level/anchor projection, including Normal Baal82→Hell122.

`resolveIdleEncounter` also returns a legacy +1/+2 encounter level; the native
challenge planner uses its tier/pity information, not that returned level.
Do not add those bonuses again to native idle waves. Pure source/data
enumeration is not a combat replay, full RNG-period proof or timing evidence.
The source/data characterization is retained as member
`hell-envelope-characterization.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-high-rune-source-gux7bj9a.evidence.tar.gz`,
SHA-256 `63adcda52d06ccf5be0d68de2b7fed1354c036a0e376386e9dfd99a2a4c5596d`.
It binds sixteen actual source/data hashes at HEAD520d, all29 canonical area IDs,
the following table/level matrix, all109 selected item-row indices and16 affix
fields. Archive SHA-256 is
`2d31be150a200bd7f06b96cb3161e827b49bb153e35b9e1215fc35b6bf4c11a2`.
Root retains it and three evidence sidecars through independent/implementation/
full-v1 consumers, then owns removal. All5 members readback verified; raw task
root removed with remaining[]/failures[].
The independent reviewer also verified the fifteen-path planning/reward source
set `f17331e85295b9b9e0b0a568f26a28d960f618c0dbe5eef8450c1c08cc4f6a32`;
its ordered paths and NUL/digest/LF encoding are included in the packet.

Each default table is `loot/trash-actN`; `mini` means `loot/mini-actN`,
`chapter` means `loot/actN-boss`, and `goblin` is `loot/treasure-goblin`.
Numbers are Normal→Hell maxima. Source encounter points may be below the
default ordinary maximum and therefore need their own table domain.

| Act / canonical area suffix | Default maximum | Additional source contexts |
| --- | ---: | --- |
| I blood-moor |6→46|—|
| I den-of-evil |7→47|mini7→47|
| I cold-plains |8→48|goblin9→49|
| I burial-grounds |12→52|mini12→52|
| I dark-wood |14→54|—|
| I catacombs |18→58|chapter19→59|
| II rocky-waste |18→58|—|
| II dry-hills |20→60|—|
| II far-oasis |22→62|mini22→62|
| II lost-city |25→65|goblin26→66|
| II arcane-sanctuary |28→68|mini28→68|
| II tomb-of-tal-rasha |31→71|chapter32→72|
| III spider-forest |31→71|—|
| III great-marsh |33→73|—|
| III flayer-jungle |36→76|mini36→76|
| III kurast-bazaar |40→80|mini40→80|
| III travincal |43→83|mini43→83|
| III durance-of-hate |46→86|chapter47→87|
| IV outer-steppes |46→86|—|
| IV plains-of-despair |49→89|mini49→89|
| IV city-of-the-damned |52→92|goblin53→93|
| IV river-of-flame |56→96|mini56→96|
| IV chaos-sanctuary |61→101|chapter61→101|
| V bloody-foothills |60→100|mini60→100|
| V frigid-highlands |63→103|mini63→103|
| V arreat-plateau |67→107|mini67→107|
| V crystalline-passage |71→111|mini71→111|
| V ancients-way |75→115|mini75→115|
| V throne-of-destruction |82→122|chapter82→122|

## Exact data change

For each table below, change only positive equipment item rows whose current
`maxLevel` equals that table's highest equipment ceiling. Keep minima, IDs,
bases, rarity, weights, picks, noDrop, direct material/currency rows and all
other rows unchanged. There are **109** selected fields in the current data;
older evidence's selected-row counts are not this input snapshot.

| Table suffix (`loot/`) | Normal ceiling | Current ceiling (Nightmare) | Hell ceiling | Item fields |
| --- | ---: | ---: | ---: | ---: |
| trash-act1 |18|38|58|16|
| mini-act1 |12|32|52|6|
| act1-boss |19|39|59|8|
| trash-act2 |31|51|71|5|
| mini-act2 |28|48|68|1|
| act2-boss |32|52|72|3|
| trash-act3 |46|66|86|5|
| mini-act3 |43|63|83|5|
| act3-boss |47|67|87|8|
| trash-act4 |61|81|101|13|
| mini-act4 |56|76|96|4|
| act4-boss |61|81|101|2|
| trash-act5 |82|102|122|19|
| mini-act5 |75|95|115|5|
| act5-boss |82|102|122|9|

`loot/treasure-goblin` is a sixteenth live ordinary table. Its actual Normal
levels9/26/53 become Hell49/66/93; its current maximum99 already covers this
domain. Leave it unchanged. Preserve cache/quest/endgame table bounds and
exact existing explicit reward exceptions.

Change only the last-tier `ilvlMax` from102 to122 in all16 authored affixes
(eight prefix/eight suffix). The last tier remains minimum26; earlier1..10
and11..25 tiers, tier indices, value ranges, applicability, rarity weights and
IDs remain exact. Current data has84 affixable bases (41armor,13jewelry,
30weapon); do not reuse an older base-count assumption.

No new affix power tier, level clamp, alternate treasure table, loader/roller
fallback or historical item reroll is authorized. One above each finite table
ceiling remains ineligible for those top equipment rows; affix123 has no tier.

## Pool preservation and limits

For every level through each table's current Nightmare ceiling, the complete
eligible weighted equipment pool stays identical. New levels extend only its
existing top-band alternatives. All affix selection/materialization through102
also remains identical for the same inputs and RNG; do not broaden lower
bands or shift seeded rarity outcomes. Test these full-pool comparisons using
the retained predecessor data, not just row counts or existence of one item.

This establishes legal output pools at actual Hell source ilvls. It does not
promise a guaranteed drop, an upgrade, a new base/stat tier or hero equipment
eligibility above the existing requirements. Useful equip/salvage and crafting
consumer evidence remain required. Earned drop rates, high-rune affordability,
build viability and honest30–50-hour pacing remain separate.

## Validation

Retain causal RED before data edits. Verify actual planners across all29 areas,
manual/idle and13 count residues, plus continuous equipment-domain coverage
and exact one-above exclusions for15 act tables and unchanged goblin contexts.
Verify all16 affixes continuously1..122 with exact123 refusal, production
magic/rare materialization over all84 affixable bases at former/new boundaries,
and the real caster recipe's identity/cost/affix/persistence behavior through122.
Check chapter anchors, schema, exact109+16 parsed-field diff, complete lower
eligible pools and same-seed lower-level output equality. Follow focused/
engine/full units, strict types, lint and production build. Constructed source
or item tests establish function, not earned quantities or balance.
