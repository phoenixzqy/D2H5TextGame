---
name: architecture-decision
description: Records an irreversible technical decision as an Architecture Decision Record under `docs/decisions/ADR-NNN-<slug>.md`. Use when a stack choice, data-shape choice, or cross-cutting pattern is being locked in. ADRs are append-only — superseded ADRs link forward, never get deleted.
---

# Skill: architecture-decision

## When to use
- A tech stack choice is being locked (state mgmt, persistence, build,
  routing, testing, deploy target).
- A data-shape decision affects multiple modules (save format, JSON
  schema versioning, RNG strategy).
- A cross-cutting pattern is being standardized (error handling, i18n
  loading, worker IPC).

## When NOT to use
- Mechanic / balance decisions — those go in `docs/design/`.
- Visual style decisions — those go in `docs/art/`.
- Sprint-level choices — those go in `production/`.

## Required ADR sections
1. **Title** — short, imperative ("Use Zustand for global state").
2. **Status** — Proposed / Accepted / Deprecated / Superseded by
   ADR-NNN.
3. **Context** — what problem, what constraints (link spec / pillar).
4. **Decision** — the choice, in one paragraph.
5. **Alternatives considered** — at least 2 others, with rejection
   reason each.
6. **Consequences** — both positive and negative; what doors close.
7. **Compliance** — how reviewers will detect drift later (lint rule,
   test, code-search pattern).

## Phase 1 — Number the ADR
Find the highest existing `ADR-NNN-*.md` under `docs/decisions/`.
Allocate the next integer.

## Phase 2 — Draft
Use the template above. Cite source URLs (vendor docs, RFCs, blog
posts) and our project artefacts (specs, pillars).

## Phase 3 — Sign-off
- `technical-director` is the typical owner.
- `creative-director` co-signs if the decision touches identity (e.g.
  "we will not support multiplayer").
- `producer` co-signs the schedule impact.

## Phase 4 — Cascade
- Notify affected agents via `agent` tool.
- Update `.github/copilot-instructions.md` if the decision becomes a
  permanent rule (e.g. "no Math.random in engine").
- Add a compliance check (lint rule, test, grep pattern) if feasible.

## Phase 5 — Supersession
When an ADR is later overridden:
- Do NOT delete the old file.
- Set its status to `Superseded by ADR-NNN`.
- The new ADR cites the predecessor.

## Owner
`technical-director`. `producer` enforces presence in PRs that should have one.
