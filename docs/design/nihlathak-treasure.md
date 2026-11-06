# Nihlathak’s recovered treasure

Status: bounded P14 side repair; independent DESIGN-REVIEW APPROVE.
This card makes the already-ratified compact Act V obligation concrete. No
runtime or save29 freeze begins before Drognan/current28 local acceptance and
independent design APPROVE.

## Overview

Make `quests/side-act5-nihlathaks-treasure` executable: after the qualified
Nihlathak victory, explicitly Recover his relic in Crystalline Passage, complete
the existing single fetch, then separately Claim the authored XP and ratified
exact unique amulet. Preserve the quest/item/objective IDs and existing reward
mechanics; add no dungeon, new combat encounter, currency or reward subsystem.

## Player fantasy

Discover Nihlathak’s hidden keepsake after confronting him, then receive Cain’s
recognizable treasure reward. Actual recovery serves Discovery and Competence;
separate journal Claim lets the player choose when to receive it. Follow the
canonical GDD and invariants; studio pillar files are absent, as recorded by
the prior side contracts. Earned pacing and owner playtesting remain separate.

## Detailed rules

Preserve side type, Act V, giver `npc/cain`, `obj-fetch`, fetch type and
`quest/nihlathak_relic`. Replace the obsolete area with canonical
`areas/act5-crystalline-passage`; author finite target
`objects/nihlathak_relic_cache`. Add an objective-sourced `kind:'tool'`
definition with name/description keys and no effect or consumer. This retained
archival relic uses no ordinary gear slot or backpack capacity and has no sale
value, Give or Read action.

Recover requires the live Normal, unlocked Act V Crystalline Passage, an
ordinary-action-ready hydrated hero, no active combat/run, and the exact tracked
unclaimed side row, either in progress or historical completed. It also requires
the full existing qualified Prison of Ice graph: canonical completed main row,
find/thaw/kill objectives, actual Inspect/receive-potion/Thaw receipts, the
consumed exact Malah potion and
`quests/act5-prison-of-ice#action:nihlathak-victory`. Use the accepted graph
authority for the bound `act5-cp-nihlathak` encounter and its prerequisite Thaw;
do not infer qualification from kills, clear arrays or completed flags. The
main reward need not be claimed and the resistance scroll need not be Read.
No additional area clear, hero level or Talk requirement is introduced.

Only explicit Recover earns own source
`quests/side-act5-nihlathaks-treasure#objective:obj-fetch`, exact
`{itemId:'quest/nihlathak_relic',state:'owned'}`. Publish that receipt, true
`obj-fetch` and terminal completed side status coherently under the shared quest
lease, with no XP or ordinary item. Listing/visiting the cache and completing
the boss fight alone grant no relic or side completion. Preserve neighboring
quests’ staged fetch semantics.

Separate journal Claim requires the exact canonical definition/reward bag,
complete qualified main graph, exact owned relic and completed exact side row,
plus ordinary action readiness. Later Claim may occur in any location or
difficulty. Keep the relic owned. Award authored 12000 hero XP and one
`itemDrop:{uniqueId:'items/unique/mara-kaleidoscope',ilvl:82}`, replacing only
the unsupported placeholder string. Reuse existing numeric preflight,
`gainExperience`, captured prior-fielded actual mercenary XP helper,
`rollUniqueItem`, deterministic quest seed and lossless backpack ingress. No
autoequip or claimant-level substitution. Preserve Mara’s base, reqLevel 67,
+5 each core stat and +25 fire/cold/lightning/poison/arcane; no physical
resistance or permanent quest resistance entitlement. Acquisition below 67 is
legal; ordinary equipment requirements remain authoritative.

Prepare the whole reward privately, preflight the whole destination before any
publication, recheck remaining ingress at each item boundary, and mark claimed
last. A full backpack retains the item in visible recovery overflow. Repeated
Recover/Claim, later discarding the amulet and moving the relic grant nothing.
Use the existing named-unique reward preview without allocation or raw IDs.
Both locales replace Halls of Anguish/Pit of Acheron with the actual qualified
Crystalline Passage route; retain named Recover/journal/quest-item controls,
zh-CN primary/en parity and ≥44px controls.

## Formulas

Recover awards zero XP/items/currency beyond one archival relic receipt. First
Claim awards 12000 hero XP; prior-fielded actual mercenary receives
floor(12000×0.75)=9000 XP, otherwise zero. Existing progression/cap rules and
ordinary level-up points apply, without combat/offline multipliers or direct
extra points. Exactly one Mara is materialized at ilvl 82; 82≥reqLevel 67.

Seed remains
`hashSeed(JSON.stringify(['quest-unique-v1',player.id,quest.id,uniqueId,82]))`.
Failed attempts reproduce properties; unpublished allocator gaps remain allowed.
Do not rewind shared allocation, persist another seed or add weighted fallback.
Repeats award zero; archival relic count remains one.

## Edge cases and compatibility

Only after accepted28 and independent design APPROVE, freeze actual accepted28
quest/item/action/campaign admission before allocating current29. Prove literal
historical equality; do not capture widened live catalogs. Preserve established
historical material/runeword/respec/repair/Warband/tome policies without a broader
arbitrary-catalog freeze. Version-only28→29 migration infers no relic, objective,
main proof, unique, XP or compensation.

Native29 rejects unknown, malformed, consumed, getter/inherited or mismatched
relic sources and contradictory graphs. An owned relic requires the exact
completed side objective plus qualified Prison graph, and remains legal after
Claim. Historical completed/unclaimed side flags without relic stay readable;
they require actual qualified Normal Recover before Claim. Claimed legacy side
history stays claimed/inert, receives no inferred relic/reward and cannot
Recover for replay. Existing main legacy rules govern earning missing actual
Prison proof; this card adds no bypass or compensation path.

Hold the shared quest lease through preflight, publications and restoration.
Recheck hero/readiness, exact definition, side row, physical source and qualified
graph inside the lease and after observable publications. Reject stale/foreign
source, context changes, unsafe numbers, duplicate ownership, reentry,
hydration/import replacement and silent or throwing callback mutation.

Synchronous failure restores deep scoped side/source and reward progression.
Track the prepared amulet by original ID and captured object references, even
after callback rename, transfer, mutation or removal. Resolve identity collisions
without deleting independent items. Remove all failed-reward
ownership from backpack, stash, hero/any mercenary equipment, both existing gear
quarantines and affected actor mirrors; mirrors never count as another owner.
Conserve displaced pre-existing gear exactly once. Preserve independent slot
replacements; recover displaced originals losslessly to unequipped backpack
overflow if their old slot is independently occupied. Preserve unrelated items,
quarantine metadata, currency/materials, journal rows, hero settings/core/resources,
nonrecipient progression and independent fielding/dismissal. Restore only
participating hero/actual recipient progression; do not resurrect a removed or
foreign hero/recipient. Rebuild affected mirrors and equipment-derived caches
from surviving canonical maps, preserving/clamping resources without a heal.
Do not copy Ormus’s older whole-hero/roster rewind as the rollback policy.
Attempt every owned restoration and verify deep postconditions; any restoration
write/postcondition failure is an explicit AggregateError. A retry earns the
whole bundle once. Intermediate writes are observable; browser-crash atomicity
is outside this synchronous guarantee.

## Dependencies

Qualified existing Prison graph → canonical side objective/bound item catalog →
finite cache discovery → protected terminal Recover → exact retained source →
guarded existing unique/XP Claim → quest-item/inventory presentation and
save/export/import/Continue. Root owns integration and save-validator sequencing.
Current29 reader/migration follows accepted28 freeze. Use
[compact Act V ratification](compact-act5-contract.md),
[exact unique rewards](quest-unique-reward.md),
[Drognan’s numeric publication](drognan-tome.md) and existing physical ownership
conservation policy; add no replacement reward or inventory subsystem.

## Tuning knobs

Curve: retain 12000 hero XP, 75% merc share and the existing unique’s stats.
Gate: actual qualified Nihlathak then Normal Crystalline Passage Recover;
ilvl 82, ordinary reqLevel 67 equip rules, no new clear/hero-level threshold.
Feel: named cache, visible retained relic, separate journal Claim and named
unique preview. Keep authored content JSON/i18n-driven; change no drop rates,
combat math, progression curves or existing main rewards.

## Acceptance criteria

1. Independent design APPROVE and accepted28 precede save29/runtime work.
   Meaningful capability failures then precede implementation; source tests
   prove exact finite definition and qualified main graph rather than copied
   flags. Recover coherently earns relic/objective/terminal completion only,
   with legacy, wrong-context, repeat, reentry and observer-fault controls.
2. Preview/execution reject unearned sources; real Recover→Claim retains the
   relic and awards the exact Mara plus authored hero/prior-fielded merc XP
   once, including no merc, below 67 acquisition and full-backpack overflow.
   No award properties depend on area, claimant level, clock or shared RNG.
3. Injected failure/mutation at each publication proves scoped rollback/retry,
   including renamed/removed/moved reward references, both quarantines,
   hero/merc gear/mirrors, displaced-item collisions, unrelated writes,
   removed/foreign actors and failed restoration. Claim is marked last;
   neighboring quest semantics and ordinary Mara equip effects remain intact.
4. Literal28/current29 controls and required local unit/type/lint/build checks
   pass. Production headed browser covers both locales, 360×640/desktop, real
   Recover→Claim, named relic/unique, repeats and exact Save/export/import/
   close/reopen Continue. Disclose imported capability state; owner playtest,
   earned campaign balance/pacing and all other P14 obligations remain separate.
