# BUG-442 — Update native roster oracles for the shared group contract

Status: corrected and verified locally; test-only, uncommitted.
Severity: Low (four stale assertions; no new production defect).
Environment: native Vitest/Node24.21.0/WSL; HEADb5a0898 plus BUG440.
Affected systems: engine regression oracles, root writer.

1. Run `p15-promoted-engine-v1`:524files/14299tests;14295pass,4fail in3files.
2. ArcaneW4 and Spider/DuranceW4 still expect every fitted body champion.
3. CityDamnedW6 still expects twelve rare minions after its rare leader.

Expected: per `P15-promoted-group-budget-v2.md`,3champions or1rare+3minions,
remaining native trash; exact counts/levels/source/archetype/order stay pinned.
Actual: four old all-count tier assertions fail against the intended projection.
Evidence: `p15-promoted-engine-v1.log`, focused92GREEN and2349exact/projection controls.

Correct only these explicit tier vectors and Doll attack vector. For authored
Doll35.2+52*5.5=321.2, rounded trash321, rare-minion353 and rare leader482.
Keep all source/count/level/skill/event and determinism assertions. Do not remove
checks or patch runtime to restore the superseded composition.

Verification: all three affected files PASS94tests/12.563s; strict types8.999s,
scoped lint12.161s and engine-purity0.135s PASS. Exact production/data identity
is retained in `p15-promoted-engine-reconciliation-v1.json`:524observed files/
14299tests, all four original failures covered by corrected focused passes.
Original failed sweep remains; no uninterrupted current-source green claim.
