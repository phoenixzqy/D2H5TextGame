# AGENTS.md — Team Charter

This repo is built by a multi-agent **Copilot CLI** team. Each role is a custom
agent in `.github/agents/<name>.agent.md`. Project rules live in
`.github/copilot-instructions.md`.

## Roles
| Agent | Purpose |
|---|---|
| `pm` | Orchestrator. Breaks goals into tasks, dispatches to other agents, monitors progress, reports back. |
| `architect` | Tech stack, repo structure, build/CI, perf budgets. |
| `game-designer` | Combat math, skills, buffs, balance, progression curves. |
| `level-designer` | Cross-system balance: map difficulty curves, monster/gear/skill stat tuning, encounter pacing, drop economy. Backed by sims. |
| `engine-dev` | Implements pure-TS game engine (combat, skills, buffs, RNG). |
| `frontend-dev` | React UI, Tailwind, mobile-first layouts, i18n wiring. |
| `content-designer` | JSON data: monsters, items, runes, runewords, maps. |
| `qa-engineer` | Vitest + Playwright tests; balance simulations. |
| `reviewer` | Code review: correctness, security, architecture, style. |

## How the team works (Copilot CLI)
1. Start a session and select the orchestrator:
   ```
   copilot --agent pm
   ```
   Or, inside an interactive session:
   ```
   /agent pm
   ```
2. Give the PM a goal (a feature, a milestone, a bug).
3. PM decomposes work and **invokes other agents via the `agent` tool**
   (built-in to Copilot CLI custom agents). Each sub-agent runs in its own
   context window and returns results.
4. PM iterates until the goal is met, asking the Reviewer for sign-off,
   and asking QA for test verification.

## Conventions for agents
- Follow `.github/copilot-instructions.md` at all times.
- Keep changes surgical and well-tested.
- Prefer skills in `.github/skills/` for repeatable specialized tasks
  (e.g. `webapp-testing`, `pwa-setup`, `game-data-schema`).
- When uncertain about scope or product intent, escalate to `pm`.
- When uncertain about tech tradeoffs, escalate to `architect`.

## Reusable workflows
See `.github/prompts/*.prompt.md` for templates the PM can invoke
(e.g. `build-feature`, `balance-pass`, `add-monster`).
