---
name: design-review
description: Pre-implementation review of a design spec under `docs/design/**`. Verifies the spec is complete (8 required sections), pillar-aligned, internally consistent, and implementable. Returns APPROVE / CONCERNS / REJECT with specific blockers. Run before any code is written for a non-trivial feature.
---

# Skill: design-review

## When to use
- A new spec landed under `docs/design/<system>.md` and needs sign-off.
- A spec has been edited materially since the last review.
- A feature is about to start implementation.

## Required spec sections
Every design spec must contain:
1. **Overview** — one paragraph a new contributor can grok.
2. **Player fantasy** — what the player FEELS (MDA aesthetic served).
3. **Detailed rules** — precise, no hand-waving; an engineer could
   implement from this section alone.
4. **Formulas** — explicit math + variables + ranges + example values.
5. **Edge cases** — minima, maxima, zero, overflow, degenerate
   strategies, mitigations.
6. **Dependencies** — other systems this touches; data flow direction.
7. **Tuning knobs** — values exposed for balance, range, category
   (feel / curve / gate), default rationale.
8. **Acceptance criteria** — both functional ("does it do X") and
   experiential ("does it feel right under playtest").

## Phase 1 — Read the spec + pillar doc
Load `docs/design/pillars.md` and the spec.

## Phase 2 — Section completeness
Score each required section: PRESENT / MISSING / WEAK. Any MISSING
section is a blocker.

## Phase 3 — Pillar alignment
Check the spec against each pillar:
- Which pillar does it primarily serve?
- Does it violate any pillar (or anti-pillar)?
- If a pillar is silent, that's fine.

## Phase 4 — Cross-spec consistency
Search `docs/design/**` for terms this spec introduces. If a term
already has a different meaning, flag the collision.

## Phase 5 — Implementability check
- Are formulas concrete enough that `engine-dev` can write tests?
- Is JSON schema implied? If so, does it match `src/data/schema/**`
  or require a new schema?
- Is i18n handled (no hardcoded zh/en in the spec; reference keys)?
- Mobile-first concerns flagged?

## Phase 6 — Game-designer & level-designer cross-check
For mechanics: does it fit the 5-axis combat invariants in
`copilot-instructions.md` ("Game design invariants")?
For numbers: ask `level-designer` to spot-check the curve / TTK
implications.

## Phase 7 — Verdict
Open the response with:
```
DESIGN-REVIEW: APPROVE | CONCERNS | REJECT
```
Then list:
- **Blockers** (must fix to APPROVE).
- **Concerns** (resolve before ship).
- **Questions** (resolvable in implementation).
- **Strengths** (what's done well).

## Owner
`game-designer` for mechanics; `creative-director` for vision-bearing
specs; `producer` orchestrates.
