# BUG-082 — Restore Den's authored Dark One guard family

Status: fixed in the accompanying authored-family correction under accepted
[D07](../../docs/plans/decisions/D07-den-entry-power-v1.md).
Severity: Medium — early Den quest screen fails, but Act I travel remains open;
no claim that every build or route is blocked.

## Reproduction

Source `5be82d3` / diagnostic publication `bcea5c3`; Chromium desktop1280×800,
en, Linux; Node24.21.0 production-service reconstruction. Native fixedDate
2026-10-20T12:00Z, runSeed2223645302, challengeOrdinal40.

1. Follow the retained fresh Sorceress40-earned-W1 recipe in
   `docs/plans/evidence/p04a09-lightning-den-earned-discovery.md`.
2. Win Den W1 and W2 with actual carry; W3 reaches60000ms with two enemies alive.
3. Compare actual Den W3's first archetype with maps-spec Act I pool and current
   Den flavor. Resolve the actual map and build the first rare leader.

Expected: the early cave guard uses the specified Dark One family; current L7
rare rules yield236–364HP,27DEF,9MR and30%elemental resistance.
Actual: the row uses Dark Stalkers, yielding640–960HP,77DEF,9MR and55%elemental
resistance. The observed855HPleader takes171damage and remains at684HP.
Whole W3HP envelope1936–2960 is~2.3×W2's832–1312.

Evidence: [complete reconstructed diagnosis](../../docs/plans/evidence/p01-den-wave-three-diagnosis.md),
its bound native report/trace and full event/resource fixture. Four new
`src/engine/combat/den-encounter.test.ts` regressions fail before the correction;
raw RED log retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/den-family-fix/red.log`.

Root cause: one authored family mismatch. No demonstrated engine defect.
Owners: game-designer/content-designer; engine/QA verifies real planner/factory
and route. Workaround: travel to another unlocked Act I area; no alternative
Den clear is verified here. Correct the one row; do not tune shared mitigation,
DarkStalker definitions, global tiers or the failed seed's skill configuration.

## Resolution and validation

Only Den W3 first archetype changes to `monsters/act1.dark-one`; both legacy and
active Den share that row. Other fields, global families, planner/RNG and combat
rules stay intact. Five regressions cover source, both planners, ordinal/tier
stability, and both rare leader HP endpoints. Initial4behavioral RED failures
are retained. Corrected focused69/3, typed5/1, full8381/263, typecheck, lint and
production build pass. Initial test-only level/type expectation failures remain
in raw logs; assertions were corrected against existing source/native evidence.

[Complete service proof](../../docs/plans/evidence/p01-den-complete-service.md)
wins all4waves from the exact earned save with actual carry/award settlement;
QA ADEQUATE. Subsequent [native clear and restored-persistence evidence](../../docs/plans/evidence/p04a10-den-clear-and-restored-persistence.md)
records four native wins and a separately passing earned-save restore continuation.
Broader Act I remains open.
