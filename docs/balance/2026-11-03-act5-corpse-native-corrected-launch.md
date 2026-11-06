# Act V corpse recipe: corrected launch, 2026-11-03

The [original prospective comparison](2026-11-03-act5-corpse-native-comparison.md)
stopped before any admission because its scratch driver called a terminal-only
controller audit on an unfinished prefix. BUG-615 records the error. Independent
readback verifies zero new admissions, waves, actions, rewards or save changes;
the native export remains exactly pre1456, SHA256
`000d50a395446d29ce5474ffdb412cd989ed00a94392a9aba8a3820e2dcb8033`.
All v1 artifacts remain immutable, including its nonzero exit and absent cache.

Correct only the caller: validate the authenticated original terminal controller,
derive the retained successful prefix, and validate its ordinal, XP, cleared areas
and exact checkpoint. Reserve terminal audit for actual termination. Use the same
prefix helper in a zero-combat preflight before freezing the corrected v2 driver.
Production controller, campaign recipe, profile and original bounds are unchanged.
Do not assign a false failure or add a wall-continuation marker to pass the audit.

The corrected launch carries every original declared cost and limit. Additionally
charge the full failed v1 launch's 19025.058705126867 physical milliseconds and
40165 journal bytes. Its admissions, training, combat and rewards are zero. The
original three abandoned gameplay attempts stay charged and their state stays
excluded. Original terminal1459 remains exhausted. No earlier-act replay, global
allowance renewal, mid-run tuning or formal acceptance is authorized by this fix.

Plan review: ready after successful zero-combat preflight and scoped driver types.
Security: local first-party evidence and scratch driver only; no install, network,
CI, credentials, publication, source checkout mutation or agent delegation.
Execute once under frozen v2 authority, capture success or failure, then independently
read journal/export without combat replay. Required evidence remains in the existing
packet; root retains worktree/packet through umbrella review and owns cleanup.
