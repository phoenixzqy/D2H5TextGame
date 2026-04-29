# Agent Skills

This directory holds reusable workflow skills any agent can invoke. There are two kinds:

## Project-specific skills (own this repo)
| Skill | Purpose |
|---|---|
| `combat-balance` | Run deterministic combat sims (DPS / TTK / death rate / drops). Use on any balance change. |
| `frontend-design` | Author distinctive, production-grade UI components / pages. |
| `game-data-schema` | Validate & evolve JSON schemas under `src/data/schema/`. |
| `image-gen` | Generate styled art via Pollinations.AI. Always gated by `art-director`. |
| `mobile-responsive-check` | Verify a screen renders correctly at 360×640, 412×915, 1280×800, 1920×1080. |
| `pwa-setup` | Configure / audit vite-plugin-pwa (manifest, SW, offline, precaching). |
| `skill-creator` | Author new skills, evaluate skills, optimize triggering. |
| `webapp-testing` | Drive a local Playwright session for E2E / debugging. |

## General-process skills (vendored from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), MIT)
Map by development phase:

| Phase | Skill | Owners |
|---|---|---|
| Define | `spec-driven-development` | `pm`, `game-designer`, `content-designer`, `level-designer` |
| Plan | `planning-and-task-breakdown` | `pm` |
| Plan | `context-engineering` | `pm`, all agents on session start |
| Build | `incremental-implementation` | `engine-dev`, `frontend-dev`, `content-designer` |
| Build | `source-driven-development` | `frontend-dev`, `architect` (verify against current docs) |
| Build | `frontend-ui-engineering` | `frontend-dev` |
| Build | `api-and-interface-design` | `engine-dev`, `architect` |
| Build | `code-simplification` | any agent on a refactor pass |
| Verify | `test-driven-development` | `engine-dev`, `qa-engineer` |
| Verify | `debugging-and-error-recovery` | any agent when something breaks |
| Verify | `browser-testing-with-devtools` | `qa-engineer`, `frontend-dev` |
| Review | `code-review-and-quality` | `reviewer` |
| Review | `performance-optimization` | `architect`, `reviewer`, `qa-engineer` |
| Ship | `git-workflow-and-versioning` | every agent that commits |
| Ship | `ci-cd-and-automation` | `architect` |
| Ship | `documentation-and-adrs` | `architect`, `pm` |

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
