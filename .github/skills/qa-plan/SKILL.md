---
name: qa-plan
description: Pre-implementation QA brief for a feature. Pairs with the design spec; turns acceptance criteria into concrete test cases (unit / integration / E2E / mobile / a11y / balance-sim) with seeds and expected outputs. Hand to `engine-dev` / `frontend-dev` so they can write code that's testable, then `qa-engineer` runs it.
---

# Skill: qa-plan

## When to use
- A design spec is APPROVED and ready to implement.
- Before any code lands for a non-trivial feature.

## Phase 1 — Read inputs
- The design spec (`docs/design/<system>.md`).
- The story file (if any) under `production/stories/`.
- Existing tests in the touched areas (`src/engine/**/*.test.ts`,
  `tests/**`).

## Phase 2 — Extract testable acceptance criteria
For each functional acceptance criterion, define one or more test
cases. For each experiential criterion, define a manual playtest
checklist or an automated proxy (e.g. simulated DPS within ±15% of
target → "feels balanced").

## Phase 3 — Test-case template
Each test case carries:
- **ID** (`tc-<feature>-<n>`)
- **Type** (unit / integration / E2E / mobile-E2E / a11y / balance-sim
  / manual)
- **Setup** (seed, fixture, navigation)
- **Action**
- **Expected** (deterministic — never wall-clock, never `Math.random`)
- **Tooling** (Vitest / Playwright / `combat-balance` skill / axe-core
  / `mobile-responsive-check`)

## Phase 4 — Coverage matrix
Build a matrix: acceptance criterion × test case × type. Every
criterion must be covered by at least one automated case where
feasible.

Required coverage axes:
- **Happy path** — golden flow.
- **Edge cases** — zero, max, overflow, immunity, dodge=100%, OOM.
- **Mobile viewport** — at 360×640 + 412×915.
- **Desktop viewport** — at 1280×800.
- **Accessibility** — keyboard / screen-reader / contrast / reduced-motion.
- **i18n** — zh-CN AND en, no truncation.
- **Save/load** — does state survive a hard refresh?
- **Determinism** — fixed-seed run twice → identical outcome.

## Phase 5 — Determinism rules (block ship if violated)
- Seeded RNG via `engine/rng.ts`. No `Math.random` anywhere.
- No wall-clock dependence. Use injected clock for test.
- Tests clean IndexedDB before each case.
- No `await new Promise(r => setTimeout(r, X))` — wait on actual
  state.

## Phase 6 — Output
Write the plan to `production/stories/<feature>/qa-plan.md`. Hand it
to:
- `engine-dev` / `frontend-dev` for implementation hooks.
- `qa-engineer` for execution.
- `accessibility-specialist` for a11y rows.
- `level-designer` for balance-sim rows.

## Verdict
```
QA-PLAN: APPROVE | INCOMPLETE
```
APPROVE only when every acceptance criterion has at least one
automated case (or a justified manual-only entry).

## Owner
`qa-engineer`.
