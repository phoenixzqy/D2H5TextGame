# D04 — Authoritative active statuses in recorded playback

Status: accepted bounded contract,2026-10-22; independent GD/TD/QA/producer
reviews approved. Runtime and browser acceptance remain pending.
Root is sole writer/executor; every increment owns at most five repository paths.
This child does not close full D04/D06/P09/P10/private-v1, balance or manual feel.

## Overview and controlling sources

Transport the engine's complete active status view into recorded playback, so
players can see Poison and other conditions appear, change and expire on the
actual surviving unit. Existing status events carry only target/ID, playback
ignores them, final outcome snaps arrive too late, and the compact live grid hides
persistent chips. Changing fixtures cannot establish live expiry under that model.
Sources: D04 timing and aliases, D06 Poison Explosion, combat.ts/status.ts/types.ts,
combatPlayback.ts, recordedBattlePublication.ts, combatStore.ts and CombatScreen.

## Player fantasy and alternatives

Support Challenge and Competence by showing the conditions that actually govern
combat. Preserve the single authoritative simulation. A UI timer or reconstruction
from a status ID cannot recover source, potency, aggregate refresh, spread or
nondefault clocks. A copied engine-authored complete active view is additive and
keeps the UI a consumer. Pillar/anti-pillar files remain absent; no approval of
missing documents is inferred. No identity or numeric balance change is proposed.

## Detailed rules: observation contract

Add a readonly BattleEvent variant named status-state with target:string and
statuses:readonly ActiveStatus[]. Initial observations also carry initial:true;
later observations omit that field. Recorded events retain simClockMs/uiDelayMs.
Keep existing status events as application/log/FX cues, with their original
payload, ordering and RNG. The new variant is silent: no log, popup, damage,
reward, cast or RNG draw. It contains no Player/save authority.

An initial prefix, before turn-start/startup gameplay, observes every initial
effective registered unit at simulation0 in the existing units Map order, including
an explicit empty list. Preserve current duplicate synthetic unit-ID overwrite and
registration semantics; do not add combat-input validation in this child. Only prefix observations marked initial:true may seed the first presented
frame. Startup effects and later t0 gameplay are not initial and must not run
eagerly during publication. Future starts are absent until their boundary; missing
start means battle entry and missing expiry remains indefinite. Never convert
legacy remaining into wall-clock seconds.

For each observation copy the actual complete ordered active records (all present
primitive/optional properties and independently copied nested tags). Preserve
aliases, duplicate IDs, original source, stacks, remaining, potency/type and clocks
exactly; do not merge, canonicalize, clamp, omit or reconstruct fields. An earlier
observation must not change when later engine or consumer state changes.

After initialization emit only when a target's active view or payload changes:
ordinary hit/debuff application; refresh at or below cap; marker promotion;
retaliation; death spread (even without a status cue); future activation; expiry;
and actual summon entry. Observe each committed status write before any following
gameplay event that depends on that state. Emit summon before its status snapshot
so playback can find the unit. Do not coalesce multiple same-time committed changes
out of the recorded array; only their visible presentation is atomic.

At a periodic boundary settle the final active interval and existing simultaneous
death/orphan/reward/spread ordering unchanged. Then observe survivor expiry/future
activation before surviving actions. A dead/orphan-only unit presents no active
statuses; observe its empty view by the death boundary, without deleting or
changing the raw engine status records used by death effects/rewards. Final
observations precede end, and end remains the last engine event. No resurrection
or corpse/death-identity change belongs to this child.

## Detailed rules: publication, replay and final state

The pure staging path prepares initial active status presentation from only the
explicit initial prefix, retaining exact prepared-reference installation and
receipt checks. Leave recordedEvents and eventCursor0 untouched: seeding only
prepares first-frame teams; the first engine batch reconsumes the ordered prefix
after the optional prelude/warmup. It never simulates, writes stores, skips startup gameplay or
changes the frozen engine input/outcome. Playback replaces a target's statuses
immutably with the copied authoritative list; it never calls applyStatus, advances
combat clocks, infers a duration or expires by Date.now. Unknown targets are inert.
Death clears visible statuses, and later snapshots cannot decorate a dead unit.

Pause prevents all event/observation advancement; speed changes presentation only.
Replay starts again from the original initial observations. Unlocked configuration
replay retains existing recomputation rules; Iron-locked replay retains original
recording/objects, with no extra rewards, item/body/mana debit or persistence.
At completion preserve resource/outcome snapping but overlay the last authoritative
presentation statuses (dead units remain empty), so raw dead/expired outcome records
cannot resurrect badges. Keep raw outcome references/data untouched. A new wave
starts from its own initial observations with existing qualified timestamp rebasing;
no previous presentation status leaks. New runs/saves gain no status transport field.

Authoritative presentation mode requires the complete initial prefix: after the
optional sole leading bossIntro prelude, initial:true observations must cover
every effective initially registered unit exactly once in the existing units Map
order at sim0 (including existing duplicate-ID overwrite semantics), before
any other engine event. No later event may carry initial:true. New transport
without this complete prefix is malformed and must fail pure staging before any
publication, receipt install or persistent side effect; never silently downgrade
to legacy or synthesize missing lists. Unknown-target later observations remain
inert. The death-clear/final-overlay rules above apply to this authoritative mode.
Old recordings with no status-state variant retain the existing intermediate
id-only cue, death and final-snap behavior; do not invent missing state. Same-time batching below is the
new recorded-playback pacing policy for both old and new recordings. Native input
qualification, save version and record/receipt authority remain unchanged.

## Formulas and presentation timing

Activity at simulation t is the existing half-open interval
(appliedAtMs ??0)<=t<(expiresAtMs ??Infinity), restricted to living units.
An ordinary fresh Poison applied1700 expires6700: it is visible at1700 and absent
at6700 on the same surviving, unrefreshed target; all earned damage through that
boundary settles before removal. Overrides/refresh/indefinite records retain
existing semantics. This is simulation time, not five elapsed wall-clock seconds.

Consume each contiguous equal-simClockMs group as one atomic ordered batch. Apply
all its gameplay/transport events and append logs in array order, then publish
once; transport adds no individual wait or animation floor. After seeding the
explicit initial prefix, first pending batch pays200ms warmup. Subsequent distinct
timestamp batches pay clamp(nextTs-prevTs,50,3000)ms once, then the existing speed
rule max(50,floor(batchDelay/speed)) once. A future observation-only boundary waits
its own gap rather than draining early. The existing optional leading
combat:bossIntro message is a separate presentation prelude: retain its1200ms
hint and speed rule, then the first engine batch pays the200ms warmup. Its sim0
annotation does not merge it with engine gameplay. Initial-prefix discovery may
look past this one prelude but never execute it while seeding statuses. Other
messages remain ordinary members of their timestamp batch.

Derived uiDelayMs may change. Existing separate same-timestamp action→silent MP→
consumption DOM-frame assertions are superseded by exact ordered same-batch events
and atomic final MP/body state. Retain their historical evidence; update browser
acceptance under this contract. FX selects the last four non-status-state events (including silent mana,
messages and turn events exactly as before) after excluding only transport so observations cannot evict meaningful cues.

## Edge cases and preservation

Cover fresh/refresh/cap/promotion/retained rate, aliases/duplicates/tags, absent
optional fields, future/indefinite/expired records, summon entry, dead/orphan/same-
time deaths, final-interval spread and immediate/timeout/action-cap endings.
Keep seeded scheduler ties/cadence, all RNG/action/HP/MP/status math/corpse/reward
outcomes, input immutability and non-event CombatResult fields exactly unchanged.
CombatResult contains events: expanded results/recordings are intentionally not
byte-identical. Preserve original frozen oracle bytes. For comparison, remove only
status-state observations (and already accepted corpse-message additions for the
original24 PE baseline), and exclude/rederive only derived uiDelayMs. Legacy
gameplay payloads/order/simClockMs and all non-event results must match exactly.
No production data, potency, save-format or scheduler refactor is authorized.

## Dependencies and bounded delivery

Contract/QA first: this decision, append D04 timing, new QA plan, BUG-079 closure
at20b34bed276ca35492899bb7b4382a5a551d9e54 and ledger (5paths).
The pre-runtime event-switch/exact-oracle audit requires separate bounded
test-compatibility cards before the Engine card. Preserve original expected bytes
and strict gameplay comparisons. A separate ADR/ledger card records the cross-
module data-shape decision before runtime. Reslice with producer whenever required
edits exceed five paths; never weaken old assertions.
Engine: combat.ts, new causal lifecycle test, structured bug after genuine RED
and before patch, ledger (spare fifth only if independently justified). One
encompassing lifecycle bug may span Engine/Store/UI; later cards retain their own
causal RED evidence and update/close that bug only within their path allowance.
Store: combatPlayback.ts, combatStore.ts, recordedBattlePublication.ts, one new
combined helper/staging/store lifecycle test, ledger. Existing id-only transient
cue test remains true; no receipt/combatHelpers/resource-authority redesign.
UI: compact persistent localized chips/stacks, nontransport FX window and actual
batch timer integration/tests, ledger/required bug closure in a bounded card.
For compact cards show all active status records with wrapping and unique keys
that retain duplicate-ID entries (e.g. list position as part of the key); do not
hide Poison or other records behind the prior four-effect truncation. Preserve
buff presentation and keep text/stacks/accessibility labels; verify more than four
statuses and duplicate IDs without covering HP/MP or creating horizontal overflow.
Production browser evidence follows these prerequisites; imported functional
fixtures remain unearned. Each runtime increment gets independent review and
appropriate focused/engine/full/types/lint/build/bridge checks plus cleanup receipts.

## Tuning knobs

No gameplay tuning. Retain first200ms, distinct-gap50..3000ms and existing playback
speed choices as presentation compatibility values, now once per batch. Changing
them requires separate feel review. Duration/rate/stacks stay in existing sources.

## Acceptance criteria

Engine observations faithfully reproduce all active view changes, including exact
expiry on a surviving target, with copied immutable earlier payloads. Preservation
oracles, A/A/B/A and plain/recorded determinism pass. Store proof observes state
before end/final snap, initial and future boundaries, paused/speed/replay/new-wave
behavior, silent logs and no item/reward/persistence drift. UI exposes persistent
localized badges/stacks on the real compact grid at360x640/412x915/desktop/landscape,
with keyboard/accessibility/contrast/reduced-motion/no-overflow checks. Production
browser evidence ties appearance, periodic damage and removal to the same living
unrefreshed target's engine simulation lifetime. Exact expiry proof must align
observations with the frozen production oracle/events or public observable data;
wall time, death or HP alone is insufficient.
Manual feel, physical devices, full a11y/performance, earnedL18, balance and full
D04/D06/P09/P10/private-v1 remain separate and open.


## Approved follow-on: finite hostile monster resurrection

The [monster resurrection contract](../../design/monster-resurrection.md),
approved by GD/TD, explicitly extends this child's original scope. Original
qualified hostile Shamans compete for the same finite FIFO corpse token as
existing player consumers; they remove the oldest eligible original Fallen body
without reordering other tokens. Each original body supplies one token and may
revive once. Preserve all existing costs, corpse qualification and ordinary
selection behavior. First-death effects remain once per original; second-life
cleanup emits death without another corpse/orb/economic effect.

An explicit copied `revive` event restores the existing dead actor in place,
clears its presentation dead-ID latch, then supplies a forced noninitial status
observation. Preserve atomic timestamps, seeded schedule identity, normal
Pause/speed and both replay policies. No corpse, revival proof or added reward
identity enters a save. Necromancer Revive retains its separate corpse-free
startup-summon contract. This authorizes the specified implementation, not
campaign balance or release acceptance.
