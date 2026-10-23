# Authentic v2 earned Rocky Waste continuation — stopped defeat

The single declared continuation won Rocky Waste W1–W3, then lost W4 at
5,400 ms when the original hero died. It stopped immediately. Rocky Waste
remains uncleared. No retry, Radament attempt, quest Claim, Book use, Arcane
entry, or ordinary Return after defeat was performed.

This result continues the authentic v2 terminal native export through exact
saved-domain service hydration. Full production snapshot equality was checked
before the two allowed actions: transfer actual pre-Far-Oasis amulet
`it-4fzod-2jh` into the Rogue's empty slot, then spend the actual skill point
on Ice Blast 8→9. Five stat points and all existing combos stayed unchanged.
The new Rogue stats actually contain the amulet effects: mana maximum 196,
critical damage 2.26, physical dodge 21.2%, cold resistance 30, fire resistance
11. The hero's equipment was unchanged.

Native saves omit transient combat HP/mana. No prior W5 HP/mana was copied or
healed; the ordinary next challenge constructed its native full-life opening.
This establishes a saved-domain continuation only, with no browser,
IndexedDB, public Save/Continue, offline accrual, full campaign, or C2 acceptance.

## Attempt and rewards

Preparation/source commit: `5be450a13622cfbc7f15281f880902f0d397550a`.
The worktree was clean; before-import, before-execution, and after-execution
source fingerprints are identical. Source tree:
`493a7ef012ddbc800714af6f8d55f0bb600b6abec35dced39cb81c84a4c76820`.
Data hash remains
`a1c9be78af566f3c9bd9fd8df22b25d81423fc1ab43e591c07fac3a794eee851`.
The [frozen plan](native17-v2-rocky-waste-frozen-plan.md) hash is
`77b9b64043e7d45844707af250e4db0ca00c00be30f111ac13d54a71ed4caa63`.

One ordinary manual challenge naturally returned ordinal **108**, seed
**3405854382**, and four waves. No seed or ordinal override was supplied.
The persisted next ordinal is **109**.

| Wave | Native result | Simulation time | Hero XP | Rogue XP | Items |
|---|---|---:|---:|---:|---:|
| W1 | player win / next-wave | 5,460 ms | 1,680 | 1,260 | 4 |
| W2 | player win / next-wave | 8,736 ms | 1,950 | 1,462 | 6 |
| W3 | player win / next-wave | 20,748 ms | 2,380 | 1,785 | 70 |
| W4 | enemy win / defeat | 5,400 ms | 0 | 0 | 0 |

Actual totals: **6,010 hero XP, 4,507 Rogue XP, 80 items, 6,284 rune shards,
one gem shard, five wishstones**. The hero remains L13, Ice Blast 9, zero skill
points and five stat points. The Rogue remains L16. W4 before-award,
after-award, terminal, and native-capture before/after earned hashes agree:
`e4dfe9a158d847b7b14c922b445d5ea212db0eaec3e3e8769c870e271815d660`.
All 3,401 prepared owned items remain, plus 80 uniquely identified earned drops.

## W4 recording

The hero begins at 342/342 HP and 241/241 MP; the Rogue at 293/293 HP and
196/196 MP. The hero ends at 0 HP / 239 MP, while the Rogue remains at
284 HP / 196 MP. All 15 enemies remain alive. The native original-hero
requirement terminates the run despite the surviving Rogue.

The frozen hero has defense 137, magic resist 0, magic dodge 8%, physical
dodge 14%, fire/cold/lightning resistances 30, physical resistance 20, poison
18, arcane 0. Its loadout is the same rare amulet/leather chest, Coif of Glory,
Naj wand, normal kite shield, gloves, belt, and boots as the source save.
Full item payloads and all effective combat stats are retained in the summary.

| Source / latest recorded action | Hero damage | Landed hits |
|---|---:|---:|
| Horror mage `-0-9ea9` / lightning bolt | 59 lightning | 1 |
| Horror mage `-4-3370` / lightning bolt | 91 lightning | 2 |
| Horror mage `-8-2d38` / lightning bolt | 109 lightning | 2 |
| Horror mage `-12-4101` / lightning bolt | 37 lightning | 1 |
| Horror mage `-4-3370` / frost bolt | 28 cold | 1 |
| Horror mage `-8-2d38` / frost bolt | 23 cold | 1 |
| Sand raiders / weak melee | 8 physical | 8 |

Recorded incoming damage totals **355: 296 lightning, 51 cold, eight physical**.
The final 50-lightning hit includes 13 overkill beyond the hero's remaining
life. The maximum single hit is **59 noncritical lightning** from the rare
elite at 3,498.823529 ms. No spell was dodged; two physical hits were dodged.
The Rogue takes nine physical damage. Damage events do not contain skill IDs;
the table joins each source to its latest prior action in the ordered recording.
Raw events are retained for verification.

W4 is a forced rare-elite presentation: one L18 horror-mage rare elite,
three L18 horror-mage rare minions, and 11 L18 sand-raider rare minions.
The rare elite has 1,015 HP, attack 234, defense 72, magic resist 26,
cold/lightning resistance 55, and other resistances 30. Mage minions have
521/540/561 HP, attack 152, defense 64, magic resist 17, cold/lightning
resistance 25. Raider minions have 353–421 HP, attack 152, defense 52,
magic resist 17, and zero resistances. Full stats, skill orders, and recorded
presentation are preserved; source scaling review is recorded with the final
specialist assessment below.

The source audit explains the L18 pack: area level 14 plus final-wave offset
three plus half the authored encounter's 16−14 offset yields 18
(`src/engine/combat/sub-area-run.ts:271,494` and `monster-factory.ts:147`).
The fifteen-member forced Act II elite pack is configured behavior; the smaller
Act I pack guard does not apply here. The elite's flat magic resist 26 is
`round((18−1)×1.5)`, and its extra 30 all-resistance is intrinsic to rare-elite
tier (`combatHelpers.ts:348`, `src/data/elite/elite-config.json:6`).

Snapshots omit an explicit elite-affix ID. All fifteen actors have appended
Fire Ball, which uniquely maps in the shipped configuration to
`elite-affix/extra-fire-damage`; `sub-area-run.ts:584` propagates that selected
skill throughout non-Act-I packs, and `combatHelpers.ts:347` appends it. This
is a source-consistent inference, not recorded affix metadata. No fire damage
occurred before the hero died.

The actual hero actor has Ice Blast rank 9 and casts it twice, dealing nine
and 13 cold damage to the rare elite. It also casts Frost Nova once, dealing
one cold damage to that elite. Different encounters, targets, mitigation,
and rolls prevent a measured rank-8 versus rank-9 damage attribution from
these observations. No alternate-rank projection or additional combat was run.

The observed spell values match the current formulas. Rank-9 Ice Blast has
77–97 raw cold damage; resistance then flat magic resist give
`floor(raw×0.45−26)`, or 8–17, consistent with nine and 13. Rank-2 Nova's
28–38 raw damage reaches the minimum one. The displayed attack stat is added
only for effects with `attackDamagePct`, which these spells do not use
(`src/engine/combat/combat.ts:420`, `damage.ts:153`). Lightning Bolt has 50–70
base damage (`src/engine/skills/builders.ts:207`). Frost Bolt chills the hero
at 3,400 ms; the lightning-versus-chill multiplier is 1.3
(`src/engine/combat/combo.ts:32`). With 30% lightning resistance and zero flat
magic resist, noncritical chilled lightning spans 45–63, consistent with the
largest observed hit of 59. This is multi-source spell pressure under the
current rules; no damage or scaling correctness mismatch was established.
A single under-levelled L13 loss does not establish global balance acceptance
or prove that any particular farming strategy will succeed.

## Authentic native evidence

The live production snapshot and exact export were captured and published
before caller cleanup. Snapshot and decoded native save agree at
`f7ad0d5e0a644ae1b101ec6f07d8f451e907224cc483f6db11fcc82ac4b207e6`.
The exact export SHA-256 is
`241e6a0a8b2eb0686bdd4dbeac363139558dbf47d139dcd9f1cea6c054711813`.
Raw and exported idle metadata are retained separately and agree at the frozen
clock. All execution, provenance, capture, publication, and cleanup diagnostics
are clear. Caller stores/methods, combat/hydration, clock, and elite pity were
restored by the passing driver. The dedicated process has exited.

| Retained artifact | Exact raw bytes | Gzip bytes |
|---|---:|---:|
| [Full report](native17-v2-rocky-waste-attempt.json.gz) | 26,826,518 | 699,586 |
| [Native export](native17-v2-rocky-waste-native-export.json.gz) | 1,404,754 | 32,076 |
| [Live capture envelope](native17-v2-rocky-waste-native-capture.json.gz) | 5,197,673 | 186,902 |

Each gzip has mtime zero and no filename, decompresses to the exact original
bytes, and recompresses deterministically. All raw/gzip hashes and ancestry,
adaptations, wave checkpoints, grouped diagnostics, and validation are in the
[summary](native17-v2-rocky-waste-summary.json). Historical v2 and earlier
defeat/refusal evidence remain intact.

## Validation and independent assessment

Before launch: seven no-combat contracts, typecheck, scoped ESLint with
`--no-ignore`, and whitespace check passed; both concrete specialist reviews
were READY after the unexpected-error preservation fix. The sole opt-in
invocation passed both driver tests in 13.43 seconds; route work took 2.49
seconds. No combat was rerun.

QA/save independently assessed the actual evidence **ADEQUATE**, recomputing
ancestry, exact prepared state, all rewards/owned IDs, native/terminal hashes,
source/reference equality, and exact retained gzip bytes. Design's independent
recording/scaling audit verified the stopped defeat, all damage totals, the
rank-9 actor/casts, and source-consistent mitigation, levels, pack composition,
and inferred affix. No correctness mismatch was established. Both specialists
finished consuming the raw evidence before cleanup.

After re-verifying every retained gzip against its exact raw output, the three
raw files and task-owned `harvest.mjs`/`finalize.mjs` were removed from
`/tmp/d2h5-native17-rocky-waste.HXwmZJ`. Its empty directory was removed and
verified absent. No task-owned scratch or process remains from this attempt.
