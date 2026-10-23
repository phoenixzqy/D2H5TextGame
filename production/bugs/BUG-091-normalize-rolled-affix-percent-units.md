# BUG-091 — Normalize rolled affix percentage units at stat projection

Status: fixed for fresh projections; historical cache follow-up BUG094 open. Severity: High.
Owners: engine-dev/content-designer; GD/TD/producer unit contract approved.

Environment: aec0041; Node/Vite production-module projection, no browser/viewport
or locale dependence. Input is the original earned L12 route, seed2223645302,
clock1792497600000; Cold Plains ordinal103, wave4 native rewards. No combat rerun.

Reproduction:
1. Inspect earned rare amulet `it-7yy59-2n4`: nimble physical-dodge roll2 and
   savage critical-damage roll5.
2. Call production `aggregateEquipmentMods` for that item, which uses
   `computeStats` with the actual affix definitions.
3. Observe physical-dodge modifier2 and critical-damage modifier5. A second
   amulet `it-2cxjo-2n3` projects magic-dodge modifier1 from ethereal roll1.

Expected: authored percentage-point affix rolls must be converted to the
fractional probability/multiplier vocabulary of derived/combat statistics.
The final shared unit rule must also cover precise critical chance and preserve
integer resistance percentage points and flat attributes.
Actual: `computeStats` adds rolledValue unchanged for every stat. These values
flow into fractional fields (e.g. existing0.10physical dodge plus2 rather than
plus0.02); combat hit probability then reaches its5%floor. This would create a
false impression of an ordinary earned upgrade's strength.

Evidence: read-only executed audit and exact item/affix/projection details at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-boundary-WP70rVKS/audit.json`
and `audit.mjs`/`audit.log`; exit0. `src/data/items/affixes-prefix.json` stores
whole-number ranges1–3crit chance,5–15crit damage and1–2dodge at low item levels;
`docs/design/items-spec.md` describes dodge affixes as percentages.
`src/ui/statSheetFormat.ts` and `src/engine/combat/damage.ts` consume fractional
probabilities and critical multipliers. No saved item or gameplay source changed.

Workaround for the next finite route: explicitly exclude every item with an
unresolved critical/dodge modifier, including incidental modifiers. Use the
independently justified supported-stat gear policy; do not hide, normalize in
the harness, exploit, discard or alter the affected earned items. Full v1 still
requires the shared fix, regression coverage and save/display compatibility audit.
Root retains audit evidence through C1 and removes it after dependent readers finish.

Resolution: convert the four known modern rolled-affix rate fields at
`computeStats`, preserving raw rolls, legacy maps, flat stats and resistance
points. [Validation](../../docs/plans/evidence/equipment-percentage-units.md):
39 genuine RED failures/15 controls; final 8600 tests/typecheck/lint/build pass.
Producer source APPROVE/security PASS and independent evidence ADEQUATE.
The workaround above describes historical campaign inputs and remains part of
their frozen evidence; it is not a restriction on newly corrected projections.
No historical cache repair, post-fix campaign victory or C1 acceptance is claimed.
