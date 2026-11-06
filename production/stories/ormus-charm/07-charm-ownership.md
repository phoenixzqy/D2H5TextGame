# ORMU-07A — Bounded charm ownership predicate

Status: implemented and independently reviewed; integrated feature acceptance remains open. Root owns mutations; producer-approved two-file slice.
Depends on ORMU-04. See docs/design/ormus-charm.md and ADR-014.

Add a pure shared hasUniqueCharmOwnership predicate in equipValidator.ts with
charm-ownership.test.ts. Count occurrences across backpack, stash, authoritative
hero slots and every merc map including orphans. Only canonical charm base IDs
activate this restriction. Actor mirrors are not inputs. Preserve ordinary
noncharm same-ID behavior and unknown Ormus strings on swords. Native save25
will retain existing stricter socket duplicate rules and use this predicate only
after raw structure/accessor admission. Causal RED tests use the current absent
predicate as the old unrestricted behavior; focused GREEN covers all owners.

## Outcome

Implemented; independent technical review APPROVE. Focused ownership-green.log:32 tests/3 files passed (including 8 ownership cases).
Evidence is retained in the root-owned Ormus packet; quest/catalog/UI/browser acceptance remains open.
