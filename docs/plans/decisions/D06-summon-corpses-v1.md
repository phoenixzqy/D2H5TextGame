# D06 v1c — Necromancer battle-start preparation

Status: GD/TD approved the bounded contract; implementation and player-facing
acceptance remain pending. This card covers startup behavior for three skills, not full
skill, corpse-economy, P09 or private-v1 acceptance.

## Overview and controlling sources

Choose battle-start preparation for Raise Skeleton, Raise Skeletal Mage and
Revive, extending [D06 v1b](D06-summon-preparation-v1.md). Canonical
`Diablo2TextGame.md` §5.2 requires one startup release to cap without ordinary
actions or repeated summoning. This card explicitly supersedes v1b's deferred
corpse requirement for these three: they require no selected, stored or consumed
corpse. No finite or unlimited corpse supply is inferred from dead units.

A finite supply would require production, eligibility, ownership, competition
and replay rules, and would lack a natural supply at the first wave's startup.
The chosen abstraction preserves the canonical idle/combo flow. It gives up
corpse scarcity for these preparations. A shared corpse economy remains a
separate decision; this card neither implements nor accepts its other consumers.

## Player fantasy and scope

The Necromancer enters each wave with a prepared retinue and makes build choices
through allocation, combo order and available mana. This serves the canonical
build/discovery fantasy and predictable resource tradeoffs. Official skill names
remain. Revive uses the existing rank-scaled Revived Minion template; choosing a
fallen enemy and inheriting its properties are not part of this v1 adaptation.

Mage currently makes basic attacks. Its elemental-spell promise is not proven by
this preparation change. Player copy must describe actual behavior; broader Mage
combat identity remains an explicit P10 follow-up, not a completed skill claim.
Likewise, no full Revive skill/fantasy acceptance follows merely from startup.

## Detailed rules

| Canonical skill → template | Authored unlock / direct prerequisite | Current batch MP / resulting cooldown |
| --- | --- | --- |
| `necromancer.raise_skeleton` → `skeleton` | Level 1 / none | 15 / 1 s |
| `necromancer.raise_skeletal_mage` → `skeletal_mage` | Level 12 / Raise Skeleton | 22 / 1 s |
| `necromancer.revive` → `revived` | Level 30 / Raise Skeletal Mage | 45 / 4 s |

These are current production JSON values, not new tuning. JSON registration
overrides legacy builders; Skeleton's builder cooldown 0 is not authority.

1. Extend existing production preparation eligibility: correct class/catalog,
   learned integral allocation, authored unlock and direct prerequisites,
   explicitly slotted combo and authoritative rank. Canonical/authored duplicate
   slots resolve once. An unlearned or foreign-class slot does not gain rank 1;
   standalone synthetic compatibility remains separate.
2. Use the existing time-zero preparation phase, in stable owner/skill order.
   Require a living owner and living opposing sides; skip terminal battles.
   Count living units by owner and exact template. Full/over-cap preloads remain
   untouched and cost nothing. Never heal, rescale or reposition preloaded units;
   dead IDs remain reserved under accepted battle-local collision-skipping IDs.
3. Stage every missing unit and validate source/template/candidate before any
   payment, identity allocation, scheduling or RNG changes. Pay one existing
   rank-adjusted mana cost for the whole missing batch. Insufficient mana or
   invalid input creates no cast, spawn or debit and receives no later retry.
   No partial batches, corpse tokens, dead-enemy consumption or inventory debit.
4. Ignore only that skill's stale carried cooldown at startup; set the normal
   resulting cooldown once. Consume no ordinary action or unrelated RNG draw.
   Preserve existing cast/payment attribution and per-unit summon events.
5. Exclude these skills from ordinary selection throughout the battle. Matching
   prepared-owner/template deaths, including preloads, give no mana refund,
   cooldown clearing or replacement. Valid full/poor preparations establish the
   existing transient death authority; invalid preparations do not. Preserve
   same-template synthetic legacy behavior without that authority and all other
   death/orphan/status/orb ordering.
6. Preserve coexistence and position rules; no new shared family/total cap.
   Apply D05 Skeleton Mastery once to fresh eligible player-owned Skeleton/Mage
   after ordinary rank scaling, retaining fractions. Exclude Revive and preloads.
7. Revive retains the authored generic template, not an enemy's identity, stats,
   skills, gear or rewards. Its units last until normal death/orphan removal or
   wave end; add no independent expiry timer. Mage's existing basic attacks stay
   unchanged in this bounded preparation slice.

## Formulas and independent examples

For allocated rank `r` in 1–20, Skeleton cap is 1 for ranks 1–5, 2 for 6–11 and
3 for 12–20. Mage/Revive cap is `r` for 1–3, otherwise
`3 + floor((r - 3) / 3)`; ranks 1/2/3/6/20 give 1/2/3/4/8.
`missing = max(0, cap - livingSameOwnerAndTemplate)`.
For a valid affordable missing batch, `manaAfter = manaBefore - rankedCost`;
otherwise mana is unchanged. Current costs are constant across ranks.

Rank-6 Skeleton life/Attack/Defense 162/35/19 becomes 168.48/35.7/19.19 at
Mastery 1 and 291.6/49/22.8 at Mastery 20. Rank-6 Mage 123/45/10 becomes
127.92/45.9/10.1 or 221.4/63/12 respectively; magic dodge stays 0.09.
Rank-6 Revive is 210/38/23, with or without Skeleton Mastery. These preserve
existing template bases and authored per-rank growth; no stat calibration here.

Example: rank-6 Skeleton with one damaged living preload and 15 MP creates one
fresh unit at time zero, leaves the preload intact and ends preparation at 0 MP.
With 14 MP it creates none and spends nothing, even if later recovery exceeds
15 MP. An already-full group creates none and costs nothing at any mana level.

## Edge cases and transaction ownership

Retain D06 v1b's malformed-source/candidate, alias, two-owner, preload collision,
zero/full/over-cap, dead-owner, terminal, resource-failure and no-retry rules.
Extend exact source validation for Skeleton's cap-3 curve and Mage/Revive's cap-8
curve; do not relax invalid-source atomicity to admit them.

Each new wave rebuilds transient summons and pays from actual D04 carried mana,
preserving all recovery carries and compensation. Allocation/mastery changes
affect the next wave. Explicit replay recomputes from captured original resources
and carries with deterministic events/IDs and no duplicate rewards. Playback and
save/load do not make a second debit. No new save shape, corpse state or persistent
summon state. Normal load resumes through existing battle/wave ownership rules.

## Dependencies and player presentation

Depends on D06 battle-local identity, D06 v1b preparation/eligibility, D04 wave
resource carry and D05 Skeleton Mastery. Data flows from authored JSON and Player
allocation through the existing store adapter to immutable per-wave engine input;
transient preparation/death authority never flows back into the save.

Before player-facing acceptance, update existing zh-CN/en description keys
`necromancer.raise-skeleton.desc`, `necromancer.raise-skeletal-mage.desc` and
`necromancer.revive.desc` in the skills namespace. Remove the corpse-selection,
elemental-spell and fallen-enemy/timed-expiry promises that this path does not
deliver. Describe actual prepared units, no corpse requirement, one paid batch
per wave and no in-wave replacement/refund. Revive copy names 复生仆从 / Revived
Minion and death/wave lifetime. Current/next cap, mana and Mastery-derived stat
detail must agree. Verify normal controls in both locales at mobile 360×640 and
desktop; no new corpse-selection control is implied.

This preparation creates/consumes no corpse resource for Corpse Explosion,
Poison Explosion, vines, Redemption, Find Item/Potion or monster resurrection.
Their behavior remains unchanged and unaccepted by this card. Iron Golem still
requires a separately reviewed selected metal inventory-instance transaction.

## Tuning knobs

Preserve current JSON costs, cooldowns, rank growth, max rank, unlocks and
prerequisites. Costs/cooldowns are feel knobs, growth/cap curves are curve knobs,
and unlock/prerequisite levels are gate knobs. Numeric ranges/defaults remain
those accepted by existing schemas; do not invent extra ceilings. Future changes
require numerical design/balance evidence. This contract adds no new knob and
makes no earned-progression, TTK or affordability claim.

## Acceptance criteria and implementation order

1. Freeze independent literal oracles for all three skills at ranks 1/2/3/5/6/
   11/12/20: cap, time zero, one payment, aliases, missing/full/poor batches,
   invalid sources, no later retry, no ordinary replacement/refund, two owners,
   preload preservation/collisions, terminal/dead guards, input immutability and
   recorded/plain/A-A/A-B-A determinism. Add fresh real-canonical Mastery and
   Revive-exclusion proofs. Obtain genuine RED before source edits.
2. Preserve legacy replacement/refund controls under explicit cloned synthetic
   skill identities; do not overwrite production registrations to fake legacy
   compatibility. Keep the original historical Mastery recording attributable
   when adapting its fixture; new real-canonical preparation receives separate
   proof. Replace obsolete corpse3 exclusions with positive eligibility/UI tests;
   retain Iron/unrelated synthetic controls. Keep each increment ≤5 paths and
   commit before the next. No temporary production compatibility modes.
3. Run focused, engine, full-unit, typecheck, lint and production build gates for
   the combined source. Verify native allocation/respec/next-wave resources,
   explicit replay, save/reload and bilingual production-browser preparation.
   Imported scaffolding is not earned-campaign/balance proof. Confirm a player
   can understand one batch payment and loss until next wave; experiential
   acceptance remains unmeasured until browser/playtest evidence exists.

No runtime acceptance is granted by approving this contract. Full D06/P09/P10,
all other corpse consumers, selected-item Iron Golem, earned campaign/balance and
private-v1 checkpoints/gates remain open.
