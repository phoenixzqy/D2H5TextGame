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
Ask the **PM agent**. Don't guess product decisions.
