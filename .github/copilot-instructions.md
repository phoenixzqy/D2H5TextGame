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

## Git / PR workflow
- Branch per feature: `feat/<area>-<short-desc>`.
- Conventional commit messages.
- PRs require Reviewer agent approval and green CI before merge.

## When in doubt
Ask the **PM agent**. Don't guess product decisions.
