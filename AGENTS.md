# AGENTS.md — Team Charter

This repo is built by a multi-agent **Copilot CLI** team. Each role is a
custom agent in `.github/agents/<name>.agent.md`. Project rules live in
`.github/copilot-instructions.md`. Reusable workflows live in
`.github/skills/`.

The structure is loosely modeled on a real game studio: directors who guard
the vision, leads who own their domains, and specialists who do the
hands-on work. Inspired by
[Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(MIT), adapted to our Copilot CLI / web-PWA stack.

## Studio hierarchy

### Tier 1 — Vision & strategy (consult before identity-shifting changes)
| Agent | Purpose |
|---|---|
| `creative-director` | Vision guardian. Owns pillars, tone, identity. Resolves cross-department creative conflicts. |
| `technical-director` | Technical authority. Owns stack, repo layout, build/CI, perf budgets, cross-cutting refactors. |
| `producer` | Lead coordinator. Decomposes goals into stories, dispatches the fleet, runs gate-checks. Does NOT arbitrate vision (→ creative-director) or tech (→ technical-director). |

### Tier 2 — Department leads
| Agent | Purpose |
|---|---|
| `game-designer` | Combat math, skills/buffs, monsters/bosses, drop tables, balance, progression curves. |
| `level-designer` | Cross-system numerical balance — TTK / drop economy / power curves backed by sims. |
| `art-director` | Visual style guide & seed registry. Single gatekeeper for `image-gen`. |
| `narrative-director` | Story arc, world rules, ludonarrative harmony. |
| `ux-designer` | User flows, screens, IA, onboarding. Mobile-first. |

### Tier 3 — Specialists
| Agent | Purpose |
|---|---|
| `engine-dev` | Pure-TS engine: combat resolution, skills, RNG, AI, save/load. |
| `frontend-dev` | React UI, Tailwind, mobile-first responsive layouts, i18n wiring. |
| `content-designer` | JSON game data: monsters, items, runes, runewords, maps. |
| `writer` | Player-facing copy: tooltips, item flavor, NPC dialogue, quest text (zh-CN + en). |
| `accessibility-specialist` | WCAG 2.1 AA enforcement: keyboard, screen-reader, contrast, mobile a11y. |
| `performance-analyst` | Bundle size, render perf, engine tick, worker throughput. Block on budget breaches. |
| `qa-engineer` | Vitest unit, Playwright E2E (incl. mobile viewport), balance simulations. |
| `reviewer` | Pre-merge code review (5-axis rubric: correctness/readability/architecture/security/performance). |

## Dormant agent sets (templates)

Beyond the active fleet, `docs/templates/agents/` holds **dormant
specialists** ready to activate if the project pivots:

| Group | Members | Activation |
|---|---|---|
| `godot/` | godot-specialist + csharp / gdextension / gdscript / shader subs | `setup-engine` skill |
| `unity/` | unity-specialist + addressables / dots / shader / ui subs | `setup-engine` skill |
| `unreal/` | unreal-specialist + ue-blueprint / ue-gas / ue-replication / ue-umg | `setup-engine` skill |
| `optional/` | audio-director, sound-designer, network-programmer, localization-lead, live-ops-designer, community-manager, analytics-engineer, ai-programmer, security-engineer, tools-programmer, prototyper, world-builder, systems-designer, economy-designer, gameplay-programmer, engine-programmer, ui-programmer, technical-artist, release-manager, qa-tester, qa-lead, lead-programmer | `setup-engine` skill (single or multi) |

These are **not** loaded into the active agent picker. They're files
on disk, ported from
[Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(MIT) and translated for Copilot CLI. Activate via the `setup-engine`
skill, which handles copy / banner removal / reference rewriting.

## Non-negotiables
1. **`art-director` owns image generation.** Every `image-gen` invocation
   passes through them. No exceptions.
2. Tech stack rules in `copilot-instructions.md` are absolute (TS strict,
   no `Math.random` in engine, JSON-driven data, mobile-first 360×640,
   i18n with zh-CN primary, save versioning, etc.).
3. **Process safety:** never run commands that kill node processes
   broadly — Copilot CLI itself runs on Node. See "Process & shell
   safety" in `copilot-instructions.md`.

## How the team works (Copilot CLI)

**The canonical entry point is the `start` skill.** There is no single
"manager agent" you talk to first. `start` reads the project state and
routes you to the right Tier-1 partner for the moment:

- Vision / identity questions → `creative-director`
- Tech / architecture questions → `technical-director`
- "Build / ship / plan" requests → `producer`

1. **Run `start`** at the beginning of any session, or whenever you
   don't know where to begin. It detects project stage (Fresh /
   Scoping / Building / Polishing / Shipping) and the kind of ask,
   then hands you to the right agent.
2. From there, the responsible Tier-1 agent works with the user on
   the question. For "build a feature" requests, `producer`
   decomposes via `create-stories`, then dispatches Tier-2 / Tier-3
   specialists in parallel via the `agent` tool.
3. Each story flows through `dev-story` → `gate-check` → `story-done`.
4. `producer` keeps the backlog moving until the milestone goal is met.
   `reviewer` signs off on every PR; `qa-engineer` verifies acceptance
   criteria.

If you already know where you're going, you can skip `start` and
invoke a specific agent directly:
```
copilot --agent producer        # building / shipping
copilot --agent creative-director  # vision / identity
copilot --agent technical-director # tech / architecture
copilot --agent game-designer   # mechanics question
```
or inside an interactive session: `/agent <name>`.

## Conventions for agents
- Follow `.github/copilot-instructions.md` at all times.
- Keep changes surgical and well-tested.
- Use the studio skills in `.github/skills/`. The full catalog is in
  `.github/skills/README.md`.
- When uncertain about scope, run `scope-check` and route to `producer`.
- When uncertain about identity / tone, route to `creative-director`.
- When uncertain about tech tradeoffs, route to `technical-director`.

## Gate verdict format
When invoked as a gate (e.g. `CD-PILLARS`, `GD-DESIGN-REVIEW`,
`AD-ART-BIBLE`, `LD-BALANCE-SIGNOFF`), agents open their reply with the
verdict token on its own line:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```
Calling skills parse the first line. Never bury the verdict.

## Reusable workflows
Slash-style skills (in `.github/skills/`) cover:
- Onboarding: `start`, `brainstorm`
- Specs: `design-review`, `architecture-decision`, `scope-check`,
  `ux-design`, `design-system`
- Stories: `create-stories`, `dev-story`, `story-done`, `sprint-plan`
- Reviews: `balance-check`, `content-audit`, `ux-review`, `gate-check`
- QA: `qa-plan`, `smoke-check`, `bug-report`
- Release: `milestone-review`, `retrospective`, `changelog`,
  `patch-notes`

See `.github/prompts/*.prompt.md` for higher-level templates the
producer can invoke (e.g. `build-feature`, `balance-pass`, `add-monster`).
