# Codex goal execution runbook

Preparation is complete when this package is reviewed and durable. No goal
was activated by preparing these documents. The following commands are for
the future implementation session, after these files are available in its
base branch or explicitly provided planning branch.

## Starting a goal

Official OpenAI documentation describes `/goal <objective>` as setting a
persistent target; `/goal` views it, `/goal edit` revises it, and `/goal pause`,
`/goal resume`, `/goal clear` manage it. Source checked 2026-10-20:
https://developers.openai.com/codex/cli/slash-commands/

A goal tracks an objective; it is not itself a detailed backlog, validation
result, or permission to ignore repository workflows. Keep evidence and task
state in the repository so a new context can resume. Budget controls, where
available in the installed client, are separate from completion criteria.
Do not invent CLI flags or promise that one session can run forever.

Recommended first bounded goal:

```text
/goal Complete checkpoint C0 in docs/plans/work-plan.md for D2H5TextGame.
Read docs/plans/README.md, baseline.md, playable-target.md, feature-coverage.md,
design-decisions.md and agent-contract.md. The final destination remains the
full seven-class, five-act v1 game, delivered in stages, with a 30–50 active-hour
fresh first campaign clear. Complete P00–P02: reconcile design decisions needed
for the first vertical slice, establish truthful current-head acceptance tests,
and deliver a reproducible production-path measurement harness and baseline.
Do not stop at documentation if C0 calls for executable harness/tests. Use the
studio team with explicit worktree/file ownership; preserve other agents' work.
Do not fix unrelated gameplay or tune global numbers in this checkpoint.
Record failed/unknown gates honestly; finish only when C0's own deliverables
pass independent review and its measurement/reproduction gates are satisfied.
```

After C0, use successive goals for C1, C2, C3 and C4, carrying forward accepted
contracts and evidence. This keeps each goal reviewable without reducing the
destination. The goal for C1 must explicitly include ordinary UI first-boss
victory, actual skill effects/upgrades, correct loot, quests, save/reload and
mobile. C2 must include all five acts with earned state, not injected checkpoints.

If using one umbrella goal instead:

```text
/goal Finish the complete private v1 game described by Diablo2TextGame.md and
docs/plans/README.md. Deliver checkpoints C0–C4 in docs/plans/work-plan.md,
seven classes with every advertised skill functional, Acts I–V reachable from
fresh earned state in 30–50 active hours, meaningful builds/loot, all canonical
economy/quest/merc/crafting/endgame systems, safe saves, mobile/locales and PWA.
Use docs/plans/playable-target.md gates G0–G7 and agent-contract.md for every
delegated assignment. Maintain the task/evidence ledger, review each integrated
slice, and continue through failed gates. Never declare completion from green
unit tests, registered skill IDs, screens or seeded endgame fixtures alone.
No public deployment or v2 expansion. Report genuine blockers and pending
human playtests honestly; do not treat partial checkpoints as full completion.
```

Do not set an arbitrary token budget on behalf of the owner. If a budget ends,
leave concrete status/evidence and next steps; budget exhaustion is not success.

## Session startup and resume

1. Read user/repository rules and relevant skills. Establish repository remote,
   current base/head and which planning commit is present. Claim an isolated
   worktree using installed `git-worktree`; start new work from latest base.
   If the plan is only on `feat/plans-playable-game`, integrate/provide its
   commit deliberately—do not assume a fresh main checkout contains it.
2. Read ledger and last checkpoint report; verify recorded dependency SHAs and
   whether source changed since baseline. Preserve baseline; create a dated
   new report when measurements change. Do not re-run historical work blindly.
3. Select ready child cards. Dispatch goal, constraints, gates, writable files,
   dependency commits and evidence template. Assign one shared-contract owner.
4. Integrate reviewed slices, validate the combined head, update ledger and
   retain decisive evidence. Push/open PRs and merge only within the user's
   authorized delivery scope and repository approval/CI rules.
5. If stopping, record current branch/commit, remaining failed/unknown gates,
   next ready cards, active processes/claims and retained artifact owners.
   Release finished worktrees via the skill; never remove them manually.

## Existing commands, verified against package/config

Run from the claimed worktree. Prefer CI's Node 20 for comparable results;
record the actual version. Never run watch mode in an agent shell.

```bash
npm ci --no-audit --no-fund
npm run test:related -- src/engine/combat/combat.ts
npm run test:fast
npm run test:engine
npm test
npm run typecheck
npm run lint
npm run build
```

Required handoff: complete unit + typecheck + lint; engine edits also engine
suite. Coverage is an additional release gate at the repository's configured
80% engine thresholds, not proof that all skills work:

```bash
npm run test:cov
npm run lint:i18n
npm run check:test-bridge-shake
```

The i18n script is currently report-only in CI; its successful job cannot
replace player-facing translation acceptance. `check:test-bridge-shake` builds
production and verifies debug helpers are removed; an E2E bridge-enabled bundle
does not establish this production safety gate.

Desktop (**D**), mobile (**M**) and production (**P**) examples:

```bash
E2E_PORT=4289 npx playwright test --grep @smoke --project=chromium-desktop
E2E_PORT=4289 npx playwright test --grep @smoke --project=mobile-portrait
E2E_PORT=4289 npx playwright test --project=chromium-desktop
E2E_PORT=4289 npx playwright test --project=mobile-portrait
RUN_PROD_BUNDLE=1 E2E_PORT=4289 E2E_PROD_PORT=4389 npx playwright test --project=prod-bundle
```

Production currently covers tagged production specs only. P17 must add actual
network-disabled reload/play/save assertions; the existing registration test
alone cannot pass G6. Also add production mobile coverage explicitly rather
than assuming the desktop production project covers it.

Use documented browser setup on a supported host with the exact lockfile's
Playwright/browser version. This preparation's Ubuntu 26.04 host lacked the
required browser; browser installation reported unsupported platform. Do not
classify a launch/setup error as a gameplay failure or silently use a mismatched
binary. Establish browser evidence on a supported local host or normal CI.

**S** is a future harness delivered in P02. There is currently no `npm run sim`.
P02 must document executable tiny/screening/certification commands, discovery,
fixture validation and output schema before a worker uses them. Never cite a
nonexistent script copied from an old workflow as passed validation.

## Evidence and disk hygiene

For each checkpoint retain a small versioned Markdown summary plus JSON/CSV
metrics and necessary representative screenshots/traces. Name it by checkpoint,
SHA, fixture version and seed set. Raw logs/videos belong in a task-isolated
temporary directory or forge artifacts; record retained path, purpose, owner
and removal condition. Do not commit huge browser-output folders or asset dumps.

Track exact paths created, consumers and owned process IDs. Use Playwright's
server lifecycle; if a port is occupied choose another port. Remove disposable
task-owned build/test outputs and temporary logs after their results have been
preserved and consumers finish. Preserve installed tools/shared caches and
required evidence; never recursively delete shared parents or worktrees.

## Completion report

For each C0–C4 report: target gates passed/failed/unknown, feature/skill coverage,
head/data/fixture versions, exact command outcomes, seed/sample distributions,
browser/locale coverage, human playtest status, open defects and next actions.
Final completion requires G0–G7, independent reviewer/QA, actual repository CI
requirements, full campaign/endgame proof and player acceptance. If human play
feedback is pending, say so rather than claiming the game is finished.
