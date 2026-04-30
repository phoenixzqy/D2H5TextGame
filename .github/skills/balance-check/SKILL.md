---
name: balance-check
description: Numerical balance audit of a proposed change to skills, monsters, items, drop tables, or progression curves. Runs the `combat-balance` simulation harness with before/after configs and reports DPS, TTK, death rate, drops/hour deltas. Block ship if invariants break.
---

# Skill: balance-check

## When to use
- Any numeric change to: skill formulas, monster stats, item affixes,
  drop tables, progression curves, difficulty multipliers.
- Before `reviewer` signs off on a balance PR.
- After a `game-designer` skill rewrite.

## Hard invariants (block ship if breached)
- No single damage type out-DPSes the next-best by > 15% at equal
  investment.
- No single skill > 2× DPS of class-average at the same tier.
- No gear slot accounts for > 25% of total player power.
- Resist cap reachable by mid-game (act 3 Normal).
- Build viability floor: every advertised build clears the next zone
  within ±20% of the meta build's clear time.
- Difficulty scaling: Nightmare mob HP ≈ 1.7×, Hell ≈ 3.0×; mob dmg
  1.5× / 2.3×; player resist −40 / −100 (D2-faithful).

## Phase 1 — Identify scope
What's changing? Skills / monsters / items / drops / curves? Which
zones / tiers / classes are affected?

## Phase 2 — Snapshot baseline
Capture the *current* numbers via `combat-balance` simulation.
Required outputs:
- median DPS by class × tier
- p50 / p95 TTK by zone
- death rate (% of runs where player dies)
- drops/hour by rarity (white / magic / rare / unique / set / rune)
- mana-starved % (combat rounds where player ran OOM)

## Phase 3 — Apply proposed change
Either point the simulator at the candidate JSON or pass the formula
delta directly.

## Phase 4 — Simulate ≥ 1000 runs per scenario
Use a fixed seed grid for reproducibility. Cover at minimum:
- New character on-level vs. on-zone.
- Mid-tier character on-level vs. on-zone.
- BiS character vs. on-zone.
- Each scenario at Normal / Nightmare / Hell.

## Phase 5 — Diff
Produce a Markdown table: metric × scenario × before × after × delta %.
Highlight any metric that crossed an invariant threshold.

## Phase 6 — Verdict
```
BALANCE-CHECK: APPROVE | CONCERNS | REJECT
```
- **Blockers**: invariants broken. Must fix.
- **Concerns**: tuning drift > 10% on any non-target metric — review
  intent.
- **Findings**: what improved.
- **Recommendation**: ship / re-tune / request alternate change.

## Phase 7 — Capture
Append the report to `docs/balance/<yyyy-mm-dd>-<scope>.md` so future
tuning passes know the historical baseline.

## Owner
`level-designer` runs; `qa-engineer` verifies the sim harness;
`game-designer` interprets if invariants are intentionally being moved.
