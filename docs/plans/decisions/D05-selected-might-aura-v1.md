# D05 / P07b02 — selected player Might aura

Status: GD/TD approve this narrowed contract. Stage A supplies authored schema,
immutable definition and allocation-only rank; selection/save/runtime/native/UI
and production acceptance remain open. Full private-v1/C0–C4/G0–G7 remain open.

## Controlling authored contract

Exact player `skills-paladin-might` / canonical `paladin.might` unlocks at
character level1, cap20, with physicalDamagePct.03 and attackPct.01 per allocated
rank. Preserve both authored effects. This supersedes the legacy fixed50%
Might promise, not unrelated aura tuning. Rank20 is+60% physical increased damage
and+20% Attack. These are distinct modifiers; a basic attack can scale1.2×1.6,
not1.8. Fixed skill bases acquire no new weapon scaling. Existing damage ordering,
rounding, defense, resistance and magic resistance stay authoritative.

`resolveMightDefinition(rows)` selects exactly one authored player identity,
validates with strict Ajv2020 skill schema and copies/freeze only primitives
`{requiredLevel, maxRank, physicalDamagePctPerRank, attackPctPerRank}`. Caller
rows, catalog and registry mutations cannot change the snapshot. Unlock/cap
must be positive integers and both coefficients finite nonnegative; valid
alternate tuning is accepted without an invented balance ceiling. Exact schema
requires aura:true/passive trigger/self/zeroCD and a closed two-coefficient
scaling object. Optional passive is true and summon false; payment, damage,
status/tag/synergy/heal/summon/AoE/equipment-gate metadata is excluded. Distinct
mercenary `aura-might` keeps its own identity and schema behavior.

`resolveMightRank(levels?, definition?)` is allocation-only: maximum finite
positive integer under the two exact aliases, clamped to the copied authored
cap. Missing/invalid/wrong aliases give0, with no rank1 fallback, summation,
combo/marker inference or class/selection eligibility inside this resolver.

## Required selection and persistence prerequisites

One canonical `selectedAuraId` slot belongs to Player, defaulting to none for
old/new characters. None/Might are the initial supported choices. Selection of
Might requires Paladin, finite level at least the copied unlock and positive
allocation. Unsupported/invalid requests refuse without state mutation. Imported
invalid selection grants nothing; detail focus, learning and combo never select
an aura. Respec clears selection. Selection replaces one value, never stacking
all learned auras; switching between multiple implemented auras remains future
acceptance. A version9→10 save migration and validation are required before
persisting this new player field; preserve historical save shapes and resources.

## Required runtime and native integration after Stage A

At each playWave input, freeze eligible selection, source hero ID, rank and both
potencies in a narrow transient player-Might projection. Apply to the source hero
and one fielded living merc, irrespective of grid position; exclude summons,
enemies and unfielded mercs. At every affected calculation, consult current
encounter source state: missing source or life≤0 suppresses immediately, without
revising prior calculations. Stun/freeze does not suppress. Preserve existing
modifiers and authoritative stats, resources and recovery carry; projection
replacement/removal is idempotent and never repeatedly multiplies carry state.
No passive cast/action/payment/cooldown/buff marker or extra RNG is introduced.

Activation begins at simulation0ms before actions. Ordinary selection/upgrade/
respec queues for the next playWave. This deliberately supersedes legacy aura
switching at turn start; reconcile skills-spec§6.2 and both player descriptions
before complete acceptance. Explicit replay recomposes current valid eligibility,
selection and rank over immutable original wave-input resources/carry. Replace
current recording coherently while preserving baseline/history. Completed or
previously clamped replay output never becomes input. Preserve distinct merc
skill behavior; no global aura framework or unrelated tuning belongs here.

## Ordered ownership, evidence and acceptance

Root owns every write/execution inside the claimed umbrella worktree; independent
agents review read-only. Stage A owns exactly skill.schema.json, engine/skills/
might.ts, its test and this decision. Freeze/review schema-only oracles, preserve
genuine behavioral schema RED, separately append/review definition/rank oracles
and preserve missing-module capability failure, then implement minimal source.
Run focused schema/loader, engine/full unit/types/lint/clean production bridge-
build sequentially with bounded runner. Missing validate:data script is not
invented; use actual schema/loader Vitest suites. Preserve all failures,
corrections, source freezes, process identities and exact artifact inventories.

Later stages require separate bounded save migration/validation, store selection,
engine projection/consumption, native and UI/copy increments. Genuine behavioral
RED and structured bug report precede runtime. Freeze both coefficients,
rank1/cap, physical/nonphysical, hero/merc/nonrecipient and source-death/CC cases,
complete unaffected recording, no stacking/refill, actual migrated save roundtrip
and qualified ordinary production en/zh desktop/mobile proof. Definition GREEN
alone does not establish selected aura behavior, balance, earned campaign,
new coverage, full mobile/a11y or private-v1 completion.

Security check: PASS for local authored schema/typed rank prerequisite. Later
save-shape changes retain versioning/validation/migration. No new network,
credentials, permissions, dependencies, CI, remote action or validation bypass.
Root removes exact task-owned disposables only after durable preservation,
independent review and all consumers release; shared caches/source/history stay.

## Save contract preparation and v10 cutover

Use optional `Player.selectedAuraId?: 'paladin.might'`; absence means None.
Clearing selection/respec omits the property, never stores present undefined.
Historical LegacyPlayer omits this field and SaveV9 freezes its player shape
before the current Player gains it. Preparation leaves CURRENT_SAVE_VERSION9
and runtime unchanged; existing decode expectations follow CURRENT_SAVE_VERSION
while explicit v9 inputs and migration8/9 evidence stay fixed.

The following atomic five-path cutover adds Player selection, SaveV10/current10,
version-only migration10, typed migration target9 and untrusted-save validation.
Decode preserves the sequence: migrate earlier saves to7; validate frozen7/8;
migrate to9; validate frozen9 with required finite nonnegative MR; migrate10;
validate current selection. Historical schemas remain open to extensions and
do not impose selector rules. Preserve a canonical historical extension; reject
its malformed value at the current boundary rather than normalize or clear it.

Current optional selection accepts only exact canonical paladin.might. Reject
unknown/alias/empty strings, nonstrings, null and own undefined, including native
IndexedDB inputs. Keep canonical wrong-class/unlearned/underlevel selections in
persistence; eligibility is a later runtime/store concern. Preserve resources,
all other slices, native Maps and source immutability; cover JSON/native round
trips. Existing buildSave already preserves Player, so no adapter edit is needed.
Each increment remains at most five paths and compiles before the next begins.

## Explicit store selection increment

Shared resolveEligibleMightRank checks exact Paladin class, finite character
level at the copied unlock, then existing allocation-only rank. Selection and
source alive checks remain outside. Store selectAura accepts unknown and returns
ok/no-player/unsupported-aura/ineligible. Only null (None) and exact paladin.might
are supported. Refusals publish nothing and preserve identity. Check eligibility
before an already-selected Might no-op. Eligible same selection or absent None
returns ok without publication. Selection changes only its slot; None physically
omits the property, including when clearing an ineligible imported selection.
Successful respec omits the field in its existing one publication; failed respec
retains state. Learning, upgrading, combo edits and hydration never infer a
selection. Allocation upgrades preserve an existing explicit selection.

This store prerequisite does not activate an aura in combat. Native composition
will check the saved canonical slot and shared eligibility at each wave input,
then freeze source/rank/both potencies. Encounter source death is checked during
each affected calculation; current store changes never alter an in-flight wave.
