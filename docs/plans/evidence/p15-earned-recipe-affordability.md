# P12b/P15 — Earned recipe costs and source qualification

Verified 2026-11-04 on the existing `feat/playable-foundations` worktree. This
retained-output analysis connects the completed Fire Sorceress campaign to the
already committed [gem/Lore](p12b-earned-gem-and-lore.md),
[recruitment](p16-recruitment-readability.md) and
[recipe-family](p12b-earned-recipe-families.md) successors. No production source
changed and no gameplay, economic action, browser session, test suite or build
was repeated. Full economy/pacing and independent acceptance remain open.

## Earned source mix

Seven continuous native journals start with **empty material and currency
balances**, cover all 921 paid admissions and 4,595 settled waves, and end at
level53 / Normal next921 / material-action ordinal895. Each stage's deltas
reconcile exactly with its terminal native export; adjacent snapshots match.
Raw and settled wave material/rune-shard/wishstone amounts agree. Existing
failed attempts, controller farming, socket spending and salvage remain counted.

| Source recorded in the journals | Rune-shards | Wishstones | Gem-shards | Other accounting |
| --- | ---: | ---: | ---: | --- |
| Combat, admitted phase `farm` | 13,013,079 | 554 | 0 | 4,446 settled waves; 44,704 item awards |
| Combat, admitted phase `route` | 939,722 | 137 | 0 | 149 settled waves; 1,541 item awards |
| Quest actions | 415,633 | 340 | 3 | 15 item awards; one Pul and one Ist |
| Native salvage | 0 | 0 | 0 | 837 actions remove 45,728 items and yield 89,310 scrap |
| Campaign socket insertion | 0 | 0 | 0 | 58 actions consume 7Eld, 30flawed diamonds, 4flawed topaz and 17normal diamonds |
| Campaign terminal balance | **14,368,434** | **1,031** | **3** | **89,310 scrap** plus the exact per-material ledger |

All three original gem-shards come from the earned Hellforge Claim. There is
no unexplained inherited dust in this lineage. Source classification is the
journal's admitted area/phase plus quest/salvage/action identity. It does not
separate individual monster-drop channels or earmark fungible stock for a craft.
The full 96-group material/currency breakdown is retained in `audit.json`.

| Inputs later consumed | Farm awards | Route awards | Stock before these crafts | Stock at ordinal908 |
| --- | ---: | ---: | ---: | ---: |
| Ort | 77 | 4 | 81 | 80 |
| Sol | 40 | 3 | 43 | 42 |
| Ral | 104 | 1 | 105 | 104 |
| Hel | 17 | 1 | 18 | 16 |
| Amn | 42 | 1 | 43 | 42 |
| Flawless diamond | 76 | 3 | 79 | 76 |
| Flawless topaz | 80 | 7 | 87 | 84 |
| Flawless amethyst | 93 | 6 | 99 | 96 |
| Flawed skull | 171 | 4 | 175 | 173 |
| Chipped ruby | 129 | 6 | 135 | 134 |

Thus 90.57% of this route's rune-shards came from the controller's `farm` phase.
This heavily prepared route establishes observed stock, not an ordinary player's
acquisition probability or a recommended currency rate.

## Equipment origins and useful results

Each selected item is traced to its original settled reward and its unchanged
payload in the campaign terminal inventory, ignoring only equip-location flags.

| Selected instance | Earned location / admission ordinal | Base requirement at hero53 | Demonstrated use |
| --- | --- | --- | --- |
| Diamond Armet `it-3buzk-zn7` | Throne of Destruction /920 | Level45, eligible | Perfect diamond inserted, equipped and persisted |
| Lore Armet `it-1bbus-znh` | Throne of Destruction /920 | Level45, eligible | Ort/Sol assembled, equipped and persisted |
| Dusk Shroud `it-sd0h-zmc` | Ancient's Way /919 | Level50, eligible | Socket recipe, ruby insertion and clearing persisted |
| Zircon amulet `it-9e1x1-zf9` | Bloody Foothills /916 | **Level60, ineligible** | Caster recipe persisted; no equip/combat utility |
| Salvaged weapon `it-9401q-zfn` | Bloody Foothills /916 | Not equipped for this action | Native salvage yields3scrap |
| Salvaged cap `it-12a7h-4nb` | Dark Wood controller farming /181 | Not equipped for this action | Native salvage yields1scrap |

These are the origins of the particular demonstrated items. They do not prove
that no earlier eligible alternative base existed. Item level and required
character level differ: the Armets have ilvl76 but require45; the Shroud has
ilvl75 but requires50. Requirements remain unchanged.

The preceding gem/Lore packet already demonstrates native combat-module utility:
Magic Resist50→60 and deterministic Arcane damage220→210 for the diamond;
maximum mana680→694 and recovery39.728→41.704/sec for Lore. No combat was rerun
here. Caster amulet utility remains unproven because the level53 hero cannot
equip its level60 base. This example does not establish a recipe design defect
or justify lowering eligibility.

## Complete observed spending

All 13 already committed native material receipts896–908 reconcile against
before/after exports. Seven static recipe cost/output definitions also match the
current authored JSON; insertion/fusion/salvage transitions are retained with
exact identities and deltas.

- Perfect diamond: 3flawless diamonds +1gem-shard, followed by its insertion.
- Lore: Ort +Sol inserted in order into the selected two-socket helmet.
- Rune fusion: 3El→1Eld. The attempted Um→Mal remains refused and unchanged.
- Dust and topaz: 1flawed skull→2gem-shards; 3flawless topaz +1gem-shard→1perfect topaz.
- Armor socketing: Hel +Amn +that perfect topaz. Ruby insertion consumes1chipped ruby; clearing consumes another Hel +1flawed skull +100rune-shards and destroys the ruby.
- Salvage: the two earned items above yield4scrap.
- Caster amulet: 3flawless amethyst +1gem-shard→1perfect amethyst; Ral +that gem +20scrap +1,000rune-shards transform the same magic amulet.

The perfect gems are each created once and consumed once, with zero final stock.
Net crafting costs are1,100rune-shards, 1gem-shard and16scrap, alongside the exact
rune/gem changes above and 3El→1Eld. Intervening recruitment separately spends
100wishstones; all other inventory state is identical across that successor.
The final balance is14,367,334rune-shards /931wishstones /2gem-shards /
89,294scrap, with Normal next921 unchanged and material-action ordinal908.
Final export SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.

## Time provenance and remaining acceptance

The complete retained route contains34,535,285.934 logical combat milliseconds
(**9.593 logical combat hours**), including its failed attempts and preparation.
Native campaign timestamps advance by that battle clock. Browser craft export
timestamps occur days later and include inter-session/offline gaps. Accelerated
driver execution excludes human reading, equipment decisions and navigation.
None is a measured fresh-player active-time distribution.

The observed economic milestones are perfect diamond896, Lore899 and caster
amulet908, all after five-act completion at53 / next921. This analysis does not
establish earliest affordability or time to first rune/runeword/perfect gem/craft.
The exact missing pacing evidence is a prospectively recorded fresh-player
policy with active decision/navigation time and material/base acquisition
milestones. Existing timestamps cannot supply that retrospectively. D10's
active-time requirement and P15's population/faucet/sink calibration remain open.

The next utility qualification needs a genuinely earned, level-eligible magic
amulet and its own complete costs/equip/effect/persistence path; do not transfer
this character's amulet to an unrelated save or manufacture eligibility. No
new craft, leveling/farming allowance or production tuning is authorized by this
analysis itself. Retain the completed routes rather than replaying them.

## Evidence, review and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-earned-recipe-affordability-c00ucj4n`.
It retains the producer-reviewed bounded plan/security result, executable
`audit.py` and `qualify.py`, input hashes, seven-stage/source/action accounting,
static recipe/eligibility qualification and logs. All2,104files under `src/`
remain exact. This is implementer analysis; producer bounded review is separate
from independent QA acceptance.

Both audit processes exited0. No server, browser, test runner, cache, generated
repository output or disposable staging directory was created. Root retains the
required packet and referenced predecessor evidence through umbrella review,
then owns exact removal; the claimed human2 worktree remains for the active goal.
Counts remain **14/14ActI;11/14Normal;formal0/210**. Full privatev1 stays incomplete.
