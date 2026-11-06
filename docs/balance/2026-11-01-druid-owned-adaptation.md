# Druid owned adaptation screen

Status: CONCERNS. This closes a bounded diagnostic, not private-v1 balance acceptance.
All14 historical main routes remain complete; full v1 remains incomplete.

## Frozen inputs and decision

Evidence remains in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The authoritative earned save is unchanged:
`p15-druid-summon-act5-native-v2.json`, SHA256
`9c7dd2128895bcb31ee89b79811de8c0ccb732ea2e8ab9db57801bced8217b2a`.
It is level49/XP202871/normal ordinal942, with one free skill point and
stat3/skill1 resets. The fielded original Inner Sight Rogue is31.
Current2091 production inputs retain BUG552's source/data hashes; no production
code, balance data, earned item, material, point, reset, reward or ordinal changes.

SkillsScreen supports **nine** priorities (`COMBO_SLOTS`), not four. The earlier
order comparison replaced Poison with Raven and omitted the legal choice to
activate both. This screen corrects that policy gap. Carrion Vine1 is legal at49:
requiredLevel12, prerequisite Poison Creeper1, already learned.

Before battles, specs froze seeds1and8 and required2/2 whole-area clears to extend
a candidate to missing seeds2–7. No candidate qualifies; no extension is run.
Baseline eight-seed recordings are reused, never replayed. Full native area entry,
auras, summon preparation, resources, wave carry, playback and settlement remain
in use. All projected preparation and income are discarded after each trial.
No point, reset or material is committed to the authoritative save.

## Results

All ten new trials reach the ordinary post-Claim repeat-Throne wave5:19 level80
hostiles. All end in draws before Baal, with the hero alive. These are conditional
underlevel earned-state cases, not matched-power fixtures or a population over
challenge ordinals. Baal timing remains n0; historical first-clear9.10s is unchanged.

| Candidate | Free point spent locally | Clears | Hostile HP remaining, seed1 / seed8 |
| --- | ---: | ---: | ---: |
| Learned five: retain four priorities, append Raven1 |0|0/2|49161 /23124|
| Same five, Raven1→2 |1|0/2|20077 /46534|
| Same five, learn/append Carrion Vine1 |1|0/2|19555 /21263|
| Learned five + owned merc armor/gloves/ring |0|0/2|49161 /23124|
| Same merc package + owned cold-resistance axe |0|0/2|49161 /23124|

The first three candidates use unchanged equipment. Merc packages use native
custody/equip calls for Silks of the Victor (`it-7r9v8-42b`), Chance Guards
(`it-4sdyt-l7n`) and Angelic Halo (`it-1zjmi-3x8`). The second adds Axe of Fechmar
(`it-36h34-l7g`). Complete equipment/set projections preceded selection; the
available Angelic amulet/ring package's strength10 benefit is also recorded in
`p15-druid-owned-adaptation-inventory-v1.json`.

Merc defense rises206→317 and HP387→407. The axe trades attack253→225 and
MP302→275 for cold resistance6→26. These changes are visible in native combat
snapshots. The Rogue still dies at wave2/1740ms in all four package trials, before
the difficult pack. Later wave5 outcomes equal the learned-five candidates for
these seeds. Merc arrows and Inner Sight have no bow requirement; replacing the
wand does not unlock them. The owned training bow has no sockets. No paid socket
or weapon prescription follows from the earlier wand hypothesis.

Minimum observed hero MP across the ten new trials is463. The terminal wave
ends at51.10–56.88s with at least1000 logged action events and surviving enemies;
this is consistent with the production1000-action guard. All new trials have
zero actual60-second timeouts. More summons can increase action-budget pressure;
these small results alone do not justify changing that guard or summon formulas.

## Independent checks and corrections

`p15-druid-owned-adaptation-screen-v1-readback-v2.json` audits six trials/36waves.
`p15-druid-owned-merc-screen-v2-readback-v3.json` audits four trials/24waves.
They recompute outcomes, resources and damage from raw native events, compare
hostiles exactly to the saved same-seed baseline, verify point/reset/core stats
and canonical hero/merc equipment, and check full item-content custody and zero
material/currency spend for merc preparation. Raw compressed trial pins survive.
Scoped strict TypeScript and no-any/unused lint pass for current drivers and the
inventory projection. Unchanged210 BUG552 checks are reused; no broad/old-act run.

The original summary counted a whole-area duration≥60s as an encounter timeout.
Reader4 (`p15-druid-current-source-screen-v2-readback-v4.json`) fixes this using
the terminal wave duration, entirely from saved recordings. Original repeat-Throne
Poison has7 pre-time-cap draws/1 death and Raven order8 pre-time-cap draws;
neither has a60-second timeout. Oak retains its one genuine60-second boss draw.
Wins, combat recordings, TTK and historical controls do not change.

Merc driver1 stopped before its first battle because its expectation omitted
native `equipped=true`/`equipSlot` metadata. Driver2 fixes that exact assertion;
no completed trial is replayed. Reader2 then rejected an invalid assumption that
every canonical equipped item must duplicate its slot in optional metadata.
Reader3 uses canonical slot authority and still checks exact native metadata for
newly equipped merc items, allowing only custody metadata changes in item-content
comparison. Failed attempts remain retained; these are harness corrections.

## Next acceptance work

Stop extending this conditional level49-versus80 diagnostic. None met its frozen
selection rule. Do not prescribe farming, paid wards, another reset or a global
formula change from these results. Freeze the plan's70 build/act and210 role
fixtures at intended power, with explicit earned gear provenance, legal points,
all available priority slots, merc/summon rules and retry costs. Preserve this
case as an underlevel boundary. An original quest-source first-clear checkpoint
is needed to measure Baal; a completed-save repeat area is a different context.

213 skill/advertised-build acceptance,22 missing historical area cells,
current-source exploration/disjoint holdouts, acquisition/economy/fairness,
versioned30–50 active-hour pacing, final integration/mobile/locales/a11y/PWA/
endgame/save checks, two-hour soak/review and owner playtest remain open.
Browser works; CI is excluded; no pending answer/external blocker. Root retains
the packet and live human2 claim for umbrella acceptance. Exact process/artifact
closure is `p15-druid-owned-adaptation-artifacts-v1.json`.
