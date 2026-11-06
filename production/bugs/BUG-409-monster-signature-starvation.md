# BUG-409 — Restore eight suppressed monster signatures

Severity: Medium. Status: fixed locally; functional verification passes. Earned balance remains open.
Owners: content-designer/game-designer/QA. Build:b5a0898plus retained localv1
changes,Node24.21.0. Browser/viewport/locale: pure engine; independent.

Reproduce: load the default registry and bundled eight rows listed in
`docs/plans/decisions/P15-monster-signature-batch-v1.md`; build native trash at
its listed encounter level with factory seed7, battle seed13against two passive
tanks. Run `src/engine/combat/monster-signature-priority.test.ts`.
Expected: signature first, generic melee while its cooldown is active, then
signature again. Native effect/delivery/target/status/flight remains unchanged.
Actual: zero-costCD1generic melee is ready every action and suppresses each
signature indefinitely. No user workaround. The first-valid selector correctly
honors this authored order; data ordering is the cause.

Evidence: `p15-signatures-red-v1.log`/`-exit.json` in the active retained packet:
32intended failures, exit1in8.943s, no timeout/error/live owned descendants.
No production changes preceded this reproduction. Numerical authoring remains
separate;101outstanding monster rows are not closed by this role-only batch.


Validation: exact eight list reversals;32RED→32GREEN, eight related files/407
GREEN, strict types/focusedlint and independent native fixture review. Frozen
v2cohorts4000/armand exact full source/list comparison pass. All4000candidate
fights use a signature. Threat shifts are material, especially Spit/BoneSpirit;
this closes starvation only, not balance. Failed v1preparation/candidate0and
static preflight remain retained. See
[evidence](../../docs/plans/evidence/p15-monster-signature-batch.md).
