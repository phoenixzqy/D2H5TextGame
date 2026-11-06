# Trap Assassin Act III: owned armor, skill allocation and boss priority

Status: the second frozen control clears both retained diagnostic seeds. Four
areas / 24 waves retain the first control's split result. No production code,
game data or authoritative campaign save changed. Full private v1 remains open.

## Source and preparation

Use the original level25 / XP50171 / ordinal300 source,
`p15-traps-act3-native-v2.json`, SHA256
`5fb70bd546d9cbe9d3722bbc80d195271fc252669e8be0a65695f225329c29e6`.
Baseline seed1 dies at wave3 and seed8 at wave4; minimum mana316 does not identify
mana depletion as the failure. Preserve both failures and their complete carry.

Pure native projections inspect223 unused items,118 eligible for the hero;
after reserving three hero selections the mercenary pool is220 /112 eligible.
No complete owned sets are omitted. An initial comparison incorrectly applies
the hero's two-handed/offhand mutex to mercenaries and fails before combat.
The separate eligibility reader and projection2 use the actual mercenary store
slot rules; inherited crossbow plus shield is legal under those rules. Keep
the failed driver and receipt. The mercenary gear proposal remains unexecuted.

Native equip four source-owned items: gloves `it-6wkhs-8la`, belt `it-902tu-8lc`,
boots `it-87x4o-8l8`, and sword `it-59p0r-8s3`. Keep the shield and all socket
contents. Combined native stats are544HP /421MP, Defense370, flatMR4, AS120,
crit15% /2.52, physical dodge25%, magic dodge14%; resistances Physical39,
Lightning50, Fire72, Cold43, Poison12, Arcane60. The sword trades attack speed
and flatMR for crit and shorter trap recurrence:3080ms instead of4380ms.
Pure standalone pulse rates describe that tradeoff; they are not fight forecasts.

One native free Ormus skill reset refunds29 ranks plus the existing2 points.
Allocate exactly31: FireBlast1, ShockWeb1, ChargedBoltSentry1, LightningSentry20,
BladeSentinel8. Skill resets1→0; stat resets3 stay, as do core stats, mercenaries,
materials and currencies. No farming or material/currency spend. Native stash
transfers make preparation space without losing any of the legacy124 backpack
items. Complete native store composition agrees with the combat actor preflight.

## Retained controls

| Policy | Seed | Area outcome | Mephisto time | Boss entry/final HP | Boss HP left |
| --- | ---: | --- | ---: | --- | ---: |
| Lightning first throughout |1|Victory|35.880s|483 /378|0|
| Lightning first throughout |8|Draw|60.000s|448 /108|7971|
| Lightning packs, Blade first for boss |1|Victory|41.580s|483 /361|0|
| Lightning packs, Blade first for boss |8|Victory|50.280s|448 /222|0|

The first control survives the former fatal prefixes. Its seed8 boss casts
Lightning19 times and Blade8; Physical contributes15570 damage versus10059
Lightning. Freeze control2 before execution: retain the same preparation and
Lightning-first packs, then use the native free priority command before wave4
settles to stage Blade first for boss wave5. No recorded wave is rewritten.
Seed8 then casts Blade16 /Lightning8 and clears. Seed1 becomes slower; do not
claim universal improvement. The entire five-wave prefix is semantically equal
between controls at each seed, including rewards apart from generated item IDs.
Minimum mana399 across all four areas. Rogue survives to seed1's boss but is
absent from seed8's boss; this does not establish whole-party survival.

## Verification and limits

`p15-traps-act3-owned-v1.json` and `owned-v2.json` retain complete compressed
native waves. The separate author reader `p15-traps-act3-owned-readback-v1.json`
passes full canonical party item custody, only the four declared equipment
swaps, native refund/allocation/reset allowance, unchanged core/merc/material/
currency boundaries, source pins, enemy streams, damage events, rewards and
cross-wave HP/MP/cooldown carry. Aggregate XP/items/materials/currencies/mercXP/
clear totals reconcile. Extra-point and altered-equipment controls are rejected.
Both launchers authenticate2091 unchanged production inputs. Scoped strict
types/no-any/unused lint pass; version2 changes only the checked driver's
version literal and frozen spec. Reuse210 BUG552 /112 BUG553 checks, with no
broad or earlier-act suite and no larger seed study.

Explicit seeds1/8 at saved ordinal300 are diagnostics, not actual acquisition
continuations. Local income and reset use are discarded. Four area executions
take12.816 wall seconds in total. Ten terminal process receipts:9 pass and the
retained pre-combat projection failure. Three exact temporary configs are
archived in `p15-traps-act3-config-archive-v1.json.gz` and removed; all five exact
Vite caches are absent. Required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
and the existing human2 worktree claim stay with root for umbrella acceptance
and eventual cleanup.

Adaptation overlay `p15-traps-act3-adaptation-overlay-v1.json` preserves the
original110 boss trials and58 accumulated ready inputs; accepted balance cells
remain0. These conditional results do not prove population, first-attempt,
within-three, intended-power, point-history, acquisition, holdout or independent
acceptance. Closure `p15-traps-act3-artifacts-v1.json` chains to the FireIII closure.

## Next unresolved work

Do not replay these successful controls. Read-only diagnosis
`p15-traps-act3-next-double-throw-act4-v1.json` pins DoubleThrowIV's two retained
prefix deaths at wave5, before Diablo. Hero entry257/395HP and incoming
Physical325/460 plus Fire22/86 favor inspecting complete owned physical/fire
mitigation and party carry. Existing Howl already casts; do not assume it is
missing. Compare native owned preparation before any reset, acquisition or
global tuning. Full skill/build/role/area, economy/pacing and final integration
requirements remain open; browser works, CI is excluded and no answer is pending.
