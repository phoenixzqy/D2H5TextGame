# BUG-761 — Guard ordinary quest starts

Status: Fixed locally in the working tree; uncommitted on b5a0898806bfba369a2d84a1b6c41d0bbb057fce
Severity: Medium
Affected systems: frontend-dev / quest actions / mapStore
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local implementation
Environment: Vitest ui project / jsdom; en and zh-CN. Real-browser verification pending.
Seed: Not applicable; no combat or RNG.

## Reproduction
1. Render the real QuestsScreen with an available Den of Evil quest.
2. Set hydration to loading, remove the player, mark combat active, or acquire the actual wave-transition/save-restore lease.
3. Click Start Quest.

Expected: Refuse without changing journal progress; explain the refusal in the selected locale. Permit starting after the condition clears.
Actual: All five conditions still publish inProgress and display success in both locales.
Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-quest-start-7rgsxyla/red.log — ten failures at the unchanged-journal assertion.
Regression: src/features/quests/QuestsScreen.start-guards.test.tsx
Root cause: QuestsScreen calls the generic map mutation directly, bypassing questActionPreflight and withQuestTransaction.
Workaround: Start quests only after loading and other actions finish.

## Scope
Move ordinary activation into the shared quest action boundary; preserve prerequisites, authored objectives, future-act tracking and separate bounty admission. Do not guard generic internal map setters globally. No campaign reruns, tuning, save-schema changes or CI.

Fixture corrections before GREEN: replace nonexistent combat.subAreaRun with subAreaRunId; correct Den objective expectations from obj-clear/obj-talk to authored obj-clear-den/obj-return. These do not affect the ten causal failures, which occur before the success assertions.

## Resolution
Ordinary activation uses shared preflight/lease, live eligibility and row-scoped rollback. UI reports localized refusal/failure. Regression paths: src/features/quests/startQuest.test.ts and src/features/quests/QuestsScreen.start-guards.test.tsx. All62selected cases, final22new cases, strict scoped types652files/zero diagnostics and final lint pass. Chromium147.0.7727.15 at360×640/1280×800 verifies12bilingual cases; no page/console/request failures. See docs/plans/evidence/p14-guarded-quest-starts.md for exact evidence and cleanup. No commit was created; owner playtest/independent/full-v1 acceptance remain separate.
