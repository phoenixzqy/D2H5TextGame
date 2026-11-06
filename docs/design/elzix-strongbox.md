# Elzix’s recovered strongbox

Status: approved design within the [Act II retained-cache family](act2-retained-caches.md)
alongside Horazon, under the [root-ratified unpublished P14 batch](../plans/p14-unpublished-batch.md).
Current31 acceptance and literal31 equality precede implementation. Independent design/numeric review
approves Eye18 and removal of unsupported gold without compensation. Root
ratification is recorded in the current31 packet's `elzix-design-ratification.json`.
Current31 remains frozen and root-owned. No runtime, data, schema, tests, builds,
save widening or version allocation is authorized by this document. Root chooses
one batch successor version only after literal actual31 freeze/equality; it remains
unallocated until that equality. Horazon and Elzix reach a focused-reviewed cache
checkpoint before Fara under the same unpublished successor. No separately accepted
Horazon-only or cache-only predecessor, or second pre-Fara freeze, is required;
all per-card mechanics stay exact. No runtime completion is claimed here.

## Overview

Make existing `quests/side-act2-lost-caravan` executable: Recover Elzix’s retained
strongbox from one finite object in existing Normal Far Oasis, complete its
single fetch, then separately Claim authored3000XP and one existing Eye of Etlich
at ilvl18. The concrete author recommendation replaces unsupported
`items/unique_amulet_random` with a named existing unique and removes unsupported
5000gold without compensation. This is an explicit new no-gold adaptation,
not a claim that the placeholder already meant this amulet. Keep29 areas and
canonical quest/objective/item identities. Add no selector, currency, vendor,
service, dialogue prerequisite, hand-in or combat encounter.

## Player fantasy

Discover the caravan’s lost keepsake and earn a recognizable, useful treasure.
One visible cache, a retained quest item and separate journal Claim support
Discovery, Competence and clear player choice. Follow canonical GDD sections3,
6.3,7.3 and8: unique itemization, lightweight mobile-first presentation, no gold,
no gambling and no durability/repair. The standalone pillar/anti-pillar files are
absent; the GDD’s actual pillars and project invariants remain the reference.
This card changes no attack/skill/resource-recovery/offline rules. Its bounded
numerical suitability is a design recommendation; earned build balance, pacing
and later owner playtest remain separate.

## Detailed rules

Preserve `quests/side-act2-lost-caravan`, side type, `acts/act2`, giver
`npc/elzix`, objective `obj-find-box`, fetch type and `quest/elzix_strongbox`.
Correct `areas/act2_far_oasis` to canonical `areas/act2-far-oasis` and bind one
proposed finite `targetId:'objects/elzix_strongbox_cache'`. Add exactly one retained
objective-sourced `kind:'tool'`, with localized name/description and no effect or
consumer. Its exact source is
`quests/side-act2-lost-caravan#objective:obj-find-box`, receipt
`{itemId:'quest/elzix_strongbox',state:'owned'}`. It has no ordinary gear slot,
backpack capacity, sale value, Read/Give/assembly/exchange or later activation.

Recover requires the live Normal, unlocked ActII, current canonical Far Oasis,
a hydrated ordinary-action-ready hero, no active combat/sub-area run and the
exact tracked unclaimed row, in progress or historical completed. Only explicit
named Recover publishes one owned receipt, true objective and terminal completed
status coherently under the shared quest lease. Recover grants no XP, amulet,
currency or points. No Radament kill, boss/main completion, area clear, hero level,
Talk/return trip, bandit encounter or other prerequisite is authored or added.
Canonical areaLevel18 fixes reward generation level; the existing Radament
encounter’s level20 is neither an item-level source nor a new recovery gate.
Visiting/listing the cache, copied flags and conversation alone grant nothing.
Preserve neighboring staged fetch/delivery/assembly behavior.

Elzix town dialogue is currently absent. `loadTownNpcs` exposes only canonical
existing dialogue, so a proposed Talk/hand-in would require a new NPC route.
This single fetch has neither objective, and QuestsScreen does not consume giver
metadata to advance it. The smallest card therefore preserves `giver:'npc/elzix'`
without inventing a phantom town control, vendor or mandatory conversation.
Both locales must describe journal Claim directly; adding optional Elzix town
presence is a separately assigned presentation task if later required by the
broader P14 town audit, not a hidden prerequisite to this reward.

Separate Claim requires ordinary readiness, the exact completed row/objective
and exact owned retained source, plus canonical finite quest/objective/reward
authority. The entire authoritative reward bag must equal
`{xp:3000,itemDrop:{uniqueId:'items/unique/eye-of-etlich',ilvl:18}}`.
Remove positive gold entirely; do not convert it to gems/materials/wishstones,
add a zero-gold UI chip, restore gold economy or grant legacy compensation.
Reject missing/extra/changed reward keys, alternate unique/level/XP, random
placeholder string, loot/profile/service substitution or contradictory row/source.
Revalidate loaded exact authority before preparation and after observable writes;
generic itemDrop schema acceptance is not quest-specific permission to pay.

Actual Claim uses existing `gainExperience` and captured prior-fielded actual
mercenary75% share. Keep accepted cap/level progression and ordinary level-up
points. No direct extra skill/stat points or combat/offline multiplier applies.
No mercenary is created, fielded or substituted. Later Claim may occur in any
location/difficulty. Retain the strongbox, mark claimed last and pay once only;
repeated Recover/Claim, moving proof or later discarding the amulet grant nothing.

Prepare exactly one `items/unique/eye-of-etlich` using existing `rollUniqueItem`
at fixed ilvl18 and existing `items/base/amu-brass`. Preserve unique reqLevel15,
base reqLevel10 and current fixed cold resistance15, defense20 and life15.
No qlvl override is authored. The existing base has zero maximum sockets.
Reward below15 is legal; ordinary equipment requirements remain authoritative.
No autoequip, copied template, stat rebalance, new proc, life-steal, Cold Chill,
heal or permanent quest resistance/stat entitlement is introduced. Resource/
resistance/defense benefits apply only through normal equipment composition.
The Eye’s existing passive defensive stats are a simple class-neutral proposal;
Nokozan Relic(req16) is also eligible but adds fire damage and a different power
budget, so it is not included or randomly selected. Later amulets start req25
and cannot enter an ilvl18 reward through claimant-level substitution.

Prepare/preflight the whole bundle privately and recheck item ingress after
observable boundaries. Use existing retained-overflow backpack insertion; a full
backpack keeps the exact paid amulet in visible recovery overflow. Never drop,
suppress, replace, autoequip or move it to stash as an implicit fallback. Keep
capacity and unrelated inventory state unchanged.

Preview reuses `items:unique.eye-of-etlich.name` and existing exact-unique reward
chips, with no allocation, RNG/store mutation, raw metadata or random-pool promise.
Both locales update `quests:byId.act2-lost-caravan.{name,desc,obj1}` and authored
source prose for Normal Far Oasis→Recover retained box→separate journal Claim
of the named amulet/XP. Add
`quests:areaObjects.tools.elzix_strongbox.{name,ready,owned,unavailable}` and
`inventory:questItems.elzixStrongbox.{name,description}`. Explain retained proof
with no later use; remove gold/random/return-trip promises. Use existing translated
item/area names and Recover/Claim controls, zh-CN primary/en parity, named target,
visible proof/journal status and44px touch targets at360×640 and desktop.
Player-facing copy stays in i18n JSON; this proposal specifies keys/obligations.
No selector/profile or ActIII Gidbinn contract change belongs to this card.

## Formulas

Let H=3000 authored hero XP, s=0.75 existing merc share and C∈{0,1} indicate
first valid Claim. Hero award=C*H; eligible actual recipient award=
C*floor(H*s)=2250 when C=1, otherwise0; absent recipient award=0. Existing
capped XP/progression rules decide stored values/ordinary level-up points.
Recover/repeats award0; direct additional skill/stat points=0. Unsupported
5000gold becomes no currency grant, with no exchange formula or compensation.

Retained receipt count after Recover remains1 before/after Claim. Ordinary unique
count granted=C. Generation ilvl=canonical Far Oasis areaLevel18; template
eligibility18≥(qlvl??reqLevel)=15, output level=max(18,15)=18. Keep fixed
coldRes15/defense20/life15 without XP/hero-level/difficulty scaling. No item-based
benefit applies merely for ownership or Claim; normal equip rules remain in force.

Attempt seed remains
`hashSeed(JSON.stringify(['quest-unique-v1',player.id,quest.id,'items/unique/eye-of-etlich',18]))`
using existing `createRng`/`rollUniqueItem`. No selection seed is added. Repeated
attempts with the same identity/config/catalog reproduce properties; unpublished
allocator gaps are allowed. Never rewind shared allocation, consume combat RNG,
use time/current area/claimant level or persist another seed.

## Edge cases and compatibility

Implementation shares the bounded cache runtime with Horazon inside one
unpublished P14 batch after accepted31; preserve actual31 and every older frozen
domain unchanged. Freeze accepted31's finite quest/item/action/campaign admission
and prove literal equality before any current schema/loader/save widening. Root
leaves the batch successor unallocated until that equality; do not assume32/33,
freeze unfinished source or capture widened live catalogs as historical authority.
This cache requires no migration payload. The one batch migration infers no
strongbox, objective/completion, Eye, XP, gold conversion, service or compensation;
reviewed empty structural defaults for another included module follow the batch
plan. No intermediate cache-only acceptance or second pre-Fara freeze is needed.
Existing historical material/runeword/stat/physical-source policies stay intact.

Native new receipt admission requires exact own JSON data properties, canonical
item/source/state and completed exact side/objective graph. Reject unknown,
malformed, consumed, inherited/getter, duplicate or mismatched sources and
owned/in-progress contradictions. Owned retained proof remains legal after Claim.
Historical completed/unclaimed flags without proof remain readable but require
real Normal Far Oasis Recover before Claim. Claimed legacy history stays
claimed/inert, cannot Recover/replay and receives no missing proof/reward/gold
compensation. Older readers must reject the new source; negative controls cannot
silently widen with mutable live content.

Share Horazon's approved final current31/runtimev8 cache semantics. Before
actual XP publication, compare the live hero exactly to its captured accepted
baseline; an accepted stale derived cache alone cannot cause refusal or eager
normalization. Actual `gainExperience(3000)` performs normal recomposition; after
that publication enforce canonical expected derived equality at each observable
step. Keep exact source/definition/context/actor/equipment baseline guards.

Hold the shared quest lease through preflight, preparation, publication and
restoration. Refuse stale/foreign source, wrong Recover context, locked ActII,
untracked/claimed/incomplete row, combat/run, pending hydration/import replacement,
unsafe numbers, reentry or silent/throwing observer mutation. Recheck exact live
authority after writes. Intermediate states are observable; browser-crash
atomicity is outside the synchronous guarantee.

Failure deep-restores this side/source and only participating progression while
preserving unrelated journal/material/items/settings, independent actors/XP and
fielding/dismissal. Track the prepared amulet by original ID and captured object
references after rename, mutation, move or removal; remove failed-reward ownership
from backpack/stash, hero/any-merc equipment, both gear quarantines and affected
mirrors. Resolve ID collisions without deleting independent gear, conserve every
displaced original exactly once and use visible unequipped overflow when its old
slot has an independent replacement. Never resurrect removed/foreign actors or
rewind the whole hero/roster. Rebuild mirrors from surviving canonical ownership.

Restore the original accepted derived cache only if original level/core/loadout/
canonical composition inputs still apply and no independent recomposing journal
step occurred. On that branch retain accepted nonresource cached values and
clamp Life/Mana to the minimum of preclaim, surviving current and restored maximum.
Independent real `gainExperience` or equipment/core/source recomposition retains
its fresh canonical result and independent damage. Preserve raw `addXP`’s raw
nonrecomposing behavior, including threshold crossings without extra normalized
level/points; preserve actual independent `gainExperience`’s level/points/cache.
Remove only this failed Claim’s3000/2250XP contribution. Preserve accepted
counted-vitality/equipment composition with no heal on either rollback branch.
Attempt every owned restoration and verify deep postconditions; restoration or
postcondition failure throws AggregateError. Clean retry pays the entire bundle
once, with no failed amulet or hidden source ownership left behind.

## Dependencies

GDD no-gold intent + existing Far Oasis/Eye content → accepted31 and approved
cache runtime/batch sequence → independent proposal review/root ratification →
immutable actual31 freeze/equality → root-selected batch successor admission →
bound quest source/object discovery → coherent Recover → retained proof → exact
unique/XP Claim → localized preview/inventory/quest presentation → focused checks/
independent review → cache checkpoint → later approved modules → final batch
checks/build/browser, including this card's save/export/import/Continue evidence.
Reuse accepted [Drognan](drognan-tome.md),
[Nihlathak](nihlathak-treasure.md), approved
[Horazon](horazon-lockbox.md) and [exact unique rewards](quest-unique-reward.md).
Existing quest-schema exact-unique object and quest-item bound-tool grammar fit;
new native physical-source admission still needs root-owned finite domain/version
integration. No new subsystem or dependency is proposed.

Source evidence for this adaptation, without re-auditing predecessors:
`src/data/quests/side.json:96–105` has targetless invalid-area fetch plus
3000XP/5000gold/random amulet; `maps/sub-areas/act2.json:243–252` fixes canonical
areaLevel18 versus independent boss20; `items/uniques.json:663–676` defines
Eye(req15/cold15/defense20/life15); `items/bases.json:409–415` defines brass amulet
(req10/amulet/jewelry/no sockets). Both item-name translations already exist at
`items:unique.eye-of-etlich.name`. ActII dialogue docs include only Atma,
Drognan and Greiz; `loaders/towns.ts:11–19` projects actual matching docs.
QuestsScreen has no giver-dependent progression path. GDD207–212 forbids gold,
gambling and repair; removing gold is not an implicit currency exchange.

Before implementation assign disjoint eventual ownership: root owns historical
freeze/version/save-domain/shared integration; feature owner owns exact Elzix
contract/Recover/Claim/scoped rollback; content/frontend owner owns this quest/
bound tool/locales/named presentation; independent reviewer/QA owns evidence.
Coordinate any shared `interactObject.ts`/`claimReward.ts`/map/journal edits with
root within the unpublished batch. The family implementation plan retains exact
runtime ownership/matrices; the packet's implementation addendum supersedes its
separate final-cycle/release sequence. This design assigns no additional runtime
ownership or agent/process/test/build execution, new BUG, commit or remote action.

## Tuning knobs

Feel: named explicit Recover, retained strongbox, separate Claim and named Eye
preview; preserve existing feedback/control budgets, both locales and44px targets.
Curve: retain3000hero/2250mercXP and Eye’s existing cold15/defense20/life15;
remove positive gold with zero compensation. Gate: fixed ilvl18 justified by
canonical areaLevel18, ordinary equip req15 and actual unlocked Normal Far Oasis,
with no new level/clear/Radament/Talk gate. These are fixed proposed card defaults,
not caller overrides. Later reward/curve changes need a separately reviewed
bounded decision; P15 still owns earned all-build pacing and numerical balance.

## Acceptance criteria

1. Independent review/root ratification explicitly accepts or revises
   random-amulet→Eye18 and removal of5000gold without compensation. Accepted31
   precedes implementation of either cache; actual31 freeze/equality and
   historical negative controls precede widening. No version number is assumed;
   migrations infer no source, gold/material exchange or reward entitlement.
2. Meaningful capability failures precede runtime work after those gates.
   Actual canonical Normal Far Oasis Recover alone earns one exact owned tool
   and terminal completed row/objective, with no reward. Cover wrong source/
   area/act/difficulty, locked act, combat/run, untracked/claimed/consumed row,
   flag-only credit, reentry and observer faults. No boss/clear/level/Talk/
   service/hand-in gate is introduced and neighboring staged flows stay intact.
3. Source-bound exact-bag Claim retains proof and delivers one Eye18 plus
   3000hero/2250prior-fielded actual mercXP once. Cover absent merc, below15
   acquisition/equip refusal with the hero still below15 after Claim XP, XP cap, legacy missing-proof history, full-backpack
   visible overflow, deterministic retry and moved/discarded reward. Changed
   XP/item/ilvl, gold/extra/missing reward keys, placeholder string/profile and
   contradictory source graphs refuse before allocation/payment. Preview is
   localized/readable and has no RNG, allocation or store side effects.
4. Publication faults prove scoped rollback/retry, renamed/moved/removed amulet
   identity, equipment/mirrors/quarantines, displaced-item collisions, unrelated
   writes, removed/foreign actors and explicit failed restoration. Public
   `importIntoStores` tests use unchanged valid accepted stale-cache exports
   with true source graphs; actual Recover→Claim uses real `gainExperience`.
   Success accepts the exact pre-XP baseline then enforces canonical caches
   without healing. Failure after real XP and at final claimed write restores
   accepted cache only when original composition/no-independent-recomposition
   conditions apply. Cover independent equipment/core/source/realXP/rawXP/
   damage, both XP APIs across threshold, baseline tamper and post-XP noncanonical
   controls. Preserve independent deltas and damaged Life/Mana; no failed amulet,
   gold, duplicate source, unearned cache bonus or partial payment remains.
5. Focused meaningful source/save/UI tests and independent review pass for the
   cache checkpoint. Required complete local unit/type/lint/production-build
   checks pass once on released final batch source; later shared edits refresh
   affected earlier checks/review. During final batch acceptance, production
   headed browser covers zh-CN/en and360×640/desktop, real Recover→separate Claim, named cache/
   proof/Eye, repeats/overflow and exact Save/export/import/close/reopen Continue.
   Source/claim/payment/generated amulet/caches/resources survive roundtrip.
   Imported capability setup is disclosed; copied flags alone cannot prove
   real recovery or an earned campaign.
6. Players can find the cache, distinguish retained proof from ordinary gear
   and understand journal Claim without searching for an absent Elzix hand-in
   or vendor. CI is excluded per user instruction. Owner/fresh-player playtest,
   earned30–50hour pacing, all46 authored quests, bounty, Elzix optional town
   presence and other P14 families retain their separate obligations. This card
   cannot silently mark any of those accepted.

No user question is required for routine source IDs, area spelling or reused
transaction mechanics. The concrete amulet/no-gold adaptation is independently approved and root-ratified;
implementation awaits accepted31 and its actual literal freeze/equality within
the one unpublished batch. The focused-reviewed cache checkpoint precedes Fara;
it is not separate publication or final acceptance.
No gameplay acceptance is claimed here.

Source observation UTC: 2026-10-30T03:02:33.472237+00:00

```text
5c047bf7e555bf7aea5b626123655bc3e15d3597c4f2c3a9499de4d408094dbe  Diablo2TextGame.md
363b81d1eb2e7f764f03ddd620a3f2f8c5aee1e86479c4ceba52b8620ba745fc  src/data/quests/side.json
9d2b7c7b099798eaf2619a2e0d6c148991f4490f88f8aa3923eccc7709c9b570  src/data/maps/sub-areas/act2.json
30bde84fcc958d20a8c7a2fb752b50d0a523c56bb467586166ccfcf2e8dd47c7  src/data/items/uniques.json
65da31d12abb6cb171a324da725ea634f1dde8f54779f3b03752042054fd1eed  src/data/items/bases.json
9008e4ba6cab78a3be76eb2eb4bc98930e7c639746de18fb62caca23f5c6c86c  src/data/loaders/towns.ts
cf4f115ef21e23bd52634b7fe0f331c45f84e9e883da707749e15c1293e2be33  src/features/quests/QuestsScreen.tsx
bb779fa15d6a780d7bd27137ff0574026a3ebd91da568ccb0e3f465054506390  src/engine/save/frozen-v30.ts
```

Audit execution: documentation-only; no repository edits, tests/builds/gameplay,
processes/agents, commits or remote mutation. `readersReleased:true` on handoff.
Root retains this shared packet artifact for review/installation and owns final
cleanup after all consumers finish.
