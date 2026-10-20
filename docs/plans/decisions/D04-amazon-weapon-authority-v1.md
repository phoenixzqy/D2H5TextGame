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

## P08a05b recipe-backed factory prerequisite (plan approved)

Five source/test files: existing class.schema.json and classes/amazon.json,
new data/loaders/classes.ts, existing createMockPlayer.ts and its test.
Author optional starterWeapon:{baseId:trainingID,baseRolls:{attack:13}} only
in Amazon. Schema rejects null/missing fields/unknown properties, requires
item-base ID pattern and nonnegative integer attack. No training ID or13
runtime/schema constant. Omission means empty kit for any class, including
Amazon; other six class files unchanged.

No current class loader/type/index exists. New narrow data loader imports
seven actual class documents and class schema, compiles one strict Ajv2020
validator, validates complete documents and requested class identity, exposes
a readonly recipe/type. Resolve actual item base at this authoring boundary:
exists,weapon,slotweapon,reqLevel1,damage present,attack in inclusive range.
Errors include class-file/field context; malformed data must not become absent
recipe. No central class subsystem or unrelated factory stats/skills refactor.
Data layer must not import feature/stores.

Factory's existing private starter helper consumes this recipe, constructs a
fresh normal identified level1/ilvl1 prepared item and cloned baseRolls per
call, explicitly resolves its base, and reuses actual checkEligibility against
the level/core/derived stats being created. Unknown base must throw because
checkEligibility currently treats unknown as eligible. Preserve other factory
fields and purity; no RNG/store/grant/canonical mutation. Prepared kit remains
in Player.equipment temporarily until next shared creation child transfers it
and publishes an empty legacy array. No canonical/stats/save/authority claim.

Tests start from existing factory/schema APIs, never a missing-module import:
actualfactory returns training13/ilvl1 and passes actual eligibility/computeStats;
mock authored recipe12 proves data consumption; omission yields no kit even
Amazon; all6others unchanged empty. Malformed/null/unknownbase/armor/highlevel/
out-of-range recipe and impossible actual core-stat requirement reject before
returning a player. Schema tests supplement realfactory RED, not replace it.
Fresh item/roll objects and source immutability. Independently review genuine
RED before4source edits; focused/related/full/T/L/build/80%coverage and final
source/QA review. No UI/creation/migration/reader change in B.

Subsequent creation operation must require persistence ready, no save replacement
in progress and no player; nullplayer alone admits overwrite during asynchronous
hydration. Use one synchronous seven-class operation, prepare before mutations,
canonical add/equip, check results and rollback only its snapshots on failure.
Then navigate. Never clear previous inventory/stash to force success.
Later compatibility must recognize both original generic-bow and intermediate
recipe-backed factory signatures without resurrecting arbitrary stale items.

Additional source-risk: compareEquip.ts private isTwoHandedBase still uses
legacy IDs/prefix rather than handedness metadata, so its equipment comparison
may miss training-bow displacement. Canonical equipValidator already uses
metadata. Reproduce and fix in a later bounded comparison child; no claim yet.

Producer independently approved B plan before tests/source edits: existing
factory/schema APIs provide genuine runtime RED; preserve transitional equipped
flags until canonical transfer. No missing-module RED, runtime training/13
constant or creation/save/reader acceptance. Security scope remains local
authored data and pure preparation; no external requests or permissions.

## P08a05c exactly-once canonical creation (revised plan approved)

Read-only design investigation confirms four files: new feature-local
createCharacter.ts, CharacterCreate.tsx, existing CharacterCreate.test.tsx,
new characterCreation.test.tsx for actual deferred persistence integration.
No store/hydration/save grants or reader/migration/comparison edits.

One synchronous action returns a discriminated result. At call time require
hydration status exactly ready, !isReplacingSave(), and player===null. Validate
trimmed name1–16 and supported class. Prepare B factory output before mutation,
with generic kit consumption rather than class-specific grants. Snapshot exact
previous player and inventory backpack/stash/equipped/currencies data slices.
Publish candidate with equipment:[], add normalized unequipped kit to backpack,
then equip via real canonical action and check each result. Recompute even
no-kit candidates from retained canonical equipment. On returned rejection or
exception (including recomputeDerived throwing after equip mutated inventory),
restore snapshots through partial setState, preserving actions/other domains.
Never clear inventory/stash to force success. Only successful action navigates.
Repeated calls/revisit see existing player and cannot grant or replace again.

Guarantee is restored state or complete success at synchronous return. Separate
Zustand stores publish intermediate notifications; no claim of atomic visibility
to every subscriber. Existing deferred autosave observes final synchronous state;
prove it with real autosave fake-timer integration and adapter write capture.

Frozen RED starts via existing real CharacterCreate, with no missing-action import:
readyAmazon singleton canonical13/legacy[]/attack35 and town sees complete state;
all6otherclasses no grant; retained inventory/stash/currencies preserved; repeat/
revisit/existing saved player guarded; idle/loading/error cannot create. Actual
deferred loadSave then saved state wins, actual pending import while statusready
blocks transient creation, imported state then wins. Real equip returned rejection
and post-mutation exception each restore exact refs, avoid navigation and permit
clean retry with one grant. Failed autosave yields no partial player, successful
saves canonical singleton and empty legacy array. Existing tests explicitly
reset inventory and set hydration ready, restore test-owned action substitutions.

No canonical combat/Skills eligibility acceptance follows until later readers;
no browser/campaign/pacing acceptance from RTL. Browser creation/equip/cast/
save/reopen in both locales/viewports follows complete authority chain.
Security check PASS for guarded synchronous local state transition; preserve
save/import state and permissions, no external/dependency/hook changes.

Producer C plan revision: factory IDs still use Date.now and equipItem selects
first matching backpack ID. Before first mutation reject kit-internal duplicate
IDs or any kit ID already in backpack/stash/equipped/mercEquipment/ownedMercs'
legacy equipment. Do not rename/delete retained items or accept equip ok for
the wrong item. Actual screen tests freeze clock and retained conflicting ID
in each container, require unchanged state/no navigation, then clean retry.
No new source file needed. Collision rejection is explicit result, no source
factory ID redesign or save compatibility change in this child.

Producer revised C plan approved after explicit collision contract; root/design
ready. Genuine existing-screen RED and independent reviews precede source.

## P08a05d conservative versioned compatibility (proposed for review)

Adopt investigator's singleton-only contract: v7→v8 repairs only Amazon with
one exact original factory starter or intermediate B factory starter. Original:
id starter-amazon-bow-<decimal Date.now()>, generic weapon-bow base, normal,
level1, identified/equipped true, equipSlot weapon, no other own fields.
Intermediate: same plus training base, ilvl1 and exact baseRolls {attack:13}.
No character-level/base-stat/XP constraint: stale equipment survives progression.
Canonical equipped must lack its own weapon key, and offhand be missing/null.
Explicit null, existing weapon, retained shield, mixed legacy equipment, altered
signatures/extra fields, nonAmazon, or candidate ID in backpack/stash/any hero
slot/mercEquipment/ownedMercs equipment skips repair without deleting anything.
Success keeps instance ID, converts original to training base/ilvl1/attack13,
transfers to canonical weapon and empties the proven singleton legacy array.
All skipped data unchanged apart from version bump. Alreadyv8 never grants.

Stats must use canonical composition, not attack+13. Extract exact existing
playerStore deriveEquippedPlayerStats into pure engine/progression/equipped-stats.ts
and reuse with original level argument and Math.min resource clamp. Extract
existing Map restoration helpers from validate.ts to engine/save/restore.ts;
migration uses restored temporary equipped view solely for aggregation, retaining
original other item data. Types/registry add SaveV8/current8 and migration8 calling
pure engine/save/legacyStarter.ts; stores/migrations.ts remains its reexport shim.
No save-adapter/persistence/hydration grants, broad recompute, or reader changes.

Raw-invalid protection: before migration8 recomposition, decode all older input
through runMigrations(value,7), then validateSave({...v7,version:8}) as a version-only
projection using unchanged structural schema, discarding normalized output.
Only then run migration8, final validate and restore as usual. Current8 follows
ordinary final validation/restoration. This prevents derivedStats recomposition
from erasing malformed/missing original stats and admitting corrupt saves; no
validation dependency imported into registry/helper and no runtime cycle.

Planned source6files: types/save.ts, save/legacyStarter.ts, save/restore.ts,
save/validate.ts, progression/equipped-stats.ts, stores/playerStore.ts.
Tests: existing save.test.ts version assertion, validate.test.ts actual decoder
behavior matrix; new stores/legacy-starter-compatibility.test.tsx exercises real
adapter/persistence replacing only Dexie IO. Existing store progression tests
protect extraction; direct engine composition checks may supplement GREEN.
Before source, freeze meaningful existing-decoder RED and get independent
producer/QA approval. Both signatures canonical13/attack35; progressed retained
gear/resources/progression/combo/quests/currencies/formation/merc preservation;
all skip/collision/near-signature cases; nativeMap and exportedJSON affixes;
immutable original, repeat decode/hydrate/export/import/reimport; already8 no grant;
disk load/adapter import/live import normalize before publication; corrupt/future
and failed writes preserve current state. Actual Skills sanitizer integration
remains later reader child. Run focused, engine, related/full/T/L/build/coverage,
independent source/final evidence review, then exact owned cleanup.
Security check PASS: local versioned untrusted-save validation is strengthened;
no credentials/network/dependencies/hooks/permissions/external publication changes.
No migration/readers/browser/fullauthority/C/G acceptance from plan or unit tests.

Design investigator confirms no material flaw: positive-integer check remains first, only <8 enters target7/prevalidation, current/future never migrate backward. Version-only projection explicitly relies on identical v7/v8 structural shapes and must be revisited at a future shape-changing version. decodeSave is the untrusted boundary; bare runMigrations does not promise validation. restore.ts imports types only.

Producer independent plan-review: ready / APPROVE before D tests/source.
No material gap; proceed actual decoder/adapter RED and independent frozen review.
