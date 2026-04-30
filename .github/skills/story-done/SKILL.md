---
name: story-done
description: Closes a story by running the full quality gate, marking the SQL todo done, updating the story file with outcome, and notifying `producer`. The "merge button" of the per-story workflow.
---

# Skill: story-done

## When to use
- `dev-story` reports complete and self-review is green.

## Phase 1 — Run the gate
Invoke `gate-check` skill scoped to this story. It will run:
- `code-review` (via `reviewer`)
- relevant skill subset (balance / content / mobile / a11y / perf
  per story type)
- CI verification

## Phase 2 — Resolve gate findings
- APPROVE → continue.
- BLOCK → return to `dev-story` with the findings; do not close.

## Phase 3 — Update story file
At the bottom of `production/stories/<feature>/<NN>-<slug>.md`:
```
## Outcome
- Status: DONE
- Closed: <YYYY-MM-DD>
- Commits: <SHA>, <SHA>
- Tests added/updated: <paths>
- Coverage delta: <%>
- Notable decisions: <inline>
- Follow-ups: <linked todos / bugs>
```

## Phase 4 — SQL todo
```sql
UPDATE todos SET status = 'done', updated_at = CURRENT_TIMESTAMP
WHERE id = '<story-id>';
```

## Phase 5 — Cascade
- Notify `producer` via `agent` tool.
- If story unblocks downstream stories, surface them as next-up.
- If story exposed new bugs, file via `bug-report` skill.
- If story produced a player-visible change, queue an entry for the
  next `changelog` / `patch-notes` run.

## Phase 6 — Final
Hand control back to `producer` for next dispatch.

## Owner
The same agent that ran `dev-story` for this story.
