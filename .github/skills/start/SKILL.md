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
- Backlog / todo state (check `manage_todo_list` or `production/` directory).
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

### Step 2c — Detect parallelizable tracks (if ≥2 dimensions)

**Critical for fleet mode:** Not all multi-dimensional requests are sequential.
Check if work can split into **independent parallel tracks** that will
eventually gate-merge. Examples:

- **Art + Dev parallel track**: `art-director` generates images while
  `engine-dev` / `frontend-dev` implement core logic without graphics;
  `frontend-dev` integrates images in Phase 2.
- **Design + Implementation parallel track**: `game-designer` authors skill
  spec while `content-designer` and `engine-dev` build system scaffold in
  parallel; spec review gates merge.
- **Balance + Content parallel track**: `level-designer` tunes damage/TTK
  tables while `content-designer` populates monsters/items; both feed into
  `balance-check` before gate.

**Parallel work indicators:**
- Task A produces **specifications or assets** that Task B will *integrate*
  (not block on).
- Task A and B **share no mutable state** until the gate.
- Task A and B can **ship intermediate artifacts** (spec review, asset
  review, code scaffolds) without full interdependency.

If you spot a parallelizable split, **explicitly surface it to producer** so
they dispatch both tracks immediately (do not queue them sequentially). The
producer will assign a **Phase-5 gate** (post-implementation merge point) to
verify integration before merge.

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

## Phase 4 — Verify plan before dispatch (optional rubber-duck)

If the answer to Phase 2 was anything other than "solo, all four conditions
hold", consider a quick mental rubber-duck check before dispatching:

- **Engine-type / schema / save-format changes** — Have you thought through
  breaking changes and migrations?
- **"Improve this UI" / "this looks bad" requests** — Have you identified the
  root UX problem, or are you guessing?
- **Bug fixes where root cause is unclear** — Could this be a symptom of a
  deeper issue?
- **Any bundle of ≥ 2 items** — Have you identified independence / ordering?

If uncertain, escalate to `producer` or ask for 5 minutes of thinking time
from the responsible specialist *before* full dispatch. This is not
bureaucracy; it is the cheapest insurance in the studio.

## Phase 5 — Surface next step (concise output)

Tell the user, in ≤ 8 lines:

- Where the project is (one line).
- **Which agent or team is being dispatched** (and *why*, if the
  classifier flagged ≥ 2 dimensions).
- If ≥ 2 dimensions AND parallelizable: **explicitly call out the parallel
  tracks** ("Art and Dev can work in parallel; Phase-5 gate is image
  integration"). This is not optional — makes the choice auditable and
  unblocks the producer to dispatch both immediately via `runSubagent`.
- The next 1–3 backlog items.
- One question if needed (use `vscode_askQuestions` with concrete options).

Be explicit when going to the team: e.g. "Routing to **producer** →
**parallel dispatch**: `art-director` (generate UI mockup sprites) and
`technical-director` (schema for inventory-slot types); both review independently
while `frontend-dev` scaffolds. Phase-5 gate merges."
This makes the choice auditable **and enables simultaneous work**.

## Phase 6 — Hand off

- Invoke the recommended agent via `runSubagent` with the agent name, OR
- Pause for user direction if `vscode_askQuestions` was needed.

If you dispatched a single Tier-2 specialist and they come back with a
plan that turns out to span multiple domains, **escalate to producer**.
Don't quietly absorb the extra work.

**Dispatch syntax:** Use `runSubagent` with `agentName` set to the agent's
name (e.g., `producer`, `game-designer`, `technical-director`). Pass the
classified request + parallel-track info in the prompt.

---

## Decision examples

| User says… | Boxes ticked | Routes to… | Parallel track? |
|---|---|---|---|
| "Let's add a Necromancer skill tree." | 4+ | `producer` → `brainstorm` if no spec, else `create-stories` | Yes: `game-designer` spec + `art-director` portrait ⇒ `frontend-dev` implement |
| "I don't like how combat feels." | 2 (UX, mechanic) | `creative-director` (frame) → `game-designer` | — |
| "Pick a state library." | 1 (architecture) | `technical-director` → `architecture-decision` | — |
| "Make Andariel's portrait." | 1 (art) | `art-director` (gates `image-gen`) | — |
| "What's the next thing to do?" | — | look at SQL todos + plan.md; route by Phase 3 stage | — |
| "Build the inventory screen." | 3 (UI, store, UX) | `producer` → `ux-designer` + `technical-director` (schema) in parallel, then `frontend-dev` integrates | Yes: design + schema can spec independently, dev scaffolds while specs review |
| "It crashes when I refresh." | 1 (bug) | `qa-engineer` → `bug-report` | — |
| **"Add skill affixes: need UI, new JSON schema, item integration & balance check"** | **5+** | **`producer` → parallel tracks: (1) `ux-designer` mockup + `art-director` icon sprites ⇒ `frontend-dev` implement, (2) `game-designer` + `technical-director` schema + `level-designer` balance ⇒ `content-designer` populate; Phase-5 gate merges both** | **Yes: design/art independent of schema/balance; both gate before merge** |
| "Rename a CSS class on one button." | 0 | solo (all four conditions hold) | — |

The bolded row is the exact ask that previously caused a solo failure. It must
route to the team. No exceptions.

---

## Self-check before you implement anything

Answer these out loud (in your reply) before writing code:

1. How many Phase 2a boxes did this tick?
2. Which agents own those dimensions?
3. **Can any of those dimensions work in parallel?** (Phase 2c — check for
   art/dev splits, design/implementation splits, etc.)
4. Did I vet the plan briefly? (Phase 4 self-check — unclear root cause,
   missing dependencies, etc.?)
5. If I'm going solo, do all four conditions hold? (If not, stop.)

If you cannot answer all five cleanly, you are not ready to implement.
Route to `producer` with explicit parallel-work identification.

## Owner

Any agent can run this. It is the front door — no preconditions.
