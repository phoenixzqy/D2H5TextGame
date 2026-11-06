# BUG-429 — Reconcile Blood Raven's summoned Zombie Attack oracle

Status: fixed locally; complete affected four-file rerun137PASS.
Severity: Low (stale regression expectation).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained private-v1 work.
Environment: WSL/Linux, Node24.21.0, Vitest engine project; no browser/locale
dependency. Monster factory seed7, recorded encounter seed13, L12 Blood Raven.

## Reproduction

1. Run the full engine project on current source.
2. Observe `src/engine/combat/blood-raven.test.ts`, test "spends ordinary actions
   on Raise/Fire/base in authored order, with no startup summon".
3. Inspect the ordinary L12 Zombie bodies in actual summon events.

Expected: retain every summon/cadence/body assertion and expect the current
authored Zombie Attack midpoint. BUG427 deliberately changed its L1 Attack
from28.8 to18 while preserving4.5growth, yielding round(18+11*4.5)=68 atL12.
Actual: the test still expects78, the old round(28.8+11*4.5). The dedicated
ordinary Zombie summon regression already expects68 and passes.

Evidence: external packet `d2-counted-source-z3jj3xa1`,
`p15-level-spells-engine-v2.log`; source `monster-physical-family.test.ts`.
Affected systems: QA/content regression; root sole writer. No production
summon/stat change is warranted. Security check passes: local literal oracle
correction to an explicitly adopted content change, no check suppression.

Resolution: after the unchanged source sweep finished, changed only78→68.
Complete Blood Raven14/ordinary physical43/dedicated combat Lightning31/catalog
Lightning49cases pass in `p15-engine-oracles-green-v1.log` (18.856s wrapper).
Original full-sweep14282PASS/2FAIL remains failed; no clean full-suite claim.
