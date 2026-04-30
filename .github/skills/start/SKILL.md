---
name: start
description: "**Canonical entry point** for any new session. Detects project stage and routes the user to the right agent + workflow. Reads `Diablo2TextGame.md`, the session `plan.md`, the SQL `todos`, and the latest milestone file. Use this first when you don't know where to begin — it replaces the \"always start with the producer\" pattern."
---

# Skill: start

This is the front door of the studio. There is no "producer agent" you talk to
first; you run `/start` and it puts you in front of the right agent for
the current state of the project.

## When to use
- First action of any new session.
- When you genuinely don't know what to do next.
- After a long pause, to re-orient.

## Phase 1 — Read state (parallel)
- `Diablo2TextGame.md` — canonical scope.
- `.github/copilot-instructions.md` — rules (silently obey).
- `AGENTS.md` — team charter.
- The session `plan.md` — current focus, if any.
- `production/milestones/<current>.md` if present.
- SQL: `SELECT id, title, status FROM todos ORDER BY status, id;`
- `git log --oneline -20` — recent activity.

## Phase 2 — Classify the user's ask
Categorize the message:
- **Vision / identity** ("what should the game feel like?", "is this
  in keeping with the game?") → route to `creative-director`.
- **Tech / architecture** ("which library?", "how should we structure
  X?", "is this performant enough?") → route to `technical-director`.
- **Mechanic / balance / system design** ("how should combat work
  here?", "should this skill scale linearly?") → route to
  `game-designer` (or `level-designer` if it's a tuning ask).
- **Visual / art** ("we need a portrait for X") → route to
  `art-director` (who gates `image-gen`).
- **Story / lore / copy** → `narrative-director` (lore) or `writer` (copy).
- **UX / flow / screen layout** → `ux-designer`.
- **Build a feature / ship a story / sprint planning** → route to
  `producer`.
- **Bug / failing test / weird behavior** → `qa-engineer` (file via
  `bug-report` skill).
- **Don't know yet / multi-faceted** → run Phase 3 stage detection.

## Phase 3 — Detect project stage
- **Fresh** — `Diablo2TextGame.md` missing or `src/` empty. Route to
  `technical-director` (scaffold) and `creative-director` (pillars).
  Suggest `brainstorm` first if scope is fuzzy.
- **Scoping** — design docs sparse, no `docs/design/pillars.md` yet.
  Route to `creative-director` (lock pillars) → `game-designer`
  (system specs).
- **Building** — pillars + specs present, stories in flight. Route
  to `producer` → next ready story via `dev-story`.
- **Polishing** — features shipped, bug list non-trivial. Route to
  `qa-engineer` → `bug-triage`.
- **Shipping** — milestone gate-passed. Route to `producer` →
  `milestone-review` → `changelog` / `patch-notes`.

## Phase 4 — Surface next step (concise output)
Tell the user, in ≤ 6 lines:
- Where the project is (one line).
- Which agent or skill is best next.
- The next 1–3 todos from the SQL list.
- One question if needed (use `ask_user` with concrete options).

## Phase 5 — Hand off
- Invoke the recommended agent via the `agent` tool, OR
- Pause for user direction if `ask_user` was needed.

## Decision examples

| User says… | `start` routes to… |
|---|---|
| "Let's add a Necromancer skill tree." | `producer` → `brainstorm` if no spec, else `create-stories` |
| "I don't like how combat feels." | `creative-director` (frame it) → `game-designer` |
| "Pick a state library." | `technical-director` → `architecture-decision` |
| "Make Andariel's portrait." | `art-director` (gates `image-gen`) |
| "What's the next thing to do?" | look at SQL todos + plan.md; route by Phase 3 stage |
| "Build the inventory screen." | `ux-designer` → `frontend-dev` (after flow doc) |
| "It crashes when I refresh." | `qa-engineer` → `bug-report` |

## Owner
Any agent can run this. It is the front door — no preconditions.
