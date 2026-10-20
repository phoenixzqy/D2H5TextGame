# Contract for every future agent

## Assignment must include

```text
Role / task ID / objective:
Player-visible problem:
Required reading: repository rules + relevant target gates + decision records
Input commit and dependency commits/artifacts:
Writable files/modules (exclusive ownership):
Read-only contracts / integration owner:
Acceptance: observable state/outcome, boundaries and failure cases
Anti-goals: specific shortcuts that would invalidate this task
Verification: exact existing commands; planned new tests clearly identified
Evidence output and handoff recipient:
Worktree claim/release and task-owned cleanup:
```

Always tell a worker: **You are not alone in the codebase. Preserve other
agents' edits and adapt to concurrent changes; do not revert their work.**
Supply only necessary context, not a dump of every design file. Each worker
reads its applicable instructions/skills and claims a worktree with its own
live session ID before any edit/build/test/branch action. Follow the installed
`git-worktree` skill; never mutate the shared source checkout. Sharing an agent's
claim is not a substitute for claiming ownership.

## Role goals and failure conditions

| Role                | Goal                                                          | Good output                                                                                 | Bad output                                                                         |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Producer            | Deliver complete accepted v1 through small integrated slices  | Maintained dependency/status/evidence ledger; dispatch precise tasks; resolve failed gates  | Declare shipped because all screens exist or agents exited successfully            |
| Creative director   | Preserve loot/build/idle/text-first pillars and bounded scope | Resolve identity conflicts and clearly state accepted scope decisions                       | Endless new features or silently dropping seven classes/acts                       |
| Game designer       | Specify coherent, implementable behavior                      | Exact skill/economy rules, examples, rank/resource/target/negative cases                    | Names/flavor text without mechanics; numbers without assumptions                   |
| Level designer      | Calibrate all acts/classes/builds with real engine            | Obtainable fixtures, reproducible distributions, holdout evidence and pacing tables         | Tune only Act I, fixed-DPS proxies, average away weak builds                       |
| Technical director  | Keep contracts, determinism, saves and integration correct    | Minimal coherent interfaces, migration/compatibility plan, single source of truth           | Rewrite stack, broaden abstractions without need, invent parallel reward engines   |
| Engine developer    | Implement specified mechanics end to end                      | Meaningful state changes, negative regression tests, seed replay and production integration | Event-only stubs, duplicate effects, UI business logic, patches hiding symptoms    |
| Content designer    | Make data valid and reachable                                 | Schema/cross-reference/level eligibility checks, legal acquisition paths, tuned JSON        | More definitions counted as content completion, unreachable uniques or invalid IDs |
| Frontend developer  | Make ordinary controls complete and truthful                  | Learn/cast/equip/claim/save flows, correct identity/art, responsive interactions            | Decorative controls, hidden state injection, stale displays, hardcoded player copy |
| UX / accessibility  | Make critical tasks understandable and operable               | Mobile/keyboard/focus/readability evidence, concrete issues and fixes                       | Screenshot-only approval; assess desktop and call it mobile                        |
| Art director        | Preserve correct identity and asset policy                    | Resolver precedence, source metadata, clear fallbacks; approve any new image generation     | Regenerate art to conceal a resolver bug; bypass image-generation gate             |
| Writer / narrative  | Explain real mechanics and act progression                    | zh-CN/en parity; descriptions agree with behavior and NPC services                          | Translate a false promise or invent unsupported rewards                            |
| QA                  | Independently prove the player contract                       | Repro before fix, state assertions, exact counts/seeds, mobile/production paths             | Test presence as proof, conditional skips on failure, zero-loot success            |
| Performance analyst | Keep real gameplay responsive and bounded                     | Device/browser/config metrics; battle/log/idle/large-inventory soak                         | Inflate baselines, weaken warnings or optimize an irrelevant benchmark             |
| Reviewer            | Challenge correctness and evidence before merge               | Independent diff/contract review; current-head checks; precise actionable findings          | Approve own work uncritically or demand unrelated rewrites                         |

## Mandatory task loop

1. Claim task and worktree; verify dependency SHAs and exclusive write scope.
2. Reproduce observed/source-risk defect or establish the feature's missing
   acceptance test. File a structured bug via repository `bug-report` workflow
   for confirmed bugs before patching; keep this baseline as investigation,
   not a replacement for repro reports.
3. Review design/contract if behavior is ambiguous. Use root-cause-fix guidance;
   repair the source of divergence with the smallest coherent change.
4. Implement a vertical player path and meaningful negative cases. Do not
   change pass thresholds, disable hooks, or delete failing assertions to pass.
5. Run relevant inner-loop tests, then required handoff checks. Engine edits
   use `npm run test:engine`; meaningful edits use `test:fast`/`test:related`.
6. Get independent review and QA against the target, integrate dependency
   changes, and validate the combined head. A passing feature branch before
   integration does not validate the final head.
7. Commit conventional, focused changes; update task state and feature/skill
   evidence. Remove verified disposable artifacts after consumers finish,
   release worktree through the skill, and record handoff.

Do not use event counts or snapshot images alone to certify mechanics. Never
introduce broad process termination or kill an unknown process to free a port.
Use Playwright-owned servers and a different `E2E_PORT` when needed. No silent
scope cuts, no production debug bridges, and no data-loss cleanup of legacy saves.

## Handoff evidence

```text
Task ID / status: accepted | review-needed | in-progress | blocked
Commit / integrated head / data and fixture versions:
Behavior delivered and affected target gates:
Reproducer / prior failure:
Tests: exact commands, exits, passed/failed/skipped counts
Browser: project, viewport, locale, ordinary vs seeded state
Balance: seed sets, n, distributions, failures and report location
Save compatibility / failures / migrations:
Remaining defects or unmeasured acceptance:
Files changed, dependency handoff, artifact retention and cleanup:
Reviewer / QA verdict and evidence links:
```

If a real user decision blocks work, describe concrete alternatives and why
source evidence cannot decide. Continue independent authorized work. Do not
invent workflow labels; any configured human-review/blocked label requires the
user's mandated `Human action required` explanation through the normal path.

## Avoid shared-file collisions

Freeze shared effect/status/reward/save contracts under the technical director
before parallel class work. Assign one integrator for shared registries,
schemas, stores and localization indexes. Class workers own class data/tests
and adapters explicitly delegated to them; they request shared changes through
the integrator. Integrate dependency branches in order, rerun affected behavior
and never assume a shared filesystem gives another worker's worktree ownership.
