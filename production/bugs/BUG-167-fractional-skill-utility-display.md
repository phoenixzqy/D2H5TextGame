# BUG-167 — Preserve fractional percentages in skill utility details

Severity: Medium. Status: fixed in `99a3733`; independent acceptance pending.
Owner: frontend-dev. Affected: Skills current/next utility percentages/deltas.

## Reproduction

Base `f7718ac` plus BUG166 implementation. Production Chromium, zh-CN,
360×640; English/desktop have the same formatter. No RNG required.

1. Import labeled functional level30 Barbarian eligibility.
2. Allocate Natural Resistance rank1 using the ordinary Skills action.
3. Inspect current and next Magical Dodge.

Expected: current0.5%, next1%(+0.5%), matching authored fractions and combat.
Actual: current1%, next1%(+1%). Both utility formatting paths round to integers.

Evidence: original production screenshot `endurance-mobile-zh-CN.png` and
browser report retained under the BUG166 task evidence root; failing bilingual
secondary-row assertions in `SkillsScreen.barbarian-endurance.test.tsx`.
This is a display defect; combat already uses the correct0.005 fraction.

Root cause: `formatUtilityStat` and `utilityDelta` use integer `Math.round`.
Fix at both shared utility formatting paths, preserving the display resolver's
four-decimal fractional precision (two decimals in percentage points).
Summon-stat formatting is outside this observed utility defect.

Four causal bilingual RED cases now pass. Final100focused/11778full unit
passes and four production desktop/mobile cases verify both current/delta
formatting. Evidence: `docs/plans/evidence/d05-barbarian-endurance.md`.
