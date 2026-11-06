# Finite counted-source side quests

P15 finite-bonus update (2026-11-02): each Claim also grants10 canonical wishes once, before claimed-last inside its existing source/XP/reward transaction. Recover and Jade Give pay nothing. Preserve the existing complete reward bags, independent wish additions, consumed-source proof, actual merc shares and rollback. No old claims receive compensation. See [finite policy](../plans/decisions/P15-finite-side-wishes-v1.md).

Status: **independent DESIGN-REVIEW APPROVE; root ratified for implementation
after accepted town-enlistment/current30**. The approved sixteen placements,
sinks, exact reward bags, perfect-gem exception and post-soft-cap Vitality
interpretation below are the next bounded P14 contract under the authorized
umbrella scope. This is not runtime acceptance or permission to widen current30
before it is accepted. No later save version is allocated here. There is no
owner, CI or playtest hold. The retained proposal and independent review pin
the reviewed substantive contract before this status update.

## Overview

Make Alkor’s Experiment, the Jade Statuette, Jamella’s Trade and Malah’s Elixir
playable through sixteen fixed, distinct Recover objects, preserving their
existing quest/item/objective IDs, counts and hero XP. Jade requires a separate
current-town Meshif hand-in; the other three exchange their ingredients during
journal Claim. Rewards are five unallocated stat points, a new 1,000 rune-shard
bounty, one deterministic concrete perfect gem, and ten source-derived effective
Vitality respectively. Physical sources, consumption and one-time payment share
a finite durable graph; old completion flags grant no new ownership or reward.

Controlling references are the [GDD §8](../../Diablo2TextGame.md),
[D10 material economy](../plans/decisions/D10-material-economy-v1.md),
[D11 compact Act III](../plans/decisions/D11-compact-act3-contract.md),
[compact Act V](compact-act5-contract.md),
[D11 town reset](../plans/decisions/D11-town-respec-v1.md), and accepted
[Drognan recovery](drognan-tome.md). GDD pillars/invariants apply; the separate
studio pillars document is absent. New placements, sink choices, Jade’s amount,
Jamella’s explicit perfect-gem exception and Malah’s post-soft-cap interpretation
below are proposals for ratification. They are not inferred approvals from those
references.

## Player fantasy

Discover tangible ingredients while exploring, see a finite collection become
complete, and deliberately exchange it for useful build progress. Discovery and
Fantasy come from identifiable local finds and named NPC purposes; Competence
comes from readable counts and exact payment; Autonomy comes from choosing when
to Claim. Players must understand why Jade needs Meshif while the other completed
collections can be exchanged from the journal, and why Malah improves effective
Vitality without spending or refunding allocated points. This adds no offline
faucet, repetitive farming obligation or unrelated main-quest gate.

## Detailed rules

### Finite content and placement

Preserve each side’s type, Act, giver and single existing objective. Correct old
underscore area strings and obsolete Spider Cavern/Glacial Trail prose to these
canonical compact areas. Each source is an individually discoverable Recover
object, not a random monster drop or a repeated yield from one object.

| Quest ID | Giver | Objective / type / total | Item ID | Canonical area |
| --- | --- | --- | --- | --- |
| `quests/side-act3-alkors-experiment` | `npc/alkor` | `obj-collect` / `collect` / 3 | `quest/spider_venom_gland` | `areas/act3-spider-forest` |
| `quests/side-act3-jade-statuette` | `npc/meshif` | `obj-deliver` / `deliver` / 3 | `quest/jade_trinket` | `areas/act3-kurast-bazaar` |
| `quests/side-act4-jamella-trade` | `npc/jamella` | `obj-collect` / `collect` / 5 | `quest/forge_ember` | `areas/act4-river-of-flame` |
| `quests/side-act5-malahs-elixir` | `npc/malah` | `obj-collect` / `collect` / 5 | `quest/frost_lichen` | `areas/act5-ancients-way` |

Author exactly this closed list in schema-validated JSON. Full durable source
strings are literal members; suffix parsing must not admit an N+1 key. Each
entry binds the owning quest, objective, item, area and target. Keep the ordinary
single-source resolver unchanged and add a finite plural resolver for this
family. Four item definitions own sixteen sources; duplicate item-definition IDs
are not a workaround for counting.

| Exact durable source | Exact Recover target |
| --- | --- |
| `quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-1` | `objects/alkor_venom_gland_1` |
| `quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-2` | `objects/alkor_venom_gland_2` |
| `quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-3` | `objects/alkor_venom_gland_3` |
| `quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-1` | `objects/jade_trinket_1` |
| `quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-2` | `objects/jade_trinket_2` |
| `quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-3` | `objects/jade_trinket_3` |
| `quests/side-act4-jamella-trade#objective:obj-collect:source:ember-1` | `objects/forge_ember_1` |
| `quests/side-act4-jamella-trade#objective:obj-collect:source:ember-2` | `objects/forge_ember_2` |
| `quests/side-act4-jamella-trade#objective:obj-collect:source:ember-3` | `objects/forge_ember_3` |
| `quests/side-act4-jamella-trade#objective:obj-collect:source:ember-4` | `objects/forge_ember_4` |
| `quests/side-act4-jamella-trade#objective:obj-collect:source:ember-5` | `objects/forge_ember_5` |
| `quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-1` | `objects/frost_lichen_1` |
| `quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-2` | `objects/frost_lichen_2` |
| `quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-3` | `objects/frost_lichen_3` |
| `quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-4` | `objects/frost_lichen_4` |
| `quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-5` | `objects/frost_lichen_5` |

Each source stores exactly `{itemId,state:'owned'|'consumed'}` in the existing
quest-item ledger. Ingredients occupy no gear slots, material stack, generic
currency or sellable bag quantity. They have no potion, Read or ordinary crafting
consumer. Side jade never accepts main Golden Bird `quest/jade_figurine`; glands
never accept Lam Esen’s Tome; embers never spend Hellforge Hammer/Soulstone;
lichen never spend Malah’s main potion or require Prison Read.

### Recover, Give and Claim

Recover requires Normal, the exact current authored area/Act, unlocked Act,
hydrated ordinary-action-ready hero, no combat/active run/import replacement or
competing quest transaction, and the canonical tracked unclaimed side row in
progress or historical completed state. It creates only the absent exact owned
source. Listing, travel, ordinary kills, Talk and old clear arrays grant nothing.
No extra level, area-clear, giant-spider kill, Hephasto/Hellforge, Anya/Prison or
main Claim requirement is added. Repeating a source, including a consumed one,
is inert. Claimed legacy rows cannot Recover to reopen payment.

For Alkor/Jamella/Malah, first N−1 recoveries on a new row retain incomplete
`obj-collect:false` and in-progress status. The Nth source and terminal true
objective/completed status publish coherently. Recovery pays no reward. Journal
Claim separately requires the exact canonical reward bag, completed exact side
objective and all N exact owned ingredients. Claim consumes all N, grants the
whole reward and marks claimed last. This is the explicit ingredient exchange;
no additional town-return/Give objective is introduced. Later Claim may occur
anywhere and in any difficulty with ordinary readiness, matching accepted
separate-Claim policy. Copy must explain the journal exchange instead of
promising a second town hand-in.

Jade’s Recover actions collect three owned trinkets without completing delivery.
At actual current Act III town `npc/meshif`, Normal and ordinary readiness,
**Give 3 Jade Trinkets** requires all three exact owned sources and an eligible
unclaimed row. The action consumes all three and publishes `obj-deliver:true`
and completed status; it pays nothing. There is no partial hand-in or per-item
payment. Plain Talk does nothing. Separate journal Claim, later anywhere/any
difficulty with ordinary readiness, requires completed exact delivery plus all
three consumed sources, pays its whole bag once and marks claimed last.

### Finite retained graph

Native, raw and prospective validators and runtime readiness must share one
finite family domain. Each present source requires its canonical own JSON row,
exact item/state and exact single objective with boolean value. Counts derive
from source identity/state. Partial owned sets are valid; arbitrary saved count
fields or duplicate identities are not. Consumed sources are all-or-none within
a group, and mixed owned/consumed sets are invalid.

| Physical state | Collect quests | Jade |
| --- | --- | --- |
| Zero sources | Source-free legacy flags remain readable and inert | Same |
| 1 through N−1 owned | New row remains incomplete; historical completed/unclaimed row may retain its old true flag while actually repairing | Delivery remains incomplete for new rows; historical true flag alone never proves Give |
| All N owned | Requires completed true collection; unclaimed and eligible for ingredient-exchange Claim | Eligible for actual Meshif Give; all-owned is insufficient for delivery Claim |
| All N consumed | Requires exact completed true objective **and claimed** | Requires exact completed true delivery; legal before or after Claim |
| Any sources with claimed true | Requires all N consumed | **Also requires all three consumed** |

A source-bearing claimed graph can never retain owned or partial sources. The
explicit compatibility exception is a **source-free** historical claimed row;
it neither earns new source entitlements nor reopens recovery/payment. A legacy
completed/unclaimed row can acquire actual partial sources without inferring the
rest or resetting unrelated history. The same rules apply at every prospective
transaction boundary and after import/normalization.
There is no new persisted legacy marker: validators permit the compatible
unclaimed completed/partial-owned shape, while new Recover transitions keep
new rows incomplete until N. Flags never substitute for the full physical
readiness predicate.

### Exact reward bags and actual destinations

| Quest | Proposed canonical reward bag | Direct effect beyond XP |
| --- | --- | --- |
| Alkor | `{xp:4500,statPoints:5,wishstones:10}` | Five additional unallocated hero stat points |
| Jade | `{xp:3500,runeShards:1000,wishstones:10}` | Exactly +1,000 to `inventory.currencies['rune-shard']` |
| Jamella | `{xp:7000,lootTable:{tableId:'loot/side-jamella-perfect-gem',ilvl:51,picks:1},wishstones:10}` | One concrete perfect gem in `inventory.materials` |
| Malah | `{xp:9000,stat:{vitality:10},wishstones:10}` | Source-derived +10 post-soft-cap effective Vitality |

Use exact family allowlists, not arbitrary nested stats or string placeholder
acceptance. Preserve existing XP/cap/level-up rules and 75% floor share to the
actual merc fielded before publication; no merc is valid. These are additional
direct rewards, not substitutes for automatic points gained by XP level-up.
No combat/offline/find/difficulty multiplier applies to these authored awards.

**Alkor:** replace only this side’s legacy nested `stat.attribute_points` with
existing top-level `statPoints:5`. It is independent of main Tome’s own five
points. Spending them uses ordinary raw allocation/cap500; reset refunds actual
investment once and retains unspent points. No automatic allocation, raw core
increment or later Read pays again. Reconcile stale “no stat-grant quests” prose
with accepted main Tome and this side when implementation is approved.

**Jade:** the authored camel-case `runeShards` field maps to the canonical
hyphenated **`rune-shard` spendable wallet**, exactly once under the same
ingredient/XP/Claim transaction. Preflight safe integer arithmetic against that
actual destination. The current generic numeric route leaves `runeShards`
unchanged, so it cannot be reused unchanged: the eventual implementation must
provide the explicit mapping for this reward. Never credit a second camel-case
wallet. Preserve all pre-existing `runeShards`, gold and unknown wallet keys and
amounts unchanged, even if they look equivalent. Load/import/migration performs
no conversion, merge, deletion, gold repayment or compensation.

The 1,000 is a newly authored one-use bounty, not a 1:1 or 10:1 conversion rule
for legacy gold10000. It pays the currency component of existing
`recipes/caster-amulet` (1,000) or ten `recipes/socket-clear` fees (100 each),
while every existing material/target requirement still applies. No vendor,
shard-to-material shop, wishstone swap, sale or new recipe is added. The GDD
removes gold; D10 explicitly permits authored rune-shard rewards and conserves
opaque old balances. Recipe debit must prove that the credited wallet is usable.

**Jamella:** author the named treasure class with exactly seven entries in the
stable order below. Each has `type:'gem'`, `weight:1`, `minLevel:1`,
`maxLevel:102`, `quantityMin:1`, `quantityMax:1`, and the listed concrete `itemId`.

1. `gems/amethyst/perfect`
2. `gems/diamond/perfect`
3. `gems/emerald/perfect`
4. `gems/ruby/perfect`
5. `gems/sapphire/perfect`
6. `gems/skull/perfect`
7. `gems/topaz/perfect`

Use existing `rollQuestTableRewards`, its seeded weighted walk/call order and
finite-PRNG endpoint behavior, forced noDrop0/MF0, one replacement pick and strict
full materialization. Explicit IDs are an intentionally proposed one-use Act IV
quest exception to ordinary quality caps; ordinary perfect-gem drops remain
Act V Hell and existing fusion rules remain. The output is one material entry,
never gear, scalar `currencies.gems`, extra gem-shards/rune-shards or independent
kill income. Gear fullness does not block the material destination; unsafe
material-stack arithmetic does. Existing sockets, fusion, recipes and gem
dismantling remain the only consumers. A perfect gem’s existing dismantle value
is five gem-shards; Claim does not also pay those shards.

The table ID, pool/order/weights/profile and seed contract are immutable reviewed
reward authority for retries. A changed reward requires a new named reviewed
profile/contract. Reward preview describes “1 Perfect Gem” through translation
keys without rolling, reseeding or exposing implementation metadata.

**Malah:** grant hero-only +10 **after** ordinary Vitality’s existing soft cap,
using exactly the completed true side, claimed true and all five consumed lichen
sources. Source-free claimed history grants zero new entitlement. The bonus
costs/refunds no stat points, never modifies saved allocated `coreStats.vitality`,
never stacks and is not a temporary buff or healing item. The formulas below
clarify compact Act V’s ambiguous effective-stat wording; this interpretation
still requires independent design approval.

Use one pure composition result for character/effective sheet, allocation
preview/commit, equipment compare/preview, level-up, restore, battle entry/waves
and respec. Extend the shared composition/view contract deliberately: current
`prepareEquipmentStatComposition` returns derived stats and current allocation
shows raw cores, so UI-only arithmetic is insufficient. Raw allocation drafts,
point costs and cap500 remain separate. Display raw allocated, equipment,
elixir and combat contribution distinctly through locale keys; never imply that
sheet510 contributes510 uncapped formula points. Future effective-Vitality
consumers must use the same result. Preserve absolute current Life/Mana except
necessary downward maximum clamps; no path heals on Claim, level-up, gear change,
load or respec merely by recomposing this bonus.

### Synchronous publication and rollback

Hold the existing shared quest lease across preflight, publication, verification
and restoration. Capture the actual hero, canonical data, source set, prerequisite
context, XP recipient and participating destinations. Preflight the complete
prospective graph and whole reward bag before any input/reward write; pin the
Jamella result privately once and validate the actual Jade wallet. Recheck
context/data/participants after every observable publication, including
source/consumption, objective/status, XP/level-up points, wallet/materials,
source-derived capacity and final claimed state. A refusal or fault grants no
partial bag and consumes no ingredients. Reentry, silent observer mutation,
mutate-then-throw, hydration/import or actor replacement must fail safely.

Use accepted scoped physical conservation: attempt every participating
restoration and verify deep postconditions; preserve unrelated quests, physical
sources, items/materials/settings/progression and independent merc dismissal or
fielding. Track retained references and displaced gear; preserve independent
slot replacements and restore displaced originals visibly unequipped when
required. Do not resurrect independently dismissed mercs or heal affected
mirrors while recomputing caches. Restoration failure throws `AggregateError`.
A retry after refused/rolled-back Claim has the same gem and earns the complete
bundle once. These are synchronous observer guarantees, not browser-crash
atomicity.

## Formulas

For a group’s literal source set S, total N=|S| is3/3/5/5:

- `held = Σ(s∈S) [own valid state(s) = owned]`.
- `consumed = Σ(s∈S) [own valid state(s) = consumed]`.
- `recovered = held + consumed`; each count is an integer0..N.
- Recover absent s: `held' = held + 1`; repeated s: every delta0.
- Collect Claim: `(held=N,consumed=0,unclaimed) → (held=0,consumed=N,claimed)`.
- Jade Give: same physical transition with completed delivery, still unclaimed
  and every reward delta0. Jade Claim leaves consumed=N and pays once.
- XP awards and captured merc shares are4500/3375,3500/2625,7000/5250,
  9000/6750 respectively; merc share=`floor(heroAward×0.75)`, or0 without a
  recipient. Existing caps determine actual credited XP. Repeats pay0.
- Jade: `spendable' = spendable + 1000` for canonical `rune-shard`; absent own
  key starts at0. Require safe nonnegative integer destination and result.
  Every opaque legacy wallet key has delta0. At L35 nominal trash shard basis
  `5×35=175`, 1,000 is roughly six such bases before variance/floor/find. This
  illustrates scale and does not establish earned time-to-afford or balance.

Jamella’s exact existing seed is
`hashSeed(JSON.stringify(['quest-loot-table-v1',player.id,quest.id,'loot/side-jamella-perfect-gem',51,1]))`.
Use `createRng` and the existing quest-table walk. Seven equal weights imply
nominal selection probability1/7 per type, subject to that existing finite PRNG
and endpoint behavior. No difficulty/level/gear/location/clock/ordinal reseed,
second sampler or persisted reroll token is introduced.

Malah, for existing valid ordinary hero inputs:

- `ordinaryVit = rawAllocatedVit + equipmentVit` under existing source math.
- `ordinarySheetVit = min(ordinaryVit,500)`.
- `f(v) = v` for `v≤200`; otherwise `200 + (min(v,500)−200)/2`.
- `elixirVit = 10` iff exact completed+claimed+all-five-consumed graph, else0.
- `sheetVit = ordinarySheetVit + elixirVit`, maximum510.
- `formulaVit = f(ordinaryVit) + elixirVit`, maximum360.
- `baseLife = floor(100 + (level−1)×8 + 2×formulaVit + flatEquipmentLife)`.
- `lifeMax = (baseLife + existingGoldenBirdLife) × (1 + existingEquipmentLifePct)`,
  followed by existing form/aura ordering and rounding. Other Life sources
  retain their accepted placement. `currentLife' = min(currentLife,lifeMax)`;
  Mana is unchanged apart from existing necessary maximum clamps.

| Raw Vitality, equipment0 | Sheet before→after | Formula contribution before→after | Pre-Life% capacity delta |
| --- | --- | --- | --- |
| 199 | 199→209 | 199→209 | +20 |
| 200 | 200→210 | 200→210 | +20 |
| 499 | 499→509 | 349.5→359.5 | +20 |
| 500 | 500→510 | 350→360 | +20 |

At raw500/equipment20, ordinary stats remain capped: sheet510 and formula360
after the elixir. With existing30% Life, the bonus adds26 capacity before later
form/aura rounding. It does not refill those26 Life. Malah reset refund=0;
Alkor’s actually spent raw investment refunds normally. Preserve existing three
independent free stat/skill resets, then5-wishstone current-town service policy.

## Edge cases and compatibility

Before eventual source work, freeze the **actually accepted** predecessor,
including any accepted town-enlistment domains, and prove full planned equality
before live definitions/rewards/placements widen. Root chooses that boundary and
version later. Native/raw/prospective/nested readers carry the same optional
finite counted-source and reward authority. Explicit historical domains without
this family skip it and never close over a future live registry. Preserve the
established material/runeword/socket/respec/repair policies; this is not a promise
to freeze arbitrary future catalogs.

Validation-first version-only migration infers no sources, completion, consumed
states, rewards, points, concrete gem, new Malah entitlement or compensation from
old flags, clear arrays, old gold or cached derived Life. Source-free claimed
legacy history stays inert, receives no repayment and cannot Recover again.
Preserve its existing wallets, raw cores and other saved data; never guess or
reverse an unknown old award. Eligible unclaimed history must really Recover and
Jade must really Give. Terminal flags with a partial real repair remain
readable, while readiness still demands the complete physical set/sink.

Reject unknown/N+1/cross-family keys, wrong item, false/hidden/symbol/inherited or
accessor descriptors, malformed row/status/objective/state, mixed consumed sets,
partial claimed sets and contradictory terminal source graphs **before** generic
normalization or getter evaluation. Counts0/N, repeated recovery after
consumption, missing/corrupt destination and safe-integer overflow must have
explicit outcomes. A full gear bag does not consume ingredients or downgrade a
material reward. Unsafe XP/points/wallet/material/stat arithmetic refuses the
entire bag before publication. Source-free history is not proof of payment;
source-bearing claimed history obeys the complete-consumed invariant for Jade
as well as the collect quests.

No new general gold economy, vendor/sale/gambling, repeatable node, random
ingredient income, potion/Read, healing, main-quest prerequisite, combat formula
or ordinary material-drop cap is introduced. The exact Malah composition
clarification and Jamella authored quest exception are the stated proposals.

## Dependencies

The data flow is canonical side definitions + finite schema-validated source
registry → exact-area object discovery → leased Recover → physical ledger and
derived counters → Meshif Give for Jade or ingredient-exchange Claim for collect
quests → whole-bag XP/points/canonical wallet/concrete materials/consumed-source
stat composition → journal/effective sheet → Save/export/import/Continue.

Implementation will touch quest-item/source schema and loaders, pure finite
engine predicates, raw/native historical save domains, action/Claim publication,
existing XP/material grant planning, the shared hero equipment/stat composition,
character allocation/equipment/battle/restore/respec consumers, object/town/journal
presentation and both locale catalogs. Preserve ordinary one-source tool,
assembly/delivery, main Golden Bird/Tome/Hellforge/Prison and merc recruitment
semantics. Existing modules are reusable parts, not evidence that this new
multi-source transaction already exists. Assign disjoint owners and review the
concrete plan after independent design approval; this proposal creates no work
items or workflow labels.

## Tuning knobs

| Category | Reviewed proposed default | Meaning and limit |
| --- | --- | --- |
| Gate | Exact Normal/unlocked-area recovery; Jade Normal current Meshif town; separate ready Claim anywhere/difficulty | Exploration-only source policy, not an adjustable hidden kill/level gate |
| Curve | Hero XP4500/3500/7000/9000; merc share75%; Alkor5 points; Jade1,000 shards; Malah10 effective Vit | Preserve authored XP/count/point obligations; Jade amount and Malah interpretation await ratification; earned affordability/power not measured here |
| Curve | One perfect gem, seven equal weights, explicit named51/1 table profile | Authored quest exception with concrete existing sinks, not an ordinary drop-rate change |
| Feel | Named Recover controls, recovered/total and sink feedback, localized confirmation/disabled reason, ≥44px targets | Feedback/discoverability may be refined without changing durable source authority |

Counts3/3/5/5, sixteen full source identities/placements, objective/sink graphs,
reward bags, table ID/order/weights/profile and seed tuple are fixed reviewed
contract authority once approved. They are not freely mutable live tuning knobs.
Changing them requires explicit contract/reward-profile review. No DPS/TTK,
recruitment economy, pacing or campaign-balance certification follows from these
defaults. Browser usability observations support this bounded path; they do not
create a separate owner/playtest/CI gate.

## Acceptance criteria

1. Independent review evaluates this complete proposal before runtime changes,
   including Spider Forest exploration, Claim-time sinks, actual Jade wallet,
   the one-use perfect-gem exception and post-soft-cap Vitality interpretation.
   Actual predecessor equality passes before live widening; root owns allocation
   of the later version. Preserve all unrelated and historical direct readers.
2. All sixteen real objects are discoverable in their exact areas. Recover
   creates one exact source, duplicate clicks do nothing, partial reload works,
   and the Nth collect source publishes coherent completion without reward.
   Wrong Act/area/difficulty, locked Act, missing/stale row, combat/run,
   reentry/import/actor replacement and forged N+1/cross-family sources refuse.
   Listing/travel/kills/Talk/clear arrays alone grant nothing.
3. Jade1/2/3 ownership cannot Claim. Actual Meshif all3 Give consumes exactly its
   side trinkets, pays nothing and publishes delivery once. Separate Claim pays
   once with all3 consumed; a source-bearing claimed/all-owned or partial graph
   rejects. The other three require all owned before Claim and all consumed
   afterward. Completed-unclaimed legacy partial repair agrees across runtime,
   prospective and native validation; claimed source-free legacy is never
   reopened, repaid, converted or given a new Malah entitlement.
4. Jade pays exactly1,000 canonical `rune-shard` and hero/merc XP as specified,
   leaves old camel-case/gold/unknown keys byte-for-byte unchanged, and survives
   raw/JSON save roundtrip and rollback. With all other real inputs and an
   eligible target supplied, an existing caster-amulet or socket-clear action
   successfully debits that actual credited wallet. No second balance is paid.
5. Alkor gives exactly five additional unallocated points beyond ordinary
   level-up and independent main-Tome points. Allocation/reset/load/repeated
   Claim neither loses nor regrants them. Jamella yields exactly one legal
   perfect material through the seven-entry authored table and exact seed;
   deterministic previews/retries, all legal outputs, stack overflow, no scalar
   gem/extra-shard/gear grant and unchanged ordinary quality caps are covered.
6. Malah’s exact completed/claimed/full-consumed predicate yields10 once and
   source-free flags yield0. Raw199/200/499/500, equipment beyond500, flat and
   percentage Life, Golden Bird and downstream form/aura cases use the shared
   result. Character/equipment/allocation/level-up/battle/waves/restore/respec
   agree on sheet/formula values; cap500/raw refunds stay separate, current
   damaged Life/Mana never heal, and no cached increment/duplicate bonus appears.
7. Descriptor faults reject before getter reads. Literal historical readers
   survive pre-import live quest/item/source/reward/campaign drift and reject
   future sources before migration. Map/JSON/build/decode and
   export/import/Continue preserve physical history, opaque wallets, extensions,
   concrete materials, merc XP recipient investment and unrelated state without
   inference. Whole-bag overflow/refusal and every participating publication/
   mutate-then-throw/silent-observer/reentry/restoration fault conserve scoped
   participants, preserve independent writes and expose restoration failures.
8. Bilingual zh-CN/en production-browser evidence covers all actual Recover
   sources, Jade Give versus separate Claim, three collect exchanges, correct
   destinations/rewards/counters, effective-stat view, and save/export/import/
   close/reopen Continue. At360×640,412×915, landscape and desktop, named targets
   and ≥44px controls remain usable. A player can identify what remains to find,
   what Give/Claim consumes and pays, why Jade needs Meshif, and how raw Vitality
   differs from combat contribution using localized feedback without reading
   source IDs/seed metadata. Record any repetitive-route/discoverability issue;
   constructed capability is not earned campaign pacing, balance or full-v1
   acceptance. Local unit/type/lint/build and appropriate browser checks belong
   to the eventual implementation, not this documentation preparation.
