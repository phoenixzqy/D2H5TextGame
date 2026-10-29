# BUG-377 — Mercenary Holy Fire executes an attack instead of its ambient aura

- Severity: High — advertised signature aura has no native implementation.
- Status: Open — native repair and native validation complete; browser/earned acceptance pending.
- Build: `3d6a2b1db8531a9f3856b4a4838380d0eea53dbd`, existing claimed worktree.
- Environment: native Vitest, constructed mechanics; browser/earned play not exercised.
- Affected systems: engine-dev / content-designer / writer.
- Locale: zh-CN/en skill wording must match the reconciled native contract.
- Seed:7, ranks1 and20; deterministic ambient damage requires no pulse RNG.

## Reproduction

1. Load actual `mercs/act4-paladin-holy-fire` through pool→factory→combat projection
   and the default registry, preserving its sole `mskill-holy-fire` loadout.
2. Hold the surviving source and hero with fixture Stun; construct two living
   hostile targets with zero resistance/Defense and one dead target.
3. Run frozen `src/stores/merc-holy-fire.test.ts` at ranks1 and20.

Expected: gacha-spec§4.2's8Fire/s to each living hostile, first at1000ms then2000ms;
four distinct literal damage8 records, no dead target, source cast, MP payment or
Burn. Living Stun/Freeze does not suspend passive presence.

Actual: no aura hits at either rank; both tests receive0 instead of4 records.
Authored active single24–40/CD2/Burn and executable area20–30/CD3/Burn contradict
the promised ambient aura. Workaround: none for the advertised passive.

Root cause: active placeholder registration and data omit a qualified passive
source and periodic scheduler boundary. Repair the authored/native contract; do
not rescale the active stub or introduce a parallel clock loop.

Causal RED precedes this report and production edits: exit1,2failed/0passed,
11.522770s; unchanged2095-input map
`7f16a5c39f41bfb55ff744ae7ce7ab78882e3bf6a62b948a374b1dfd88aa31b1`.
Frozen primary SHA256:
`449d81c72e0361038ea22411a5bf66e95a30e726a22219eb461a52207e5706a6`.
Independent parent/draft/security review approves the freeze. Required evidence
retained by root through unfinished acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-holy-fire-l0hmmoq6`;
root owns eventual exact-path cleanup. Browser/earned feature acceptance stays open.

## Repair progress

The qualified passive aura now replaces the active damage/Burn placeholder.
The unchanged frozen primary passes both cases; four new files add 91 cases.
Corrected focused validation passes 269 cases across 9 files, scoped lint has
zero warnings, project types and the ordinary test-boundary audit pass. External
production build passes with existing chunk/precache warnings. Engine passes
11,556 tests across 428 files, zero failed/pending/todo. Full lint/engine purity
passes with zero warnings. Audited ordinary units pass 21,436 tests across 1,009
unique permitted files, zero failed/pending/todo. Final 2,099-input maps match
before/after/current, and all 26 recorded check PID observations are absent;
no broader acceptance is claimed.
The failed partial-edit check, focused fixture failure and lint narrowing error
are retained with independently approved corrections. See
[native evidence](../../docs/plans/evidence/merc-holy-fire.md).
