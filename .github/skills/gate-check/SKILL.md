---
name: gate-check
description: Multi-axis "is this ready to ship?" gate run before a feature merges or a milestone closes. Aggregates verdicts from design-review, code-review, balance-check, content-audit, mobile-responsive-check, accessibility checks, and CI. Returns single APPROVE / BLOCK with the critical path of remaining work.
---

# Skill: gate-check

## When to use
- A feature PR is ready to merge.
- A milestone is about to close.
- Before any release tag.

## Phase 1 — Identify the gate scope
Story-level / Feature-level / Milestone-level. Adjust which sub-checks
run.

## Phase 2 — Run sub-gates (in parallel)
Spawn sub-agents / skills via the `agent` tool in parallel:

| Sub-gate | Owner | Required for |
|---|---|---|
| `design-review` | `game-designer` | Feature / Milestone |
| `code-review` skill | `reviewer` | Story / Feature |
| `balance-check` | `level-designer` | Any combat-numeric change |
| `content-audit` | `content-designer` | Any JSON change |
| `mobile-responsive-check` | `frontend-dev` | Any UI change |
| Accessibility audit | `accessibility-specialist` | Any UI change |
| Performance budget check | `performance-analyst` | Any hot-path change |
| CI green (typecheck / lint / vitest / playwright / build) | `qa-engineer` | All |
| i18n parity (zh-CN + en) | `content-designer` | Any user-visible change |
| Save migration present | `technical-director` | Any save-shape change |

## Phase 3 — Aggregate
Collect each sub-gate's verdict (APPROVE / CONCERNS / REJECT). Any
single REJECT → overall BLOCK.

## Phase 4 — Verdict
```
GATE-CHECK: APPROVE | BLOCK
```
- **Blockers**: list, ordered by impact.
- **Concerns**: list, must be resolved before next milestone if not
  this one.
- **Critical path**: minimal sequence of fixes to unblock.

## Phase 5 — Route
- APPROVE → notify `producer` to merge / tag.
- BLOCK → re-dispatch the failing sub-agents with concrete feedback.

## Owner
`producer`.
