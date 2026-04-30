# 暗黑2 H5 (D2 H5 Text Game)

A Diablo 2-inspired text-based ARPG with idle/incremental mechanics, playable
in any modern browser on **desktop and mobile** (installable as a PWA).

> 设计文档（中文）: see [`Diablo2TextGame.md`](./Diablo2TextGame.md).

## Status
🚧 Scaffolding phase — code not yet bootstrapped. The repo currently contains
the **agent team** and **skill definitions** that Copilot CLI will use to build
the game.

## Tech stack
- TypeScript (strict) · React 18 · Vite
- Tailwind CSS · Zustand · Dexie (IndexedDB)
- vite-plugin-pwa (Workbox) — installable on desktop + mobile
- i18next (zh-CN primary, en secondary)
- Vitest (unit) · Playwright (E2E + mobile viewport)
- JSON game data validated by Ajv

Future targets: Capacitor (app stores), Tauri (desktop native shells).

## How development works — Copilot CLI Agent Team

This repository is built by a multi-role agent team running in **GitHub
Copilot CLI**. The team and the rules they follow are checked into the repo:

| File / Dir | Purpose |
|---|---|
| `AGENTS.md` | Team charter |
| `.github/copilot-instructions.md` | Always-on project rules |
| `.github/agents/*.agent.md` | Custom agent definitions (producer, Technical Director, etc.) |
| `.github/skills/*/SKILL.md` | Reusable skills |
| `.github/prompts/*.prompt.md` | Reusable workflow templates |

### Agents
- `producer` — orchestrator
- `technical-director` — tech / build / CI
- `game-designer` — combat, skills, balance
- `engine-dev` — pure-TS engine
- `frontend-dev` — React UI, mobile-first
- `content-designer` — JSON game data
- `qa-engineer` — Vitest + Playwright + balance sims
- `reviewer` — pre-merge gate

### Skills
- `webapp-testing` — Playwright UI testing (from anthropics/skills)
- `frontend-design` — UI design assistance (from anthropics/skills)
- `skill-creator` — author new skills (from anthropics/skills)
- `pwa-setup` — wire up vite-plugin-pwa
- `game-data-schema` — JSON Schema validation for content
- `combat-balance` — deterministic combat simulations
- `mobile-responsive-check` — verify mobile layouts

### Quickstart for contributors
```sh
# Install Copilot CLI (see https://docs.github.com/copilot/cli)
npm i -g @github/copilot

# In this repo:
copilot --agent producer
# then give the producer a goal, e.g.:
#   "Bootstrap the Vite + React + TS + Tailwind + PWA project per the Technical Director spec."
```

To use a specific role directly:
```sh
copilot --agent engine-dev --prompt "Add a damage pipeline with resist & immunity tests"
```

## License
**All Rights Reserved.** See [`LICENSE`](./LICENSE). This is private proprietary code — no license is granted to anyone. Do not use, copy, modify, or distribute without explicit written permission from the copyright holder.

## Credits & Asset policy
This is a **personal, private, non-commercial** fan project inspired by Blizzard's Diablo II / D2R. Because the project is private and non-commercial, official D2 / D2R assets (icons, portraits, sounds, names, lore, formulas) **may be used directly** — see [§11.1 of the GDD](./Diablo2TextGame.md#111-asset--reference-policy--资源使用政策-) and `.github/copilot-instructions.md` for the policy and guardrails. All Diablo IP belongs to Blizzard Entertainment.
