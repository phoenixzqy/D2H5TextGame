# Compact Act V — five main quests and useful rewards

Status: **ratified implementation contract**, 2026-10-23, by the assigned
game-design, narrative and technical contract owner (`/root/design_contracts`).
Implementation, balance certification and QA acceptance are separate. This
document records decisions; it does not claim runtime behavior already exists.

## Summary

Deliver the five existing Act V main quests with actual source-bound actions,
original encounter proof, usable socket/personalization rewards, a readable
resistance scroll, a visible title and useful Nightmare replay. Preserve all
46 quest IDs, 29 areas, act-wide Enter and completed quest **OR** boss-area clear
transitions. Keep every side reward separately accountable.

## Authority and scope

The [GDD](../../Diablo2TextGame.md), especially §7.2 level-only monster
difficulty, is binding. This specializes the proposed compact campaign draft
§§3.6–3.8 and its objective map. It extends the accepted
[Act IV contract](../plans/decisions/D11-compact-act4-contract.md),
[source-bound items](../decisions/ADR-006-source-bound-quest-items.md) and
[objective stages](../decisions/ADR-007-explicit-quest-objective-stages.md).
[ADR-008](../decisions/ADR-008-act5-service-and-replay-state.md) records shared
item/save/replay choices. The [work plan](../plans/work-plan.md) P14 and P18
remain distinct acceptance obligations.

The authorized assumptions are compact geography, existing monster stats,
Normal-only one-use quest credit, separately funded side rewards and a useful
same-map Nightmare consumer. No new area, mandatory Enter gate, ordinary
Normal challenge tuning, gold shop, combat potion or dependency is authorized.
Malah's potion is a bound quest object only.

## Player-facing description and narrative

Break Shenk's siege, release three groups of prisoners, find and thaw Anya,
defeat Nihlathak, face the three Ancients, and survive Baal's original five
minion waves before defeating him. Larzuk sockets a selected owned item;
personalization marks a selected owned item without changing its power. Read
Anya's actual scroll to receive its permanent protection. Claiming Eve makes
the Slayer of Baal title selectable and unlocks Nightmare replay.

Compact copy places Anya and Nihlathak in Crystalline Passage, the Ancients in
Ancients' Way, and the final Baal in Throne of Destruction. Remove promises of
visiting nonexistent Halls of Vaught, Arreat Summit, Worldstone Keep or Chamber
areas. Rite recognizes the hero's passage; its useful award is XP and a skill
point. Remove its stale nonexistent-area unlock, preserve the narrative rite,
and do not replace it with a new map gate.

## Canonical identities and rewards

Keep the following quest and objective IDs exactly. All quest IDs below have
the literal `quests/` prefix. Hero XP is fixed; mercenary XP is
`floor(0.75 * heroXP)` exactly once on Claim.

| Quest suffix | Existing objective IDs, in order | Hero / merc XP | Other one-use Claim reward |
| --- | --- | --- | --- |
| `act5-siege-on-harrogath` | `obj-kill-shenk` | 10000 / 7500 | one `socket_item` charge; `services/socket` remains a discovery unlock |
| `act5-rescue-on-mount-arreat` | `obj-free-15` | 8000 / 6000 | +1 skill point; direct permanent +5 all resistance |
| `act5-prison-of-ice` | `obj-find-anya`, `obj-thaw`, `obj-kill-nihlathak` | 12000 / 9000 | one `personalize_item` charge; actual unread `items/scroll_of_resist`; `services/personalize` discovery |
| `act5-rite-of-passage` | `obj-kill-ancients` | 15000 / 11250 | +1 skill point |
| `act5-eve-of-destruction` | `obj-throne-waves`, `obj-kill-baal` | 40000 / 30000 | strict Baal cache; title `titles/slayer_of_baal`; unlock `difficulty/nightmare` |

Main totals are **85000 hero XP / 63750 mercenary XP / +2 skill points**.
Read/Get/Inspect/Use/cages/services/repair grant zero XP. Prison Claim must
remove its authored direct `stat.all_resist:10`; that exact budget moves to
the consumed scroll, never an additional direct bonus.

Normalize `npc/qual_kehk` references to `npc/qual-kehk` explicitly, and the
descriptive prisoner target to `npc/barbarian-prisoner`. Quest IDs/save history
are unchanged. Canonical areas use existing hyphens:

| Main quest | Actual area | Exact accepted source and original membership |
| --- | --- | --- |
| Siege | `areas/act5-bloody-foothills` | `bossEncounter`, `act5-bf-shenk`: 1 boss `monsters/act5.overseer` + 3 `monsters/act5.death-mauler` |
| Rescue | `areas/act5-frigid-highlands` | actual full-area clear, then the three defined cage actions |
| Prison | `areas/act5-crystalline-passage` | frozen Anya actions, then `bossEncounter`, `act5-cp-nihlathak`: 1 boss `monsters/act5.warped-shaman` + 4 `monsters/act5.frozen-terror` |
| Rite | `areas/act5-ancients-way` | `bossEncounter`, `act5-aw-ancients`: exactly 3 boss `monsters/act5.ancient-barbarian` |
| Eve | `areas/act5-throne-of-destruction` | original authored source waves 1–5, then final `{kind:'chapterBoss', archetypeId:'monsters/act5.baal'}` |

`act5-fh-eldritch` also contains an overseer and cannot satisfy Siege. Generic
ancient barbarians, generic kills, imported true flags and matching archetype
counts cannot satisfy source requirements. Preserve authored areas/levels,
monster archetypes, base/growth stats, skills and ordinary loot.

## Actions, items and source receipts

For the following table, `Q` means the full exact owning quest ID from the
reward table, not a new ID namespace. Receipt sources are `Q#action:<suffix>`.
These are finite typed action variants, not arbitrary target/counter writes.

| Action ID | Owner | Location / target | Receipt suffix and effect |
| --- | --- | --- | --- |
| `actions/act5-release-barbarian-cage-1` | Rescue | Frigid Highlands / `objects/barbarian_cage_1` | `release-cage-1`; unique group 1 contributes 5 |
| `actions/act5-release-barbarian-cage-2` | Rescue | Frigid Highlands / `objects/barbarian_cage_2` | `release-cage-2`; unique group 2 contributes 5 |
| `actions/act5-release-barbarian-cage-3` | Rescue | Frigid Highlands / `objects/barbarian_cage_3` | `release-cage-3`; unique group 3 contributes 5 |
| `actions/act5-inspect-anya` | Prison | Crystalline Passage / `objects/frozen_anya` | `inspect-anya`; completes `obj-find-anya` |
| `actions/act5-receive-malah-potion` | Prison | actual current Act V town / `npc/malah` | `receive-potion`; creates actual bound potion |
| `actions/act5-thaw-anya` | Prison | Crystalline Passage / `objects/frozen_anya` | `thaw-anya`; consumes exact potion, completes `obj-thaw` |
| `actions/act5-read-resistance-scroll` | Prison | actual owned reward item in quest inventory | `read-resistance-scroll`; consumes exact scroll, activates main +10 all resistance |

Rescue requires the full clear before any cage action. The three actions may
occur in any order. `groups/act5-barbarian-prisoners` consists exactly of these
three tokens, each worth five: `min(15, 5 * uniqueAcceptedCages)`. Duplicates add
zero. The prisoner identity is descriptive; do not invent a field Talk NPC.

Inspect Anya does **not** require an area clear. Get requires actual Inspect
proof and current-town Malah. Potion ID is `quest/malahs_potion`, with source
`quests/act5-prison-of-ice#action:receive-potion`; permit one actual owned or
consumed instance per source. Use requires that exact owned source, current
frozen Anya and an eligible tracked quest. Consumption, thaw objective and
receipt commit together. A different item or a flag cannot stand in for it.

Thaw makes Anya eligible for actual Act V town presence. Nihlathak must be a
new qualifying event after the pre-event thaw graph; early kills retain only
ordinary income/clear. Prison Claim creates an unread bound
`items/scroll_of_resist` at
`quests/act5-prison-of-ice#reward:questItem`. Read may occur from quest inventory
without a town requirement, after the exact source Claim. It consumes the
actual item and grants +10 once. No combat use, equip, sale, drop or stash
transfer for either bound item. No reward or item reacquisition from cancel.

Combat receipt sources are exactly:

- Siege `quests/act5-siege-on-harrogath#action:shenk-victory`.
- Prison `quests/act5-prison-of-ice#action:nihlathak-victory`.
- Rite `quests/act5-rite-of-passage#action:ancients-victory`.
- Eve `quests/act5-eve-of-destruction#action:throne-waves-victory` and
  `quests/act5-eve-of-destruction#action:baal-victory`.

## Combat admission and the five-wave sequence

Bind immutable run, source encounter, original unit IDs and original hero
before simulation. Admit only accepted live settlement of the original wave,
all original required enemies dead and original hero alive; take quest
eligibility from pre-event state and recheck under the shared transition lock.
Retain the established original-bound replay authority; retries do not create
fresh receipts. Replacements, summons, lookalikes, stale bindings, generic
events, draw, defeat and hero-dead terminals supply no quest proof.

Ancients membership is `groups/act5-ancients`, with finite authored role metadata
on the existing three original spawn slots: **0 Talic, 1 Korlic, 2 Madawc**.
All three die in the same accepted wave. Their archetype/stats remain identical;
roles establish identity, not new numerical tuning. Kills across runs do not add.

For manual Normal Throne entry with tracked Eve and no durable five-wave
receipt, explicitly select a **quest-source plan projection** before simulation.
It preserves these exact authored manifests and order, including guard waves
6–7, without challenge fitting, rotation, repeated fillers or forced-pack
replacement. All other ordinary Normal challenge plans retain current behavior.
The projection is a planner option selected by the store; the pure planner
receives the option and never reads a Zustand store.

| Wave | Authored source encounter | Original manifest |
| --- | --- | --- |
| 1 | `act5-tod-w1-e1` | 4 elite Baal minions |
| 2 | `act5-tod-w2-e1` | 4 elite Baal minions + 2 frozen terrors |
| 3 | `act5-tod-w3-e1` | 3 elite Baal minions + 2 warped shamans |
| 4 | `act5-tod-w4-e1` | 4 elite Baal minions + 2 death maulers |
| 5 | `act5-tod-w5-e1` | 5 elite Baal minions |
| 6, extra guard | `act5-tod-w6-e1` | 2 elite ancient barbarians + 3 Baal minions |
| 7, extra guard | `act5-tod-w7-e1` | 1 elite overseer + 4 Baal minions |
| final | real `chapterBoss` | original `monsters/act5.baal` |

All manifest names refer to the `monsters/act5.*` archetypes in the source table.
Preserve existing `encountersToSpawns` tier semantics: in these authored elite
waves, companions without an explicit tier flag also inherit elite. The
manifest's named elite members do not authorize downgrading other companions
to trash. Preserve authored encounter
levels 75,75,76,76,77,77,78 and the existing level-scaling rules; the final
chapter-boss level is `75 + 2 + 5 = 82`, independent of hero level. The final
override remains hp7200/atk520/def560, `monster-tentacles`, `loot/act5-boss`,
including the existing chapter-boss HP factor once.

The public entry option is `startSubAreaRun({questSource:'act5-throne'})`;
the producer adds the corresponding explicit pure-planner option
`questSourceProjection:'act5-throne'` and a finite immutable source manifest
to recording/admission. Runtime wave indices and authored `w8` are not proof.
The real final override has no encounter ID: neither `act5-tod-baal` nor
`act5-tod-w8-e1` may be fabricated as its source.

Progress 0→1→2→3→4→5 is ephemeral within one contiguous accepted live run.
Require the next exact original source wave once; duplicates/out-of-order
waves never advance. Stop, loss, draw, abandon, replacing the run and restore
discard incomplete progress. Completing all five atomically publishes the
durable `throne-waves-victory` receipt and `obj-throne-waves`; partial counters
are never durable quest proof. Guards 6–7 do not count. A later new eligible
original Baal event may use the complete durable receipt, even in another run.
Early Baal wins do not backfill; they still pay ordinary income and map clear.

## Strict cache, permanent budget and services

Eve cache profile is exactly `{tableId:'loot/baal-q', ilvl:82, picks:5}`.
Retain seed
`hashSeed(JSON.stringify(['quest-loot-table-v1', player.id, quest.id, tableId, ilvl, picks]))`.
Validate every selected outcome/material and the complete prospective bag
before committing; no rarity downgrade, fallback, skipped pick, independent
kill income or partial claim. Preserve ordinary kill rewards separately.

Ratify “all resistance” as **fire, cold, lightning, poison, arcane, physical**,
hero only. It does not grant thorns or magicResist. Main Rescue +5 plus main
Prison Read +10 gives +15 each. Independent side Anya +10 gives +25 each for
all Act V sources. Existing Tainted Sun +30 fire/cold remains, yielding
**55 fire/cold and 25 lightning/poison/arcane/physical**, before gear/other
bonuses. Retain the combat resistance cap75 and existing penalty boundary;
do not clamp each grant early or raise the cap. This is the accepted budget,
not measured P15 balance certification.

Side Malah's +10 effective Vitality composes after raw allocated/base/level/
equipment stats, costs no points and survives respec. Raw cap500 may produce
effective510. Compose source receipts through one shared pure path used by
equipment preview/compare, attributes/allocation, level-up, battle entry/waves,
restore and respec. Recomposition preserves current Life/Mana except necessary
clamps on a maximum reduction; it must not heal or increment cached stats.

Service charge keys are exactly `Q#reward:service`. Each validated Claim creates one source-specific
available charge; one accepted selected-item transaction marks that source
used. Store source, selected instance ID and use receipt, not an unbounded
counter. Main Siege and side Larzuk are separate socket charges. Main Prison
and side Anya are separate personalization charges. Side Halbu's existing
armor-only socket charge remains additional.

The shared save/store field is `inventory.questServices`, a record of
`{serviceId, state:'available'|'consumed', targetItemId?:string}`. Available
forbids a target ID; consumed requires the actual transformed instance ID,
which remains historical if the item is later salvaged. The closed mappings
are main Siege and side Larzuk→`socket_item`,
`quests/side-act4-halbus-soul`→`socket_armor`, main Prison and side
Anya→`personalize_item`. Earlier identify/imbue/repair promises remain preserved
and do not become fabricated entries in this new finite ledger.

Socket budgets and acquisition are frozen in ADR-008. Eligibility is actual
owned unique-ID unequipped backpack weapon/armor, capacity0, no inserted runes,
no runeword, reviewed base maximum>0. Normal→reviewed maximum;
magic/rare/unique/set→min(1, maximum). Halbu additionally requires armor.
Keep instance ID, base, rarity, level, stats and affixes. Change only instance
capacity plus the selected source's use record, atomically. Selection/handoff
does not destroy gear before transformation. All display/insertion/runeword/
equip/save consumers use shared effective capacity, not the template field.

Personalization uses the same selected actual backpack gear boundaries (socket
capacity need not be zero), no bound quest item or runeword. One charge sets
safe `personalizedBy` character identity with visible text-only item detail.
Same ID/stats. An already personalized instance is ineligible, so duplicate
clicks cannot burn another charge. No executable markup or stat bonus.

## Title and useful Nightmare consumer

Eve Claim grants exactly `titles/slayer_of_baal`. Persist the selected title
separately from the owned title set. Actual selection/clear controls and the
hero nameplate display localized Slayer of Baal / 巴尔终结者 as text. No stats.
Unknown/unowned selection is invalid. The title is a reward only after Claim.

Eve Claim also makes an actual **Normal / Nightmare replay selector** available
outside active combat. Both profiles use the same29 maps; no Hell selection is
promised. Normal has offset0; Nightmare adds **20 monster levels to the resolved
Normal spawn level**, after existing area/wave/elite adjustments exactly once.
Hero cap90 remains; monster level is not clamped to90. No independent HP,
damage, resistance, magicResist, MF or treasure-class-tier multiplier is added.
Chapter override scaling is the level-only anchored formula in ADR-008.

The selector persists, applies to manual/idle entry, records the profile in
run/reward authority, and refuses changes during an active run/transition.
All29 areas use the already-earned Normal act availability and act-wide Enter;
track clears and challenge ordinals separately by profile. Nightmare clears
cannot grant Normal quest proof or reset/replay one-use quests, rewards,
services, cache, title or permanent bonuses. Normal remains selectable.

The exact new map/save fields are `questTitles` and `questDifficulties` (finite
own-true records keyed only by `titles/slayer_of_baal` and
`difficulty/nightmare` respectively), `selectedTitle` (that owned title or
null), `selectedDifficulty` (`normal` or entitled `nightmare`),
`nightmareClearedSubAreas` (unique canonical area IDs), and
`challengeOrdinals:{normal:number, nightmare:number}` (integers in0..360359).
Existing `clearedSubAreas` remains the Normal clear namespace. Capture the
profile at entry; ordinary clears dispatch to its namespace. Selecting Normal
retains Nightmare progress and vice versa. Reset/migration defaults are empty
records, null, Normal, empty Nightmare clears and both ordinals0. Producer owns
the snapshot/validator bridge. New reward records require a claimed Eve with
the full source/sequence/Baal graph, while historical claimed rows can retain
history without synthetic new records. Claim publishes both reward records
atomically with the cache/XP; neither selection control grants ownership.

Useful repeat income is the existing level-aware kill XP, item ilvl/eligibility
and rune-shard path. Thread the selected profile to the existing independent
currency roller: ratify its existing Nightmare **1.2 boss/chapter-boss wishstone
multiplier only**, with floor rounding (Act V40→48). Other independent rune/gem
chances and elite wishstones remain their current values. Existing legal loot
tables remain; strict one-use quest caches retain frozen profiles/seeds.
Demonstrate actual higher-level equipment usable/equippable or salvageable,
and additional wishstones spendable in the existing mercenary summon consumer.
No gold or offline raw reward faucet is introduced.

This useful replay/title is required to finish the five-main reward delivery.
It does **not** accept full P18: a bounded canonical postcampaign dungeon,
modifier/build interactions, achievement/reward loop, two clears, loss/retry,
reload and reward/sink evidence remain named P18 work under D14. Nothing here
silently closes F17/F18, full P14, side quests or P15 balance certification.

## Preserved side obligations

No side row is deleted, folded into a main reward or marked accepted here.

| Existing quest ID | Preserved actual consumer/reward |
| --- | --- |
| `quests/side-act5-larzuks-sockets` | after Siege, eligible gear selection for `obj-bring-item`; one additional `socket_item` charge; no permanent gear handoff before atomic service |
| `quests/side-act5-anyas-gift` | actual thaw-qualified current-town Anya Talk after Prison prerequisite; independent direct +10 all resistance, independent personalize charge, actual `vendors/anya_uniques` finite resource-trade catalog |
| `quests/side-act5-qual-kehk-merc` | actual current-town hire event for `mercs/act5-barbarian-recruit`; prerequisite-eligible roster after Rescue before side Claim avoids unlock→hire→unlock cycle; already-owned recruit needs an explicit real recruiting path, no ownership backfill |
| `quests/side-act5-malahs-elixir` | 5 finite Frost Lichen sources in Ancients' Way, `quest/frost_lichen`, existing `obj-collect`; 9000hero/6750mercXP and +10 effective Vitality |
| `quests/side-act5-nihlathaks-treasure` | actual `quest/nihlathak_relic` cache in Crystalline Passage after qualified Nihlathak, existing `obj-fetch`; 12000hero/9000mercXP plus legal deterministic endgame unique amulet |

Ratify the last placeholder `items/unique_amulet_endgame_q` as an explicit
reward mapping to existing `items/unique/mara-kaleidoscope`, ilvl82, using
the existing closed object `itemDrop:{uniqueId:'items/unique/mara-kaleidoscope',ilvl:82}`
and `rollUniqueItem` with the accepted
`hashSeed(JSON.stringify(['quest-unique-v1', player.id, quest.id, uniqueId, ilvl]))`
seed, no weighted fallback. Existing reqLevel67 and authored stats remain: +5 each core stat,
+25 fire/cold/lightning/poison/arcane, **no physical**. This item is not another
quest permanent-resistance entitlement.

Anya's real catalog and exact finite resource costs remain a named **D10 side
consumer** design/delivery obligation; no catalog exists today and an unlock
flag is insufficient. Do not substitute a gear-for-gold vendor or claim all
Act V / all46 quests done after only the five mains. Side finite object IDs,
catalog costs and historical already-owned recruiting UX are outside this
five-main contract and require their own concrete side implementation contract.

## Save, historical state and atomicity

Freeze actual predecessor **save16** before allocating **save17** with producer
as save-validator owner; do not use the broad draft's stale anticipated15.
Freeze literal historical item/action/quest domains so live definitions cannot
widen v16 validation. Native17 validates the complete finite source graph,
services, per-item capacity/personalization, owned/selected title, profile and
difficulty-scoped clear/ordinal state before normalization. Reject malformed,
unknown, duplicate, unsafe-integer and contradictory source combinations.

Migration preserves claimed/completed history, XP/point balances, inventory
and prior effective sockets. It does not infer group/sequence/potion/Read/
permanent/service-use/title/Nightmare proof from completion booleans. Preserve
Normal historical clears; initialize new Nightmare clears empty. Default
Normal and no selected title. Unknown historical service usage receives no
fresh charge. No historical cache or XP repayment.

Apply ADR-008's lossless `inventory.legacyGearQuarantine` policy when a valid16
item fails new active capacity/base/rune/runeword semantics. Preserve exact
payload and original location in an inspectable excluded container; never
silently delete/reroll it or reject prior-valid16 solely for newly strict gear
semantics. Reject reserved17 fields explicitly on raw historical inputs before
normalization, since frozen historical object validators are permissive about
unknown keys. Quarantine and its finite origin types are producer-owned save17
fields; root supplies active semantic validation.

Historical Prison completed/claimed history may expose Anya's ordinary town
dialogue for continuity, explicitly labeled as legacy presence; this grants no
thaw/source proof, side eligibility, services, scroll or resistance. A supported
explicit repair flow may Inspect→Get actual potion→Use at real frozen Anya to
establish fresh thaw proof without reopening or repaying a claimed main quest.
Never recreate a missing historical scroll when Read/use is unknown. Completed
but unclaimed rows must establish the full real graph before initial Claim.
Any further compensation requires an explicit separate repair policy.

Hold the shared quest/wave ownership lock through prospective validation,
publication and all rollback attempts. Source charge consumption, selected
instance update, item consumption, flags/receipts and whole Claim reward commit
atomically. On failure restore exact task-owned source/instance locations,
attempt all restorations, preserve unrelated observer writes, report rollback
failure, and grant nothing partially. Save/restore cannot observe half a
service or quest transaction; active-run partial sequence is discarded.

This requires an actual shared quest snapshot/restore boundary. Expose
`assertQuestSnapshotAllowed()` and `assertQuestRestoreAllowed()` (or equivalent
shared lease integration), consult them in snapshot/export and restore before
capturing/replacing state, and hold ownership through all rollback attempts.
The existing private reentry-only quest boolean plus recorded-wave guard is
insufficient. Busy autosave defers/retries; it never serializes an intermediate
quest/service graph. Restore reservation also prevents a new quest transaction.

## Implementation handoff, commands and boundaries

Producer owns main definitions/actions/items/source admissions, permanent
composition and save17 graph/validator. Root owns socket acquisition/capacity,
service consumers and Nightmare replay/scaling, coordinating save additions
with producer. UI owner uses store/engine eligibility and actions, with no
React business rules; town/dialogue discovery includes `npc/larzuk`,
`npc/malah`, `npc/qual-kehk`, thaw-qualified `npc/anya`, `npc/cain`, `npc/tyrael`
at actual Act V town identity. Shared Cain/Tyrael greetings are act-scoped.

Source lives in `src/engine/` (pure TS), `src/stores/`, `src/data/` plus
`src/data/schema/`; UI in `src/features/`, locales in `src/i18n/locales/`;
colocated Vitest tests cover transactions and React controls, Playwright
production tests under `tests/` cover actual flow. Keep strict TS, finite unions,
JSON-authored numerical profiles and i18next zh-CN/en leaf parity. Example:

```ts
type ReplayProfileId = 'normal' | 'nightmare';
// Capture once at run entry; reward/admission never consult mutable selection.
interface ReplayRunContext {
  readonly profileId: ReplayProfileId;
  readonly monsterLevelOffset: 0 | 20;
}
```

Implementation checks: `npm run test:engine`, `npm run test:fast`,
`npm run typecheck`, `npm run lint`, `npm run build`; handoff full unit check
`npm test`; production browser cases via `npm run test:e2e -- --project=chromium-desktop`
and the repository's mobile project at360×640, both locales. Use focused tests
while editing; no watch process. Current docs-only change uses structural/data
cross-checks and `git diff --check`, not claims of runtime verification.

Always preserve original-source admissions and all46/29 identities. Ask the
owning producer/TD for scope changes, new dependencies or a different save
predecessor; no extra user approval is inferred for already authorized work.
Never edit the original checkout, forge evidence, disable gates, mutate shared
base templates for a service, add Math.random to engine, or kill Node broadly.

## Acceptance and open work

Required five-main evidence includes all actual controls and claims; negative
lookalike/stale/dead-hero sources; duplicate cages; partial/reordered/replayed
Throne sources; incomplete reload discard and completed proof restore; no
early-kill backfill; actual potion/scroll ownership and consumption; exactly
once six-channel composition across equip/respec/reload; independent service
charges; an earned seeded zero-capacity drop through selection/socket/display/
runeword matcher/save; personalized text; visible selected title; unlocked
Nightmare selection with level-scaled ordinary and chapter bosses, useful
repeat income, independent clears, loss/retry/reload and no quest repayment.
Cover failed/throwing partial publications and reentrancy/restore guards.

Browser evidence must distinguish earned admission from labeled constructed
functional fixtures. Show zh-CN and en at360×640 and desktop, keyboard/focus,
touch targets and screen-reader labels; no raw keys or inert essential controls.
No deterministic test fixture certifies earned campaign balance or all classes.

No unresolved numerical choice blocks the five-main implementation. Broader
P18/D14 dungeon/modifier/achievement acceptance, D10 side vendor budgets,
historical side recruiting policy, full side delivery and P15 tuning remain
explicit work. Reviewers must not equate this ratified design with passing
runtime, earned campaign, accessibility or balance acceptance.
