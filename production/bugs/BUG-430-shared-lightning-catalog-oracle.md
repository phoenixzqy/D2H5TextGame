# BUG-430 — Reconcile shared Lightning's catalog oracle

Status: fixed locally; complete affected four-file rerun137PASS. Severity: Low (QA).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus private-v1 work.
Environment: WSL/Linux/Node24.21.0, Vitest engine project, no seed/browser/locale
dependency (catalog/schema assertion).

Reproduce: run `src/engine/skills/act1-lightning.test.ts` after BUG422.
Expected: dedicated Act I affix and shared monster Lightning stay distinct;
the shared row matches its deliberately normalized native40–60/CD2/single
contract in `docs/plans/decisions/P15-monster-heal-lightning-v1.md`.
Actual: the first catalog test still requires superseded JSON40–65/CD3/all.
All other48cases in the file pass, including dedicated leaf/schema isolation.

Evidence: retained `p15-level-spells-engine-v2.log`, full sweep14282PASS/2FAIL;
the other failure is BUG429. This is separate from BUG423, which corrected
the combat consumer's pre-Paralyze oracle but missed this catalog consumer.
Affected systems: QA/content regression, root sole writer.

Fix only the explicit shared-row target/CD/range oracle and rename the case
to describe continued distinction. Preserve status/tags/leaf/schema assertions.
No production change or suppression. Security check passes for a local stale
expectation repair to the already adopted contract. Rerun both complete
lightning files and the affected Blood Raven/physical-family files.

Resolution: only the three obsolete literals and test title changed. Full
catalog49/combat31/BloodRaven14/physical43cases pass, wrapper18.856s. No runtime
change or weakened assertion. Original full-sweep failure remains retained.
