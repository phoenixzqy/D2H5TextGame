# BUG-526 — Alias the Larzuk service command in the earned driver

Severity: Low
Status: Fixed in the task-local successor helper (uncommitted)
Affected systems: QA task-local preparation driver (root); production service behavior unchanged.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, existing dirty `feat/playable-foundations` worktree.
Environment: WSL, Node 24.21.0, repository ESLint configuration; browser/viewport/locale/seed not applicable to this naming failure.

1. Run the scoped ESLint command recorded in `p15-bone-owned-preparation-lint-v1-exit.json`.
2. Include external helper `p15-bone-owned-larzuk-v1.ts`.

Expected: The pure imperative quest-service call passes the rules-of-hooks check.
Actual: `useQuestService` is mistaken for a React hook inside `applyBoneOwnedLarzuk`.
Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-bone-owned-preparation-lint-v1.log`, line 22 of the retained helper.

## Root cause and correction

The public API is an imperative command whose existing production tests already import it as `applyQuestService`. Use a command alias in a successor external helper, preserving the original helper and failed lint result. Do not suppress lint or change the production service.

Validation: successor helper/native scoped lint and strict types pass; the restored service-only fixture confirms one capacity change and duplicate-use refusal, and native1294 plus independent reader validate the actual earned service and four separate rune costs. The original failed lint remains retained. No production source or API was edited; no commit or publication is authorized for this continuation.
