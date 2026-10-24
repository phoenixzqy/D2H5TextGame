# D05 — Barbarian endurance passives

Status: implemented and locally verified; independent acceptance pending.
P10 bounded group: Increased Stamina, Increased Speed, Natural Resistance.
Numerical authority is the existing Barbarian JSON; no potency change.

| Authored ID suffix / canonical suffix | Unlock | Cap | Per allocated rank |
| --- | --- | --- | --- |
| increased-stamina / increased_stamina | 12 | 20 | +3% fresh combat max life |
| increased-speed / increased_speed | 24 | 20 | +1% fresh attack speed, +0.5pp physical dodge |
| natural-resistance / natural_resistance | 30 | 20 | +2pp each of six resistances, +0.5pp magical dodge |

Authored IDs have prefix `skills-barbarian-`; canonical IDs `barbarian.`.
Take the maximum finite positive integer allocation under those exact two
aliases, capped once. Unknown/malformed aliases grant nothing. Native learning
owns prerequisites: Speed requires Stamina; Resistance requires Iron Skin.
Composition consumes allocated ranks, matching the existing passive boundary.
Only a Barbarian player at each authored finite unlock qualifies; mercs,
summons and other classes inherit nothing. No combo slot, cast, cost or RNG.

Compose once after current equipment/quest stats, at `playerToCombatUnit`.
Stamina multiplies equipment/quest-derived max life, Speed multiplies fresh
attack speed, and dodge adds decimal fractions. `resistAllPct` is an additive
fraction converted to percentage points for all six resistance fields, not
a multiplier of existing resistances. Existing damage caps and action-period
floor remain authoritative; no new rounding or cap. This reconciles the older
fixed30% Resistance spec and obsolete stamina/movement descriptions with the
authored no-movement adaptation. Other skills and formulas are unaffected.

No persisted derived-stat mutation or save-shape/version change. Learning or
resetting does not heal or change a current recording. Fresh encounters use
the existing full-pool entry policy with the new maximum. Next waves and
explicit replay recompose from current allocation/equipment over immutable
original resource baselines: preserve HP/MP on increases, clamp on decreases,
never compound or grant reset/refill income. Removing the allocation removes
the bonus. Test actual action cadence, damage and dodge, not markers alone.

Skills details in both locales show authored current/next values, automatic
player-only effects, cap/unlock and no movement/stamina promise. Native
allocation prerequisites, cap, reset, immutable recording, next-wave/replay
and save/restore must be verified. Constructed functional/browser fixtures
are not earned Barbarian progression, build balance or campaign acceptance.

Plan review: ready after including resource/clamp, exact aliases, existing
prerequisite boundary and all actual stat consumers. Root self-review only.
Security check: pass. Local typed combat/schema/copy/tests; no dependency,
network, credential, permission, CI or save-format change.

Evidence: [implementation](../evidence/d05-barbarian-endurance.md).
