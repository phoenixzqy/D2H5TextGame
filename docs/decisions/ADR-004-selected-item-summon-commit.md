# ADR-004: Stage selected-item Iron Golem waves before committing inventory

- **Status:** Accepted architecture, 2026-10-21; independent QA/TD approved.
  Source implementation and runtime/browser acceptance remain pending.
- **Date:** 2026-10-21
- **Scope:** [D06 v1d mechanic contract](../plans/decisions/D06-iron-golem-v1.md),
  following accepted D04 resource carry and D06 preparation/identity.

## Context

Iron Golem needs a selected live inventory instance while the combat engine must
remain pure and replayable. Current `CombatSnapshot`/`CombatResult` have no item
input or consumption attestation. `inventoryStore.removeItem` filters backpack
and stash by ID, which cannot implement an exact selected-instance debit.
`ActiveRun` and recordings are transient; SaveCurrent11 contains inventory and
player slices, without combat mana, current-wave state or summon bindings.

`startSubAreaRun` currently advances a challenge ordinal, installs its run and
resets combat rewards before `playWave`. `advanceWaveOrFinish` grants XP/loot and
advances its cursor before the next `playWave`. Adding fallible staging/debit
without defining those boundaries could repeat rewards, lose a paid recording
or treat the old recording as the next wave. Zustand setters notify subscribers
synchronously; a thrown observer does not prove a setter left data unchanged.
Existing quest reward rollback explicitly does not promise observer/crash atomicity.

## Decision

Keep metal eligibility in authored base data, item math in the existing pure
resolver, inventory ownership/debit in stores and combat simulation side-effect
free. Stage the entire wave before item mutation. Retain one transient receipt
that distinguishes uncommitted preparation, verified persistent debit and
publication recovery. Freeze whole Iron recordings for replay. Do not add a
persistent golem, combat-mana save state or general transaction framework.

### Data and pure interfaces

- Add optional `ItemBase.metal?: boolean` with JSON Schema boolean validation.
  Only weapon/armor bases may have `metal: true`; omission/false denies Iron
  eligibility. Author exactly the31 IDs in D06 v1d, with all other bases denied.
  This field describes base definitions, not Item instances or SaveCurrent.
- A pure item projection helper accepts a current Item plus existing definition
  pools and returns a discriminated eligible projection or a stable refusal
  code. Validate the supported rarity/base/definition identities and contributing
  rolls. Legacy map affixes carry their own resolved values; validate that form
  without requiring an unrelated modern rolled-affix identity. Modern rolled
  affixes must resolve to known definitions. Do not reroll or replace missing
  definitions with a fabricated zero. Use `aggregateEquipmentMods` on that item
  alone with `sets: []`, extracting only scalar life/attack/defense. Reuse its
  deterministic definition-roll fallback. Refuse installed runes/runewords and
  malformed/nonfinite/negative inherited output before payment.
- Stores separately resolve the selection against one exact live backpack index
  and reject ID duplicates in every backpack/stash/equipped/merc gear location.
  The caller supplies hero/item IDs, never trusted Item/stat objects.
- Add an optional immutable Iron input to `CombatSnapshot`, carrying exact
  `sourceHeroId`, `sourceItemId` and three finite nonnegative scalar bonuses.
  The engine validates its owner/identity and canonical source before applying
  it once after Iron rank scaling. No store, inventory callback or RNG enters
  this interface. Canonical Iron has no free/no-input rank1/template fallback.
- `CombatResult` adds an optional explicit successful Iron preparation attestation
  with owner ID, source item ID, canonical skill ID, spawned unit ID and paid MP.
  It survives that unit's later death. Stores require that exact attestation
  before debit; a generic summon event/surviving unit is insufficient. No success
  means no item removal. Existing events remain the mana/playback authority.
- Validate canonical owner/rank/source/template before owner/template death
  authority. Establish valid authority independently of item eligibility or
  mana success, as v1d requires; full preloads need no selected item. Item and
  inherited-candidate validation gate a missing spawn only. Keep synthetic
  identities and all unrelated preparation rules unchanged.

### Receipt, ownership and staging

Keep a module-level pending receipt so the initial wave can stage before replacing
`activeRun`. It binds a unique in-memory run object, hero ID, wave index, selection,
original inventory/merc ownership references, the exact Item/index, expected
post-debit backpack, immutable original engine input and complete publication
payload. The payload includes initial teams, events, names, outcome, wave/run
identity, presentation, replay-lock flag and whether new-run rewards reset.
No map of historical receipts is needed: retain only current/pending wave state.

Run staging synchronously behind a process-local nonreentrant transition guard.
Build and validate the full snapshot, battle, terminal event and payload before
inventory writes. Revalidate the exact run/wave/hero, selection and ownership
references immediately before commitment. Store state follows immutable updates;
mutation through arbitrary raw references/direct setters is not a supported action.
No selection is consumed for technical staging failure. An accepted new wave
consumes its one-shot instruction even for a no-item/poor/full/rejected attempt.

| Phase | Persistent state and permitted recovery |
| --- | --- |
| `prepared` | Private validated payload, no item removed. Revalidation failure cancels only this preparation. |
| `committedPendingPublication` | Expected backpack debit is verified, or an accepted no-debit attempt is committed. Retain exact payload; retry publication without simulation/payment/debit. |
| `published` | Complete exact payload is installed for this run/wave. Normal playback or locked replay is allowed. |
| `conflict` | Setter/observer left unexpected ownership state; retain intent/error, block automatic continuation, never overwrite/refund unknown writes. Explicit abandonment preserves actual live data. |

For a successful missing spawn, install the intent receipt before writing one
backpack index. The debit linearizes when the live backpack becomes the exact
expected next-array reference with unchanged other ownership locations. If a
setter throws and the original references remain, no debit occurred: cancel the
preparation and retain the selection. If the expected next references are live,
the debit committed despite the throw: retain the receipt and recover publication.
An unexpected third state enters `conflict`, even if an item merely appears absent.
Never infer success from absence or overwrite concurrent/unrelated writes.
Restore preliminary transaction-owned transient changes only when their expected
state is unchanged; there is no compensating item refund after verified commitment.

After verified commitment, install the staged run/cursor and captured next ordinal
exactly once through local assignments. Publish the recording and any new-run
reward reset through **one combat-store update**; do not separately publish an
empty/reset combat state. Publication recovery must compare the complete installed
payload and run/wave identity, not outcome alone. If a publisher throws before
installation, retain `committedPendingPublication`. If it throws after the exact
payload is installed, recognize installation while retaining/reporting its error.
A retry reuses that same payload; it never invokes the engine or item debit.
Block stepping/continuing the old combat recording while publication is pending.

### New-run and next-wave lifecycle

For a new run, read the current ordinal without advancing it, construct a candidate
run and stage wave0 before replacing the old run or resetting rewards. An invalid
staging attempt leaves the old run/counter/rewards intact. When the staged wave
commits, install the captured next ordinal once only when using the default
counter; explicit ordinals never increment it. Publication retry does not repeat
ordinal/reset effects. Existing paid old-wave items receive no refund on replacement.

Before **any** wave-completion effect, including idle pity, require the combat
recording/events/outcome/run/wave identities to match the active published receipt.
Latch `settling` before invoking existing pity/XP/merc/loot/clear effects. Reject
nested completion calls. On successful settlement, mark it settled exactly once;
for another wave enter `awaitingNextWave`, capture surviving hero/merc carry with
clock rebasing once, and retain the old wave cursor until a new recording commits.
Stage the next wave using that captured carry and current hero configuration,
selection and live inventory. A technical staging failure retains selection and
`awaitingNextWave`; retries may restage only the next wave, never repeat previous
pity/rewards or clock rebasing. A prior outcome cannot complete this next wave.
Final victory/defeat likewise settles once and preserves existing original-hero,
chapter-boss and clear eligibility checks.

If an existing completion-effect routine throws, enter stable `settlementFailed`.
Retain its original recording/error and actual live gains; do not automatically
retry payouts, compensate them, advance, replay or replace the run. Explicit
abandonment keeps actual player/merc/inventory/map values and clears transient
state, with no reward retry/refund. Saves may record those stable actual slices;
already applied rewards survive, and unapplied remainder is not recovered. This
adds fail-closed transition ownership, not an all-or-none reward transaction.
If exact complete payout recovery becomes required, design that separately.

### Replay and selection lifecycle

The initial lock predicate is the production configuration predicate: exact
canonical/authored Iron identity and matching authored summon template, valid
class, learned integral rank1–20, level24, direct Blood Golem prerequisite and
explicit slot. It does not require affordable mana or an eligible selected item.
Thus poor/no-item/invalid-item/full/dead/terminal outcomes still lock when that
configuration qualifies. Capture this predicate once per accepted new wave.

A locked Iron wave replays its original complete recording, without resimulation
or live configuration/item resolution. Its current attempt/rank/payment remain
fixed; all config/respec/gear/selection changes apply next new wave. Every other
wave latches no Iron attempt: current-configuration replay of ordinary skills
must suppress newly added Iron. Expose the lock to the UI through transient
combat state and truthful bilingual copy; it never enters SaveCurrent.

Selection is an explicit hero-bound one-shot instruction for the next accepted
new wave, with visible sacrifice acknowledgement and clear action. Technical
staging failure leaves it armed. Accepted failure/full/no-op clears it without
item debit. Abort/abandon, hero replacement and successful load/import clear it;
failed import and ordinary Save/export retain the live selection/recording.
No item substitution, auto-choice or delayed retry is permitted.

### Action and persistence guards

Use a small Iron/wave-specific guard/receipt module with no runtime store imports
for cross-store access checks; use type-only imports as needed. It is not a generic
transaction/event framework. Public APIs document typed refusals/errors.

Reserve restore/replacement ownership synchronously when its request is accepted,
before queuing or awaiting. Reject start, advance, replay and new-wave staging/
commit unless hydration is ready and no restore/replacement is queued or in
flight. Retain that ownership through installation or failure cleanup. Failed
import releases it without clearing the existing selection, run or receipt.

During synchronous transition/settlement, block nested start/advance/replay/abort,
hero replacement and save snapshot/export/flush/restore/import/delete/hydration
entry. Autosave scheduling defers until unwind. During the exact item-debit write,
also reject supported inventory/merc gear mutations from reentrant subscribers;
the transaction's single direct backpack write is the sole owned mutation there.
Configuration edits cannot rewrite captured wave input. Validate ownership again
after setter notifications before treating debit as verified. Raw setter/reference
mutations remain outside supported action guarantees and cause explicit conflict.

After unwind, `committedPendingPublication` is a **settled persistent boundary**:
Save/export/autosave may capture the consumed inventory without publishing,
simulating or debiting again. Retain the in-memory retry payload. Block old
playback, advance, replay and replacement start until publication recovers or the
player explicitly abandons. A stable `settlementFailed` likewise permits saving
actual data; only explicit abandonment exits that failed transition. In `conflict`,
snapshot/restore and automatic continuation stay blocked until explicit
abandonment preserves actual state and clears the uncertain transient intent.
Do not block saving indefinitely for a verified stable debit/publication failure.

Request one normal debounced save after a stable guarded operation; do not force
new database flush semantics. Already submitted coherent save snapshots may finish
normally. Successful load/import abandons transient run/selection/receipt; a saved
consumed item stays absent, no Iron returns and resources follow current resume
policy. Deliberately loading an older save may restore its older inventory. No
save version/migration, anti-rollback or crash-atomic promise is introduced.

## Alternatives considered

1. **Persistent bound golem/item record:** closer to classic survival, but needs
   new saved lifecycle, migration, death/replacement and restore semantics. It
   conflicts with this card's explicit one-wave choice; defer to another mechanic.
2. **Engine removes inventory or debit follows a surviving unit/event:** breaks
   purity or cannot prove the exact selected source/payment, especially if it dies.
3. **Re-resolve selection on explicit replay:** risks double consumption, failure
   retries, free upgraded sources and changed affordability/order. Keep the whole
   accepted Iron recording instead of a hybrid frozen-rank/current-resource replay.
4. **Rollback every store on any error / shared transaction framework:** overwrites
   observer effects or expands into unrelated reward/persistence redesign. Use
   explicit narrow commitment, retained payload and honest failure boundaries.

## Consequences

Positive: exact inventory ownership, deterministic combat input, replay without
repeat debit, explicit recovery and compatibility with the current save shape.
Costs: a consumed item can be lost on abandonment/load even if playback never
began; Iron waves defer configuration changes; installed runes/runewords remain
unsupported. A partially failed pre-existing reward routine is not retried or
magically repaired. These limits must be visible where a player makes a choice.
No persistent mana transaction, arbitrary observer rollback, all-or-none reward
settlement, storage crash atomicity or full balance acceptance is claimed.

## Compliance, failure oracles and implementation sequence

Freeze literal cases before implementation: failed staging keeps old run/ordinal/
rewards/selection; default ordinal increments once, explicit ordinal never; exact
one-index debit preserves all other items/containers; setter-before-write keeps
source, setter-after-write keeps consumed source and one payload; third reference
conflicts without overwrite; publisher-before/after install and repeat recovery
never double-debit/reset/increment; old events/outcome cannot complete the next
wave; nested completion effects grant once; next-wave staging retry preserves
settled rewards and rebased carry once; settlement throw preserves actual gains
without payout retry; busy/conflict snapshot refusals versus stable pending/failed
saves; hold import storage or hydration unresolved (including queued hydration),
then assert typed wave-operation refusals with no simulation, debit, ordinal change
or completion effects; failed import releases ownership and preserves usable
original transient state, successful restoration clears it; abandon/load/import
and failed import distinctions; successful/failed/full/
no-item locked replay; absent Iron added mid-wave; all v1d literal stat/authority/
rarity/material/ownership controls. Inject failures at these boundaries rather
than disabling checks or asserting only one happy path.

Every source increment is at most five repository paths, committed before next.
Foundation APIs must remain inactive until their consumers integrate; do not add
production compatibility modes or prematurely expose the selected-item promise.
Use these bounded slices, splitting further when five paths would be exceeded:

1. Metadata: item type, base schema, bases, schema/catalog test and ledger (5).
2. Pure item projection + tests + ledger (3); preserve existing gear resolver tests.
3. Transient guard/selection/receipt foundations + focused tests + ledger (≤5).
4. Engine input/attestation and Iron preparation with literal RED/GREEN tests (≤5).
5. Store/persistence/combat-publication guard integration with fault-injection
   tests (≤5 per coherent subincrement), then run-lifecycle/replay integration.
   Stage helper extraction separately if needed; no dangling enabled consumer.
6. Bilingual selection/acknowledgement/detail/config-lock controls and tests in
   separate≤5-path increments, followed by production-browser tests/evidence.

Run focused, engine, full unit, types, lint and production build as applicable to
source changes. Preserve original failures and source/output identities; review
frozen bytes serially. Docs-only checks are scope, local links, stated source
facts and whitespace, without redundant runtime rebuild. Source gates and browser
acceptance remain required. Clean only exact task-owned artifacts after readers
release. Full D06/P09/P10, earned supply/balance and private-v1 remain open.

## Review record

Independent QA and TD approved the same proposed 18,278-byte decision,
SHA256 `1ac74d2a337f45327d3dc3f68e98691397756480f1b620991d1f880c883827cb`.
QA's initial approval was followed by TD's reciprocal restore-ownership concern;
the explicit pre-queue/await reservation and unresolved-restore oracles received
QA and TD reapproval. Both released all readers. This publication changes status
and attribution only; the approved architecture is unchanged. Producer publication/
scope review is required before this two-path increment commits. This does not
approve pending source, UI, browser, economy or full-plan completion.


## Delivery/status addendum — 2026-10-22

The pending-source language above records the architecture's acceptance-time
state. Bounded selected-item Iron engine/store, bilingual Skills and native
production-browser delivery is now accepted. The original architecture and
mechanic rules are unchanged; [delivery evidence](../plans/evidence/d06-iron-golem.md)
binds source increments, the tested production artifact, literal oracles, all18
native cases and validation/failure provenance. Independent QA/test-evidence,
TD/five-axis and producer approved that frozen slice; browser publication is
local commit `1c1595d` after product integration `5e7b29b`.

The native matrix uses imported functional scaffolding in both locales. It
verifies selection/acknowledgement,35MP success/34MP refusal, exact selected-item
loss, locked replay, actual next-wave configuration and Save/close/Continue plus
failed/successful import. Prepared/conflict/publication-failure coverage remains
controlled-test evidence. SaveCurrent11 is unchanged; no crash-atomic storage,
anti-rollback, native-identification, earned supply/economy or full accessibility/
platform/PWA acceptance is inferred. Existing duration/build warnings, other
corpse consumers, Mage elemental identity and full D06/P09/P10/private-v1 remain
open. Review, publication, retained evidence and verified exact disposable
cleanup are recorded in execution-ledger v1aw/v1ax and its bound manifests.
