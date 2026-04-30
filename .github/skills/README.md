# Agent Skills

This directory holds reusable workflow skills any agent can invoke. Three kinds:

## Project-specific skills (own this repo)

| Skill | Purpose |
|---|---|
| `combat-balance` | Run deterministic combat sims (DPS / TTK / death rate / drops). Use on any balance change. |
| `frontend-design` | Author distinctive, production-grade UI components / pages. |
| `game-data-schema` | Validate & evolve JSON schemas under `src/data/schema/`. |
| `image-gen` | Generate styled art via Pollinations.AI. **Always gated by `art-director`.** |
| `mobile-responsive-check` | Verify a screen renders correctly at 360×640, 412×915, 1280×800, 1920×1080. |
| `pwa-setup` | Configure / audit vite-plugin-pwa (manifest, SW, offline, precaching). |
| `skill-creator` | Author new skills, evaluate skills, optimize triggering. |
| `webapp-testing` | Drive a local Playwright session for E2E / debugging. |

## Workflow skills (studio process)

Adapted from [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(MIT) and tuned for this repo's Copilot CLI harness, web/PWA stack,
and D2 text-game scope.

### Onboarding
| Skill | Owner |
|---|---|
| `start` | any agent (typically `producer`) |
| `brainstorm` | `producer`, `creative-director`, `game-designer` |

### Specs & decisions
| Skill | Owner |
|---|---|
| `design-review` | `game-designer` (mechanics), `creative-director` (vision) |
| `architecture-decision` | `technical-director` |
| `scope-check` | `producer` |
| `ux-design` | `ux-designer` |
| `design-system` | `frontend-dev` (build), `ux-designer` (patterns), `art-director` (tokens) |

### Stories & sprints (per-feature execution loop)
| Skill | Owner |
|---|---|
| `create-stories` | `producer` |
| `dev-story` | the assigned specialist (`engine-dev` / `frontend-dev` / `content-designer` / etc.) |
| `story-done` | the same specialist |
| `sprint-plan` | `producer` |

### Reviews & gates
| Skill | Owner |
|---|---|
| `balance-check` | `level-designer` |
| `content-audit` | `content-designer` |
| `ux-review` | `ux-designer` |
| `gate-check` | `producer` (aggregator) |

### QA
| Skill | Owner |
|---|---|
| `qa-plan` | `qa-engineer` |
| `smoke-check` | `qa-engineer` |
| `bug-report` | `qa-engineer` files; `producer` triages |

### Production / release
| Skill | Owner |
|---|---|
| `milestone-review` | `producer` |
| `retrospective` | `producer` |
| `changelog` | `producer` |
| `patch-notes` | `writer` drafts; `producer` approves; `narrative-director` co-signs voice |
| `hotfix` | `producer` |
| `launch-checklist` | `producer` |
| `day-one-patch` | `producer` |

### Engine / fleet activation
| Skill | Owner |
|---|---|
| `setup-engine` | `technical-director` |
| `adopt` | `technical-director` (when adopting an existing project) |
| `project-stage-detect` | any agent (used by `start`) |

## Skills ported from CCGS (mechanical translation)

These are imported from
[Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(MIT) and translated for Copilot CLI (`AskUserQuestion` → `ask_user`,
`Task` subagent → `agent` tool). Their bodies may reference CCGS
agent names (`lead-programmer`, `qa-lead`, `gameplay-programmer`,
etc.) — map those to the closest active agent or activate from
`docs/templates/agents/optional/` via `setup-engine`.

| Phase | Skill | Notes |
|---|---|---|
| Onboarding | `help`, `onboard`, `prototype`, `project-stage-detect` | |
| Specs | `quick-design`, `map-systems`, `propagate-design-change`, `review-all-gdds`, `reverse-document` | |
| Stories | `estimate`, `story-readiness` | |
| Architecture | `create-architecture`, `architecture-review`, `create-control-manifest` | |
| Reviews | (use the active `code-review-and-quality` and `design-review` for the primary path) | |
| QA | `regression-suite`, `soak-test`, `test-helpers`, `test-setup`, `test-flakiness`, `test-evidence-review`, `playtest-report`, `bug-triage` | |
| Release | `hotfix`, `launch-checklist`, `day-one-patch`, `security-audit` | |
| Art | `art-bible`, `asset-spec`, `asset-audit` | use under `art-director` direction |
| Localization | `localize` | pairs with `writer` and the i18n stack |
| Skill maintenance | `skill-test`, `skill-improve` | use alongside the active `skill-creator` |
| Team orchestration | `team-combat`, `team-ui`, `team-qa`, `team-release`, `team-polish`, `team-audio`, `team-level`, `team-live-ops`, `team-narrative` | dispatcher patterns coordinating multiple agents on a single feature |

## General-process skills (vendored from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), MIT)

Map by development phase:

| Phase | Skill | Owners |
|---|---|---|
| Define | `spec-driven-development` | `producer`, `game-designer`, `content-designer`, `level-designer` |
| Plan | `planning-and-task-breakdown` | `producer` |
| Plan | `context-engineering` | `producer`, all agents on session start |
| Build | `incremental-implementation` | `engine-dev`, `frontend-dev`, `content-designer` |
| Build | `source-driven-development` | `frontend-dev`, `technical-director` (verify against current docs) |
| Build | `frontend-ui-engineering` | `frontend-dev` |
| Build | `api-and-interface-design` | `engine-dev`, `technical-director` |
| Build | `code-simplification` | any agent on a refactor pass |
| Verify | `test-driven-development` | `engine-dev`, `qa-engineer` |
| Verify | `debugging-and-error-recovery` | any agent when something breaks |
| Verify | `browser-testing-with-devtools` | `qa-engineer`, `frontend-dev` |
| Review | `code-review-and-quality` | `reviewer` |
| Review | `performance-optimization` | `technical-director`, `reviewer`, `qa-engineer`, `performance-analyst` |
| Ship | `git-workflow-and-versioning` | every agent that commits |
| Ship | `ci-cd-and-automation` | `technical-director` |
| Ship | `documentation-and-adrs` | `technical-director`, `producer` |

### Skipped on purpose

The upstream catalog also includes `security-and-hardening`, `shipping-and-launch`,
`deprecation-and-migration`, `idea-refine`, and `using-agent-skills`. We chose not
to vendor these — they target server-side security, production launch flows,
or duplicate roles already owned by agents in `.github/agents/`. Revisit when the
project moves toward a public release.

### Adapting upstream examples

The vendored SKILL.md files use generic Node/React/Express examples. When the
guidance conflicts with this repo's stack (TypeScript strict, React 18, Vite,
Tailwind, Zustand, Dexie, Vitest, Playwright, vite-plugin-pwa, i18next, no
backend), `.github/copilot-instructions.md` and the per-agent charters win.
