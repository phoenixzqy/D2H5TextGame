# Current-source screen of the remaining 52 selected role recipes

Status: CONCERNS. This adds native measurements across seven classes and13
historical builds. It accepts no balance cell or private-v1 gate.

## Selection and execution

The previous turn resolved the bounded Javelin mercenary opening-survival
question. Return to the coverage matrix rather than extending that screen.
The original catalog has54 saved-level-matched recipes; Bow Act III already
measured two. Freeze the other52 exact source/area/wave selections at seeds1/8,
with original gear, ranks, free points, priorities, mercs and normal ordinals.
The seven later recipe refinements and their existing studies are reused.

Production prefix-XP forecasts run before any combat. All52 chosen targets
retain the original exact hero/enemy level match, conditional on preceding
victories and multiplier1. No source/area/seed is chosen using fight outcomes.
Each admitted trial uses the entire native area: preceding waves, carry,
statuses, XP, loot, quests and terminal settlement. Projected state is discarded;
no authoritative campaign save or challenge ordinal advances.

The initial process completes four trials/22waves, then exposes an invalid
adapter assumption: an over-cap checkpoint owns3084 backpack items, so a
stash-only policy cannot create12 nominal free backpack slots. No combat or
reward starts for that failing admission. [BUG554](../../production/bugs/BUG-554-role-screen-legacy-capacity.md)
records the failure and correction. The game already supports lossless reward
ingestion beyond nominal capacity. V2 freezes that native path for sources
which cannot prepare capacity through stash transfers; original containers and
every item remain intact. No discard, salvage, free space injection or spend.
Raw-record budgets also account for the pinned source's existing footprint.

V2 reuses the four completed records and adds100 trials/491waves in90.307wall
seconds, below its176second projection/240second wrapper limit. Combined data
is104 trials/513waves and6,541,765compressed native bytes. The earlier failed
process takes7.794seconds. No historical campaign replay or100-seed extension.

## Results

| Observation | Count |
| --- | ---: |
| Selected recipes screened |52|
| Recipes with both native targets reached and level/role matched |51|
| Target wins2/2 |50|
| Target wins1/2 |1|
| Target unreached in both trials |1|
| Observed victorious target median inside the planned time band |35|
| Both wins and observed median inside the band |34|
| Observed medians below the lower time bound |15|
| Observed median above the upper time bound |1|
| Whole-area victories |88/104|
| Trials retaining over-cap source containers losslessly |28|

Target outcomes and whole-area outcomes are separate. A later boss loss does
not erase an earlier target victory. Both unreached targets remain failures in
the started-trial denominator; their duration is absent, never zero. All
observed prefix levels and victorious XP awards agree with their forecasts.
Seed1 reached-target enemy compositions match the frozen production plans.
No later-act completed-objective concern appears in these selected sources.
Same-act boss loot and intended gear power still require review.

Two conditional seeds do not establish population win rates or final timing
bands. In particular, observed fast results are concerns for later exploration,
not grounds for a global nerf. The current band comparison uses trash5–20s and
elite10–35s; it does not replace the required100-seed exploration or disjoint
tuning/holdout acceptance.

### Cases requiring further work

| Case | Observed target result / victorious median |
| --- | --- |
| Necromancer Summon II trash / elite |2/2 each;3.880 /7.760s, fast|
| Zeal II elite |2/2;6.750s, fast|
| Fire Druid I elite / II trash |2/2 each;8.030 /2.476s, fast|
| Fire Sorceress I / II / IV elite |2/2 each;7.890 /8.520 /8.338s, fast|
| Fire Sorceress III trash |2/2;4.260s, fast|
| Javelin I trash |2/2;20.522s, slightly above the proposed bound|
| Javelin I elite |1/2; sole victory30.452s|
| Javelin II elite |2/2;7.734s, fast|
| Martial I elite |0/2 reached; both die in preceding wave3|
| Martial II elite |2/2;2.690s, fast|
| Traps I / II trash; II elite |2/2 each;3.548 /4.650 /3.460s, fast|
| Summon Druid II elite |2/2;7.290s, fast|

Next investigate Martial I on its retained source, without farming first:
`p15-martial-capacity-native-v1.json`, SHA256
`c4d20fa7771099241e8f424f72768a5cf15a7c4e8ba09f87d255182a9fb8e72f`.
Hero18 has Fists17/Talon1/Cobra1/Tiger1 and one unused earned point. At
preceding wave3 it enters181/349HP or179/349HP against level17 enemies, dies in
10.680/12.460s, and retains minimumMP174. The matched level18 elite is wave4.
Seed1 across its four attempted waves casts Fists40times/Talon9times and never
Cobra/Tiger: native charge saturation and finishers execute, so do not claim a
missing discharge implementation. Review owned cadence/recovery, carry-life
mitigation, eligible gear and complete set ownership before acquisition/tuning.

Retain the Javelin I split separately. Its seed8 level12 elite starts351HP,
dies26.700s later with minimumMP147, and receives mostly physical direct damage.
That source has no free skill points. More mana is not the demonstrated missing
capability. Both failure contexts and original inputs are frozen in the
measurement overlay; no policy is selected using future seed outcomes.

## Evidence and validation

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- Specs/drivers: `p15-build-act-role-screen-v1.*` and `-v2.*`; preserve the
  failed v1 process and four completed native records.
- Current native report: `p15-build-act-role-screen-v2.json`, with forecast,
  budget, progress and104 pinned raw records, four marked inherited.
- Passed independent audit: `p15-build-act-role-screen-v2-readback-v3.json` and
  `p15-build-act-role-screen-readback-v3.py`. It checks source/export hashes,
  all2091 production inputs, exact preparation/custody/costs, native awards,
  events/outcomes, source access boundaries, party life/mana/cooldown carry and
  actual at-target levels/roles. Existing inventory and every earned added item
  remain accounted for, including the61123-item source.
- Initial reader assertions incorrectly assumed every entry starts at its
  final aura-adjusted maximum, then conflated bare and passive-projected life.
  V3 preserves full native Barbarian entry life and verifies Oak Sage's explicit
  no-heal capacity metadata. Both failed reader receipts remain; no combat is
  replayed for these reader corrections.
- `p15-build-act-role-measurement-overlay-v1.json` links the52 role groups,
  failure triage and unchanged recipe counts. It supplements the immutable
  catalog/recipe overlay; it does not promote final acceptance.
- Both executed driver versions pass scoped strict types/focused lint. Reuse
  unchanged210 BUG552/112 BUG553 checks. No broad suite or unrelated act replay.
- Closure: `p15-build-act-role-screen-artifacts-v1.json`, SHA256
  `06f217cc54210b3bcd4c45444312904891dc0e08ea3ed2a8f6a70a992b289336`;
  141new file pins,31prior pins verified, nine terminal receipts including the
  retained three failed attempts. Two configs archived/removed; both task Vite
  caches absent. No owned process remains live.

With nine previously measured recipes,60 of61 selected matched recipes now
have native target observations. All61 have a screen; Martial I elite remains
unreached. Recipe counts stay61matched/75unmatched/68boss-review/6missing,
68/70decoded cells, accepted balance count0 and historical14/14main routes.
Full skill/build/role acceptance, disjoint samples, economy/fairness/pacing and
integrated release gates remain open. No gameplay production edit, agents,
installs, commits, pushes or publication. Root retains the required packet/live
human2 claim for the umbrella goal; original checkout stays read-only.
