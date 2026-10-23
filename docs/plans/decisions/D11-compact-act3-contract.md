# D11 / P14 — frozen compact Act III contract

Status: **A3 design contract frozen for implementation; implementation/QA acceptance remains unearned.** Root reports independent GD and ND APPROVE. TD's ordering concern is resolved here by moving A3 provenance and qualified Council/Mephisto admission into foundation steps1–2. QA's completed review was `QA-PLAN INCOMPLETE` pending frozen admission/data choices and an actual matrix. Its exact twelve-case findings are incorporated below and in `D11-compact-act3-qa-cases.json`; no new approval or executed test is implied.

Author `/root/producer`; root owns exact retained artifacts and cleanup through consumers. This document is self-contained for the five ActIII main rows and can be copied into `docs/plans/decisions` without depending on a scratch file. It supersedes the earlier draft's **A3** Orb ownership, provenance/admission, ring profile/seed, Claim payloads and implementation order. The earlier broad draft/map remain preserved planning evidence for the full46-row ledger and later ActsIV/V/side obligations; those later group/sequence/services/P18 decisions do not gate this bounded five-main-row batch.

## 1. Scope and unchanged campaign rules

The target is exactly five complete main rows: Golden Bird, Blade of the Old Religion, Khalim's Will, Lam Esen's Tome, Guardian. This freeze closes zero rows by itself. All46 authored quests (24main+22side), all29 authored base areas (6/6/6/5/6) and every promised reward remain accountable. The13 later-main rows contain28 objectives:21area-bearing+7area-less. A3 side NPC support alone does not close its side row. C2/pacing/F10/fullP14 require their independent evidence.

Preserve **act-wide Enter** and **completed quest OR canonical boss-area clear** act transitions. Object/quest ordering constrains actions and quest credit only. No new Enter gate, monster rebalance, rare essential-item drop, extra subarea or Claim timing dependency. Source foundation metadata alone supplies no quest credit, receipt, item, reward or new save field.

## 2. First foundation slice: provenance only

Root's first implementation slice is bounded to optional copied source metadata:

```ts
type WaveSource =
  | { readonly kind: 'wave'; readonly waveId: string; readonly encounterIds: readonly string[] }
  | { readonly kind: 'bossEncounter'; readonly encounterId: string }
  | { readonly kind: 'chapterBoss'; readonly archetypeId: string };

// Optional WaveSpec.source and optional MonsterSpawn.encounterId.
```

Keep original authored wave/encounter identities through challenge-generated runtime IDs, fitting and elite transforms. Map each authored encounter identity to its spawned members. A synthetic/fallback template carries no authored proof; a chapter override carries canonical chapterBoss provenance and must not fabricate an encounter ID. Unknown, incompatible or mutated source data cannot become authoritative proof. Preserve original recorded-wave bindings/receipt authority and live outcome guards.

This slice deliberately **does not** extend quest credit, persist a proof, create a receipt, add save fields, complete an objective or declare A3 playable. Those require the next admission/item/reward consumers and meaningful integration checks. Existing old event callers without source retain compatible signatures and existing behavior; they cannot qualify the new source-dependent A3 actions. `recordMonsterKills`/`recordBossKill` may accept optional source context; the optional API field itself is not admission.

## 3. Qualified Council and Mephisto admission

### Council → actual Flail recovery

Canonical context: ActIII, `areas/act3-travincal`, source `{kind:'bossEncounter',encounterId:'act3-travincal-council'}`. Require an accepted actual settlement of the original encounter with the living hero and **all original Council members** dead. The authored encounter contains three original `monsters/act3.infector` bosses. Match complete original member identities through the wave binding; a sum of matching archetype kills, a single member, an elite copy, summoned/replacement monster or a similarly named encounter is insufficient. Existing full-wave victory and receipt guards remain mandatory.

Regular proof admission requires Khalim's own tracked eligible in-progress/unclaimed recovery stage at the pre-event boundary. Four component objectives are unordered, so other organs need not already be recovered. Earlier untracked victories are not banked/backfilled. Publish the finite action proof at the qualified settlement using the guarded quest path; metadata alone and imported cleared/objective flags cannot mint it. Proposed source key is `quests/act3-khalims-will#action:council-victory`; exact persisted receipt representation follows the shared closed action schema.

Flail Recover is an explicit action at `objects/high_council_reliquary` in Travincal. Require actual qualified Council proof plus the stated full-area-clear prerequisite; preserve current location/interaction context. It creates one owned `quest/khalims_flail` at `quests/act3-khalims-will#objective:obj-flail` and sets only its eligible objective. Repeats produce nothing. An explicit historical recovery-repair mode may acquire **new actual qualified proof** at the real encounter while preserving an old claimed row, then recover the real item without paying XP again; ordinary import does none of this.

### Post-Orb Mephisto only

Canonical context: ActIII, `areas/act3-durance-of-hate`, source `{kind:'chapterBoss',archetypeId:'monsters/act3.mephisto'}` and the canonical chapter-boss unit at the actual final accepted live settlement. The authored `act3-durance-mephisto` remains a content reference; it is **not** fabricated chapter override encounter provenance.

Require Guardian's own tracked eligible in-progress/unclaimed state and the Guardian-owned Orb action receipt **before** this event. Then set existing `obj-kill-mephisto` and complete Guardian. A pre-Orb or pre-start victory still pays ordinary combat income, clears the area and can unlock ActIV through the preserved OR transition, but grants **no Guardian objective credit**. Starting Guardian or breaking Orb later does not backfill that victory. Require a new qualifying Mephisto victory. Wrong act/area/archetype/source/tier/unit, synthetic/fallback/no-source, draw/defeat/hero-dead/partial outcome, duplicate settlement and unrelated encounter are negative controls.

## 4. Guardian owns the Orb action

Definition identity:

```text
questId: quests/act3-guardian
actionId: actions/act3-break-compelling-orb
receipt source: quests/act3-guardian#action:break-compelling-orb
areaId: areas/act3-travincal
targetId: objects/compelling_orb
input source: quests/act3-khalims-will#objective:obj-transmute
input itemId: items/khalims_will
```

The explicit Break Orb control requires actual current ActIII/correct Travincal object context; Guardian must have been started and still be eligible in-progress/unclaimed; its Orb receipt must be absent; and the exact assembled Will source must contain **owned** real Will. Validate the complete source graph and prospective transaction. A legacy bare objective/completed flag, wrong source holding a lookalike item, missing/consumed Will, wrong act/area/object, unstarted/completed/claimed Guardian, duplicate action, replacing-save state or reentrant call is ineligible.

**Khalim Claim timing is irrelevant.** A valid assembled Will may be spent while Khalim remains completed/unclaimed or after Khalim is claimed. Do not require either state, and do not refund/clone Will when Claim happens later. Consume Will and publish Guardian's Orb receipt together under the shared transaction; no objective-array row is added and no XP/item/reward is paid. A later eligible Mephisto victory uses this receipt. A failure restores actual item state and all participating quest/action slices; no consumed-but-unrecorded or recorded-with-owned-Will split survives a failed transaction.

## 5. Exact five quest flows and Claim payloads

Full quest IDs are `quests/act3-golden-bird`, `quests/act3-blade-of-the-old-religion`, `quests/act3-khalims-will`, `quests/act3-lam-esens-tome`, `quests/act3-guardian`. Keep every existing objective ID. These are all13 objectives in this bounded batch:

| Quest suffix | objectiveId | Exact area / NPC | Action and actual item |
|---|---|---|---|
| golden-bird | obj-find-figurine | areas/act3-spider-forest | Recover objects/jade_figurine_cache → quest/jade_figurine |
| golden-bird | obj-give-cain | ActIII current town / npc/cain | Give Jade → quest/golden_bird |
| golden-bird | obj-give-alkor | ActIII current town / npc/alkor | Give actual GoldenBird; consume it |
| blade-of-the-old-religion | obj-find-gidbinn | areas/act3-flayer-jungle | Recover objects/gidbinn_altar → quest/gidbinn |
| blade-of-the-old-religion | obj-deliver | ActIII current town / npc/ormus | Give actual Gidbinn; consume it |
| khalims-will | obj-heart | areas/act3-flayer-jungle | Recover objects/khalims_heart_chest → quest/khalims_heart |
| khalims-will | obj-brain | areas/act3-great-marsh | Recover objects/khalims_brain_chest → quest/khalims_brain |
| khalims-will | obj-eye | areas/act3-kurast-bazaar | Recover objects/khalims_eye_chest → quest/khalims_eye |
| khalims-will | obj-flail | areas/act3-travincal | Qualified Council + clear; Recover objects/high_council_reliquary → quest/khalims_flail |
| khalims-will | obj-transmute | Explicit assembly control | recipe khalims_will; actual four components + retained Cube → items/khalims_will |
| lam-esens-tome | obj-find-tome | areas/act3-kurast-bazaar | Recover objects/lam_esens_tome_chest → quest/lam_esens_tome |
| lam-esens-tome | obj-deliver | ActIII current town / npc/alkor | Give actual Tome; consume it |
| guardian | obj-kill-mephisto | areas/act3-durance-of-hate | New qualified monsters/act3.mephisto after Guardian Orb receipt |

Every recovered/component/assembled output is keyed by its exact full `<questId>#objective:<objectiveId>` source; Cain's Bird output uses `quests/act3-golden-bird#objective:obj-give-cain`. Potion and Soulstone use their own exact full `<questId>#reward:questItem` source. Retained Cube source is `quests/act2-horadric-staff#objective:obj-cube`, item `quest/horadric_cube`. Each entry remains exactly `{itemId,state:'owned'|'consumed'}`; Give/Assemble/Orb/Read consume the named actual sources, never merely a matching itemId or flag. Source graph validation binds outputs/consumers to those definitions. Orb is the separate Guardian action in §4 and adds no14th objective.

### Golden Bird

After Spider Forest clear, explicit Recover at `objects/jade_figurine_cache` creates source-bound `quest/jade_figurine` for existing `obj-find-figurine`. Explicit Give Cain consumes it and creates `quest/golden_bird`; explicit Give Alkor consumes that output. Keep `obj-give-cain`/`obj-give-alkor` IDs but execute the validated exchange family; plain NPC Talk cannot advance them. Current ActIII town/NPC identity is required.

**Claim payload is XP4000 + actual owned `items/potion_of_life_q` only. Remove legacy `stat.life`; do not award Life directly on Claim.** Read consumes the exact reward-source potion once and establishes+20 maximum Life through the shared permanent composition path, with0XP and no current-Life healing. Repeated Claim/Read, reload/equip/respec/level-up/restore/next-wave do not add a second bonus or refill Life.

### Blade

After Flayer Jungle clear, Recover actual `quest/gidbinn` at `objects/gidbinn_altar`; explicit Give Ormus consumes it. Keep `obj-find-gidbinn`/`obj-deliver`. Claim XP5000 + exactly one legal materialized unique ring using §6, not placeholder `items/unique_ring_random`.

### Khalim

Four unordered actual owned source components: Heart in Flayer Jungle `objects/khalims_heart_chest`; Brain in Great Marsh `objects/khalims_brain_chest`; Eye in Bazaar `objects/khalims_eye_chest`; Flail by §3. Preserve the clear prerequisites and existing objective IDs. Assemble requires all four real owned receipts plus actual retained ActII `quest/horadric_cube`; consume components, retain Cube, create one owned `items/khalims_will` at `#objective:obj-transmute`, mark `obj-transmute`.

Validate an explicit cross-quest tool reference; never clone the Cube or assume one from flags. **Claim payload is XP8000 only. Remove legacy Will `itemDrop`; assembly is the promised Will output.** It cannot create a second Will before or after Orb use. Spending Will never consumes the Cube or any further component.

### Tome

After Kurast Bazaar clear, Recover real `quest/lam_esens_tome` at `objects/lam_esens_tome_chest`; explicit Give Alkor consumes it. Claim XP6000 +5 unspent `statPoints`. Remove/normalize legacy `stat.attribute_points` to the existing point wallet; no automatic core allocation. Same Alkor visit cannot cascade through independent hand-ins.

### Guardian

Start Guardian → explicit Orb action with actual Will → new qualified Mephisto victory → explicit Claim XP18000 + closed Mephisto cache + actual owned `items/soulstone_mephisto`. Soulstone is bound to Guardian reward source and retained for the later real Hellforge consumer; no flag-created item or implicit destruction. Later Hellforge/service implementation does not gate this A3 delivery.

Each Claim keeps existing fielded-mercenary XP `floor(heroXP×0.75)` once. All Recover/Give/Assemble/Orb/Read actions pay0XP. Preserve deterministic preparation, lossless backpack overflow, safe destination aggregation, shared locking and all-store rollback from accepted Claim contracts.

## 6. Frozen ring profile, seeds and Mephisto cache

Closed versioned profile ID: **`quest-rewards/act3-gidbinn-ring-v1`**, fixed ilvl34, exactly these entries in this literal order, each weight1:

| index | exact unique ID | reqLevel |
|---|---|---:|
| 0 | items/unique/nagelring |10|
| 1 | items/unique/manald-heal |15|
| 2 | items/unique/ring-of-the-leech |27|
| 3 | items/unique/stone-of-jordan |29|

The exact order/weights/membership/ilvl are part of profile v1; a future change requires an explicitly versioned profile and compatibility decision. Do not derive ordering from registry iteration, sort localized names or add new future rings to this profile.

Selection uses a new private RNG seeded by the established claim identity/profile convention:

```ts
const poolSeed = hashSeed(JSON.stringify([
  'quest-unique-pool-v1', player.id, quest.id,
  'quest-rewards/act3-gidbinn-ring-v1', 34
]));
const index = createRng(poolSeed).nextInt(0, 3);
const uniqueId = literalProfileEntries[index].uniqueId;

// Preserve the existing exact-unique materialization/source protocol.
const uniqueSeed = hashSeed(JSON.stringify([
  'quest-unique-v1', player.id, quest.id, uniqueId, 34
]));
const item = rollUniqueItem({ uniqueId, ilvl: 34 }, pools, createRng(uniqueSeed));
```

The profile is a closed validated content reference; schema spelling may follow the existing normalized reward union, but no arbitrary inline scripting/pool or extra reward fields. Validate every member's canonical definition/base/eligibility and the whole bag before private preparation. Exactly one choice and exact-unique materialization; no fallback, reroll, silent skip/downgrade or hero-level/MF/clock/live RNG. Retries reproduce identity/properties/quantities under the same inputs; allocator-generated instance IDs may advance after failed preparation, and **must never be rewound**. Reward/source ownership is still the existing once-only quest Claim, not a second pool receipt or combat-loot grant.

Mephisto profile is exactly `{tableId:'loot/mephisto-q',ilvl:47,picks:5}` using existing private seed `['quest-loot-table-v1',player.id,quest.id,tableId,ilvl,picks]`, five independent replacement picks, accepted noDrop/MF/multiplier rules and strict whole-bundle materialization. Keep existing H3 table gold→rune-shard and table rune aggregation; no new gold economy or quantity budget. Preserve ordinary combat's separate income and seeded behavior.

Dedicated Mephisto quest-table correction: forced-unique entry base `items/base/armor-dusk-shroud`→`items/base/armor-breast-plate`, preserving weight60/min38/max60/unique rarity. Dusk's only current candidates req53/55 fail at47. Breastplate candidates Iron Pelt33, Crow Caw36, Goldskin36, Shaftstop38 are eligible. Do not raise ilvl to hide the bad base/candidate graph or change ordinary loot tables. Audit every selected outcome. A selected unique entry yields unique; five cache picks do not promise that a unique entry is always selected.

## 7. Shared transaction, save and UI conditions

Reuse finite definition-backed Recover/exchange/Assemble/Use/Read families, source-bound item entries, explicit action receipts, boolean objective IDs and prospective whole-graph validation. No one-off store branch per organ, arbitrary path effect, unbounded event history, source mint from flags, or automatic Give on opening an NPC. One event uses pre-event prerequisites and cannot bank/cascade future objectives.

Keep one shared quest lock through writes and rollback. Preflight all input/output/proof/state, reward legality, safe XP/point/currency totals and bag/overflow first. Duplicate/reentrant Claim/action/Read pays/consumes nothing. Inject before-write, mutate-then-throw, claimed/receipt publication and restoration failures: restore every participating slice while preserving unrelated state; attempt all restorations and aggregate their failures. No observer-wide/crash atomicity claim.

For this baseline, freeze the **v14 validator before v15 migration** and add empty new receipt/default maps only after v14 validation. A v14 document smuggling future A3 receipts is invalid, not a migration shortcut. If root allocates a different successor because another schema change lands first, update this explicit predecessor/successor contract before implementation. Import infers no items, Council/Orb proof, consumed state, rewards, point/life entitlement or service use from legacy flags. Preserve claimed/completed history and balances. Explicit legacy repair uses real current source/actions/inputs and qualified proof; it never reopens a reward or pays XP again. A claimed historical Guardian needing Soulstone follows an explicit separately defined recovery action; import is never that action. No later service-use uncertainty blocks ordinary fresh A3 main progression.

ActIII town data must include Cain/Hratli/Ormus/Alkor/Asheara/Meshif with exact matching act/town NPC identities and valid `dialogue/act3/<slug>` discovery. Update both index discovery paths. Loader validation rejects unknown references and source/action/tool cycles. UI exposes actual eligible Recover/Give/Assemble/Orb/Read/Claim, prerequisite and input-consumption summaries, bilingual zh-CN/en reward/status copy and accessible controls. Verify360×640,412×915 and1280×800, keyboard/screen reader and reduced motion. None of these services/side NPCs is automatically a side-quest completion.

## 8. Corrected implementation order and twelve QA cases

1. **Source-preservation + closed data foundation:** optional WaveSpec/MonsterSpawn provenance through authored mapping/planner/fitting/transforms; synthetic/fallback no proof. Exact A3 IDs, action/item/receipt schema, cross-quest tool graph and next-save defaults. Metadata-only slice is inert for quest credit.
2. **A3 qualified admission + shared guarded planners:** complete original Council/live settlement proof and post-Orb canonical Mephisto admission; Guardian Orb ownership/preconditions; Recover/exchange/Assemble/Use/Read/reward plan/rollback. These A3 combat prerequisites must exist before later A3 content is advertised as complete.
3. **A3 content/rewards/town discovery:** all five rows, real item graph, fixed ring profile/seeds, Mephisto47/5 dedicated-base correction, actual Soulstone, Life Read, points, all six town docs and both discovery imports.
4. **A3 actual UI/persistence acceptance:** localized accessible actions, earned-event/source negatives, source/legacy/rollback fixtures and full end-to-end five-row evidence; validate exact final head under repository gates.
5. **Later shared consumers:** group/sequence/rescue/count families, A4/A5 items/rewards, service instance consumers/title/P18 and all side-row obligations remain on full ledger. They are not prerequisites for the five A3 main rows.

Use the companion twelve cases A3-01…A3-12 as criteria→production-path fixture mapping; all are planned/unexecuted in this scratch handoff. They include provenance-only limits, complete Council proof, real exchanges/assembly, Guardian Orb states, early boss/no-backfill/OR transition, deterministic legal rewards, Read/point composition, failure rollback, legacy no-mint and actual UI/save/mobile/i18n. Preserve all earlier ActII/source-item/Talk/chapter/Claim/main-RNG regressions.

| Case | Criterion and production-path assertions (planned, not executed) |
|---|---|
| A3-01 — References, discovery and campaign boundary | 1) All46 quest IDs and29 authored areas retained; all21 mapped area references resolve. 2) Six A3 NPC docs have exact act/town/NPC identity and both discovery imports find them. 3) Unknown references, mismatched source/tool/output identities and source/action/tool cycles reject at load. 4) Only five A3 main rows are batch targets; no side/fullP14/F10/C2 acceptance inferred. |
| A3-02 — Provenance preservation is inert until admission | 1) Original authored waveId/encounterIds or bossEncounter identity survive generated runtime IDs, member spawning, fitting and elite transforms. 2) ChapterBoss override preserves canonical archetype source and never fabricates encounterId. 3) Synthetic/fallback/no-source templates cannot supply authored proof. 4) Optional WaveSpec.source/MonsterSpawn.encounterId or optional event source payload alone grants no credit,receipt,item,reward or save field. 5) Wrong/stale/mutated source, unbound recording and rejected settlement change no new A3 quest state. |
| A3-03 — Complete Council proof and actual Flail recovery | 1) Exact ActIII/Travincal source bossEncounter act3-travincal-council; all three original monsters/act3.infector member identities dead in one accepted win with living hero. 2) Partial/duplicate/archetype-name-only/summoned/replaced/wrong-area/wrong-source/hero-dead/draw/stale inputs inert. 3) Khalim tracked eligible before event; no untracked early-victory banking. 4) Flail Recover at exact high_council_reliquary requires qualified Council proof plus full clear; clear flag alone insufficient. 5) Creates one real owned quest/khalims_flail at existing obj-flail source; repeated Recover produces nothing. |
| A3-04 — Actual Golden Bird and Gidbinn exchanges | 1) GoldenBird Recover owns Jade; explicit Give Cain consumes exact Jade source and creates real GoldenBird; explicit Give Alkor consumes that exact output. 2) Opening Cain/Alkor/Ormus never Gives; wrong act/town/NPC/missing/consumed/wrong-source inputs refuse. 3) No crossquest or multiobjective hand-in cascade at shared NPC from one event. 4) GoldenBird Claim only4000heroXP/3000mercXP+owned potion; legacy stat.life removed. 5) Blade actual Gidbinn Recover and Ormus hand-in precede Claim5000heroXP/3750mercXP+one legal unique ring. |
| A3-05 — All component orders, real Cube and XP-only Khalim Claim | 1) Exercise all24 Heart/Brain/Eye/Flail recovery permutations subject to each actual source prerequisite. 2) Require all four actual owned source components and actual owned retained ActII Cube. 3) Missing/consumed/wrong-source input, flag-only component or Cube, bad crossquest tool reference refuse with no changes. 4) Assembly consumes exactly four components, creates one Will at obj-transmute, retains Cube unchanged. 5) Khalim Claim8000heroXP/6000mercXP only; no legacy Will itemDrop; Claim before/after Orb never duplicates Will. |
| A3-06 — Guardian-owned Orb admission and Khalim Claim independence | 1) Guardian must be started eligible inProgress/unclaimed; current ActIII/Travincal exact CompellingOrb object and absent Guardian Orb receipt. 2) Actual owned assembled Will from Khalim obj-transmute source required, irrespective of Khalim completed-unclaimed or claimed state. 3) Consume Will and publish quests/act3-guardian#action:break-compelling-orb together; no new objective row, XP or reward. 4) Unstarted/completed/claimed/wrong-owning quest, wrong act/area/object, missing/consumed/wrong-source Will, duplicate/reentrant and replacing-save states inert. 5) Write failure cannot leave consumed-but-unrecorded or recorded-with-owned-Will state; no Claim timing coupling. |
| A3-07 — New qualified Mephisto after Orb and preserved OR transition | 1) Early Mephisto victory retains ordinary win income/area clear/ActIV OR unlock while Guardian credit remains false. 2) Starting Guardian or breaking Orb later cannot backfill early win. 3) Require new canonical chapterBoss monsters/act3.mephisto at Durance exact unit/live accepted final settlement and Guardian Orb receipt pre-event. 4) No-source/synthetic/fallback/wrong area/archetype/tier/unit/stale/hero-dead/draw/duplicate outcomes give no Guardian credit. 5) Then explicit once-only Claim18000heroXP/13500mercXP+47/5cache+one real bound Soulstone. 6) Act-wide Enter remains available independent of quest/object order. |
| A3-08 — Versioned ring profile and strict deterministic cache | 1) Exact profile quest-rewards/act3-gidbinn-ring-v1 ilvl34 literal ring order Nagelring,ManaldHeal,RingOfTheLeech,StoneOfJordan,eachweight1. 2) Force every four selection indices and every selectable cache entry/eligible unique candidate; exact closed references validated. 3) Pool private quest-unique-pool-v1 seed selects0..3; selected unique uses existing quest-unique-v1 seed; repeats preserve properties/quantities; allocator never rewound. 4) Mephisto exact47/5 existing quest-loot-table-v1 source seed; dedicated unique base breastplate correction only, preserveweight60/min38/max60. 5) No silent skip,downgrade,reroll or future unique autoentry; five picks promise neither five gear nor a guaranteed unique. 6) Existing table gold-entry and rune aggregation target rune-shard; full bag keeps lossless overflow; ordinary kill RNG/income unchanged. |
| A3-09 — Tome points, Life Read and shared composition | 1) Tome real Recover/Alkor hand-in then6000heroXP/4500mercXP+5unspent statPoints; raw core allocation unchanged. 2) Life potion actual Read consumes once,+20maxLife,currentLife unchanged,0hero/mercXP,no healing or duplicate benefit. 3) Claim alone gives no Life entitlement; stale derived cache/imported flag gives none. 4) Equipment,preview,allocation,XP-level-up,respec,restore,battle entry/waves agree without compounding. 5) Fixed claim-only level30 qa-a3-hero fixture totals41000heroXP/30750mercXP,+5points,+20maxLife only afterRead; constructed fixture is functional evidence only. |
| A3-10 — Shared lock, rollback and restoration failure evidence | 1) Inject prewrite and mutate-then-throw failures at each participating inventory,receipt,player,merc,map/claimed publication. 2) Restore all participating slices while preserving unrelated legitimate writes. 3) Nested same and other quest actions refuse throughout commit and restoration. 4) Attempt all restorations even after one fails; aggregate restoration failures explicitly; do not claim unchanged state when restoration failed. 5) Successful duplicate Claim/Read/Recover/Give/Assemble/Orb and settlement actions pay/consume nothing more; prospective wholegraph and safe totals validated before writes. |
| A3-11 — Frozen predecessor, empty migration and real legacy repair | 1) Freeze strict v14 validator before v15 migration; v14 carrying future A3 receipts rejects rather than gaining proof. 2) Migration only empty new defaults; no owned/consumed item,Council/Orb proof,entitlement,XP,point,service use minted from objective/completed/claimed flags. 3) Preserve historical claimed/completed rows and point/XP balances. 4) Historical Khalim repair uses explicit real sources/qualified Council proof/actual components+Cube; assembly/Orb consume real inputs,neverrepay8000XP. 5) Unknown/future/oversize/malformed receipt graphs reject; save roundtrip preserves real owned/consumed state. |
| A3-12 — Five real control flows, persistence and accessible locale UI | 1) Exercise actual Recover/Give/Assemble/Orb/Read/Claim controls for allfive rows and Save->close->Continue exact retained state. 2) Verify zh-CN and en at360x640,412x915,1280x800; keyboard,screenreader,reducedmotion; prerequisite and consumption summaries. 3) Plain NPC opening never consumes/delivers; actual reward/state/disabled reason visible and localized. 4) Preserve existing46 row IDs/statuses and all earlier ActII/sourceitem/Talk/chapter/Claim/mainRNG regressions. 5) Functional/imported fixture success is not earned campaign,fullP14/F10 or C2 pacing proof. |

Fixed claim-only numerical fixture: `player.id='qa-a3-hero'`, level30, five already-completed eligible rows constructed explicitly for functional Claim tests, no incidental level-up; source-bound seeds remain exact. All five Claims total**41000heroXP/30750fielded-mercXP**, with+5unspent statPoints and+20maxLife only after actual potion Read. This fixture does not establish earned objective proof or campaign progression. Test every one of24 component recovery permutations, force all four ring selections and every selectable cache entry/unique candidate, and retain lossless overflow rather than expecting five gear items or a guaranteed unique. Matrix cases include stale-derived-cache refusal, all-store mutate-then-throw, unrelated writes, nested same/other action calls during commit/restoration and attempted-all restoration aggregation.

Implementation and tests/builds must run only in the claimed worktree by its owner. Scratch revision ran **no builds/tests/browser/game/helper/engine imports** and made no repository edits. No new broad review or later-service approval is requested. Review of written criteria does not equal executed acceptance. All original stopped gameplay trials remain terminal and untouched.

## Retention and evidence

Read-only evidence baseline was `d2e3cfaddd2dc8f618a8a5f6b8a75f970dd2caed` in the claimed human worktree; root is implementing subsequent foundation work independently. This author does not claim to have validated that newer implementation. Repository evidence: `src/data/quests/{main,side,items}.json`, `src/data/maps/sub-areas/act3.json`, `src/data/monsters/act3.json`, `src/data/items/uniques.json`, `src/data/loot/treasure-classes.json`, `src/data/loaders/{quests,quest-items,towns}.ts`, `src/data/index.ts`, `src/features/quests/{claimReward,questCrafting,interactObject,questTransaction}.ts`, `src/stores/{mapStore,combatHelpers}.ts`, `src/engine/{rng.ts,types/save.ts,save/validate.ts,map/unlock.ts}` and existing ADR006/D11 source-item/Claim/H3 reward contracts. Root's approved source-firstslice contract is stated fully in §2; no scratch document is required to interpret this A3 specification.

Durable deliverables: this contract, `D11-compact-act3-objective-map.json`, and `D11-compact-act3-qa-cases.json`. Original scratch planning/review artifacts remain root-owned through integration and umbrella-goal consumers; their exact paths and cleanup ownership are recorded in the execution ledger. The author created no disposable paths or processes and released all readers.
