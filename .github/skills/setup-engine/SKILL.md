---
name: setup-engine
description: Activate a dormant agent set (Godot, Unity, Unreal, or Optional) by copying template agents from `docs/templates/agents/<group>/` into the active fleet at `.github/agents/`. Use when pivoting the project to a new engine or staffing a previously unused specialty (audio, network, live-ops, etc.).
---

# Skill: setup-engine

The active D2 H5 text-game build runs on **TypeScript + React + Vite +
PWA**. The engine specialists for Godot / Unity / Unreal — and a number
of optional non-engine specialists (audio-director, network-programmer,
live-ops-designer, etc.) — live as **dormant templates** under
`docs/templates/agents/<group>/`. They don't show up in the agent picker
and the producer doesn't dispatch them by default.

This skill activates a set when needed.

## When to use
- The project is being ported to a different engine / runtime
  (e.g. wrapping the engine in a Capacitor or Tauri shell stops being
  enough; we need a real Unity rebuild).
- A new department comes online (e.g. we add audio → activate
  `audio-director` + `sound-designer` from `optional/`).
- A specific specialist is needed once-off (e.g. a security audit
  before a private beta → activate `security-engineer` from `optional/`).

## Available groups

| Group | Members | When to activate |
|---|---|---|
| `godot` | godot-specialist + csharp / gdextension / gdscript / shader subs | Porting to Godot 4 |
| `unity` | unity-specialist + addressables / dots / shader / ui subs | Porting to Unity |
| `unreal` | unreal-specialist + ue-blueprint / ue-gas / ue-replication / ue-umg | Porting to Unreal Engine 5 |
| `optional` | audio-director, sound-designer, network-programmer, localization-lead, live-ops-designer, community-manager, analytics-engineer, ai-programmer, security-engineer, tools-programmer, prototyper, world-builder, systems-designer, economy-designer, gameplay-programmer, engine-programmer, ui-programmer, technical-artist, release-manager, qa-tester, qa-lead, lead-programmer | Single-agent or single-feature activation |

## Phase 1 — Confirm the activation
Use `ask_user` if not already specified:
- Which group? (godot / unity / unreal / optional)
- If `optional`: which specific agents? (multi-select)
- Does this replace the current active fleet, or supplement it?

## Phase 2 — Pre-flight
- Read the dormant templates to be activated.
- Identify overlaps with the active fleet
  (e.g. activating `gameplay-programmer` overlaps with our `engine-dev`).
- Surface conflicts and ask whether to:
  - **Replace** the active equivalent (move ours to
    `docs/templates/agents/optional/` for safekeeping), or
  - **Coexist** (rename one for clarity), or
  - **Skip** the activation of that specific role.

## Phase 3 — Activate
For each agent being activated:
1. Copy `docs/templates/agents/<group>/<name>.agent.md` →
   `.github/agents/<name>.agent.md`.
2. Strip the "Status: DORMANT — template only" banner.
3. Adjust references to other agents to match our active roster
   (e.g. CCGS's `lead-programmer` → our `technical-director` /
   `engine-dev`; CCGS's `qa-lead` / `qa-tester` → our `qa-engineer`).
4. Tune the body to reference our `.github/copilot-instructions.md`
   stack rules instead of generic CCGS stack rules.

## Phase 4 — Update top-level docs
- `AGENTS.md` — add the newly active agent(s) under the right tier.
- `.github/copilot-instructions.md` — if the activation introduces new
  rules (e.g. switching to Godot triggers a stack-rule rewrite),
  update via `architecture-decision` skill.
- `.github/skills/README.md` — register any new skills that pair
  with the activated agents.

## Phase 5 — ADR
Activating an engine set is **irreversible-ish** — write an ADR via
`architecture-decision`:
- Title: "Switch active engine to <Godot/Unity/Unreal>" or
  "Activate <name> specialist".
- Context: what triggered this.
- Decision: which agents activated, which deactivated.
- Consequences: what gets faster, what gets slower, what tech debt
  appears.

## Phase 6 — Smoke
Have `producer` run a smoke pass:
- Dispatch the newly active agent on a tiny task to confirm it works.
- Run `gate-check` on a no-op PR to confirm no agent references break.

## Reverse activation
To **deactivate** an agent (move it back to dormant):
1. Move `.github/agents/<name>.agent.md` →
   `docs/templates/agents/<group>/<name>.agent.md`.
2. Re-add the DORMANT banner.
3. Update `AGENTS.md` to drop the agent.
4. Write an ADR explaining the deactivation.

## Owner
`technical-director` runs (with `creative-director` co-sign for engine
swaps; with `producer` co-sign for staffing changes). User must
explicitly approve any engine swap.

## Notes
- The dormant agent files were ported from
  [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
  (MIT) and translated for Copilot CLI. Expect to lightly edit any
  activated agent to match our project conventions.
- An activated optional agent that is later judged unfit can be
  replaced from the upstream CCGS source if our local edits drift.
