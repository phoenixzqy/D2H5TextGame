# D04 v1a — Action cadence and inclusive combat deadline

Status: accepted scoped control, 2026-10-20; P06b only. Full D04 remains open.
Owners: game/technical design reviewer and engine integrator.
Sources: GDD §5.1 (attack-speed order and seeded ties), D04/P06 in the work
plan, and the existing `actionPeriodMs` / `MAX_SIM_MS` implementation.

## Controlling choice

Simulation milliseconds are authoritative. Content durations use seconds;
legacy five-second turn markers are presentation, not action counts or elapsed
seconds. Preserve the current action cadence for this correctness slice:

`periodMs = clamp(2500 - floor(attackSpeed) * 8, 400, 2000)`

The first action occurs after one period; subsequent actions are scheduled one
period after the preceding action. AS75/100/150 have periods 1900/1700/1300 ms.
This explicitly supersedes the proportional `1000 / attackSpeed` cadence and
its examples in combat-formulas §3.1. It is a compatibility choice, not a claim
that these numbers meet campaign balance targets; tuning requires later review.

The battle deadline is **60,000 ms inclusive**. Actions scheduled exactly at
that instant remain eligible. Continue through tied actors unless an actual
victory ends combat or the existing runaway-action safety cap intervenes.
Never advance to an action after the deadline. An unresolved contest times out
with an end timestamp of exactly 60,000 ms and `winner: null`; it is not victory
and does not authorize victory rewards. A victory before the deadline retains
its actual end timestamp. Existing result fields remain compatible.

The smallest upstream correction checks the next scheduled timestamp rather
than the previous clock. Merely clamping an overshooting event would still
execute an ineligible action; merely stopping before it would report an early
timeout. Changing only `<` to `<=` would still overshoot on the next iteration.

## Scope and deferred temporal rules

This child changes only the scheduler deadline. Existing insertion-order ties,
damage RNG, rewards, cooldowns and status handling are preserved. GDD seeded
ties remain required by a later child; this record does not approve the current
tie implementation as the final design.

The wider D04 temporal target is a later implementation contract: status
activity `[appliedAtMs, expiresAtMs)`, final-interval integration before expiry,
no damage before application, fractional damage carry, advancement of every
affected unit, scheduling at lethal/expiry boundaries, and simultaneous death
marking before rewards/healing/actions, with hero death taking defeat priority.
Effects through the deadline must eventually resolve before deadline actions.
Boss control multipliers must eventually apply in milliseconds. None of these
is implemented or accepted as verified by P06b; current actor-only DoT bugs
remain open. Moving expiry below damage alone cannot satisfy that contract.

Weapon/spell scaling, damage-source metadata, mitigation, damage-derived DoT
rates, status aliases, healing and leech remain separate D04/P08 dependencies.
No numeric damage or duration tuning, content rewrite, save change or result
API expansion belongs to this child.

## Verification

Fixed-seed durable-unit fixtures prove AS100 has 35 actions per actor through
59,500 ms, with end at 60,000 and no 61,200 ms event; AS263 has 150 actions per
actor including both deadline ties and no 60,400 ms event. Further cases prove
a lethal deadline action ends combat before a remaining tied action, an early
victory keeps its timestamp, and repeated recorded/normal runs agree without
mutating input. These tests do not certify periodic status integration.

Implementation/reproduction: `production/bugs/BUG-006-combat-deadline.md` and
`src/engine/combat/deadline.test.ts`. Review approval applies only to this
scoped deadline/cadence decision, not the unfinished D04/P06 workstreams.


## D04 v1b — P06c01 periodic boundaries (accepted scoped child)

Status: accepted control and implementation plan, 2026-10-20; root and producer
reviewed before implementation. This supplements P06b; full D04 remains open.

Statuses are active on `[appliedAtMs, expiresAtMs)`. Combat applications stamp
both clocks. Missing start means battle entry; missing expiry stays indefinite,
without converting legacy remaining turns into seconds. Active same-ID refresh
keeps original start, potency, source and capped aggregate stacks, with maximum
absolute expiry; an existing indefinite record remains indefinite. Untimed legacy
API calls preserve any existing absolute lifecycle. A timed application replaces
an inactive future or expired same-ID record as fresh; it cannot frontload future stacks. Other pending
records remain stored. Control, combo and death-source views use active statuses.

Advance every living target together at the earliest action, future status start
or expiry (including control-only effects), integer-ms periodic lethal instant,
or inclusive 60,000-ms deadline. Integrate only interval overlap before expiry.
Pool fractional damage across all DoTs per target, retaining it through refresh,
expiry and gaps until death/end; floor accumulated damage with no minimum tick.
Carry is battle-local, absent from snapshots/saves. Keep compensated accumulated
rate-times-milliseconds to avoid losing a whole point when an interval splits.
For constant rate r, carry c and HP H at time a, start the lethal search at
`ceil(a + 1000 * (H-c) / r)` and verify candidate and previous millisecond with
the same integrator used by settlement. No per-millisecond polling or zero loop.

At a shared boundary: compute/write all periodic HP from one frozen before-state;
emit positive DoT events in insertion order; close owner-death orphan sets and
mark every death, sticky hero defeat and schedule removal; emit all death events
in insertion order; then run ordinary death effects in insertion order. Only
independently periodic-lethal units receive ordinary effects; orphan-only despawns
retain death-only behavior. Periodic-lethal classification wins overlaps. Refund
only living owners, and heal/orb only living recipients: simultaneous hero/boss
lethal cannot rescue the hero. Final-interval poison/plague spreads from the frozen
source even exactly at expiry, only to living recipients, stamped now with normal
finite duration and no retrospective damage. An expired recipient same-ID record
is absent for application, even before the survivor-expiry phase. Expire survivors,
check winner (hero defeat priority), then allow surviving tied actions.

Preserve P06b cadence, insertion ties, RNG calls, immutable inputs and inclusive
deadline actions. Settle the deadline even when the next action lies later.
Boundary-only advances do not consume action budget. The existing action cap is
a safety stop; reaching it must not invent settlement to 60 seconds.

Implementation owns types.ts, status.ts, combat.ts, periodic-timing.test.ts, this
control and BUG-011. Tests/reproduction precede runtime changes; run focused and
engine regressions, full units, typecheck, lint and build; independent root and
producer source/contract review precedes commit. Exact-value tests cover short
expiry, application overlap, carry splitting/gaps/pooling, earliest lethal,
future control/combo inactivity, refresh/replacement, simultaneous death/orphan
closure and orb order, final-interval spread, deadline, determinism and immutability.

Deferred: boss duration multipliers in milliseconds (P06c02), cross-wave timestamp
rebasing (P06c03), seeded ties, scaling/mitigation/aliases/source metadata. Current
wave transfer preserves absolute statuses while the next battle resets its clock;
pending future starts must be supported rather than rejected. This child does
not claim cross-wave temporal acceptance or complete D04/P06 acceptance.

## D04 v1c — P06c02 boss status duration (accepted scoped child)

Status: accepted control and four-file implementation plan, 2026-10-20; root
and producer reviewed before implementation. Full D04/P06 remains partial.

With a simulation clock, resolve the unrounded duration in milliseconds as
`durationMs ?? ((duration ?? config.duration) * 1000)`. For boss and chapter-boss
tiers only, apply the configured `bossDurationMult` exactly once to that value.
Quantize a strictly positive scaled result with `max(1, floor(scaledMs))`;
preserve zero/nonpositive results as immediately inactive fresh applications.
This keeps positive sub-millisecond control for one millisecond without reviving
zero/negative duration. There is no new malformed-input validation. Defaults
remain freeze/stun ×0.5; unrelated statuses gain no new multiplier. Nonboss
durations and statuses without a multiplier retain fractional milliseconds.

Expiry is application clock plus that millisecond duration: default boss control
at 1700 expires at 2200; three seconds becomes 1500ms; explicit 1501ms wins over
a seconds override and becomes 750ms. Activity remains half-open: an action
inside the interval is controlled, an action at exact expiry is eligible.
Both damage-on-hit status application and debuff effects use this same rule.

Keep legacy `remaining` rounding and untimed helper lifecycle unchanged. P06c01
active refresh still retains original start/source/potency, preserves capped
stacking behavior and keeps maximum absolute finite expiry; existing indefinite
expiry stays indefinite. A shorter,
zero or negative new duration cannot shorten active control. Future/expired
same-ID records are replaced fresh with the scaled duration. Never multiply a
previous absolute expiry or apply the multiplier a second time on refresh.

Implementation owns status.ts, boss-duration.test.ts, this control and BUG-014.
Test/reproduction evidence precedes the runtime patch. Verify focused and engine
regressions, full units, typecheck, lint and build, then independent root and
producer source/contract review before commit. No combat scheduler, cadence,
ties, RNG, aliases, content tuning, save, mitigation or scaling changes belong
to this child. Cross-wave absolute timestamps still require P06c03; seeded ties
and broader D04 dependencies remain separate. This scoped acceptance does not
certify campaign balance or complete D04/P06.

## D04 v1d — P06c03 cross-wave status clocks (accepted scoped child)

Status: root and producer accepted control and six-file plan, 2026-10-20.
The sixth file is the required BUG-016 reproduction report; separate Node
engine and jsdom production tests preserve their environment boundaries.

Every battle still starts at simulation time zero. Only at a qualified actual
next-wave transition, carry living heroes/mercenaries with residual status time:
drop statuses whose present expiry is at or before the completed wave's elapsed
time, then subtract that elapsed time from every present start and expiry.
Negative rebased starts preserve prior age; future starts remain future by their
remaining delay. Missing timestamps remain missing, indefinite expiry remains
indefinite, and legacy `remaining` never converts to seconds. Preserve status
source, stacks, potency, tags and all non-status unit fields. Do not rescale
duration, advance during playback/pause/wall time, or transfer fractional damage
carry, which remains battle-local under P06c01.

Capture the last original engine-recorded event before presentation injection.
It must be `end`, with a finite simulation clock in `[0, MAX_SIM_MS]`; fractional
milliseconds are allowed. This exact terminal clock includes periodic-only lethal
boundaries, immediate results, deadline and actual action-cap stops. Never infer
elapsed time from last action, turn count, UI delays or a fallback zero. If the
invariant fails, abort the transient active run before throwing and before
publishing another recorded battle, so older playback cannot finalize stale time.
Overwrite captured elapsed time on each recording/replay; never accumulate it.

Rebase only after playback completion, player victory, living original hero and
existence of a next wave are established. Preserve the completed outcome and
current wave's replay input. Current-wave configuration replay never rebases
again. Final victory, defeat, draw and abort retain their prior behavior.
Manual, idle, legacy start and production measurements share the production
`playWave` / `advanceWaveOrFinish` path. The unused legacy store `nextWave` action
does not run the engine and is outside this correction. Ordinary/recorded engine
results retain wave-local status clocks and their existing API; callers can use
the shared pure rebasing helper with known elapsed time when constructing a new
snapshot. No result/store/save schema change is needed.

Preserve existing carry policy: living hero/merc resources and buff IDs carry;
summons are filtered out. Cooldown scheduling is rebuilt per battle; its carried
unit view can affect startup eligibility and remains existing D06/P09 debt. This
child neither accepts that broader policy nor changes it. No summon, buff, DoT
potency, cadence, tie, mitigation, alias or balance tuning belongs to this slice.

Implementation owns status.ts, combatHelpers.ts, focused engine and production
cross-wave tests, this control and BUG-016. Genuine two-wave production behavioral
RED evidence precedes the runtime helper and patch. Verify residual/future/expired
and legacy clocks, exact periodic terminal time, repeated transitions, qualified
carry, no replay double subtraction, actual status/HP/actions, terminal failure
paths, determinism and immutable inputs. Run focused tests, E/U/T/L/B, changed
module coverage and independent root/producer source/contract review before commit.
Seeded ties and broader D04/D06 dependencies still remain separate; full D04/P06
and campaign balance acceptance are not claimed.
