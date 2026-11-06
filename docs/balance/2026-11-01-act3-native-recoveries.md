# Act III: four retained build recoveries

Four previously unresolved setups now clear both retained seeds1/8 through all
six Durance waves and canonical level47/33600HP Mephisto. These are conditional
survival diagnostics, not full balance approval. Ready boss sources stay58;
accepted balance cells stay0. No production code, game data or authoritative
campaign save changed.

| Retained setup | Available native adaptation | Mephisto seconds1 /8 | Hero final HP |
| --- | --- | --- | --- |
| Holy Bolt Paladin25 | Ormus free stat reset; move20Energy to20Dexterity |47.580 /45.140|536 /536|
| Bow Amazon31 | MultipleShot before InnerSight |50.220 /43.200|177 /266|
| Javelin Amazon28 | Eight unused points to Impale8; four owned Rogue swaps |45.924 /45.924|147 /190|
| Bone-labelled Necromancer28 | Two unused points unlock LifeTap; context-specific learned curses |39.636 /37.524|462 /462|

## Holy Bolt and Bow

Holy Bolt's original failed case remains full-life with ample mana; eight
paralysis skips and1380/2760ms cast intervals explain its throughput problem.
Complete native owned critical/cadence comparisons find no guarded hero upgrade
and no complete eligible set. One native free Ormus stat reset reallocates the
same120points: core25/20/73/87 becomes25/40/73/67, AS140→160 and turns1380→1220ms.
Life536 stays; mana361→331. Stat allowance3→2, skill2 stays. Both areas clear with
minimum MP316. Gear, ranks, aura, merc, currencies/materials stay exact. Hammer10
is much weaker than Bolt20 under actual mitigation; no futile Hammer control.

Bow's InnerSight-first order competes with MultipleShot20, casting roughly every
three seconds despite its eight-second duration. The free reversed order clears
both complete areas, including the original seed8 prefix death. All37paid ranks,
zero free points, core, gear, merc and skill1/stat2 allowances stay. Minimum MP
75/50. One boss win is50.220s, slightly outside the50s target. This changes neither
Inner Sight implementation nor its advertised semantics.

## Javelin: points and party carry

The source owns LightningStrike20 and its prerequisite chain, with8unused
points. Eight ordinary native allocation actions legally learn Impale8, making
26paid+8free become34paid/0free. Lightning+Impale packs, then Impale-first boss,
reach Mephisto twice but die after107/52HP entry. This answers the earlier
cooldown-gap failure without hiding the remaining carry problem.

A complete native owned comparison finds no hero improvement under its declared
floors and no full eligible set. Four unused Rogue items (head/chest/gloves/
offhand) increase life324→413, defense237→246, flatMR18→24 and Lightning46→61;
offense stays. Native equip transfers preserve every item and its payload.
Rogue survives into the fourth/fifth packs versus the third/second in the
points-only control. Boss entry improves to321/214HP;
both complete areas win. Rogue still dies before Mephisto. Minimum area MP94/80.
Hero gear/core, reset allowances and currencies/materials/farming stay unchanged.

## Bone-labelled setup: recovery and limits

The actual source is corpse-heavy: CE20 plus nine rank1 skills,5free points,
stat2/skill0 allowances. BoneArmor1 is already passive and active. BoneSpear is
not learned; its rank5 raw88–118 cannot overcome the target's magical mitigation.
These results do not validate BoneSpear build viability.

Native owned projections cover339unused items and complete sets. The guarded
hero helm offers only a small tradeoff; reserving that helm leaves no additional
Prayer package improving under the floors. Final controls keep all original gear. Reusing the earlier earned route's free resource order still fails both
retained cases. Spend exactly2of5available points on IronMaiden1 prerequisite
and LifeTap1;3remain. LifeTap25%physical healing for9mana brings hero and Prayer
to full life through three packs, but physical bursts still kill the fourth.
Weaken fixes one case; adding BoneWall1 does not qualify the other and increases
mana pressure. Add already-learned AmplifyDamage only where the fourth pack's
Hulks have50Physical resistance. Keeping four skills through the fifth pack
regresses seed1 through mana/action pressure, so restore the cheaper order there.

Freeze the same wave-context policy for both seeds before the final two areas:

| Waves | Priority |
| --- | --- |
| First three packs | CE, LifeTap |
| Fourth pack | Weaken, AmplifyDamage, LifeTap, CE |
| Fifth pack | Weaken, LifeTap, CE |
| Mephisto | AmplifyDamage, Weaken |

Both final areas win with hero462/Prayer492HP. Minimum MP55/0: the zero-mana
observation remains a sustain concern. All original29ranks are preserved;31paid
ranks plus3free points conserve the34-point budget. Core, equipment, mercenary,
reset allowances, currencies/materials and farming stay. This is a declared
manual wave-context adaptation, not evidence for robust default automation.

## Verification and next work

Across all retained new controls:20areas/108waves,11area wins and9failures in
70.094wall seconds. Bone accounts for12areas/60waves; final qualified policies
supply8complete wins/48waves across four setups. Every failure stays visible.
Separate author readers check native point/reset/equip costs, complete custody,
canonical enemies, events, rewards, carried resources/cooldowns and aggregate
income;120altered-record controls are rejected. Since Javelin/Bone original
cases never reached boss, readers explicitly authenticate HolyBoltIII's existing
canonical Mephisto reference rather than invent baseline boss observations.

New shared drivers pass scoped strict types and focused lint once; spec-only
controls reuse those results. Reuse unchanged210BUG552/112BUG553 checks. Two
setup errors are retained: Holy's expected MP321 corrected to331 before combat,
and a readonly-array type correction before Javelin merc execution. No completed
battle, earlier act or resolved control is replayed to repair a checker.35owned
receipts are terminal (33pass/2setup failures); six configs archived/removed,
14exact caches absent, no owned process left alive.

Return to intended-power/point/acquisition histories and outstanding encounter
coverage; do not extend these resolved diagnostics automatically. All213skill/
build dispositions,210roles, missing areas/sources, disjoint acceptance,
economy/fairness/30–50active-hour pacing and final integration/mobile/locales/
a11y/PWA/endgame/save/soak/review/owner playtest remain open. Browser works;
CI is excluded; no pending answer or external blocker.

Overlay: `p15-act3-native-recovery-overlay-v1.json`. Closure:
`p15-act3-native-recovery-artifacts-v1.json`. Required evidence remains at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1` for
umbrella acceptance; root owns eventual cleanup after consumers finish. Root
retains the live human2 claim; original checkout stays read-only.
