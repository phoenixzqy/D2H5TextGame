# BUG-004 — Summon IDs make seeded battle replay depend on previous battles

Severity: High (determinism/measurement integrity). Owner: engine/technical.
Status: fixed and independently source-reviewed, 2026-10-20. Card P06a.
Reproduced before fix at `109fb27`.
Environment: Node 24.21.0, Vitest 1.6.1 Node engine project; seed 7.

Reproduce: `npx vitest run src/engine/combat/runBattleRecorded.test.ts --reporter=dot`
with new A/A and A/B/A replay regressions. Initial result: 2 failed / 3 passed.
Same summoning snapshot generates `p1-summon-skeleton-1`, then `-2`; references
in actions/damage/final teams differ. Intermediate other-seed battles and
standalone template construction also change later replay IDs.

Expected: complete recorded logs/timestamps/final state are functions of the
snapshot, independent of previous evaluations and without global resets.
Root cause: default summon templates allocate IDs with module-global counters.

Fix contract: templates are pure and have provisional deterministic IDs;
the battle owns a monotonically increasing sequence, skipping existing IDs.
Assign identity immediately after construction, before positioning/ID lookup.
Retain the old reset export as deprecated compatibility only. No gameplay
cap/resource/corpse/timing changes belong to this child.

Designer/technical plan review approved this scope with a required regression
for a damaged existing unit occupying the template placeholder ID. Its HP and
position must not be copied into a fresh summon or overwritten.

Validation: `npm run test:engine -- --reporter=dot`, exit 0, 37 files /
346 passed, 3.94 s (over the 3 s engine budget). Six recorded-battle tests
include complete A/A and A/B/A equality, normal/recorded wrapper equality,
input immutability, multiple owners/templates, living and dead ID collisions,
and damaged-placeholder preservation. Typecheck passed. Initial lint exposed
an empty compatibility body and redundant test discriminant; both corrected.
Integrated full unit/lint/build and browser evidence follows in the ledger.

Independent design/technical reviewer: `[TD-ARCH-REVIEW]: APPROVE`, no blocking
findings in this identity-only scope. Optional dead-ID coverage was added.
Security check: pass; pure transient identity change, no credentials, network,
save shape, permission or policy changes. D04 and broader D06 remain open.
