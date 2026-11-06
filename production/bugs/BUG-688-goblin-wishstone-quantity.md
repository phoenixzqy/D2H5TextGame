# BUG688 — Use the goblin wishstone quantity behind the existing kill gate

Status: Resolved locally, uncommitted, 2026-11-04. Severity: High.
Input: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Node/Vitest pure engine; browser/viewport/locale not applicable.
RNG: equipment seed 7; separate wishstone units 0/.5/near1 and gate boundary .025.

## Reproduction

1. Load real award pools; roll `loot/treasure-goblin`, elite, level20, MF0.
2. Supply a separate wishstone RNG with a successful 2.5% gate.
3. Repeat for acts I–V and Normal/Nightmare/Hell.

Expected: drop-tables §4.9/§9 awards 1–3 wishes on success, zero on failure.
The quantity is independent of act and boss difficulty multipliers. Exactly
one gate is used; quantity entropy must not change the separate loot stream.
Explicit caches retain raw treasure-class rewards and bypass the kill gate.

Actual: goblins inherit miniboss wishes 6/7/8/9/10, multiplied by difficulty.
No independent goblin wishstone quantity policy or quantity draw exists.

Evidence: 8 failed / 3 passed in `src/engine/loot/goblin-wishstones.test.ts`;
original log retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-goblin-wishstones-v1/original-failure.log`.
Affected systems/ownership: engine-dev reward orchestration and content-designer
authored economy policy. No player workaround.
Root cause: the boss context used for goblin equipment/materials also supplies
the boss conditional wishstone amount, instead of the goblin-specific range.

## Fix plan

Add closed, bounded wishstone min/max fields to the existing goblin policy,
schema before JSON, with semantic range validation. At the existing single
kill gate, successful goblins sample that range from the wishstone RNG;
ordinary kills keep their combined amount. Preserve the equipment/material
path, raw caches, missing-source refusal, settlement authority and earned saves.
Verify focused endpoints/boundaries/entropy plus affected native publication
and restoration, scoped types/lint and isolated production validators/offline
assets. No full suites, campaigns, new agents, installs, commits or publication.

Plan review: ready. Root correction is at conditional wishstone selection;
the boss context remains appropriate for equipment/materials. Shared-RNG callers
will consume one extra draw on successful goblins; separate native streams must
preserve all non-wish rewards and following loot RNG.
Security check: pass. Local authored reward correction; no new network, dependency,
permissions, credentials, CI, persistence or publication behavior.

## Resolution

The existing goblin policy now supplies a schema-validated 1–3 quantity, sampled
from the wishstone RNG only when the existing kill gate succeeds. Act/difficulty
boss budgets no longer control goblin wishes. Twelve focused cases pass within
160 affected cases, including 36 native settlement checks. Scoped strict types,
four-file lint, isolated production/precache and all 13 emitted JS bridge scans
pass. Six source/766 build hashes verified; exact disposable build/config removed.
See [evidence](../../docs/plans/evidence/p17-goblin-wishstones.md). No earned
campaign, economy or balance acceptance is claimed; full private v1 remains open.
