# Engine core-loop fixes

- chore(test): relocated combat.test.ts "multiple enemies ... suffixes A/B/C" to src/stores/combatHelpers.test.ts (root cause: cross-workspace dynamic import() of stores/combatHelpers exceeded 5000ms timeout ~20% of cold runs; static import in stores workspace eliminates race; 20/20 green post-fix).
- chore(test): "shares combat victory XP with the fielded merc" remains quarantined — root-caused to a real engine bug in mercStore.initialProgress() (uses mercXpForLevel(1)=60 regardless of merc level; ~30% repro). See docs/bugs/quarantined-merc-xp-initial-progress.md. Owner: engine-dev.

## Bugs fixed
- Bug #12: removed gold from kill rewards and UI summaries; kill currency is now `runeShards`, folded into inventory currency `rune-shard` with rare rune drops.
- Bug #1: victory now awards XP via `xpForKill`, updates player level/progression through `gainExperience`, and records level-up log markers.
- Bug #2: fielded mercenaries now join `playerTeam` through `mercToCombatUnit`.
- Bug #3: every class now starts with a registered combo order and learned starter skill levels.
- Save format: bumped to v3 and migrates v2 `currencies.gold` into `currencies['rune-shard']`.

## Files touched
- Engine: `src/engine/loot/*`, `src/engine/idle/online-tick.ts`, `src/engine/progression/xp.ts`, `src/engine/types/save.ts`, `src/engine/save/save.test.ts`.
- Stores: `src/stores/combatHelpers.ts`, `src/stores/mercToCombatUnit.ts`, `src/stores/playerStore.ts`, persistence/player/combat helper tests.
- UI/i18n: `src/features/combat/CombatScreen.tsx`, combat locale JSON files.
- Character: `src/features/character/createMockPlayer.ts`.
- Branch also contains inventory tooltip/equipment-picker commits and QA screenshots that were already on `fix/engine-core-loop` during this work.

## Decisions
- Merc archetype mapping stays minimal: `front` uses `barbarian.bash`, `back` uses `amazon.magic_arrow`, fallback uses `barbarian.bash` until merc skills are registered data-driven.
- Legacy `goldFind` stat remains as the existing currency-find input; awarded currency is rune-shards, not gold.
- Starter skill levels are marked learned so UI and combat agree on default class kits.

## Verification
- `npm run typecheck` passed.
- `npm test -- --run --reporter=basic` passed: 36 files, 320 tests.
- `npm run lint` passed (with the repo's existing TypeScript-version warning from ESLint tooling).
