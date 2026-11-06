# BUG-531 — Include native mercenary XP in combat-growth diagnostics

Severity: Low. Status: diagnosed; earlier hero-only projections retained.
Owner: root (QA forecast). Native combat XP sharing is correct.

## Reproduction

Worktree `D2H5TextGame-human-worktree-2`, branch `feat/playable-foundations`,
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` with existing dirty implementation.
Node24.21.0/Vite SSR; viewport/locale not applicable. Packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Restore `p15-paladin-zeal-act2-initial-continuation-v1.json`,13/5838/136,
   Prayer12 with9772/12903XP.
2. Inspect `p15-paladin-zeal-act2-dry-growth-forecast-v2.json`, projected22 row.
3. Its first W3 party has hero22 but Prayer13, with the latter's only growth
   coming from the two restored diagnostic area waves. Prayer dies at5600ms.

Expected: a combat-only growth scenario also models the fielded mercenary's
native XP share before assessing the prospective party.
Actual: forecast v4/v5's `diagnosticLevel` changes only hero XP. This remains a
valid hero-only diagnostic but cannot establish that actual combat farming to
that hero level would fail with its naturally grown mercenary.

Evidence: original growth-v2 JSON, its retained method/log/receipt and the
initial W3 merc/death events. Native `shareExperienceWithFielded` uses
`floor(amount * 0.75)` in `src/stores/mercStore.ts:371`.

Resolution: a successor forecaster adds explicitly requested, diagnostic-only
party growth through that real sharing service. The lump sum is a planning
projection, not earned XP and not an exact per-wave rounding prediction.
Bench XP stays unchanged; the diagnostic is restored afterward. Any selected
target still requires bounded native farming and a new exact-source forecast;
never promote projected income/equipment/clears to the authoritative save.
Earlier results and their narrower limitations remain intact.
