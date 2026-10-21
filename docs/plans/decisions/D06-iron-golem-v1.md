# D06 v1d — Selected-item Iron Golem preparation

Status: accepted scoped mechanic contract, 2026-10-21; independent QA, GD and
TD approved. Transaction ADR, implementation, UI/browser and balance remain pending;
no runtime acceptance.
This is the next bounded D06/P09 dependency after accepted
[v1b](D06-summon-preparation-v1.md) and
[v1c](D06-summon-corpses-v1.md). It does not close full D06/P09/P10 or private-v1.
Root is the sole writer/executor; implementation increments remain at most five
repository paths, committed before the next. No remote publication is authorized.

## Overview and controlling sources

Give Iron Golem an explicit selected inventory-instance input. At a new wave's
startup, a qualified, slotted Necromancer may sacrifice one selected metal item
and pay the existing mana cost for one Iron Golem. The item is permanently lost;
the golem lasts only for that wave. No selection means no Iron Golem. A generic
free template cannot satisfy this contract.

Canonical `Diablo2TextGame.md` §5.2 requires summons prepare once at battle start,
without ordinary actions or repeated summoning. The authored skill
`skills-necromancer-iron-golem` / canonical `necromancer.iron_golem`, its existing
`iron_golem` template and current bilingual description establish the metal-item
fantasy. They do not specify a metal predicate, inherited property set or
persistent golem. This card chooses those mechanics explicitly. D04 resource
carry and D06 identity/preparation remain controlling outside these additions.
The referenced pillar/anti-pillar files are absent; use the available canonical
GDD and skills spec, without inventing pillar approval.

## Player fantasy and tradeoffs

Turn a deliberately chosen spare piece of metal equipment into a temporary
protector whose strength reflects that item. This serves build discovery,
resource choice and readable cause/effect. The player sees the exact item and
three inherited bonuses before authorizing its use; valuable equipment is never
automatically chosen, replaced or repeatedly consumed.

Choose a **one-wave sacrifice**, fitting current transient summons. This gives
up classic persistent item-bound golem survival and makes repeated use a fresh
item choice. A persistent golem would require saved binding, death/replacement,
restoration and migration rules; it is outside this card. Reject unlimited
item tokens or a generic-template substitute. Reject transferring all item
properties: current combat cannot faithfully provide all procs, auras, sockets
and set effects. Transfer only the three scalar stats defined below, visibly.

## Detailed rules

### Selection and authoritative ownership

1. Provide an explicit hero-bound selection `{heroId, itemId}` through normal
   controls. It instructs the **next new wave only**, costs nothing to select or
   clear, and never reserves, equips or copies an item. Resolve the current live
   instance at startup; never trust a caller-supplied Item object. A selection
   made during playback cannot change that wave or its replay.
2. Consume the selection instruction when the next accepted new wave freezes
   its attempt, including poor, invalid, missing, full, terminal or ineligible
   outcomes. The item is retained unless a summon is successfully committed.
   Thus a failed attempt cannot become a delayed surprise sacrifice. A technical
   staging failure that accepts no wave retains the instruction. Clear selection
   on hero replacement, successful load/import, new character and run abort.
3. The instance must occur exactly once in the live backpack and nowhere in
   stash, player equipment or **any** mercenary's equipment, including unfielded
   mercenaries. Reject duplicate IDs within or across those containers; never
   repair/remove all copies. Require `identified: true` and `equipped: false`.
   A historical `equipSlot` alone does not disqualify a backpack item. Reject
   stale/missing IDs and hero mismatch. Wearing level/core-stat requirements do
   not gate sacrifice because the item is not equipped.
4. Require a known weapon/armor base explicitly authored `metal: true` in game
   data. Missing/false metadata and unknown bases are ineligible. Never infer
   material from names, translated text, slots or weapon classes at runtime.
   Jewelry, charms, runes, gems and materials are outside this contract even
   when their names suggest metal.

Initial metal-true bases are the following **31 exact IDs**, prefixed by
`items/base/`; all other existing bases default false:

| Group | Exact base suffixes |
| --- | --- |
| One-handed weapons | `wp1h-short-sword`, `wp1h-scimitar`, `wp1h-long-sword`, `wp1h-war-sword`, `wp1h-phase-blade`, `wp1h-legend-sword` |
| Two-handed weapons | `wp2h-two-handed-sword`, `wp2h-great-axe`, `wp2h-war-pike`, `wp2h-giant-thresher`, `wp2h-colossus-blade`, `wp2h-thunder-maul` |
| Other weapons | `weapon-axe`, `weapon-mace`, `weapon-polearm`, `weapon-scepter` |
| Helms | `helm-skull-cap`, `helm-casque`, `helm-armet` |
| Body armor | `armor-chain-mail`, `armor-breast-plate`, `armor-archon-plate` |
| Gloves | `glove-chain`, `glove-light-gauntlets` |
| Boots | `boot-chain`, `boot-light-plated`, `boot-myrmidon-greaves` |
| Belts | `belt-plated`, `belt-mithril-coil` |
| Shields | `sh-aegis`, `sh-monarch` |

5. Support normal, magic, rare, unique and set instances with valid, consistent
   rarity/base/definition identities. Unknown or contradictory unique/set IDs,
   unresolved affixes or malformed/nonfinite contributing rolls are refused
   before debit. Resolve a unique or set piece against its actual definition
   and base; no guessing, rerolling or silently substituting zero for a missing
   definition. Legitimate definition-backed `statRolls` and the existing
   resolver's deterministic legacy fallback remain supported.
6. Base socket **capacity** is allowed. Installed runes (nonempty `runes`), any
   `runewordId` or runeword rarity are refused until their effects have a reviewed
   resolver. Refusal preserves the entire item, runes and other inventory.

### Preparation and item/stat resolution

7. Require the exact authored/canonical skill and explicit matching summon ID,
   Necromancer class, integral learned rank1–20, level24, the existing learned
   Blood Golem direct prerequisite and an explicit combo slot. Canonical/authored
   duplicate slots resolve once. No unlearned/foreign rank1 fallback in production.
8. Prepare once at time0 in existing stable owner/skill order, requiring a living
   owner and opposing sides. Cap remains1 by owner/exact template; a living
   full/over-cap preload costs no item or mana and remains unmodified. No healing,
   replacement, shared golem-family cap or new total-unit cap. Dead IDs remain
   reserved under the accepted battle-local allocator.
9. Resolve the selected item **alone** through the existing deterministic
   equipment modifier resolver with set thresholds disabled (`sets: []`). Copy
   only its flat `life`, `attack` and `defense` contributions. This includes base,
   rolled affix, unique and individual set-piece contributions that the resolver
   supports, and excludes every set threshold, including a one-piece threshold.
   Do not create a second item-stat formula or aggregate the hero's other gear.
10. Add those three contributions once after ordinary Iron rank scaling; fresh
    current life equals final maximum life. Preserve all other template stats,
    damage behavior and existing approved general summon effects. Transfer no
    item core-stat-derived life, mana, resistances, speed, dodge, crit, elemental
    identity, skills, aura, proc, MF or other property. This card introduces no
    Skeleton/Golem Mastery support. Missing contributions mean zero; nonfinite
    or negative inherited scalars, overflow or invalid final candidates refuse
    the whole preparation without item/mana/RNG/identity side effects.
11. Stage and validate the complete candidate before any payment. A missing or
    invalid selection, insufficient mana after earlier preparations, malformed
    source/template, dead owner or terminal startup produces no Iron cast, spawn
    or charge. No partial payment, later resource retry, ordinary cast or
    automatic replacement item. Ignore only Iron's stale carried cooldown for a
    successful startup; apply the ordinary resulting cooldown once.
12. A successful preparation pays the existing rank-adjusted35MP once for its
    missing singleton and emits the normal attributed cast/payment/summon events.
    Allocate identity/scheduling only on success; use no unrelated RNG draw.
    Preserve unrelated cooldowns, ordering, coexistence and D04 carried resources.
    Validate the canonical skill/owner/rank and matching authored summon
    source/template before establishing battle-local owner/template death
    authority. For a valid source, establish it independently of selected-item
    eligibility or mana success: matching new/preloaded Iron deaths refund no
    mana or item and clear no cooldown even for full, poor, no-item or invalid-item
    attempts. Item resolution and complete inherited-candidate validation gate a
    missing spawn/debit only; a full living preload needs no selected item.
    Invalid skill/template source establishes no authority.
    Preserve unrelated/synthetic legacy behaviors under explicit different
    identities; canonical production Iron never receives a free generic fallback.

## Formulas and independent examples

For allocated rank `r` in1–20 and isolated resolved contributions `L`, `A`, `D`:

```text
lifeMax = 260 + 16 × (r − 1) + L; currentLife = lifeMax
attack  =  36 +  2 × (r − 1) + A
defense =  48 +  3 × (r − 1) + D
missing = max(0, 1 − livingSameOwnerAndTemplate)
success: missing = 1 AND all eligibility/validation succeeds AND mana ≥ rankedCost
success: one item removed; manaAfter = manaBefore − rankedCost
otherwise: no item removed; no Iron mana debit; no Iron spawn
```

These are current template/growth values; current ranked cost is35 at all ranks,
resulting cooldown4s, speed60, physical/lightning resistance20. JSON remains the
runtime tuning authority. Without item bonuses, ranks1/6/20 give life/attack/defense
260/36/48,340/46/63,564/74/105. An ordinary Short Sword contributes attack8 using
existing base-max equipment semantics: rank1 becomes260/44/48. Chain Mail's
base defense53 makes rank1 defense101 and rank20 defense158. An independently
specified contribution12.5/3.25/4.5 makes rank6 equal352.5/49.25/67.5; preserve
fractions in combat and use existing four-decimal presentation only for display.
At35MP success leaves0; at34MP both item and mana remain unchanged. These are
functional oracles, not earned affordability/TTK/balance acceptance.

## Edge cases, commit boundary and replay

The engine remains pure: it receives an immutable validated item projection,
never an inventory store or removal callback. Its result must explicitly attest
whether this exact owner/skill/source prepared successfully. The store owns the
persistent inventory mutation; logs or a mere surviving golem are not debit
proof. A golem killed during the simulated wave still consumed its item.

Stage the entire wave, terminal result, event stream and publication payload
before writing inventory. Bind staging to the exact hero, run identity, wave,
selection and live inventory state; revalidate before commitment. Refuse
not-ready hydration/save replacement, stale staging and nested start/commit.
Remove **one exact backpack index**, preserving order and every other container,
item/roll and currency. Do not use broad `removeItem`/filter-by-ID semantics.

The mana charge and spawn are all-or-none **inside the staged battle**. The
item is debited exactly once as that accepted recording becomes authoritative.
Mana is wave-local, as today; this is not a persistent mana transaction. Maintain
an authoritative transient receipt binding source, accepted attempt and recording.
Before commitment, failure has no debit or published wave. If a synchronous
commit step fails before publication, restore only transaction-owned changes
whose expected state is unchanged; do not overwrite unrelated/reentrant writes.
If debit has become committed, retain the receipt and exact staged recording so
publication can recover without another debit; never independently refund an
already authoritative recording. Surface restoration/publication failures,
retain recovery evidence, and prevent advancing/restarting the unsettled wave.
The subsequent TD architecture decision must define concrete commit/recovery
states and supported save/action guards before implementation.

This promises settled process-local consistency for supported actions, not
unobservable Zustand intermediate states or rollback of arbitrary subscriber
side effects. Save/export/flush and supported hero/import/run actions must not
capture or replace a half-settled transaction. Preserve existing debounced-save
and restore serialization; do not introduce a crash-atomic storage claim.

For a wave **initially eligible and slotted for Iron**, freeze the complete
original engine input, attempt and recording, including no selection, invalid,
poor and full attempts. Explicit replay restarts that same recording; it does
not resolve inventory, resimulate current configuration, charge mana a second
time, consume another item or retry a failure. Config/selection/rank/respec/gear
changes apply to the next new wave, even when Iron failed. Playback never debits
inventory. For every other wave, latch **no Iron attempt this wave**: later
slotting/learning/selection cannot introduce Iron during replay, while ordinary
skills retain existing current-configuration replay semantics. Reward identity
and duplicate-reward protections remain unchanged.

Death, owner death, flee/abort, wave end, respec and a successful load/import
refund no consumed item. A next wave rebuilds transient summons and requires a
fresh selection and actual carried mana; never auto-select a second item.
Respec preserves the locked current recording. Hero replacement aborts it.
Save/load/import omit selection, receipts, recordings and golems; the saved
inventory reflects consumption in that saved snapshot. Existing player resource
resume policy remains; current-wave mana/carries are not newly persisted.
Loading a pre-consumption save can restore its old inventory, as any deliberate
older-save rollback can; no anti-rollback guarantee or new save version here.
A failed import leaves the current live selection/run intact under existing
restore semantics. Ordinary Save/export retains the live recording.

## Dependencies and player presentation

Flow: authored base metadata + authoritative live Item → existing isolated item
resolver → immutable engine projection → staged attempt/recording → guarded
exact-index inventory debit and authoritative receipt/publication. The UI issues
only hero/item IDs and reads preview/results; it owns no stat or transaction math.
The metadata and transient transaction interfaces require a separately reviewed
TD ADR before runtime edits, without adding a save shape or generic transaction
framework. This mechanic card does not lock implementation type names.

Use existing `necromancer.iron-golem.desc` in the skills namespace, plus
namespaced i18n keys for selection, clear, no eligible item, refusal reason,
three-stat preview, sacrifice warning, next-wave selection, locked-wave config
and attempt outcome. Both zh-CN and en must explain exact item loss, one-wave
lifetime, only life/attack/defense inheritance, no retry/refund and locked replay.
Require an explicit item choice and a visible acknowledgement of the sacrifice
before the selection becomes armed; no default/preselected item and no generic
confirmation for ordinary non-destructive skill edits. Clear selection visibly.
Expose eligibility/refusal without raw internal IDs. Current/next rank detail
and selected-item preview must use the same pure projection and truthful scope.
Never label an item permanently consumed merely because it was selected.

Verify native Skills/inventory/combo controls at360×640,412×915, mobile landscape,
1280×800 and1920×1080 in both locales; targets≥44px, readable warning/preview,
no overflow, keyboard focus/activation and announced outcome. Imported equipment
is functional scaffolding, not proof of an earned metal-item supply. The browser
must show changed combos applying next wave for an Iron-locked recording.

## Tuning knobs

Preserve authored cap1,35MP,4s,rank growth16/2/3,maxrank20,L24 and Blood Golem
prerequisite. Mana/CD are feel knobs, growth is a curve knob, unlock/prerequisite
and authored metal eligibility are gate knobs. Inheritance100% for exactly three
scalar stats is this version's fixed mechanic; future ratio/property/material
changes require reviewed design and numerical evidence. No new stat ceilings,
affordability/TTK claims, corpse economy or shared golem-family tuning.

## Acceptance criteria and implementation order

1. GD/TD and QA approve this contract, then review metadata/transaction ADR and
   the bounded implementation plan. Do not infer runtime acceptance from either.
2. Freeze literal rank1/6/20 and fractional oracles before code. Genuine RED must
   cover selected eligible startup, no-item/poor/invalid no-op, ownership/alias
   duplication, exact source/template validation, preload preservation/IDs,
   dead/terminal guards, unchanged inputs/RNG and plain/recorded A/A and A/B/A.
   Include literal full-preload death controls with no item, invalid item and poor
   mana (no refund/cooldown clearing), plus an invalid-source authority control.
3. Prove all31 metal IDs and default-deny controls; all five supported rarities,
   unique/set/base identity consistency, rolled/legacy resolution, no thresholds,
   installed-rune/runeword refusal, finite contributing stats, no other properties
   inherited and no wearing-requirement gate. Preserve existing item resolver
   and inventory/merc regressions; no weakening save validation for fixtures.
4. Prove one exact item debit on successful recording, none on failures/full,
   dead-during-simulation still paid, selection one-shot on accepted failure,
   stale staging, nested requests, guarded save/export/import, publisher failure
   before/after commitment, recovery without double debit and explicit failed
   restoration. Do not claim protection against arbitrary subscriber mutations.
5. Prove locked successful/failed/no-item replay and next-wave carry, initially
   absent Iron added mid-wave, rank/combo/gear/respec changes, no repeated rewards,
   flee/hero replacement, failed/successful import, save→close→Continue and no
   free or reconsumed golem on load. Other summon/replay controls stay intact.
6. Each source increment≤5paths, commit before next; serial focused/engine/full
   unit/type/lint/production-build checks as applicable, with original RED/GREEN
   evidence retained. Browser acceptance requires native zh-CN/en selection,
   acknowledgement, actual item/mana/startup, refusal, lock and save/reload flows
   on production bytes. Retain reports/screenshots and clean exact task-owned
   outputs after all readers release.

Full Iron/D06 acceptance remains pending implementation and experiential proof.
Other corpse consumers, Mage elemental identity, earned campaign/economy/balance,
open time/build warnings, complete a11y/platform/PWA gates and private-v1 remain
open. No earned Moor/Den attempt or completed matrix is reopened by this card.

## Contract review record

QA initially returned CONCERNS for the18,868-byte draft
(`31e7290bf90f66616f4f5bf1e85762c3dd79a03436797a92c49ccf37dbe4b81d`):
valid-source death authority needed explicit independence from item/mana success.
Rule12 and AC2 were revised with full-preload no-item/invalid-item/poor-mana death
controls and an invalid-source control. QA then returned
`[QA-D06-IRON-CONTRACT]: APPROVE`; independent GD/TD returned
`[GD-D06-IRON-CONTRACT]: APPROVE` and `[TD-D06-IRON-CONTRACT]: APPROVE` for the
same19,481-byte contract
(`a1e43d748c18019df8a48ad0bc59d831737055f784ddd4da021951f7388dda86`).
They also verified the scoped skills/register edits. This publication adds the
approval status/record and reconciles their companion status wording; it does
not change the reviewed mechanics. No tests/builds were run for documentation.

TD explicitly requires the next ADR to handle new-run ordinal/reset mutations
and previous-wave reward/cursor transitions: staging/publication recovery must
neither repeat rewards nor accept an old outcome as a new wave. All reviewers
released their readers and created no files/processes. No temporary artifacts
were created for this documentation increment.
