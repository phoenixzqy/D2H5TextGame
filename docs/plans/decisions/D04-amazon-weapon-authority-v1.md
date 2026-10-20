# D04 — Amazon weapon authority and legal starter

Status: root/design/producer accept bounded P08a05a content contract below;
creation, compatibility and canonical-reader children remain pending.
Input:471c546. Date:2026-10-20. C0–C4/G0–G7 remain unaccepted.

The [read-only investigation](../evidence/stale-weapon-authority-investigation.md)
found inventory slot maps and legacy player equipment disagree. Real Magic
Arrow requires bow/crossbow; its factory starter is legacy-only and references
the generic level10 bow. Switching readers alone would remove fresh Amazon's
only apparent bow. No existing level1 bow/crossbow or javelin base exists.

## Content prerequisite P08a05a

Root adopts the following bounded design defaults, independently endorsed by
producer/design, under the authorized complete-v1 implementation task. They
are explicit implementation decisions, not previously specified numbers or
validated campaign balance. Reuse existing level1 two-handed8–18 benchmark:

- New base `items/base/weapon-bow-training`, name key
  `items.base.weapon-bow-training`; zh-CN训练弓 / en Training Bow.
- weapon/weapon slot/bow/twoHanded, requiredLevel1 (authored `reqLevel`),
  baseDamage min8/max18/breakdown.physical18, sockets0, canHaveAffixestrue.
- No stat requirements, implicit bonuses, granted skills or class restriction.
- Leave existing bow required10/damage10–24 and crossbow required15/damage16–34
  unchanged. No item schema/type/loot-code/icon changes are needed.
- Append exactly one row to actual `loot/trash-act1.entries`: typeitem,
  itemBase training ID, raritynormal, weight100, minLevel1,maxLevel10.
  Preserve every old row/field/relative order and every other table.
  This window is inclusive **monster-level** eligibility, independently of
  the base's equip level. Existing noDrop60% remains unchanged.

Actual acquisition uses loadAwardPools→rollKillRewards with actual trash TC,
seeded PRNG, no forced RNG/TC/noDrop override. Freeze meaningful desired tests
and independently review genuine RED before four source JSON edits. Separate
base-existence assertions must not prevent seeded tests from reaching actual
old loot outcomes. Validate actual bundled content through loadGameData, both
locales and existing bow icon file; use unchanged catalog-integrity tests.

Source arithmetic predicts seed167 at monster levels1/10 acquires a normal,
identified, unequipped training bow with empty affixes, matching itemlevel/ilvl,
persisted attack15. Seed167level11 excludes training and selects amu-brass;
seed6level1 has no item (currency may still exist). These are hypotheses until
executed. Seed167 draw1 .9365939784329385 passes noDrop; draw2 .9879116534721106
selects appended row; draw4 .6778261340223253 rolls15 in8–18. Assert actual
computeStats consumes15. Repeat/A-B-A with item IDs normalized (global sequence
is independent of seeded item stats), and prove real pools/source immutability.

Conditional training shares100/1740 atL1 and100/2550 atL10 imply per-trash-kill
item chances2.30%/1.57% after noDrop. This establishes real availability, not
reliable acquisition/pacing acceptance. New weighted content intentionally
changes seeded item choices; preserve old weights/order rather than asserting
all prior low-level seed outcomes unchanged.

Bounded five source/test files: bases.json,treasure-classes.json,both items
locales,new data/__tests__/amazon-starter-content.test.ts. Docs/evidence are
root-owned. Run focused, actual loader/catalog, related/full,T/L/build and
unchanged80%enginecoverage; independently review source/GREEN and final evidence.
Security check: pass for local authored game content and deterministic loot;
no credentials/network/dependencies/permissions/agent or hook changes.

## Ordered follow-on children (not accepted implementation)

Class-data recipe/schema/type prerequisite, then a shared exactly-once new
character operation for seven classes, before conservative versioned legacy
repair and canonical combat/Skills reader changes. Proposed Amazon creation
recipe uses fixed persisted attack13 (not drop15); others omit equipment.
Canonical stats would rise from unarmed22 to35; no preserved damage/pacing
claim. Freeze full creation/migration contracts and genuine RED per child.
Never grant on setPlayer/hydration/render/route entry; preserve existing player,
canonical weapon/explicit null and all item IDs across inventory/merc containers.
Do not resurrect arbitrary stale gear or remove legacy data by assumption.
No creation/save/browser/weapon-authority completion follows from P08a05a.

Design and producer plan-review: ready with boundaries above. No art generation.
