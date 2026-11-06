# Ormus’s first concrete charm

Status: approved bounded implementation contract, 2026-10-29. Independent
design/technical review is APPROVE and producer plan review is ready. Root owns
integration; numeric defaults are provisional for earned balance/playtesting. This
completes one advertised side-quest and first charm path under D10/P12b/F10/P14,
not the complete charm catalog or earned campaign balance.

## Overview

Replace the unreachable Ormus side-quest’s nonexistent shaman/dungeon references
and unsupported random-charm string with an earned Normal Flayer Jungle clear,
ordered Ormus Talk and explicit Claim of one named charm. One hero equipment
slot gives that concrete owned item an explicit, reversible build effect.

## Player fantasy

An identifiable enchanted keepsake rewards exploration and provides a visible
Life/Mana equipment choice, serving Discovery, Fantasy and Competence. Players
choose whether to equip it; a full backpack retains the reward in ordinary
visible overflow. The pillar/anti-pillar files referenced by studio templates
are absent; review against the canonical GDD and project invariants instead.
Experiential balance and owner playtesting remain separate acceptance.

## Detailed rules

Add exactly one hero `charm` slot. Extra charms remain ordinary backpack/stash
items under existing retained-overflow rules. Claim never autoequips. Only an
exact charm base in that canonical hero slot contributes charm effects; copies
in bags, stash, quarantine, actor mirrors, arbitrary equipment keys or mercenary
equipment add none. Store actions and native-save admission reject charm items
in another slot, noncharms in the reserved slot, mercenary charms and duplicate
ownership. Preserve the treatment of unrelated historical equipment keys.

Author validated JSON base `items/base/small-charm`, type/slot `charm`, reqLevel1,
no stat requirements, maxSockets0, nonmetal and no random affixes/base rolls.
Author unique `items/unique/ormus-charm` on that base, reqLevel1, qlvl32, weight1,
fixed `statMods:{life:20,mana:10}`. Acquisition initially belongs to this quest;
ordinary treasure-class integration is separate content work. Use localized
item-name keys for “奥玛斯的护符” / “Ormus’s Charm” and localized slot/reward copy.
An old unknown unique ID attached to a known noncharm base remains inert; adding
this definition must not activate it. No carried-item scan or bonus cache.

Preserve quest `quests/side-act3-ormus-charm` and first objective
`obj-kill-shamans`. Replace its impossible count10 kill with one `clear-area`
objective for `areas/act3-flayer-jungle`; append `obj-return-ormus`, Talk to
`npc/ormus`. Both locales describe that actual clear and return, without the
nonexistent dungeon or ten-shaman promise.

The clear and finite proof
`quests/side-act3-ormus-charm#action:flayer-jungle-victory` publish together only
from an accepted, bound live Normal **manual ordinary-area** run completing its
full native sequence with the original hero alive. Capture quest eligibility,
canonical area and source before settlement. Require the same actual recording
and settlement authority. Generic `markCleared`, prior clear arrays, copied
flags, matching kills elsewhere, Nightmare/Hell replay, playback-only replay,
idle/endgame, replaced recordings,
defeat/draw/abort and repeated settlement grant no proof. Include the proof in
participating settlement rollback keys. A fresh full Normal manual re-entry
to an already-cleared area remains eligible, including for legacy proof repair.

Protected Talk requires the actual current-town Act III Ormus interaction,
Normal difficulty, ordinary quest-action preflight/readiness/combat guards,
the clear proof and ordered first objective. Completed/unclaimed legacy rows
can earn missing real proof and then Talk despite historical completed flags.
Claimed legacy rows remain claimed and receive no compensation or repeated XP.
Both Claim preview eligibility and execution require actual proof plus both
objectives. The existing journal remains the location for explicit Claim.

Reward is existing5000 hero XP plus one exact unique object
`{uniqueId:'items/unique/ormus-charm',ilvl:32}`. Reuse the supported exact-unique
constructor, whole-bag preflight, private preparation, lossless backpack ingress,
global claim/save guards, participating rollback and claimed-last publication.
Claim remains valid when no mercenary is fielded; otherwise the captured
fielded mercenary receives the existing75% share. Discarding the charm never
enables another claim.

## Formulas

The charm contributes flat Life20/Mana10 once through existing equipment
composition; downstream percentage modifiers apply normally. Equip/replacement
preserves current resource amounts or clamps them if the resulting capacity is
lower. Removal uses
`life=min(oldLife,newLifeMax)` and `mana=min(oldMana,newManaMax)`; no heal, revive,
proc or regeneration. The next native snapshot receives the composed capacities.

Existing quest mercenary share is75%, so5000 hero XP yields3750 captured fielded
merc XP before existing progression limits. Claim does not apply combat/offline
multipliers. Seed construction remains
`hashSeed(JSON.stringify(['quest-unique-v1',player.id,quest.id,uniqueId,32]))`.
Failed attempts reproduce properties; unpublished instance allocator gaps remain
allowed. No second reward RNG service or persisted seed is introduced.

## Edge cases and compatibility

Use save25 if24 remains current. Before changing catalogs/slots, freeze literal24
quest/action/campaign/endgame authority and item-base admission, with real
acceptance tests for old unknown unique strings and arbitrary equipment keys.
Thread the historical domain through raw, normalized and nested checks. Older
validators must not acquire the new catalog through live loader closure capture.

Migration validates its literal predecessor first and infers no new proof,
objective, item or reward. If the old hero `equipped.charm` holds a nonnull
known item, append it to the existing backpack; then append every mercenary
`charm` entry in deterministic merc-ID order, including orphan maps. Retain
overflow, IDs, unknown fields, rolls, affixes, sockets and personalization.
Intentionally normalize only ownership metadata (`equipped:false`, remove
`equipSlot`). Set an existing hero charm key to null; preserve an absent key as absent. Remove
mercenary charm keys, including null entries. Preserve other equipment, stash, currencies/materials/XP/history and
existing quarantines. Rebuild only affected actor mirrors from authoritative
maps; mirrors never provide another owned item.

Hero recovery recomposes its equipment-derived cache once with restored affix
Maps and existing quest entitlements, preserving/clamping current resources as
above. Merc-only recovery leaves the hero cache unchanged. Mercenary saved stats
and resources are bare baselines and remain unchanged; native projection omits
the recovered item naturally. A second decode cannot repeat recovery. No new
recovery ledger is needed; preserve any existing inert unknown inventory field
such as `legacyCharmRecovery` verbatim rather than taking over its namespace.

No-capacity reward refusal, duplicate claim, callback mutation/throw, rollback
failure, absent merc, ineligible area/source and malformed import must conserve
participating ownership/income or return an explicit failure. Existing atomicity
scope remains synchronous settlement, not a new browser-crash transaction claim.

## Dependencies

Validated item/quest JSON → loaders/schema → hero equipment eligibility/picker/
comparison → canonical stat composition → native combat snapshot. Bound ordinary
run settlement → protected clear/proof → guarded current-town Talk → existing
exact-unique Claim → inventory/progression. Save25/migration, adapters, export/
import and Continue preserve exact item ownership, proof, objectives and claim.
See [D10](../plans/decisions/D10-material-economy-v1.md),
[exact unique rewards](quest-unique-reward.md) and
[ADR-014](../decisions/ADR-014-first-charm-ownership.md).

## Tuning knobs

| Kind | JSON default | Interpretation |
| --- | --- | --- |
| Feel | Life20, Mana10 | Conservative proposed capacity choice, not measured sustain |
| Gate | full Normal Flayer Jungle, ilvl/qlvl32 | Existing authored area and exact unique eligibility |
| Curve | heroXP5000, existing merc share75% | Retain authored quest income |

Capacity1 is the reviewed equipment boundary, not a hidden balance multiplier.
Do not tune combat, drop rates or campaign progression from the two Sorceress
baseline losses while implementing this feature.

## Acceptance criteria

- Meaningful capability failures precede implementation; focused tests then
  establish exact slot admission, inactive copies, no duplicate effect, reversal,
  resource preservation, native snapshots and illegal merc/slot rejection.
- Literal predecessor tests preserve accepted unknown payloads, complete item
  conservation/overflow, historical flags, conditional cache behavior and second
  decode stability; malformed native25 state is rejected before mutation.
- Lawful bound clear → actual Ormus Talk → explicit Claim grants the exact item
  and existing XP once. Negative source/order/repetition controls and injected
  transaction faults prove refusal/rollback, not merely happy-path flags.
- Localized360×640 and desktop UI expose the named reward, charm slot and equip/
  remove controls; public Save/export/import/close/reopen/Continue retain the
  same owned item and recomputed effects. Separate constructed boundary evidence
  from genuine earned progression. Applicable local checks pass; CI is excluded
  by owner instruction.
- Owner playtesting after implementation evaluates whether the reward is clear
  and the equipment choice useful. Do not claim that feedback or complete
  charm/campaign/economy/balance acceptance from this bounded increment.
