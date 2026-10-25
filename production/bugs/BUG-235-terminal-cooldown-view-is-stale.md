# BUG-235 — Publish current cooldowns at the terminal combat boundary

Severity: High. Status: Fixed in `b1cfe5e8`; locally verified.
Owner: engine; root sole writer/reviewer. Deterministic Vitest/Node, locale and
viewport independent. Seed19, source based on `1ffcc55c` plus local BUG234.

1. A legal paid Blaze/Fire Wall/Thunder Storm cast hits an enemy with1HP.
2. The immediate pulse ends the wave at900ms; no later actor refresh occurs.
3. Inspect terminal hero.cooldowns, the native next-wave carry input.

Expected: exactly3000/4000/4000ms remaining from the paid cast.
Actual: undefined. All three `exports the paid cooldown` assertions fail.
Evidence: retained `cooldown-red.log` (3failed;77 other cases filtered, not
disabled) in the [raw packet](../../docs/plans/evidence/fixtures/periodic-spells/packet.json).

Root cause: expiry map is paid correctly, but unit.cooldowns is only refreshed
before that actor's next action. A terminal outcome can export its earlier
cached view and bypass cooldown when a native wave starts. This is shared
combat state publication, not a periodic-spell-only permission exception.
Fix at terminal export for every unit; do not special-case new spells.
Regression: `src/stores/periodic-spells.causal.test.ts`, native wave carry.

Terminal export now refreshes every unit from the paid expiry map. Five existing
engine/native compatibility files assert exact corrected cooldowns while
preserving all other historical fields. The native Mage fixture independently
asserts cast2000/end5820 and180ms remaining. Focused730/14, engine8088/302 and
quiet full16236/730/two existing skips pass. See
[delivery evidence](../../docs/plans/evidence/d04-sorceress-periodic-spells.md).
