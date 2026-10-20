# Weapon authority — read-only prerequisite investigation

Date: 2026-10-20; investigator design_contracts, source `1f09814`.
Source-confirmed risk; reproduction has not yet been executed. No runtime
change or gameplay acceptance follows from this investigation.

Stats and equipment actions use `inventory.equipped`; `playerToCombatUnit`
(`src/stores/combatHelpers.ts`) and `SkillsScreen` still gate skills from
`player.equipment`. Real add/equip/unequip actions never synchronize that legacy
array. Only the actual Magic Arrow currently has an authored weapon gate
(bow/crossbow). A canonical sword plus stale bow permits it; a canonical bow
plus empty legacy array rejects it. Skills' sanitizer can persistently remove
the combo based on that wrong result.

Switching the two readers alone loses fresh Amazon's starter: its bow exists
only in `createMockPlayer().equipment`. CharacterCreate never materializes it
in Inventory. The generic bow requires level10, crossbow15; lowering the generic
base affects many loot/unique rows. Canonical gear also contributes attack
stats, unlike the currently invisible legacy starter. Exact starter damage,
socket/affix and acquisition policy need a bounded content contract and real
combat measurements before implementation; source alone does not choose them.

Recommended ordered children:

1. Legal level1 starter base/content, localized names and explicit acquisition.
   Existing bow metadata resolves art; no image generation needed. Catalog
   integrity currently requires every base in a loot table; do not silently
   exempt the new base or weaken that check.
2. New-character creation materializes/equips exactly once via canonical
   inventory actions before navigation. Do not grant from setPlayer, hydration,
   renders or repeated `/character/new` visits. Existing-player route access
   needs a preservation guard.
3. Explicit versioned legacy-starter compatibility. Current v7 saves persist
   both arrays/maps independently; v1→v2 derives only old inventory equipment.
   Recognize only exact factory signatures and deduplicate instance IDs across
   backpack/stash/equipped/merc. Preserve canonical weapon or explicit null;
   never resurrect arbitrary stale gear. Proposed missing-weapon-key repair
   and base conversion require a frozen contract, not an inference that every
   absent item was lost. Normalize before Skills sanitizer mounts; repeated
   import/hydration/export must not duplicate.
4. Combat and Skills use the same canonical slot-map snapshot. Resolve
   `equipped.weapon` directly, not an array filtered on optional Item.equipSlot.
   Subscribe Skills to map changes. Unknown/missing weapon stays explicit
   unarmed `{}`; no legacy fallback. Existing current recording remains frozen;
   next wave/replay refreshes equipment through existing adapter machinery.

Meaningful future RED: real Magic Arrow with canonical bow/crossbow versus
conflicting legacy state; canonical sword/null/missing/unknown versus stale bow;
bow with no equipSlot; real replace/unequip/re-equip while Skills remains
mounted; shield displaces two-handed bow and vice versa; failed capacity/level
operations preserve eligibility; current recording versus fresh wave/replay;
save/reload with contradictory legacy data. No synthetic skill restrictions.

Final ordinary browser path: fresh Amazon, visible legal starter, configure and
actually cast Magic Arrow, replace/remove, save/reload, both locales and target
viewports. These prerequisite children must be integrated together before
declaring the authority defect fixed. Keep structured bug/reviewed RED and
independent final QA per agent-contract. No external artifacts/processes were
created by the investigator.
