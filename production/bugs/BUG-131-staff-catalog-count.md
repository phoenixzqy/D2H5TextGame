# BUG-131 — Account for the approved staff in the socket catalog test

Severity: Low. Status: Fixed locally. Owner: qa-engineer; root sole writer.
Environment: local80f2909 plus D10 combat/staff changes, Vitest UI project.
Browser/viewport/locale and RNG seed do not apply to the static catalog count.

1. Add the approved BUG130 staff and retain all prior item bases.
2. Run standard `npm test`.
3. Observe `item-catalog-integrity.test.ts`, reviewed socket maximum metadata.

Expected: the74 historical rows plus the single approved two-socket staff pass
the catalog test; every row retains its explicit pre-instance socket ceiling.
Actual: exact74-row assertion fails at75, before checking every row's ceiling.
Root cause: the earlier fixed catalog cardinality omitted the approved addition.
The product catalog matches the D10 amendment; changing the catalog back would
remove Leaf's real acquisition path. No gameplay workaround is needed.

Evidence: root-owned `d2h5-runeword-combat-n9x0uhgk/unit-full.log` has the exact
failure,10947passing/1failing/2existing skipped tests,238.44s. Update the test to
require exactly74 non-staff rows, exactly one approved staff and all75 ceilings.
No skips, timeout changes or relaxed property assertions are needed.

Resolution: the existing test now explicitly checks74non-staff rows, exactly
one staff with sockets/maxSockets2, total75, and all original ceiling checks.
Corrected catalog40/2files pass; final types/lint pass. Corrected standard full
suite alone10948pass/401files/2existing opt-in skips,259.42s,exit0. Independent
QA source review CLEAR: no material weakening or incorrect historical claim.
