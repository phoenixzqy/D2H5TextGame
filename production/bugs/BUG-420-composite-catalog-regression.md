# BUG-420 — Older catalog oracles omit accepted monster payload changes

Status: fixed locally; focused regression verified. Severity: medium (QA regression).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Reproduce: full engine sweep / src/engine/combat/vengeance.test.ts first case.
Expected: exact authorized composite set includes Vengeance/Phoenix/Power,
mercenary elemental arrows and the newly authored death-only monster CE.
Actual: test's five-member exact list predates BUG417's native mixed Doll
explosion; it rejects the legitimate sixth participant. This is unrelated to
BUG419's four monster JSON edits. Native resolver and35death combat tests already
verify private authority, shared rolls and active-selector exclusion.

Repair: explicitly include monster.corpse_explosion, compare sorted canonical
sets (membership authority matters, registration insertion order does not),
update title. Preserve Vengeance typed effects and every damage/payment/replay
assertion. Run full16case file and scoped lint/types; record original broad
failure and focused result, never describe the original sweep as clean PASS.

Further broad-sweep finding, before repair: five Dark Stalker cases still
expect StrongMelee fillers and VileHunter's generic-first order. BUG412's
melee family intentionally superseded those lists with Charge-only and L6
ordinary Attack63. Preserve Charge60–90/CD4, native cadence/Chill boundary,
physical dodge/mitigation, replay/immutability and one damage event per action;
replace only the superseded filler/order oracles with ordinary skillId:null.
Both DarkStalker and VileHunter now share Charge then ordinary gaps.

Closure: Vengeance16PASS24.836s; DarkStalker6PASS15.659s; scoped lint26.260s/
16.804s and latest strict types12.443s PASS. Both complete files preserve native
payload, mitigation, cadence, replay and immutability assertions. The original
broad engine sweep remains explicitly failed; all8stale cases are reconciled
with repaired full-file runs in p15-boss-signature-family evidence. No runtime
mutation or diagnostic rerun. Owned processes collected without descendants.
