# P15 — Diablo low-health enrage v1

Date: 2026-11-05. Scope: BUG753, local implementation; full-v1 acceptance open.

Use monster-spec §7's specific 15%HP threshold and combat-formulas §13's shared
enrage magnitude: +100% attack speed, +50% direct damage. Add optional nonnegative
damagePct to the existing closed monster enrage schema; Diablo authors 50.
Blood Raven's existing speed-only tuning remains valid and unchanged.

The shared policy admits boss and chapter-boss. Existing sticky phase and pending
action-progress reconciliation remain authoritative. Damage bonus joins additive
increases before critical/resistance/flat mitigation, excluding thorns. Burn
captures the boosted landed hit once; existing periodic damage is not boosted
again on enrage. Healing does not remove enrage; Chill still modifies its speed.
Emit the existing event once and translate it in the shared log converter.

No boss-ID branch, base-stat mutation, save migration, new campaign run or spent
retry allowance. Native manual/idle, threshold negatives, shared damage/periodic
interactions, schema and the affected legacy enrage cases provide focused checks.
Stun resistance, other boss contracts and full balance acceptance remain open.
