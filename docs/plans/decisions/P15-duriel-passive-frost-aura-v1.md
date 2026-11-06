# P15 — Duriel passive Frost Aura

Type: small addition/correction to existing monster combat; 2026-11-04.
Root sole writer in the existing claimed human2 worktree. Existing full-v1
implementation authorization applies; no new agent, dependency, CI or release.

## Rule and rationale

`docs/design/monster-spec.md` Duriel notes require "Applies Chill to all player
units every turn (15 cold damage)." The current active skill consumes an action,
rolls15–25 and waits on its3s cooldown. It implements a different encounter.
The engine's elapsed turn boundary is5000ms (`emitTurnBoundaries`); the initial
turn header at0 is initialization, not an elapsed turn. Duriel's first pulse is
at5000ms, then every5000ms through the inclusive60000ms combat deadline if alive.
Each pulse deals15 base cold damage and applies the existing2s Chill to every
living effective player-side unit, including hero, mercenaries and summons.
Ordinary resistance, flat magical mitigation, shields, status immunity and
exact-once death settlement apply. Ambient pulses cannot miss or crit and do
not roll damage/chance RNG, spend mana/cooldowns or occupy an action. Source
control effects do not stop the passive. Death or loss of enemy allegiance does.

This is the boss-specific exception to the simplified active monster AI.
Remove the active Frost Aura from both Duriel authored skill lists; preserve
Charge and ordinary actions, stats, Freeze immunity and rewards. The separate
Act V Frozen Terror keeps its active15–25/CD3 Frost Aura, per the existing
hybrid-signature decision. No shared Frost Aura payload change.

## Implementation and acceptance

Add optional schema-validated `frostAura` metadata: `damage` finite/nonnegative,
`intervalMs` integer>=1000, `chillDurationMs` integer>=1000. Duriel authors15,
5000,2000; copy immutably through factory/runtime. A private wave-local schedule
captures original living enemy monsters only, excluding summon/owner markers.
No input deadline, action/visual marker or borrowed skill ID creates a pulse.
Use the existing ambient damage/status/death pipeline. No persisted enemy state
or save-format change. New timing resets at each native wave.

Prove native manual/idle exact pulses/all-party damage/Chill, Charge/basic
cadence and hero slow onset/expiry; original inputs immutable; recorded/plain
determinism. Constructed tests cover control, mitigation/dodge/crit, invalid or
nonenemy/summoned sources, source death and lethal target settlement. Preserve
Freeze-immunity and Act V active-Aura controls. Real bundled data validation,
scoped strict types/lint and desktop/mobile native playback finish this slice.

One owned packet,8MiB cap,24native diagnostic battles total, no population,
holdout, acquisition or campaign replay. Retain source snapshots and RED/GREEN
evidence through umbrella acceptance; remove owned processes/caches immediately.
This fixes a mechanic; BUG731 and formal balance0/210 remain open.

## Focused review

Plan review: ready. Exact onset/duration, chapter overrides, shared skill
consumer, shields/deaths, source eligibility, inclusive deadline and save boundary
are covered. Source metadata fixes the passive behavior without a selector hack
or global shared-skill change. Security check: pass; local data/engine/tests and
owned diagnostics only, no credentials/network/permissions/dependency changes.
