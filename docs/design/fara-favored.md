# Fara’s crafting favor

P15 finite-bonus update (2026-11-02): Claim grants10 canonical wishes alongside the one catalyst. Talk still pays nothing. Both currencies reserve and settle under the existing source-owned transaction before claimed-last, preserve independent additions and verify scoped restoration. No XP or historical compensation is added. See [finite policy](../plans/decisions/P15-finite-side-wishes-v1.md).

Status: root-ratified design after independent DESIGN-REVIEW and
LD-NUMERIC-SPOTCHECK approval, within the
[root-ratified unpublished P14 batch](../plans/p14-unpublished-batch.md).
The [Act II retained-cache family](act2-retained-caches.md) reaches its
focused-reviewed implementation checkpoint before Fara under the same unpublished
successor; no intermediate accepted cache version or second pre-Fara freeze is
required. Current31 acceptance and literal actual31 equality precede all widening;
root leaves the successor version unallocated until that equality. The exact
town/dialogue requirements, direct-spend guard and currency-only actor scope below
remain authoritative. No runtime completion is claimed here.

## Overview

Make existing `quests/side-act2-fara-favored` reachable through a real Fara town
conversation after the existing Radament prerequisite, then separately Claim one
existing gem-shard crafting catalyst. The authored row has **no XP reward**;
retain that absence. Replace unsupported `repair_discount` with exact
`{gemShards:1,wishstones:10}` through existing one-time numeric quest reward machinery. This
is the reviewed concrete crafting-favor adaptation, not a
claim that the old service already meant a shard. Gear does not degrade, so
implement no repair/durability/discount system. Preserve quest/Talk/NPC identity,
existing prerequisite and labels,29 areas, no-gold economy and separate Claim.

## Player fantasy

Fara, a former Paladin and craftswoman, thanks the hero for ending Radament’s
threat by supplying a small practical crafting aid. Actual conversation serves
Relatedness, while a visible catalyst with an existing use supports Competence
and player choice. Canonical GDD sections3/6.3/7.3/8 support text-first town
interaction, build inputs and no gold/gambling/gear repair. Standalone pillar/
anti-pillar files are absent; follow the GDD’s actual pillars and project
invariants. This repair discount cannot become meaningful while durability is
absent; a real expendable catalyst avoids an inert service flag or duplicate
permanent-identification unlock. No combat/offline/resource rule is changed.

## Detailed rules

Preserve `quests/side-act2-fara-favored`, side type, `acts/act2`, giver
`npc/fara`, objective `obj-talk`, Talk type and `npcId:'npc/fara'`, plus
`prerequisites:['quests/act2-radaments-lair']`. Preserve existing quest name keys.
Remove only the obsolete repair-discount promise/reward and replace the reward
bag with exact `{gemShards:1,wishstones:10}`. No XP/mercenary XP, stat/skill points, ordinary
item, gold, vendor unlock, service charge or material conversion is
added. No existing service source/label is repurposed or removed from another
quest; do not add `repair_discount` to the finite service vocabulary.

Add a real canonical dialogue document `src/data/dialogue/act2/fara.json`, with
`id:'dialogue/act2/fara'`, `npcId:'fara'`, at least one greeting and empty
`services:[]`, using the existing schema/aggregate loader. Every greeting contains
both schema-required embedded string `text` (authored English fallback matching
the localized meaning) and exact `textKey:'town:dialogue.greetings.act2.fara'`;
a textKey-only object is invalid. The greeting explains completed Radament→real
Fara Talk→separate journal Claim of1 gem-shard, and that fusion still requires
3 matching owned gems. It never promises a repair, automatic payment or free gem.

Both `town.json` locale files add the existing flat key `"town.npc.fara"`
(fully qualified `town:town.npc.fara`), because `loadTownNpcs` emits
`nameKey:'town.npc.fara'` and TownScreen translates it in the town namespace.
Adding only `town:npc.fara` would leave the actual NPC untranslated. Both locales
also add `town:dialogue.greetings.act2.fara`; visible copy remains in i18n JSON.
Existing `loadTownNpcs(2)` must project the matching document to actual ActII town
presence and TownScreen’s accessible conversation control. No hand-built phantom
button, combat-area NPC, repair/vendor panel, new art generation or forced gear
selection is needed. Use existing portrait fallback honestly if Fara art is
absent. Fara may be visible before the prerequisite; talking then grants nothing
and the copy explains the Radament condition without suggesting an active repair.

Only an explicit current-town Fara Talk, with hydrated ordinary-action-ready
hero, unlocked current ActII, no combat/sub-area run/import replacement, exact
tracked unclaimed row and existing Radament completion authority, can complete
`obj-talk`. Preserve the existing prerequisite’s meaning: Radament’s canonical
main row/objective must be completed under its already accepted rules; do not
require its reward Claim, Book of Skill Read, another kill/clear, hero level,
Normal-only return or a new main encounter receipt. Current earned difficulty
and existing ordinary town action rules apply. The card adds no difficulty gate.
Town presence follows current unlocked ActII plus actual authored NPC/ordinary
action context; remembered selected field sub-area state is not a new town gate.

Add one finite actual Talk receipt in the existing `questReceipts` map,
`quests/side-act2-fara-favored#action:talk-fara`, value exactly `true`. This
records the actual conversation that qualifies the adapted reward, without a new
wallet/service/item/proof ledger or extra player action. Publish receipt, true
`obj-talk` and terminal completed side row coherently under the shared quest
lease. Existing generic Talk flags alone are not new reward authority. The Fara
entry point must revalidate exact canonical dialogue/NPC/quest/prerequisite and
live context inside the lease, including after observable writes, while leaving
other NPC Talk semantics unchanged. Talk grants no catalyst or other reward.
Visits, NPC-list rendering, loading dialogue, another NPC and copied completion
flags cannot create this receipt. Repeated eligible Talk leaves one receipt.

Separate journal Claim requires ordinary readiness, exact completed side/Talk
row, own exact true Talk receipt, preserved prerequisite authority and canonical
finite definition. Revalidate exact `{gemShards:1,wishstones:10}` before preparation/after
observable publications; reject changed count/key, extra/missing reward, XP,
`repair_discount`, item/service/gold substitution or contradictory receipt/row.
Use existing numeric alias mapping `gemShards`→
`inventory.currencies['gem-shard']`, existing safe-integer destination preflight
and `addCurrency`; never create `currencies.gemShards`, another material ID or a
second balance. Exact numeric alias/ingress reuse does not establish that the
generic Claim publisher already supplies Fara's scoped authority/rollback.
Mark claimed last. Keep the Talk receipt after Claim; further
Talk/Claim or spending the shard cannot grant another. Later Claim may happen
away from Fara, subject to existing ordinary guards. No conversation is an
automatic Claim and no merchant/service use is required to receive the reward.

The one shard is independently useful: each existing gem-fusion recipe consumes
3 owned identical type/quality gems plus1 `gem-shard` and produces1 next-quality
same-type gem. It covers the catalyst cost for one player-chosen fusion without
sacrificing another owned gem to dismantle. The player supplies the3 gems; the
quest grants no free gem, automatic upgrade, recipe unlock or guarantee of an
immediate usable combination. Existing crafting UI/confirmation/cost/profile
rules remain authoritative. Example:3 chipped amethysts + the claimed1 shard
can become1 flawed amethyst through existing `recipes/gem-fusion/amethyst/chipped`.
The reward is the smallest positive supported numeric catalyst quantity and
supports a real existing sink, with no arbitrary conversion from old discount
value and no effect on gem/rune/gear drop rates. It is not a permanent resource
faucet or another zero-value service flag.

Preview reuses `quests:rewardLabel.gemShards` with count1 and existing localized
inventory crafting wallet names/quantities. It allocates nothing, consumes no
RNG, changes no store and exposes no raw keys/old repair service. Update both
`quests:byId.act2-fara-favored.{name,desc,obj1}` and authored prose to explain
Radament prerequisite→actual Fara Talk→separate journal Claim of1 gem-shard and
its optional existing fusion use. Remove inaccurate sewer-location/repair/
discount implications; main current content places Radament beneath Far Oasis.
Keep zh-CN primary/en parity, named Fara, keyboard/focus behavior and at least44px
controls at360×640 and desktop. No raw-copy text belongs in components.

## Formulas

Let C∈{0,1} indicate first valid Claim, q=1 fixed catalyst count and B the
existing `gem-shard` wallet balance, a nonnegative safe integer. New balance
B'=B+C*q, provided B'≤Number.MAX_SAFE_INTEGER. If addition is unsafe, refuse
before reward/claimed writes; retain the completed unclaimed source for retry.
Talk/visit/repeated Claim haveΔB=0. HeroXP=mercXP=direct extra points/items=0.
Do not call `gainExperience(0)` or otherwise normalize actor caches for this
currency-only reward. No combat/offline multiplier applies.

One existing fusion with3 identical gems and1 shard has input3gems+1shard and
output1next-quality gem; shard cost1, no RNG. After Claim from B=0, wallet1;
a later independently confirmed fusion spends1→0. It is not part of the Claim
transaction. Missing3 gems or not choosing to craft leaves the shard saved.
One Talk source and one claimed flag authorize at most one total reward unit;
spending/dismantling/crafting does not refresh entitlement.

## Edge cases and compatibility

Actual accepted31 is the single historical predecessor of the unpublished P14
batch. Before any batch loader/schema/save widening, root freezes its finite
quest/dialogue-source/action/campaign admission and proves literal historical
equality, including counted and nested historical policies. Fara follows the
focused-reviewed Horazon/Elzix implementation checkpoint under the same unpublished
successor; no intermediate accepted cache version, cache-only historical domain
or second pre-Fara freeze is required. Preserve actual31 and older frozen domains.
Root leaves the successor unallocated until literal31 equality; do not assume a
numeric version, freeze unfinished source or use widened live catalogs as history.
Fara requires no migration payload. The one batch migration adds no Talk receipt,
objective/completion, shard, service flag, XP or compensation for the old repair
promise; reviewed empty structural defaults for another included module follow
the batch plan. Existing balances/unknown historical currency keys stay conserved.

Native Talk receipt requires exact own JSON data property/value and exact canonical
completed Fara side/Talk plus preserved Radament prerequisite graph. Reject unknown,
malformed, inherited/getter, false/nonboolean, mismatched source, untracked row
or contradictory graph. Its retained true value remains legal after Claim.
Historical completed/unclaimed Fara flags without receipt remain readable but
require actual eligible Fara Talk to earn missing proof; that explicit re-Talk
can operate on an unclaimed historical completed row. Claimed legacy history
stays claimed/inert, cannot earn proof for replay and receives no shard/discount
compensation. Older readers reject the new source; do not widen them through
live dialogue/quest catalogs. No old `repair_discount` source is fabricated.

Use the accepted shared quest lease and proportional scoped rollback. Snapshot/
journal only this Fara row/receipt and participating `gem-shard` publication;
prepare exact safe destination before writes and recheck actual hero/context/
canonical definitions after observable boundaries. Refuse reentry, nested Claim/
material spending, wrong town/NPC/prerequisite, untracked/claimed row, combat/run,
hydration/import replacement, source mutation and silent/throwing observers.
A newly recorded Talk cannot be mistaken for an auto-paid reward.

A synchronous fault restores this operation’s row/receipt and paid wallet delta,
without rewinding unrelated currency keys/materials, gear, hero settings/core/
progression/resources, other quest rows or mercenary fielding/progression. Preserve
conservatively attributable independent wallet updates; never invent a negative
balance or silently overwrite an ambiguous competing write. Attempt every scoped
restoration and verify deep postconditions. An unresolvable owned restoration or
postcondition failure is explicit AggregateError; retry earns1 exactly once.
Intermediate writes are observable; browser-crash atomicity is not promised.

The shared quest lease already refuses nested quest/material transactions, but
it does not by itself refuse direct `inventoryStore.spendCurrency`: that helper's
current `assertMaterialMutationAllowed` checks activeMaterial, not activeQuest.
Before correcting this boundary, preserve a meaningful RED in which an observer
of Fara's +1 publication directly calls `spendCurrency('gem-shard',1)` before the
claimed-last/postcondition boundary. Assert refusal before debit, exact unsettled
wallet/source/row behavior and clean retry, rather than mocking the spend helper
or relying on nested crafting to stand in for direct spending.

Implement the smallest bounded unsettled-shard guard/journal seam needed for that
RED. Its authority is only Fara's exact participating `gem-shard` key during its
synchronous Claim preparation/publication/restoration; private owner authority
permits the one planned +1 ingress and required owned restoration, while nested
direct spending of that unsettled key refuses before mutation. Keep the guard
through failed restoration/postconditions and release the exact owner in finally.
Do not freeze every currency, change unrelated quests' settlement policy or block
ordinary gem-shard use after the operation is released. Other currency keys,
materials and independently attributable additions stay conserved; if a callback
adds an independent amount to this same wallet and then faults, remove only
Fara's attributable +1. Unknown or ambiguous writes fail explicitly rather than
being erased. Root assigns any shared-helper seam before implementation; this
card does not authorize a general currency/transaction framework rewrite.

Final runtimev8 cache semantics apply proportionately: this card publishes no XP,
stat, equipment or resource change, so accept an exact stale derived cache as
part of the imported baseline and leave hero/merc caches byte-for-byte unchanged
on Talk/success/failure. Do not copy the ring cards’ real-XP normalization step
into a currency-only Claim or recompose merely to validate it. Independent actual
`gainExperience`/equipment recomposition retains its own canonical result and
level/points; raw `addXP` keeps raw nonrecomposing behavior, including threshold
crossings. Preserve independent damage and never heal/clamp upward. There is no
owned progression to undo or whole hero/roster to restore. Do not construct a hero
or mercenary progression journal for this card (including the cache family's
counted-hero/recipient journals). A read-only continuity/baseline witness is
appropriate; actor setters, gainExperience(0), direct XP or cache recomposition
are not Fara publications. With no independent actor operation, caches/resources
remain byte-for-byte unchanged; with an independent operation preserve its actual
result. Existing unrelated accepted persistence/stat-composition policies remain
authoritative.

## Dependencies

GDD no-repair/no-gold + preserved Radament prerequisite + actual canonical Fara
dialogue → bounded source-bound current-town Talk → completed side/true receipt
→ exact numeric one-time Claim → existing gem-shard wallet/preview → optional
existing crafting sink → save/export/import/Continue. Current31 acceptance and
literal31 equality precede batch widening. Fara runtime follows the independently
focused-reviewed cache checkpoint under the same unpublished successor; final
complete local checks/build and each card's production-browser evidence share the
batch acceptance cycle. This order adds no player cache prerequisite. Reuse shared quest transaction/currency planning and
existing dialogue/town/i18n/material-action systems; introduce no replacement
service, inventory, crafting or progression subsystem.

Evidence for this recommendation: `src/data/quests/side.json:83–93` has one Talk,
Radament prerequisite and only `service:'repair_discount'`—no XP. GDD207–212
forbids repair/durability/gold/gambling. D10 ownership:45–46 defines gem-shard as
existing gem-fusion catalyst; D10:258–259 defines3gem+1shard fusion versus gem
sacrifice for dismantling. `src/data/items/material-recipes.json:5–22` is the
existing exact amethyst example. `claimReward.ts:64–69,147,338–342,442–445`
already supports numeric `gemShards`, maps it to the canonical wallet and adds
through ordinary currency ingress. `QuestsScreen.tsx:302` already previews it.
`quest-services.ts:7–9,22–30` excludes repair; extending it would create a new
service without an existing repair use. `loaders/towns.ts:11–19` and
`TownScreen.tsx:46,98–106` derive/render actual dialogue NPCs; no Fara document
exists yet. Generic `mapStore.ts:198–219` handles only existing NPC presence/
in-progress Talk, so a bounded Fara path must also handle guarded historical
re-Talk and exact prerequisite/source without widening other conversations.
`dialogue.schema.json` requires greeting `text`; `loaders/towns.ts` emits
`town.npc.fara`, and TownScreen resolves the act-specific greeting. Current
`inventoryStore.ts:295–307` and `waveTransitionGuard.ts:113–115` show why the
unsettled-key direct-spend refusal needs its own meaningful RED/minimal seam.
The stale `docs/design/maps-spec.md:63` Smith/repair role annotation does not
override the canonical GDD or authorize a repair service for this card.

Before implementation assign disjoint ownership: content/frontend owner handles
new Fara dialogue/NPC/greeting and this quest’s bilingual prose/preview; feature
owner handles exact Fara Talk/Claim authority, finite receipt and proportional
currency rollback; root owns shared routing, literal31 freeze/equality and the
one batch version/migration/native-source/persistence integration; independent
QA/reviewer owns focused source/import/crafting-use checks, independent review and
per-card browser evidence within the final batch cycle. This design grants none of that work
now and creates no workflow label/status, new BUG, process, commit or remote change.

## Tuning knobs

Feel: named real Fara conversation, honest1-shard preview and separate Claim;
preserve existing accessible town controls and44px mobile minimum. Curve: fixed
q=1, enough catalyst for exactly one existing fusion; authored XP remains
absent, no extra ordinary gem/drop/power reward or discount percentage. Gate:
preserved completed Radament prerequisite + actual eligible ActII town Talk,
no added hero-level, area-clear, reward-Claim/Read or Normal-only requirement.
Quantity/remapping changes require a separate reviewed bounded decision. This
minimal useful catalyst budget is not measured all-build economy/pacing signoff.

## Acceptance criteria

1. Root records final ratification of the independently approved
   `repair_discount`→`{gemShards:1,wishstones:10}` and finite real-Talk source with the routine
   corrections in this document. Actual31 and older historical authority remain
   unchanged. Current31 acceptance and literal31 equality precede batch widening;
   Fara follows the focused-reviewed cache checkpoint without an intermediate
   accepted version or second freeze. The one batch migration infers no proof,
   catalyst, service or compensation. No unsupported repair flag can appear.
2. Meaningful capability failures precede runtime work after those gates.
   Fara appears through actual matching canonical dialogue at current ActII town
   in both locales, using exact flat `town.npc.fara` name keys, embedded greeting
   text plus the act2 textKey, and existing fallback art/conversation controls. Real eligible Talk earns only exact true receipt + completed
   side/objective; no reward. Pre-Radament, wrong act/NPC, untracked/claimed row,
   combat/run, pending hydration/import, repeated Talk, copied flags, reentry and
   observer faults cannot earn/pay twice. Historical unclaimed completed rows
   require actual eligible re-Talk; no extra level/clear/main-Claim/Read gate.
3. Preview and actual exact-bag Claim show/credit1 canonical `gem-shard`, mark
   claimed last and retain Talk source. No XP/mercXP/cache/item/service/material
   grant or alternate wallet is created. Repeat/legacy-claimed controls pay0.
   Cover absent merc/full backpack,0 and nonzero balances, safe-integer maximum
   boundary, extra/changed/old reward input and source/prerequisite tampering.
   Full gear storage cannot block or redirect a wallet-only grant.
4. Inject faults at Talk receipt/row and Claim wallet/claimed publications to
   prove scoped restoration/retry, unrelated keys/materials/quests/gear and
   independently attributable same-wallet additions, nested direct
   `spendCurrency('gem-shard',1)` refusal before debit, exact bounded-guard release
   after success/failure, unrelated-currency conservation, removed/foreign actors
   and explicit failed restoration. No all-currency freeze or hero/merc progression
   journal is introduced. Public
   `importIntoStores` with an unchanged valid accepted stale-cache save must
   complete actual Talk/Claim while preserving hero/merc progression/caches/
   damaged Life/Mana exactly. Failure and independent realXP/rawXP/equipment/
   damage controls preserve their operation semantics without normalization or
   healing from this currency-only card.
5. Prove real practical utility through the existing crafting UI: with3 owned
   identical chipped amethysts and0 shards, Claim gives1 shard; separately
   confirm the existing fusion, spend exactly3 gems+1 shard and obtain exactly1
   flawed amethyst. Inputs come from disclosed independent earned/capability
   setup, not an undocumented quest grant. No free recipe unlock, material
   conversion, vendor, phantom discount or recurring faucet is involved.
6. Focused meaningful unit/save/UI checks and independent review pass for the
   Fara checkpoint. Required complete local unit/type/lint/production-build checks
   pass once on released final batch source; later shared edits refresh affected
   earlier checks/review. During final batch acceptance, production headed browser covers
   both locales,360×640/desktop, real Fara Talk→journal Claim, exact preview/
   wallet/repeat controls and Save/export/import/close/reopen Continue; preserve
   receipt/claimed/balances/caches and optional crafting result. Imported setup
   is disclosed. CI is excluded per user instruction. Owner/fresh-player
   playtest, earned30–50hour pacing, all46 authored quests, bounty and remaining
   P14 families retain separate obligations; this one card accepts none of them.

Decision evidence: root's counted-source packet retains the original proposal,
independent design/number review, corrected final and `fara-design-ratification.json`.
Root owns their retention through umbrella acceptance. No owner question or CI
hold is pending. The [batch plan](../plans/p14-unpublished-batch.md) supersedes
separate cache acceptance/pre-Fara freeze sequencing. Implementation follows
current31 acceptance, literal31 equality and the focused-reviewed cache checkpoint;
final acceptance remains pending the complete batch check/build/browser cycle.
