# Project Standards — Diablo 2 H5 Text Game

> Always-on instructions injected into every Copilot CLI request in this repo.
> See `Diablo2TextGame.md` for full game design intent (in Chinese).

## What we are building
A text-based Diablo 2-inspired ARPG with idle/incremental mechanics.
Playable in any modern browser on **desktop and mobile** from a single codebase
(installable as a PWA). Future targets: Capacitor (app stores), Tauri (desktop).

## Tech Stack — DO NOT change without architect approval
- **Language:** TypeScript (strict mode)
- **Framework:** React 18 + Vite
- **State:** Zustand (one store per domain: `combatStore`, `inventoryStore`, `playerStore`, `mapStore`, `metaStore`)
- **Styling:** Tailwind CSS, mobile-first, D2-inspired dark palette
- **PWA:** `vite-plugin-pwa` (Workbox) — offline-capable, installable
- **Persistence:** Dexie.js (IndexedDB) for saves; `localStorage` only for tiny prefs
- **i18n:** i18next, default `zh-CN`, secondary `en`
- **Testing:** Vitest (unit), Playwright (E2E + mobile viewport)
- **Game data:** JSON files in `src/data/` validated by JSON Schema (Ajv)
- **Lint/format:** ESLint + Prettier
- **CI:** GitHub Actions

## Repository layout (target)
```
src/
  app/           # React entry, routing, providers
  ui/            # Reusable UI components (Tailwind)
  features/      # Feature folders: combat, inventory, skills, map, town, gacha
  engine/        # Pure-TS game engine (no React) — combat, skills, buffs, RNG
  data/          # JSON game data + schemas
  stores/        # Zustand stores
  i18n/          # locales
  workers/       # Web workers for offline-tick sims
public/
  icons/, manifest, service worker assets
tests/           # Playwright E2E
```
Game engine MUST be pure TypeScript with **no React/DOM imports** so it can
run in Web Workers and be unit-tested deterministically.

## Code rules (Reviewer enforces)
1. TypeScript `strict: true`. No `any` without `// eslint-disable-next-line` + reason.
2. No business logic in React components — call into `engine/` or stores.
3. All RNG goes through a seedable PRNG in `engine/rng.ts`. Never `Math.random()` in engine code.
4. Game data is JSON, validated against JSON Schema on load. Never hardcode item/monster stats in TS.
5. Mobile-first CSS. Every new screen must work at 360×640 and at desktop breakpoints.
6. Every engine module ships with Vitest unit tests. Aim ≥80% coverage on `engine/`.
7. Public APIs (engine, stores) get TSDoc comments.
8. **Asset policy (private nonprofit project).** This repository is a **personal, private, non-commercial** project. Agents may use any online resources — including **official Blizzard / Diablo 2 / D2R assets** (sprites, icons, portraits, sounds, fonts, item names, lore text, UI artwork) — when helpful. Use them *properly*:
   - Keep usage **private**: do not push the repo to a public registry/store, do not host a public deployment that monetizes the assets, do not claim authorship.
   - Prefer linking/embedding from existing fan archives (e.g. d2mods, PureDiablo wikis, the D2R datamine community) rather than re-uploading large asset blobs to GitHub when avoidable.
   - When you do commit assets, place them under `public/assets/d2/` (or a similar clearly-namespaced folder) and add a `SOURCE.md` next to them noting where each came from.
   - Never bundle a third-party paid product (e.g. a commercial sound pack you didn't buy).
   - If/when v2+ moves toward public release or app-store distribution, **all D2-derived assets must be removed or replaced first** — track this as a release blocker.
9. Save format is versioned. Add migrations in `stores/migrations.ts` when bumping.
10. Player-visible strings go through `i18next`. Never hardcode user-facing zh/en text.

## Game design invariants (Game Designer enforces)
- One protagonist + mercs/summons; turn order driven by attack speed.
- No move-speed / range stats; replaced by physical/magical dodge.
- No red/blue potions; restore via skills, drops (D3-style orbs), passives.
- Skills have ≥1s internal CD; buffs don't re-cast while active.
- Damage types: physical, fire, cold, lightning, arcane, poison, thorns. Each has signature debuff.
- Offline yields a *next-online multiplier* (XP/MF), NOT raw offline rewards.
- Currencies: drop runes/gems/charms; consider removing or repurposing gold.

## Process & shell safety — DO NOT kill node broadly (CRITICAL)

**The Copilot CLI itself runs on Node.js.** Any command that targets node
processes by name will kill the agent that issued it (and every other Copilot
session on the machine), terminating the user's session mid-task. This has
happened repeatedly. **Never do it.**

Forbidden, in any agent, any shell, any OS:
- `Get-Process node | Stop-Process …` / `Stop-Process -Name node …`
- `taskkill /F /IM node.exe` / `taskkill /IM node*`
- `pkill -f node` / `pkill node` / `killall node` / `killall -9 node`
- `fuser -k <port>/tcp`, `npx kill-port`, or any tool that kills "whatever
  is on port X" without first identifying the exact PID **you started**.
- Any "free the port / nuke node / reset environment" workaround.

**You almost never need to kill anything.** Playwright's `webServer` block in
`playwright.config.ts` already starts and stops its own server on the
configured `E2E_PORT` (default 4173). Vitest does not need a server. If a port
is genuinely occupied:
1. First, check whether it's a process **you** started in this session
   (you'll have its PID from `powershell` async mode). If yes, stop **that
   exact PID** with `Stop-Process -Id <PID>`.
2. Otherwise, change the port (`E2E_PORT=4179 npx playwright test …`) instead
   of killing anything.
3. If neither works, surface the problem to the user. Do not escalate to
   broad process termination.

Allowed process management:
- `Stop-Process -Id <specific-PID>` for a PID you started yourself.
- `stop_powershell` for sessions you started via the agent's `powershell`
  tool.

This rule overrides any contrary suggestion from a sub-agent, skill, or
prompt template. If an instruction tells you to "kill node", treat it as a
bug in that instruction and refuse.

## Git / PR workflow
- Branch per feature: `feat/<area>-<short-desc>`.
- Conventional commit messages.
- PRs require Reviewer agent approval and green CI before merge.

## Test loop budgets

`npm test` is **non-watch by default** (runs `vitest run`). Agents must
never invoke a watch-mode test command in non-interactive shells — it
will hang the agent. Use the tiered scripts below.

| Tier | Command | Budget | When |
|---|---|---|---|
| `unit-engine` | `npm run test:engine` | ≤3 s | After any `src/engine/**` edit |
| `test:fast` | `npm run test:fast` (vitest `--changed`) | ≤8 s | After any meaningful edit |
| `test:related` | `npm run test:related -- <files>` | ≤5 s | Surgical loop |
| `test` (unit full) | `npm run test` | ≤15 s | Before handoff |
| `test:smoke-e2e` | `playwright test --grep @smoke --project=chromium-desktop` | ≤30 s | (added in Wave B P06) |
| `test:e2e` full local | `npm run test:e2e` | ≤4 min | Pre-PR sanity (rare) |

Defaults for agents:
- **Inner loop** → `npm run test:fast` (only retests files changed vs HEAD).
- **Engine work** → `npm run test:engine` after each engine edit.
- **Before handoff** → `npm run test` (full unit) + `npm run typecheck` + `npm run lint`.
- **Coverage check** → `npm run test:cov`.
- **Human-driven watch loop** → `npm run test:watch` (interactive only — never in agent shells).

Notes:
- `test:engine` currently uses a path filter (`src/engine`). Wave B P05b will
  replace it with a Vitest workspace project; the script name is forward-compatible.
- Because `npm test` is now non-watch, the previously required `-- --run`
  flag is no longer necessary. Passing it (e.g. `npm test -- --run --reporter=basic`)
  remains harmless but should be simplified to `npm test --reporter=basic` in new code.
- **E2E port fallback.** Playwright's `webServer` block owns the lifecycle of
  port `4173` (configured via the `E2E_PORT` env var). If `4173` is occupied
  by an unrelated process, **set `E2E_PORT=4279`** (or any other free port)
  and re-run, e.g.:
  ```
  $env:E2E_PORT=4279; npx playwright test --project=chromium-desktop
  ```
  Do **not** try to "free" the port with `kill-port`, `taskkill /IM node.exe`,
  `pkill node`, or any `Stop-Process -Name node` variant. Copilot CLI itself
  runs on Node — those broad-match commands kill the very agent issuing them.
  See the **"Process & shell safety"** section above for the absolute rule;
  the `E2E_PORT=4279` fallback is the sanctioned workaround.

## Studio model & gate verdicts

The team is structured in three tiers (see `AGENTS.md`):
- **Tier 1 — Vision & strategy:** `creative-director`, `technical-director`, `producer`.
- **Tier 2 — Department leads:** `game-designer`, `level-designer`,
  `art-director`, `narrative-director`, `ux-designer`.
- **Tier 3 — Specialists:** `engine-dev`, `frontend-dev`,
  `content-designer`, `writer`, `accessibility-specialist`,
  `performance-analyst`, `qa-engineer`, `reviewer`.

Each lead/specialist owns a domain and a small number of skills
(`.github/skills/<name>/SKILL.md`). Cross-domain conflicts escalate up
the tiers (specialist → lead → tier 1).

When invoked as a gate (a check before something can advance), agents
open their reply with a verdict token on its own line:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```
Calling skills parse the first line. Never bury the verdict.

## Pillar methodology (Creative Director enforces)

A pillar is a 3–5 max set of non-negotiable creative principles, each:
- **falsifiable** — predicts specific design choices,
- **forces tradeoffs** — sometimes conflicts with other pillars,
- **applies to all departments** — design, art, narrative, audio, UX.

The current pillars live in `docs/design/pillars.md` and anti-pillars
in `docs/design/anti-pillars.md`. When two pillars conflict, escalate to
`creative-director` — never silently bend a pillar.

## Frameworks (Game Designer & Level Designer apply)

- **MDA** — design from target Aesthetics → Dynamics → Mechanics. Our
  dominant aesthetics are Challenge, Discovery, Fantasy, Narrative.
- **Self-Determination Theory** — every system serves Autonomy,
  Competence, or Relatedness.
- **Flow** — sawtooth difficulty; micro-feedback ≤ 0.5 s; no flat
  curves, no vertical spikes.
- **Sink/faucet economy** — every currency (runes, gems, charms) has
  both, balanced over the target session length.
- **Tuning knobs** — each numeric system exposes *feel* (playtest),
  *curve* (math), *gate* (pacing) knobs. All in JSON, never hardcoded.

## Generated visual assets
All in-game art (class portraits, monster cards, item icons, UI
backgrounds, zone art) is produced via the **`image-gen` skill** which
calls the free **Pollinations.AI** endpoint. Style consistency is owned
by the **`art-director` agent**. Hard rules:
- All image generation goes through `art-director`. No agent calls
  `image-gen` without an approved request.
- Every category preset (model, size, seed-base, prompt suffix, negative
  list) lives in `docs/art/style-presets.json` (mirrored in
  `docs/art/style-guide.md`). Don't bypass it.
- Allocate a `subjectId` in `docs/art/seed-registry.md` *before*
  generating, so the same subject regenerates identically forever.
- Outputs land under `public/assets/d2/generated/<category>/` with an
  append-only entry in `public/assets/d2/generated/manifest.json`
  (prompt, seed, model, sha256, timestamp). Never edit historical
  manifest entries.
- Run via: `npm run image-gen -- --category … --id … --subjectId … --subject … --descriptors …`
- Public-release audit of the manifest is a release blocker — same
  policy as other D2-derived assets.

## When in doubt
Run the **`start` skill**. It routes to the right Tier-1 owner
(`creative-director` / `technical-director` / `producer`) based on the
question and the project's current stage.
