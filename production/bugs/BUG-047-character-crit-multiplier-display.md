# BUG-047 — Display critical damage multiplier with the correct percent unit

Status: confirmed intake; separate frontend fix not yet started.
Severity: Medium — Character sheet misstates critical damage by100×.
Owner: frontend-dev; producer triages, independent QA reviews.

## Reproduction

Observed at runtime0f7cdc0/input1e9e582 during ordinary P11a01B3 production
acceptance, unchanged through995f1b2. Linux/Playwright1.59.1 Chromium,
en+zh-CN,1280×800 and360×640. Date-onlyT0=2026-10-20T12:00:00Z;
no RNG dependence for this display (combat earning recipe in B3 evidence).

1. Create an ordinary Sorceress, open native Character HUD sheet.
2. Read critical damage row before or after earning/spending attributes.
3. Compare saved derivedStats.critDamage2 to visible2%.

Expected: multiplier2 means200% total critical hit damage, following
engine/types/attributes.ts Critical hit damage multiplier documentation and
combat/damage.ts multiplication. Preserve combat numeric value2.
Actual: CharacterScreen.tsx262 rounds raw multiplier and appends percent,
showing2% instead of200%. Existing critChance uses formatPercent; this row does
not. Source diagnosis is sufficient; no balance/formula change implied.

Evidence: docs/plans/evidence/p11a01b-earned-stat-allocation.md final matrix
SHA256b4bedf632a9ce2d952861758f2298e3856e5822fb15a7a59b47b9c1be2fa6162;
frozen stat-allocation-earned.spec.ts explicitly preserves existing2% display
and full saves establish stored multiplier2. B3 acceptance excluded correctness
of this existing row. Raw browser artifacts were removed after both reviewers
released retention; versioned evidence and source assertions remain.

Workaround: interpret raw displayed number as multiplier, not percentage.
Future fix needs source-backed expected200% and independent review of any
existing frozen browser oracle correction; no runtime/test change in this intake.
Security check: pass, local display only; no credentials/network/permission work.
