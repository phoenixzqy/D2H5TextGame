# BUG-751 — Apply Mephisto’s three-stack Poison Cloud

Status: Fixed locally, 2026-11-05; not committed. Severity: Medium.
Owner: root, solo private-v1 continuation. Systems: monster/skill data, engine registry.

## Reproduction

Baseline HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited worktree.
Native Node/WSL engine; browser/viewport/locale independent. Seed13, ordinal450.

1. Load validated Durance data, resolve manual or idle chapter plan, build the
   actual Mephisto with `buildEnemiesForWave`.
2. Record native cadence against durable synthetic hero/merc/summon controls.
3. Inspect the first accepted Poison state after each target’s first landed cloud.

Expected: `docs/design/monster-spec.md` §6 specifies AOE three-stack Poison every
three turns. Actual: both manual and idle regressions receive one stack rather
than three. Root cause: Mephisto references the intentionally one-stack shared
cloud. The shared periodic/status engine already supports multiple stacks.
No player workaround. Diagnostic controls are not earned balance evidence.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-mephisto-poison-stacks-r1sasw7c/red-native.log`
(two genuine stack-count REDs; existing cooldown-schema case passes).
Regression: `src/stores/combatHelpers.mephisto-signature.test.ts`.
Decision: `docs/plans/decisions/P15-mephisto-poison-cloud-stacks-v1.md`.

## Resolution and verification

Mephisto now selects the authored three-stack `monster.mephisto_poison_cloud`
variant through the existing validated monster-dot resolver. Ordinary clouds
retain one stack; shared status integration/cap/refresh and encounter cadence
remain unchanged. No boss-ID execution branch or save change.

57 distinct selected cases pass (33 resolver, 7 engine, 3 native cadence/log,
5 boss construction, 8 Mephisto immunity, 1 delivery coverage). Strict scoped
TypeScript checks 601 implementation/data files with zero diagnostics; changed
TypeScript lint passes. Original REDs and test-cleanup typing/lint failures are
retained alongside corrected passing results. Self-review only; no earned
campaign, balance/pacing or independent/owner acceptance is claimed.

See [complete evidence](../../docs/plans/evidence/p15-mephisto-poison-cloud-stacks.md).
