---
name: dev-story
description: Execute a single story from `production/stories/`. Reads the story file, locates the spec + QA test cases, implements the smallest set of changes that makes the QA tests pass, and hands off to `story-done`. Used by `engine-dev` / `frontend-dev` / `content-designer` as their default per-story workflow.
---

# Skill: dev-story

## When to use
- A story is assigned by `producer`.
- The story is ready (`story-readiness` would APPROVE — dependencies
  resolved, spec APPROVED, QA cases present).

## Phase 0 — Workspace check (before any reads/edits)
- Confirm the worktree path you were dispatched into. If `producer` gave
  you a path like `..\D2H5TextGame-<story-id>`, every subsequent step
  runs **inside that directory**. Do not edit the main checkout.
- Confirm you are on `feat/<story-id>` (`git branch --show-current`).
  If not, stop and ask `producer` — do not switch branches yourself in
  a shared checkout.
- If you were dispatched without a worktree (serial mode), branch
  yourself: `git switch -c feat/<story-id> origin/main`.

## Phase 1 — Load context
- Read the story file: `production/stories/<feature>/<NN>-<slug>.md`.
- Read the linked spec: `docs/design/<system>.md`.
- Read the relevant section of `Diablo2TextGame.md` if domain-fresh.
- Read `.github/copilot-instructions.md` (rules) — silently obey.

## Phase 2 — Confirm readiness
- Acceptance criteria clear?
- QA test cases written?
- Dependencies merged?
If any "no", escalate to `producer` — do not start.

## Phase 3 — Test first
Apply `test-driven-development` skill:
- Write the QA test cases as failing Vitest / Playwright tests.
- Run them. Confirm they fail for the expected reason.

## Phase 4 — Implement
- Smallest change that makes the failing tests pass.
- Honor architectural rules (no `Math.random` in engine; no React in
  engine; JSON-driven data; i18n keys; mobile-first; etc.).
- Apply `incremental-implementation`: one logical commit per slice;
  CI green between slices.

## Phase 5 — Refactor
Once green, apply `code-simplification` if structure improved
(behavior-preserving; one simplification at a time).

## Phase 6 — Self-review
- Run `npm run typecheck && npm run lint && npm test --run`.
- For UI: run `mobile-responsive-check`.
- For engine: ≥ 80% coverage on the changed module.
- For balance: run `balance-check` if numbers changed.

## Phase 7 — Hand off
Invoke `story-done` skill.

## Owner
Whichever specialist agent owns the story. producer dispatches; agent
executes.
