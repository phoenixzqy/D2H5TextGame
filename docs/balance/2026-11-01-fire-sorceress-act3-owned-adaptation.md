# Fire Sorceress Act III: physical mitigation and one owned Sol

Status: a frozen paid adaptation clears both retained diagnostic seeds. This
turn completes four areas / 23 waves: free owned armor 1/2, armor plus one Sol 2/2.
No production code/data or authoritative user save changed. Full private v1
and independent balance acceptance remain open.

## Exact source and diagnosis

Reuse the original quest-ready Fire Sorceress 29 / XP 3196 / ordinal 384 export, not an
ActIV/V source with FireMastery. Fire Ball 20 / Meteor 11, existing core and zero free
points/skill resets remain. Baseline seeds1/8 die at wave 4 after entering at 79/329 HP,
with minimum 344 MP. The prefix contains substantial Physical and Lightning
attrition. Rogue 25 dies early; an empty mana pool is not the failure.

`p15-fire-sorceress-act3-owned-projection-v1.json` compares all legal hero and
fielded-merc slots through current complete native stat composers. Unused pool 93,
hero eligible 92; reserve other actors' current equipment and all selected hero
items before merc comparison (remaining pool 91 / eligible 89). Canonical ownership
has no duplicate IDs. Native slot/eligibility/two-hand rules, sockets and partial
set bonuses apply; no complete owned set was discarded. Probe scores describe
fixed hits, not combat forecasts or intended power. The seven-swap merc proposal
remains unexecuted; test the smaller two-item hero proposal first.

## Free owned armor, including its retained failure

Native equip source-owned head `it-7qdy5-9ne` and chest `it-1ax9v-9ng` before
admission. Life 637→638, Defense 320→308, physical dodge 12→17%; Physical 11→27,
Lightning 25→52, Fire 74→87, Cold 38→51, Poison 14→42, Arcane 12→39. Keep Attack 144,
AS 135, MR 24, crit 12% / 2.56 and mana 394. Lower Defense is an explicit tradeoff.
Keep Meteor-first packs: FireBall's one-second cooldown would otherwise suppress
Meteor's all-enemy casts on 1420 ms turns. Native free order switch before staging
boss wave 5 uses FireBall-only; it does not rewrite an already recorded wave.

| Control | Seed | Area | Last wave | Last-wave time | Entry/final HP |
| --- | ---: | --- | ---: | ---: | ---: |
| Two owned armor swaps | 1 | Defeat | 4 | 9.480s | 479 / 0 |
| Two owned armor swaps | 8 | Victory | 5, Mephisto | 43.864s | 185 / 114 |

Seed1's old fatal position now starts at 479 HP instead of 79, but still loses to
critical burst: three 131 Physical hits, 516 direct / 31 periodic damage and 62 actual
healing. Preserve this failure; do not turn a single successful seed into a
population claim. Rogue still dies at wave 1/3 respectively.

## One native paid insertion

The selected head's one socket is originally empty. Pure native previews compare
every owned rune/gem; source has5 Sol / 16 Nef. Retained critical-damage probes favor
one Sol: Physical 27→34; raw 602 critical probe 131→89 versus 101 with one Nef.
Raw 662/710 probes become 128/160, not a promise about every future hit. All other
casting stats stay. No socket contents are cleared or overwritten.

Freeze the new control before battle. Retrieve the owned helm, call native
`actions/socket-insert`, spend exactly one Sol and advance material action
ordinal once, then equip it and the same chest. Each independent diagnostic
starts from the same five-Sol source and records local 5→4; no authoritative save
loses materials. No currency, skill/stat points, resets, merc change or farming.

| Control | Seed | Area | Mephisto time | Boss entry/final HP |
| --- | ---: | --- | ---: | ---: |
| Owned armor + one Sol | 1 | Victory, all 6 waves | 44.714s | 371 / 301 |
| Owned armor + one Sol | 8 | Victory, all 6 waves | 43.864s | 346 / 312 |

Minimum MP 344 in both areas. Rogue still dies at wave 1/3; the control does not
establish party survival. Seed1's wave 3 carry improves 536→611 HP and wave 4 finishes at
371 HP; seed8's corresponding carry 623→631→346 HP. Native HP orbs/heals are capped
and included; do not attribute all improvement to an isolated mechanic.

## Evidence, limits and cleanup

`p15-fire-sorceress-act3-owned-v1.json` and `paid-v1.json` preserve compressed raw
waves and exact streams/enemies. Explicit diagnostic seeds 1/8 and ordinal 384
leave the saved admission counter unchanged and discard local income. These
are not actual new acquisition continuations. Separate author readers verify
full canonical party item custody, only the declared socket-content change,
exact native equip/payment/ordinal/currency/rank/core/merc boundaries, events,
rewards and carried HP/MP/cooldowns without combat replay. Altered owned defense
and terminal mana controls are rejected. Paid reader reconciles aggregate XP,
materials, currencies, merc XP and area clears. No independent sign-off follows.

Current adaptation overlay: `p15-fire-sorceress-act3-adaptation-overlay-v1.json`.
Original 110 boss-screen trials, source/recipe/role overlays and 58 accumulated ready
catalog inputs remain unchanged; accepted balance cells 0. Two seeds per policy
are conditional observations, not first-attempt/within-three/population/holdout/
intended-power/point-history/acquisition or final acceptance.

Four new diagnostic admissions / 23 waves take 14.104 wall seconds of battle-driver
execution. Seventeen terminal scoped receipts: 15 pass / two corrected failures.
An unexecuted driver ordinal inference error was fixed before combat. Socket
projection 1 incorrectly required exact attack speed for every insert despite
beneficial core-stat rune effects; retain executed 1, use 2 with no-decrease checks.
Scoped strict types/no-any/unused lint and both author readers pass. Reuse 210
BUG552 / 112 BUG553 checks; no broad/earlier-act suite or resolved-route replay.

Five exact temporary configs are archived in
`p15-fire-sorceress-act3-config-archive-v1.json.gz` and removed; all five exact
Vite caches are absent and owned processes terminal. Retain required evidence
packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
and the live human2 worktree claim for umbrella consumers; root owns eventual
cleanup. Decision `p15-fire-sorceress-act3-decision-v1.json`, closure
`p15-fire-sorceress-act3-artifacts-v1.json` chains to prior ActIII owned recovery.

## Next unresolved work

Do not extend or replay the qualified FireIII controls. Read-only diagnosis
`p15-fire-sorceress-act3-next-traps-diagnosis-v1.json` pins TrapAssassinIII's
original 25 / ordinal 300 source and two failed prefixes. It has two free points,
Lightning 20 / Charged 7 / no Blade and minimum 316 MP. Seed 1 dies at wave 3 from 395 HP with
561 Physical damage; seed 8 dies at wave 4 from 445 HP with 236 Physical / 232 Lightning
after merc attrition. Compare actual available skills/points and owned mitigation
before another reset/farm; do not copy the qualified ActII reset's point budget.

Full 213 skills / builds / 210 roles / 22 missing area cells, intended power, economy,
disjoint holdouts, fairness / 30–50 active-hour pacing and final integration/mobile/
locales/a11y/PWA/endgame/save/soak/review/owner playtest stay open. Historical 14
five-act routes remain recorded. Browser works; CI excluded; no pending answer
or external blocker. Root remains sole writer; no agents/installs/commits/pushes/
publication in this continuation.
