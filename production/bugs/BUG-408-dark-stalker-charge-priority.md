# BUG-408 — Restore Dark Stalker's Charge priority

- Severity: Medium; the monster fights but never uses its defining signature.
- Status: Fixed locally; functional verification passes. Campaign balance remains open.
- Affected systems: monster content/native combat; content-designer/game-designer/QA.
- Build: `b5a0898` plus retained private-v1 local changes, Node24.21.0.
- Browser/viewport/locale: independent pure-engine reproduction.

Reproduction:

1. Load the default skill registry and bundled `monsters/act1.dark-stalker`.
2. Factory L6/trash with seed7; battle seed13 against the disclosed passive
   tank in `src/engine/combat/dark-stalker-priority.test.ts`.
3. Observe actual action IDs at1540/3080/4620/6160ms.

Actual: Strong Melee is ready on every action (MP0/CD1), suppressing Charge/CD4.
Expected under the newly adopted bounded role contract: Charge, Strong Melee,
Strong Melee, Charge. Keep existing physical60–90and30–50damage, mitigation,
delivery, resources and all other rows. No new stun/movement effect or ordinary
attack-growth authoring is part of this correction.

Evidence: retained packet `p15-stalker-red-v1.log`/`-exit.json`,4intended failures
and2controls passing; exit1in8.240s, no timeout/error/live owned descendants.
This pins native factory order, Charge damage and exact Chill cooldown boundary
before production data changes. Real encounter references include Cold Plains,
Dark Wood and Catacombs; this synthetic tank does not establish route viability.

Root cause: content priority, not the shared first-valid selector. See
[role decision](../../docs/plans/decisions/P15-dark-stalker-priority-v1.md).

Validation: nine focused files/468tests GREEN, including six Stalker cases and
292loader cases. Strict types and full cached lint pass7.140s/9.027s. Independent
native-mechanics review APPROVE. Candidate and comparison exit0without timeout,
error or live owned descendants. The full3054-input inventory stays stable within
both arms; only the exact Dark Stalker skills-list reversal differs across arms.

The first cohort harness attempt failed before battle0because it incorrectly
expected an authored attackRange; it is retained without a balance result. The
separately frozen v2 corrects this assertion and discloses version-namespaced
spawn seeds. Both v2arms complete4000matched fights/4012native calls. Charge is
observed in every candidate fight; baseline has none. Deaths per1000increase
601→1000(L6Barbarian),612→1000(L6FireBolt1),0→376(L13Barbarian),0→579(L13FireBolt1).
These unearned no-gear/unspent-attribute diagnostics do not accept campaign
balance. See [evidence](../../docs/plans/evidence/p15-dark-stalker-priority.md).
