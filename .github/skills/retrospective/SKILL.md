---
name: retrospective
description: Captures lessons learned from a milestone or feature in a no-blame format. Identifies what worked, what didn't, and concrete process changes for next iteration. Output lands in `production/retrospectives/<yyyy-mm-dd>-<scope>.md`.
---

# Skill: retrospective

## When to use
- After a milestone closes (`milestone-review` complete).
- After a major feature ships and the team is still warm on context.
- After a major bug or production incident.

## Format (Start / Stop / Continue + Action items)

### Phase 1 — Gather signal
- Closed bug count, severity distribution.
- Story cycle time (created → done).
- CI flake rate.
- Number of `code-review` REJECT verdicts.
- Sub-agent stalls / re-dispatches.
- User-flagged confusion points.

### Phase 2 — Start
What should we *start* doing next milestone?
(New skill, new gate, new agent, new convention.)

### Phase 3 — Stop
What should we *stop* doing?
(Anti-patterns, ceremonies that don't pay off, premature optimizations.)

### Phase 4 — Continue
What's working that we should keep?
(Particular skills, agents, conventions.)

### Phase 5 — Action items
Each action: owner, deliverable, due-by-milestone.
Capture as todos in the SQL `todos` table for tracking.

### Phase 6 — Update process
If the retro identifies a process change:
- Update `.github/copilot-instructions.md` (rules).
- Update `.github/agents/<name>.agent.md` (charters).
- Update `.github/skills/<name>/SKILL.md` (workflows).
- Or write a new skill via `skill-creator`.

### Phase 7 — Capture
Write `production/retrospectives/<yyyy-mm-dd>-<scope>.md`. Append-only;
do not edit historical retros.

## Tone
No blame. We are in this together. Critique systems, not people.

## Owner
`producer`.
