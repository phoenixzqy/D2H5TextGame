# BUG-095 — Advance mercenary derived stats with earned levels

Status: fixed; producer source/security APPROVE and independent QA ADEQUATE.
Severity: High. Owner: engine/progression + mercenary store/save compatibility.
Environment: `6b3e351` (mercenary runtime unchanged from `16db3c5`).
Observed native Chromium production at 360×640/en; Catacombs seed483175827,
run106, recorded in [C1 evidence](../../docs/plans/evidence/p01-native-earlier-boundary.md).

Reproduction:
1. Hire the authored Inner Sight Rogue at level3.
2. Earn XP through ordinary victory settlements until level16.
3. Inspect owned unequipped stats: core becomes25/61/16/27; life grows,
   but attack25/defense26/speed122/manaMax79/physicalDodge.094 stay at hire values.
4. Fresh combat correctly adds equipment over this stale saved baseline;
   the earned growth never reaches those five combat fields.

Expected: earned levels advance bare shared-formula contributions while retaining
class-specific HP growth, existing authored offsets and explicit MR. Current mana
must not refill. Gear stays separate and projects exactly once.
Actual: `mercStore.addExperience` advances level/core/life only. `upgradeMerc`
changes level alone. P13c01 deliberately preserved the earlier growth limitation;
this is its separate planned progression follow-up. The native W5 draw has an
offense/time bottleneck, but no victory or sole-cause claim follows from this gap.
Shared formulas at the recorded L16/core give bare attack70/defense65/speed161/
manaMax150/physicalDodge.172. These are formula expectations, not new run results.

GD/TD and producer approve this correction:
- Reuse unchanged class/fallback gains and bare old→new shared-formula deltas.
  Keep class HP/current-life policy and saved current mana/MR/other state.
- Historical repair requires a known catalog ID (existing #suffix allowed),
  positive earned level delta, exact class/fallback-grown core, exact class-grown
  lifeMax, and the complete five-field frozen-hire tuple. Refresh only those five.
  Unknown/custom/unmatched histories remain exact; repair is immutable/idempotent.
- Apply historical repair after validated decode and before positive-XP growth or
  upgrade. Positive XP without a level crossing still retains an eligible repair.
- Both supported level mutations use one transition. Preserve XP balances and
  explicit thresholds; upgrade keeps missing-progress semantics, refreshing the
  canonical threshold only when existing progress belongs to the old level.
- Class lookup must exclude inherited object keys. Reject nonfinite outputs;
  leave store state unchanged on refusal. No gear/data tuning or format bump.

Evidence: retained native C1 save/events and source `src/stores/mercStore.ts`,
`src/engine/progression/merc-equipment-stats.ts`; design
`docs/design/gacha-spec.md` shared-formula requirement. No new gameplay launched.
Security check: pass for local deterministic progression/restoration only; no
network, dependencies, credentials, permissions or hook/forge changes.

Resolution: one shared finite transition now grows both supported level mutations.
Validated decode and positive XP/upgrade perform the exact-signature historical
repair. Genuine original, historical and overflow regressions preceded fixes;
final8678tests/281files, engine4222/109, typecheck/lint/build and2/2production
browser cases pass. Complete exported saves preserve every unrelated field.
[Final evidence](../../docs/plans/evidence/mercenary-derived-growth.md). This
fix establishes no fresh Andariel/C1 victory; the campaign checkpoint stays open.
