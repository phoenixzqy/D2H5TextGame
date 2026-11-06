# BUG-421 — Seven monster elemental statuses have no periodic damage

Status: fixed locally; numerical/campaign acceptance pending. Severity: high (combat identity).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Reproduce: native FireBolt, FireBall, FireArrow, Inferno, PoisonCloud,
PoisonDagger or PlagueSpit hit a surviving hostile. Their stub applyStatus
contains only an ID; the installed status has zero periodic potency.
Expected: authored finite positive burn/poison/plague damage consistent with
existing shared integration, refresh, combo and spread behavior.
Actual: direct damage and combo markers exist, periodic damage does not.

Repair contract: docs/plans/decisions/P15-monster-dot-family-v1.md. Preserve
native direct damage/CD/targets/projectiles and delivery; normalize divergent
JSON catalog fields explicitly. BloodRaven custom arrow, FireBreath/PoisonSpit
and mercenary arrows are separate positive-rate controls. No engine primitive,
save format or dependency change. Numerical campaign acceptance remains open.

Resolution: seven real JSON-backed finite positive payloads, native ranges/CD/
targets/projectiles/delivery preserved. Final354schema/native/resolver/loader
cases and428consumer regressions PASS; strict types and scoped lint PASS.
Frozen512fights/arm and independent hash/source/metric audit verified. Full
results, adverse transitions and diagnostic corrections: docs/plans/evidence/
p15-monster-dot-family.md. This is not numerical balance acceptance.
