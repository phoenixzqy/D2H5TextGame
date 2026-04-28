---
name: combat-balance
description: Run deterministic combat simulations against the engine to evaluate balance changes (DPS, time-to-kill, death rate, drop rate). Use whenever the game-designer proposes formula changes or new skills/items, or when QA needs balance evidence before sign-off.
allowed-tools: shell
---

# Combat Balance Skill

The engine is deterministic given a seeded RNG, so we can sim thousands of fights
quickly to validate balance.

## Where things live
```
tests/sim/
  harness.ts        # builds Player + Monster from JSON, runs N battles
  scenarios/
    act1-clear.ts   # baseline: level-appropriate Act 1 trash
    boss-andariel.ts
    farm-meph.ts
  report.ts         # writes a Markdown table summary
```

## Running a sim
```sh
npm run sim -- --scenario act1-clear --seeds 1000 --build necro-summon-lvl24
# → writes tests/sim/out/<scenario>-<build>-<timestamp>.md
```

## What the report must contain
| Metric | Definition |
|---|---|
| TTK p50 / p95 | Turns to kill, median + 95th percentile |
| DPS | Total damage / total elapsed turns |
| Death rate | % of seeds where the player died |
| Drop yield | Avg uniques / sets / runes per 1000 kills |
| Crit / dodge rates | Sanity numbers — should match tooltip math |

## Acceptance heuristics (game-designer to confirm)
- **Trash**: TTK p50 ≤ 3 turns at level cap; ≤ 8 turns at first encounter.
- **Elites**: TTK p50 ≤ 12 turns with a crafted level-appropriate build.
- **Bosses**: TTK p50 between 30 and 90 turns. Death rate ≤ 5% with a meta build.
- Builds should diverge by ≥30% in DPS — meaningful build identity.

## Workflow
1. Implement / modify the scenario in `tests/sim/scenarios/`.
2. Pin a seed range for reproducibility.
3. Run, attach the Markdown report to the PR.
4. If a change regresses an established baseline by >15%, flag in the PR body and ping `game-designer`.

## Don'ts
- Don't import React or DOM in sims.
- Don't tweak engine code from inside a scenario — scenarios consume engine, never patch it.
- Don't depend on wall-clock time; everything is turn-counted.
