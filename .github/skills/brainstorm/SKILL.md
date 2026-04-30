---
name: brainstorm
description: Structured exploration of a new feature or system before any spec is written. Use when scope is fuzzy, multiple valid approaches exist, or the user has only a hunch. Produces 2–4 framed options with pros/cons grounded in MDA / SDT / Flow theory and D2 / ARPG precedent — never one premature recommendation.
---

# Skill: brainstorm

## When to use
- A feature is requested but the *shape* is unclear.
- Multiple valid approaches exist and the trade-offs aren't obvious.
- The user wants to "explore" before committing.

## When NOT to use
- The decision is already made — go to `spec-driven-development` instead.
- The work is mechanical (e.g. "add this monster from the list") — go
  straight to `dev-story`.

## Phases

### Phase 1 — Frame the question
- Read `Diablo2TextGame.md`, `docs/design/pillars.md`, and any related
  existing specs.
- State the *goal* (what player experience), the *constraint* (mobile-
  first / pure-TS engine / single codebase), and the *unknown* (what's
  fuzzy).
- Identify which pillars / aesthetics this should serve.

### Phase 2 — Reference scan
- Cite 2–3 ARPG or idle-game precedents that solved a similar problem
  (D2 itself, PoE, Last Epoch, Hades, idle-ARPGs).
- Note specifically what they did well and what failed.

### Phase 3 — Generate 2–4 options
For each option, produce:
- **Concept** (one-line summary).
- **What the player experiences** (concrete moment).
- **Mechanic sketch** (rules, formulas if known).
- **Aesthetic served** (MDA category — Challenge / Discovery / Fantasy / etc.).
- **SDT need served** (Autonomy / Competence / Relatedness).
- **Pillar alignment** (which pillars it serves vs. sacrifices).
- **Risks** (degenerate strategies, scope balloon, dissonance).
- **Effort** (XS / S / M / L / XL).

### Phase 4 — Recommend
- State your pick + reasoning.
- Acknowledge what you're sacrificing.
- Hand the call to the user with `ask_user`.

### Phase 5 — Capture
- Once the user picks, draft a short Markdown brief at
  `docs/design/brainstorms/<yyyy-mm-dd>-<topic>.md` so the chosen path
  is auditable. Include the rejected options + why-rejected so we
  don't re-explore them in 3 months.
- Hand off to `spec-driven-development` for the actual spec.

## Owner
`producer` (typical caller). `creative-director` and `game-designer` are the
typical experts to invoke.

## Output format
Markdown brief in conversation; final captured file under
`docs/design/brainstorms/`. No code in this skill.
