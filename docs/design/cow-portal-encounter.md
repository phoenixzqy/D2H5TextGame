# Cow rumor: finite portal encounter

Status: root-approved design after independent creative/game/numeric/technical review; implementation has not begun. Owner: producer. Root ratification: current31 packet cow-design-ratification.json. Source observation: 2026-10-30T03:34:40.698599+00:00.

## 1. Overview

Adapt the already-authored Cow rumor into one optional, finite Cow King excursion inside the existing Dark Wood map. The player explicitly recovers Wirt's Leg from a ruined-village object, receives a bound portal Tome from Akara, and transmutes those two actual ingredients using the retained Horadric Cube. Transmutation opens a persistent portal; its button launches a real one-wave Cow encounter through the existing battle system. A qualified victory closes the portal permanently and enables the existing explicit 6000 XP Claim. Defeat or abandonment leaves the portal open for a free retry, with no attempt income. Preserve both existing objective IDs, recipe ID, all 46 quest identities and all 29 areas. No new area, endgame framework, gold economy, potion service, image generation, mandatory campaign gate or difficulty dataset is introduced.

The current Cow row in `src/data/quests/side.json` promises a real Leg/Cube/Tome recipe and a Secret Cow Level, but refers to nonexistent `areas/act1_tristram` and `areas/secret_cow_level`. No usable Cow recipe, physical ingredient definition, enemy archetype or encounter consumer currently fulfills that promise. `areaUnlock` metadata alone does not do so. This proposal replaces the nonexistent-area reward with a functional portal admission effect and changes the live copy to describe the bounded excursion accurately.

| Option | Concrete payoff | Relative cost | Fantasy / scope tradeoff |
| --- | --- | --- | --- |
| A. Portal treasure vignette | Recover Leg, obtain Tome, transmute, enter portal and explicitly retrieve a fixed cache | Smallest | Discovery and transmutation work, but a quest called Cow King provides no cows or combat. Cheapest mechanically, weaker coherent fulfillment. |
| B. One-wave Cow King excursion — recommended | Same physical chain, then one boss and two bovines in an optional battle; victory enables Claim | Small / medium | Preserves the recognizable discovery → recipe → strange place → Cow King payoff using existing encounter/battle machinery. Finite, rather than a farmable Cow Level. |
| C. Repeatable Cow pasture overlay | Repeatable multiwave excursion with reset, admission, reward budget and durable completion/repeat state | Largest | Closer to a repeatable ARPG farming destination, but requires additional repeat/economy/persistence policy and exceeds this bounded repair. |

B is the cheapest option that retains an actual Cow King combat payoff. The local authored Diablo II recipe is the fantasy reference; the accepted compact Cain ruined village, retained Cube recipe graph and finite Countess encounter are implementation precedents. These are repository sources, not newly verified external research.

Root ratifies the finite one-win adaptation, free bound Akara Tome, completion of `obj-open-portal` at real transmutation with separate victory-qualified Claim, and the exact provisional level13 boss+two-bovine encounter below. Focused mechanics/representative-build checks remain required before final batch acceptance. These are concrete bounded design/technical decisions for internal review, not a user-permission hold. Root has indicated this direction is coherent, subject to this exact contract and evidence. No CI or owner earned-playtest prerequisite is imposed here. The user's earned playtest follows implementation.

## 2. Player fantasy

A strange object recovered from the compact ruined village becomes useful much later, after obtaining the Cube. Akara recognizes the rumor and provides the missing ritual ingredient. The player's explicit transmutation opens an unexpected route; entering reveals two bovines and the Cow King, with the regular build/mercenary/summon battle presentation and ordinary loot. Returning to Claim closes a small discovery arc.

This primarily serves GDD §3's loot loop and lightweight text/mobile presentation. It gives existing builds another real encounter without adding movement, range, potions, offline payouts or a competing combat model. A finite side excursion is an intentional reduction of the repeatable Cow farming fantasy; copy must promise a hidden clearing and one Cow King challenge, not an endlessly farmable new area. It is an optional reward discovery after the Cube, not an early Dark Wood difficulty wall or required Act I progression gate.

No existing `docs/design/pillars.md` or anti-pillar document was found. Use the actual GDD §3 pillars and `.github/copilot-instructions.md` invariants; do not imply approval by nonexistent locked pillar documents. No new visual asset is necessary. A text portal affordance and existing battle layout meet the presentation scope.

## 3. Detailed rules

### Identity and authored content

All short source names below expand to these exact values; no prefix matching is permitted.

| Name | Exact identity |
| --- | --- |
| Q | `quests/side-act1-pandemonium-cow-rumor` |
| First objective | `obj-find-leg` |
| Second objective | `obj-open-portal` |
| Recipe | `moo_moo_portal` |
| Leg item / source | `quest/wirts_leg` / `quests/side-act1-pandemonium-cow-rumor#objective:obj-find-leg` |
| Leg recovery object | `objects/wirts_remains` in `areas/act1-dark-wood` |
| Tome item / source | `quest/cow_portal_tome` / `quests/side-act1-pandemonium-cow-rumor#action:receive-portal-tome` |
| Receive action | `actions/act1-receive-cow-tome`, canonical `npc/akara` |
| Open action / receipt | `actions/act1-open-cow-portal` / `quests/side-act1-pandemonium-cow-rumor#action:open-cow-portal` |
| Victory receipt | `quests/side-act1-pandemonium-cow-rumor#action:cow-king-victory` |
| Retained tool | `quest/horadric_cube` from `quests/act2-horadric-staff#objective:obj-cube` |
| Encounter / host | `act1-dw-cow-king` / `areas/act1-dark-wood`, `acts/act1` |
| Wave source | `{kind:'questEncounter', encounterId:'act1-dw-cow-king'}` |
| Cow archetypes | `monsters/act1.cow-king`, `monsters/act1.hell-bovine` |

Keep the original quest/giver/objective/recipe IDs. Correct the first objective to the real Dark Wood area and `objects/wirts_remains`, localized as Wirt's remains at a ruined-village site. Wirt is a physical object/corpse, not a living NPC outside town. The first objective remains fetch; the second remains transmute. Preserve their order. The live reward becomes exactly `{"xp":6000}`; the promised route is delivered by the portal action, not silently deleted. Never edit frozen historical quest JSON to make old content appear implemented.

### Common action authority

Every source-changing action requires a real hero, ready hydration, no save replacement, no active run/combat, valid canonical source definitions, unlocked Act I, Normal difficulty and a canonical tracked Cow row. Use the shared quest transaction and existing wave/restore/recorded-receipt guards, preserving their typed refusal precedence. A detached UI snapshot, rendered button, URL, generic talk/fetch/transmute event, matching item ID from a different source or manually toggled objective flag is insufficient authority.

Ordinary in-progress rows must meet the real preceding-source requirements below. Only structurally predecessor-valid completed legacy rows, including already-claimed rows, may explicitly earn missing Cow source proof; this exception never admits malformed rows. Do not reset a completed/claimed row or clear later flags to replay the journal. Ordinary source operations are idempotent and preserve the claimed marker. Before publication, validate the prospective progress/items/receipts graph and safe destination arithmetic. Unknown, contradictory or malformed present state refuses; it is not repaired by deletion or overwritten as if absent.

### Explicit physical chain

1. **Recover Leg.** In exact current Dark Wood, after its existing full-area clear, use the world-object panel and explicit Recover at `objects/wirts_remains`. Require a tracked Cow row and no existing Leg source. Issue exactly `{itemId:'quest/wirts_leg',state:'owned'}` under the exact Leg source and set only `obj-find-leg=true`, updating normal objective-derived status if appropriate. No XP, loot, Claim, area clear, portal or travel is granted. Retain the component independently of gear slots and capacity. Selecting an area, traveling, rendering the remains, generic kill/talk events and save hydration never recover it. The full-clear prerequisite deliberately reuses the established compact component/delivery recovery convention; this is not a new map clear or count.
2. **Receive Tome.** At actual current Act I town Akara, explicitly choose Receive portal tome. Require the exact owned Leg and its objective proof, no existing Tome source, and no open/victory proof. The actual Cube is not yet required, so the journal can explain what is missing. Publish exactly one owned Tome entry plus its own strictly true receive receipt. This is a bound ritual ingredient, never a purchasable portal service, red/blue potion, gear drop, general scroll stock or gold transaction. Plain Talk opens explanation only. No extra objective is added, no rewards are granted and the Leg is retained.
3. **Transmute / open.** At actual current Act I town Akara, explicitly choose Transmute: Cow portal. Require both exact owned ingredient entries, the true receive receipt, `obj-find-leg=true`, the exact owned Cube and absent open/victory receipts. Consume the two ingredient entries in place, retain the Cube, set `obj-open-portal=true` and publish the exact true open receipt in the same source-scoped transaction. A normal row becomes completed when its two objectives are true; a preserved legacy completed/claimed row stays so. No output gear or fictitious portal inventory token is created. No XP/loot/heal/travel is granted. A visible portal entry and journal instruction now change because the real receipt/consumed-input graph exists.
4. **Enter portal.** From a visible Cow portal button in the Akara Cow panel or the Dark Wood map entry, use guarded explicit travel to the exact host and the regular `/combat?questEncounter=act1-dw-cow-king` route. Availability derives from valid open graph and absent victory proof; it does not depend on rewardClaimed being false, so claimed legacy players can receive the missing experience once. Revalidate actual Normal/current Dark Wood/unlocked Act I/readiness on direct combat start. If travel succeeded but combat admission fails, show a localized refusal; travel itself produces no battle proof or reward. Do not silently run an ordinary Dark Wood challenge for an invalid Cow request.
5. **Win or retry.** Run the one-wave source below. Defeat, draw, abort, unfinished playback or failed settlement leaves the open portal intact and grants no Cow income/proof. A fresh explicit retry uses ordinary battle-start resource preparation; source actions do not heal. An accepted qualified win atomically publishes native combat income and Cow victory receipt, then makes all Cow entry affordances permanently unavailable. Show a localized defeated/return-to-Claim result. See settlement authority below.
6. **Claim.** The journal retains the existing explicit Claim. A first Claim requires both real objective flags, the exact consumed ingredients, retained Cube, all three true action receipts and actual Cow victory proof. All-objectives-complete alone is insufficient. While the portal is open but the King undefeated, display Defeat the Cow King before claiming and an Enter portal route; do not present an unexplained disabled Claim. First Claim grants exactly 6000 hero XP and 4500 XP to the captured actual fielded owned mercenary, if one exists. No extra cache, unique, stat, charge, roster reward, currency, area unlock or heal. Record rewardClaimed once; another Claim grants nothing. An already-claimed legacy row never gets another fixed reward.

The receive/open actions belong to a finite Cow runtime definition/module, with a town-NPC location contract; do not misrepresent the existing Orb/Hellforge area-action loader as supporting them. Add a closed `portalIngredient` item-definition variant with exactly two supported records: Leg has `sourceObjectiveId:'obj-find-leg'`; Tome has `sourceActionId:'actions/act1-receive-cow-tome'`; both bind `consumeActionId:'actions/act1-open-cow-portal'`. Both include exact Q, item ID and localization keys, with mutually exclusive objective/action source fields and no Read/equipment/effect/output fields. A finite source resolver maps the Tome action only to its exact receive receipt. This avoids inventing an assembled output for an action whose output is a portal, and leaves the existing Malah-only `kind:'action'` branch intact. Root may select an equivalent closed representation during technical review, but must preserve these exact source and consumer semantics; broad arbitrary-action/schema widening is outside scope.

### Actual encounter, templates and reward authority

Append one authored optional encounter under existing Dark Wood `questEncounters`: level 13, table `loot/mini-act1`, exactly one boss `monsters/act1.cow-king` and two normal/trash `monsters/act1.hell-bovine`. It is one source wave, not a 30th area or an Act I chapter boss. Spawn order is Cow King index 0, bovine index 0, bovine index 1; each unit has a distinct runtime ID. No min/max count, random elite tier/affix, companion reroll, chapter-boss override, stat override, hero-level scaling or replay-difficulty scaling applies.

Create two JSON archetype rows by copying every numeric/behavior/template field from the existing rows below, changing only `id` and localized `name` key. No new monster skill is needed; do not modify the source templates. Keep copied elite eligibility metadata, but the explicit encounter always constructs bovines as trash and King as boss, so no elite roll occurs.

| Field | Hell Bovine, copied from `monsters/act1.brute` | Cow King, copied from `monsters/act1.treehead-woodfist` |
| --- | --- | --- |
| life / lifeGrowth | `[120,160]` / `[12,16]` | `[620,780]` / `[60,78]` |
| attack / attackGrowth | Both absent: existing factory fallback | Both absent: existing factory fallback |
| skills | `monster-strong-melee`, `monster-charge` | `monster-strong-melee`, `monster-leap-attack`, `monster-enrage` |
| attackSpeed / defense | `75` / `30` | `85` / `90` |
| resistances | cold 25 | cold 50, physical 25 |
| baseExperience / undead | `30` / false | `350` / false |
| canBeElite / canBeBoss | true / false | false / true |
| eliteAffixes | Exact brute list unchanged | Absent |

`loot/mini-act1` is an existing no-gold mini-boss table with rare gear, rune, wishstone and gem entries plus `act1-normal` materials. Reuse its actual native rolls/weights and the ordinary reward planner; do not promise every entry, a special unique or an additional quest cache. The existing Countess `loot/act1-boss` includes gold and is not the selected Cow table. Native kill XP and MF/online multiplier behavior remain the existing battle rules, separate from fixed Claim XP. Copied baseExperience metadata is not asserted to be the native XP formula; current settlement uses `xpForKill(enemy.level)`.

The existing optional planner, combat request, replay binding and Countess settlement are Countess-specific. Add a finite Cow planner/admission/provenance/settlement branch and expand only the explicit supported quest-encounter union/dispatcher. Preserve the existing Countess branch and its exact assertions. The Cow planner must verify the exact authored source, host, level, table, roster/order/counts and reject invalid requests with no ordinary-plan fallback. The host's ordinary five waves, challenge counts, challenge ordinals, area clears, idle unlocks, boss/act gates and other quest-kill objectives must remain untouched. Reuse the regular battle UI, deterministic RNG, event recording, skills, mercs/summons, damage and reward planning. Do not reuse Countess source authority or its one-boss witness for three Cow enemies.

Before simulation capture an immutable run/source binding, original single living nonsummoned hero, all three original nonsummoned enemies with exact archetype/tier/level/member identities, and normal live eligibility. Require distinct IDs across both sides and no owner/summon masquerade. Settlement accepts only that active run's original recorded outcome/events under the existing wave receipt and quest leases. Before any Cow native income is published, require winner player, original hero still present/alive on player side, all three original enemies still uniquely present/dead on enemy side with unchanged exact type/archetype/tier/level, and valid pre-event Cow graph with absent victory proof. Generic matching kills, partial roster kills, missing/replaced/renamed/duplicated bodies, source tampering, draw, hero death, summon substitution, mixed endgame/recovery/other-quest requests, orphan settlement and recorded replay do not grant Cow income/proof. Repeated settlement of an accepted receipt grants nothing. Recorded playback may display results; it cannot start a second payout. A retry is a fresh admitted run while the portal remains open.

Qualified native XP/loot, the Cow victory receipt, terminal result and portal closure form one witnessed transaction. Preflight every reward destination before publication. Source loss, receive/open/item tampering, unsafe arithmetic or a synchronous publication/postcondition failure must roll back only transaction-owned changes and leave the portal retryable, with no partial income or accepted victory. Preserve concurrent unrelated XP, damage/resources, equipment, quest rows/items/receipts and other inventory activity. Reuse established source-scoped publication, XP normalization and compensation patterns; do not copy a broad hero snapshot restore that rewinds independent changes. For XP-bearing settlement/Claim, normalize stale derived caches from actual current XP/level as accepted runtime does; for Recover/Receive/Transmute preserve caches and live resources byte-for-byte. Hold locks through every compensation attempt; an unsuccessful restoration must surface an AggregateError with the original cause, not report a safe retry. This is synchronous transactional integrity, not a claim of crash/observer-wide atomicity.

### Persistence and structural graph

Use existing `questItems` owned/consumed entries and own strictly true `questReceipts`; add no portal counter, cooldown, timestamp, earned-save reconstruction or parallel portal store. For every predicate validate actual own properties, exact shapes and the closed source domain.

- A Leg entry requires its own `obj-find-leg=true`. Owned Leg alone is a valid early stage.
- The receive receipt exists iff its exact Tome entry exists, owned or consumed. Owned Tome requires owned Leg and no open/victory receipt.
- Consumed Leg and consumed Tome occur together and require true receive/open receipts, true two objectives and owned canonical Cube. Open receipt requires this same consumed graph. No ingredient may be individually consumed, reissued or restored after opening.
- Victory receipt requires that full open graph. Portal admission is derived as valid open graph AND absence of own victory receipt. It is closed after victory regardless of unclaimed/claimed journal state.
- Bare objective flags without new sources are permissible only to the extent already admitted by predecessor semantics; they grant no recovery, transmutation, entry, victory or Claim authority. A missing graph can be earned by explicit eligible actions. A present false/malformed/inconsistent source is refused, not treated as missing.
- Source proofs and ingredient history remain after Claim; the Cube stays owned throughout. No Read, equip, transfer, discard, sale or generic crafting consumer can touch these bound entries.

Save/export/import/close-and-Continue must preserve every stable stage: owned Leg; owned Leg/Tome; consumed ingredients/open portal; won/unclaimed; claimed/closed. An interrupted fight does not persist live combat or synthesize victory; the saved open graph allows a fresh retry under existing run-cancellation semantics. New-family source entries are structural persistence authority after validation, not a cryptographic claim that an imported save was earned. Migration never invents them.

Join the one root-owned unpublished successor only after actual accepted31 and literal31 equality. Freeze actual historical31 first; validate it before migration. Widen only the successor's exact Cow definitions/ledger/action graph. The31→successor migration changes the version only unless root's reviewed overall batch contract explicitly needs another semantic change; no grant, inferred ingredient, portal, victory, objective, reward, XP or heal. Literal31/older readers must reject successor Cow source entries and reject future Cow tagged as31/older. Reuse existing databases/save envelopes; no Dexie schema bump or per-card save-version bump. Root owns version numbering, frozen inputs, shared integration and final validation.

Legacy completed/unclaimed: preserve flags/history and earn missing Recover → Receive → Transmute → real victory before first fixed Claim. Legacy already claimed: preserve claimed/XP, allow the same missing real sequence to experience the previously promised portal once, with native combat income from its one qualified fresh win and no second fixed quest XP. Skip already valid source steps; never replay a consumed/open step or a victory. Predecessor-valid bare `areaUnlock`/objective history does not count as a real portal. Generic absent-proof legacy exceptions cannot bypass the retained real Cube requirement. If the Cube is missing, use its existing genuine recovery policy; do not grant it from Cow flags or claim Cube recovery is part of this repair. A source-inconsistent imported graph is rejected. Frozen historical behavior/data stays frozen.

## 4. Formulas

Let L be encounter level, n the number of bovines, W the number of accepted qualified wins, R the existence of exact true open receipt with full consumed graph, V the existence of true victory receipt, H the fixed hero reward and M the fixed mercenary reward.

- Defaults: `L=13`, `n=2`, one boss, one wave; enemy count `1+n=3`. `W` is semantically 0 or 1, represented by V, not a new saved counter.
- Admission: `canEnter = ready ∧ Normal ∧ ActIUnlocked ∧ canonicalTrackedRow ∧ validGraph ∧ R ∧ ¬V ∧ noActiveRun`. Direct start also requires exact current Dark Wood. The guarded UI action may travel there first.
- Recipe: `1 owned Leg + 1 owned Tome + 1 owned Cube → 1 consumed Leg + 1 consumed Tome + 1 owned Cube + true open receipt`. Delta ingredient ownership `(-1,-1,0)`, currency/XP delta `(0,0)`.
- First Claim: `H=6000`; `M=floor(H×0.75)=4500` to captured actual owned fielded mercenary, otherwise `M=0`. Quest multiplier is 1. No redistribution to another merc if the captured recipient changes or disappears; refuse/compensate rather than silently redirect. Subsequent Claim delta is zero.
- Successful native combat XP follows the existing rule `sum(floor(xpForKill(L_i) × activeOnlineMultiplier))` over the exact three slain originals, plus existing skill-mediated native reward handling. Use the actual reward planner for loot, capacity and material/currency caps. No native income is generated or published for an ineligible/unqualified Cow result, regardless of partial kills. Do not add a quest-specific multiplier.
- Factory life: `round((U(lifeMin,lifeMax) + max(0,L−1)×U(growthMin,growthMax))×tierLife)`, with seeded existing rollFloat; trash tierLife 1, boss tierLife 3. At13, bovine life range is264–352; King range4020–5148. Midpoints308 and4584 imply two bovines plus King midpoint total5200. These are stat examples, not measured TTK/balance acceptance.
- Both copied templates omit attack progression: fallback attack is `round((32+5×max(0,L−1))×tierAttack)`. At13: bovine92, King147 (boss1.6). Defense is `round((baseDefense+1.5×max(0,L−1))×tierDefense)`: bovine48, King162 (boss1.5). No second boss multiplier or chapter override. Existing magic defense, resistance clamps, skills, dodge/crit and attack-speed behavior remain factory semantics.
- All persisted counts, XP/material/currency destinations and derived quantities must satisfy the current finite/safe-integer/domain limits before any write. Values outside bounds refuse atomically. Preserve current hero/merc level-cap and XP-normalization rules; do not invent a Cow-specific cap or use stale displayed next-level thresholds as source authority.

## 5. Edge cases

| Condition | Required behavior |
| --- | --- |
| No hero; hydration/restore/quest/wave busy; active run | Existing typed refusal/result, no writes or navigation from a stale button. |
| Quest untracked/locked; wrong act/area/NPC; Nightmare/Hell | Refuse source-changing action. Cow is Normal/manual only. Prior access alone does not replace exact live location. |
| Dark Wood selected but not current, or not fully cleared | Leg unavailable; opening the object panel cannot award it. Ordinary clear must be actual existing evidence. |
| Cube absent despite displayed Cube objective | Explain real Cube needed; no transmute. No synthesized tool or retroactive claim grant. |
| Full ordinary backpack/stash | Bound ingredients are capacity-independent. Native battle loot still uses existing reward planning and cap failure policy; no silent drop/truncate or free proof on failed grant. |
| Two buttons/double-click/reentrant action | Shared lease serializes; one item/open receipt/entry/Claim maximum. Own present source deduplicates. |
| Missing Tome but forged receive receipt, consumed Leg alone, false/unknown/inherited sources | Reject malformed source graph; do not grant replacement, coerce truthiness or erase contradictory history. |
| All journal flags true without real graph | Show missing physical actions/portal requirement; do not enable entry or Claim from flags. |
| Completed row while King undefeated | Keep completed objectives but visible victory-qualified Claim explanation and portal button. No generic auto-Claim. |
| Death after killing King; King dead but bovine alive; draw | No native Cow income, no victory proof; portal remains open. All original bodies must qualify. |
| Abort/reload during fight | No precombat/native payout; saved open graph permits fresh retry. No suspended-combat promise. |
| Save/import after open, win or Claim | Preserve exact stage; no duplicate recovery/open/payout/entry. Native succession import rejects invalid graph before replacing current save. |
| Winning settlement observer throws/mutates source/destination | Compensate owned changes, preserve independent writes; no proof without the complete income transaction. Surface failed compensation explicitly. |
| Fielded merc absent, duplicated, stale, swapped or removed | Capture actual canonical recipient once; no fabricated merc or later recipient lookup. No recipient means zero merc XP; malformed/cross-source data refuses as applicable. |
| Hero/merc levels during fixed or native XP grant | Current accepted progression/derived-stat semantics; no free heal, equipment rewrite or loss of unrelated XP/resources. |
| Legacy claimed row with no physical history | Permit one genuine missing sequence; zero repeated fixed quest XP. Existing valid victory permanently blocks reentry. |
| Invalid encounter JSON/request | Throw/refuse, never fall back to ordinary Dark Wood combat, Countess, endgame, idle or replay source. |
| Save tampering or rollback to a valid older backup | Structural validation is not anti-cheat. No new network/account authority or backup anti-replay framework is introduced. |
| Very strong/high-level hero | Still exact level13, no hero scaling; quick victory is permitted. This optional encounter is not an all-build/endgame challenge claim. |

## 6. Dependencies

Data flow: live quest/finite Cow action and item definitions → closed loader/runtime domain → source-bound admission and prospective save validation → explicit world/town/map actions → regular deterministic quest-encounter battle → accepted native-income/victory transaction → explicit fixed Claim → existing persistence/export/import. Locale switches/rendering consume state only. The accepted retained Cube is read as a prerequisite and never modified.

Concrete integration seams, subject to root ownership and final file allocation:

| Seam | Required finite change / preservation |
| --- | --- |
| `src/data/quests/side.json`; Cow locale entries | Correct physical location/object and bounded fantasy; keep Q/objective/recipe IDs and6000XP, replace nonexistent areaUnlock with real action effect. |
| `src/data/quests/items.json`, item schema/loader; finite Cow runtime/action document/schema | Two closed portal ingredients and exact receive/open action sources; reciprocal consumer validation and localization keys. Existing generic component requires assembled output; existing action kind is Malah-only. Neither already models this portal. Avoid loader cycles. |
| Dark Wood map JSON, monster JSON and both monster locales | Append exact finite encounter; clone numeric templates under Cow identities/name keys. Preserve all ordinary waves, areas and prior archetypes. |
| `src/engine/combat/sub-area-run.ts` | Existing resolver is exact Countess-only. Dispatch to separate exact Cow planner without relaxing Countess validation, then regular battle engine. |
| Quest feature module, common quest transaction/preflight and source publication | Explicit Recover/Receive/Transmute, legacy missing-proof admission and narrow compensation. Do not use generic talk/transmute events as physical authority. |
| Map/Town/quest journal/Inventory UI and locales | Visible actual remains, Tome action, recipe requirements, durable portal/retry/closed state, victory-qualified Claim explanation, owned/consumed bound-item feedback. Avoid generic Akara potion/heal/trade paths and unrelated service-copy repairs. |
| CombatScreen, combatHelpers, run origin/staging/recorded binding and settlement | Finite Cow request; exact all-original witness, native-income/proof transaction, replay/duplicate refusal. Existing Countess-specific authority remains separate. |
| claimReward and save-domain/validate/types/migration/frozen31 seams | Require actual Cow graph/victory before first Claim; preserve once-only reward and legacy claimed marker. Successor-only domain; no inferred proof or frozen-history edits. Root owns shared changes. |
| Existing loot/reward/XP/equipment/progression/merc/persistence systems | Reuse actual planners and normalization, no changes to shared loot weights or engine formulas merely for this side quest. |

The local GDD, creative-director/game-designer guides, brainstorm/design-review, spec-driven/documentation standards, compact D11 contracts and ratified P14 batch policy inform this recommendation. The eight required sections are complete; the document does not claim a formal game-designer/level-designer signoff or implementation green. The numerical templates are inspectable defaults that need focused deterministic combat sanity in implementation; no performance/TTK/all-build acceptance has been measured by this design task.

The ratified sequencing is one unpublished successor from literal accepted31, separate focused reviewed modules and one final broad local cycle. Earlier per-card freeze/version wording in other proposals is superseded. No CI is required. Headed Chromium under WSL is available; browser launch is not a blocker. Constructed browser fixtures validate actual public flows and persistence capability, not earned campaign access,30–50-hour pacing or all-build balance. Protected earned saves were not opened, hashed or replayed.

Exact input provenance follows. Hashes identify the observed source used for this proposal; concurrent root work may later change these files. Paths are relative to the worktree except the explicitly named packet report. Do not freeze these hashes as substitute for root's accepted31 equality.

```text
beb39fa16a088f18ea4a7de4bacc92465c568b81c392973ff535fc02de132d21  .github/copilot-instructions.md
2a5651476d1af24f340f021b550c665ea7d85bf46243d0c4f82fe5c3bbcdbd68  .github/agents/creative-director.agent.md
2f5209cdfa7349f9e9a9b4b0a436725532ea1b8c899ee69ddd73af7c4784cf58  .github/agents/game-designer.agent.md
84b46e014a10f9f69b371d982c8495481b49bcf3babce3aac1c410e8a77d55b4  .github/skills/brainstorm/SKILL.md
1cf501c2c00b2586b088e53e3d10499288ff6a83f565548eddcf0c6024226d4a  .github/skills/design-review/SKILL.md
2b359cc76c8b0ae49f820f8e67ee10d5a7571b6112afe0d17df8a32b772a239a  .github/skills/spec-driven-development/SKILL.md
05c3044c35e7ecc94d84c3bf1f784f29b872b19b28fb21f882654e415e2cd1be  .github/skills/documentation-and-adrs/SKILL.md
5c047bf7e555bf7aea5b626123655bc3e15d3597c4f2c3a9499de4d408094dbe  Diablo2TextGame.md
eb6b4c950781459ad0d414dfb4778cf86240ee3241c71c0faf5da07eb4cfc49f  docs/plans/decisions/D11-act1-remaining-quests-v1.md
34f48fa15ef9ac0d85360baedfd59d8241ef0c65b18f15cece929862d98107fd  docs/plans/decisions/D11-cube-acquisition-v1.md
af1e35dd2c4b77fbcb001ed575eed539e0d0b940fb6fd012c24305de8ec1cb6d  docs/plans/decisions/D11-compact-act3-contract.md
91d4a5c9dec4e11518a09628e7871265cc3abb2967f9e5a3cbc4550a6bd77a3b  docs/design/compact-act5-contract.md
00237d4ea4e7cd5883adb5899f38dffd45484b9ab1d17f37f00ef393b75e26fb  docs/plans/p14-act1-quest-repairs.md
70e17454a1447c2b495717499d84e1f9ba4806712c5ddcd1b675627f56cbb0b0  docs/plans/work-plan.md
363b81d1eb2e7f764f03ddd620a3f2f8c5aee1e86479c4ceba52b8620ba745fc  src/data/quests/side.json
719068cea00d8c5d610b9bf07f86091ebaf0e8d372ded78a1c7f823d226572db  src/data/quests/items.json
1a93f46ecd9c764b95621c546a45d05b388d5c8823f0b079eeb15e1bbe67982e  src/data/quests/actions.json
9ecb33ed898625058b76cfc77ca7fa7944f83fc61ac43f94f90852ffb0ee1129  src/data/loaders/quests.ts
6e763b93564312e71b5f0010a9ce3c4a6dfa2e7bda1e232ac26fe331e6dabf60  src/data/loaders/quest-items.ts
2b6c919f3835ed7960153ab9bd870a33e7c74924df1b10b37e6b2b27b348d46b  src/data/loaders/quest-actions.ts
789bd9b2fead969dae2e573cb8d906c29a2578a776352d3e827ad47091c59e8c  src/data/schema/quest-item.schema.json
350524a21954b6dba3a037cda771b3337c944a94dfae409f11cf19b5e3fa38d6  src/data/schema/sub-area.schema.json
2963739968b72b819b4524790366a5c6497513cc6c385132c49ee280d6c156c4  src/data/maps/sub-areas/act1.json
9ead6582ff05c75e76102b5bd4449f9b48135c362696c95b3a06b25a6c293048  src/data/monsters/act1.json
e7b56d693769846de992e0ec67832d668bf739ab84f996239d548e8753837d71  src/data/loot/treasure-classes.json
d783eba14542e136aebfe0cebfd9c29412bafeef01fa325b71accb123547017b  src/data/dialogue/act1/akara.json
e550a5b76ee9c0e683f6df5fbdc82b319f2e09709a12ef1416162021e6bb3c85  src/engine/combat/monster-factory.ts
0ebf9bed08209b7dcedb02abd8ca385d366df078e6bb2379b113142394b394b5  src/engine/combat/sub-area-run.ts
10144bad033f4a01433a856d44b0046d8696f17cb1c8f8a041a1afdd9e7cffe2  src/engine/map/countess-admission.ts
d43ef5c6c72e2a0035c8e2e7df0dc36fe420d30bca02027701948cd9d14a962e  src/features/quests/countessEncounter.ts
21f738d9df0c32f8bf2f43bfc3b50f29b799faa7747649a78d30b0df6205966a  src/features/quests/questCrafting.ts
6243d0173d62353e9e1b891da652219edcb65eac7a0c7e8b785dc85aec5102be  src/features/quests/questTransaction.ts
1131e94035139d620bc0609e30f1f9a16eab32708f203e072a6c65c41c1f1870  src/features/quests/claimReward.ts
f53b755d7a3ab37839b54213aab930752f6056e786d1323d607bd050a4b20202  src/stores/combatHelpers.ts
22e9b996e0220d8e8b7478a003e2a2f87c988476bcad002fbe3e90003304ae78  src/stores/countessSettlement.ts
fe8f94260c346ea7f3504413e0f33d163c3f51d5aa4acfc133edcd4261c03e48  src/features/map/MapScreen.tsx
97f77886bb922ef13195ba45bb31e7b1384d873d5da4cae366647790d74f761e  src/features/combat/CombatScreen.tsx
97467e70e793febd5423556ab48a6045b5d6af234f4d05271f892d36f0e0d15e  src/stores/mapStore.ts
1154f16bd906606527701fa956c1f2cadb845f5065739a65d0d3f261fae4f673  src/engine/types/save.ts
ec01e546b77b5f21b3cac0956896dcd9a0146bcde59c37122de3702f5aea1abc  src/engine/save/migrate-v31.ts
4031e86d2b0c05923be8899c7a7c0123347233b19e4a8b92e4062061dc729649  src/i18n/locales/zh-CN/quests.json
fb7ca1e29cae9aa962aaf7a534760a1eef7fe88cabd39c11b2ea4405c301f57e  src/i18n/locales/en/quests.json
01838bbe116e991b8c5827f4511bf3cdd75e4b029137ed008d3fb4c5b7f80b95  /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p14-release-efficiency-review.md
```

## 7. Tuning knobs

| Knob | Default / range | Category | Rationale and change rule |
| --- | --- | --- | --- |
| Encounter level |13, allowed1–99 for a later explicitly reviewed balance revision | Curve | Mirrors compact Dark Wood optional-boss convention9+1+3; no automatic per-hero scaling. Exact13 is authority for this contract. |
| Bovine count |2; schema global count cap20 but this source exact2 | Feel/curve | Small visible group preserves cow-encounter identity without a multiwave framework. Changing count requires planner/witness/QA review, not only JSON. |
| Boss count/waves |1/1, fixed here | Gate | One finite King victory; no repeatable wave/farming scope. |
| Monster stat/skill templates | Exact existing brute/treehead rows above | Curve | No new combat skill or independently tuned parallel stat scheme. Adjust only following focused measured concern; keep original monsters untouched. |
| Native loot table | `loot/mini-act1`, fixed here | Economy | Real ordinary loot with existing no-gold entries; no extra fixed cache. Changing table requires reward/economy review. |
| Fixed Claim XP / merc share |6000 /0.75, fixed here | Economy | Preserve authored heroXP and existing75% merc convention. No cost or multiplier. |
| Ingredient amount / charge | One Leg, one Tome; Cube retained; free Tome and retry | Gate | Explicit discoveries, no gold/potion shop or consumable retry economy. |
| Leg clear prerequisite | Actual full Dark Wood clear | Gate | Existing physical-recovery convention and finite object placement; not a new challenge count. |
| Portal lifetime | Open until one qualified win; no timer | Feel/gate | Supports mobile interruption and defeat recovery without additional stored state. |

There is no exposed arbitrary repeat count, cooldown, portal cost, unique reward chance or campaign gate. These defaults are not an invitation to add new tuning settings to the product UI. Any material change goes to producer/design/technical review with the affected exact source contract, not a new user question or a per-card save bump.

## 8. Acceptance criteria

The module must receive focused source/legacy/persistence/transaction review before integration. Begin with causal failing checks for each new behavior and refuse path, then implement; do not rewrite fixtures to match a failing runtime. Reuse accepted fixtures where applicable, without re-auditing or changing earned sources for other families. After focused modules are accepted, root runs one complete final local unit/type/lint/build and consolidated per-card production-browser cycle on released final source. No CI, no owner playtest hold and no claim that a short simulation verifies30–50 real hours.

Functional evidence must show:

1. Exact original Q/objectives/recipe/giver persist; all29maps and46quest identities remain; Cow authored row no longer refers to nonexistent areas. Old frozen contracts remain literal. New Cow monster/template/encounter definitions load with exact counts/tier/order/level/table, no unknown source or loader cycle. Cow request mutation has causal negatives and never starts another encounter on refusal.
2. From tracked Normal Cow state, actual full Dark Wood clear plus explicit remains Recover creates only exact owned Leg/first objective. Selection/render/travel/talk/reload/locale/generic events produce nothing. Wrong source, no clear, untracked, wrong act/profile and stale live state refuse. Capacity-independent bound ownership displays correctly.
3. Actual canonical Akara explicit Receive creates one bound Tome/receive proof, retains Leg, adds no objective/reward. Reentry deduplicates. Actual Cube missing is explained; false tool flags or a different item/source cannot substitute. Plain Talk/trade/potion/heal paths never issue Tome.
4. Real explicit Transmute consumes both exact ingredients, retains real Cube, publishes open proof and second objective, and exposes a functional portal button. No gear/token, rewards, area unlock or heal. Failure before/between/after each participating publication restores exact owned slices and preserves independent writes. Check mutate-then-throw, reentry and compensation failure, including lock lifetime and explicit AggregateError.
5. The public portal route admits the exact one-wave boss-plus-two-cows battle only after a real validated open graph. Original hero, all three enemies, source and run are captured. Ordinary Dark Wood plan/challenge ordinal/clear/idle/act gates do not advance. Mixed/forged requests, fallback/replay/idle/difficulty/roster mutations refuse before payout.
6. Defeat, draw, original-hero death, abort, partial kills, replacement/renamed/missing/summoned bodies and orphan/repeated settlement grant zero native Cow XP/loot and no proof. Open state persists for a real fresh retry. Qualified accepted win grants one native battle income bundle and victory proof together, closes entry and survives export/import/Continue. Fault injection cannot leave free partial income, proof without income or accepted duplicate reward; preserve unrelated resource/equipment/XP/quest changes.
7. Complete objective flags alone do not enable Claim; completed-but-unwon journal visibly routes to portal. After genuine victory explicit first Claim grants6000/4500 to actual captured recipients, with no gold/extra rewards/heal. Test no merc, stale caches, XP boundaries/caps, unsafe destination values, recipient mutation, duplicate Claim and synchronized grant/rollback failures. Already-claimed legacy players never receive another fixed reward.
8. Round-trip each stable physical/portal/victory/Claim state.31 and older reject future Cow source entries under old tags; predecessor-valid31 migration preserves payload except reviewed version change and creates no graph. Legacy completed/unclaimed and claimed absent-proof rows can earn missing real sequence without flag-derived grants; valid steps skip and victory blocks all future entry. Imported contradictory/false/inherited/unknown/accessor/unsafe graphs refuse before current-save replacement. Interrupted battle reload allows retry from open graph, not inferred win or payout.
9. Both zh-CN and en have complete item/monster/object/NPC/action/recipe/portal/refusal/Claim copy with no raw keys or leftover promise of a repeatable/new Cow area. Proposed keys include `quests:cow.*`, `quests:items.wirtsLeg.*`, `quests:items.cowPortalTome.*`, and `monsters:cowKing`/`monsters:hellBovine`; select final paths to match existing locale nesting and verify both. No user-facing hardcoded English/Chinese in TS. No generic Akara service repair is needed to make this finite branch correct.
10. Headed production-browser checks use actual public Recover/Receive/Transmute/portal/battle/Claim, Save-close-Continue and import actions in both locales at360×640 and412×915, plus915×412 and1280×800 layout checks. Confirm44px targets, wrapping, keyboard/focus restoration, announced refusal/result, no horizontal overflow, readable battle roster and visible portal-open/victory-required guidance. Include visible defeat→retry→qualified win→Claim and duplicate refusal evidence; direct store mutation is fixture construction, never evidence of earning the missing source action. Observe actual resulting saved sources/export, not only screenshots or mocked handlers.
11. Experiential review: the player can find the remains, understand why the Cube/Tome are needed, see that transmutation opens a real route, encounter recognizably named cows/King, recover from defeat without losing access, and understand when/where to Claim. Verify the small encounter has no obvious deterministic deadlock or impossible skill/resource configuration using focused simulations and a bounded representative build check. This validates coherence and mechanics, not all14build balance, earned five-act access or real30–50-hour pacing. Record those practical limits plainly.

This author performed read-only design investigation only: no repository files edited, application imports, tests, builds, gameplay, protected-save reads, process control, agents, commits or remote actions. Only this requested packet document was created. No disposable task-owned artifacts or processes remain. Root retains this report at the exact path reported with its SHA256 and removes it after producer/review consumers finish; this subagent will not clean the shared packet.

readersReleased: true
