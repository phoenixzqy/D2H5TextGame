---
name: milestone-review
description: Closes out a milestone with a structured review. Verifies all in-scope features shipped, gate-checks passed, bugs triaged, and produces a milestone retrospective handoff. Run before tagging the milestone build.
---

# Skill: milestone-review

## When to use
- A milestone (e.g. M1 — Town & combat MVP) is approaching its target.
- All in-scope stories report DONE.

## Phase 1 — Inventory
- List every story in the milestone (from `production/milestones/<id>.md`
  or session `plan.md`).
- For each: status, owner, gate-check verdict, test coverage, bug count.

## Phase 2 — Verify scope
- Cross-check against `Diablo2TextGame.md`.
- Anything in scope that didn't ship → flag for next milestone or cut
  formally.

## Phase 3 — Quality gates
For each shipped feature, confirm:
- `gate-check: APPROVE`
- All `BUG-NNN` Critical / High closed or formally deferred with `producer`
  sign-off.
- CI green on the milestone branch.
- `smoke-check: PASS` on a fresh build.

## Phase 4 — Player-facing changelog
Run `changelog` skill to produce `CHANGELOG.md` entries. Run
`patch-notes` for the player-facing zh-CN/en notes.

## Phase 5 — Health metrics
- Bundle size delta vs. previous milestone (`performance-analyst`).
- Test coverage on `src/engine/**` (target ≥ 80%).
- Lighthouse mobile + desktop scores.

## Phase 6 — Verdict
```
MILESTONE-REVIEW: SHIP | HOLD
```
- **Shipped**: list features.
- **Held**: list with reason.
- **Carry-over**: items moving to next milestone.

## Phase 7 — Hand off
Run `retrospective` skill to capture lessons learned.

## Owner
`producer`.
