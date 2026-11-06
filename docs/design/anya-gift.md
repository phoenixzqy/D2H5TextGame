# Anya's gift and finite resource trades

Status: independently root-reviewed and ratified for implementation. The direct+10
six-type hero resistance, separate personalize charge and finite resource-trade
catalog preserve `compact-act5-contract.md:213–234,320,334–339`. Root also ratifies
the exact two-entry stock, costs, source, legacy and scoped transaction decisions;
receipt: current31 evidence packet `anya-design-ratification.json`. Follow `p14-unpublished-batch.md`: actual31
acceptance/literal31 equality precede widening; root keeps the batch successor
unallocated until equality. No source/tests/builds/gameplay or version work here.

## Overview

Real thaw-qualified Anya Talk after completed Prison earns a finite side source.
Separate journal Claim grants existing direct+10 all resistance and one independent
personalize charge, then opens `vendors/anya_uniques`: one Frostburn Gauntlet and
one Waterwalk, each costing40 scrap+2000 rune-shards, once per character across all
profiles. This is a useful optional material sink with fixed named outputs, noXP,
new scroll, free trade item, gold, random inventory or restock.

## Player fantasy

Rescue someone, receive lasting protection, then choose useful gear for surplus
resources. Actual thaw/Talk serves Narrative and Discovery; predictable output
and visible costs support Competence; optional independent purchases preserve
Autonomy. Follow GDD unique itemization/material economy and no-gold/gambling/
repair/movement-stat/raw-offline-income rules. Separate pillars/anti-pillars files
are absent; actual GDD and approved contracts remain authority. No all-build power
or earned campaign pacing is certified by this design.

## Detailed rules

### Preserve identity and earn actual Talk

Preserve `quests/side-act5-anyas-gift` (Q), side/ActV, `npc/anya`, one `obj-talk`
Talk with `npcId:'npc/anya'`, prerequisite `quests/act5-prison-of-ice` (P), and exact
bag `{stat:{all_resist:10},service:'personalize_item',vendorUnlock:'vendors/anya_uniques'}`.
Route known Q before generic Talk/Claim even if loaded authoring is malformed;
validate the whole exact identity/reward contract, not just generic schema.

Actual current unlocked ActV town Anya Talk requires ordinary hydrated living-
hero readiness, no combat/run/import/transition contention, a valid earned profile,
a canonical completed P with its three true objectives, and real reciprocal thaw:
P's own true `#action:inspect-anya`, `#action:receive-potion`, `#action:thaw-anya`
proofs plus actual consumed `quest/malahs_potion` at its receive-potion source,
validated by accepted ActV graph rules. Use actual dialogue/presence, not an NPC
ID alone or legacy dialogue continuity. A remembered field sub-area is not a new
`currentSubAreaId:null` town gate. No main Claim/scroll Read/Baal/hero-level or
cache/Fara prerequisite, nor Normal-only return for Talk/Claim, is added.

For historically completed P, its supported real Inspect→Get→Thaw repair suffices
for the additional actual-thaw requirement; do not require a fresh original
Nihlathak victory that a claimed historical main cannot re-earn. Completed flags
without real thaw do not suffice. No main completion/reward is manufactured.

Eligible tracked inProgress or historical completed-unclaimed Q can earn exact
own enumerable JSON true receipt `Q#action:talk-anya`, true `obj-talk` and terminal
completed Q coherently under the quest lease. Talk pays0; it changes no actor,
service, wallet or stock. Repeated proof-bearing Talk is inert. Claimed legacy Q
cannot earn fresh proof. Fault restoration touches only its row/proof, preserving
independent writes and verifying postconditions.

Reuse `dialogue/act5/anya`, `npcId:'anya'`, existing art/fallback and `services:[]`.
Greeting retains embedded English `text` plus
`textKey:'town:dialogue.greetings.act5.anya'`; both locales explain main Claim→Read
scroll separately from side direct Claim protection/charge/optional trades.
Actual town name resolves through `town:town.npc.anya`.

### Separate Claim, resistance and personalization

Claim requires ordinary readiness, exact completed-unclaimed Q/true Talk proof,
canonical P/real thaw and exact bag. It may occur through the ordinary guarded
journal in another location/earned profile after Talk. Preflight safe resistance
composition and absence of conflicting Q service entry. Publish one available
`{serviceId:'personalize_item',state:'available'}` at `Q#reward:service`, the expected
canonical six-channel resistance vector using prospective claimed context, then
claimed-last; recheck source/actor/definition/service/composition at each boundary.
Retain Talk proof. Any missing bag part refuses/rolls back the whole Claim.

Entitlement/catalog access derive from exact earned Talk+completed claimed Q;
no mutable resistance counter or inert vendor-unlocked flag. New claimed source
requires its actual available-or-consumed side service record in native graph
validation. Main Prison's charge is never substituted or refilled.

Add the source once at the shared `resolveAct5ResistanceBonus`/player-stat authority
boundary for all equipment preview/equip/attributes/allocation/level/battle/respec/
restore/cache-repair consumers. Hero only; six types are fire,cold,lightning,
poison,arcane,physical. No thorns/magicResist/merc bonus. Preserve main5+Read10,
Tainted Sun, existing cap75 and difficulty penalty; never cache `+=10` at callers.

NoXP, `gainExperience(0)`, rawXP, point or full-cache normalization. Claim publishes
only canonical resistances; other accepted stale-cache fields and damaged HP/MP
remain unchanged absent independent action. Capture bounded actor/owned-resistance
lineage. On failure restore owned claimed/service fields and exact original
resistance vector if original composition/no independent recomposition still
applies; otherwise preserve independent realXP/equip/core/source composition and
resolve surviving resistances without failed Anya. Raw addXP retains its raw
nonrecomposing behavior, including threshold crossings. Preserve damage and all
independent actor/progression/settings writes, never resurrect foreign/removed
actors. This needs a bounded stat-source participant, not an XP journal for0XP.
Root assigns any shared seam; all restoration/postconditions are attempted and
failed/ambiguous restoration is explicit AggregateError.

Use the existing separate selected-item personalization service unchanged: one
eligible uniquely owned unequipped backpack weapon/armor, no bound quest item,
runeword or already personalized instance; safe text-only hero name, same ID/stats.
Main and side charges are independent; preserve its existing Normal-only service
destination rules. Talk/Claim/trade does not broaden that older consumer.

### Exact finite stock, prices and generation

Proposed ordered `src/data/vendors/anya-uniques-v1.json`: identity
`vendors/anya_uniques`, version1, exactly these two entries, each stock1:

| Entry / trade ID | Exact existing output at ilvl66 | Existing contribution | Price |
| --- | --- | --- | --- |
| `frostburn-gauntlet` / `trades/anya-frostburn-gauntlet` | `items/unique/frostburn-gauntlet`; `items/base/glove-vampirebone` | req49/base req48; baseDefense42; template cold30/defense50/mana40 |40 `materials/scrap` +2000 `rune-shard` |
| `waterwalk` / `trades/anya-waterwalk` | `items/unique/waterwalk`; `items/base/boot-demonhide` | req49/base req48; baseDefense42; template dex15/fire20/defense60/life40 |same40scrap+2000shards |

Each record is exact `{id,uniqueId,ilvl:66,stock:1,costs:{materials:{'materials/scrap':40},currencies:{'rune-shard':2000}}}`.
Strict schema/loader validates the whole closed catalog; finite runtime authority
matches approved exact records, forbidding caller/loaded extra discounts/items/
stock/rewards. No template/base/drop-pool change. Use the higher-level
`frostburn-gauntlet`, not distinct req29 `frostburn`. Fixed66 matches Crystalline
Passage areaLevel66. Both bases have existing sockets3/max3; real unique constructor
preserves capacity3 and empty contents. Do not incorrectly override sockets to0.
Purchase below49 is legal; ordinary equip below49 refuses. No autoequip or heal.

The only stock authority is each own true receipt `Q#trade:frostburn-gauntlet` or
`Q#trade:waterwalk`. Absent=unpurchased, true=sold out. Both require earned claimed
Q; either/both/neither, either order, are legal. Stock is character-lifetime,
shared across all earned profiles/sessions. Item disposal/salvage, profile change,
charge use, reload or owning an ordinary-drop duplicate never refreshes stock.
No saved count/instance ledger, restock/selector/timer or materialActionOrdinal.

Actual purchases require current unlocked ActV town Anya, ordinary readiness,
earned claimed source/thaw graph, valid current earned profile, funds and one free
backpack slot. Same stock/price on every profile; no Baal/level/Cube gate. After
Claim show unaffordable/sold-out rows honestly. Listing/selecting/previewing is
read-only, no RNG/allocation. Personalization availability/use is not a trade gate.

40scrap uses common earned surplus salvage rather than a particular rare rune/
perfect gem.2000shards uses the existing per-kill faucet. Gloves supply cold/mana;
boots dex/fire/life, two slots useful across builds without a guaranteed upgrade.
Prices are new reviewed mechanic proposals, not measured affordability; no free
inputs or compulsory sacrifice of equipped/build gear. Existing replay can supply
surplus gear. Paid new gear follows D10 net-capacity: full/already-overflowing
backpack refuses before payment/allocation, no stash redirect or worsened overflow.
Do not copy mandatory cache reward overflow behavior for voluntary purchases.

Minimal options: a flag-only unlock fails the promised consumer; one fixed item
is mechanically sufficient; two named existing items add one data row with a shared
purchase path and useful choice; random/refreshing stock or high-rune/perfect-gem
prices add odds/state/pacing obligations. Recommend exactly two finite entries.

Privately construct through real `rollUniqueItem({uniqueId,ilvl:66},actualPools,
createRng(hashSeed(JSON.stringify(['anya-trade-v1',player.id,'vendors/anya_uniques',
entry.id,uniqueId,66]))))` after complete preflight. Existing fixed-template
stat/base/socket representation, identified/unequipped state and allocator remain;
no weighted selector/fallback. Same identity/config/catalog reproduces properties;
IDs depend on allocator, so failed private gaps remain legal. Do not rewind shared
allocation/combat RNG or seed from time/location/profile/hero level.

### Purchase transaction, failures and visible flow

Use one existing `beginMaterialTransaction` lease through preparation/publication/
restoration; no nested quest lease. Supported currency/gear/material/quest/wave/
restore reentry already refuses under activeMaterial. A bounded private exact-owner
publisher is needed because ordinary addItem/spendCurrency would themselves refuse
under that lease. Preflight all authority/funds/stock/space/template/safe arithmetic,
then prepare one unique; recheck after each write. Publish only40scrap/2000shard
debit, exact item into available backpack space and selected sold-out proof last.
No new general crafting recipe/request/ordinal grammar is needed.

Reuse canonical material/currency validation and `captureQuestRewardOwnership`
for ID+reference lineage, rename/move/equip/quarantine/mirror/collision/displaced-
original cleanup. Existing `runMaterialActionTransaction` snapshots whole inventory
and plans crafting; it is not an independent-delta/unique-stock journal. Use its
existing ownership boundary, not a copied full-store rewind. One bounded two-entry
trade publisher journals only owned debit/stock and prepared physical ownership.

Every no-op/mutation/throw/stale context/definition/import/actor/slot/reentry fault
removes only failed reward ownership and restores only owned costs/proof, preserving
independently attributable same-key additions/debits and unrelated fields/items/
actors/quest/services. Unknown attribution/replacement fails explicitly, never a
guessed wallet snapshot. Physical cleanup must preserve eligible accepted stale
caches and distinguish its own recomposition from independent realXP/equip/core/
source recomposition; use a read-only continuity/cache witness, not an XP journal.
Preserve rawXP semantics/damage; no removed/foreign actor resurrection. Attempt all
restores, verify deep postconditions, report AggregateError on failure/ambiguity.
Before releasing an unrestorable operation, invoke existing persistence recovery
blocking (`blockSavesForRecovery`); do not wake a save of ambiguous partial state,
report success or auto-retry it. Existing validated recovery/restore clears that
condition. Always release exact lease/subscriptions in finally. Fully restored
failure retains stock for one clean retry; sold-out repeat refuses even if item gone.
Whole-save persistence excludes intermediate writes and retains committed cost/
item/proof together; no crash/old-export-rewind/cryptographic guarantee is made.

Flow: real eligible Talk→separate journal Claim→Anya's two named rows with exact
price/owned/remaining0or1/required49/free-slot state→explicit confirm Trade→owned
unequipped item+sold-out row→optional ordinary equip/personalize/salvage. No gear
hand-in before Claim or opening charge. Use existing item names
`items:unique.{frostburn-gauntlet,waterwalk}.name`, both
`quests:byId.act5-anyas-gift.{name,desc,obj1}` and concrete named-catalog preview
for this Q's vendorUnlock. Proposed town keys
`town:anyaTrades.{title,locked,price,owned,stock,ready,soldOut,insufficientMaterials,insufficientCurrency,backpackFull,confirm,success,failed}`.
Keep zh-CN primary/en parity, safe text, accessible confirmation/focus/keyboard,
≥44px controls at360×640/desktop, no raw IDs/metadata/stat-object text, horizontal
overflow or old side-scroll/gold-stock promise. No art generation required.

## Formulas

A∈{0,1} is exact earned Talk+completed claimed Q with valid prerequisite/thaw.
Each hero resistance source contribution is10A; no other actor/stat/XP delta.
Rescue5+main real Read10+side10=25 all six; Sun30 adds55fire/cold,25 other four
before gear/other bonuses. Existing combat cap75/penalty applies afterward.
Claim grants no trade item; repeat Claim/Talk grants0.

For entry j, purchase proof P_j∈{0,1}, stock=1-P_j. With P_j=0, S≥40scrap,
C≥2000shards and backpack N<K: S'=S-40,C'=C-2000,N'=N+1,P_j'=1. Other receipt/
service remains unchanged. Validate nonnegative safe integers/all subtraction/
refund overflow before writes; canonical absent scrap means0 and zero remainder
uses existing ledger conventions. No affordability re-debit for sold-out history.

Two purchases sink80scrap+4000shards for2uniques. Existing salvage at ilvl66:
unique6*(1+floor(65/20))=24scrap. Salvaging both returns48, net32scrap+4000shards
spent; no restock cycle. At66 normal/magic/rare yields4/8/16:40scrap=10normal,
5magic or3rare with8surplus. Gear eligibility/real ownership remain required.
Existing level66 trash,0currencyFind: shards=floor(330*(0.7+0.6u)),u∈[0,1),
giving231..428.2000/330≈6.06 is a ratio to mean yield, not measured stopping-time;
ceil(2000/428)=5 and ceil(2000/231)=9 conditional kill bounds. Do not assume one
salvageable gear drop per kill or measured campaign timing/owned affordability.

ilvl66≥template49≥base48; constructor level66, actual equip minimum49. Capacity3
and literal fixed stats remain existing equipment contributions, not permanent
quest bonuses, multiplied price rewards or implied movement/cast/immunity effects.

## Edge cases

Require own enumerable JSON data at source/item/service/stock/catalog boundaries;
reject unknown/extra/duplicate/inherited/getter/symbol/false/malformed/unsafe data
before normalization or accessor execution. New Talk proof needs exact completed
side+accepted completed P+actual reciprocal thaw; trade proof additionally needs
new claimed source. New claimed source requires actual side service record.
Purchase receipt remains legal after ordinary item loss/salvage; do not require
current ownership, replay a constructor or reconstruct item/payment on import.

Source-free historical Q stays readable. Completed-unclaimed Q needs real eligible
re-Talk then initial Claim. Claimed legacy Q remains claimed/inert: no fresh Talk,
+10, service/catalog/compensation from flags. Preserve any already-valid legacy
side available/consumed service entry exactly; do not reject/refill it because
new Talk proof is absent. Its older selected-item use stays legal by existing
service policy, without creating resistance/catalog authority. Used target evidence
remains legal after salvage. Preserve main charge/Read independently. Historical
claimed P may earn real thaw through supported repair; dialogue alone grants no
side source, new main victory/reward or replacement scroll.

This card adds only three finite boolean receipt identities in existing map;
no new persisted field/counter. One batch migration can remain version-only for
Anya, validating literal31 first and inferring nothing. Carry optional finite Anya
authority through raw/builder/JSON/decode/migration/service/campaign/stat/restore/
repair consumers. Supplied historical absence means no new Anya family/bonus,
never live fallback; adding+10 to the shared resolver must not widen literal31
projection or source-free legacy rows.31/older reject all three future receipts
and mixed future graphs after live widening; frozen30/older remain unchanged.
No intermediate cache/Fara/Anya accepted version/freeze.

Zero/insufficient funds/full or overflowing bag/sold-out/unavailable thaw/prerequisite/
NPC/profile/side/source, conflicting charge, stale selection/hero/import/context/
authoring or combat/run/reentry refuses before debit/grant. A slot independently
filled during publication forces rollback, never overflow. Include direct spend,
physical movement/collision/removal and same-wallet mutation faults. Safe owned
restoration and exact lease release are necessary; ambiguous state blocks saves
and never reports successful automatic retry. Talk/preview/trade do not publish
XP/cache changes, and Claim changes only owned resistance vector; independent
actual recomposition and damage survive. Shared helper names alone prove none
of these composition/postcondition contracts.

## Dependencies

Completed Prison+actual thaw graph→actual town Anya Talk→finite completed side
source→separate whole-bag Claim→source-derived+10/side charge/actual catalog→
surplus salvage+earned kill shards+free slot→exact unique trade/sold-out receipt→
optional ordinary equip/service/salvage→save/export/import/Continue. Reuse existing
Anya dialogue/thaw repair, strict material ledger, exact rollUniqueItem/actual
pools/seeded RNG, material lease/save exclusion and physical ownership helper.
No new areas/materials/currencies/merc/gacha or generic vendor/recipe subsystem.

Root assigns exclusive shared save/domain/stat/guard/dispatch/service/locale and
module ownership before edits. Source-bound stat and exact paid consumer are the
missing root capability; inert flags, component stat increments, free fallback
items and whole-store snapshots do not fix it. Existing batch order, per-module
focused independent checkpoints and final broad/build/browser cycle apply.
No work-plan/large-ledger or Cow/Gheed changes are part of this proposal.

## Tuning knobs

| Knob/category | Default / future reviewed range | Rationale |
| --- | --- | --- |
| Permanent reward/gate |existing10 all six+one independent charge, fixed |approved budget, no re-tuning |
| Catalog/feel |2entries×lifetime stock1, fixed here |small useful choice, one shared path |
| Scrap/curve |40 each; later reviewed25–120, above24 output salvage |positive sink, common surplus |
| Shards/curve |2000 each; later reviewed1000–10000 |existing earned faucet, optional fee |
| Item/gate |fixed66, template equip49 |source area66, ordinary requirements |
| Access/gate |completed P+real thaw+Talk+Claim; common profile stock |no main Claim/Read/Baal/reset gate |
| UI/feel |named preview, confirmation,44px targets |understand cost/stock before action |

Exact current records/costs belong in validated JSON; runtime finite authority
matches this approved snapshot, not arbitrary future caller data. Ranges are
possible future review proposals, not runtime sliders or authority for changed
live costs. Earned affordability/all-build power remain later validation.

## Acceptance criteria

1. Independent review/root ratifies exact2×stock1 catalog,40scrap/2000shards,
   templates/ilvl66 and source/legacy/resistance-only Claim decisions.31 acceptance/
   literal equality precede widening; version remains unallocated until equality.
   Meaningful public REDs expose unsupported side Claim/source/catalog before code.
2. Actual valid thaw-qualified Talk earns only exact source/completed side; real
   historical-main thaw repair works without new Nihlathak victory/repayment.
   Flags-only/dialogue/untracked/claimed/stale/wrong-context cases refuse; actual
   re-Talk repairs eligible completed-unclaimed side. No actor/payment changes.
3. Whole-bag Claim pays exact source-derived hero+10/side charge/real catalog once,
   noXP/scroll/item/currency, claimed-last. Main5+Read10+side10/Sun55/25/cap75 remain
   exact across all composition consumers. Test every publication fault, accepted
   stale resistance vector, independent realXP/rawXP/equip/core/source/damage and
   actor removal; preserve other caches/resources and independent service history.
4. Each actual paid trade costs exactly40scrap+2000shards and real constructor
   yields named unique66/req49/capacity3/empty contents, chosen proof last. Either
   order/stock subset legal; previews allocate nothing; insufficient/full/overflow/
   unsafe/stale cases spend nothing. Below49 equip refuses; ordinary equip shows
   utility without heal; separately personalize one actual eligible item.
5. Faults before/after each cost/item/proof boundary, silent no-op, mutations,
   source/catalog/import/actor/slot/reentry and direct spend/equip cases preserve
   independent deltas/items/services. Reuse physical lineage cleanup across rename/
   containers/equipment/quarantines/mirrors/collisions, preserving originals and
   eligible stale caches/independent composition. All restores/postconditions,
   AggregateError/recovery-save blocking/exact lease release and one clean retry.
6. Sold-out survives item loss/salvage/profile/reopen, no refill. Legal empty/subset/
   mixed source/service/trade states roundtrip; malformed/new contradictory states
   refuse before normalization. Preserve literal historical flags/services/caches/
   balances; no compensation/backfill.31/older reject all three new receipts after
   live widening. Shared Anya stat changes refresh cache/Fara focused regressions.
7. Per-module focused source/stat/service/material/physical/save/UI checks and
   independent review, then final batch terminal complete local unit/type/lint/
   build and headed production browser. Real thaw/Talk→Claim→paid trades/service,
   zh-CN/en,360×640/desktop, unaffordable/free-slot/repeat/sold-out after salvage,
   exact Save/export/import/actual close/reopen Continue. Disclose imported setup;
   no gameplay-grant bridge/protected earned-save replay. Players can explain main
   Read versus direct side reward, optional price and lifetime stock from copy.
8. CI excluded; owner earned playtest/pacing/all-build/full-P14/full-v1 acceptance
   remain separate. No runtime completion is inferred from this proposed spec.

Source basis: approved compact ActV/D10/batch docs; current side row, Anya dialogue/
thaw-repair graph, uniques/bases, salvage/rollRuneShards formulas, material lease/
transaction, physical helper and shared stat/cache readers inspected read-only.
Existing root manifests suffice for provenance; no large hash appendix added.
No source/tests/builds/gameplay, new agents/processes, commits/remote/version
changes. Protected earned saves were not opened/hashed/replayed. Only this proposal
and companion self-review were created outside repo; root retains them for
independent review and owns cleanup after all consumers finish. No disposable
task-owned files/processes remain.

readersReleased: true
