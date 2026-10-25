# BUG-235 — Publish current cooldowns at the terminal combat boundary

Severity: High. Status: reproduced during BUG234 validation; root fix pending.
Owner: engine; root sole writer/reviewer. Deterministic Vitest/Node, locale and
viewport independent. Seed19, source based on `1ffcc55c` plus local BUG234.

1. A legal paid Blaze/Fire Wall/Thunder Storm cast hits an enemy with1HP.
2. The immediate pulse ends the wave at900ms; no later actor refresh occurs.
3. Inspect terminal hero.cooldowns, the native next-wave carry input.

Expected: exactly3000/4000/4000ms remaining from the paid cast.
Actual: undefined. All three `exports the paid cooldown` assertions fail.
Evidence: `d2h5-periodic-spells-nk5fzu2y/cooldown-red.log` (3failed;77 other
cases filtered, not disabled). To be retained before scratch cleanup.

Root cause: expiry map is paid correctly, but unit.cooldowns is only refreshed
before that actor's next action. A terminal outcome can export its earlier
cached view and bypass cooldown when a native wave starts. This is shared
combat state publication, not a periodic-spell-only permission exception.
Fix at terminal export for every unit; do not special-case new spells.
Regression: `src/stores/periodic-spells.causal.test.ts`, native wave carry.
