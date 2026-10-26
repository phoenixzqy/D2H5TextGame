# BUG-271 — Construct immutable native summon negative fixtures

- Severity: Low; new test-fixture compilation errors, no runtime defect.
- Status: Corrected in `6c4b2b58` using immutable snapshot construction; focused tests/types/lint pass.
- Owner: root; no independent acceptance.
- Environment: strict TypeScript, Node24.21/Linux; no browser/locale/RNG is relevant to compilation. Test combat itself uses synthetic seed7.
- Base: 04271444 plus the new native summon test file.

## Reproduction

1. Add the21case native Skeleton/Clay/Revive acceptance file.
2. Run full npm run typecheck.
3. Inspect the new unconfigured-slot and mana-recovery fixtures.

Expected: construct valid immutable CombatUnit snapshots without altering production types.
Actual: exit2/123.651s reports three TS2540 errors: writes to readonly skillOrder, manaRegenPerSecond and manaRegenBaselinePerSecond. The186related runtime assertions and typed lint passed; neither replaces full typecheck.

## Root cause and evidence

The new negative fixtures mutate readonly fields after creation. Construct copied units and copied snapshots at runBattleRecorded instead. Keep every negative assertion, actual recovered-mana witness and numerical oracle; do not widen types, cast away readonly or suppress diagnostics. Original source and complete494byte log/receipt are retained in the active bone task. Log SHA256 7faf97399190b509006095a4c0c94c8602de61442553769cf867c50a876bbc04. Recheck focused tests, typed lint and full types before committing.

## Final local validation

Native21cases/related186in3files pass35.734s; full types120.220s and focused typed lint8.784s pass. Eight completed Skeleton/Clay contexts from the original failed aggregate command plus separate Revive4/4PASS80.285s establish12completed locale/viewport cases. No12/12successful single command is claimed. All original failed sources/logs remain retained. See docs/plans/evidence/d06-basic-necromancer-summons.md and its checkpoint packet. No production runtime change, independent sign-off or earned-build balance acceptance.
