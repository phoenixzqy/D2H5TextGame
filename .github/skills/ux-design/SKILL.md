---
name: ux-design
description: Author a user-flow spec for a screen or feature under `docs/design/ux/flows/<name>.md`. Defines the screen graph, decision points, affordances, copy keys, and accessibility notes. Mobile-first 360×640 — desktop is a strict superset. Hand to `frontend-dev` for implementation; pair with `art-director` for visuals.
---

# Skill: ux-design

## When to use
- A new screen / feature is being designed.
- A flow is being reworked because telemetry / playtest revealed friction.

## Required sections
1. **Surface** — name + entry points (where does the player arrive
   from?).
2. **Goals** — what the player accomplishes here.
3. **Pillar served** — which `docs/design/pillars.md` pillar.
4. **Flow diagram** — numbered step list:
   `[entry state] → action → [next state] → … → [exit state]`.
   Include unhappy paths (cancel, error, no-network, mid-action save).
5. **Wireframe** — ASCII / text spec at 360×640.
6. **Decision points** — where the player chooses; cap ≤ 4 primary
   actions per screen.
7. **Affordances** — per interactable: tap / hold / swipe / hover /
   keyboard equivalent.
8. **Copy** — i18n keys (not literal strings); length budgets in
   zh-CN chars + en chars.
9. **Accessibility** — keyboard order, ARIA roles, landmarks,
   live-region announcements.
10. **Mobile vs desktop deltas** — what changes at the breakpoint
    (typically nav placement, density).
11. **Components** — list of new vs reused (`src/ui/**`).
12. **Hand-off notes** — for `frontend-dev`, `art-director`, `writer`.

## Phase 1 — Read pillars + adjacent flows
Don't design in isolation. Read other `docs/design/ux/flows/*.md` for
consistency in nav, gestures, and copy patterns.

## Phase 2 — Storyboard
Walk a representative user (new char / mid-tier / endgame) through
the flow on paper / in your head. Note every friction point.

## Phase 3 — Apply heuristics
- Hick's Law: ≤ 5 top-level menu items.
- Fitts's Law: critical actions in lower 2/3 thumb zone.
- Recognition over recall: never make the player remember a number.
- Progressive disclosure: hide expert detail behind taps.
- Touch target ≥ 44×44 px; spacing ≥ 8 px.

## Phase 4 — Write the spec
Use the template above. Save to
`docs/design/ux/flows/<name>.md`.

## Phase 5 — Hand off
- `art-director` for visual treatment.
- `writer` for player-facing copy.
- `accessibility-specialist` for a11y review.
- `frontend-dev` for implementation.

## Owner
`ux-designer`.
