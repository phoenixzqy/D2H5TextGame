# D04 — Amazon weapon authority and legal starter

Status: root/producer/QA accept bounded P08a05a–g implementations and
ordinary production browser authority/persistence proof.
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

## P08a05e canonical combat/Skills readers (proposed for review)

Dependencies A–D accepted throughbfaffcb; inputd1aeaaa. Investigator confirms
two-source-file boundary: stores/combatHelpers.ts and features/skills/SkillsScreen.tsx.
Change existing shared resolveEquippedWeapon to accept readonly canonical
slot record and resolve equipped.weapon directly, ignoring optional per-item
slot/equipped flags. Missing/null/unknown base yields explicit unarmed {},
never undefined or legacy fallback. playerToCombatUnit captures inventory
map once and uses same snapshot for metadata and existing stat composition.
Skills subscribes equipped map and uses same resolver. No registry/eligibility/
inventory/factory/migration/store-grant changes. No new UI/copy/layout.

Recording trap: existing automatic Skills combo sanitizer calls saveComboOrder,
which always replays current wave. Canonical unequip must sanitize persisted
combo without rebuilding current team/events/outcome/cursor. Automatic effect
calls setComboOrder only, including canonical→data ID normalization on mount;
explicit player slot/reorder changes keep existing replay behavior. Default
refresh is still no-op; explicit replay and genuine next wave refresh canonical
metadata via existing adapter. Reequip restores option, not removed combo/ranks.

Frozen RED uses existing playerToCombatUnit/startSubAreaRun/SkillsScreen and
actual authored registered amazon.magic_arrow, not a new helper signature.
Canonical training/crossbow with empty/conflicting legacy enables actual cast,
mana event and positive arcane damage. Sword/null/missing/unknown plus stalebow
produces ordinary hero attacks without arrow. Slot placement wins over absent/
contradictory item flags; other slot/backpack bow does not grant eligibility.
Mounted Skills real add/equip/unequip/sword/shield displacement/re-equip changes
option/combo; capacity/level refusal preserves eligibility/recording. Current
recording frozen including mounted sanitizer, default refresh no-op; explicit
replay and genuinely won/drained next wave pull current gear/casts. Test-owned
defensive gear may stabilize adapter boundary; no synthetic gated skill or
campaign/balance claim. Test teardown aborts owned run/resets relevant stores.

Tests planned: existing SkillsScreen.test.tsx (isolation reset plus dynamicUI),
new stores/weapon-authority.test.tsx (actual adapter/recording + mounted sanitizer),
existing stores/legacy-starter-compatibility.test.tsx (actual migration/disk/import/
hydration with mountedSkills; only DexieIO substituted). Include already-current
canonical bow/empty legacy and sword/null/stale legacy, plus v7 proven repaired
before sanitizer, export/reimport stability. Mount during replacement to catch
cross-store ordering errors; no atomic-Zustand-notification claim.
Independent producer plan review, actual frozen RED/root+producer+QA approval
before source. Focused/source review then related/full/T/L/build/coverage final
review and exact owned cleanup. Comparison metadata remains separate child.
Ordinary browser freshAmazon/equip/configure/cast/save/reopen/en+zh/mobile+desktop
follows integrated reader/comparison chain. No browser/fullauthority/C/G acceptance
from unit tests. Security PASS: local canonical reads and persisted combo cleanup,
no external requests/credentials/dependencies/hooks/permissions changes.

E investigator's integration warning explicitly adopted: automatic sanitizer
must not call replaying saveComboOrder, while explicit player edits retain it.
Use test-owned defensive gear only for deterministic real engine boundary,
with actual registered Magic Arrow and production wave plan; report it as
controlled integration, never ordinary earned/browser/balance acceptance.

Producer independent E plan-review ready / APPROVE before tests/source.
Freeze current recording refs/cursor/outcome through automatic normalization;
explicit edit replay remains required. No material gap or user question.

## P08a05f metadata-aware equipment comparison (proposed for review)

Depends on accepted E8247c81 and cleanup20e88cb. Root owns only
features/inventory/compareEquip.ts and its existing test for behavior/test
changes, plus D04/BUG041/ledger evidence. Existing private ID-only 2H test
misses Training Bow metadata while actual inventory uses engine isTwoHanded.
Smallest root fix: remove private recognizer; import shared engine helper
for both incoming-weapon and incoming-offhand displacement. No engine/store/
content/schema/save/UI copy/layout change. Shared helper retains metadata
precedence and missing-metadata legacy fallback.

Tests first: real canonical add/equip baseline+candidate with stable IDs,
authored training13, short sword8, buckler defense6. Canonical action executes
before prediction assertions so RED proves actual displacement independently.
Sword+shield→training: attack+5, defense−6, net−1, not clear upgrade.
Training→shield: attack−13, defense+6, net−7, not clear upgrade.
Assert prediction every reported stat/resistance triple against actual before/
after derived maxima, slots, returned backpack ownership/flags and input
reference/content preservation. No current-life/mana comparison. Capture and
assert source snapshots before comparison and after actual action. Explicit
one-hand+sword4→sword8 retains shield control; real catalog 2H prefix and generic
bow/crossbow/polearm controls retain legacy behavior. Existing engine tests
already cover missing metadata; avoid modifying cached bases.

Producer plan review then genuine frozen RED/root+producer+QA before source;
focused/T/L, independent source review, related/full/T/L/build/coverage and
independent final evidence review. Keep owned scratch until consumers finish,
then exact cleanup. Ordinary earned browser chain follows separately.
Security check PASS: local pure comparison helper consolidation only, no
external/credential/dependency/permissions/validation bypass changes.

Producer [P08a05f-PLAN-PRODUCER] APPROVE / ready after independent actual
comparison/store/helper inspection. No dependency cycle or material gap.
Root agrees; proceed genuine frozen RED before runtime source.

## P08a05g ordinary production Amazon authority (proposed for review)

Input F5565cf6/cleanup8f54cf0. Root owns one new tests/pwa/amazon-weapon-
authority.spec.ts plus existing production config testMatch entry, D04/BUG041/
evidence/ledger. No runtime/data/locale/save-format changes. Use production
bridge-shaken build and native Playwright/ordinary createCharacter/navTo only;
no hidden state, imports of game modules, storage writes, injected saves or
boosts. Fixed Date2026-10-20T12:00Z only; native combat/timers continue. Export
via UI downloads (delete finally), read-only IndexedDB for persistence oracles.

Stage1 native discovery: fresh Amazon, exact legal training13 canonical item/
legacyempty/backpackempty/rank1/point1; stats life140,mana72,attack35,defense20.
Explicit nine-slot sole arrow config. Hire ordinary authored free Inner Sight
merc. Blood Moor real firstcast: independently derived known first RNG prefix
with sameDate/speed/merc gives base38−defense12=26arcane, FallenA47→21(44.68%),
hero72→67mana. Verify literal cast/hit/target/pool and pause; then Resume/Skip,
actual won/drained wave1, automatic wave2, Pause/Flee before second award.
Observe exported earned loot, select an exact repeatable earned replacement
route before freezing final acceptance (may require fixed repeated firstwave
runs). Discovery is not full acceptance. No conditional candidate/loss fallback.

Stage2 frozen four-case en/zh ×1280×800/360×640 production matrix: exact
creation/config/cast/earned state; ordinary bow Unequip yields canonicalnull,
one backpackcopy, attack22+2*(level−1); mounted Skills removes option/combo
but retains rank/points. Fresh run proves basic hero action without arrow at
a fixed observed action boundary; Flee before reward. Reequip same original
item through picker returns option, keeps removed comboempty; explicit select
again. Fixed earned wrongtype weapon via backpack detail: truthful preview
attack based on exported roll and level, actual attack matches; starter
returned once, option/combo removed without rank loss. Save/read-onlyDB/export/
close/newpage/Continue preserve whole expected state and locale. Reequip original
bow after reopen, explicitly configure, real fresh arrowcast; final Save/reopen
preserves restored canonical item and nine-slot config with no duplicate grant.
Whole payload comparisons use independent expected action deltas; unrelated
random earned loot is observed baseline, not loot distribution certification.

All cases require activated SW, absent __GAME__, no horizontal overflow and
no console warning/error/pageerror,0skips/retries. Capture representative
screenshots and literal opening/earned/save evidence. Producer+QA review plan,
discovery and frozen spec; actual native matrix then independent final review.
T/L and explicit ignored-PWA lint, production build/bridge guard; E/F runtime
full/coverage remains prior integrated source validation. No earned campaign/
Frost/fullskills/C/G/performance acceptance. Exact owned scratch/build/cache
cleanup only after consumers finish. Security PASS: local ordinary controls
and read-only save observation; no external side effects/credential/dependency
changes or policy bypass.

[P08a05g-PLAN-PRODUCER] and [P08a05g-PLAN-QA] APPROVE / ready for
Stage1 discovery. Freeze exact earned route/identity/roll/eligible source and
observed action boundary before final spec review. Attach error observers
and fixedDate before navigation on both reopened pages; final error aggregate
and production/SW/overflow rechecks required. No material gap; root agrees.

Stage1 refinement: freezing Date at00 repeats the loot seed on each new run;
ordinals0–3 all win but yield no replacement. Discovery now retains the
independent initial00 opening, then sets Date-only to explicit00.055 before
one additional ordinal1 ordinary run. This fixed timestamp is an existing
accepted Warmth fixture, not a hidden game-state grant/elapsed-timer advance.
Native timers remain real; exact route/loot awaits discovery. No conditional
branch or probabilistic fallback. Final matrix will freeze this two-timestamp
schedule only if an eligible earned replacement is actually observed.

### G discovery interruption: BUG042 explicit combat exits

Five native discovery passes reproduced oldseed encounters after Date change.
Routed real-store regression proves four explicit exits can silently start a
hidden replacement before deferred route unmount; canonical unequip then Enter
still retains attack35/Arrow. Bounded prerequisite tracked in BUG042, with new
CombatScreen.lifecycle.test.tsx and only CombatScreen.tsx proposed runtime scope.
Explicit exit-intent must precede first state mutation and gate auto-start;
ordinary Skills/Inventory navigation remains frozen, intentional nextarea and
manual/timed idle restart remain permitted. No generic unmount abort.
Producer's scope and independent Date-oracle review refinements adopted.
Frozen exactseed RED5failed/5passed10: four explicit exits and changedDate+gear
nextEnter fail; five preservation controls pass. Manual third-draw oracle
.055fallen0-09f2 is independent of ordinal/count. Test-only earlier wrong nextarea
and unsupported RTL exact options disclosed in BUG042; corrected before freeze.
No G earnedroute/browser acceptance from discovery. Raw G evidence retained
until all consumers finish; prerequisite has its own acceptance and source checks.

Gstage1 producer/QA independent APPROVE/ADEQUATE for exact route freeze after
BUG042accepted3bd6911. Date00firstwin160XP/5items75shards, Date55secondwin180XP/
3newitems83shards: L2XP240,8backpack158shards. Fixed earned eligible replacement
it-87zeo-7/wp2h-two-handed-sword/normalL2ilvl2/attack8; catalogreqL1/sword2H.
Stage2 source adds full ordinary flow and exact wholepayload expected action
deltas from observed earned baseline. Bow37→unequipped24→restored37→sword32;
previewexact37/32/delta−5. Independent .055 firsthero basic24−def12=12physical,
Fallen42→30/71.43%,MP76 after universal recovery; postreopen Arrow
base48*crit2−12=84arcane,Fallen dead,MP76→71. Earlier draft72/67
omitted preaction recovery; corrected completepilot confirms both boundaries
before finalmatrixfreeze. Fullspec review beforepilot; initial literalItem widening
and unnecessary optional fallback were test-only T/L fixes, not runtime edits.
All9visible slots verified at each eligibility state and finalreopen, stored
combo[]/[arrow],rank1/point2 retained. Two actual close/newpage/Continue cycles
with pre-navigation errorwatch/fixedDate; wholepayload export/read-onlyDB/Save/
Saved checks, locale and singleoriginalstarter ownership. Root/QA/producer
must review actualpilot and frozenfinalspec before fourcase matrix. NoG/fullv1
acceptance yet; allGraw/dist/.vite retained for active consumers.


### G complete pilot correction and freeze

Full en/desktop pilot passes1/1 at runtime3bd6911,0skip/retry,
runner39.054/wall40.308s. Test-only corrections before freeze: strict modal
name matched two rendered copies, so target StatSheet header; Character route
has no navigation anchor, so use ordinary character-hud button; sword name
also appears twice, so target candidate-item-header; Chinese comparison row
uses actual 攻击力. No runtime source changed. Earlier pilot failures and
sources remain in raw evidence until all consumers finish.

The draft MP72/basic and67/restored oracles omitted universal recovery.
Independent source: coefficient0.2*Energy15=3MP/s; speed125 firstaction1500ms
settles floor4.5=4MP before acting, input72 reaches L2cap76. Basic spends0
therefore76; rank1 Arrow spends5 therefore71. InitialL1max72 stays67 after
cost5. Exported player mana72 remains unchanged across abort; combat runtime
resources are separate. Producer/QA independently verified this arithmetic.
Corrected fullpilot confirms12physical/42→30/71.43%/MP76 and84arcanecritical/
Fallen dead/MP71, alongside whole expected payload/Save/DB/export and both
actual close/newpage/Continue cycles. No assertion weakened or runtime patch.
Frozen spec fc18930e3c22f857a2d47765003cbf0f5079ad6a97807880fa22563e3ce61d9f;
config37020ea62dd1716d817bd8b72cd41e48b1e10722f8ec76f13de4ff851dcccf24.
Independent frozenpilot review and final4case matrix remain required.


G firstmatrix at screenshot-onlya90b6474 passed2desktop but2mobile timedout
at postreopen restore: tilecenter hits nestedDetails. Actual snapshot shows
sword32details, not picker. Source EquipmentPanel outer slot opens picker;
Details stops propagation. Test now taps exact visible Weapon/武器 label,
both restorecalls receive locale; no runtime/oracle change. New frozen spec
f76896f393b296b793da3c6d869eb24a3de3660fd23a5d6f9d67ea4085bdcc6c.
Full4case rerun and independent final evidence review remain required.


### Final G acceptance

Final frozenf76896f3/spec and37020ea6/config native matrix passed4/4 across
en/zh-CN desktop/mobile,0skip/retry/flaky/errors,69.618s runner/70.948wall.
Root/producer/QA independently accept bounded A–G; BUG041's legal-starter/
canonical-authority defect is resolved. Exact final oracles, commands, hashes,
review verdicts and cleanup are in [G evidence](../evidence/p08a05g-amazon-weapon-authority.md).
This supersedes earlier pending matrix/review statements while preserving attempt
history. No fullskills/Frost/campaign/performance/a11y/C0–C4/G0–G7 acceptance.
