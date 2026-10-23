# D11 — Earned Radament encounter, quest and skill book

Status: accepted scoped design contract. GD-DESIGN-REVIEW and TD-ARCH-REVIEW
APPROVE; independent producer plan review READY for ordered child planning,
security PASS. Concrete child ownership, APIs and codec/migration decisions
remain prerequisites to implementation.
2026-10-23. P14 next family; implementation base `5f417b4`.
This records the next implementation contract while the C1 browser run keeps all
runtime/test/configuration bytes frozen. It accepts no C2 or full-v1 requirement.

## Confirmed source gaps

`src/data/quests/main.json` retains `monsters/radament` and
`areas/act2_sewers_3`. The native 29-map layout places the named encounter in
`areas/act2-far-oasis`, spawning `monsters/act2.greater-mummy` although the
catalog already defines `monsters/act2.radament`. `mapStore` has no ordinary-kill
objective producer. The claim boundary correctly refuses the string-valued
`items/book_of_skill` reward as an unsupported whole bundle; no usable book
exists. These are source-characterized gaps; runtime RED must precede fixes.

The explicit `bossEncounter` planner also omits its authored boss-wave treasure
class, falling back to the area's trash table. Its companion monsters currently
inherit boss tier because their `boss` flag is absent.

## Explicit design choices

Keep the 29-map layout. Relocate the authored kill-Radament beat to the burial
chamber beneath canonical Far Oasis, matching the maps-spec ActII map table
and existing native flavor. Update the conflicting Sewers quest prose and
locale keys. This is a narrative/location reconciliation, not alias handling.
Retain quest ID `quests/act2-radaments-lair`, objective `obj-kill-radament`, and
its `kill` semantics. Use actual catalog archetype `monsters/act2.radament` in
both encounter representations, with the four existing mummy companions marked
explicitly `boss:false`. Record the resulting tier correction in validation.

The quest budget is5000XP and exactly one quest skill point total. Explicit claim
grants5000XP and one unread bound Book of Skill, with zero immediate quest skill
points. Reading the book consumes its sole entitlement and grants exactly one
unspent skill point; the book grants no XP. XP-derived level points are separate.
Move the numeric one-point effect into JSON-authored book data, rather than
leaving an additional immediate `skillPoints:1` reward beside it.

This explicitly resolves the reward timing and single-point interpretation left
open by the progression-curve quest reward/point-budget rows and D11. It preserves the promised
useful book and does not introduce a second quest point. Radament has no authored
quest prerequisites or return-to-Atma objective; add neither. Its completion,
not claim, continues to expose the existing prerequisite-dependent side quests.
Their repair-discount and hire-objective gaps remain separate work.

## Runtime and persistence contract

Capture catalog provenance when building actual monster units. Never infer the
archetype from names or generated unit IDs. The original run/wave/recording,
completed playback, winning result, living original hero and settlement receipt
must all qualify before emitting a kill event from a truly dead built Radament.
Use the active run's canonical act/area and exact planned boss-tier provenance.
Only tracked in-progress unclaimed matching objectives advance, in pre-event
order. Completion grants no automatic reward. Defeat/draw/timeout, abandoned
playback, stale recordings and duplicate settlement produce no credit; tracking
after settlement gives no backfill. A later genuine replay can qualify.

For the explicit non-chapter boss encounter, reuse the sole authored boss wave's
lootTable. Validate ambiguous authored boss-wave tables; retain the existing
fallback when none is authored. Do not add a second treasure-class authority or
change chapter bosses as part of this fix.

Use persisted source-bound quest-item entries plus a consumed receipt. The book
is not fake equippable gear. The representation must support the later quest
component families without speculative new gameplay. Inventory shows unread
quest items and a localized Read action. Equipment backpack/stash pressure cannot
lose or hide a quest book. Bound books cannot be equipped, transferred as gear,
sold, or discarded. A consumed receipt remains durable.

Claim preflights the whole bundle and settles player XP, existing fielded-merc
XP share, book acquisition and rewardClaimed through the shared synchronous
claim/rollback boundary. Read preflights hydration/import readiness, current
hero, battle-ownership guard and unread source-bound entitlement, then settles
one point and consumed receipt with rollback on grant failure. Neither path may
publish success after a failed grant. Refusals remain localized and retryable.
This promises the existing boundary's synchronous rollback, not crash-wide or
observer-wide transaction atomicity.

The shared reentrancy guard covers both claim and Read through restoration.
Nested subscriber calls must neither duplicate points nor have successful grants
erased by rollback. Preflight validates canonical source entitlement, rejects
duplicate/conflicting unread-versus-consumed states, and checks bounded one-point
arithmetic. Snapshot every participating slice, including mercenary XP/growth;
test mutate-then-throw, restoration failure and retry before accepting the boundary.

Validate the new save representation, default it for valid legacy saves, and add
a versioned migration if the codec shape changes. Preserve every unrelated field
and all gear IDs. Never infer an unread book or retroactive point from historical
claimed Radament flags. Unread and consumed states must survive ordinary
save/import/Continue; repeated imports do not multiply an entitlement within a
single loaded state. Whole-save rollback to an older export remains the existing
local-save policy, not a new anti-cheat service.

Atma must have authored ActII presence/dialogue through the existing town loader.
Do not add inert services or invent a repair/gold economy. Later-act sequential
access is unresolved; this slice introduces no new map-access prerequisite.

## Ordered child work and proof

1. Native encounter/mini-boss TC and qualified exact kill objective. Own the
   planner/event provenance boundary and associated ActII encounter/quest data.
   Freeze a concrete at-most-five-source-file child before implementation;
   split the provenance and settlement children if needed.
2. Reusable bound quest-item storage/codec, JSON book definition, complete claim
   and Read transactions. Shared save/transaction contracts have one integrator.
   Freeze the actual codec/migration shape before a separate store/UI child.
3. Atma, Inventory Read and quest copy in zh-CN/en; ordinary production-mobile
   encounter/claim/Read/save proof after reviewed runtime integration.

Each child needs genuine relevant RED before its fix, focused/engine validation,
and the final integrated full/type/lint/build/production-browser gate. Preserve
wrong target/area, nonwin/stale/repeated settlement, pre-event ordering, full
inventory, grant failures, historical claimed saves, duplicate claim/Read, and
unread/consumed import/reload counterexamples. Earned C2 evidence must continue
from genuine campaign state; a constructed fixture proves only its labelled
integration path. No added farming, seed search or hidden stat injection.

### Executable encounter children

Producer approves two sequential source scopes; associated tests are additional.
Child A owns only `src/data/maps/sub-areas/act2.json` and
`src/engine/combat/sub-area-run.ts`: correct both Radament references, explicit
ordinary companions and the sole authored boss-wave TC. Actual Far Oasis
challenge/TC ambiguity regressions must fail first; preserve manual/idle,
undefined fallback, chapter-boss TC, same-seed determinism and input immutability.

Child B owns only `src/engine/combat/types.ts`,
`src/engine/combat/monster-factory.ts`, `src/stores/combatHelpers.ts`,
`src/stores/mapStore.ts` and `src/data/quests/main.json`. Builder-captured readonly
`monsterArchetypeId` is transient. Zip the completed wave's spawns with the exact
deeply frozen `binding.engineInput.enemyTeam`; match a unique final dead unit
with original ID, catalog identity, enemy/monster role and planned boss tier.
Reuse qualified winning settlement, original-hero and exact-once receipt guards.

One `recordMonsterKills({actId, areaId, archetypeIds})` batch per settlement reads
the same pre-event quest snapshot, advances matching boolean kill objectives
only (count absent or one), preserves flags and returns identical state on no-op.
Counted goals remain unsupported. Genuine production-run settlement and factory
provenance RED precede implementation; retain the negative, ordering, replay,
save and no-automatic-reward controls above. Book/codec/claim/Read and town/UI
remain later children. After A/B focused and engine checks, run the shared full
unit/type/lint/build gate once and bounded constructed production-mobile proof.
That integration proof cannot substitute for the separate earned C2 campaign.

Security check: pass for the scoped local deterministic quest/persistence work;
no credential, network, dependency, permission or workflow-bypass request.
Finite bounded inputs, validated catalog IDs and exact-once publication are
implementation constraints. Full C1–C4/G0–G7/private-v1 scope remains unchanged.
