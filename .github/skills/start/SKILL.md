---
name: start
description: "**Canonical entry point** for any new session. Detects project stage, classifies task complexity, and (by default) spins up the studio team rather than going solo. Use this first when you don't know where to begin — it replaces the \"always start with the producer\" pattern. Triggers fleet routing aggressively for any non-trivial multi-domain ask."
---

# Skill: start

This is the front door of the studio. There is no "producer agent" you talk to
first; you run `/start` and it puts you in front of the right agent — or, more
often, in front of the **producer who dispatches the team**.

> **Terminology note.** This repo uses three near-synonyms interchangeably for
> historical reasons: *team*, *fleet*, *studio roster*. They all mean the same
> thing — the set of agents in `.github/agents/*.agent.md`. AGENTS.md uses
> "team charter"; producer.agent.md uses "the fleet"; older skill files say
> "active D2 H5 text-game fleet". When in doubt, say "**team**".

## When to use
- First action of any new session.
- When you genuinely don't know what to do next.
- After a long pause, to re-orient.
- **Whenever the user prefixes a request with `/start`** — including requests
  that look like simple bugfixes. Do not bypass the classifier.

---

## The Prime Rule (read this first, every time)

> **Default to the team. Going solo is the exception, not the default.**

When you see a `/start` request, your *first* instinct must NOT be "I can knock
this out". It must be: **"Which agents on this team are responsible for this,
and have I dispatched them?"**

If you find yourself thinking any of:

- "This is just a frontend tweak."
- "I'll save a turn by doing it myself."
- "It's only four small things."
- "I already know how to fix this."

…**stop**. That is the failure mode. The studio model exists because solo
implementations skip design review, skip rubber-duck, ship dead schema, and
patch symptoms instead of root causes. (See the 2026-04-30 retrospective:
solo path shipped `weaponType`/`handedness` as dead data, masked a blank-
defense bug instead of fixing it, and never ran the relevant Playwright
specs.)

You go solo **only** when *all four* of these are true:

1. The change is in **one file** (or a tightly-coupled pair, e.g. `.tsx` +
   its `.test.tsx`).
2. The change does not modify any **engine type**, **JSON schema**, **store
   contract**, **save format**, **game data**, or **public component API**.
3. The change does not touch **player-visible behavior** beyond a literal
   text/style fix.
4. The user did **not** describe a *quality* problem ("looks bad",
   "feels wrong", "is confusing", "doesn't work") — those are
   `ux-designer` / `game-designer` / `qa-engineer` triggers, not implementation
   triggers.

If any one of those four fails → **route to the team**.

---

## Phase 1 — Read state (parallel)

- `Diablo2TextGame.md` — canonical scope.
- `.github/copilot-instructions.md` — rules (silently obey).
- `AGENTS.md` — team charter.
- The session `plan.md` — current focus, if any.
- `production/milestones/<current>.md` if present.
- SQL: `SELECT id, title, status FROM todos ORDER BY status, id;`
- `git log --oneline -20` — recent activity.

## Phase 2 — Classify the user's ask

### Step 2a — Count the dimensions

Before routing, **count how many of these the request touches**:

- [ ] Multiple files across more than one feature folder
- [ ] Engine type / interface change (`src/engine/types/**`)
- [ ] JSON schema or game-data contract change (`src/data/**`)
- [ ] Store contract change (`src/stores/**`)
- [ ] Save-format-affecting change
- [ ] Player-visible UI/UX change ("looks bad", "improve this", screenshot attached)
- [ ] Mechanic / balance / numbers
- [ ] New asset request (art, audio, copy)
- [ ] Multiple independent items in one bundle (a list of "fix and improve: 1, 2, 3, 4")

| # boxes ticked | Default behavior |
|---|---|
| 0 | Solo allowed iff all four "go solo" conditions hold (above). |
| 1 | Route to the **owning specialist** (Tier 2 lead or Tier 3). |
| ≥ 2 | Route to **`producer`** → fleet dispatch. **Mandatory.** |

If "≥ 2" applies, **do not implement anything yourself before producer plans
the work**. Even if individual items look small.

### Step 2b — Map to owning agent

- **Vision / identity** ("what should the game feel like?", "is this in
  keeping with the game?") → `creative-director`.
- **Tech / architecture / cross-cutting refactor / engine-type change** →
  `technical-director`.
- **Mechanic / balance / system design** → `game-designer`
  (`level-designer` for tuning).
- **Visual / art** → `art-director` (gates `image-gen`).
- **Story / lore / copy** → `narrative-director` (lore) or `writer` (copy).
- **UX / flow / screen layout / "this UI looks bad" / "improve this UI"** →
  `ux-designer`. *Never patch UI quality complaints solo.*
- **Build a feature / ship a story / sprint planning / multi-item bundle** →
  `producer`.
- **Bug / failing test / weird behavior** → `qa-engineer` (file via
  `bug-report` skill); if root-cause unclear, also bring in `rubber-duck`.
- **Don't know yet / multi-faceted** → run Phase 3 stage detection AND
  default to `producer`.

## Phase 3 — Detect project stage

- **Fresh** — `Diablo2TextGame.md` missing or `src/` empty. Route to
  `technical-director` (scaffold) and `creative-director` (pillars).
  Suggest `brainstorm` first if scope is fuzzy.
- **Scoping** — design docs sparse, no `docs/design/pillars.md` yet.
  Route to `creative-director` (lock pillars) → `game-designer` (system
  specs).
- **Building** — pillars + specs present, stories in flight. Route to
  `producer` → next ready story via `dev-story`.
- **Polishing** — features shipped, bug list non-trivial. Route to
  `qa-engineer` → `bug-triage`.
- **Shipping** — milestone gate-passed. Route to `producer` →
  `milestone-review` → `changelog` / `patch-notes`.

## Phase 4 — Mandatory rubber-duck for any non-trivial work

If the answer to Phase 2 was anything other than "solo, all four conditions
hold", you **must** call the `rubber-duck` agent on the proposed plan
*before* dispatching specialists. The producer can do this; if you're routing
to a single specialist, you do it.

The rubber-duck pass is non-optional for:

- Engine-type / schema / save-format changes
- "Improve this UI" / "this looks bad" requests
- Bug fixes where you haven't identified the root cause yet
- Any bundle of ≥ 2 items

This is not bureaucracy. It is the cheapest insurance in the studio.

## Phase 5 — Surface next step (concise output)

Tell the user, in ≤ 6 lines:

- Where the project is (one line).
- **Which agent or team is being dispatched** (and *why*, if the
  classifier flagged ≥ 2 dimensions).
- The next 1–3 todos from the SQL list.
- One question if needed (use `ask_user` with concrete options).

Be explicit when going to the team: e.g. "Routing to **producer** → will
parallel-dispatch `ux-designer` (#4 redesign), `technical-director` (#2
schema), `game-designer` (#3 weapon-subtype spec), `frontend-dev` (#1
nav)." This makes the choice auditable.

## Phase 6 — Hand off

- Invoke the recommended agent via the `agent` tool, OR
- Pause for user direction if `ask_user` was needed.

If you dispatched a single Tier-2 specialist and they come back with a
plan that turns out to span multiple domains, **escalate to producer**.
Don't quietly absorb the extra work.

---

## Decision examples

| User says… | Boxes ticked | Routes to… |
|---|---|---|
| "Let's add a Necromancer skill tree." | 4+ | `producer` → `brainstorm` if no spec, else `create-stories` |
| "I don't like how combat feels." | 2 (UX, mechanic) | `creative-director` (frame) → `game-designer` |
| "Pick a state library." | 1 (architecture) | `technical-director` → `architecture-decision` |
| "Make Andariel's portrait." | 1 (art) | `art-director` (gates `image-gen`) |
| "What's the next thing to do?" | — | look at SQL todos + plan.md; route by Phase 3 stage |
| "Build the inventory screen." | 3 (UI, store, UX) | `producer` → `ux-designer` → `frontend-dev` |
| "It crashes when I refresh." | 1 (bug) | `qa-engineer` → `bug-report` |
| **"fix and improve: 1. HUD on devtool, 2. devtool image override, 3. weapon subtypes, 4. this UI looks bad <screenshot>"** | **5+** | **`producer` → fleet** (`ux-designer` for #4, `technical-director` for #2 schema, `game-designer` for #3, `frontend-dev` for #1; `qa-engineer` runs Playwright after) |
| "Rename a CSS class on one button." | 0 | solo (all four conditions hold) |

The bolded row is the exact ask that previously caused a solo failure. It must
route to the team. No exceptions.

---

## Self-check before you implement anything

Answer these out loud (in your reply) before writing code:

1. How many Phase 2a boxes did this tick?
2. Which agents own those dimensions?
3. Did I run `rubber-duck` on the plan?
4. If I'm going solo, do all four conditions hold? (If not, stop.)

If you cannot answer all four cleanly, you are not ready to implement.
Route to `producer`.

## Owner

Any agent can run this. It is the front door — no preconditions.
