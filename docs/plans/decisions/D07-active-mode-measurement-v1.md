# D07 v1a — Restored-state active manual/idle diagnostic

Status: accepted scoped measurement contract, 2026-10-20; P02b05a.
Independent GD/TD plan review approves this boundary. Concrete document review,
implementation readiness and evidence are recorded separately in the ledger.
This is a missing measurement capability, not an established runtime bug.
Full D07/P11, earned idle access and C0–C4/G0–G7 remain unaccepted.

## Active production boundary

`src/features/combat/CombatScreen.tsx` chooses idle when the current canonical
area or alias matches `metaStore.idleState.idleTarget`, then calls
`startSubAreaRun({mode:'idle'})`. Both manual and idle play recorded battles and
settle through `advanceWaveOrFinish` in `src/stores/combatHelpers.ts`.
No production caller mounts the exported legacy `useIdleTicker` hook. Its
presumed-kill `applyTick` path is excluded from active-mode measurements.

Current planner behavior in `src/engine/combat/sub-area-run.ts:238` retains the
final forced elite guards in **both** modes. Idle additionally invokes encounter
promotion/pity on unforced trash waves. Promotion can consume planner RNG and
change subsequent packs/affixes. Equal seed/ordinal alone therefore does not
promise equal encounters or rewards. This is an explicit diagnosed mode
difference; it does not silently ratify all legacy idle design.

Completed playback commits applicable idle pity before checking victory.
Failed waves may change pity but grant no new XP, items or clear. Forced guards
do not themselves reset/update pity. Both modes share combat-qualified hero XP,
merc XP and loot, including the award-time XP/MF multiplier. Earlier qualifying
wave rewards survive later failure. Only the final qualifying win marks clear.

After idle victory, CombatScreen ends combat and starts another ordinary run;
defeat stops it. Ordinary starts consume another challenge ordinal and derive
their seed from time. They advance progression rather than restore a baseline.
CombatScreen's stop/flee/defeat paths reset pity. MapScreen and IdleTickerStrip
stop controls only clear the idle target. This distinction remains outside the
service diagnostic's acceptance; no lifecycle fix is implied here. A service
pair does not validate UI timers, routing, repeat/stop behavior or fresh earned
eligibility.

## Closed diagnostic, with explicit restoration

The additive diagnostic has its own tag and types. Accepted strict manual-only
v1/v2 parsers, fixtures, adapters and assertions remain byte-for-byte unchanged.
Do not add an arbitrary external save/snapshot importer or widen those recipes.
The later executable card freezes a small test-owned baseline constructor and
all numeric samples before running it. No seed/build search or promised win.

One pair starts manual and idle independently from the same retained complete
baseline: player/resources/skills/combo/status/cooldowns, inventory/equipment,
merc/formation, map/location/quests/clears, and meta bonus tuple **and anchor**.
Clock, canonical area, explicit seed/ordinal and initial pity also match. There
must be no active run. Only mode differs; a separately declared routing marker
may differ in a future UI test. Capture/restore all seven stores' methods and
data, Date and pity, including on failures. Never reset hidden global item or
challenge allocators; use the explicit challenge ordinal seam instead.

Default scope is canonical Act I Blood Moor. The diagnostic runs bounded native
playback until the first terminal nonwin or final qualifying win, with exactly
one settlement call per completed attempted wave and no automatic repeat. The
baseline is labelled test-owned/restored/synthetic even if assembled using
native creation and allocation actions. Record whether it has an earned clear,
no clear, or a declared synthetic marker. Direct idle service use without a
clear is explicitly a UI-eligibility bypass for diagnosis, never earned access.

## Required observations and comparison order

Retain source/data/baseline identity, exact restored state, source manifests,
resolved handles and seed/ordinal derivation, actual rosters/presentation,
recordings/outcomes, carry, pity before/after, raw awards, independent observed
domain deltas, timings and terminal state. Preserve native nonwins/refusals and
original item IDs; report global allocator differences without normalization.

Compare actual combat inputs before outputs. When complete combat inputs match,
seeded recordings/outcomes must match. When promotion changes inputs, expose
the planner divergence and downstream observations instead of demanding battle
or reward equality. Presentation/pity metadata can differ without promotion.
Keep raw rewards and a narrow semantic reward comparison that removes only
known Items' top-level IDs separate from complete raw state. No victory flag,
assumed-kill count or semantic equality substitutes for observed settlement.

## Next executable card and verification

The subsequent child freezes at most three outcomes:

1. Closed restored-baseline pair with exact mode-only start differences,
   bounded native playback, complete restoration and honest eligibility label.
2. Truthful differential report separating planner inputs, recorded battle,
   rewards, domains and pity; complete nonwin/error evidence and provenance.
3. Genuine verification of isolation and settlement, plus ordinary-pity and
   hard-pity11 samples, preserving strict v1/v2 idle-rejection regressions.

Freeze exact ownership, baseline bytes/actions, seeds, ordinals, repetitions,
process/deadline/size bounds and expected assertions before implementation or
execution. Expand a card exceeding five writable source/test files. A useful
first sample is the historical seed1 at ordinal0, with pity0 and11 considered
separately; this suggestion is not an executed or frozen result.

Missing-capability RED must fail before the new measurement implementation.
Real-production probes cover forced guards in both modes, hard-pity opening
promotion, incomplete settlement with no changes, completed nonwin with no new
reward/clear, and inert repeated terminal settlement. Existing correct runtime
behavior may already pass; never manufacture a runtime defect or call unrun
probes RED. Comparator sensitivity corrupts genuine produced observations
(roster, event damage, currency, pity) and requires each relevant difference to
remain visible. Failure/error paths verify all methods/data/clock/pity restored.
Mocks or restored snapshots never certify fresh gameplay feasibility.

Record exact source/test freezes, genuine REDs, approved corrections, actual
test statuses and full reports. Run relevant tests and final repository U/T/L;
build/browser requirements depend on the later child scope. No build overlaps
source-fingerprint consumers. Independent review/QA and exact task-owned cleanup
precede closure. Diagnose unexpected behavior before any runtime patch; confirmed
bugs need structured reports and their own frozen regression tests.

This diagnostic may advance P02's same-snapshot comparison/diagnosis requirement.
It does not accept full P11 idle, native UI repeat/stop, offline farming, earned
clear, first-act/campaign feasibility or pacing. A separately reviewed fresh
Blood Moor full-clear pilot and active UI proof follow the
[first-act route contract](D07-D11-first-act-route-v1.md).
