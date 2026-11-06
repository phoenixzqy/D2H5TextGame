# BUG-739 — Qualify historical saves across the current migration boundary

- Severity: Medium (external evidence qualification; no gameplay or player save loss).
- Status: Fixed locally on dirty `b5a0898`; external qualifier only, no new commit.
- Owner: root / QA tooling.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current dirty human2 worktree.
- Environment: Node 24.21.0 / Python 3, WSL; browser/viewport/locale/seed not applicable; zero combat admissions.

## Reproduction

1. Run retained `swing-route-first-v1-check.py freeze` in
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-earned-representatives-p_pqjbjf`.
2. Qualify Fire Sorceress's exact earned version32 Act I export after current `decodeSave`.
3. Compare the migrated current value with the literal predecessor snapshot.

Expected: preserve the historical raw export and prove the exact existing v32→v33
migration, then compare native capture with that current decoded value.
Actual: the external qualifier requires raw equality across versions and fails
before hydration/gameplay. The only observed diff is version33 and empty
`meta.recruitmentState` / `mercs.recruitmentProgress` added by the existing migration.
The same draft also reads the fresh Swing's compound source-before packet as a
standalone source manifest; use its named source/campaign members.

Evidence: `swing-route-first-v1-freeze.log`, `-freeze-exit.json` (exit1,
PID56839,4867.17ms) and `-freeze-process-exit.json` in that exact packet.
Production `src/engine/save/validate.ts` already calls migrations; the engine is
correct. Fix the external comparison, retain rejected script/receipt, and assert
both raw custody and the exact migration delta. Do not edit historical saves,
replay gameplay or relax native capture equality.

## Correction and verification — 2026-11-05

The qualifier separately proves literal raw export/predecessor equality, the
exact independent v32→v33 overlay, and exact current decoded/native capture
equality. Swing v33 is unchanged; Fire/Druid v32 gain only version33 and the two
specified empty recruitment fields. All three native restores round-trip exactly
and restore outer state/clock. Seven negative controls per source reject changed
XP, item identity, ordinal, altered/default recruitment state and missing fields
(21 total). The historical compound manifest is read through `.source` and
`.campaign`. No engine or historical save changed.

`swing-route-first-v1-freeze-v3-exit.json` records exit0; scoped strict types pass
with zero diagnostics/914 transitive files, and explicit ESLint passes. Original
rejected drafts, initial failure, runtime-v2 qualification and rejected type
diagnostics remain in the packet. See
[earned representatives evidence](../../docs/plans/evidence/p15-act2-earned-representatives.md).
