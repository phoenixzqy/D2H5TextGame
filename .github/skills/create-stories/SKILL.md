---
name: create-stories
description: Decompose an approved design spec into actionable story files under `production/stories/<feature>/<n>-<slug>.md`. Each story is independently shippable, has clear acceptance criteria, and lists pre-written QA test cases. Pairs with `dev-story` (execute) and `story-done` (close).
---

# Skill: create-stories

## When to use
- A design spec is APPROVED (`design-review: APPROVE`).
- Implementation is about to start.

## Story principles
- **Vertical slice** — each story ships an end-to-end behavior the
  player can perceive (or, for engine-only work, the
  `engine-dev`/`qa-engineer` can demonstrate via test).
- **Small** — target ≤ 1 day of focused work for a single specialist
  agent. Larger → split.
- **Testable** — every story has automated coverage in its definition
  of done.
- **Dependent stories ordered** — encode dependencies in the SQL
  `todo_deps` table.

## Required story sections
1. **Title**
2. **Spec link** (`docs/design/<system>.md`)
3. **Story type** — Logic / Integration / Visual / Feel / Config /
   Content
4. **Owner agent** (engine-dev / frontend-dev / content-designer / etc.)
5. **Acceptance criteria** — bulleted, testable
6. **QA test cases** — pre-written test specs (from `qa-plan`)
7. **Files expected to change** (best-effort)
8. **Dependencies** (other story IDs)
9. **Out of scope** (defensive — what this story does NOT do)
10. **Definition of done** — green CI, code-review APPROVE,
    gate-check APPROVE, story-done invoked

## Phase 1 — Read the spec
Find the latest APPROVED spec.

## Phase 2 — Decompose
Break by:
- **Layer** (engine module / store / UI screen / JSON content / test).
- **Capability** (one user-perceptible verb per story).
- **Risk** (isolate experimental bits in their own story).

## Phase 3 — Pre-write QA cases
Use `qa-plan` to draft the tests inline in each story so the
implementer knows the bar. Don't wait until after coding.

## Phase 4 — Order
Encode dependencies. The first story should be the smallest one that
unblocks others (often the engine type / store contract).

## Phase 5 — File
Create `production/stories/<feature>/<NN>-<slug>.md` per story.
Insert into SQL todos:
```sql
INSERT INTO todos (id, title, description) VALUES
  ('<feature>-<slug>', '<title>', 'See production/stories/<path>');
INSERT INTO todo_deps (todo_id, depends_on) VALUES
  ('<feature>-<slug>', '<dep>');
```

## Phase 6 — Hand off
producer dispatches story 1 via `dev-story`.

## Owner
`producer` decomposes; `game-designer` / `technical-director` consult on slicing.
