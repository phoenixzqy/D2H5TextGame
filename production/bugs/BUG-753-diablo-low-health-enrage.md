# BUG-753 — Activate Diablo's low-health enrage

Status: Fixed locally; independent/owner acceptance remains open. Severity: High (missing boss phase; no player workaround).
Date: 2026-11-05. Owner: root, solo. Systems: content/engine/combat log.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
Environment: WSL/Node deterministic engine; browser/viewport/locale independent.
Seed13, challengeOrdinal450. Synthetic durable controls are not earned campaign evidence.

## Reproduction

1. Resolve the real manual/idle Chaos Sanctuary chapter wave.
2. Build its Diablo with buildEnemiesForWave; start him at exactly 15% life.
3. Record combat against a durable, stunned diagnostic hero.

Expected: sticky enrage at 15%HP, +100% attack speed and +50% direct damage;
one localized enrage notification. Base stats and reward source stay intact.
Actual: no enrage event in either mode, ordinary cadence and damage. Above-15%
control passes. Both native threshold cases fail before production mutation.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-enrage-mnlvsoxq/red-native.log.
Regression: src/stores/combatHelpers.diablo-enrage.test.ts.
Root causes: shared policy excludes chapter-boss; Diablo lacks authored tuning;
shared damage input lacks low-life damage bonus; log converter drops enrage.
Decision: docs/plans/decisions/P15-diablo-low-health-enrage-v1.md.

## Resolution

Authored optional damagePct50, speed2 and threshold15%; shared boss policy admits
chapter-boss, shared direct damage consumes tuning, and bilingual log feedback
uses the existing enrage event. Base stats/source and legacy speed-only behavior
are preserved.25distinct selected cases pass (18new/7affected legacy); scoped
strict TypeScript603files/zero diagnostics and changed-file lint pass. Native
event rendered in actual CombatLog at360x640 en/zh-CN and1280x800 zh-CN, with no
page/console/network failures. Build remains the above SHA plus local changes;
no commit/merge or full-v1 acceptance claimed. [Evidence](../../docs/plans/evidence/p15-diablo-low-health-enrage.md).
No campaign/retry budget renewed.
