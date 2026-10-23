# ADR-008 — Persist item service results and bind replay difficulty to runs

## Status

Accepted technical implementation contract, 2026-10-23.
`TD-ARCH-REVIEW: APPROVE` by assigned `/root/design_contracts` owner. This is
data-shape and source-authority sign-off, not runtime or full P18 acceptance.

## Context

The [Act V contract](../design/compact-act5-contract.md) requires usable socket,
personalization and Nightmare rewards. Currently `base.sockets` supplies both
displayed capacity and the sole rune insertion/matcher limit. Eligible bases
therefore already appear socketed; the four zero-capacity weapon/armor bases
also have zero maximum. A charge with no reachable eligible item is unfinished.
Current chapter-boss exact HP/attack/defense overrides also bypass level growth;
adding20 to the spawn level alone would not scale actual boss power.

The [GDD](../../Diablo2TextGame.md) §7.2 permits difficulty through level only.
[D03/D14](../plans/design-decisions.md) reject stale independent difficulty
HP/damage/resistance multipliers and keep broader P18 acceptance accountable.
Retain [ADR-006](ADR-006-source-bound-quest-items.md) atomic source identity.

## Decision

Persist per-instance socket capacity and personalization; preserve the existing
authored base socket values as reviewed maxima and historical/fixed-template
defaults. Store source-keyed service use. Bind a finite Normal/Nightmare profile
to every new run and its reward/clear authority, with separate clear namespaces.
Nightmare adds20 levels; exact chapter overrides scale only by the native
archetype's growth ratio. Integrate these fields through producer-owned save17
after freezing16; native validation precedes normalization.

### Socket shape, acquisition and reviewed maximum table

Add JSON `maxSockets` to bases, equal to their current `sockets ?? 0` below.
Keep old `sockets` for frozen historical interpretation and fixed unique/set
defaults, not as the new shared capacity consumer. Do not infer base tier from
reqLevel or invent tier maxima. All74 base IDs are covered; table suffixes
have prefix `items/base/`.

| maxSockets | Base ID suffixes |
| --- | --- |
| 0 | ring-iron, ring-silver, ring-jade, ring-amber, ring-obsidian, ring-zircon, amu-tin, amu-brass, amu-silver, amu-jade, amu-obsidian, amu-zircon, ring, gloves, boots, belt, weapon-bow-training |
| 1 | glove-leather, boot-leather, belt-sash, belt-light, sh-buckler, weapon-wand |
| 2 | helm-cap, helm-skull-cap, armor-quilted, armor-leather, glove-heavy, glove-chain, boot-heavy, boot-chain, belt-heavy, belt-plated, wp1h-short-sword, wp1h-scimitar, wp2h-two-handed-sword, wp2h-great-axe, sh-kite, armor-light, weapon-bow, weapon-crossbow, weapon-scepter, weapon-mace, weapon-axe |
| 3 | helm-war-hat, helm-casque, armor-chain-mail, armor-breast-plate, glove-light-gauntlets, glove-vampirebone, boot-light-plated, boot-demonhide, belt-demonhide, belt-mithril-coil, wp1h-long-sword, wp1h-war-sword, wp2h-war-pike, sh-aegis, sh-dragon-shield, armor-heavy, weapon-polearm |
| 4 | helm-armet, helm-giant-conch, armor-dusk-shroud, armor-archon-plate, glove-bramble-mitts, boot-myrmidon-greaves, wp1h-phase-blade, wp2h-giant-thresher, sh-monarch, sh-sacred-targe |
| 5 | wp2h-colossus-blade |
| 6 | wp1h-legend-sword, wp2h-thunder-maul |

New normal gear rolls seeded uniform integer `socketCapacity` in0..maxSockets;
magic/rare in0..min(2,maxSockets). Resolve capacity after existing item identity,
base/affix/stat rolls using a private RNG, preserving the parent loot/combat
RNG sequence. Seed it with
`hashSeed(JSON.stringify(['item-socket-capacity-v1', generationEntropy, item.baseId, item.rarity, item.level]))`.
`generationEntropy` is the seeded RNG component of current generated
`it-<rng>-<seq>` IDs, excluding the allocator suffix; an equivalent explicit
stable generation-entropy parameter is acceptable. Do not seed from the whole
ID: failed claim attempts leave allowed allocator gaps, which must not reroll
capacity on retry with the same quest seed. Unique/set
retain fixed current authored capacity (`base.sockets`) unless an explicit
reviewed template capacity override is added. No such override is authorized
in this slice. Zero-max bases remain ineligible; no synthetic free gear is
added. New normal drops can actually reach0 on a positive-max base.

Native17 weapon/armor instances require own finite safe-integer
`socketCapacity` in0..maxSockets, with inserted-rune count≤capacity and legal
runeword match. Other item types may omit it or carry0 only. A shared pure
effective-capacity helper is used by inventory detail, insertion, matching,
equipment, preview, comparison and persistence; no live consumer reads
`base.sockets` directly as capacity. New item constructors, quest caches and
summon/salvage/equipment representations preserve the field.

Migration of each valid16 gear instance sets capacity to its **previous
effective capacity**, not a new RNG roll or0. Preserve inserted runes, runeword,
stats and unique ID. Do not expand, remove or reroll legacy sockets. Historical
validation retains literal predecessor rules, so unknown future fields do not
widen older schemas. Legacy fallback is migration-only; native17 missing or
contradictory capacity is rejected rather than silently normalized.

Socket service on an eligible actual unequipped capacity0 item sets normal to
maxSockets and magic/rare/unique/set to min(1,maxSockets); runewords are
ineligible. Fixed unique/set items currently at positive capacity cannot use
this service, correctly preserving their template rule. Store source-specific
available/used state and selected instance ID atomically with the update.
No template mutation, cost or hidden extra charge. A future unique/set fixed0
override needs explicit content review; this slice does not promise one.

Personalization persists `personalizedBy:{characterId:string,name:string}` as
the current character's stable identity and safe display name; validate the
identity/name with the established
character-name boundary, render as text and preserve it through moves/equip/
save. It has no stats. A used charge names the transformed actual instance.

### Replay namespace and anchored chapter-boss scaling

Selected profile is `'normal' | 'nightmare'`; offsets are JSON-authored0/20.
Capture the closed profile in immutable plan/run/recording/reward context.
Selection is only a preference; Claim is the source of Nightmare entitlement.
Independent profile clears/ordinals prevent Normal history collisions. Normal
one-use quest credit requires Normal source authority even when another profile
is selected later. Switching while a run/transaction is active is refused.

Resolve each Normal spawn level L with existing rules, then use L+20 in
Nightmare. Ordinary units pass that level to the existing factory. Exact
chapter HP/attack/defense need anchored growth to keep authored Normal values:

```text
offset(l) = max(0, l-1)
nativeLife(l) = midpoint(def.life) + offset(l)*midpoint(def.lifeGrowth)
nativeAttack(l) = midpoint(def.attack) + offset(l)*midpoint(def.attackGrowth)
  or existing fallback BASE_ATK + offset(l)*GROWTH_ATK when range absent
nativeDefense(l) = (def.defense or existing BASE_DEF) + offset(l)*GROWTH_DEF
replayOverrideStat(L, delta) = round(normalOverrideStat * nativeStat(L+delta)/nativeStat(L))
```

Use unrounded native midpoints/progression for the ratio; no RNG draw or tier
factor is added to it. Reuse/export the factory's actual fallback constants
and progression helper rather than copying divergent values. Require finite
positive denominators/results and refuse an invalid plan before publication.
For delta0 preserve the exact authored override without an extra rounding
change. Apply the existing chapter-boss HP factor **once after** scaling its
authored HP; do not multiply the ratio by a difficulty or tier factor. Baal's
Normal L82 stays7200/520/560 before the existing HP factor; Nightmare L102
uses those anchors times the respective native102/native82 ratio.

Preserve skills, tier, resistances, magicResist override semantics and loot
table. Native level-derived magicResist continues its existing factory behavior
when no exact override exists; no new difficulty resistance bonus is added.
Thread `'nightmare'` into existing kill-currency calculation for its documented
1.2 boss/chapter wishstone multiplier, not into unrelated multipliers.

### Save integration and ownership

Producer owns save17 types, snapshot, frozen16 validator/migration and native17
cross-store graph. Root supplies item/service/replay runtime fields and their
closed validators for that integration; UI consumes the same public readiness
and action results. Do not create competing version17 migrations or separate
silently permissive normalization. Never infer a claimed title/difficulty,
unused historical service or consumed scroll from a completed quest boolean.

Exact public ledger/profile field names and closed service mappings are in the
[contract](../design/compact-act5-contract.md): `inventory.questServices`,
`map.questTitles`, `map.questDifficulties`, `map.selectedTitle`,
`map.selectedDifficulty`, `map.nightmareClearedSubAreas` and
`map.challengeOrdinals`. Native17 gear requires own `socketCapacity`, though
the transitional TS item interface may keep it optional for frozen legacy
types and fixtures. New profile fields never widen frozen16 validation.

## Alternatives considered

1. Socket by changing `base.sockets`. Rejected: alters every instance and
   historical item, violates selected-item service identity and cannot track
   independent charges safely.
2. Socket any already-socketed item or create special free gear. Rejected:
   changes reward semantics and avoids the missing per-instance acquisition
   model. The authored spec already permits zero-capacity ordinary drops.
3. Add20 to boss level while keeping exact stat overrides unchanged. Rejected:
   mostly changes labels/rewards while bypassing intended boss growth.
4. Copy old Nightmare HP/damage/resistance multipliers or discard Normal boss
   overrides. Rejected: conflicts with level-only GDD or changes authored Normal
   boss identity/budget. Native anchored growth preserves both constraints.
5. Persist a global difficulty flag without bound run/profile clears. Rejected:
   switching/restoring could misattribute quest proof, income and clear history.

## Consequences

Services become real persisted selected-instance transformations; new ordinary
gear can have fewer sockets than its reviewed maximum. Legacy capacity remains
stable, and fixed unique/set capacity is respected. New seeded capacity is an
intentional item property change and needs deterministic tests, including
unchanged capacity across failed-claim allocator gaps. The private roll does
not consume parent RNG or perturb subsequent ordinary loot outcomes.

Nightmare has real level-derived boss growth and useful ordinary income while
keeping Normal tuning. Higher monster levels may exceed the hero90 cap; P15
must measure balance rather than assume certification. The initial profile
does not specify a new dungeon, modifiers or achievements and does not accept
full P18. Additional native save fields require coordinated migration and
transaction coverage, not just UI flags.

## Compliance

Validate the74-base maximum table against JSON; test new normal/magic/rare
capacity bounds and a seeded eligible0-capacity acquisition. Verify separate
Larzuk/side/Halbu charges, armor-only restriction, no duplicate consumption,
same ID/stats, actual display/insertion/matcher/equip/save and failure rollback.
Search live capacity consumers for direct `base.sockets` drift; whitelist only
frozen migration/fixed-template generation.

Test Normal exact override equality, Nightmare native-level ratios, HP factor
once, no phantom resistance/TC multiplier, immutable profile reward context,
40→48 Act V boss wishstones, independent clears and no quest repayment. Reject
malformed/unknown native17 fields before hydration; validate actual16 migration
without socket loss or synthetic service/title/difficulty/reward grants.
Production browser evidence must use actual controls and label constructed
fixtures accurately. Wider P18 and P15 gates remain separately visible.
