# Horazon’s recovered lockbox

Status: approved design for one P14 side-quest family; implementation not started.
Revision2: inherit final current31/runtimev8 accepted-derived-cache semantics.
Independent design/numeric review approves the named-ring adaptation, and root
ratification is recorded in the current31 packet's `horazon-design-ratification.json`.
Current31 acceptance and an immutable freeze of its actual admitted domain must
precede any runtime, data, schema, test, build or save widening for this card.
Root leaves the successor version unallocated until literal actual31 equality.
Runtime grouping is governed by [Act II retained caches](act2-retained-caches.md);
publication follows the [unpublished P14 batch](../plans/p14-unpublished-batch.md).
Horazon and Elzix share one bounded runtime and focused-reviewed checkpoint before
Fara, under the same unpublished successor as the batch's other approved modules.
There is no intermediate accepted cache version or second pre-Fara freeze. Every
per-card mechanic and acceptance obligation below remains required; final broad
checks/build/browser run once on released final batch source.

## Overview

Make existing `quests/side-act2-summoners-secret` executable: explicitly Recover
Horazon’s lockbox in the existing Arcane Sanctuary, complete its single fetch,
then separately Claim authored XP and one existing Manald Heal. Replace the unsupported random-ring placeholder with this named unique at
ilvl23 as the smallest concrete adaptation. This is a ratified delegated design
choice, not an assertion that the old placeholder already meant Manald Heal. Preserve29 areas and all canonical quest/objective/item identities;
introduce no selector, currency, service, encounter or hand-in.

## Player fantasy

Discover Horazon’s hidden keepsake and receive a recognizable gift associated
with Atma. Explicit recovery serves Discovery and Competence; the named reward
and separate journal Claim support player choice and clear feedback. The
canonical GDD sections3/6.3/7.3 support light text-first discovery and unique
itemization. Its no-gold/no-gambling/no-repair and offline-multiplier rules remain
in force. The separate `pillars.md`/`anti-pillars.md` files are absent; this
proposal follows the GDD’s actual pillars and project invariants. It changes no
combat ordering, skill, recovery, damage-type or offline mechanics. Pacing and
experiential balance still require their own later earned evidence/playtest.

## Detailed rules

Preserve `quests/side-act2-summoners-secret`, side type, `acts/act2`, giver
`npc/atma`, objective `obj-find`, fetch type and `quest/horazon_lockbox`.
Replace obsolete underscore area with `areas/act2-arcane-sanctuary`; bind one
finite `targetId:'objects/horazon_lockbox_cache'`. Add exactly one retained
objective-sourced `kind:'tool'` item definition with localized name/description
and no effect, consume action or ordinary inventory slot. Its identity is
`quests/side-act2-summoners-secret#objective:obj-find`, exact receipt
`{itemId:'quest/horazon_lockbox',state:'owned'}`. It uses no backpack capacity,
has no sale value and cannot be equipped, Read, Given, assembled or exchanged.

Recover requires current Normal, unlocked ActII, live canonical Arcane Sanctuary,
an ordinary-action-ready hydrated hero, no active combat or sub-area run and the
exact tracked unclaimed side row, in progress or historical completed. Only an
explicit named Recover earns the receipt. Publish receipt, true `obj-find` and
terminal completed side status coherently under the shared quest lease. Recover
awards no XP, ring, currency or points. There is no authored kill, Summoner
victory, area-clear, main-quest prerequisite, level or Talk requirement to add.
Atma already exists in town; no new dialogue, NPC in a combat area or mandatory
return trip is needed. Listing, visiting, conversation and copied objective flags
alone cannot grant the physical source or authorize Claim. Keep neighboring
multi-stage fetch/delivery/assembly publication semantics intact.

Separate journal Claim requires ordinary action readiness, the exact completed
side row with its exact true objective, the exact owned lockbox source and the
canonical finite quest/objective/reward contract. Revalidate the authoritative
loaded definition before preparation and after observable publications. The
entire reward bag must equal `{xp:5000,itemDrop:{uniqueId:'items/unique/manald-heal',ilvl:23}}`:
reject changed XP, unique identity or level, extra/missing keys, legacy string,
profile substitution, additional reward/service or contradictory source/row.
Use existing schema/loaders plus a quest-specific exact contract; accepting the
generic itemDrop object grammar alone is insufficient authority for this quest.
Do not infer eligibility from a generic completed flag or a similarly named ring.

Inherit the final current31/runtimev8 accepted-derived-cache policy. A valid
publicly imported save may retain a derived-stat cache that differs from a fresh
canonical composition. Before this Claim's real XP publication, compare the live
hero exactly with the captured accepted baseline (plus the other exact ownership,
source, equipment and quest guards); do not reject or eagerly normalize it merely
because its accepted cache is stale. The baseline remains exact: deferring
canonical-cache equality does not permit mutations to that baseline. Publish
actual `gainExperience(5000)` through the accepted participant journal, letting
that real operation perform its normal recomposition. From that publication
onward, require canonical derived-stat equality with the expected current
level/core/loadout/quest-source composition after each observable write. No
fixture/import patch, fake success stub, direct `addXP` substitution or weakened
post-XP check may hide the baseline-to-canonical transition.

Award5000 hero XP and the existing75% share to the captured prior-fielded actual
mercenary, if present. Apply accepted cap/level progression and ordinary level-up
points, with no direct extra point/stat reward or combat/offline multiplier.
Keep the lockbox owned after Claim. Later Claim may occur in any location or
difficulty through the ordinary guarded claim boundary. Mark claimed last;
repeated Recover/Claim, later discarding the ring and moving the retained proof
grant nothing. No owned/fielded mercenary is created or substituted for payment.

Prepare one `items/unique/manald-heal` through existing `rollUniqueItem`, using
its actual template/base and authored ilvl23. Preserve reqLevel15, +20mana,
+15life and the existing base. Award below15 is legal; ordinary equipment rules
remain authoritative and there is no autoequip. Neither pickup nor Claim is a
heal, regeneration, mana-leech or permanent quest-stat entitlement. The ring’s
existing equipment effects apply only through normal equip/derived-stat routes.
Its modest class-neutral resource stats and canonical areaLevel23 support the
bounded adaptation; this is not a simulated all-build balance signoff.

Preflight the whole bundle and lossless inventory destination before publication;
recheck remaining ingress at each item boundary. Use existing retained-overflow
backpack insertion, so a full backpack retains the exact ring in visible recovery
overflow. Never redirect it into stash/equipment automatically, drop it, suppress
it, grant a replacement item or change shared inventory capacity.

Preview uses the existing exact-unique name path `items:unique.manald-heal.name`
and ordinary reward chips, with no allocation, RNG/store mutation, raw object,
raw item ID or generation-level metadata. It describes one named ring, never a
random pool. No new selector/profile is introduced and the closed ActIII
Gidbinn profile, ordering, membership, level, seed behavior and historical results
remain byte-for-byte unchanged.

Both locales must update `quests:byId.act2-summoners-secret.{name,desc,obj1}`
and the authored source prose to explain actual Normal Arcane Recover, retained
lockbox, separate journal Claim and the named Manald Heal reward. Remove the
unimplemented random-prize/bring-back implication; do not promise a Talk/hand-in,
kill gate, service or effect that does not exist. Reuse existing localized
quest/Recover/Claim controls; add
`quests:areaObjects.tools.horazon_lockbox.{name,ready,owned,unavailable}` and
`inventory:questItems.horazonLockbox.{name,description}`. The retained-item
copy explains archival proof and that it has no later activation. Use zh-CN
primary/en parity, existing translated area/item names, named target, visible
journal/quest-item status and at least44px touch targets at360×640 and desktop.
This document names keys and obligations; player-visible copy stays in i18n JSON.

## Formulas

Let H=5000 authored hero XP, s=0.75 existing quest mercenary share and C∈{0,1}
indicate a first valid Claim. Hero award=C*H. Eligible captured recipient award
=C*floor(H*s)=3750 for C=1, otherwise0; absent recipient award=0. Existing
capped XP/progression rules decide stored level/XP. Recover and repeat attempts
have all reward deltas0. Direct extra skill/stat points=0; ordinary level-up
points still follow accepted progression.

Receipt count after successful Recover remains1 before/after Claim. Ordinary
unique count awarded=C. Generation input ilvl=23, template reqLevel=15 and no
qlvl override, so eligibility23≥15 and generated item level=max(23,15)=23.
Preserve mana20/life15 without multiplying by quest XP, hero level or difficulty.
This card changes no drop-rate, combat, progression or equipment-stat formula.

Keep exact attempt seed
`hashSeed(JSON.stringify(['quest-unique-v1',player.id,quest.id,'items/unique/manald-heal',23]))`
and existing `createRng`/`rollUniqueItem`. No profile-selection seed is needed.
Same player/quest/config/catalog reproduces rolled properties after failure;
unpublished instance-ID gaps remain allowed. Do not rewind shared allocation,
consume combat RNG, use time/claimant level/current area, or persist a new seed.

## Edge cases and compatibility

Only after accepted31 plus independent design APPROVE/root ratification, freeze
the actual accepted31 finite quest/item/action/campaign admission before widening
any current schema, loader or save validator. Prove literal equality against that
accepted source, including counted-family definitions and existing historical
policies. Do not freeze a partially repaired31 snapshot, reference widened live
catalogs as historical authority or alter frozen30. Root owns version sequencing;
accepted31 is the single historical predecessor of the unpublished batch. This
cache requires no migration payload; the one batch migration infers no lockbox,
objective, completion, ring, XP, service, refund or compensation. Any reviewed
empty structural defaults for another included module follow the batch plan;
they do not grant cache history or require an intermediate cache-only release.

New native receipt admission requires exact own JSON data properties, canonical
item/source/state and completed exact side/objective graph; reject unknown,
malformed, duplicate, consumed, inherited/getter or mismatched sources and
contradictory owned/in-progress rows. The retained receipt remains legal after
Claim. Historical completed/unclaimed side flags without physical proof stay
readable but require actual Normal Arcane Recover before Claim. Historical
claimed rows stay claimed/inert, receive no inferred proof/ring/payment and
cannot Recover for replay. Old versions reject newly introduced source graphs.
Current31 negative controls must not accidentally admit the new source through
mutable live content. The new reader retains actual31 counted/stat composition
and established resistance/physical-ownership/save policies.

Hold the shared quest lease through preflight, private preparation, publication
and restoration. Recheck hero/context/source/canonical contract after observable
writes; reject stale/foreign source, wrong area/act/difficulty for Recover, locked
ActII, untracked/already-claimed/incomplete rows, combat/run, pending hydration or
import replacement, unsafe reward numbers, reentry and silent or throwing
callback mutations. A context or canonical-definition change during Claim
cannot produce a partial successful bundle. Restore only task-owned scope;
intermediate writes are observable and browser-crash atomicity is not promised.

On synchronous failure, deep-restore participating side/source and reward
progression, while preserving unrelated quest/material/item/hero-setting writes,
other actors, nonrecipient XP and independent fielding/dismissal. Track the
prepared ring by original ID and captured object references, even after rename,
mutation, transfer or removal. Remove failed-reward ownership from backpack,
stash, hero/any-mercenary equipment, both existing gear quarantines and affected
mirrors; mirrors are not extra owners. Resolve ID collisions without deleting
independent items. Conserve displaced pre-existing gear exactly once; preserve
independent slot replacements and recover originals to visible unequipped
backpack overflow when needed. Restore only participating hero/actual recipient
progression and never resurrect removed or foreign actors. Rebuild affected
ownership mirrors from surviving canonical maps. Derived-cache rollback must
also retain the final runtimev8 distinction: restore this Claim's original
accepted cache only when its original level/core/loadout and canonical composition
inputs still apply and no independent recomposing journal step occurred. In that
case undo only this failed Claim's cache normalization, retaining the exact
accepted nonresource cached values; Life/Mana remain no greater than the minimum
of their preclaim value, surviving current value and applicable restored maximum.
If an independent actual `gainExperience` or equipment/core/source change
recomposed the actor, preserve that independent recomposition and derive the
surviving canonical counted-vitality/equipment result rather than overwriting it
with the stale original cache. Preserve independent damage and clamp resources
without healing on either branch.

Replay independent progression with its original operation semantics: raw
`addXP` retains its raw nonrecomposing behavior, including no extra level/points
normalization when its XP crosses a threshold; an independent actual
`gainExperience` retains its own level/ordinary points and recomposition. A raw
XP-only delta does not itself revoke original-cache restoration when the original
composition inputs remain valid. Remove only this Claim's5000XP/recipient share
and associated progression, while conserving those independent deltas/actions.
Do not rewind the whole hero/roster. Attempt every owned restoration and verify
deep postconditions; failed restoration/postcondition is an explicit AggregateError.
A clean retry can earn the entire bundle exactly once.

## Dependencies

Existing canonical Arcane/Atma and accepted31 → approved cache runtime/batch
sequence → actual31 immutable domain freeze/equality → root-selected batch
successor admission → canonical quest/bound tool → finite object discovery →
protected terminal Recover → exact retained source → guarded unique/XP Claim →
named quest/inventory presentation → focused checks/independent review → cache
checkpoint → later approved modules → final batch checks/build/browser, including
this card's save/export/import/Continue evidence. Reuse [Drognan](drognan-tome.md),
[Nihlathak](nihlathak-treasure.md), [exact unique rewards](quest-unique-reward.md)
and accepted counted/stat composition; do not replace their subsystems.
JSON structure reuses `quest.schema.json`’s existing exact unique object and
`quest-item.schema.json`’s bound tool grammar. Historical source admission still
requires the root-owned immutable domain and version integration, not merely
schema acceptance. Preserve strict TS, pure engine modules and existing i18next.

Eventual implementation ownership must be explicitly assigned before edits:

- Root/integrator owns immutable accepted31 freeze/equality, version/migration/
  domain composition and all shared save-validator integration.
- Engine/features owner owns the shared finite cache contract/physical graph, guarded
  Recover/Claim and scoped rollback tests; shared `interactObject.ts`/
  `claimReward.ts` edits require root coordination with current31 work.
- Content/frontend owner owns only this quest/item JSON definition, source and
  retained-item labels, exact-name preview/presentation and both locale keys;
  coordinate shared map/journal panels and loader tests with root.
- Independent QA/reviewer owns focused source/rollback/save/browser verification
  after the implementation handoff, with task-isolated evidence/processes.

These are disjoint responsibilities to assign before implementation. Current31
acceptance and literal31 equality remain the first gate. The batch plan and packet
implementation addendum govern checkpoint/publication sequencing; this design
creates no branch, CI task or runtime acceptance.

## Tuning knobs

Feel: explicit named Recover, retained proof, separate Claim and named preview;
preserve existing controls/feedback budgets,44px minimum and both locales.
Curve: retain5000 hero XP, fixed75% merc share and existing Manald mana20/life15;
no extra stat reward, drop retuning or resource-generation mechanic. Gate: fixed
ilvl23 justified by canonical Arcane areaLevel23, existing equip req15 and actual
unlocked Normal Arcane recovery, with no added hero-level, clear or kill gate.
These are fixed defaults for this reviewed card; later changes require a new
bounded balance decision, not caller overrides. P15 owns earned all-build pacing.

## Acceptance criteria

1. Independent design review and root ratification explicitly accept or revise
   the random-placeholder→Manald23 recommendation; current31 is accepted before
   any runtime/schema/save widening. Freeze/equality and historical negative
   controls cover literal actual31 while frozen30 stays unchanged. No source,
   proof, reward or compensation is inferred by migration.
2. Meaningful capability failures precede implementation after that gate.
   Exact-source/definition tests prove real canonical Normal Arcane Recover
   grants only one owned retained tool plus coherent completed objective/row;
   wrong source/area/act/difficulty, locked act, combat/run, untracked row,
   flags-only, repeated/claimed/consumed proof and observer mutations refuse.
   No Summoner/area-clear/level/Talk prerequisite appears. Neighboring staged
   fetches and all accepted counted/publication semantics remain unchanged.
3. Source-bound Claim validates the complete exact authoritative reward bag,
   retains proof and delivers one actual Manald23 plus5000hero/3750prior-fielded
   actual mercXP once. Cover no merc, below15 acquisition/equip refusal using a hero still below15 after Claim XP, cap,
   legacy missing-proof history, full-backpack overflow, deterministic retry and
   discarding/moving the reward. Mutated/unknown/extra reward inputs refuse the
   whole bundle before any allocation/payment; preview has no side effects.
4. Inject faults/context replacement at every observable publication and prove
   scoped rollback/retry, renamed/moved/removed reward references, gear/mirrors,
   quarantines, displaced-item collisions, unrelated writes, removed/foreign
   actors and restoration failure. Validate counted-vitality/equipment-derived
   stats/resources after legitimate XP level-up and after rollback; no duplicate,
   hidden ownership, accidental heal or unearned stat entitlement remains.
   Add public-import success/failure regressions for the runtimev8 cache policy:
   public `importIntoStores` of an unchanged valid exported successor capability
   save with accepted stale derived cache and exact earned lockbox graph, plus
   accepted31 migration followed by real Normal Recover. Do not normalize the
   fixture after import or bypass real `claimQuestReward`/`gainExperience`.
   Success must accept the exact imported baseline, award the complete bundle,
   normalize via real XP, enforce canonical derived values afterward and preserve
   damaged hero/merc Life/Mana through export/reload/Continue. Failure after real
   XP then throw, and at final claimed publication, restores the exact accepted
   cache when original inputs/no independent recomposition permit it. Separately
   cover retained independent equipment/core/source recomposition, actual
   `gainExperience`, raw `addXP` and further damage. Distinguish both XP APIs
   below and across a level threshold: independent real XP keeps its canonical
   level/points/cache, raw XP keeps raw nonrecomposing semantics and may retain
   the original accepted cache. Every failure preserves independent XP/damage,
   restores the lockbox/completed-unclaimed row, removes the failed ring/payment,
   clamps without a heal and permits exactly one complete retry. Pre-XP baseline
   mutation and post-XP noncanonical cache controls must still fail closed.
5. Focused meaningful unit/integration/save tests and independent review pass
   for the cache checkpoint. Required complete local unit/typecheck/lint and
   production-build checks pass once on released final batch source; later shared
   edits refresh affected earlier checks/review. During final batch acceptance,
   real production headed browser covers zh-CN/en and360×640/desktop, named
   cache/retained lockbox/Manald preview, actual Recover→separate Claim, repeats,
   full-backpack recovery, Save/export/import/close/reopen Continue and exact
   paid-ring/source/claim/progression preservation. Disclose imported capability
   setup; copied completion flags alone are not browser proof of recovery.
6. A player can understand where to Recover, that the lockbox is retained and
   when Claim pays without relying on raw IDs or an unavailable Atma hand-in.
   CI is excluded per user instruction. Owner/fresh-player playtest, earned
   campaign pacing/30–50hours, all46 authored quests, bounty and remaining P14
   obligations stay separate; this card cannot claim their acceptance.

No owner question is pending for routine source IDs, area spelling or reused
transaction mechanics. The named Manald23 adaptation is root-ratified after
independent design and numeric review. Implementation awaits current31 acceptance
and literal31 equality. The focused-reviewed cache checkpoint precedes Fara inside
the one unpublished batch; it is not separate publication or final acceptance.
