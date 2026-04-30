---
name: sprint-plan
description: Plans a focused sprint (a coherent slice of a milestone) by selecting stories from the backlog, ordering by dependency, assigning owner agents, and committing to a definition of done. Output lands in `production/sprints/<yyyy-mm-dd>-<topic>.md`. We don't track time estimates.
---

# Skill: sprint-plan

## When to use
- Starting a new sprint inside an active milestone.
- After `milestone-review` if continuing the same milestone.

## Phase 1 — Sprint goal
One sentence: what player-perceptible capability does this sprint
deliver? Examples:
- "Player can create a Necromancer, enter act 1, and kill act 1
  monsters."
- "Inventory + stash + vendor work end-to-end at 360×640."

## Phase 2 — Pull stories
From `production/stories/` and the SQL todos:
- Stories that advance the sprint goal.
- Stories whose dependencies are already met.
- A small buffer of stories from adjacent areas if a primary owner
  has spare capacity.

## Phase 3 — Owner allocation
For each story, name the primary specialist agent. Avoid loading any
single agent with > 40% of the sprint mass.

## Phase 4 — Risk register
List the top 3 risks (technical debt, unknown engine work, content
gap, art bottleneck via `art-director`). For each, owner + mitigation.

## Phase 5 — Definition of done (sprint)
- All committed stories CLOSED via `story-done`.
- `gate-check: APPROVE` on the sprint branch.
- `smoke-check: PASS` on a fresh build.
- `CHANGELOG.md` updated.
- A 5-line `sprint-status` written for next-up planning.

## Phase 6 — Capture
Write `production/sprints/<yyyy-mm-dd>-<topic>.md` with:
- Goal
- Stories committed (IDs + owners)
- Risks
- Definition of done
- Out-of-sprint deferrals (linked back to backlog)

## Owner
`producer`.
