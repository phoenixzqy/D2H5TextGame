# BUG-425 — Update obsolete permanent monster-buff cadence expectations

Status: fixed locally at HEADb5a0898 + uncommitted private-v1 work. Severity: medium (regression oracle).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0; pure engine, no viewport/locale.
Reproduction: seed7 native fixtures in boss-signature-family.test.ts and
monster-hybrid-family.test.ts; run both files after BUG424's finite buffs.
Expected: Enrage may recast after its5000ms window and CD6; Shout after5000ms/CD5.
Actual: four boss fixtures and Infidel still expect ordinary attacks at those
slots, inherited from old permanent markers. The runtime correctly recasts.
Evidence: p15-monster-self-buffs-consumers-v1.log in the retained task packet:
376PASS/5FAIL across381; independent native finite-expiry tests pass.
Affected systems: qa-engineer/engine-dev; test-only literal schedule correction.
Contract: docs/plans/decisions/P15-monster-self-buffs-v1.md. Preserve timestamps,
all other slots, runtime, native bars/curves and assertions.

First correction run:82PASS/1FAIL across83. Infidel also retained the old
109-only ordinary-damage oracle. Its real Enrage window now produces floor(109×1.5)
=163. Update that oracle to the exact109/163 values and require163to be observed;
all other units' damage assertions unchanged. The original failed runs remain.

Outcome: docs/plans/evidence/p15-monster-self-buffs.md records native/UI/browser/consumer/type/lint and frozen raw comparison. No numerical/campaign signoff.
