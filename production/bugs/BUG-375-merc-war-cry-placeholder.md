# BUG-375 — Replace mercenary War Cry's contradictory damage placeholder

- Status: Open — native repair verified; browser/earned feature acceptance pending.
- Severity: High — advertised area-control feature has no equivalent workaround.
- Affected systems: engine-dev / content-designer / writer.
- Build: `42f7fbc0bfe27b01222e9e487d03d495c45a3cb0`.
- Environment: native Vitest, seed5; no browser/viewport (H3 terminal failed-no-app).
- Locale: authored zh-CN/en descriptions inspected; no rendered locale acceptance.

## Reproduction

1. Load `mercs/act5-barbarian-war-cry` through loadMercPool, createMercFromDef
   and mercToCombatUnit; preserve actual War Cry → Bash → Chop loadout.
2. Load default registry; construct surviving resources, zero MP and speed100.
   Permit only the first1700ms action. Supply ordinary/boss/chapter-boss/summoned
   hostiles plus a dead hostile, with surviving ally; seed5.
3. Run frozen `src/stores/merc-war-cry.test.ts` with ordinary native unit runner.

## Expected

One non-damaging War Cry applies guaranteed Stun to every living hostile.
Expiry7700ms for ordinary/summoned,4700ms for bosses/chapter bosses, source merc.
No ally/dead recipient, zero MP, one action/CD12; ranks1–20 flat.

## Actual

Both primary cases fail. First-cast native source status-state applications are
empty rather than the four literal control records. Default registry still
exposes damage/CD3/30% on-hit Stun rather than the approved non-damaging/CD12
control. JSON separately advertises damage18–30/CD5 and the locale claims an
unimplemented ally rally.

## Root cause and evidence

`src/engine/skills/aliases.ts` registers a hardcoded damage placeholder for the
exact skill, disconnected from authored control. Resolve the reconciled JSON
row through existing DebuffEffect, without shared combat/status changes.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-war-cry-3dekymsl`.
`red.log`, `red.json`, `red-result.json` record2fail/2tests, exit1,11.661858s,
unchanged2085 permitted inputs; no production edits preceded this reproduction.
Frozen primary SHA256:
`9936e19354e74329943671e14ec39a1c4870b5972a77a8230a6cf47e69db0f25`.
Contract: `docs/plans/decisions/D04-merc-war-cry-v1.md`.

Earned recruitment, browser/devices/locales/a11y, balance/pacing and full-v1
acceptance remain unverified. No browser retry,
protected fixture, diagnostics or replacement gameplay experiment is authorized.

## Native repair verification

A validated copied/frozen exact-row DebuffEffect replaces only the damage stub.
JSON/schema/bilingual copy now describe guaranteed non-damaging area Stun6s,
canonical boss3s, zeroMP/CD12/flat ranks1–20. Existing runtime handles targeting,
control, finite lifetime and source death; real War Cry→Bash→Chop priority remains.

Original primary RED2fail/2tests precedes production. First repaired primary
fails only on unintended recipient order: native priority visits summons first.
Independent review approves arrayContaining plus exact length4, retaining all
four distinct literal recipients/values. Corrected-primary GREEN passes2, SHA256
`9c26830392515dcc0214e5c69c4216ca5774561f13385d7475eeca64bd5fd43e`;
the original source and failed run remain preserved. This is corrected-primary
GREEN, never unchanged-primary GREEN.

Four new test files add64cases: primary2/resolver41/combat18/public lifecycle3.
Reviewed cadence, corpse-presentation, lint and type corrections preserve failed
predecessors and receipts. Final unchanged2089-input map
`8d79c2ebad1883ab04840c28eb38ce2b0644445badf5441919ac6bbc0b4c393e`
passes focused219/8files, engine11404/424, ordinary21265/1001 with zero failures,
pending or todo, project types, scoped/full zero-warning lint, dependency
audit1001tests/1586modules and external production build. Native public playback
converges with exact living statuses/resources/stats and explicit corpse hiding;
saved/input/recording remain immutable and deterministic.

[Native evidence](../../docs/plans/evidence/merc-war-cry.md) records the full
lineage and measured results. Disposable build762files/42292116bytes/10directories
is verified removed; all44 recorded check PID/driver observations are absent,
with no cleanup failures. Root retains the exact packet through unfinished
acceptance and owns eventual cleanup. Independent source/native-test and completed
engine/lint approvals are retained; final ordinary/evidence/blob/tree/parent
reviews govern the local checkpoint. No performance-budget, timeout-cause,
speedup, earned recruitment, balance, pacing or browser acceptance follows.
