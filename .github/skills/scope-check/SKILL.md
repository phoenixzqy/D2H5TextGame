---
name: scope-check
description: Quick sanity check that a proposed change stays within `Diablo2TextGame.md` scope and the current milestone's targets. Catches scope creep early. Returns IN-SCOPE / EXTENDS-SCOPE / OUT-OF-SCOPE with rationale.
---

# Skill: scope-check

## When to use
- A new feature request lands.
- A sub-agent's plan introduces something not in the current
  milestone backlog.
- A "while I'm at it…" suggestion appears.

## Phase 1 — Locate
Find the request in:
1. `Diablo2TextGame.md` (canonical scope).
2. `production/milestones/<current>.md` (or session `plan.md`).
3. `docs/design/**` (existing specs).

## Phase 2 — Classify
- **IN-SCOPE**: explicitly listed in `Diablo2TextGame.md` AND in the
  current milestone.
- **EXTENDS-SCOPE**: in `Diablo2TextGame.md` but NOT in current
  milestone — needs `producer` to schedule.
- **OUT-OF-SCOPE**: not in `Diablo2TextGame.md` at all — needs
  `creative-director` + `producer` sign-off, or rejection.

## Phase 3 — Cost / value triage
For EXTENDS-SCOPE or OUT-OF-SCOPE items:
- Estimated cost (XS / S / M / L / XL).
- Pillar alignment (which pillar served / sacrificed).
- Risk of *not* doing it.
- Recommendation: defer / promote into milestone / reject.

## Phase 4 — Verdict
```
SCOPE-CHECK: IN-SCOPE | EXTENDS-SCOPE | OUT-OF-SCOPE
```
With a one-paragraph rationale and a routing decision (who needs to
sign off, by when).

## Owner
`producer`. Block any agent that ignores an OUT-OF-SCOPE verdict.
