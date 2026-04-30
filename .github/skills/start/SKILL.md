---
name: start
description: "**Canonical entry point** for any new session. Detects project stage and routes the user to the right agent + workflow. Reads `Diablo2TextGame.md`, the session `plan.md`, the SQL `todos`, and the latest milestone file. Use this first when you don't know where to begin — it replaces the \"always start with the producer\" pattern."
---

# Skill: start

The studio's front door. Run this first; it routes you to the right agent
for the current state of the project. No preconditions.

## When to use
- First action of any new session, or after a long pause.
- When you genuinely don't know what to do next.

## Phase 1 — Read state (issue these reads in parallel)
- `Diablo2TextGame.md` — canonical scope.
- `.github/copilot-instructions.md` — rules (silently obey).
- `AGENTS.md` — team charter.
- The session `plan.md` — current focus, if any.
- `production/milestones/<current>.md` if present.
- SQL (only if `todos` table exists): `SELECT id, title, status FROM todos ORDER BY status, id;`
- `git log --oneline -20` and `git status --short` — recent activity + dirty tree.

## Phase 2 — Classify the user's ask, then route
Pick the **first** category that fits. If none fit, fall through to Phase 3.

| Category | Example asks | Route to |
|---|---|---|
| Vision / identity | "what should the game feel like?", "is this in keeping with the game?" | `creative-director` |
| Tech / architecture | "which library?", "how should we structure X?", "is this fast enough?" | `technical-director` (often via `architecture-decision`) |
| Mechanic / system design | "how should combat work here?", "should this skill scale linearly?" | `game-designer` |
| Numerical tuning / balance | "Andariel feels too tanky", "drop rates wrong" | `level-designer` (via `balance-check`) |
| Visual / art | "we need a portrait for X" | `art-director` (gates `image-gen`) |
| Story / lore | world rules, character arcs | `narrative-director` |
| Player-facing copy | tooltips, item flavor, NPC lines | `writer` |
| UX / flow / screen layout | "design the inventory screen" | `ux-designer` → `frontend-dev` |
| Build / ship / plan | "add Necromancer skill tree", "what's next?" | `producer` |
| Bug / failing test | "it crashes on refresh" | `qa-engineer` (via `bug-report`) |

## Phase 3 — Stage detection (only when Phase 2 is ambiguous or multi-faceted)
- **Scoping** — `docs/design/pillars.md` missing or system specs sparse →
  `creative-director` (lock pillars) → `game-designer` (system specs).
- **Building** — pillars + specs present, stories in flight →
  `producer` → next ready story via `dev-story`.
- **Polishing** — features shipped, bug list non-trivial →
  `qa-engineer` → `bug-triage`.
- **Shipping** — milestone gate-passed →
  `producer` → `milestone-review` → `changelog` / `patch-notes`.
- **Fresh scaffold** (rare in this repo) — if `src/` is missing core
  modules, route to `technical-director`; if scope itself is fuzzy,
  start with `brainstorm`.

## Phase 4 — Surface next step
After routing is decided, summarize for the user:
- One line: where the project is.
- One line: which agent or skill is next, and why.
- 1–3 next ready todos from SQL (if any).
- One `ask_user` question with concrete options **only if a decision is
  needed before handing off**. Otherwise hand off directly.

## Phase 5 — Hand off
- Suggest `/agent <name>` (or invoke via the `task` tool from inside an
  agent) to transfer control. The Copilot CLI does not expose a generic
  "agent" tool — use `task` from within an agent, or the `/agent` slash
  command from the user.
- If `ask_user` was needed, stop and wait — do not pre-empt the answer.

## Owner
Any agent (or the user) can run this. It is the front door.
