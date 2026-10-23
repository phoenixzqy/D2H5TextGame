# D10 v1 — Concrete materials, sockets and crafting

Status, 2026-10-23: Slice A (v18) is an accepted implementation contract, with
root acceptance and independent QA READY for its plan boundary. Slice B (v19)
mechanics and numeric defaults remain proposed for independent GD/TD/QA review.
This resolves the existing D10; it does not create another decision ID or claim
runtime, earned affordability, balance, browser or campaign acceptance. Root
owns implementation. Both slices preserve the whole P12b scope. ADR-009
specifies the persistent ownership boundary.

## Controlling intent and observed gaps

`Diablo2TextGame.md` sections 5/8 (lines150–154 and207–213) require earned
equipment/crafting/runewords, no gold/vendor buying/gambling, runes/gems/materials
as build inputs and a separate mercenary wishstone. `work-plan.md` P12b requires
an earned UI-to-combat-to-save vertical path followed by every advertised
recipe/socket/set/item-granted-skill family. Old `items-spec.md` v1.1 deferrals
do not cut that full private v1 scope.

At integration `994f21a`, the catalog contains33 runes,35 runewords (the original
25 plus10 later item-skill words), and no concrete gem or recipe catalog.
`drop-roller.ts` lines208–240 preserves an explicit TC `itemId`, but
`award.ts` lines69–82 discards it into numeric rune/gem counts;
`combatHelpers.ts` lines421–423 then folds rune counts into `rune-shard` and
gems into `gem-shard`. Quest-cache grants have the same aggregate problem.
Lost historical rune identity cannot be reconstructed from the mixed balance.
`items.ts` Rune/RuneWord effects still use `Partial<Affix>`, although their JSON
uses stat packages. `equipment-mods.ts` currently omits rune/runeword packages.

## Ownership and currencies

| Identity | Faucet | Sink | Saved owner |
| --- | --- | --- | --- |
| `runes/<name>`:33 canonical IDs | Successful combat-qualified independent rolls and explicit/generic TC selections | Socket, ordered runeword, rune fusion, authored recipes | `inventory.materials` |
| `gems/<type>/<quality>`:35 canonical IDs | Same earned boundaries with gem pool | Socket, gem fusion, authored recipes | `inventory.materials` |
| `materials/scrap` | Explicit salvage of owned ordinary gear | Crafted equipment | `inventory.materials` |
| `rune-shard` | Existing per-kill formula, authored shard rewards and old conserved balances | Recipe catalyst/clearing fees | Existing `inventory.currencies` |
| `gem-shard` | Conserved old balance; optional explicit gem dismantling below | Gem fusion catalyst | Existing `inventory.currencies` |
| `wishstone` | Existing kill/quest faucets | Mercenary recruitment only | Existing `inventory.currencies` |
| Charms | Concrete earned item drops when that catalog/family ships | Equipped/carried build effect per its own reviewed capacity contract | Item ownership, never a numeric anonymous charm balance |

Materials do not occupy backpack100/stash500 gear slots. One visible Materials
panel lists catalog names, quantities, acquisition and uses in zh-CN/en; no
second balance or hidden material queue. Preserve existing currency keys and
amounts, including unknown historical keys, without converting, deleting or
interpreting them as typed materials. No arbitrary shard-to-high-rune vendor.
New typed IDs are accepted only in the material ledger; unknown IDs, prototype
keys, fractional/negative/nonfinite/unsafe counts are refused. See ADR-009.

## Slice A: v18 earned materials, complete before sockets

The first implementation must deliver catalog/schema validation, deterministic
identity sampling, `CurrencyDrops.materials` and `KillRewards.materials`, every
live grant/summary/measurement consumer, v18 save/import/Continue and the real
material panel. `materials` is a required readonly ID-to-count result map;
`runes`/`gems` remain descriptive total counts only. Shared grant planning credits
actual `runeShards`, `wishstones` and concrete `materials` exactly once. It never
also turns aggregate rune/gem counts into shard credits. A quest cache still
rolls only its authored table; no independent kill income is added to a claim.

The first slice preserves existing Item.runes/socket rules. It does not reserve
inactive mixed-socket fields or claim a usable runeword/crafting path. Slice B
uses v19 for that distinct schema/behavior change. Root agreed this staged
boundary on2026-10-23. Both remain children of the same full D10/P12b outcome.

### Frozen sampler configuration

Put these values in schema-validated JSON; no TS-hardcoded game values. A
`material-economy.json` version1 has the following fields. Runtime validation
also checks exact lengths, uniqueness, catalog membership and positive totals.

* `runeOrder`: El,Eld,Tir,Nef,Eth,Ith,Tal,Ral,Ort,Thul,Amn,Sol,Shael,Dol,Hel,
  Io,Lum,Ko,Fal,Lem,Pul,Um,Mal,Ist,Gul,Vex,Ohm,Lo,Sur,Ber,Jah,Cham,Zod,
  each written as its full `runes/<lowercase-name>` ID.
* `runeWeights`:10000,9000,8000,7000,6000,5000,4500,4000,3500,3000,2500,
  2000,1500,1200,1000,850,700,580,480,380,280,200,140,95,60,36,22,13,8,5,3,2,1.
  These are `items-spec.md` section8 weights. The JSON Rune.tier groups1–12;
  it is not the ordinal1–33 and must not determine fusion order or caps.
* `actRuneCaps`:[8,15,19,21,33], one-based maximum ordinals for Acts I–V.
  This resolves the contradictory Act-I “El..Ral / maxIth” prose in favor of
  El..Ral. `nonHellRuneCap`:22 (Um); `highRuneMinOrdinal`:23 (Mal).
* `highRuneAllowedTiers`:[elite,rare-minion,champion,rare-elite,boss,chapter-boss].
  Trash cannot roll Mal+. Effective cap is the minimum of act, difficulty and
  tier caps, then normalize the retained rune weights.
* `gemTypes`:[amethyst,diamond,emerald,ruby,sapphire,skull,topaz], equal weight.
* `gemQualities`:[chipped,flawed,normal,flawless,perfect].
* `actGemCaps`:[1,2,3,3,4], **zero-based** maximum quality indices;
  `nonHellGemCap`:3. Perfect gems are therefore Act-V Hell drops. Fusion is a
  distinct earned recipe below, not a claim that perfect gems dropped earlier.

`gemQualityWeights` uses the quality order above:

| Tier | Weights |
| --- | --- |
| trash | [70,25,5,0,0] |
| elite / rare-minion / champion | [30,50,18,2,0] each |
| rare-elite | [10,35,40,15,0] |
| boss / chapter-boss | [0,0,20,65,15] each |

Fold all quality weight above the effective cap into that cap; never erase a
successful drop. Select from the stable type-major, quality-minor joint list,
with each pair weighted by its capped quality weight. These precise quality
weights are new mechanic defaults selected here from the documented tier bias;
they are not old source values or proven balance targets.

Keep the **current runtime** independent chance and quantity contracts:

| Tier | Rune probability | Gem probability | Quantity on a success |
| --- | --- | --- | --- |
| trash | .006 | .015 |1 |
| elite / rare-minion / champion | .05 | .08 |1 |
| rare-elite | .08 | .12 |1 |
| boss / chapter-boss |1 |1 |1 |

These are `orbs-and-currency.ts` lines15–33,109–112. Do not substitute the
different old prose probabilities or promise a boss1–5 independent award.
TC picks remain additional authored draws with their existing quantities.
Keep wishstone amounts/difficulty behavior and rune-shard formula unchanged.

### RNG and direct table identity

Preserve the existing call order, including champion wishstone gate, independent
rune gate, independent gem gate and shard variance. For an existing gate draw
`u = rng.next()` and probability `p`, success is `u < p`; on success sample the
material pool with conditional variate `u/p`. This consumes exactly the former
one gate draw and preserves following RNG/item sequence. p=1 uses u directly;
p=0 consumes its existing gate draw and emits nothing. With the PRNG's finite
support this is the conditional discretized sample, not a new independent draw.
Never use a constant `fork` label: current fork mixes the original seed rather
than current PRNG state and repeats that sequence across kills.

Explicit TC `itemId` is authoritative and is never resampled, reweighted or
downgraded by act caps. Countess and difficulty-specific Hellforge caches are
deliberate authored exceptions. Unknown explicit IDs refuse the whole reward
bag; never fall through into a different generic currency.

For a generic rune/gem TC entry, preserve the existing weighted-pick draw and
its conditional residual `(u*totalWeight-priorWeight)/selectedWeight` as the
identity variate. Keep noDrop, quantity and rarity draws in their existing
positions. Preserve the existing TC entry selected by the legacy <= walk even
at an exact cumulative boundary. Use half-open cumulative intervals for the
material-pool selection; when that legacy-selected entry has residual1, clamp
it to the largest representable value below1. Nonpositive weights are excluded;
invalid/nonfinite weights or an empty eligible material pool refuse the bag.

Each generic TC has an authored `materialPoolId`, from closed profiles
`act1-normal` through `act5-hell`, each resolving `{act,difficulty}`. Live kill
context supplies its actual tier; the quest-cache service retains its current
chapter-boss context and uses the selected table's authored profile. Do not
infer act from table-name substrings, monster level, current map selection or
caller UI. The existing closed three-field quest input needs no extra act key.
Absent context for a selected generic material is a whole-bag refusal. Explicit
TC IDs need no generic context. Profile selection for difficulty-dependent live
TCs must be authored/injected from their actual replay context, not Normal by
fallback. Document stable pool ordering/version so catalog edits are reviewable.

## Slice B: v19 ordered sockets and effect composition

Add one canonical ordered `socketContents` array of `{kind:'rune'|'gem',id}`;
remove the old runes representation only through the v18→v19 migration in
ADR-009. Native socketCapacity remains authoritative; never fall back to base
maxSockets or template sockets. Normal and other eligible socketed rarity
items may take plain rune/gem effects; only a white base with the exact capacity
and rune sequence creates a runeword. A gem or wrong order blocks matching and
still grants its ordinary socket effect. Show that result before insertion.

Insertion consumes exactly1 selected owned material, appends to the next empty
socket and charges no additional fee. Socketed items/materials retain exact
ownership and order across save/import/Continue. A fully matched white base
becomes rarity runeword with its catalog ID; each plain rune effect and the
runeword package apply exactly once. A requirement increase never permits an
ineligible equipped item: v1 insertion is restricted to unequipped backpack
items; creation is allowed below equip level but the resulting requirement is
visible. Equip requires max(base requirement, runeword requirement), plus all
current core requirements, for hero and merc alike.

Replace stale Partial<Affix> with the shared ItemBonusStats vocabulary. Resist,
attackSpeed, MF/currencyFind use percentage points; critChance/critDamage and
physDodge/magicDodge use ratios. Normalize these specific authored errors before
activation: Eld armor dodge2→.02/shield7→.07, Shael shield10→.10; Infinity crit20→.20,
Last Wish25→.25, Death50→.50. Do not guess by dividing every number>1 at runtime.
Use explicit schema bounds and catalog assertions. Core/flat stats are additive;
shared composition feeds both hero and merc and preserves current HP/MP pools
while recalculating caps. Tooltip and combat use the same resolved packages.

### Exact base restrictions for all35 words

`allowedBases` alone is insufficient. Recipe data adds allowed slots and, when
needed, weapon types; all listed constraints must match.

| Words | Base restriction |
| --- | --- |
| Steel, Malice, Strength, Passion, Oath, Call to Arms, Breath of the Dying, Death, Last Wish | weapon slot, any weapon class |
| Leaf | weapon slot, staff |
| Insight | weapon slot, polearm or staff |
| Obedience, Infinity | weapon slot, polearm |
| Spirit | weapon slot+sword OR offhand+shield base |
| Heart of the Oak | weapon slot, staff or mace |
| Grief | weapon slot, sword |
| Beast | weapon slot, axe, mace or scepter |
| Hand of Justice | weapon slot, any weapon class |
| Phoenix | weapon slot OR offhand+shield base |
| Stealth, Wealth, Smoke, Treachery, Duress, Lionheart, Enigma, Chains of Honor, Bramble | chest armor only |
| Ancient's Pledge, Steelclash, Rhyme, Exile | offhand+shield base |
| Lore | head armor only |
| Dream | head armor OR offhand+shield base |
| Fortitude | weapon slot OR chest armor |

Shield identity is an armor base whose slot is offhand; it is not a WeaponType.
Correct Exile's current weapon-only allowedBases data consistently. Preserve
all35 recipe sequences, capacities and required levels; use full canonical
IDs and injected catalog recipes, never the obsolete three bare-ID built-ins.

### Gem effects: all35 distinct definitions

Let q=1..5 for chipped..perfect. Each definition stores concrete numbers, not
an executable formula. These are new text-game adaptations using supported stat
families, with no unimplemented move-speed, durability or block promises.

| Type | Weapon | Armor/head | Shield |
| --- | --- | --- | --- |
| amethyst | attack +5q | strength +q | defense +5q |
| diamond | magicResist +2q | magicResist +2q | all six resistances +2q points |
| emerald | dexterity +q | dexterity +q | poison resistance +6q points |
| ruby | attack +4q | life +10q | fire resistance +6q points |
| sapphire | mana +4q | mana +10q | cold resistance +6q points |
| skull | life +5q | life +5q and mana +5q | physical resistance +2q points |
| topaz | attackSpeed +2q points | magicFind +5q points | lightning resistance +6q points |

Armor socket effects apply to eligible armor slots other than shield; jewelry
has no sockets under the current capacity contract. These defaults need earned
affordability/balance evaluation later; their data existence is not acceptance.

## Recipe and salvage contract

All quantities/eligibility/output rules below are data-authored, shown before
confirmation and consumed atomically. New costs are mechanic decisions here,
not claimed existing code or measured pacing. No extra fee is inferred.

| Recipe | Exact inputs | Exact output / rule |
| --- | --- | --- |
| Gem fusion,28 recipes |3 identical type+quality gems below perfect,1 gem-shard |1 same-type next-quality gem; no RNG |
| Gem dismantle,35 recipes |1 selected gem |q gem-shards; no RNG, no scrap |
| Rune fusion,32 recipes |3 identical runes below Zod |1 next-ordinal rune; no RNG |
| Socket armor, existing advertised Cube family |1 Hel,1 Amn,1 perfect topaz,1 unequipped normal chest item with empty contents | Same item ID/base/payload; capacity becomes one seeded uniform integer1..base.maxSockets; max must be≥1; no new item |
| Socket clearing |1 Hel,1 flawed skull,100 rune-shards,1 unequipped socketed item | Same item, empty contents; inserted materials destroyed, not refunded; runeword ID removed and rarity restored normal for a former runeword |
| Caster amulet |1 unequipped identified magic amulet,1 Ral,1 perfect amethyst,20 scrap,1000 rune-shards | Same owned base instance becomes rare: persisted fixed energy+5/mana+20 plus2 legal affixes (one prefix+one suffix), rolled once at the source ilvl; no carried old magic affixes |

Rune fusion output must be available in at least the highest unlocked act and
the selected replay difficulty under the same caps, with no trash restriction
because fusion is a recipe. It cannot manufacture Mal+ in Normal/Nightmare.
Gem fusion is expressly allowed above the drop cap, providing an earned perfect
gem route before Hell. Both caps/requirements are explained in UI. Caster output
keeps base/ilvl/socketCapacity/personalization and clears any old generated-name
and affix state before writing persisted new mods/name. Restrict its input to
zero inserted contents and forbid unique/set/runeword/quest/sacrificed items.

Salvage accepts explicitly selected owned, unequipped backpack/stash gear after
preview, never equipped, quest or reserved Iron Golem items. For each normal,
magic,rare,set,unique,runeword item respectively grant1,2,4,6,6,6 scrap multiplied
by `1+floor((max(1,ilvl)-1)/20)`. A socketed item also destroys its inserts after
the preview says so; it never refunds runes/gems. Bulk salvage deduplicates IDs,
checks all targets and output arithmetic before one publication. Existing
discard remains explicit discard; do not silently turn prior deletions into
materials or auto-salvage earned overflow. No crafting/progression may rely on
inaccessible hidden over-cap items.

These concrete recipes supply the first complete crafting path. P12b is not
finished by this one amulet: all recipe families above, all33 runes/all35 gems,
all35 runewords, existing set thresholds and item-granted skill families must
have their individual coverage rows and functional/UI/save evidence. The full
set/skill source catalogs remain in scope, including10 later runewords with
grantsSkills. Canonical D2-flavored prose promises absent from simplified JSON
(such as Leaf's Fire-skill bonus or item-granted auras) require an explicit useful
runtime adaptation/decision and coverage; silently dropping them is not allowed.
This contract does not claim those absent effect families are implemented.

## Atomic actions, deterministic outputs and failure

Preflight current authority, not caller payload: character/readiness, complete
canonical input item/IDs, owned amounts, selected target/contents/capacity,
recipe unlock/eligibility, safe integer additions/subtractions, output slots and
current wave/settlement/Iron ownership guard. Duplicate input IDs cannot satisfy
multiple costs. Refusal returns a localized reason without a publication, RNG
advance, point/resource/currency spend or selection loss. Keep D09 net-capacity
semantics: same-instance transforms need no extra gear slot; adding new gear
must fit without worsening existing overflow. Earned material ingress is not
blocked by gear fullness and never silently truncates a stack.

Use one synchronous ownership/action lock through preflight, commit and every
restoration attempt; reentrant actions refuse. Compute random output once from
the action's production-seeded identity, persist its result and committed action
receipt together. A failed preflight must not consume an ordinal/seed. On a
mutate-then-throw write restore the exact before-state; restoration errors retain
explicit aggregate failure evidence and do not report success. Whole-save
persistence prevents committed inputs from reappearing while output survives.
No claim of observer-wide/crash atomicity, rewind-proof exports or cryptographic
fairness follows. See ADR-009 for the idempotent retry boundary.

Reward planners validate the entire material/currency/item bag and all sum
overflows before publication. No partial stack award followed by an exception;
retain installed reward identity for a safe native retry rather than rerolling.
Do not add a second combat-reward path or bypass its existing qualified receipt.
The current XP-before-loot publication order is insufficient for new strict
material failures: stage the full earned bag and safe destination arithmetic
before any XP, merc XP, currency, item, quest/clear or receipt mutation. Use the
existing guarded settlement with complete participating before-state rollback
for publication faults. Quest/cache Claim snapshots and rollback must include
the materials ledger as well as existing player/merc/inventory/quest domains.

## Affordability and acceptance

Rune-shards retain `floor(5*level*tierMultiplier*(1+currencyFind/100)*variance)`
with variance[.7,1.3), tier multipliers1/2.5/2.5/4/6/50/50.
At L10 trash with0 currencyFind the floor range is35–64;1000 shards therefore
cost16–29 such kills, conditional on those drops, excluding all other faucets.
At L10 elite it is87–162, requiring7–12 kills. These are source-only cost
arithmetic, not kills/hour, combat wins or campaign projections. Scrap/gem/rune
availability remains part of the recipe cost; the shard number alone is not
time-to-afford. Three-to-one gem fusion means81 chipped equivalents per perfect
gem plus40 fusion operations/gem-shards if all inputs start chipped. Dismantling
extra gems supplies the dust; imported old dust is conserved without assuming
its historical origin. Publish actual earned source mix and active-time
distribution for first rune/runeword/perfect gem/craft when measured.

Wishstone target80/h and ten-pull90 imply67.5 minutes by arithmetic, not8.
Preserve live source amounts/pull cost unless separately reviewed; no fabricated
eight-minute target. No economy simulation or fresh combat was run to establish
this contract. C2/campaign balance/full v1 acceptance remains separate.

The runtime acceptance matrix below is still outstanding. Rows1–3 govern
Slice A where applicable; socket, recipe and effect behavior in rows1/4/5 belongs
to the proposed Slice B and cannot be inferred from Slice A plan readiness.
Independent QA acceptance must prove:

1. **Catalog/pools:**33 unique canonical rune IDs,35 gem IDs,35 runewords; exact
   order/weights/caps/units, no grouped-tier misuse, all slot restrictions,
   malformed/empty pools fail closed. Script u=0, just below p, u=p, weighted
   boundaries and final eligible entry. Repeated same seed/context yields exact
   same identities and following RNG draw/item payload; explicit TC ID is
   unchanged by pool edits. Quantity/default chance budgets stay unchanged.
2. **Award/storage:** actual qualifying production victory and authored cache
   yield real catalog IDs at the UI stash; no rune/gem aggregate shard credit,
   no independent cache income, no rejected/nonwin/duplicate publication award.
   All grant callers use shared plan. Material-stack overflow refuses the whole
   bag with installed evidence retained; zero/negative/unknown/prototype and
   unsafe count attacks cannot publish partial state.
   Assert XP/merc XP/clear/quest progress also remain unchanged when material
   preflight refuses, and inject postpublication faults in each participating
   domain to prove exact rollback and unchanged installed reward on retry.
3. **Compatibility:** every valid historical version first produces exactly its
   existing frozen historical→v17 decoded result (including established gold
   folding and gear normalization). The v17→v18 step then conserves all v17
   currency keys/values/items/socket contents/quest ledgers and adds empty materials;
   current missing/malformed ledger and old-version reserved field laundering
   refuse. v18 typed balances round-trip exact JSON/export/import/IndexedDB and
   actual Save→close→Continue. Browser en/zh-CN at360×640 plus desktop.
4. **Sockets/effects:** actual earned rune recipe and earned gem fusion/craft
   are assembled through UI, spend exact costs once, alter resolved combat stats
   and persist. Wrong order/mixed gem/overcapacity/wrong slot/ineligible target
   refuse or remain a plain socket item as specified; plain+word effects apply
   once for hero/merc. Test ratio vs percentage-point sentinels and current pools.
5. **Transactions:** missing/stale/duplicate/reserved input, reentrancy, every
   mutate-then-throw write, rollback failure, double-click, exact retry and reload
   conserve inputs/outputs. No reroll on refused/repeated action/import; consumed
   material and recipe receipts survive reload. Boundary gear capacities and
   old overflow stay visible/recoverable. Each35 word/set/skill family receives
   explicit positive/negative acceptance, not only a generic happy-path test.

Plan-review challenge: earlier generic counters, duplicate grants, RNG drift,
missing quest-cache context, ratio errors and an inert first schema slice are
material gaps addressed above. Independent QA verified Slice A's gate-draw order,
legacy TC boundary, frozen historical migration and whole-settlement staging/
rollback requirements before root accepted that implementation contract. This
is plan readiness only. Slice B's numeric mechanic defaults still require the
normal independent GD/TD/QA verdict; they are not a request for repeated owner
permission. A catalog-only or test-only delivery cannot close Slice A or P12b.

## Slice B review amendment — 2026-10-23

This amendment resolves the GD/TD review's five concrete concerns and controls
over conflicting proposed Slice B wording above. GD/TD approve implementation
with these exact amendments; independent QA review of the amended contract is
READY after the boundary amendment below. Numeric defaults are approved as mechanics, with earned affordability
and balance still unmeasured. Deliver unified v19 socket/recipe behavior rather
than another inactive ownership schema. Full P12b acceptance remains unchanged.

1. **Complete alternative base predicates.** Phoenix changes to
   `allowedBases:['weapon','armor']`; Exile changes to `['armor']`. Each allowed
   alternative is a complete predicate. Spirit is `(type:weapon,slot:weapon,
   weaponType:sword) OR (type:armor,slot:offhand)`. Phoenix is
   `(type:weapon,slot:weapon) OR (type:armor,slot:offhand)`. Weapon-type limits
   apply only within the weapon alternative. Preserve all35 sequences, exact
   capacities/required levels and the other listed restrictions.
2. **Freeze historical acceptance and recover unsupported placements.** Before
   changing live restrictions, freeze v18's item validator, matcher and relevant
   catalogs. A currently valid v18 Lore on chest armor must still decode under
   v18, even though new v19 insertion cannot create it. Compatible active items
   convert in order without loss. Newly disallowed placements move to exact,
   version-tagged v18 quarantine payloads with original ownership provenance;
   they contribute no active effects. Keep existing v16 quarantine under its
   frozen contract. Migration neither strips contents nor refunds materials.
   Provide an explicit bilingual recovery preview/confirmation: return the same
   instance/base/base rolls/capacity/personalization as normal gear with empty
   contents, remove runeword identity, and credit its exact inserted rune counts
   to materials. Commit target ingress, refund and removal of the quarantine
   entry once, under the shared action boundary. Gear-capacity/material overflow
   or any fault preserves the complete entry and prior state. No inferred rune
   identities, silent loss or activation of unsupported legacy placements.
3. **Every action shares one replay boundary.** The latest receipt's closed
   result contains an optional transformed `itemId`, a material-output map and
   a currency-output map. Output maps obey the closed catalogs and positive safe
   counts, omitting zero. Crafting currency output keys are only rune-shard and
   gem-shard. This represents insertion, clearing, socket rolls, caster craft,
   fusion, dismantling, salvage and quarantine recovery. Ordinal starts at0 with
   no receipt; a new prepared intent uses current+1, refusing safe-integer
   overflow. Check exact latest ordinal/requestHash replay before checking inputs
   that the original action consumed. Return the recorded result without a
   publication or RNG. Older, mismatched and gapped requests refuse. One UI
   confirmation intent retains one prepared request through double-click/retry.
   New refused inputs and rolled-back writes advance nothing. Commit all inputs,
   output, ordinal and receipt together. See ADR-009's amendment for schema and
   ordering; no unbounded receipt history or crash-atomicity claim is added.
4. **Source level and caster fixed package.** Craft/salvage use own item.ilvl
   when present, otherwise item.level; require a positive safe integer. A
   malformed present ilvl refuses, never falls back. Preserve original fields,
   including absent ilvl; never substitute character level/base requirements.
   Caster fixed bonuses use one reserved recipe-affix ID and values authored in
   recipe JSON, persisted in existing LegacyAffixRoll format with Map entries
   `coreStats.energy→5` and `statMods.mana→20`, plus exactly one newly rolled
   legal modern prefix and one suffix at that source level. Empty legal pools
   refuse before spending. Replace old affixes/generated name; retain specified
   instance/base/socket fields. Apply the fixed Map once, without duplicating
   those values into base rolls or derived caches.
5. **Stat units stay explicit.** ItemBonusStats critical/dodge packages use
   ratios; resistance, attackSpeed, magicFind and currencyFind use points.
   magicResist is a flat mitigation rating. Existing modern critical/dodge
   affixes remain authored in percentage points and keep their existing single
   conversion. The six named catalog ratio corrections above apply before
   activation; no blanket runtime division or second affix conversion.

Compliance adds historical loose-match fixtures, new strict branch controls,
lossless equipped/backpack/stash/merc quarantine migration and confirmed
recovery, every result kind's reload/replay without input reconsumption,
ordinal boundaries, legacy missing/present-invalid ilvl, caster Map/modern
affix composition once and flat-MR/ratio/point sentinels. Existing per35-word,
all-recipe, transaction and earned UI/combat/save requirements remain mandatory.

QA boundary amendment: reject reserved v19 fields on raw predecessor payloads
before any historical normalization/migration can erase them. This includes
socketContents at every item, mirror and snapshot site, materialActionOrdinal,
its latest receipt, and the new quarantine discriminator. Native ordinal0 is
valid exactly when no receipt exists. A positive ordinal requires exactly one
closed latest receipt with equal ordinal, a canonical bounded request hash and
both required closed result maps. Malformed/missing/mismatched receipt and
predecessor-field-laundering controls are mandatory.
