# Javelin Act IV: bounded owned mercenary defense controls

Eight diagnostic areas complete in 11.655 seconds. Both frozen policies win
all four retained seeds, as did their existing boss-adaptation comparators.
The fuller owned loadout keeps the Rogue alive through the opening wave in
4/4 cases, versus 3/4 for chest alone and 0/4 with original merc gear. All
mercenaries still die before Izual. This resolves the immediate question about
opening survival; it does not establish a higher area win rate or justify
another automatic 100-seed extension.

## Source and controls

Retained packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Source remains `p15-javelin-act4-earned48-native-v2.json`, SHA256
`f68d3d45def279047057f45dd8e21d08024b1a988c13a270c1ab7837270273fe`.
Despite its historical filename, this is hero46/XP794504/normal ordinal1024,
with the owned Inner Sight Rogue31. Source claims Acts I–III and has no final
Act IV Claim. Explicit diagnostics do not advance its earned ordinal.

Both policies retain the previous hero preparation: nineteen earned skill
points, rare arcane chest for packs, belt Shael, Lightning Strike/Impale pack
priority, then original Silks/Impale-first before native Izual projection.
Exact hero socket cost per independently restored trial remains one Hel,
one flawed Skull, one Shael and100 rune-shards. Mercenary transfers add no
material/currency spend, resets, healing, farming or level changes.

Before seeing results, freeze two policies and seeds1/4/7/8:

| Policy | Source-owned stash items transferred through native APIs | Rogue maximum life / defense / MR / cold resistance |
| --- | --- | --- |
| Original comparator, reused | Original canonical merc equipment | 372 /255 /18 /0% |
| Cold chest only | `it-3ep22-295`, rare leather with two existing flawless Diamonds | 401 /262 /22 /17% |
| Fuller defense | Same chest; Bloodfist `it-76qmu-4pg`; Coif `it-2vayk-2cr`; shield `it-lkza-phm` | 461 /280 /24 /17% |

The fuller policy also raises lightning resistance46→61. Both preserve
attack325, speed216, physical dodge.262, magical dodge.05 and the original
Tancred scimitar. Requirements and slot compatibility pass the actual
`moveToBackpack`/`equipOnMerc` paths. Canonical merc authority is
`save.mercs.mercEquipment`; legacy equipment mirrors are not extra owned gear.
All hero equipment, including both chest policies, stays reserved.

Read-only production projections cover eligible stash armor/accessories and
the complete party's set ownership. Each owned set has only one distinct piece;
no additional multi-piece set bonus is available. The descriptive stash frontier
includes the hero-reserved arcane chest; it is excluded from tested merc policies.
No ready runeword is present. Projection alone is not combat evidence.

## Native results

Wave indexes below are zero-based. All enemy teams, battle/reward streams,
source ordinal and original hero opening input match the retained comparators.
Merc equipment changes subsequent combat, rewards and carried resources; no
claim of unchanged combat prefixes is made.

| Seed | Chest: Rogue death wave | Fuller: Rogue death wave | Chest: hero HP entering Izual → final | Fuller: hero HP entering Izual → final |
| --- | --- | --- | --- | --- |
| 1 | 1 | 2 | 694 →64 | 591 →434 |
| 4 | 1 | 1 | 524 →279 | 754 →509 |
| 7 | 0 | 1 | 290 →121 | 777 →608 |
| 8 | 1 | 1 | 531 →234 | 407 →110 |

Fuller defense supplies the missing opening survival in seed7 and extends
seed1 through another wave, but it does not dominate the smaller policy:
seed8 has less carried/final hero life. Preserve that tradeoff. Neither policy
has a mercenary at Izual. Izual is not the chapter boss; these results establish
no chapter-boss, within-three retry, holdout or final balance acceptance.

These are four retained diagnostic seeds per policy, not a population sample.
The prior 81/100 boss-adaptation aggregate and original 100/100 matched trash
study remain unchanged. Do not combine the new eight runs with those counts or
select a policy using future seed outcomes. Stop this local screen here and
continue the outstanding build/role power and acceptance work; further Javelin
trials require a named unresolved requirement and frozen policy.

## Evidence and validation

- Pure projection: `p15-javelin-merc-owned-projection-v1.json`.
- Frozen spec, native report and eight compressed raw records:
  `p15-javelin-merc-defense-v1.spec.json` and matching report/raw files.
- Independent reader: `p15-javelin-merc-defense-readback-v1.py`; passed result
  `p15-javelin-merc-defense-v1-readback-v1.json`, eight areas/40waves.
- Reader verifies source/export pins, full-party item custody, native transfers,
  unchanged hero gear/points/resets/costs, exact enemy teams/streams, initial merc
  projection, event outcomes and life/mana/cooldown carry. Dead mercs never revive.
- Both executed drivers pass scoped strict types and focused lint. The initial
  optional-map typing failure is corrected; its failed receipt is retained.
  Production2091 inputs remain unchanged, so reuse210 BUG552/112 BUG553 checks.
  No broad unit suite, historical campaign replay, agents or installs.
- Closure: `p15-javelin-merc-controls-artifacts-v1.json`, SHA256
  `117e75bd04d195a0bbf2d3e30f5795ff4e72d8869c59142ba5d26cbad01ee9bd`;
  31 new file pins,149 prior pins verified, six terminal receipts including the
  retained initial typing failure. Two disposable configs archived/removed;
  both Vite caches absent. No owned process remains live.

No production gameplay change, commit, push or publication. Required packet
and the live human2 worktree claim remain with root for the umbrella goal.
Original checkout stays read-only. Historical14/14 routes, catalog61/75/68/6,
68/70 decoded cells and zero accepted balance cells remain unchanged. Full v1,
including skill/build/role acceptance, economy/pacing and integrated release
gates, remains open. Browser works; CI excluded; no pending external blocker.
