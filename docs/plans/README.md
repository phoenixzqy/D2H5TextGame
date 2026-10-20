# From startable to playable

Prepared 2026-10-20 against `44f9c1b79739fd85744cd6ff0b863f7d392f18c1`.

The destination is the complete private v1 game: seven classes, Acts I–V,
meaningful builds and loot, reliable saves, and a repeatable endgame. The first
delivery checkpoint is one honest, enjoyable character-to-first-boss loop.
That checkpoint does not reduce the final scope.

Owner choices: full game through staged checkpoints; first five-act clear in
**30–50 active online hours**, excluding offline time.

This session prepares execution; it does not implement the game or start a
Codex goal. Design defaults below are proposals for the future design gate,
not claims that the owner approved new balance numbers.

## Read in this order

| Document                                  | Purpose                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| [Baseline](baseline.md)                   | What source and local checks actually establish; known defects and unknowns |
| [Playable target](playable-target.md)     | What good and bad mean; measurable completion gates                         |
| [Feature coverage](feature-coverage.md)   | Complete canonical v1 scope and its acceptance path                         |
| [Baseline metrics](baseline-metrics.json) | Machine-readable counts/check results; unknown gameplay metrics remain null |
| [Skill inventory](skill-inventory.csv)    | All 213 current player skill IDs, adapter routes and risk flags             |
| [Design decisions](design-decisions.md)   | Contradictions to resolve before tuning; explicit proposed defaults         |
| [Work plan](work-plan.md)                 | Dependency order, owners, bounded tasks and checkpoints                     |
| [Agent contract](agent-contract.md)       | Assignment template, file ownership, evidence and review rules              |
| [Goal runbook](goal-runbook.md)           | Copyable goals, resume protocol and validation commands                     |

## Authority and working rules

Repository/user instructions remain authoritative. `Diablo2TextGame.md` is the
canonical v1 scope; accepted ADRs resolve their recorded technical decisions.
Existing subsystem specs contain contradictions, so source behavior and old
"DECIDED" labels do not independently settle conflicts. Resolve the explicit
decision register with the named design/technical owners before affected work.
This package adds an execution and acceptance contract; it does not silently
rewrite the GDD, ADRs or repository skills.

The producer coordinates the backlog; game/level designers own mechanics and
calibration; technical director owns contracts and migrations; specialists
implement bounded slices; reviewer and QA provide independent acceptance.

Every future worker receives the relevant target gates, its exact task, file
ownership, dependencies and verification method. Each worker claims its own
isolated worktree before changes. Separate worktrees do not permit competing
edits to shared contracts without integration planning.

## Current result and next action

The source baseline has extensive scaffolding and passing local checks, but
does not establish a playable campaign. Buff/passive behavior, quest rewards,
idle simulation, level-to-loot eligibility and truthful acceptance tests are
foundational work, not late polish.

Start future execution with **P00–P02**, then integrity and combat foundations.
Do not begin by globally increasing drop rates or XP: that would tune around
broken mechanics and reward paths. Use the staged goal in the runbook. Update
task states and evidence there as work completes; retain this baseline as a
dated historical snapshot.

## Preparation review and handoff

Read-only producer, combat and balance reviews accepted the preparation after
corrections to source references, retry/time accounting and challenge-context
coverage. This is approval of the execution plan, not approval of unfinished
gameplay or completion of G0–G7. Local document formatting, links, CSV IDs/counts
and JSON unknown-value handling were validated. Current browser execution is
unmeasured for the environment reason recorded in the baseline.

The package is preserved on local branch `feat/plans-playable-game`; the source
checkout remains unchanged. Installed dependencies remain in the claimed
worktree's `node_modules/` for the next execution session; normal managed
worktree maintenance owns their eventual cleanup. Disposable `dist/`, Vite test
cache and task-local test/log output are removed after validation. No PR, public
deployment, goal activation or game-source change is part of this preparation.
