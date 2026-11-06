# BUG-759 — Honor authored boss poison damage immunity

Status: Fixed locally; focused/native verification passed; independent acceptance pending. Severity: High (missing boss encounter mechanic).
Date: 2026-11-05. Owner: root, solo. Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus inherited local changes. Systems: monster content/schema/factory, shared
direct and periodic damage, native manual/idle construction and playback.
Environment: WSL/Node deterministic combat; seed13; locale/viewport independent.

## Reproduction

1. Run src/engine/combat/damage-immunity.test.ts against the current sources.
2. Resolve a poison hit against an explicitly immune target; compare the RNG
   stream and a nonimmune target with numeric poison resistance100.
3. Build native Andariel/Mephisto; inspect authored/factory metadata.
4. Run poison plus physical Bleed against an immune diagnostic recipient.

Expected: monster-spec§10's named Poison100% immunity prevents poison damage,
including periodic damage, while other damage and ordinary resistance rules work.
Actual: no damage-immunity metadata exists; numeric resistance clamps to75%,
minimum-one damage still applies, and poison periodic damage kills the target.
Seven focused cases fail for those reasons. Evidence:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-poison-damage-b1pf1eam/red.log.
Regression: src/engine/combat/damage-immunity.test.ts. Workaround: none.

## Decision and scope

See docs/plans/decisions/P15-boss-poison-damage-immunity-v1.md. Named immunity
is an explicit exception, separate from numeric resistance and status rejection.
Do not infer immunity from a100resistance value or weaken the75cap for ordinary
targets. No encounter/reward/stat/cadence/save-format change or campaign replay.

## Local resolution

Shared authored typed immunity is enforced before resistance/minimum-one and in
all periodic consumers; Andariel/Mephisto author poison only. Native manual/idle
construction and actual playback preserve HP on poison hits. Final297affected
cases, strict scoped types602files/zero diagnostics, lint and strict schema/source
comparison pass. See [retained evidence](../../docs/plans/evidence/p15-boss-poison-damage-immunity.md).
No encounter stats/rewards/save/cadence change or campaign replay; no balance or
full-v1 acceptance claim.
